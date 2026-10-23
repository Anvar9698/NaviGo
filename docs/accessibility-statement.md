# Accessibility Statement & Senior Adult UI Guide

**Standard:** WCAG 2.2 Level AA Compliant (Aiming for Level AAA on contrast & sizing)

---

## 1. Core Accessibility Innovations for Older Adults

1. **Large Touch Targets ($\ge 56 \times 56\text{px}$):**
   - Floating "+ Report a problem" pill, navigation controls, and map recenter buttons satisfy the minimum touch boundary for tremors or arthritis.
2. **Text Scaling with Live Scaling Engine:**
   - Slider scales typography from 100% up to 140% smoothly across cards, labels, and popups.
   - Base typography is minimum 18px body font.
3. **Non-Color-Alone Principle:**
   - Every hazard marker is identified by:
     - An icon shape (triangle, cone, barrier, car)
     - A text label (`Accident`, `Traffic`, `Roadwork`, `Closure`)
     - A textual source tag (`[Live]`, `[Official]`, `[Reported by people]`)
4. **Accessible Alternative List View:**
   - For users who find visual maps confusing or use screen readers, the "Accessible List View" modal presents all road obstacles and atmospheric weather in linear, semantic `<article>` tags with proper ARIA landmarks.
5. **High-Contrast Senior Mode:**
   - Provides pure black and white surfaces with a bold `#FFD700` yellow focus ring outline on all interactive controls.
6. **Voice Search & Speech Guidance:**
   - Web Speech API integration in the search bar enables spoken destination queries.
