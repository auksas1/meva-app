# Model quality measurement

`eval.py` measures two ISO/IEC 25059:2024 sub-characteristics of the YOLOv8s model:

- **Functional correctness**: P, R, mAP50 and mAP50-95 at each confidence threshold.
- **Robustness**: the mAP50 and R drop, and the detection stability, under noise, low brightness and JPEG compression.

The test set is `own/`: 11 images with 21 reviewed damage labels in YOLO format.

## Setup

1. Put `best_vehicle_damage_yolov8s_30e.pt` at `backend/ai/` (see the root `README.md`).
2. Install the packages:

```bash
cd ai/eval
python3 -m venv .venv
.venv/bin/pip install --index-url https://download.pytorch.org/whl/cpu torch torchvision
.venv/bin/pip install -r requirements.txt
```

## Run

```bash
.venv/bin/python eval.py correctness --conf 0.25 0.35 0.5
.venv/bin/python eval.py robustness --distort noise:10 noise:30 bright:-30 bright:-60 jpeg:80 jpeg:20
YOLO_VERBOSE=False .venv/bin/python eval.py robustness   # Summary only
```

The results go to `runs/`: `*.json`, the plots in `runs/val/` and the distorted images with detections in `runs/pred/`.
