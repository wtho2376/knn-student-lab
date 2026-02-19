#!/usr/bin/env Rscript
# KNN Classification Example with FNN Package
# Dataset: Wine Quality Classification

# Install and load required packages
if (!require("FNN")) install.packages("FNN")
if (!require("lattice")) install.packages("lattice")
library(FNN)
library(lattice)

# Set working directory
setwd("/home/wtho/knn-student-lab/")

# Load dataset
wine_data <- read.csv("data/wine_quality_classification.csv", stringsAsFactors = TRUE)

# Split data into features and target
X <- wine_data[, c("alcohol", "residual_sugar", "citric_acid", "chlorides", "ph")]
y <- wine_data$quality

# Standardize features (important for KNN!)
X_scaled <- scale(X)

# Create scatter plot matrix using splom() from lattice
#pdf("plots/wine_scatter_matrix.pdf", width = 12, height = 10)
splom(X, groups = y, pch = 19, cex = 0.8, main = "Wine Quality Dataset - Scatter Plot Matrix")
#dev.off()
#cat("Scatter plot matrix saved to plots/wine_scatter_matrix.pdf\n")

# Predict a single new case
new_wine <- data.frame(
  alcohol = 13.2,
  residual_sugar = 2.8,
  citric_acid = 0.65,
  chlorides = 0.045,
  ph = 3.0
)

# Standardize the new wine using the same scaler as training data
new_wine_scaled <- scale(new_wine, center = attr(X_scaled, "scaled:center"), scale = attr(X_scaled, "scaled:scale"))

# Make prediction using all data as training set
new_prediction <- knn(train = X_scaled, test = new_wine_scaled, cl = y, k = 3)
cat(sprintf("\nPredicted quality for new wine: %s\n", new_prediction))