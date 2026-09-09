---
name: napsed-design-system
description: High-density dark-mode Cashmere & Concrete design system, Framer Motion, and UI conventions for Napsed.
---

# Design System: Napsed — "Cashmere and Concrete"

Canonical visual authority also lives in root `DESIGN.md`. Prefer `DESIGN.md` tokens when they conflict with older hex in git history. This skill carries interaction patterns, IA, and material recipes agents should apply on every UI surface.

## 1. Vision

Sophisticated, high-density, mature dark UI for long coding and audit sessions. Soft cashmere neutrals on concrete charcoal; amber only for cryptographic consensus (seals, focus, paste-detection gates). Brand is **Napsed** everywhere — not DevProof, not “The Low Level Club” as product name.

## 2. Neutral Protocol tokens

| Role | Token | Hex | Use |
| --- | --- | --- | --- |
| Canvas | `charcoal-950` | `#0D0E10` | App shell / page ground (low-fatigue) |
| Surface | `charcoal-surface` | `#1A1D21` | Sub-panels, sync strips, nested wells |
| Card | `charcoal-card` | `#2A2E35` | Interactive cards, Proof Card body |
| Mid concrete | `charcoal-base` | `#22252A` | Dense mid surfaces, seal ink |
| Border | `slate` | `#4A4A4D` | 1px borders, dividers, idle chrome |
| Secondary | `greige` | `#B8A999` | Sub-headlines, mono telemetry, idle nav |
| Headline | `beige` | `#E6DDD2` | Primary text, verified callouts |
| Peak | `cream` | `#FBF7F1` | Highest emphasis, CTA labels on dark |
| Signal | `amber` | `#F59E0B` | Consensus seals, focus rings, paste-gate warnings |
| Glow | `amber/10` | `rgba(245,158,11,0.1)` | Hover/focus fills |

```tsx
// Tailwind mappings
bg-charcoal-950 / bg-charcoal-surface / bg-charcoal-card
border-slate
text-greige / text-beige / text-cream
text-amber-500 / bg-amber-500
```

## 3. Layout & IA

1. **Pillar nav:** Arena · Challenge Specs · Practice · Peer Audit · Guilds (+ Proof Profile / Identity cluster).
2. **Density:** `p-4`–`p-6`, `gap-4`–`gap-6` — Raycast / Linear / GitHub Dark.
3. **Split panes:** Specs/context left; action/review right (challenge + audit).

## 4. Material recipes

* **Floating cards:** `.floating-card` — charcoal-card, slate border, `rounded-2xl`, offset drop-shadow; amber border whisper on hover.
* **Consensus / auditor seal:** `.consensus-seal` or `.auditor-seal` — amber (or warm-neutral stamp with charcoal ink); dashed slate edge; mono uppercase; slight rotate. Highest privilege on Proof Cards.
* **Tactile badges:** `.tactile-badge` — charcoal gradient, amber hairline, cream checkmarks (e.g. guild verified pins).
* **Paste-detection gate:** Blurred editor + lock overlay + amber warning until Architectural Defense word count is met.
* **Heatmaps:** Beige contribution cells on charcoal grid.

## 5. Typography

1. **UI:** Inter, `font-extrabold` + `tracking-tight` on headlines → **beige**; sub-heads → **greige**.
2. **Telemetry / code:** JetBrains Mono only for numbers, shortcuts, URLs, code, Proof handles.

## 6. Motion (Framer Motion)

One calm entrance per view — not staggered noise on every block:

```tsx
import { motion } from "framer-motion";

export const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="min-h-screen bg-charcoal-950 text-beige"
  >
    {children}
  </motion.div>
);
```

## 7. Do / Don't

**Do:** Napsed naming; warm greige secondary; amber rarity; floating Proof Cards; long-session contrast.

**Don't:** Swiss light gallery/vermillion/zero-radius; purple neon; pure `#FFFFFF` body text; monospace as costume for ordinary labels.
