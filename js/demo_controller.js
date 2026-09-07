/**
 * VisionHUD - Demo Controller & Preset Scenarios
 * Implements Section 7 of Master Blueprint v1.0 (The Winning 2-Minute Live Demo Script)
 */

class DemoController {
  constructor(app) {
    this.app = app;
    this.activeScenario = "NOMINAL";
    this.scriptRunning = false;
    this.scriptTimer = null;
    this.scriptStep = 0;

    this.bindHotkeys();
  }

  bindHotkeys() {
    window.addEventListener("keydown", (e) => {
      // Avoid hotkeys if typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const key = e.key.toUpperCase();
      switch (key) {
        case "1":
        case "N":
          this.triggerNominal();
          break;
        case "2":
        case "C":
          this.triggerCasualty();
          break;
        case "3":
        case "F":
          this.triggerCompoundHazard();
          break;
        case "4":
        case "E":
          this.triggerThermalAndExit();
          break;
        case "T":
          this.app.toggleThermal();
          break;
        case "M":
          this.app.voiceAssistant.handleCommand("clear alert");
          break;
        case "S":
          this.app.reportStatus();
          break;
        case " ":
          this.toggleFullAutoScript();
          e.preventDefault();
          break;
      }
    });
  }

  // 1. Stage 1: 0:00 - 0:20 (The Hook - Normal Room)
  triggerNominal() {
    this.activeScenario = "NOMINAL";
    this.app.setThermal(false);
    this.app.setDetections([
      {
        id: "rescuer-01",
        classId: 0,
        name: "Person / Rescuer",
        distance: 3.2,
        clockPosition: 12,
        bbox: [0.25, 0.42, 0.75, 0.58],
        confidence: 0.94
      }
    ]);
    this.app.updateStageBadge("STAGE 1: NOMINAL (NORMAL ROOM)", "NOMINAL");
  }

  // 2. Stage 2: 0:20 - 0:45 (Casualty Lock)
  triggerCasualty() {
    this.activeScenario = "CASUALTY";
    this.app.setThermal(false);
    this.app.setDetections([
      {
        id: "cas-01",
        classId: 1,
        name: "Possible Casualty",
        distance: 1.8,
        clockPosition: 12,
        bbox: [0.45, 0.35, 0.78, 0.65],
        confidence: 0.96
      }
    ]);
    this.app.voiceAssistant.queueAlert("Possible casualty detected 12 o'clock, 1.8 meters.", 9);
    this.app.updateStageBadge("STAGE 2: CASUALTY ACQUIRED", "URGENT");
  }

  // 3. Stage 3: 0:45 - 1:10 (Compound Hazard & Escalation)
  triggerCompoundHazard() {
    this.activeScenario = "COMPOUND_HAZARD";
    this.app.setThermal(false);
    this.app.setDetections([
      {
        id: "fire-01",
        classId: 2,
        name: "Fire / Active Flame",
        distance: 2.4,
        clockPosition: 2,
        bbox: [0.22, 0.60, 0.68, 0.85],
        confidence: 0.97
      },
      {
        id: "gas-01",
        classId: 4,
        name: "Gas Cylinder / Tank",
        distance: 2.6,
        clockPosition: 2,
        bbox: [0.38, 0.72, 0.72, 0.92],
        confidence: 0.93
      },
      {
        id: "cas-01",
        classId: 1,
        name: "Possible Casualty",
        distance: 2.1,
        clockPosition: 11,
        bbox: [0.42, 0.12, 0.76, 0.38],
        confidence: 0.92
      }
    ]);
    this.app.voiceAssistant.queueAlert("CRITICAL WARNING! Gas cylinder near active fire! Evacuate zone!", 10);
    this.app.updateStageBadge("STAGE 3: COMPOUND HAZARD (CRITICAL ESCALATION)", "CRITICAL");
  }

  // 4. Stage 4: 1:10 - 1:35 (Thermal Mode & Exit Guide)
  triggerThermalAndExit() {
    this.activeScenario = "THERMAL_EXIT";
    this.app.setThermal(true);
    this.app.setDetections([
      {
        id: "fire-01",
        classId: 2,
        name: "Fire / Active Flame",
        distance: 3.1,
        clockPosition: 10,
        bbox: [0.20, 0.15, 0.65, 0.38],
        confidence: 0.95
      },
      {
        id: "exit-01",
        classId: 6,
        name: "Emergency Exit Sign",
        distance: 4.2,
        clockPosition: 3,
        bbox: [0.18, 0.75, 0.34, 0.92],
        confidence: 0.98
      }
    ]);
    this.app.voiceAssistant.queueAlert("Thermal vision filter engaged. Emergency exit identified at 3 o'clock, 4.2 meters.", 8);
    this.app.updateStageBadge("STAGE 4: THERMAL MODE & EGRESS VECTOR", "SAFE_ROUTE");
  }

  // Stage 5: Full 2-Minute Presentation Auto-Sequence
  toggleFullAutoScript() {
    if (this.scriptRunning) {
      clearTimeout(this.scriptTimer);
      this.scriptRunning = false;
      this.app.updateStageBadge("MANUAL OVERRIDE ACTIVE", "NOMINAL");
      return;
    }

    this.scriptRunning = true;
    this.runScriptStep(1);
  }

  runScriptStep(step) {
    if (!this.scriptRunning) return;
    this.scriptStep = step;

    if (step === 1) {
      this.triggerNominal();
      this.scriptTimer = setTimeout(() => this.runScriptStep(2), 12000); // 12s demo
    } else if (step === 2) {
      this.triggerCasualty();
      this.scriptTimer = setTimeout(() => this.runScriptStep(3), 14000); // 14s demo
    } else if (step === 3) {
      this.triggerCompoundHazard();
      this.scriptTimer = setTimeout(() => this.runScriptStep(4), 16000); // 16s demo
    } else if (step === 4) {
      this.triggerThermalAndExit();
      this.scriptTimer = setTimeout(() => {
        this.app.updateStageBadge("STAGE 5: JUDGE Q&A / HANDS-ON TESTING", "NOMINAL");
        this.scriptRunning = false;
      }, 18000);
    }
  }
}

window.DemoController = DemoController;
