#!/usr/bin/env Rscript
# @title KNN Classification (R)
# @dataset Wine Quality Classification (simulated)
#
# @goal
# Use K-Nearest Neighbors (KNN) to predict a *category* (wine quality: Low/Medium/High)
# for a new wine based on its chemical measurements.
#
# @what_you_learn
# - How to load a CSV dataset
# - How to separate features (X) and label (y)
# - Why we must scale features for KNN
# - How knn() makes a prediction for one new example

# @section Packages
# We use:
# - FNN: provides knn() (fast KNN implementation)
# - lattice: provides splom() for an easy scatter-plot matrix
#
# If you already installed these packages before, install.packages(...) will do nothing.
if (!require("FNN")) install.packages("FNN")
if (!require("lattice")) install.packages("lattice")
library(FNN)
library(lattice)

# @section Working directory (optional)
# This line tells R where to look for files like "data/wine_quality_classification.csv".
# If you are not on this computer/path, either:
# - delete this setwd(...) line, and run the script from the repo folder, OR
# - change the path to your own folder.
setwd("/home/wtho/knn-student-lab/")

# @section Load the dataset
# The dataset is a CSV file. "stringsAsFactors=TRUE" means the target label column
# (quality) will be treated as a factor (a categorical variable), which is what we want.
wine_data <- read.csv("data/wine_quality_classification.csv", stringsAsFactors = TRUE)

# @section Split into features (X) and label (y)
# X = columns we use to measure similarity (distance).
# y = the answer we want to predict (the class/label).
X <- wine_data[, c("alcohol", "residual_sugar", "citric_acid", "chlorides", "ph")]
y <- wine_data$quality

# @section Scaling (very important for KNN)
# KNN uses distances between points. If one feature has a bigger numeric scale than others,
# it can dominate the distance calculation.
# Example: if one column ranges 0-1000 and another ranges 0-1, the 0-1000 feature
# will overpower the 0-1 feature.
#
# scale(X) converts each column to roughly mean=0 and sd=1 (standardization).
X_scaled <- scale(X)

# @section Visualize (optional)
# A scatter plot matrix helps you *see* patterns and how classes may separate.
# Note: we plot the original X (not scaled) because it is easier to interpret.
#
# If you want to save as a PDF, uncomment the pdf(...) and dev.off() lines.
# pdf("plots/wine_scatter_matrix.pdf", width = 12, height = 10)
splom(X, groups = y, pch = 19, cex = 0.8, main = "Wine Quality Dataset - Scatter Plot Matrix")
# dev.off()
# cat("Scatter plot matrix saved to plots/wine_scatter_matrix.pdf\n")

# @section Create a new wine to classify
# This is one "unknown" example. We want the algorithm to tell us which class it belongs to.
new_wine <- data.frame(
  alcohol = 13.2,
  residual_sugar = 2.8,
  citric_acid = 0.65,
  chlorides = 0.045,
  ph = 3.0
)

# @section Scale the new wine using the SAME scaling as training data
# Important: we must scale the new data using the *training* mean/sd.
# We reuse center/scale from X_scaled so the new point is on the same scale.
new_wine_scaled <- scale(
  new_wine,
  center = attr(X_scaled, "scaled:center"),
  scale = attr(X_scaled, "scaled:scale")
)

# @section Predict with KNN
# knn(train, test, cl, k):
# - train: training features (scaled)
# - test: new example(s) to predict (scaled)
# - cl: class labels for training rows
# - k: number of neighbors to vote
#
# This script uses ALL rows as training data for simplicity.
# In a real ML workflow, you would split into train/test to measure accuracy.
new_prediction <- knn(train = X_scaled, test = new_wine_scaled, cl = y, k = 3)
cat(sprintf("\nPredicted quality for new wine: %s\n", new_prediction))
