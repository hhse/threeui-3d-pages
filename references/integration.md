# ThreeUI Integration and Quality Guide

Read this file after selecting a candidate from `scripts/threeui.mjs` and before
editing the application.

## 1. Build the composition around the effect

Define the page's focal point before adding code. A ThreeUI scene should carry
atmosphere or product emphasis; it should not compete with every heading,
button, and card for attention.

- Give the effect a deliberate region: full-bleed hero, contained stage, or
  quiet background.
- Keep the main message readable without relying on hover or animation.
- Use the product's real content and brand cues. Remove the ThreeUI demo copy,
  placeholder branding, and irrelevant controls.
- Create hierarchy with type scale, spacing, contrast, and alignment. Avoid
  adding translucent cards over every part of a 3D scene.
- Leave enough calm space around detailed shaders. Dense visual effects need
  simpler surrounding layout.
- If the effect includes a signature palette, either use it intentionally or
  expose a small number of documented controls. Recoloring a shader at random
  usually weakens it.

## 2. Choose the lightest suitable integration

For Community React components, install the package and load the shared
stylesheet once:

```bash
npm install @designcodeio/threeui
```

```tsx
import { ComponentName } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";
```

Use the `importName` and variant props from the catalog. For the smallest import
graph, the package also supports component subpaths:

```tsx
import { ComponentName } from "@designcodeio/threeui/components/ComponentName";
```

Some components render complete HTML documents and expect runtime files at
root-relative URLs. Inspect the component's `sourceUrl` and `assetBaseUrl`
contract. If those files are missing, copy only the required files from
`node_modules/@designcodeio/threeui/lib-dist/assets/` into the application's
public directory, preserving relative paths.

Do not import a full HTML document into the main JavaScript graph when the
component is designed to run inside an iframe or sandboxed document.

## 3. Preserve authored behavior

When the guide names a canonical source or hash:

1. Open the source files listed in the catalog item.
2. Preserve shader code, render passes, geometry, timing, and interaction
   semantics unless the user explicitly requests a redesign.
3. Preserve required asset paths and fonts.
4. Adapt only the host boundary: sizing, responsive layout, surrounding copy,
   navigation, and integration with the product.
5. Verify that animation frames, observers, listeners, textures, materials, and
   renderers are released on unmount or teardown.

If the exact source is unavailable, use the documented package component. Do
not fabricate a source hash or claim byte-level fidelity.

## 4. Performance and accessibility

- Cap device pixel ratio for expensive WebGL scenes; use the component's
  documented adaptive behavior where present.
- Pause or reduce animation when the page is hidden or the scene is offscreen.
- Respect `prefers-reduced-motion` with a meaningful still or reduced-motion
  state.
- Provide a static CSS or image fallback when WebGL initialization fails.
- Keep essential copy, focus states, and calls to action usable without motion.
- Avoid trapping the pointer, hiding keyboard focus, or placing critical text
  inside a canvas.
- Test at a small laptop viewport as well as a phone. The key message and CTA
  should be visible before the user has to scroll through the entire effect.

## 5. Verification

Use the checks that exist in the target repository. Typical commands are
`npm run build`, `npm test`, and `npm run lint`; do not invent a passing result.

Also verify:

- the scene reaches its intended composition at desktop and mobile sizes;
- text remains legible over every animated state;
- pointer and keyboard interactions do not conflict with page navigation;
- assets load without 404s and no third-party request is accidental;
- the console is free of shader, WebGL, or asset errors;
- reduced motion and WebGL failure show a usable fallback;
- the selected effect remains an accent to the interface rather than the whole
  product experience.

## 6. Updating the catalog

The bundled catalog is a snapshot of ThreeUI Community. Refresh it when the
upstream project changes:

```bash
node scripts/sync-threeui.mjs
```

For an offline test against a local checkout:

```bash
node scripts/sync-threeui.mjs --source-root /path/to/threeui
```

The sync script reads `src/data/shaders.tsx` and
`src/components/buildSkillMarkdown.js` without executing upstream JavaScript.
It writes `references/catalog.json` and the available implementation guides
under `references/guides/`.
