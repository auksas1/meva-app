# YOLOv8 Model Summary

## Task
The model is used for vehicle damage detection in uploaded car images.

## Dataset
- Vehicle-Damage-Detection-1

## Models tested
### 1. YOLOv8n
- Epochs: 10
- Precision: 0.408
- Recall: 0.337
- mAP50: 0.299
- mAP50-95: 0.205

### 2. YOLOv8s
- Epochs: 30
- Precision: 0.449
- Recall: 0.414
- mAP50: 0.382
- mAP50-95: 0.265

## Best model
The YOLOv8s model trained for 30 epochs was selected as the best MVP prototype model.

## Best performing classes
- Tire Damage
- Crack

## Weakest classes
- Scratch
- Paint Damage
- Dent

## Conclusion
The improved YOLOv8s model achieved better results than the initial YOLOv8n version and is suitable for MVP demonstration and backend integration. However, some classes still require additional improvement for more reliable real-world use.
