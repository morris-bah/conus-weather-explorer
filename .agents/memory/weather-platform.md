---
name: Weather tooling and tiles
description: Non-obvious runtime constraints observed during Svelte setup.
---
Check actual dev-server startup when upgrading Svelte/Vite/Tailwind together; a successful static build did not establish dev compatibility.

**Why:** The scaffold catalog used Vite 5; newer Svelte and Tailwind plugins expected newer dev APIs. Typechecking did not reveal that mismatch.

**How to apply:** Keep plugin peer ranges aligned during dependency updates and confirm dev startup.

CARTO anonymous basemap URLs returned image tiles watermarked “API KEY REQUIRED” despite successful HTTP responses in September 2026.

**Why:** Tile success alone does not establish usable map imagery.

**How to apply:** Inspect a rendered basemap when changing tile providers; use properly licensed/provider-authorized tiles rather than assuming historical anonymous access still works.