---
name: Napsed
description: Braun Functionalism — matte Cashmere and Concrete surfaces, sharp edges, pure data prioritization, and tactile status lenses.
colors:
  cashmere: "#E6E2DD"
  concrete: "#D8D3CC"
  charcoal: "#1D1F23"
  emerald-lens: "#10B981"
  amber-lens: "#F59E0B"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
    fontVariantNumeric: "tabular-nums"
  micro:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    lineHeight: 1.2
  nano:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "10px"
    lineHeight: 1.2
  pico:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "9px"
    lineHeight: 1.2
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
---

# Design System: Napsed (Braun Functionalism)

## Overview

**Creative North Star: "Braun Functionalism"**

Napsed's visual DNA is rooted in the functionalist design perfected by Dieter Rams at Braun in the mid-1950s. The ultimate tenet is: **"Good design is as little design as possible."**

The platform is designed to resemble high-precision industrial test equipment, not consumer SaaS. Decoration is prohibited. Every element exists solely to serve utilitarian data presentation.

## Colors & Materiality

The materiality relies on matte, high-quality industrial finishes. Gloss, reflections, soft shadows, and distracting patterns are forbidden.

### Core Palette
- **Cashmere (`#E6E2DD`)**: The primary matte chassis. Used for standard backgrounds and main canvasses.
- **Warm Concrete Gray (`#D8D3CC`)**: Recessed context. Used for modular panels, sub-surfaces, or telemetry dashboards that require slight structural differentiation.
- **Instrument Charcoal (`#1D1F23`)**: All structural lines, text, icons, and borders. Pure black may be used for absolute highest emphasis, but Charcoal is the baseline for all data ink.

### Tactile Status Lenses
Status is communicated via precise, physical-feeling analog "lenses".
- **Emerald Lens (`#10B981`)**: Signifies "Verified" or "Success." Emits a sharp, satisfying illuminated glow.
- **Amber Lens (`#F59E0B`)**: Signifies "Mitigated" or "Caution." A precise, glowing warning filament.

## Typography: Engineering Legibility

- **Technical Labels (Metadata)**: Must be rendered in `uppercase`, `font-medium`, and `tracking-wider` (e.g., `SPEC // CHAL-201`). This mimics silk-screened or engraved equipment faceplates.
- **Telemetry (Data)**: All real-time telemetry (latencies, counts, depths, timestamps) must use `tabular-nums` and `font-mono`.

## Layout & Structural Clarity

- **Unyielding Grid Order**: The layout is obsessed with order and interchangeable modularity.
- **Sharp Corners**: `rounded-none`. Braun equipment prioritized monolithic structure. Zero-radius corners enforce the serious, industrial credibility of the tool.
- **Crisp Dividers**: Use flat, unbroken horizontal and vertical 1px borders in Instrument Charcoal (`#1D1F23`).
- **No Soft Depth**: Hover shadows and soft gradients are strictly forbidden. Interactions are signaled via distinct border changes or tactile lenses, never floating shadows.

## Do's and Don'ts

### Do:
- **Do** prioritize the code snippet and live metrics over everything else.
- **Do** use strict modular blocks and unbroken dividing lines.
- **Do** keep functional icons (search, filter) minimal and colored strictly Charcoal (`#1D1F23`).
- **Do** strip out qualitative icons (e.g., a "zap" for a tip) entirely—use text.

### Don't:
- **Don't** use rounded corners for structural panels (`rounded-xl` is banned).
- **Don't** use hover shadows or floating elevation.
- **Don't** use colorful or descriptive icons that don't serve a strict interaction purpose.
- **Don't** use gradients or decorative backgrounds.
