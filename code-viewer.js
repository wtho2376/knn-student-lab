/*
  Minimal static code viewer for GitHub Pages.
  Features:
  - Loads a text file via fetch() (works on GitHub Pages)
  - Renders line-by-line with line numbers
  - Parses structured comment blocks:
      # @section <Name>
      # <freeform explanation lines...>
    and also optional top headers:
      # @title, # @dataset, # @goal, # @what_you_learn
  - Hover a line to see the nearest preceding @section explanation
  - Click a line to pin/unpin the current section
*/

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function parseRWithSections(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  const meta = { title: null, dataset: null, goal: [], what_you_learn: [] };
  const sections = []; // {name, startLine, endLine, explainLines[]}

  // Parse meta headers at top (first ~80 lines), until first non-comment code line.
  let i = 0;
  let seenNonHeaderCode = false;
  for (; i < Math.min(lines.length, 120); i++) {
    const l = lines[i];
    const trimmed = l.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      const m = trimmed.match(/^#\s*@([a-zA-Z0-9_]+)\s*(.*)$/);
      if (m) {
        const key = m[1];
        const rest = (m[2] || '').trim();
        if (key === 'title') meta.title = rest;
        if (key === 'dataset') meta.dataset = rest;
        if (key === 'goal') meta.goal.push(rest);
        if (key === 'what_you_learn') {
          // Next lines may contain bullet items like "# - ..."
          // We handle bullets later; keep this marker as a state.
        }
      }
      continue;
    }

    // Stop meta scan when first code line appears.
    seenNonHeaderCode = true;
    break;
  }

  // Parse sections anywhere.
  for (let idx = 0; idx < lines.length; idx++) {
    const l = lines[idx];
    const trimmed = l.trim();
    const m = trimmed.match(/^#\s*@section\s+(.*)$/);
    if (!m) continue;

    const name = (m[1] || '').trim() || 'Section';
    const explainLines = [];

    // Collect subsequent comment lines until blank or non-comment or another @section
    for (let j = idx + 1; j < lines.length; j++) {
      const t = lines[j].trim();
      if (t.startsWith('# @section')) break;
      if (t === '') break;
      if (!t.startsWith('#')) break;

      // Strip leading # and one space if present
      explainLines.push(lines[j].replace(/^\s*#\s?/, ''));
    }

    sections.push({
      name,
      startLine: idx + 1,
      endLine: null, // fill later
      explainLines,
    });
  }

  // Compute endLine for each section: until next section start - 1, else EOF
  for (let s = 0; s < sections.length; s++) {
    const cur = sections[s];
    const next = sections[s + 1];
    cur.endLine = (next ? next.startLine - 1 : lines.length);
  }

  // Parse what_you_learn bullets (simple): find marker line and read consecutive '# - ...'
  const wyl = [];
  for (let idx = 0; idx < Math.min(lines.length, 160); idx++) {
    const t = lines[idx].trim();
    if (t.startsWith('# @what_you_learn')) {
      for (let j = idx + 1; j < lines.length; j++) {
        const tj = lines[j].trim();
        if (!tj.startsWith('#')) break;
        const bullet = tj.match(/^#\s*-\s*(.*)$/);
        if (bullet) wyl.push(bullet[1]);
        else if (tj === '#') continue;
        else if (tj.startsWith('# @')) break;
      }
      break;
    }
  }
  meta.what_you_learn = wyl;

  return { lines, meta, sections };
}

function sectionForLine(sections, lineNo) {
  // nearest preceding section start
  let best = null;
  for (const s of sections) {
    if (s.startLine <= lineNo) best = s;
    else break;
  }
  return best;
}

function renderMeta(meta) {
  const titleEl = document.querySelector('[data-meta=title]');
  const datasetEl = document.querySelector('[data-meta=dataset]');
  const goalEl = document.querySelector('[data-meta=goal]');
  const learnEl = document.querySelector('[data-meta=learn]');

  titleEl.textContent = meta.title || 'Code Viewer';
  datasetEl.textContent = meta.dataset ? `Dataset: ${meta.dataset}` : '';

  goalEl.innerHTML = meta.goal && meta.goal.length
    ? `<div><strong>Goal</strong></div><div class="footer-note">${escapeHtml(meta.goal.join(' '))}</div>`
    : '';

  learnEl.innerHTML = meta.what_you_learn && meta.what_you_learn.length
    ? `<div><strong>What you learn</strong></div><ul style="margin:8px 0 0 18px; color: var(--muted); font-size: 13px; line-height: 1.6;">${meta.what_you_learn.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`
    : '';
}

function renderSectionCard(section) {
  const nameEl = document.querySelector('[data-section=name]');
  const bodyEl = document.querySelector('[data-section=body]');
  const rangeEl = document.querySelector('[data-section=range]');

  if (!section) {
    nameEl.textContent = 'Hover the code';
    bodyEl.textContent = 'Move your mouse over the code on the left to see explanations.';
    rangeEl.textContent = '';
    return;
  }

  nameEl.textContent = section.name;
  rangeEl.textContent = `Lines ${section.startLine}–${section.endLine}`;

  const text = (section.explainLines && section.explainLines.length)
    ? section.explainLines.join('\n')
    : 'No explanation block found for this section.';

  bodyEl.textContent = text;
}

async function main() {
  const params = new URLSearchParams(location.search);
  const file = params.get('file');

  const badge = document.querySelector('[data-badge]');
  const filenameEl = document.querySelector('[data-filename]');

  if (!file) {
    badge.classList.add('warn');
    badge.textContent = 'missing ?file=';
    filenameEl.textContent = 'No file selected';
    return;
  }

  filenameEl.textContent = file;

  let text;
  try {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
    badge.classList.add('ok');
    badge.textContent = 'loaded';
  } catch (e) {
    badge.classList.add('warn');
    badge.textContent = 'load failed';
    renderSectionCard(null);
    document.querySelector('[data-meta=title]').textContent = 'Load failed';
    document.querySelector('[data-meta=dataset]').textContent = String(e);
    return;
  }

  const { lines, meta, sections } = parseRWithSections(text);
  renderMeta(meta);

  const ol = document.querySelector('#codeLines');
  ol.innerHTML = '';

  const frag = document.createDocumentFragment();
  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const li = document.createElement('li');
    li.dataset.line = String(lineNo);

    const ln = document.createElement('div');
    ln.className = 'ln';
    ln.textContent = String(lineNo);

    const txt = document.createElement('div');
    txt.className = 'txt';
    txt.innerHTML = escapeHtml(lines[i]);

    li.appendChild(ln);
    li.appendChild(txt);
    frag.appendChild(li);
  }
  ol.appendChild(frag);

  let pinned = false;
  let pinnedSection = null;
  let activeLine = null;

  function setActiveLine(lineEl) {
    if (activeLine) activeLine.classList.remove('active');
    activeLine = lineEl;
    if (activeLine) activeLine.classList.add('active');
  }

  function updateFromLine(lineNo) {
    const s = sectionForLine(sections, lineNo);
    renderSectionCard(s);
  }

  renderSectionCard(sections.length ? sections[0] : null);

  ol.addEventListener('mousemove', (ev) => {
    const li = ev.target.closest('li[data-line]');
    if (!li) return;
    setActiveLine(li);
    if (pinned) return;
    const lineNo = Number(li.dataset.line);
    updateFromLine(lineNo);
  });

  ol.addEventListener('click', (ev) => {
    const li = ev.target.closest('li[data-line]');
    if (!li) return;
    const lineNo = Number(li.dataset.line);
    const s = sectionForLine(sections, lineNo);

    if (!pinned) {
      pinned = true;
      pinnedSection = s;
      renderSectionCard(s);
      document.querySelector('[data-pin]').textContent = 'Pinned';
      return;
    }

    // If pinned and click inside same section: unpin. Else pin to new section.
    if (pinnedSection && s && pinnedSection.startLine === s.startLine) {
      pinned = false;
      pinnedSection = null;
      document.querySelector('[data-pin]').textContent = 'Hover';
      updateFromLine(lineNo);
    } else {
      pinnedSection = s;
      renderSectionCard(s);
      document.querySelector('[data-pin]').textContent = 'Pinned';
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      pinned = false;
      pinnedSection = null;
      document.querySelector('[data-pin]').textContent = 'Hover';
      if (activeLine) updateFromLine(Number(activeLine.dataset.line));
      else renderSectionCard(sections[0] || null);
    }
  });
}

document.addEventListener('DOMContentLoaded', main);
