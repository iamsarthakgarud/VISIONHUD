/**
 * VisionHUD - Threat Matrix & Spatial Math Engine
 * Implements Section 3 & 4 of Master Blueprint v1.0
 */

const VISIONHUD_CLASSES = {
  0: { id: 0, name: "Person / Rescuer", category: "Personnel", baseRisk: 5, color: "#00F0FF", realHeight: 1.7, icon: "person" },
  1: { id: 1, name: "Possible Casualty", category: "Victim", baseRisk: 65, color: "#FFB700", realHeight: 1.5, icon: "airline_seat_flat" },
  2: { id: 2, name: "Fire / Active Flame", category: "Hazard", baseRisk: 80, color: "#FF0033", realHeight: 1.2, icon: "local_fire_department" },
  3: { id: 3, name: "Heavy Smoke Density", category: "Environment", baseRisk: 55, color: "#FF6600", realHeight: 2.0, icon: "air" },
  4: { id: 4, name: "Gas Cylinder / Tank", category: "Explosive", baseRisk: 85, color: "#FF00FF", realHeight: 0.8, icon: "propane_tank" },
  5: { id: 5, name: "Flammable Container", category: "Chemical", baseRisk: 65, color: "#FF7700", realHeight: 0.5, icon: "warning" },
  6: { id: 6, name: "Emergency Exit Sign", category: "Navigation", baseRisk: 0, color: "#00FF66", realHeight: 0.3, icon: "exit_to_app" },
  7: { id: 7, name: "Fire Extinguisher", category: "Equipment", baseRisk: 0, color: "#0088FF", realHeight: 0.6, icon: "fire_extinguisher" },
  8: { id: 8, name: "Hazard Label (OCR)", category: "Information", baseRisk: 40, color: "#EEEE00", realHeight: 0.25, icon: "qr_code_scanner" }
};

class ThreatEngine {
  constructor() {
    this.fy = 750.0; // Camera vertical focal length estimate
    this.historyScores = [];
  }

  /**
   * Section 3.2: Monocular Distance Estimation Formula
   * D = (H_real * f_y) / h_pixels
   */
  calculateDistance(classId, hPixels, frameHeight = 720) {
    const classInfo = VISIONHUD_CLASSES[classId] || { realHeight: 1.0 };
    const hClamped = Math.max(hPixels, 12);
    const distance = (classInfo.realHeight * this.fy) / hClamped;
    return parseFloat(Math.min(Math.max(distance, 0.4), 45.0).toFixed(1));
  }

  /**
   * Section 3.3: Clock-Position Angular Direction Math
   * X_norm = (x_center - (W / 2)) / (W / 2) in [-1.0, 1.0]
   * theta_clock = round(12 + (X_norm * 3.0)) % 12
   */
  calculateClockPosition(xCenter, frameWidth = 1280) {
    const halfW = frameWidth / 2.0;
    const xNorm = (xCenter - halfW) / halfW;
    const clampedXNorm = Math.max(-1.0, Math.min(1.0, xNorm));
    let clock = Math.round(12 + (clampedXNorm * 3.0)) % 12;
    if (clock === 0) clock = 12;
    return clock;
  }

