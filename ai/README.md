# AI Module

This folder contains the artificial intelligence part of the project.

## Purpose
The AI module is used to detect vehicle damage in uploaded car images and return:
- damage type
- confidence score
- bounding box coordinates

## Model used
- YOLOv8n (initial experiment)
- YOLOv8s (improved model)

## Dataset
- Vehicle-Damage-Detection-1

## Main result
The YOLOv8s model trained for 30 epochs was selected as the best MVP prototype model.

## Folder structure
- `results/` – training plots and prediction examples
- `notebooks/` – Colab notebooks used for model training
- `docs/` – model analysis and summary
- `configs/` – configuration notes and dataset-related information
