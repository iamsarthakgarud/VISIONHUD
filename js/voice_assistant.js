/**
 * VisionHUD - Two-Way Hands-Free Voice Command Grammar & Synthetic Audio Queue
 * Implements Section 6 of Master Blueprint v1.0
 */

class VoiceAssistant {
  constructor(options = {}) {
    this.onCommand = options.onCommand || (() => {});
    this.onAlertLog = options.onAlertLog || (() => {});
    this.recognition = null;
    this.isListening = false;
    this.mutedUntil = 0;
    this.speechQueue = [];
    this.isSpeaking = false;
    this.cooldowns = new Map(); // key -> timestamp of last spoken

    this.initSpeechRecognition();
    this.synth = window.speechSynthesis;
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech Recognition API not supported in this browser. Voice commands will use manual trigger.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onAlertLog({ type: "VOICE_MIC", text: "Tactical Microphone Active. Listening for hands-free grammar." });
      };

      this.recognition.onresult = (event) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase();
        console.log("Heard voice command:", transcript);
        this.handleCommand(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          this.isListening = false;
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if still flagged listening for continuous hands-free operation
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // ignore
          }
        }
      };
    } catch (e) {
      console.warn("Failed to initialize Web Speech Recognition:", e);
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      try {
        this.isListening = true;
        this.recognition.start();
      } catch (e) {
        console.warn("Start listening failed:", e);
      }
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  handleCommand(phrase) {
    const p = phrase.toLowerCase();
    
    // Command 1: "VisionHUD Status"
    if (p.includes("status") || p.includes("visionhud status") || p.includes("report")) {
      this.onCommand("STATUS");
    }
    // Command 2: "Thermal Mode" / "Normal Mode"
    else if (p.includes("thermal mode") || p.includes("thermal") || p.includes("infrared")) {
      this.onCommand("THERMAL_ON");
      this.speak("Thermal vision filter engaged.", { priority: 10, force: true });
    } else if (p.includes("normal mode") || p.includes("normal vision") || p.includes("standard mode")) {
      this.onCommand("THERMAL_OFF");
      this.speak("Normal optical vision restored.", { priority: 10, force: true });
    }
    // Command 3: "Find Exit"
    else if (p.includes("find exit") || p.includes("where is exit") || p.includes("evac route")) {
      this.onCommand("FIND_EXIT");
    }
    // Command 4: "Clear Alert"
    else if (p.includes("clear alert") || p.includes("mute alert") || p.includes("silence")) {
      this.mutedUntil = Date.now() + 30000; // 30 seconds mute
      this.speak("Audio alerts muted for thirty seconds.", { priority: 10, force: true });
      this.onCommand("CLEAR_ALERT");
    }
  }

  /**
   * Prioritized Audio Alert Queue with Cooldowns
   */
  queueAlert(text, priority = 5, cooldownSec = 10) {
    const now = Date.now();
    if (now < this.mutedUntil) {
      // Alerts currently muted
      return;
    }

    const lastTime = this.cooldowns.get(text) || 0;
    if (now - lastTime < cooldownSec * 1000) {
      // Cooldown in effect
      return;
    }

    this.cooldowns.set(text, now);
    this.speak(text, { priority });
  }

  speak(text, { priority = 5, force = false } = {}) {
    if (!this.synth) return;

    this.onAlertLog({ type: "VOICE_ALERT", text: text });

    if (force) {
      this.synth.cancel();
      this.speechQueue = [];
    }

    this.speechQueue.push({ text, priority });
    this.speechQueue.sort((a, b) => b.priority - a.priority);

    this.processQueue();
  }

  processQueue() {
    if (this.isSpeaking || this.speechQueue.length === 0) return;

    const item = this.speechQueue.shift();
    this.isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = 1.05; // Slightly brisk tactical cadence
    utterance.pitch = 0.95; // Authoritative lower frequency

    // Try to choose an English robotic or professional voice if present
    const voices = this.synth.getVoices();
    const tacticalVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("David") || v.name.includes("Natural")));
    if (tacticalVoice) utterance.voice = tacticalVoice;

    utterance.onend = () => {
      this.isSpeaking = false;
      setTimeout(() => this.processQueue(), 250);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.processQueue();
    };

    this.synth.speak(utterance);
  }
}

window.VoiceAssistant = VoiceAssistant;
