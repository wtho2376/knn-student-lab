#!/usr/bin/env Rscript
# KNN Regression Example with FNN Package
# Dataset: Apartment Rental Price Regression

# Install and load required packages
if (!require("FNN")) install.packages("FNN")
if (!require("lattice")) install.packages("lattice")
library(FNN)
library(lattice)

# Set working directory
setwd("/home/wtho/knn-student-lab/")

# Load dataset
apartment_data <- read.csv("data/apartment_rental_regression.csv")

# Split data into features and target
X <- apartment_data[, c("square_meters", "floor_number", "distance_to_city_center", "num_bedrooms", "building_age_years")]
y <- apartment_data$monthly_rent_usd

# Standardize features (important for KNN!)
X_scaled <- scale(X)

# Create scatter plot matrix using splom() from lattice
#pdf("plots/apartment_scatter_matrix.pdf", width = 12, height = 10)
splom(cbind(X, y), pch = 19, cex = 0.8, main = "Apartment Rental Dataset - Scatter Plot Matrix")
#dev.off()
#cat("Scatter plot matrix saved to plots/apartment_scatter_matrix.pdf\n")

# Predict a single new case
new_apartment <- data.frame(
  square_meters = 85,
  floor_number = 12,
  distance_to_city_center = 3.5,
  num_bedrooms = 3,
  building_age_years = 10
)

# Standardize the new apartment using the same scaler as training data
new_apartment_scaled <- scale(new_apartment, center = attr(X_scaled, "scaled:center"), scale = attr(X_scaled, "scaled:scale"))

# Make prediction using all data as training set
new_prediction <- knn.reg(train = X_scaled, test = new_apartment_scaled, y = y, k = 3)$pred
cat(sprintf("\nPredicted monthly rent for new apartment: %.2f USD\n", new_prediction))