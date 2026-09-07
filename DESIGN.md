---
name: Tactical HUD AR
colors:
  surface: '#091326'
  surface-dim: '#091326'
  surface-bright: '#30394e'
  surface-container-lowest: '#040e21'
  surface-container-low: '#121b2f'
  surface-container: '#161f33'
  surface-container-high: '#202a3e'
  surface-container-highest: '#2b3549'
  on-surface: '#d9e2fd'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#d9e2fd'
  inverse-on-surface: '#273045'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ffdb9f'
  on-secondary: '#422d00'
  secondary-container: '#ffb700'
  on-secondary-container: '#6b4b00'
  tertiary: '#dbffd7'
  on-tertiary: '#003911'
  tertiary-container: '#00fa64'
  on-tertiary-container: '#006e27'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ffdea9'
  secondary-fixed-dim: '#ffba26'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4100'
  tertiary-fixed: '#6bff83'
  tertiary-fixed-dim: '#00e55b'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#00531b'
  background: '#091326'
  on-background: '#d9e2fd'
  surface-variant: '#2b3549'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: 0.08em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: 0.06em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.04em
  body-lg:
    fontFamily: Chivo
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.02em
  body-md:
    fontFamily: Chivo
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Space Mono
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.12em
  label-md:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.1em
  telemetry-num:
    fontFamily: Space Mono
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
spacing:
  subatomic: 2px
  atomic: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter-mobile: 12px
  gutter-desktop: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system channels an advanced augmented-reality avionics and infantry HUD engineered for high-stress operational environments. It synthesizes utilitarian military instrumentation with near-future cybernetic visual syntax: ultra-precise, mission-critical, cold, and calculated.

### Visual Pillars
- **Cyber-Tactical Precision:** Zero ambient softness, hard cut corners, chamfered edge accents, and high-density telemetry readouts.
- **Atmospheric Depth:** Deep-space abyssal dark tones layered beneath retro-luminescent scanlines, subtle spatial coordinates grids, and razor-fine vector reticles.
- **Instrumental Signaling:** Functional chromatic hierarchy where neon light emissions communicate vital telemetry, telemetry locks, diagnostic warnings, and life-critical threats.

## Colors

The palette operates under a high-contrast nocturnal baseline. Emissive neon pigments cut through dense midnight blue-blacks, maintaining maximum contrast and rapid visual scanning.

### Core Roles
- **Primary (`#00F0FF` - Ion Cyan):** Primary tactical vectoring, selected reticles, active telemetry, navigational waypoints, focused borders.
- **Secondary (`#FFB700` - Tactical Amber):** Cautions, secondary status, munitions levels, passive radar tracks, target acquisition lock.
- **Tertiary (`#00FF66` - Bio Green):** Nominal status, friendly IFF signatures, vital sign telemetry, systems operational.
- **Alert (`#FF0033` - Breach Red):** Critical threats, ballistic warnings, thermal runaway, critical system failure.
- **Accent (`#0066FF` - Vector Blue):** Auxiliary relays, inactive nodes, tactical grid overlays, passive sensor rings.
- **Neutrals:**
  - Base Void: `#040810`
  - HUD Panel: `#060e1d`
  - Elevated Node: `#0b1528`
  - Ghost Wireframe: `#162644`
  - Telemetry Text Muted: `#5c7499`
  - Telemetry Text Vivid: `#d6e8ff`

## Typography

Typography functions as an avionics read-out instrument. Every glyph must render crisp data points without ambiguity under combat/high-strain visual conditions.

- **Display & Headlines (Space Grotesk):** Geometric, hard-edged, technical authority. All headers must be rendered in uppercase with deliberate tracking (`0.05em` to `0.08em`).
- **Body & Intelligence Reports (Chivo):** Crisp, readable grotesque with high legibility across small sizes, balanced for rapid parsing of briefing data and situational readouts.
- **Labels & Telemetry (Space Mono):** Fixed-width mechanical structure for coordinate feeds, timestamps, ammunition counts, hex addresses, and sensor output.

## Layout & Spacing

The spatial architecture leverages a high-density, mathematical 12-column tactical grid overlay with strict multi-panel compartmentalization.

