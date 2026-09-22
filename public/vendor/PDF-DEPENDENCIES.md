# Local PDF dependencies

These files load only when exporting a saved AI report. No runtime npm install,
external CDN, additional AI request, or server-side report storage is required.

| Resource | Version / source | License |
| --- | --- | --- |
| `pdf-lib-1.17.1.mjs` | pdf-lib 1.17.1, upstream `dist/pdf-lib.esm.min.js` | `PDF-LIB-LICENSE.txt`, MIT |
| `fontkit-1.1.1.mjs` | @pdf-lib/fontkit 1.1.1, npm archive `dist/fontkit.umd.min.js` | `FONTKIT-LICENSE.txt`, MIT |
| bundled pako | PDF engine / fontkit dependency | `PAKO-LICENSE.txt`, MIT and Zlib |
| `../fonts/banpai-report-400.ttf` | Google Fonts Noto Sans SC, static weight 400, all 30,890 mapped characters retained | `../fonts/NOTO-REPORT-OFL.txt`, SIL OFL 1.1 |
| `../fonts/banpai-report-600.ttf` | Existing app semibold subset, converted from WOFF to TTF without changing glyphs | `../fonts/OFL.txt`, SIL OFL 1.1 |

Upstream references:
- https://pdf-lib.js.org/
- https://github.com/Hopding/fontkit
- https://registry.npmjs.org/@pdf-lib/fontkit/-/fontkit-1.1.1.tgz
- https://github.com/google/fonts/tree/main/ofl/notosanssc

The fontkit UMD is enclosed in a local `module` / `exports` scope and re-exported
as the ES module default. Its code does not create browser globals. The PDF
engine's ESM bundle is otherwise unmodified.

The complete regular font is derived with fontTools `TTFont` and
`instantiateVariableFont(font, {'wght': 400}, inplace=True)` from the upstream
`NotoSansSC[wght].ttf`, downloaded on 2026-09-22. It uses uncompressed TTF tables
for fast local font subsetting. The report embeds only the regular glyphs it
uses. The small semibold font is embedded intact: re-subsetting that previously
subsetted font with fontkit causes missing glyph outlines in PDF renderers.
This behavior was checked with rendered pages, not just extracted text.

SHA-256:
```
source variable font: a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da
report regular:       338ff4afecb464176746b74fba924a01d6d77c5d65ef97a416e2344640b031d6
report semibold:      2fb475fd638414731813d086fb99fe1788478c9934050c3f3030c23af842d7fe
```

Regenerate synthetic examples with `node scripts/qa-coach-pdf.mjs`; outputs go
under ignored `artifacts/coach-pdf/`. For browser download checks run
`node scripts/serve-qa.mjs` and visit `/coach-pdf-qa-local.html` on port 3001.
All fixtures contain simulated records and do not read personal practice data.
