# r/knn_example.R
library(class)
data(iris)

set.seed(123)
train_idx <- sample(1:nrow(iris), 0.8 * nrow(iris))
train <- iris[train_idx, ]
test <- iris[-train_idx, ]

pred <- knn(train[, 1:4], test[, 1:4], train$Species, k = 3)
accuracy <- mean(pred == test$Species)
cat("Test accuracy:", round(accuracy, 3), "\n")