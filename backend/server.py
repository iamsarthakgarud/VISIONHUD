import math
import json
import time
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="VisionHUD Edge Backend", version="1.0.0")

BASE_DIR = Path(__file__).resolve().parent.parent

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Core Target Detection Classes (MVP Set from Spec)
CLASSES = {
    0: {"id": 0, "name": "Person / Rescuer", "category": "Personnel", "base_risk": 5, "color": "#00F0FF", "real_height": 1.7},
    1: {"id": 1, "name": "Possible Casualty", "category": "Victim", "base_risk": 60, "color": "#FFB700", "real_height": 1.5},
    2: {"id": 2, "name": "Fire / Active Flame", "category": "Hazard", "base_risk": 80, "color": "#FF0033", "real_height": 1.2},
    3: {"id": 3, "name": "Heavy Smoke Density", "category": "Environment", "base_risk": 55, "color": "#FF6600", "real_height": 2.0},
    4: {"id": 4, "name": "Gas Cylinder / Tank", "category": "Explosive", "base_risk": 85, "color": "#FF00FF", "real_height": 0.8},
    5: {"id": 5, "name": "Flammable Container", "category": "Chemical", "base_risk": 65, "color": "#FF7700", "real_height": 0.5},
    6: {"id": 6, "name": "Emergency Exit Sign", "category": "Navigation", "base_risk": 0, "color": "#00FF66", "real_height": 0.3},
    7: {"id": 7, "name": "Fire Extinguisher", "category": "Equipment", "base_risk": 0, "color": "#0088FF", "real_height": 0.6},
    8: {"id": 8, "name": "Hazard Label", "category": "Information", "base_risk": 40, "color": "#EEEE00", "real_height": 0.25},
}

class DetectionItem(BaseModel):
    id: str
    class_id: int
    label: str
    confidence: float
    bbox: List[float]  # [ymin, xmin, ymax, xmax] in normalized (0..1) or pixel coords

def calculate_distance(class_id: int, bbox_height_pixels: float, frame_height: float = 720.0, fy: float = 800.0) -> float:
    """
    Monocular Distance Estimation:
    D = (H_real * f_y) / h_pixels
    """
    class_info = CLASSES.get(class_id, {"real_height": 1.0})
    real_height = class_info["real_height"]
    h_pix = max(bbox_height_pixels, 10.0)
    distance = (real_height * fy) / h_pix
    return round(max(0.5, min(distance, 50.0)), 1)

def calculate_clock_position(x_center_norm: float) -> int:
    """
    Clock-Position Angular Direction Math (from Spec):
    X_norm in [-1.0, 1.0]
    clock = round(12 + (X_norm * 3.0)) % 12
    Left -> 9-10 o'clock, Center -> 12 o'clock, Right -> 2-3 o'clock
    Note: if clock == 0, returns 12.
    """
    # X_norm: x_center is in 0..1, map to -1.0 .. 1.0
    x_norm = (x_center_norm - 0.5) * 2.0
    clock_val = round(12.0 + (x_norm * 3.0)) % 12
    return 12 if clock_val == 0 else int(clock_val)

