/**
 * VisionHUD - Thermal / Infrared Shader Filter Engine
 * Implements Section 5 of Master Blueprint v1.0
 * Converts standard camera RGB into authentic FLIR False-Color Thermal / Ironbow Spectrum
 */

class ThermalShaderEngine {
  constructor() {
    this.enabled = false;
    this.palette = this.generateIronbowPalette();
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.offscreenCanvas.getContext("2d", { willReadFrequently: true });
  }

  generateIronbowPalette() {
    // 256-color FLIR Ironbow look-up table: Dark Blue -> Purple -> Red -> Orange -> Yellow -> White
    const lut = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      const norm = i / 255.0;
      let r = 0, g = 0, b = 0;

      if (norm < 0.2) {
        // Deep Indigo to Blue
        const t = norm / 0.2;
        r = Math.floor(10 * t);
        g = Math.floor(20 * t);
        b = Math.floor(60 + 120 * t);
      } else if (norm < 0.4) {
        // Blue to Purple/Magenta
        const t = (norm - 0.2) / 0.2;
        r = Math.floor(10 + 160 * t);
        g = Math.floor(20 * (1 - t));
        b = Math.floor(180 + 40 * t);
      } else if (norm < 0.7) {
        // Magenta to Vivid Orange/Red
        const t = (norm - 0.4) / 0.3;
        r = Math.floor(170 + 85 * t);
        g = Math.floor(120 * t);
        b = Math.floor(220 * (1 - t));
      } else if (norm < 0.9) {
        // Orange to Bright Yellow
        const t = (norm - 0.7) / 0.2;
        r = 255;
        g = Math.floor(120 + 130 * t);
        b = Math.floor(20 * t);
      } else {
        // Yellow to White Hot
        const t = (norm - 0.9) / 0.1;
        r = 255;
        g = 255;
        b = Math.floor(20 + 235 * t);
      }

      // Format as 32-bit integer: (A << 24) | (B << 16) | (G << 8) | R (little-endian)
      lut[i] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    return lut;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setMode(active) {
    this.enabled = active;
  }

  /**
   * Apply real-time thermal transformation to an HTML5 canvas context
   */
  applyToCanvas(ctx, width, height) {
    if (!this.enabled) return;

    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data32 = new Uint32Array(imgData.data.buffer);
      const len = data32.length;
      const lut = this.palette;

      for (let i = 0; i < len; i++) {
        const pixel = data32[i];
        // Extract RGB
        const r = pixel & 0xff;
        const g = (pixel >> 8) & 0xff;
        const b = (pixel >> 16) & 0xff;
        
        // Luminance with slight red-channel heat emphasis
        const lum = (r * 0.45 + g * 0.35 + b * 0.2) | 0;
        const clampedLum = lum > 255 ? 255 : lum;

        data32[i] = lut[clampedLum];
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // In case of CORS or browser restrictions, fall back to CSS filter
      console.warn("Canvas ImageData read restricted, utilizing CSS thermal filter", e);
    }
  }
}

window.ThermalShaderEngine = ThermalShaderEngine;
