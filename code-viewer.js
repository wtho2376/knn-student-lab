/*
  Static tutorial-style code viewer for GitHub Pages.

  Renders the .R file as a sequence of blocks:
    [Explanation outside code] + [Code block (code-only)]

  Source format (Approach B):
    # @section <Name>
    # <explanation line 1>
    # <explanation line 2>
    <code lines...>

  Notes:
  - Code blocks do NOT include the @section/explanation comment lines.
  - Top headers like @title/@dataset/@goal/@what_you_learn are parsed for meta,
    and are not included in code blocks.
*/

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function parseMeta(lines) {
  const meta = { title: null, dataset: null, goal: [], what_you_learn: [] };

  for (let i = 0; i < Math.min(lines.length, 180); i++) {
    const t = lines[i].trim();
    if (!t.startsWith('#')) break;

    const m = t.match(/^#\s*@([a-zA-Z0-9_]+)\s*(.*)$/);
    if (!m) continue;

    const key = m[1];
    const rest = (m[2] || '').trim();
    if (key === 'title') meta.title = rest;
    if (key === 'dataset') meta.dataset = rest;
    if (key === 'goal') meta.goal.push(rest);

    if (key === 'what_you_learn') {
      const bullets = [];
      for (let j = i + 1; j < lines.length; j++) {
        const tj = lines[j].trim();
        if (!tj.startsWith('#')) break;
        const b = tj.match(/^#\s*-\s*(.*)$/);
        if (b) bullets.push(b[1]);
        else if (tj.startsWith('# @')) break;
      }
      meta.what_you_learn = bullets;
    }
  }

  return meta;
}

function splitIntoBlocks(lines) {
  // Returns blocks: { name, explainLines[], codeLines[] }
  const blocks = [];

  function pushBlock(block) {
    if (!block) return;
    const code = (block.codeLines || []).join('\n').trimEnd();
    if (block.explainLines.length === 0 && code.length === 0) return;
    blocks.push(block);
  }

  let current = null;

  // Skip top header comments (like @title/@dataset/@goal/@what_you_learn)
  let startIdx = 0;
  for (; startIdx < lines.length; startIdx++) {
    const t = lines[startIdx].trim();
    if (t === '' || t.startsWith('#')) continue;
    break;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();

    const sec = t.match(/^#\s*@section\s+(.*)$/);
    if (sec) {
      // finalize previous
      pushBlock(current);

      current = {
        name: (sec[1] || '').trim() || 'Section',
        explainLines: [],
        codeLines: [],
      };

      // collect explanation comment lines immediately after @section
      for (let j = i + 1; j < lines.length; j++) {
        const tj = lines[j].trim();
        if (tj === '') break;
        if (tj.startsWith('# @section')) break;
        if (!tj.startsWith('#')) break;
        current.explainLines.push(lines[j].replace(/^\s*#\s?/, ''));
        i = j; // advance outer loop
      }
      continue;
    }

    // If we haven't seen any @section yet, create an implicit block.
    if (!current) {
      current = { name: 'Code', explainLines: [], codeLines: [] };
    }

    // Exclude any other @meta lines from code blocks
    if (t.startsWith('# @')) continue;

    // Keep regular code lines (including normal inline comments)
    current.codeLines.push(raw);
  }

  pushBlock(current);
  return blocks;
}

function renderMeta(meta) {
  const titleEl = document.querySelector('[data-meta=title]');
  const datasetEl = document.querySelector('[data-meta=dataset]');
  const goalEl = document.querySelector('[data-meta=goal]');
  const learnEl = document.querySelector('[data-meta=learn]');

  titleEl.textContent = meta.title || 'Interactive Code';
  datasetEl.textContent = meta.dataset ? `Dataset: ${meta.dataset}` : '';

  goalEl.innerHTML = meta.goal && meta.goal.length
    ? `<div><strong>Goal</strong></div><div class="footer-note">${escapeHtml(meta.goal.join(' '))}</div>`
    : '';

  learnEl.innerHTML = meta.what_you_learn && meta.what_you_learn.length
    ? `<div><strong>What you learn</strong></div><ul style="margin:8px 0 0 18px; color: var(--muted); font-size: 13px; line-height: 1.6;">${meta.what_you_learn.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`
    : '';
}

function renderBlocks(blocks) {
  const root = document.querySelector('#tutorial');
  root.innerHTML = '';

  for (const b of blocks) {
    const section = document.createElement('section');
    section.className = 'tblock';

    const h = document.createElement('h3');
    h.className = 'tblock-title';
    h.textContent = b.name;

    const explain = document.createElement('div');
    explain.className = 'explain';

    if (b.explainLines && b.explainLines.length) {
      explain.textContent = b.explainLines.join('\n');
    } else {
      explain.textContent = '';
      explain.style.display = 'none';
    }

    const pre = document.createElement('pre');
    pre.className = 'codeblock';

    const code = document.createElement('code');
    code.innerHTML = escapeHtml((b.codeLines || []).join('\n').trimEnd());
    pre.appendChild(code);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copybtn';
    btn.textContent = 'Copy code';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText((b.codeLines || []).join('\n').trimEnd());
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = 'Copy code'), 900);
      } catch {
        btn.textContent = 'Copy failed';
        setTimeout(() => (btn.textContent = 'Copy code'), 900);
      }
    });

    actions.appendChild(btn);

    section.appendChild(h);
    section.appendChild(explain);
    section.appendChild(actions);
    section.appendChild(pre);
    root.appendChild(section);
  }
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
    document.querySelector('[data-meta=title]').textContent = 'Load failed';
    document.querySelector('[data-meta=dataset]').textContent = String(e);
    return;
  }

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const meta = parseMeta(lines);
  renderMeta(meta);

  const blocks = splitIntoBlocks(lines);
  renderBlocks(blocks);
}

document.addEventListener('DOMContentLoaded', main);
