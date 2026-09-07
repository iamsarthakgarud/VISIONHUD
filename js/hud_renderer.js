/**
 * VisionHUD - 60 FPS Canvas 2D Tactical HUD Renderer
 * Implements Section 5 of Master Blueprint v1.0
 */

class HudRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.rotationAngle = 0;
    this.heading = 14; // Default 014° NNE
    this.lastTimestamp = performance.now();
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = performance.now();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (this.canvas.width !== rect.width || this.canvas.height !== rect.height) {
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
  }

  render(state) {
    this.resize();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (w === 0 || h === 0) return;

    // Calculate FPS
    const now = performance.now();
    this.frameCount++;
    if (now - this.fpsTimer >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = now;
    }
    const dt = (now - this.lastTimestamp) / 1000.0;
    this.lastTimestamp = now;

    this.rotationAngle += dt * 1.5; // ~85 deg/sec rotation for reticles

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // 1. Center Horizon & Crosshair Reticle
    this.drawHorizonAndCenter(ctx, w, h);

    // 2. Top Azimuth Compass Tape
    this.drawCompassTape(ctx, w, h);

    // 3. Target Reticles & Bounding Boxes
    if (state && state.detections) {
      for (const item of state.detections) {
        this.drawTargetReticle(ctx, item, w, h, state);
      }
    }

    // 4. Tactical Exit Guidance Arrow (if exit vector active)
    if (state && state.exitVector) {
      this.drawExitGuidance(ctx, state.exitVector, w, h);
    }

    // 5. Critical Breach Warning Flash (if Threat Score > 75)
    if (state && state.threatScore > 75) {
      this.drawCriticalVignette(ctx, w, h, state.threatScore);
    }
  }

  drawHorizonAndCenter(ctx, w, h) {
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);

    // Horizontal horizon lines
    ctx.beginPath();
    ctx.moveTo(cx - 160, cy);
    ctx.lineTo(cx - 30, cy);
    ctx.moveTo(cx + 30, cy);
    ctx.lineTo(cx + 160, cy);
    ctx.stroke();

    // Pitch ladder ticks
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    [-40, 40].forEach(offsetY => {
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy + offsetY);
      ctx.lineTo(cx - 20, cy + offsetY);
      ctx.moveTo(cx + 20, cy + offsetY);
      ctx.lineTo(cx + 40, cy + offsetY);
      ctx.stroke();
    });

    // Center focal sight ring
    ctx.strokeStyle = "rgba(0, 240, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Small center dot
    ctx.fillStyle = "#00F0FF";
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawCompassTape(ctx, w, h) {
    const cx = w / 2;
    const tapeY = 32;

    ctx.save();
    ctx.fillStyle = "rgba(6, 14, 29, 0.6)";
    ctx.fillRect(cx - 140, tapeY - 18, 280, 26);
    ctx.strokeStyle = "rgba(0, 240, 255, 0.3)";
    ctx.strokeRect(cx - 140, tapeY - 18, 280, 26);

    // Ticks and degrees
    const currentHeading = this.heading;
    for (let deg = currentHeading - 30; deg <= currentHeading + 30; deg += 5) {
      const normalizedDeg = (deg + 360) % 360;
      const xOffset = cx + (deg - currentHeading) * 4.5;
      const isMajor = normalizedDeg % 15 === 0;

      ctx.strokeStyle = isMajor ? "#00F0FF" : "rgba(0, 240, 255, 0.4)";
      ctx.beginPath();
      ctx.moveTo(xOffset, tapeY + (isMajor ? 4 : 0));
      ctx.lineTo(xOffset, tapeY - (isMajor ? 12 : 6));
      ctx.stroke();

      if (isMajor) {
        let label = `${normalizedDeg}°`;
        if (normalizedDeg === 0) label = "N";
        else if (normalizedDeg === 90) label = "E";
        else if (normalizedDeg === 180) label = "S";
        else if (normalizedDeg === 270) label = "W";

        ctx.fillStyle = "#d6e8ff";
        ctx.font = "bold 9px 'Space Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, xOffset, tapeY - 14);
      }
    }

    // Center Heading Indicator Marker
    ctx.fillStyle = "#FFB700";
    ctx.beginPath();
    ctx.moveTo(cx, tapeY + 8);
    ctx.lineTo(cx - 5, tapeY + 16);
    ctx.lineTo(cx + 5, tapeY + 16);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawTargetReticle(ctx, item, w, h, state) {
    // Determine bounding box coordinates
    let bx = 0, by = 0, bw = 100, bh = 100;
    if (item.bbox) {
      const [ymin, xmin, ymax, xmax] = item.bbox;
      bx = xmin * w;
      by = ymin * h;
      bw = (xmax - xmin) * w;
      bh = (ymax - ymin) * h;
    } else if (item.xCenter) {
      bx = item.xCenter * w - 60;
      by = h * 0.4;
      bw = 120;
      bh = 140;
    }

    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const radius = Math.max(bw, bh) / 2 + 10;
    const color = item.color || "#00F0FF";
    const isCritical = item.classId === 1 || item.classId === 2 || item.classId === 4;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = isCritical ? 18 : 10;

    // 1. Decoupled L-Corner Brackets
    const bracketLen = Math.min(20, bw * 0.25);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(bx, by + bracketLen);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + bracketLen, by);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(bx + bw - bracketLen, by);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw, by + bracketLen);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(bx, by + bh - bracketLen);
    ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bracketLen, by + bh);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(bx + bw - bracketLen, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by + bh - bracketLen);
    ctx.stroke();

    // 2. Rotating Circular Reticle & Distance Rings
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotationAngle * (item.classId % 2 === 0 ? 1 : -1));

    // Outer segmented reticle
    ctx.setLineDash([12, 16]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner distance radar ticks
    ctx.setLineDash([4, 10]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // 3. Top Cybernetic Target Tag
    const tagText = `${item.name.toUpperCase()} // ${item.distance}m [${item.clockPosition}h]`;
    ctx.font = "bold 10px 'Space Mono', monospace";
    const tagW = ctx.measureText(tagText).width + 16;

    ctx.fillStyle = color;
    ctx.fillRect(bx, by - 22, tagW, 18);

    ctx.fillStyle = "#040810";
    ctx.fillText(tagText, bx + 8, by - 9);

    // 4. Cross-connecting telemetry lead line
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, by + bh);
    ctx.lineTo(cx, by + bh + 16);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, by + bh + 16, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawExitGuidance(ctx, exitVector, w, h) {
    const dir = exitVector.direction; // "LEFT", "RIGHT", "STRAIGHT AHEAD"
    const text = `EVACUATION ROUTE: ${exitVector.bearingText} ➔ [${dir}]`;

    const cx = w / 2;
    const y = h - 65;

    ctx.save();
    ctx.shadowColor = "#00FF66";
    ctx.shadowBlur = 18;

    // Glowing Banner Container
    ctx.fillStyle = "rgba(0, 20, 10, 0.85)";
    ctx.strokeStyle = "#00FF66";
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - 240, y - 18, 480, 36);
    ctx.strokeRect(cx - 240, y - 18, 480, 36);

    // Pulsing Sweeping Arrows
    const pulseOffset = (Math.sin(performance.now() / 150) * 10);
    ctx.fillStyle = "#00FF66";
    ctx.font = "bold 13px 'Space Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, cx, y + 5);

    // Directional chevron graphics
    if (dir === "RIGHT") {
      this.drawChevron(ctx, cx + 200 + pulseOffset, y, "RIGHT");
      this.drawChevron(ctx, cx + 215 + pulseOffset, y, "RIGHT");
    } else if (dir === "LEFT") {
      this.drawChevron(ctx, cx - 200 - pulseOffset, y, "LEFT");
      this.drawChevron(ctx, cx - 215 - pulseOffset, y, "LEFT");
    }

    ctx.restore();
  }

  drawChevron(ctx, x, y, dir) {
    ctx.beginPath();
    if (dir === "RIGHT") {
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x, y + 8);
    } else {
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x - 8, y);
      ctx.lineTo(x, y + 8);
    }
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#00FF66";
    ctx.stroke();
  }

  drawCriticalVignette(ctx, w, h, threatScore) {
    const pulseIntensity = 0.2 + (Math.sin(performance.now() / 200) + 1) * 0.2;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 0, 51, ${pulseIntensity + 0.3})`;
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, w, h);

    // Vignette gradient
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, "rgba(255, 0, 51, 0)");
    grad.addColorStop(1, `rgba(255, 0, 51, ${pulseIntensity * 0.5})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  }
}

window.HudRenderer = HudRenderer;
