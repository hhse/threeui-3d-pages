---
name: threeui-3d-pages
description: Build polished Three.js landing pages, hero sections, backgrounds, and UI controls with the ThreeUI Community catalog. Use for high-end 3D web UI requests, including liquid metal, glass, smoke, particles, shader buttons, or ThreeUI template selection.
---

# ThreeUI 3D Pages

Use ThreeUI as a curated visual source, not as a collection of prompts to paste
blindly. The goal is a coherent, production-ready interface whose hero effect,
typography, spacing, motion, and content reinforce one art direction.

## Workflow

1. Establish the design brief from the user's request: product, audience,
   desired mood, primary content, and any required brand constraints. Do not
   invent product claims or replace supplied copy with demo copy.
2. Search the bundled catalog:

   ```bash
   node scripts/threeui.mjs search "liquid metal launch button"
   node scripts/threeui.mjs search "奢侈品香水 落地页 烟雾"
   ```

3. Shortlist two or three compatible candidates, then inspect the strongest one:

   ```bash
   node scripts/threeui.mjs show <item-id>
   node scripts/threeui.mjs guide <item-id>
   ```

4. Choose one anchor effect. Add at most one supporting ThreeUI element, and
   only when it serves a distinct hierarchy or interaction role. Do not stack
   unrelated shaders merely to make the page feel busier.
5. Read [references/integration.md](references/integration.md) before changing
   application code. It contains the source, asset, composition, performance,
   and verification rules.

## Decision Rules

- Match the effect to the content. A calm product page should not automatically
  receive a high-energy particle field, and a dashboard should not use a
  cinematic full-page shader as its primary surface.
- Prefer a full page or hero from the `Landing Pages` and `Hero` categories when
  the task is a new site. Prefer a background component when an existing UI
  needs depth, and a button or UI element when the requested scope is smaller.
- Use the catalog's `runtime`, `interaction`, `asset`, and `variants` metadata
  to reject candidates that conflict with the target stack or performance
  envelope.
- Treat the image and motion effect as one layer of the design. The surrounding
  layout, type scale, whitespace, contrast, and calls to action still determine
  whether the result looks finished.
- If the catalog has no suitable Community component, state that clearly and
  build the closest appropriate solution from the project's existing stack.
  Do not claim that a Pro or unavailable ThreeUI asset was used.

## Source Rules

- Community source is MIT licensed. Preserve attribution and bundled license
  notices; see [references/THIRD_PARTY_NOTICES.md](references/THIRD_PARTY_NOTICES.md).
  Do not redistribute remote ThreeUI thumbnails or previews.
- Prefer the npm package `@designcodeio/threeui` and its documented import
  names. Do not copy an entire template catalog into the target project.
- If an implementation guide exists, follow it before improvising. The guide
  identifies canonical source files, assets, runtime versions, and behavior.
- Never replace an authored shader, geometry, or asset with a rough visual
  approximation when the exact source is available.
- Use the Pro MCP or CLI only when the user has their own authorized access.
  Never request, store, or embed credentials in the generated project.

## Completion Bar

Before finishing, run the target project's build, tests, and lint commands that
exist. Inspect desktop and mobile renderings, browser console output,
reduced-motion behavior, and the WebGL fallback path where applicable. Report
the exact checks run and any validation that could not be completed.
