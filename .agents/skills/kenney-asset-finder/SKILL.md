---
name: kenney-asset-finder
description: Find and compare suitable game asset packs in Kenney's All-in-1 preview catalog. Use when a project needs Kenney art, 3D models, UI, icons, or audio recommendations; this skill finds and verifies packs but does not download them unless asked.
---

# Kenney Asset Finder

Use Kenney's official All-in-1 catalog as the starting point:
<https://kenney.nl/data/itch/preview/>

## Find suitable packs

- Search the live catalog for the user's theme, art style, perspective, and asset type. Use English keywords and close synonyms because pack titles and the site's filters use English.
- When working in a project, inspect only the relevant project context to understand its game genre, visual style, perspective, and engine. For Phaser projects, distinguish 2D sprites and tiles from 3D models; do not imply that a 3D model can be used as a Phaser sprite without conversion or rendering support.
- Use the catalog's categories (2D, 3D, UI, Icons, Audio, Other) to narrow results. If the user gives few constraints, return a small, varied shortlist and state the assumptions behind the recommendations.
- The catalog is a discovery index, not a complete manifest. It warns that some packages may not be displayed. If no suitable pack appears, search Kenney's official asset pages as well and identify results that were not present in the preview index.

## Verify before recommending

- Prefer the official Kenney page for each exact pack title. Use its description, tags, category, preview, and file metadata to confirm what the pack contains. Find the page by searching the exact title on Kenney's site; do not invent a detail-page slug or claim a package contains specific files based only on its name.
- If only the catalog title or preview image is available, label the description as a high-level inference and avoid claims about file count, formats, animation data, tile size, or compatibility.
- Check the official package page for licensing when license affects the user's decision. Do not assume all packs have identical terms or that an old license statement is current.
- Link to the verified official package page when available. Otherwise link to the catalog and give the exact title so the user can locate it there.
- Do not download, install, purchase, or import assets unless the user asks for that action.

## Present recommendations

- Reply in Traditional Chinese when the user writes in Traditional Chinese, unless they request another language.
- For a normal discovery request, rank the best few matches first and use a compact table with the exact English pack title, Traditional Chinese name, category, why it fits, and verified link. Mention meaningful tradeoffs such as perspective, pixel style, or whether the pack is an expansion.
- If the user asks for a complete inventory, include every visible matching title and clearly distinguish it from an exhaustive Kenney-wide catalog; the preview page itself notes that some packages may not be displayed.
- Separate verified facts from inferences. Do not present a broad title-based guess as a detailed contents list.