  /**
   * Section 4: Multi-Hazard Threat Matrix & Spatial Risk Engine
   */
  evaluate(detections, frameWidth = 1280, frameHeight = 720) {
    if (!detections || detections.length === 0) {
      return {
        threatScore: 8,
        threatLevel: "NOMINAL",
        threatColor: "#00FF66",
        compoundHazards: [],
        activeAlerts: [],
        evacRecommended: false,
        exitVector: null,
        detectedItems: []
      };
    }

    const items = detections.map(d => {
      const cid = d.classId !== undefined ? d.classId : 0;
      const meta = VISIONHUD_CLASSES[cid] || VISIONHUD_CLASSES[0];
      
      let dist = d.distance;
      if (dist === undefined) {
        const hPix = d.hPixels || (d.bbox ? (d.bbox[2] - d.bbox[0]) * frameHeight : 100);
        dist = this.calculateDistance(cid, hPix, frameHeight);
      }

      let clock = d.clockPosition;
      if (clock === undefined) {
        const xCenter = d.xCenter || (d.bbox ? ((d.bbox[1] + d.bbox[3]) / 2) * frameWidth : frameWidth / 2);
        clock = this.calculateClockPosition(xCenter, frameWidth);
      }

      return {
        ...d,
        classId: cid,
        name: meta.name,
        category: meta.category,
        color: meta.color,
        baseRisk: meta.baseRisk,
        icon: meta.icon,
        distance: dist,
        clockPosition: clock
      };
    });

    const hasFire = items.some(i => i.classId === 2);
    const hasSmoke = items.some(i => i.classId === 3);
    const gasCylinders = items.filter(i => i.classId === 4);
    const casualties = items.filter(i => i.classId === 1);
    const flammables = items.filter(i => i.classId === 5);
    const exitSigns = items.filter(i => i.classId === 6);

    let maxBaseRisk = items.reduce((acc, curr) => Math.max(acc, curr.baseRisk || 0), 0);
    let proximityBonus = 0;
    const compoundHazards = [];
    const activeAlerts = [];
    let evacRecommended = false;
    let exitVector = null;

    // Rule 1: Fire + Gas Cylinder (< 3.0m proximity)
    if (hasFire && gasCylinders.length > 0) {
      const fire = items.find(i => i.classId === 2);
      for (const gc of gasCylinders) {
        const deltaDist = Math.abs(fire.distance - gc.distance);
        if (deltaDist < 3.0) {
          proximityBonus += 38;
          compoundHazards.push({
            type: "EXPLOSION_RISK",
            title: "CRITICAL EXPLOSION RISK",
            severity: "CRITICAL",
            color: "#FF0033",
            message: "Gas cylinder in direct proximity to active fire plume!",
            action: "IMMEDIATE EVACUATION"
          });
          activeAlerts.push({
            id: `alert-fire-gas-${Date.now()}`,
            level: "CRITICAL",
            text: "CRITICAL WARNING! Gas cylinder near active fire! Evacuate zone!",
            priority: 10
          });
          evacRecommended = true;
          break;
        }
      }
    }

    // Rule 2: Fire/Smoke + Possible Casualty (Same Sector)
    if ((hasFire || hasSmoke) && casualties.length > 0) {
      const hazardClocks = items.filter(i => i.classId === 2 || i.classId === 3).map(i => i.clockPosition);
      for (const cas of casualties) {
        const isSameSector = hazardClocks.includes(cas.clockPosition) || 
                             hazardClocks.some(hc => Math.abs(hc - cas.clockPosition) <= 1);
        if (isSameSector) {
          proximityBonus += 28;
          compoundHazards.push({
            type: "VICTIM_PERIL",
            title: "EXTREME VICTIM PERIL",
            severity: "CRITICAL",
            color: "#FF0033",
            message: `Casualty compromised in thermal fire corridor at ${cas.clockPosition} o'clock!`,
            action: "RAPID EXTRACTION"
          });
          activeAlerts.push({
            id: `alert-cas-fire-${Date.now()}`,
            level: "CRITICAL",
            text: `URGENT! Casualty trapped in fire sector at ${cas.clockPosition} o'clock!`,
            priority: 9
          });
          break;
        }
      }
    }

    // Rule 3: Flammable Drum + Fire
    if (hasFire && flammables.length > 0) {
      proximityBonus += 20;
      compoundHazards.push({
        type: "FLASH_RISK",
        title: "HIGH FLASH RISK",
        severity: "HIGH",
        color: "#FF7700",
        message: "Chemical container exposed to high radiant heat.",
        action: "SUPPRESSION RECOMMENDED"
      });
      activeAlerts.push({
        id: `alert-flam-${Date.now()}`,
        level: "HIGH",
        text: "Caution! Electrical spark or fire near flammable container.",
        priority: 7
      });
    }

    // Rule 4: Tactical Evac Path (Exit Sign Guidance)
    if (exitSigns.length > 0) {
      const nearestExit = exitSigns.reduce((prev, curr) => (prev.distance < curr.distance ? prev : curr));
      const dirText = nearestExit.clockPosition >= 1 && nearestExit.clockPosition <= 5 ? "RIGHT" :
                      nearestExit.clockPosition >= 7 && nearestExit.clockPosition <= 11 ? "LEFT" : "STRAIGHT AHEAD";
      exitVector = {
        clockPosition: nearestExit.clockPosition,
        distance: nearestExit.distance,
        bearingText: `${nearestExit.clockPosition} O'CLOCK • ${nearestExit.distance}m`,
        direction: dirText
      };

      if (evacRecommended || maxBaseRisk >= 60) {
        activeAlerts.push({
          id: `alert-exit-${Date.now()}`,
          level: "SAFE ROUTE",
          text: `Emergency exit identified at ${nearestExit.clockPosition} o'clock, ${nearestExit.distance} meters. Route highlighted.`,
          priority: 8
        });
      }
    }

    const smokeMult = hasSmoke ? 15 : 0;
    const rawScore = maxBaseRisk + proximityBonus + smokeMult;
    const threatScore = Math.min(100, Math.max(5, rawScore));

    let threatLevel = "NOMINAL";
    let threatColor = "#00FF66";
    if (threatScore > 75) {
      threatLevel = "CRITICAL";
      threatColor = "#FF0033";
    } else if (threatScore > 50) {
      threatLevel = "HIGH";
      threatColor = "#FF6600";
    } else if (threatScore > 25) {
      threatLevel = "MODERATE";
      threatColor = "#FFB700";
    }

    return {
      threatScore,
      threatLevel,
      threatColor,
      compoundHazards,
      activeAlerts,
      evacRecommended,
      exitVector,
      detectedItems: items
    };
  }
}

// Global export for vanilla ES / module use
window.ThreatEngine = ThreatEngine;
window.VISIONHUD_CLASSES = VISIONHUD_CLASSES;