### Framework
- **HUD Grid:** A 12-column grid with 20px gutters and 32px external margins on desktop viewports. Collapses to a 4-column framework with 12px gutters on compact/mobile field units.
- **Modular HUD Quadrants:** Viewports are partitioned into mission-critical clusters: top telemetry bar (IFF, network, battery, satellites), left/right side rails (diagnostics, target vectors), and center focal arena (targeting reticle, active stream).
- **Background CRT Scanlines & Coordinate Grid:** Underlaid with horizontal scanlines (`repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)`) overlaid on an ambient 40px × 40px faint wireframe grid.

## Elevation & Depth

Visual hierarchy abandons traditional soft shadows in favor of emissive photonic projection, optical glass translucency, and luminous wireframe boundaries.

- **Z-0 Base Void:** Deep matte `#040810` paired with structural spatial gridlines.
- **Z-1 Telemetry Panels:** `#060e1d` with 70% opacity and `backdrop-filter: blur(12px)`. Border is a razor 1px solid `#162644`.
- **Z-2 Active Modals / Threat Containers:** `#0b1528` with 85% opacity, bordered by 1px solid `rgba(0, 240, 255, 0.4)`. Drops an emissive perimeter glow: `box-shadow: 0 0 15px rgba(0, 240, 255, 0.15), inset 0 0 10px rgba(0, 240, 255, 0.05)`.
- **Z-3 Critical Breach Layers:** Dynamic flashing red halo: `box-shadow: 0 0 25px rgba(255, 0, 51, 0.35), inset 0 0 15px rgba(255, 0, 51, 0.1)`.

## Shapes

The design system is strictly sharp (`roundedness: 0`). Curved edges are structurally rejected to evoke hard-milled military chassis, circuit architecture, and fighter jet instrumentation.

### Corner Treatments
- **Corner Notches & Chamfers:** UI cards feature 45-degree corner clips (`clip-path: polygon(...)`) ranging between 6px and 12px cut depth.
- **HUD Corner Brackets:** Cards, modals, and target indicators are framed by decoupled L-shaped corner tick marks measuring 8px in length and 1.5px in border weight.
- **Exception for Status Badges:** Sensor beacons and state tags may use extreme pill containers exclusively when communicating active blinking radio or life-sign signals.

## Components

### Buttons & Actuators
- **Primary Fire/Action Button:** Chamfered right edge, sharp 0px corners. Solid neon fill (`#00F0FF`) with black text (`#040810`, font: `Space Mono`, bold, uppercase). Hover state emits a high-frequency cyan aura and increases font tracking.
- **Ghost Tactical Button:** Transparent background, 1px solid `#00F0FF` border, uppercase cyan typography. Corner tick marks appear on hover accompanied by an audio-visual scan tick.
- **Alert / Destruct Button:** Deep red base with a flashing diagonal warning stripe border and `#FF0033` neon emission.

### Cards & HUD Modules
- Translucent dark glass (`rgba(6, 14, 29, 0.75)`) framed by bracketed corners.
- Micro-headers contain alphanumeric system markers (e.g., `// SEC-04 // LAT: 45.109.82`) set in muted `Space Mono` at 10px.
- Subtle inner grid lines separate content sectors.

### Pills & Telemetry Badges
- High-tech rounded pill container (`border-radius: 9999px`) constructed from dark charcoal frames with vibrant border rings.
- Left-aligned pulsating beacon light (3px × 3px circle with CSS radar ping animation) displaying current node health (`#00FF66` active, `#FFB700` standby, `#FF0033` compromised).

### Form Inputs & Terminal Fields
- Monospaced input text with an oscillating block cursor (`#00F0FF`).
- Input container has a sharp lower-border emphasis (2px solid `#00F0FF`) with faint side rails and coordinate label anchors pinned to the top-left margin.

### Checkboxes & Segmented Selectors
- Checkboxes: Diamond-rotated or square cutouts with sharp geometric crosshairs (`+` or `X`) upon activation rather than traditional checkmarks.
- Segmented Radio Selectors: Continuous horizontal command rail where the active node is illuminated with a solid neon cyan fill and reversed typography.

### Data Readouts & Reticles
- Target trackers featuring rotating radial vector sights, cardinal degree markings, range-to-target calculations in real-time monospace, and dynamic color shift upon target acquisition lock (`#00F0FF` to `#FFB700`).