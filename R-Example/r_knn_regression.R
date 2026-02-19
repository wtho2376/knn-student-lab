#!/usr/bin/env Rscript
# @title KNN Regression (R)
# @dataset Apartment Rental Price Regression (simulated)
#
# @goal
# Use K-Nearest Neighbors (KNN) to predict a *number* (monthly rent in USD)
# for a new apartment based on its features.
#
# @what_you_learn
# - How KNN regression differs from KNN classification
# - Why feature scaling matters for KNN
# - How knn.reg() predicts by averaging neighbors' target values

# @section Packages
# - FNN: provides knn.reg() for KNN regression
# - lattice: provides splom() for quick visualization
if (!require("FNN")) install.packages("FNN")
if (!require("lattice")) install.packages("lattice")
library(FNN)
library(lattice)

# @section Working directory (optional)
# Adjust or remove this line if your repo lives elsewhere.
setwd("/home/wtho/knn-student-lab/")

# @section Load the dataset
apartment_data <- read.csv("data/apartment_rental_regression.csv")

# @section Split into features (X) and target (y)
# X = apartment features
# y = the numeric value we want to predict (monthly rent)
X <- apartment_data[, c("square_meters", "floor_number", "distance_to_city_center", "num_bedrooms", "building_age_years")]
y <- apartment_data$monthly_rent_usd

# @section Scaling (very important for KNN)
# KNN relies on distance. Features measured on larger numeric scales will dominate distance.
# Example: square_meters (~20-150) could dominate num_bedrooms (1-5) if we don't scale.
X_scaled <- scale(X)

# @section Visualize (optional)
# This scatter plot matrix helps you see relationships between features and the target.
# If you want to save as a PDF, uncomment the pdf(...) and dev.off() lines.
# pdf("plots/apartment_scatter_matrix.pdf", width = 12, height = 10)
splom(cbind(X, y), pch = 19, cex = 0.8, main = "Apartment Rental Dataset - Scatter Plot Matrix")
# dev.off()
# cat("Scatter plot matrix saved to plots/apartment_scatter_matrix.pdf\n")

# @section Create a new apartment to predict rent for
new_apartment <- data.frame(
  square_meters = 85,
  floor_number = 12,
  distance_to_city_center = 3.5,
  num_bedrooms = 3,
  building_age_years = 10
)

# @section Scale the new apartment using training scaling
new_apartment_scaled <- scale(
  new_apartment,
  center = attr(X_scaled, "scaled:center"),
  scale = attr(X_scaled, "scaled:scale")
)

# @section Predict with KNN regression
# knn.reg() returns a list; the predicted values are in $pred.
#
# Intuition: KNN regression finds the K nearest apartments and predicts rent as
# the average of their rents.
new_prediction <- knn.reg(train = X_scaled, test = new_apartment_scaled, y = y, k = 3)$pred
cat(sprintf("\nPredicted monthly rent for new apartment: %.2f USD\n", new_prediction))
