#!/usr/bin/env python3
"""Generate the Core & Advanced docs diagrams as light/dark SVG pairs.

One source of truth per diagram; the theme dict supplies colours so the two
variants can never drift apart. Output follows the repo's existing asset
convention: `name.svg` (light) and `name-dark.svg` (dark).

    python3 docs/scripts/gen-diagrams.py            # write the SVGs
    python3 docs/scripts/gen-diagrams.py --png DIR  # also rasterise 2x PNGs

The PNG step is only for pasting previews into issues and PRs, which cannot
render SVG. It shells out to headless Chrome and is skipped if none is found.
"""

import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "static", "img", "diagrams")

# Page backgrounds, used only when rasterising previews.
PAGE_BG = {"light": "#ffffff", "dark": "#232736"}

CHROME_CANDIDATES = (
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
)

SANS = "Lexend, Aeonik, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
MONO = "'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

# SWM palette, straight from docs/src/css/colors.css
LIGHT = dict(
    name="light",
    ink="#001a72",        # navy-light-100, body text
    muted="#6676aa",      # navy-light-60, secondary text
    faint="#919fcf",      # navy-light-40
    rule="#c1c6e5",       # navy-light-20, borders
    accent="#4b6cf4",     # cornflower-100
    accent_soft="#e6efff",  # cornflower-20
    accent_line="#7394ff",  # cornflower-80
    alt="#782aeb",        # purple-light-100
    alt_soft="#f5eeff",   # purple-light-20
    alt_line="#b58df1",   # purple-light-80
    ok="#57b495",         # green-light-100
    ok_soft="#ebfcf7",    # green-light-20
    warn="#ff6259",       # red-light-100
    surface="#ffffff",
    surface_alt="#f8f9ff",
)

DARK = dict(
    name="dark",
    ink="#eef0ff",        # navy-light-10
    muted="#abbcf5",      # navy-dark-40
    faint="#7485bd",      # navy-dark-60
    rule="#3851b4",       # cornflower-120
    accent="#7394ff",     # cornflower-80
    accent_soft="#23326f",  # cornflower-140
    accent_line="#4b6cf4",
    alt="#c49ffe",        # purple-dark-80
    alt_soft="#473d68",   # purple-dark-140
    alt_line="#b07eff",
    ok="#7adead",         # green-dark-80
    ok_soft="#2a4f4a",    # green-dark-140
    warn="#ff8b88",       # red-dark-80
    surface="#2b3048",
    surface_alt="#272b3c",
)


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def txt(x, y, s, fill, size=13, anchor="middle", font=SANS, weight="400", opacity=None, style=""):
    op = f' opacity="{opacity}"' if opacity is not None else ""
    st = f' font-style="{style}"' if style else ""
    return (f'<text x="{x}" y="{y}" fill="{fill}" font-family="{font}" font-size="{size}" '
            f'font-weight="{weight}" text-anchor="{anchor}"{op}{st}>{esc(s)}</text>')


