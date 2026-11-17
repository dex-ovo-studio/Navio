# Homepage asset provenance

This is a documentation and brand-layout change for the GPL-3.0-only Navio Windows project. It does not change the licensing of upstream material, application code, or release binaries.

- README base: public `showcase` commit `4063ccef79f68648047403117e014afbb214df1d`, merged V3 PR #2. README blob `cf32d0608888d5325b658fb33e63be0328800f9e`.
- V2 `hero.svg` and `content.svg`: copied unchanged from public Navio `main`, verified blobs `b410da47a48e48d1fdf5e56c5eeb386e52426ac2` and `7445609babc3134953644eea31f699442471c9b8`. Observed main ref `aa02865228d5625777558e107473e1b1b4fa5364`. Keeping these assets with the README makes the candidate self-contained instead of depending on a moving branch for images.
- V4 `hero-desktop.svg`: V2 desktop composition retained; only the visible version-specific Beta 7 badge is replaced with a version-neutral open-source label. The unmodified V2 original is retained.
- V4 `hero-mobile.svg`: new compact layout, retaining V2 logo path geometry, navy/mint colors and existing tagline. No downloaded fonts, scripts, remote images or third-party artwork. At a full-width 320 CSS pixel image size, explicit label font sizes scale to at least 14.7 pixels. This estimate excludes container padding and is not a browser rendering or readability test.
- All of these SVGs are brand or feature illustrations. They must not be presented as screenshots from a running Navio application.
- The audited public tree contains icon/background PNGs but no verified application screenshots. No Pro or Android screenshot has been used as a Windows open-source screenshot.

Upstream license: https://github.com/dex-ovo-studio/Navio/blob/main/LICENSE . Existing attribution to Clash Party and Mihomo is retained in the README.