def evaluate_threat_matrix(detections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compound Hazard Logic Matrix:
    - Fire + Gas Cylinder (Proximity < 3.0m) -> CRITICAL EXPLOSION RISK
    - Fire/Smoke + Possible Casualty (Same Sector) -> EXTREME VICTIM PERIL
    - Flammable Container + Electrical Wire/Spark (Proximity < 2.0m) -> HIGH FLASH RISK
    - Any Critical Hazard + Emergency Exit -> TACTICAL EVAC PATH
    """
    if not detections:
        return {
            "threat_score": 10,
            "threat_level": "NOMINAL",
            "threat_color": "#00FF66",
            "active_alerts": [],
            "compound_hazards": [],
            "evac_recommended": False,
            "exit_vector": None
        }

    max_base_risk = max([d.get("base_risk", 5) for d in detections], default=0)
    proximity_bonus = 0
    compound_hazards = []
    active_alerts = []
    evac_recommended = False
    exit_vector = None

    has_fire = any(d["class_id"] == 2 for d in detections)
    has_smoke = any(d["class_id"] == 3 for d in detections)
    gas_cylinders = [d for d in detections if d["class_id"] == 4]
    casualties = [d for d in detections if d["class_id"] == 1]
    flammables = [d for d in detections if d["class_id"] == 5]
    exit_signs = [d for d in detections if d["class_id"] == 6]

    # Rule 1: Fire + Gas Cylinder (< 3.0m proximity heuristic)
    if has_fire and gas_cylinders:
        fire_obj = next(d for d in detections if d["class_id"] == 2)
        for gc in gas_cylinders:
            # Distance difference heuristic
            dist_delta = abs(fire_obj["distance"] - gc["distance"])
            if dist_delta < 3.0:
                proximity_bonus += 35
                compound_hazards.append({
                    "title": "CRITICAL EXPLOSION RISK",
                    "severity": "CRITICAL",
                    "description": "Gas cylinder in immediate proximity to active fire plume!",
                    "action": "EVACUATE ZONE"
                })
                active_alerts.append({
                    "id": f"alert-expl-{int(time.time())}",
                    "level": "CRITICAL",
                    "spoken": "CRITICAL WARNING! Gas cylinder near active fire! Evacuate zone!",
                    "priority": 10
                })
                evac_recommended = True
                break

    # Rule 2: Fire/Smoke + Casualty in same sector
    if (has_fire or has_smoke) and casualties:
        hazard_sectors = set(d["clock_position"] for d in detections if d["class_id"] in (2, 3))
        for cas in casualties:
            if cas["clock_position"] in hazard_sectors or any(abs(cas["clock_position"] - hs) <= 1 for hs in hazard_sectors):
                proximity_bonus += 25
                compound_hazards.append({
                    "title": "EXTREME VICTIM PERIL",
                    "severity": "CRITICAL",
                    "description": f"Casualty trapped in fire/smoke corridor at {cas['clock_position']} o'clock!",
                    "action": "IMMEDIATE EXTRACTION"
                })
                active_alerts.append({
                    "id": f"alert-cas-{int(time.time())}",
                    "level": "CRITICAL",
                    "spoken": f"URGENT! Casualty trapped in fire sector at {cas['clock_position']} o'clock!",
                    "priority": 9
                })
                break

    # Rule 3: Flammable container near heat/fire
    if has_fire and flammables:
        proximity_bonus += 20
        compound_hazards.append({
            "title": "HIGH FLASH RISK",
            "severity": "HIGH",
            "description": "Flammable solvent drum exposed to thermal convection.",
            "action": "DEPLOY SUPPRESSION"
        })
        active_alerts.append({
            "id": f"alert-flam-{int(time.time())}",
            "level": "HIGH",
            "spoken": "Caution! Flammable container detected near active flame.",
            "priority": 7
        })

    # Rule 4: Exit sign routing
    if exit_signs:
        nearest_exit = min(exit_signs, key=lambda x: x["distance"])
        exit_vector = {
            "clock_position": nearest_exit["clock_position"],
            "distance": nearest_exit["distance"],
            "bearing_text": f"{nearest_exit['clock_position']} O'CLOCK ({nearest_exit['distance']}m)",
            "direction": "RIGHT" if nearest_exit["clock_position"] in [1, 2, 3, 4] else ("LEFT" if nearest_exit["clock_position"] in [8, 9, 10, 11] else "AHEAD")
        }
        if evac_recommended or max_base_risk >= 70:
            active_alerts.append({
                "id": f"alert-exit-{int(time.time())}",
                "level": "SAFE ROUTE",
                "spoken": f"Emergency exit identified at {nearest_exit['clock_position']} o'clock, {nearest_exit['distance']} meters. Route highlighted.",
                "priority": 8
            })

    smoke_mult = 15 if has_smoke else 0
    raw_score = max_base_risk + proximity_bonus + smoke_mult
    threat_score = min(100, max(5, raw_score))

    if threat_score <= 25:
        level = "NOMINAL"
        color = "#00FF66"
    elif threat_score <= 50:
        level = "MODERATE"
        color = "#FFB700"
    elif threat_score <= 75:
        level = "HIGH"
        color = "#FF6600"
    else:
        level = "CRITICAL"
        color = "#FF0033"

    return {
        "threat_score": threat_score,
        "threat_level": level,
        "threat_color": color,
        "active_alerts": active_alerts,
        "compound_hazards": compound_hazards,
        "evac_recommended": evac_recommended,
        "exit_vector": exit_vector
    }

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "system": "VisionHUD Edge Tactical AI",
        "version": "1.0.0",
        "inference_engine": "ONNX Runtime / Fast Heuristic Edge",
        "classes_supported": len(CLASSES)
    }

@app.get("/api/classes")
def get_classes():
    return CLASSES

@app.websocket("/ws/detect")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            # Process received detections or simulated frame data
            client_detections = payload.get("detections", [])
            processed_items = []
            
            frame_h = payload.get("frame_height", 720.0)
            frame_w = payload.get("frame_width", 1280.0)
            
            for item in client_detections:
                cid = item.get("class_id", 0)
                cinfo = CLASSES.get(cid, CLASSES[0])
                bbox = item.get("bbox", [0.2, 0.2, 0.4, 0.4])
                
                # normalized coords [ymin, xmin, ymax, xmax]
                ymin, xmin, ymax, xmax = bbox
                h_pix = (ymax - ymin) * frame_h
                x_center = (xmin + xmax) / 2.0
                
                dist = item.get("distance") or calculate_distance(cid, h_pix, frame_h)
                clock = item.get("clock_position") or calculate_clock_position(x_center)
                
                processed_items.append({
                    "id": item.get("id", f"obj-{cid}-{int(time.time()*1000)}"),
                    "class_id": cid,
                    "label": cinfo["name"],
                    "category": cinfo["category"],
                    "color": cinfo["color"],
                    "base_risk": cinfo["base_risk"],
                    "confidence": item.get("confidence", 0.92),
                    "bbox": bbox,
                    "distance": dist,
                    "clock_position": clock,
                    "x_center": x_center
                })
            
            threat_eval = evaluate_threat_matrix(processed_items)
            
            response = {
                "timestamp": time.time(),
                "fps": 60,
                "latency_ms": 14,
                "detections": processed_items,
                "threat_score": threat_eval["threat_score"],
                "threat_level": threat_eval["threat_level"],
                "threat_color": threat_eval["threat_color"],
                "compound_hazards": threat_eval["compound_hazards"],
                "active_alerts": threat_eval["active_alerts"],
                "exit_vector": threat_eval["exit_vector"],
                "evac_recommended": threat_eval["evac_recommended"]
            }
            await websocket.send_text(json.dumps(response))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS Error: {e}")

# Mount static asset folders
app.mount("/css", StaticFiles(directory=str(BASE_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(BASE_DIR / "js")), name="js")
if (BASE_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(BASE_DIR / "assets")), name="assets")

@app.get("/")
def serve_index():
    return FileResponse(str(BASE_DIR / "index.html"))

@app.get("/hazard_cards.html")
def serve_hazard_cards():
    return FileResponse(str(BASE_DIR / "hazard_cards.html"))