def box(x, y, w, h, stroke, fill="none", r=10, sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>')


def arrow(x1, y1, x2, y2, color, marker="a", sw=1.6, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" marker-end="url(#{marker})"{d}/>')


def defs(t):
    """Arrow markers, one per color we actually use."""
    out = ['<defs>']
    for key, cid in (("accent", "a"), ("alt", "b"), ("muted", "c"), ("ok", "d")):
        out.append(
            f'<marker id="{cid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" '
            f'markerHeight="6" orient="auto-start-reverse">'
            f'<path d="M0,1 L9,5 L0,9 z" fill="{t[key]}"/></marker>')
    out.append('</defs>')
    return "".join(out)


def svg(w, h, t, body, title, desc):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" '
            f'height="{h}" role="img" aria-labelledby="t d">'
            f'<title id="t">{esc(title)}</title><desc id="d">{esc(desc)}</desc>'
            f'{defs(t)}{body}</svg>')


# ---------------------------------------------------------------- diagram A
def memory_model(t):
    W, H = 880, 392
    b = []
    div = 452

    # region backdrops
    b.append(box(24, 56, 372, 268, t["rule"], t["surface_alt"], r=14, sw=1.2, dash="6 6"))
    b.append(box(div + 32, 56, 372, 268, t["alt_line"], t["alt_soft"], r=14, sw=1.2, dash="6 6"))

    b.append(txt(210, 40, "JavaScript heap", t["muted"], 13, weight="600"))
    b.append(txt(div + 218, 40, "Native C++ heap", t["alt"], 13, weight="600"))

    # handles
    for i, (label, sub) in enumerate((("Tensor", "handle"), ("Model", "handle"))):
        y = 96 + i * 116
        b.append(box(96, y, 228, 76, t["accent"], t["surface"], r=12))
        b.append(txt(210, y + 32, label, t["ink"], 16, weight="600", font=MONO))
        b.append(txt(210, y + 54, sub, t["faint"], 12))

    # native objects
    natives = (
        ("float32 buffer", "1 x 3 x 224 x 224   ~588 KB"),
        ("Compiled program", "model.pte + delegates"),
    )
    for i, (label, sub) in enumerate(natives):
        y = 96 + i * 116
        b.append(box(div + 60, y, 316, 76, t["alt"], t["surface"], r=12))
        b.append(txt(div + 218, y + 32, label, t["ink"], 15, weight="600"))
        b.append(txt(div + 218, y + 54, sub, t["faint"], 12, font=MONO))
        b.append(arrow(330, y + 38, div + 54, y + 38, t["alt"], "b"))

    # the boundary
    b.append(f'<line x1="{div}" y1="24" x2="{div}" y2="344" stroke="{t["warn"]}" '
             f'stroke-width="1.6" stroke-dasharray="7 6"/>')
    b.append(f'<g transform="translate({div - 13},184) rotate(-90)">'
             + txt(0, 0, "GC visibility ends here", t["warn"], 12, weight="600")
             + '</g>')

    b.append(txt(24, 366, "The handle is a few bytes the GC tracks. The allocation it points to is not, "
                 "so it is freed only when you call dispose().",
                 t["muted"], 12.5, anchor="start"))
    return svg(W, H, t, "".join(b), "The memory model",
               "JavaScript heap holds lightweight Tensor and Model handles that point across the "
               "JSI boundary to buffers and compiled programs on the native C++ heap, which the "
               "JavaScript garbage collector cannot see.")


# ---------------------------------------------------------------- diagram B
def through_chain(t):
    W, H = 880, 268
    b = []
    nodes = (
        ("tImage", "uint8", "480 x 640 x 4"),
        ("tRgb", "uint8", "480 x 640 x 3"),
        ("tResized", "uint8", "224 x 224 x 3"),
        ("tChwU8", "uint8", "3 x 224 x 224"),
        ("tChw", "float32", "3 x 224 x 224"),
    )
    ops = ("cv.cvtColor", "cv.resize", "cv.toChannelsFirst", "cv.normalize")

    nw, gap, x0, ytop, nh = 130, 42, 31, 92, 84
    centers = []
    for i, (name, dt, shape) in enumerate(nodes):
        x = x0 + i * (nw + gap)
        last = i == len(nodes) - 1
        b.append(box(x, ytop, nw, nh, t["ok"] if last else t["accent"],
                     t["ok_soft"] if last else t["surface"], r=12))
        b.append(txt(x + nw / 2, ytop + 30, name, t["ink"], 14, weight="600", font=MONO))
        b.append(txt(x + nw / 2, ytop + 52, dt, t["accent"] if not last else t["ok"], 12, font=MONO))
        b.append(txt(x + nw / 2, ytop + 70, shape, t["faint"], 11.5, font=MONO))
        centers.append(x + nw / 2)

    for i, op in enumerate(ops):
        xa = x0 + i * (nw + gap) + nw + 7
        xb = xa + gap - 14
        b.append(arrow(xa, ytop + nh / 2, xb, ytop + nh / 2, t["accent"], "a"))
        b.append(txt((xa + xb) / 2, ytop - 16, op, t["ink"], 11.5, font=MONO, weight="600"))
        b.append(txt((xa + xb) / 2, ytop + nh + 26, "dst", t["faint"], 10.5, font=MONO))

    b.append(f'<line x1="{x0}" y1="48" x2="{x0 + 4 * (nw + gap) + nw}" y2="48" '
             f'stroke="{t["rule"]}" stroke-width="1.2" stroke-dasharray="4 5"/>')
    b.append(txt(x0, 38, "allocated once, reused on every frame", t["muted"], 12, anchor="start"))

    b.append(txt(x0, 244, "Each operation writes into the destination you pass and returns it, so one "
                 "step's dst is the next step's src. Nothing is allocated mid-chain.",
                 t["muted"], 12.5, anchor="start"))
    return svg(W, H, t, "".join(b), "Chaining transformations with through",
               "Five pre-allocated tensors connected by four cv operations, each writing into the "
               "next buffer and returning it, ending in a normalized float32 CHW tensor.")


# ---------------------------------------------------------------- diagram C
def execution_contexts(t):
    """Three thread lanes on the left, one shared native heap column on the right."""
    W, H = 880, 478
    b = []
    lx, lw, lh = 20, 570, 92
    ys = (56, 196, 336)
    lanes = (
        ("Main JS thread", "React render, state, business logic",
         "await wrapAsync(fn)(...)", t["accent"]),
        ("defaultWorkletRuntime", "background loading and inference",
         "loadModel / execute run here", t["accent"]),
        ("UI worklet runtime", "camera frame processors",
         "classifyWorklet(frame)  no Promise", t["ok"]),
    )

    for (name, sub, code, col), y in zip(lanes, ys):
        b.append(box(lx, y, lw, lh, col, t["surface"], r=12))
        b.append(txt(lx + 22, y + 34, name, t["ink"], 13.5, anchor="start", weight="600"))
        b.append(txt(lx + 22, y + 55, sub, t["faint"], 11.5, anchor="start"))
        b.append(txt(lx + 22, y + 79, code, col, 11.5, anchor="start", font=MONO))

    # wrapAsync round trip, in the gap between lane 0 and lane 1
    g0, g1 = ys[0] + lh, ys[1]
    b.append(arrow(452, g0 + 8, 452, g1 - 8, t["accent"], "a"))
    b.append(arrow(516, g1 - 8, 516, g0 + 8, t["accent"], "a", dash="5 5"))
    b.append(txt(438, g0 + 22, "wrapAsync", t["ink"], 11.5, anchor="end", font=MONO, weight="600"))
    b.append(txt(438, g0 + 38, "dispatches", t["faint"], 11, anchor="end"))
    b.append(txt(532, g0 + 22, "Promise", t["ink"], 11.5, anchor="start", weight="600"))
    b.append(txt(532, g0 + 38, "resolves back", t["faint"], 11, anchor="start"))

    # shared native heap column on the right, touched by all three lanes
    cx, cw = 646, 214
    ctop, cbot = 40, ys[2] + lh + 4
    b.append(box(cx, ctop, cw, cbot - ctop, t["alt"], t["alt_soft"], r=14, sw=1.4, dash="6 6"))
    b.append(txt(cx + cw / 2, ctop + 30, "Native C++ heap", t["alt"], 13, weight="600"))
    for i, line in enumerate(("compiled program", "tensor buffers")):
        b.append(txt(cx + cw / 2, ctop + 58 + i * 22, line, t["ink"], 12.5, font=MONO))
    b.append(txt(cx + cw / 2, cbot - 54, "one allocation,", t["faint"], 11.5))
    b.append(txt(cx + cw / 2, cbot - 36, "three readers", t["faint"], 11.5))

    for y in ys:
        b.append(arrow(lx + lw + 6, y + lh / 2, cx - 8, y + lh / 2, t["alt"], "b",
                       sw=1.3, dash="4 5"))

    b.append(txt(lx, H - 18, "Handles are valid in every runtime and cost nothing to pass across one.\n"
                 .strip() + " The bytes they point at never move.",
                 t["muted"], 12.5, anchor="start"))
    return svg(W, H, t, "".join(b), "Execution contexts",
               "Three execution lanes on the left, the main JS thread, the default worklet runtime "
               "and the UI worklet runtime, all pointing at a single shared native C++ heap column "
               "on the right; wrapAsync dispatches from the JS thread and resolves a Promise back.")


# ---------------------------------------------------------------- diagram D
def spec_matching(t):
    """Left to right: exported spec, ordered allowed variants, resulting match."""
    W, H = 880, 330
    b = []

    # column 1: what the model exports
    b.append(txt(16, 40, "model.schema  (exported)", t["alt"], 13, anchor="start", weight="600"))
    b.append(box(16, 56, 252, 150, t["alt"], t["alt_soft"], r=12))
    b.append(txt(38, 88, "forward", t["ink"], 13, anchor="start", font=MONO, weight="600"))
    b.append(txt(38, 118, "in   f32[1,3,224,224]", t["ink"], 12, anchor="start", font=MONO))
    b.append(txt(38, 142, "out  f32[1,1000]", t["ink"], 12, anchor="start", font=MONO))
    b.append(txt(38, 176, "every dim concrete", t["faint"], 11.5, anchor="start"))

    # column 2: the variants a pipeline allows, tried in order
    b.append(txt(310, 40, "allowed variants", t["accent"], 13, anchor="start", weight="600"))
    variants = (
        ("batched", "f32(1, 3, 'H', 'W') -> f32(1, 'N')", True),
        ("unbatched", "f32(3, 'H', 'W') -> f32('N')", False),
    )
    for i, (key, sig, hit) in enumerate(variants):
        y = 56 + i * 86
        col = t["ok"] if hit else t["rule"]
        b.append(box(310, y, 330, 68, col, t["ok_soft"] if hit else "none", r=12,
                     dash=None if hit else "5 5"))
        b.append(txt(328, y + 26, key, t["ink"] if hit else t["faint"], 12.5,
                     anchor="start", font=MONO, weight="600"))
        b.append(txt(622, y + 26, "matches" if hit else "not tried", col, 11,
                     anchor="end", weight="600"))
        b.append(txt(328, y + 50, sig, t["ink"] if hit else t["faint"], 11.5,
                     anchor="start", font=MONO))
        b.append(arrow(272, 112 + i * 22, 304, y + 34, t["ok"] if hit else t["muted"],
                       "d" if hit else "c", sw=1.6 if hit else 1.1,
                       dash=None if hit else "4 5"))

    # column 3: what came back
    b.append(txt(676, 40, "SpecMatch", t["accent"], 13, anchor="start", weight="600"))
    b.append(box(676, 56, 184, 118, t["accent"], t["surface"], r=12))
    b.append(txt(694, 84, "variant", t["faint"], 11.5, anchor="start"))
    b.append(txt(694, 104, "'batched'", t["ink"], 12.5, anchor="start", font=MONO))
    b.append(txt(694, 132, "dims", t["faint"], 11.5, anchor="start"))
    b.append(txt(694, 152, "H=224 W=224 N=1000", t["ink"], 12, anchor="start", font=MONO))
    b.append(arrow(646, 90, 670, 100, t["accent"], "a"))

    b.append(txt(310, 232, "Variants are tried in order and the first match wins.",
                 t["muted"], 12.5, anchor="start"))
    b.append(txt(16, 268, "Matching compares dimension domains, never runtime values. That is why "
                 "relating two actual sizes",
                 t["muted"], 12.5, anchor="start"))
    b.append(txt(16, 288, "at execution time needs a separate runtime constraint.",
                 t["muted"], 12.5, anchor="start"))
    return svg(W, H, t, "".join(b), "Validating an exported spec against allowed variants",
               "A model's exported concrete schema on the left is checked against two allowed "
               "symbolic variants in the middle; the first matches and returns a SpecMatch on the "
               "right binding H, W and N to concrete constants.")


def find_chrome():
    for c in CHROME_CANDIDATES:
        if os.path.exists(c):
            return c
        found = subprocess.run(["which", c], capture_output=True, text=True)
        if found.returncode == 0:
            return found.stdout.strip()
    return None


def rasterise(svg_path, png_path, height, bg, chrome):
    """Render one SVG to a 2x PNG on a solid page background."""
    html = os.path.splitext(png_path)[0] + ".html"
    with open(html, "w") as f:
        f.write(f'<html><body style="margin:0;background:{bg}">'
                f'<img src="file://{os.path.abspath(svg_path)}" width="880"></body></html>')
    subprocess.run([chrome, "--headless", "--disable-gpu", "--allow-file-access-from-files",
                    "--force-device-scale-factor=2", "--hide-scrollbars",
                    f"--screenshot={png_path}", f"--window-size=880,{height}", html],
                   capture_output=True)
    os.remove(html)


def viewbox_height(svg_path):
    import re
    m = re.search(r'viewBox="0 0 \d+ (\d+)"', open(svg_path).read())
    return int(m.group(1))


DIAGRAMS = {
    "memory-model": memory_model,
    "through-chain": through_chain,
    "execution-contexts": execution_contexts,
    "spec-matching": spec_matching,
}

if __name__ == "__main__":
    png_dir = None
    if "--png" in sys.argv:
        i = sys.argv.index("--png")
        png_dir = sys.argv[i + 1] if len(sys.argv) > i + 1 else "diagram-previews"
        os.makedirs(png_dir, exist_ok=True)

    chrome = find_chrome() if png_dir else None
    if png_dir and not chrome:
        print("no Chrome found, writing SVGs only")
        png_dir = None

    os.makedirs(OUT, exist_ok=True)
    for name, fn in DIAGRAMS.items():
        for theme in (LIGHT, DARK):
            suffix = "" if theme["name"] == "light" else "-dark"
            path = os.path.normpath(os.path.join(OUT, f"{name}{suffix}.svg"))
            with open(path, "w") as f:
                f.write(fn(theme) + "\n")
            print("wrote", path)

            if png_dir:
                png = os.path.join(png_dir, f"{name}{suffix}.png")
                rasterise(path, png, viewbox_height(path), PAGE_BG[theme["name"]], chrome)
                print("wrote", png)
