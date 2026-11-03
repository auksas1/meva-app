"""Measure the correctness and robustness of the YOLOv8s model.

The script has two commands, `correctness` and `robustness`. Each
command writes the full result to runs/<command>.json and prints a
summary.

Examples:
    python eval.py correctness --conf 0.25 0.35 0.5
    python eval.py robustness --distort noise:10 bright:-60 jpeg:20
"""

import argparse
import json
import shutil
from pathlib import Path

import albumentations as A
import cv2
from ultralytics import YOLO

HERE = Path(__file__).resolve().parent
WEIGHTS = HERE.parents[1] / "backend" / "ai" / "best_vehicle_damage_yolov8s_30e.pt"
CLEAN = HERE / "own"
RUNS = HERE / "runs"
# NOTE: The same value as _CONFIDENCE_THRESHOLD in ai_service.py.
PROD_CONF = 0.35
MATCH_IOU = 0.5
SEED = 0
DISTORTIONS = ["noise:10", "noise:30", "bright:-30", "bright:-60", "jpeg:80", "jpeg:20"]


def data_yaml(root: Path, names: dict[int, str]) -> Path:
    """Write a YOLO dataset file with the root as the val split."""
    path = root / "data.yaml"
    lines = [f"path: {root}", "train: images", "val: images", "names:"]
    lines += [f"  {i}: {n}" for i, n in names.items()]
    path.write_text("\n".join(lines) + "\n")
    return path


def validate(model: YOLO, root: Path, conf: float, name: str) -> dict:
    """Run yolo val on the root folder.

    Return P, R, mAP50 and mAP50-95 for all classes, and P, R and
    mAP50 for each class. The plots go to runs/val/<name>.
    """
    m = model.val(data=str(data_yaml(root, model.names)), conf=conf, iou=0.6,
                  batch=4, device="cpu", plots=True, project=str(RUNS / "val"),
                  name=name, exist_ok=True, verbose=False)
    box = m.box
    per_class = {
        model.names[c]: {"P": round(float(box.p[i]), 3), "R": round(float(box.r[i]), 3),
                         "mAP50": round(float(box.ap50[i]), 3)}
        for i, c in enumerate(box.ap_class_index)
    }
    return {"P": round(box.mp, 3), "R": round(box.mr, 3), "mAP50": round(box.map50, 3),
            "mAP50-95": round(box.map, 3), "per_class": per_class}


def transform(spec: str) -> A.BasicTransform:
    """Return the Albumentations transform for a spec.

    A spec is noise:SIGMA (0-255), bright:PERCENT (-100..100) or
    jpeg:QUALITY (1-100). Raise SystemExit for an unknown spec.
    """
    kind, value = spec.split(":")
    v = float(value)
    if kind == "noise":
        return A.GaussNoise(std_range=(v / 255, v / 255), mean_range=(0, 0), p=1)
    if kind == "bright":
        return A.RandomBrightnessContrast(brightness_limit=(v / 100, v / 100),
                                          contrast_limit=(0, 0), p=1)
    if kind == "jpeg":
        return A.ImageCompression(quality_range=(int(v), int(v)), p=1)
    raise SystemExit(f"Unknown distortion: {spec}")


def distort(spec: str) -> Path:
    """Write a distorted copy of the clean set to runs/data/<spec>.

    The labels stay the same. Return the root folder of the copy.
    """
    root = RUNS / "data" / spec.replace(":", "_")
    shutil.rmtree(root, ignore_errors=True)
    (root / "images").mkdir(parents=True)
    shutil.copytree(CLEAN / "labels", root / "labels")
    pipeline = A.Compose([transform(spec)], seed=SEED)
    for image in sorted((CLEAN / "images").glob("*.jpeg")):
        out = pipeline(image=cv2.imread(str(image)))["image"]
        cv2.imwrite(str(root / "images" / image.name), out)
    return root


def iou(a: list[float], b: list[float]) -> float:
    """Return the intersection over union of two xyxy boxes."""
    w = max(0.0, min(a[2], b[2]) - max(a[0], b[0]))
    h = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = w * h
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union else 0.0


