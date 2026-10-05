"""Unchanged MEVA API with the YOLO model replaced by a configurable stub.

Everything after the model call (scoring, labels, cost table, DB, auth) is the
real backend code. The stub reads `$AI_STUB_FILE` on every inference:
  {"zones": [{"label": "Scratch", "conf": 0.9, "box": [x1, y1, x2, y2]}],  # box normalised 0-1
   "delay": 0.0,      # seconds before answering
   "error": false}    # true -> model failure -> HTTP 503
Usage: python ai_stub_server.py <port>   (DATABASE_URL and AI_STUB_FILE from env)
"""
import json
import os
import sys
import time
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

import uvicorn  # noqa: E402

from app.services import ai_service  # noqa: E402

_CLASS_IDS = {name: cls for cls, name in ai_service._CLASS_NAMES.items()}


class _Tensor(list):
    def tolist(self):
        return list(self)


def _stub_model(image, conf, verbose=False):
    path = Path(os.environ["AI_STUB_FILE"])
    stub = json.loads(path.read_text()) if path.exists() else {}
    time.sleep(stub.get("delay", 0))
    if stub.get("error"):
        raise RuntimeError("AI stub: simulated model failure")
    w, h = image.size
    boxes = [
        SimpleNamespace(
            cls=[_CLASS_IDS[z["label"]]],
            conf=[z["conf"]],
            xyxy=[_Tensor([z["box"][0] * w, z["box"][1] * h, z["box"][2] * w, z["box"][3] * h])],
        )
        for z in stub.get("zones", [])
        if z["conf"] >= conf  # same confidence cut-off YOLO applies
    ]
    return [SimpleNamespace(boxes=boxes)]


ai_service._model = _stub_model

if __name__ == "__main__":
    from app.main import app

    uvicorn.run(app, host="127.0.0.1", port=int(sys.argv[1]), log_level="warning")
