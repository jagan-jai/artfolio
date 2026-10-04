# Design Research — 25 Artist Websites, Deep Scan & Synthesis
**For:** JagansArtfolio (jagansartfolio.com) redesign · **Date:** 2026-10-05
**Method:** 5 parallel scanners, each fetching live HTML/CSS from 5 artist sites; palettes/typography grepped from shipped CSS.

---

## The 25 sites scanned

| Batch | Sites |
|---|---|
| Museum-level | David Hockney · Yayoi Kusama · Olafur Eliasson · JR · Refik Anadol |
| Contemporary brands | Murakami (Kaikai Kiki) · Daniel Arsham · Shepard Fairey (OBEY) · James Jean · Beeple |
| Digital/illustration | Loish · Guweiz (offline) · RossDraws · WLOP · Ilya Kuvshinov |
| Painter e-commerce | Erin Hanson · George Irvine · Steve McCurry · Peter Lik · Thomas Mangelsen |
| Design-forward | Neri Oxman · Es Devlin · Jennifer Xiao · Manuel Lozano · Mathijs Verstegen |

---

## Cross-site findings (what the top 25 actually do)

### 1. Palette — near-monochrome + exactly one accent
- Every site keeps the UI monochrome (black or white) and spends **one** saturated hue: Kusama `#e50012` red, Beeple `#ff40b9` pink, WLOP `#ff9adf`/`#65dcff` on `#090a0c`, Kuvshinov `#f0523d` vermillion on `#0e0e0e`, McCurry `#f0523d`, Lik gold `#b08d57` on warm neutrals.
- Dark themes that read as "gallery": McCurry (`#000` + serif, exhibition-catalogue feel), Beeple (`#000`/`#111` + hot pink), WLOP (cinematic `#090a0c`), Lozano (`#1d1e20` + amber `#ffcd35`), Oxman (`#000`, strictly monochrome).
- **Conclusion:** a warm near-black shell with **gold as micro-accent** (`#b08d57`-class, Peter Lik "vault gold") is a genuine differentiator — 4 of 5 museum sites are actually light-themed. Gold-as-accent is rare and reads luxury.

### 2. Typography — display + quiet body + mono microlabels
- One display voice carries identity; body is plain: Knockout 27 (OBEY), Druk (Beeple), Lora (James Jean), Cormorant Garamond (Erin Hanson), ivymode (McCurry — "proof dark theme + serif reads as gallery").
- Uppercase, wide-tracked **mono/微 microlabels** above big titles (WLOP: 10px wide-tracked mono; JR: uppercase micro-labels) — universal editorial polish.
- Small caption-like body type: Loish 12.8px base; Es Devlin `.8125rem` wide-tracked.
- **Conclusion:** Cormorant Garamond (display) + Inter (body) + JetBrains Mono (micro-labels). Small, tracked, calm.

### 3. Gallery UX — faceted archive, not one grid
- The flagship page is a **filterable archive with counts**: OBEY drop-down facets ("Screen Print (871), Serif (26)… By Year 2026 (25)…"), Arsham's tag directory (material × year × city), James Jean's year index, Beeple's "7,086 days" counter.
- Grid grammar everywhere: aspect-ratio-locked tiles + lazy loading + hover affordance (zoom or cursor-following preview — Oxman's floating thumbnail over a typographic list) + click-to-lightbox.
- Collections get **names, not just folders**: Loish's "dusk/candied/bloom", WLOP's "three worlds", RossDraws "Worlds: Symphony".
- **Conclusion:** gallery gets filter chips with counts, lazy grid, refined lightbox with captions + inquire CTA; homepage gets a **cursor-following preview** over a mediums index.

### 4. Marketplace — prints checkout, originals "enquire", editions + scarcity
- Prints/books go through carts (Shopify/Squarespace/Woo/BigCommerce); originals are by inquiry, price guide, or "contact specialist". Common: signed/numbered editions, COA, "Sold Out" states, "From $X" price rows, The Vault (retired works kept as archive), print catalogs as **PDF downloads** (McCurry), price ladders (George Irvine), display/framing guides (Mangelsen).
- For a static site with no cart: **"Available by inquiry" + mailto prefilled per work + a printable catalogue** = the same information architecture without a backend.

### 5. Commissions & trust
- Fine-art sites have no commission form; the best do **process pages**: Erin Hanson's "How to Commission" (references → size/colour dialog → signed agreement → 50% deposit), Ervans-style step pages. Trust blocks: signed, COA, insured shipping, worldwide delivery.
- **Conclusion:** keep formsubmit form, add a numbered 4-step process and trust strip (Signed / COA / Worldwide shipping).

### 6. Motion — budget of 2-3 signature moments
- Recurring, cheap-to-implement effects: **full-bleed crossfading artwork hero** (Kuvshinov, CSS keyframes), preloader wordmark (RossDraws "L O A D I N G ."), scroll reveals (JR's AOS, Oxman GSAP/ScrollTrigger), marquee band (Verstegen), animated counters (Beeple), optional ambient sound (WLOP — skipped for v2), 650ms background cross-fades (Eliasson).
- **Conclusion:** (1) preloader + crossfade hero, (2) scroll reveals + marquee + counters, (3) cursor-following preview. Nothing else.

---

## The mix for JagansArtfolio v2 — "Warm Noir"

| Element | Taken from | Applied as |
|---|---|---|
| Warm near-black + single gold accent | Lik gold / McCurry dark + Lozano `#1d1e20` | `#0c0b0a` base, gold `#b08d57` micro-accent, warm neutrals |
| Serif display + sans body + mono microlabels | McCurry / Erin Hanson / WLOP | Cormorant Garamond + Inter + JetBrains Mono 10px/0.3em tracked |
| Numbered section labels `/01…/05` | Peter Lik numbered mega-menu | "01 — About", "02 — Selected Works", … |
| Faceted archive with counts | OBEY print archive | gallery.html filter chips "Pencil (59)" etc., `?medium=` deep-links |
| Cursor-following preview over text index | Neri Oxman | "By Medium" list rows show floating artwork preview on hover |
| Full-bleed crossfading hero | Ilya Kuvshinov | Hero = 5 real artworks crossfading, dark scrim |
| Preloader wordmark | RossDraws | Letterspaced brand reveal, <1.2s, reduced-motion aware |
| Marquee band | Verstegen | "Original works ✦ Commissions open ✦ Signed & certified ✦ Worldwide shipping" |
| Scroll reveals + counters | JR / Beeple | IntersectionObserver fade-ups; 0→203 counter |
| Inquiry-first commerce | George Irvine / OBEY / McCurry | "Price on request", per-work "Inquire" mailto prefill, printable PDF catalogue (catalogue.html) |
| Process + trust for commissions | Erin Hanson / McCurry | 4-step numbered process, Signed / COA / Insured-worldwide strip |
| Newsletter as "new works" alert | James Jean / Erin Hanson | Footer + Acquire block, formsubmit wired |
| Exhibitions as credibility | Es Devlin / Lozano | Noted for next content update (needs Jagan's specifics) |

**Rejected on purpose:** ambient sound (WLOP), 3D/canvas particles, fullPage.js snapping, on-site cart (no backend), fabricated prices or sold-status.