def detections(model: YOLO, root: Path, conf: float) -> dict[str, list]:
    """Return the (class, xyxy box) list for each image in the root."""
    out = {}
    for r in model.predict(str(root / "images"), conf=conf, device="cpu", verbose=False):
        out[Path(r.path).name] = list(zip(r.boxes.cls.int().tolist(), r.boxes.xyxy.tolist()))
    return out


def stability(base: dict[str, list], other: dict[str, list]) -> float:
    """Return the percent of base detections that other also has.

    A base detection stays when other has a detection of the same class
    on the same image with an IoU of MATCH_IOU or more.
    """
    total = kept = 0
    for name, dets in base.items():
        for cls, box in dets:
            total += 1
            kept += any(c == cls and iou(box, b) >= MATCH_IOU for c, b in other.get(name, []))
    return round(100 * kept / total, 1) if total else 0.0


def drop(clean: float, value: float) -> float:
    """Return the drop of value from clean in percent."""
    return round(100 * (clean - value) / clean, 1) if clean else 0.0


def save(name: str, result: dict) -> None:
    """Write the result to runs/<name>.json and print a summary."""
    RUNS.mkdir(exist_ok=True)
    (RUNS / f"{name}.json").write_text(json.dumps(result, indent=2))
    print(f"\n=== {name.upper()} (full result: runs/{name}.json) ===")
    for key, m in result.items():
        print(f"{key:<11} " + "  ".join(f"{k}={v}" for k, v in m.items() if k != "per_class"))
        if "per_class" in m:
            classes = ", ".join(f"{c}={x['R']}" for c, x in m["per_class"].items())
            print(" " * 12 + f"R per class: {classes}")


def correctness(model: YOLO, confs: list[float]) -> None:
    """Measure P, R, mAP50 and mAP50-95 at each threshold."""
    save("correctness", {str(c): validate(model, CLEAN, c, f"clean_conf{c}") for c in confs})


def robustness(model: YOLO, specs: list[str], conf: float) -> None:
    """Measure the mAP50 and R drop and stability of each distortion."""
    clean = validate(model, CLEAN, conf, f"clean_conf{conf}")
    base = detections(model, CLEAN, conf)
    result = {"clean": {k: clean[k] for k in ("R", "mAP50")}}
    for spec in specs:
        root = distort(spec)
        name = spec.replace(":", "_")
        m = validate(model, root, conf, f"{name}_conf{conf}")
        model.predict(str(root / "images"), conf=conf, device="cpu", save=True,
                      project=str(RUNS / "pred"), name=name, exist_ok=True, verbose=False)
        result[spec] = {"R": m["R"], "mAP50": m["mAP50"],
                        "R_drop_%": drop(clean["R"], m["R"]),
                        "mAP50_drop_%": drop(clean["mAP50"], m["mAP50"]),
                        "stability_%": stability(base, detections(model, root, conf))}
    save("robustness", result)


def main() -> None:
    """Parse the arguments and run one command."""
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawTextHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("correctness", help="P, R, mAP50 and mAP50-95 at each threshold")
    c.add_argument("--conf", type=float, nargs="+", default=[0.25, PROD_CONF, 0.5],
                   help="confidence thresholds to test (default: %(default)s)")
    r = sub.add_parser("robustness", help="mAP50 and R drop and stability under distortion")
    r.add_argument("--distort", nargs="+", default=DISTORTIONS,
                   help="noise:SIGMA (0-255), bright:PERCENT (-100..100), jpeg:QUALITY (1-100)")
    r.add_argument("--conf", type=float, default=PROD_CONF,
                   help="confidence threshold (default: %(default)s, same as the backend)")
    args = p.parse_args()

    if not WEIGHTS.exists():
        raise SystemExit(f"Model weights not found: {WEIGHTS}. See README.md.")
    model = YOLO(str(WEIGHTS))
    if args.cmd == "correctness":
        correctness(model, args.conf)
    else:
        robustness(model, args.distort, args.conf)


if __name__ == "__main__":
    main()
