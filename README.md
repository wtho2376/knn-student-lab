# KNN for Beginners

A minimal, hands-on introduction to the **K-Nearest Neighbors (KNN)** algorithm for high school to first-year college students.

## 🚀 Open the Interactive Webpage
Since the repo is private, you can’t use GitHub Pages — but you can open it locally in 1 click:

### Option 1: Local Browser (Simplest)
1. Go to the repo → **Code** → **Download ZIP**
2. Unzip the file
3. **Double-click** the `index.html` file — it will open in your default browser!

### Option 2: Local Web Server (For Future Features)
If you want to add dynamic content later, run a local server:
```bash
cd knn-student-lab
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

## What's here?
- `index.html`: Interactive webpage with tabbed Python & R examples
- `python/knn_example.py`: Standalone Python script (uses `scikit-learn`)
- `r/knn_example.R`: Standalone R script (uses `class` library)

All examples use the classic Iris dataset and `k=3` — simple enough for beginners, but functional enough to learn from.

## How to run locally
### Python
```bash
pip install scikit-learn numpy
python python/knn_example.py
```

### R
```r
install.packages("class")
Rscript r/knn_example.R
```

## Next Steps
We’ll expand this repo with:
- Data visualizations (Python `matplotlib` / R `ggplot2`)
- Practice exercises and challenges
- Jupyter Notebooks/R Markdown tutorials
- Step-by-step explanations of KNN concepts

> 💡 This repo is currently private. Let me know what you want to add next!