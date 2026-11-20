from pathlib import Path
from PIL import Image, ImageDraw
import math
import random
import hashlib

W, H, ROAD = 360, 250, 192
BAYER = (
    (0, 8, 2, 10),
    (12, 4, 14, 6),
    (3, 11, 1, 9),
    (15, 7, 13, 5),
)


def rgb(color):
    if isinstance(color, str):
        color = color.lstrip("#")
        return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))
    return tuple(color[:3])


def tint(color, amount):
    return tuple(max(0, min(255, c + amount)) for c in rgb(color))


def gradient(im, stops, bottom=ROAD):
    pixels = im.load()
    stops = [(y, rgb(c)) for y, c in stops]
    for y in range(bottom):
        for i in range(len(stops) - 1):
            ya, ca = stops[i]
            yb, cb = stops[i + 1]
            if ya <= y <= yb:
                break
        else:
            ca = cb = stops[-1][1]
            ya, yb = y, y + 1
        t = max(0.0, min(1.0, (y - ya) / max(1, yb - ya)))
        # A restricted palette with Bayer transitions between discrete bands.
        scaled = t * 5
        band = math.floor(scaled)
        fraction = scaled - band
        for x in range(W):
            q = (band + (fraction > (BAYER[y % 4][x % 4] + .5) / 16)) / 5
            pixels[x, y] = tuple(
                round(a + (b - a) * q) for a, b in zip(ca, cb)
            ) + (255,)


def glow(im, cx, cy, radius, color, strength=100):
    color = rgb(color)
    overlay = Image.new("RGBA", im.size)
    p = overlay.load()
    for y in range(max(0, cy - radius), min(im.height, cy + radius + 1)):
        for x in range(max(0, cx - radius), min(im.width, cx + radius + 1)):
            r = math.hypot(x - cx, y - cy) / radius
            if r >= 1:
                continue
            value = (1 - r) ** 2 * strength
            level = int(value / 18)
            remainder = value / 18 - level
            alpha = (level + (remainder > (BAYER[y % 4][x % 4] + .5) / 16)) * 18
            if alpha:
                p[x, y] = color + (min(255, alpha),)
    im.alpha_composite(overlay)


def ridge(d, points, color, bottom=ROAD):
    d.polygon([(points[0][0], bottom)] + points +
              [(points[-1][0], bottom)], fill=color)


def hill(d, cy, amplitude, phase, color):
    points = [
        (x, round(cy + math.sin(x / 61 + phase) * amplitude
                  + math.sin(x / 29 + phase) * amplitude * .22))
        for x in range(-4, W + 5, 4)
    ]
    ridge(d, points, color)


def cloud(d, x, y, scale=1, colors=("#b6c8d6", "#dae6df", "#fff3d0")):
    def rect(box, c):
        d.rectangle(tuple(round(v * scale) + (x if i % 2 == 0 else y)
                          for i, v in enumerate(box)), fill=c)
    rect((3, 8, 47, 14), colors[0])
    rect((9, 4, 38, 12), colors[1])
    rect((16, 0, 29, 10), colors[1])
    rect((29, 3, 40, 11), colors[1])
    rect((0, 9, 51, 11), colors[1])
    rect((17, 0, 27, 2), colors[2])
    rect((10, 4, 18, 5), colors[2])
    rect((31, 3, 36, 4), colors[2])
    rect((5, 9, 12, 10), colors[2])
    rect((15, 12, 40, 14), colors[0])


def pine(d, x, base, height, palette, snow=False):
    dark, mid, light = palette
    d.rectangle((x - 1, base - height // 3, x + 1, base), fill=dark)
    top = base - height
    for i in range(4):
        y = top + int(height * (.10 + i * .19))
        width = max(3, int(height * (.12 + i * .055)))
        bottom = y + int(height * .34)
        d.polygon([(x, y), (x - width, bottom),
                   (x + width, bottom)], fill=dark)
        d.polygon([(x - 1, y + 2), (x - width + 2, bottom - 2),
                   (x + 1, bottom - 2)], fill=mid)
        d.line((x - 1, y + 3, x - width + 3, bottom - 3), fill=light)
        if snow:
            d.line((x, y + 1, x - width + 2, bottom - 4),
                   fill="#c7e2e7", width=2)
            d.line((x, y + 2, x + width // 2, y + height // 6),
                   fill="#f0f2df")


def oak(d, rng, x, base, size, palette):
    shadow, dark, mid, light = palette
    d.rectangle((x - 2, base - size // 2, x + 2, base), fill="#493c32")
    d.line((x, base - 3, x - 1, base - size // 2), fill="#92724b")
    for dx, dy, r in [(-.25, -.56, .27), (.24, -.60, .30),
                      (0, -.82, .30), (0, -.48, .34)]:
        cx, cy = x + int(dx * size), base + int(dy * size)
        rad = max(3, int(size * r))
        d.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), fill=shadow)
        d.ellipse((cx - rad, cy - rad, cx + rad - 2, cy + rad - 3), fill=dark)
        for _ in range(max(8, size)):
            px, py = rng.randint(cx - rad, cx + rad), rng.randint(cy - rad, cy + rad)
            if (px - cx) ** 2 + (py - cy) ** 2 < (rad - 1) ** 2:
                c = light if py < cy - rad // 4 and rng.random() < .45 else mid
                d.rectangle((px, py, px + rng.randint(1, 3), py + 1), fill=c)


def rock(d, x, y, size, palette):
    a, b, c = palette
    d.polygon([(x - size, y), (x - size + 2, y - size // 2),
               (x - size // 3, y - size), (x + size // 2, y - size + 2),
               (x + size, y - size // 3), (x + size - 2, y)], fill=a)
    d.polygon([(x - size + 2, y - size // 2), (x - size // 3, y - size),
               (x + size // 2, y - size + 2), (x + 2, y - 3)], fill=b)
    d.line((x - size + 3, y - size // 2, x - size // 3, y - size + 1,
            x + size // 2, y - size + 3), fill=c)


def grass(d, rng, y, palette, count=180):
    for _ in range(count):
        x = rng.randrange(W)
        yy = y + rng.randrange(-3, 4)
        c = rng.choice(palette)
        h = rng.randrange(2, 7)
        d.line((x, yy, x - rng.choice([-2, -1, 1, 2]), yy - h), fill=c)
        if rng.random() < .35:
            d.line((x, yy, x + 3, yy - 3), fill=c)


def flame(im, x, y, scale=1):
    glow(im, x, y - 5 * scale, 20 * scale, "#ffad3c", 150)
    d = ImageDraw.Draw(im)
    def poly(points, c):
        d.polygon([(x + a * scale, y + b * scale) for a, b in points], fill=c)
    poly([(-4, 0), (-5, -6), (-2, -10), (-1, -16), (2, -11),
          (2, -6), (5, -10), (5, -3), (2, 1)], "#bf3c2e")
    poly([(-3, -1), (-3, -6), (0, -12), (1, -7), (3, -5),
          (2, 0)], "#ff972e")
    poly([(-1, 0), (-1, -5), (1, -8), (2, -2), (1, 0)], "#fff3a3")
    d.point((x - 3 * scale, y - 18 * scale), fill="#ffc85b")


def brazier(im, x, y):
    flame(im, x, y - 8)
    d = ImageDraw.Draw(im)
    d.rectangle((x - 1, y - 8, x + 1, y + 5), fill="#272c37")
    d.polygon([(x - 6, y - 10), (x + 6, y - 10),
               (x + 3, y - 5), (x - 3, y - 5)], fill="#29303a")
    d.line((x - 5, y - 10, x + 5, y - 10), fill="#a68557")
    d.line((x - 1, y - 5, x - 1, y + 3), fill="#8a6848")
    d.rectangle((x - 4, y + 4, x + 4, y + 6), fill="#32343d")


def road(im, rng, theme):
    palettes = {
        "dawn": ("#48554b", ["#8e977f", "#a2a78c", "#b5b095", "#959b83"], "#d4c9a0", "#737f6a"),
        "amber": ("#704639", ["#bd895e", "#cb9968", "#aa7855", "#d1a073"], "#efd097", "#956444"),
        "mire": ("#152b2b", ["#354d48", "#425952", "#2e4544", "#4d6155"], "#75836b", "#253b35"),
        "frost": ("#293e50", ["#667d88", "#748b94", "#82959a", "#5b7483"], "#c7dadd", "#415b6b"),
        "cinder": ("#161820", ["#323039", "#3b3540", "#2b2a34", "#453941"], "#69545a", "#24232d"),
    }
    grout, stones, highlight, shade = palettes[theme]
    d = ImageDraw.Draw(im)
    d.rectangle((0, ROAD, W - 1, H - 1), fill=grout)
    rows = [192, 197, 204, 213, 224, 237, 251]
    for row_index, (top, bottom) in enumerate(zip(rows, rows[1:])):
        height = bottom - top
        x = -rng.randint(5, 22)
        while x < W:
            width = rng.randint(14 + row_index * 3, 25 + row_index * 5)
            right = x + width
            y = top + 1
            color = rng.choice(stones)
            d.polygon([(x + 2, y), (right - 3, y), (right - 1, y + 2),
                       (right - 2, bottom - 2), (x + 2, bottom - 1),
                       (x, bottom - 3), (x, y + 2)], fill=color)
            d.line((x + 3, y, right - 4, y), fill=highlight)
            d.line((x + 1, y + 2, x + 1, bottom - 3), fill=tint(color, 12))
            d.line((x + 3, bottom - 2, right - 3, bottom - 2), fill=shade)
            for _ in range(width * max(1, height - 2) // 16):
                px = rng.randint(x + 2, max(x + 2, right - 3))
                py = rng.randint(y + 1, max(y + 1, bottom - 3))
                d.point((px, py), fill=tint(color, rng.choice([-18, -10, 13, 20])))
            if row_index > 1 and rng.random() < .25:
                px = x + width // 2
                d.line((px, y + 1, px - 2, y + height // 2,
                        px + 1, bottom - 2), fill=grout)
            if theme == "frost" and rng.random() < .7:
                d.line((x + 3, y, right - 4, y), fill="#edf1e8")
                d.line((x + 5, y + 1, right - 7, y + 1), fill="#b8d3dc")
            if theme == "mire" and rng.random() < .55:
                for _ in range(4):
                    px = rng.randint(x + 2, max(x + 2, right - 4))
                    d.rectangle((px, y, px + 2, y + 1),
                                fill=rng.choice(["#52664b", "#68794e", "#3a5944"]))
            x = right
    if theme == "cinder":
        for start in [23, 109, 238, 319]:
            x, y = start, 194 + rng.randint(0, 12)
            points = [(x, y)]
            while y < H:
                x += rng.randint(-9, 9)
                y += rng.randint(4, 10)
                points.append((x, y))
            d.line(points, fill="#7c302d", width=4)
            d.line(points, fill="#f0662e", width=2)
            d.line(points, fill="#ffb64d")
            for px, py in points[1:-1:2]:
                d.line((px, py, px + 7, py - 4, px + 10, py - 3),
                       fill="#e3572b")
    # The far edge is level with the actors' walking baseline.
    d.line((0, ROAD, W - 1, ROAD), fill=highlight)


def castle(d, x, y, scale=1, palette=("#536b8c", "#6e86a0", "#a6b8bf")):
    dark, mid, light = palette
    def box(b, c):
        d.rectangle(tuple(round(v * scale) + (x if i % 2 == 0 else y)
                          for i, v in enumerate(b)), fill=c)
    def poly(p, c):
        d.polygon([(x + round(a * scale), y + round(b * scale)) for a, b in p], fill=c)
    box((-24, -24, 25, 0), dark)
    box((-23, -23, 21, -3), mid)
    for tx, height in [(-25, 31), (-12, 39), (6, 48), (23, 34)]:
        box((tx - 4, -height, tx + 4, 0), dark)
        box((tx - 3, -height, tx, -3), mid)
        poly([(tx - 6, -height), (tx, -height - 10),
              (tx + 6, -height)], dark)
        box((tx - 1, -height + 8, tx, -height + 13), dark)
        box((tx - 4, -height, tx + 3, -height), light)
    for tx in range(-20, 25, 7):
        box((tx, -28, tx + 3, -24), mid)
    box((2, -14, 10, 0), dark)
    poly([(2, -14), (6, -18), (10, -14)], dark)
    box((6, -64, 6, -59), mid)
    poly([(7, -64), (17, -62), (7, -60)], "#6e91ae")


def dawnstep():
    rng = random.Random(1741)
    im = Image.new("RGBA", (W, H))
    gradient(im, [(0, "#4e91b9"), (45, "#83bdd2"),
                  (93, "#d2dfc7"), (137, "#f4dca0"), (192, "#a4c39b")])
    glow(im, 279, 57, 53, "#ffe5a1", 150)
    d = ImageDraw.Draw(im)
    for a in range(0, 360, 30):
        r = math.radians(a)
        x, y = round(279 + math.cos(r) * 21), round(57 + math.sin(r) * 21)
        xx, yy = round(279 + math.cos(r) * 28), round(57 + math.sin(r) * 28)
        d.line((x, y, xx, yy), fill="#f7df9c", width=2)
    d.ellipse((264, 42, 294, 72), fill="#f7d489")
    d.ellipse((267, 44, 291, 68), fill="#fff0b2")
    d.rectangle((273, 43, 286, 45), fill="#fff8d0")
    cloud(d, 25, 28, 1.0)
    cloud(d, 139, 18, .8)
    cloud(d, 306, 78, .8, ("#c7d6c7", "#e9e9ce", "#fff2cd"))
    cloud(d, 80, 65, .65)
    ridge(d, [(-5, 135), (24, 117), (41, 125), (72, 96), (95, 113),
              (123, 79), (146, 107), (170, 91), (198, 127), (225, 110),
              (256, 133), (294, 104), (327, 125), (365, 109)], "#90afb8")
    ridge(d, [(-4, 153), (39, 131), (70, 144), (105, 119), (137, 131),
              (179, 114), (218, 147), (254, 129), (307, 149), (365, 132)], "#6e94a4")
    castle(d, 124, 105, .70)
    d.line((4, 145, 95, 145), fill="#b4cebf")
    d.line((165, 138, 273, 138), fill="#a8c5b8")
    hill(d, 158, 10, .3, "#62957b")
    hill(d, 174, 10, 2.1, "#3d785c")
    for x in range(-4, 371, 14):
        pine(d, x, 170 + rng.randint(-3, 4), rng.randint(18, 32),
             ("#3e6a61", "#4b7c68", "#6a9779"))
    hill(d, 183, 6, .8, "#376747")
    for x, size in [(10, 48), (43, 38), (324, 43), (350, 57)]:
        oak(d, rng, x, 190, size, ("#234d3d", "#306443", "#4a8050", "#84a65c"))
    for x in [66, 84, 297, 313]:
        pine(d, x, 190, rng.randint(24, 40), ("#264b3c", "#32654a", "#74a267"))
    road(im, rng, "dawn")
    d = ImageDraw.Draw(im)
    grass(d, rng, 191, ["#326344", "#5e874e", "#9bb469"], 170)
    # Directional sign with visible timber grain and a blue royal pennant.
    d.rectangle((78, 151, 81, 191), fill="#543b2e")
    d.line((79, 152, 79, 190), fill="#b9955d")
    d.polygon([(65, 155), (88, 155), (94, 160), (88, 165), (65, 165)], fill="#674b33")
    d.line((66, 156, 87, 156, 91, 160), fill="#c3a16b")
    d.line((68, 162, 85, 162), fill="#987044")
    d.point((79, 158), fill="#e2ca91")
    d.point((79, 163), fill="#2b3030")
    d.rectangle((107, 137, 108, 191), fill="#4e4a38")
    d.line((107, 137, 107, 190), fill="#cfbd7a")
    d.polygon([(109, 140), (125, 143), (139, 140), (135, 151),
               (140, 157), (124, 158), (109, 153)], fill="#244879")
    d.polygon([(110, 141), (125, 144), (137, 142), (133, 148),
               (122, 148), (110, 146)], fill="#3d78af")
    d.line((111, 152, 124, 156, 137, 155), fill="#668fb8")
    d.polygon([(116, 146), (118, 148), (120, 146), (120, 151),
               (116, 151)], fill="#e5c675")
    for _ in range(20):
        x = rng.randrange(W)
        d.point((x, rng.randint(186, 191)), fill="#e8d69b")
    return im


def mesa(d, x, top, width, base, palette, rng):
    dark, mid, light = palette
    pts = [(x - 8, base), (x + 1, top + 19), (x + 7, top + 18),
           (x + 10, top), (x + width - 12, top),
           (x + width - 8, top + 10), (x + width, top + 12),
           (x + width + 12, base)]
    d.polygon(pts, fill=dark)
    d.polygon([(x + 10, top + 1), (x + width - 13, top + 1),
               (x + width - 11, top + 13), (x + width - 2, top + 17),
               (x + width + 5, base), (x + width // 2, base),
               (x + width // 2 - 4, top + 22), (x + 5, top + 22)], fill=mid)
    d.line((x + 11, top, x + width - 13, top), fill=light, width=2)
    for yy in range(top + 25, base - 2, 8):
        xx = x + rng.randint(0, 10)
        d.line((xx, yy, x + width + (yy - top) // 15, yy + 1),
               fill=rng.choice([dark, light, mid]))
    for _ in range(12):
        xx = rng.randint(x + 12, max(x + 12, x + width - 12))
        yy = rng.randint(top + 6, max(top + 6, base - 5))
        d.line((xx, yy, xx + 1, min(base, yy + rng.randint(4, 18))), fill=dark)


def cactus(d, x, base, height):
    dark, mid, light = "#344c43", "#4e6850", "#8b9060"
    d.line((x, base, x, base - height), fill=dark, width=7)
    d.line((x - 1, base - 1, x - 1, base - height + 1), fill=mid, width=3)
    d.line((x - 2, base - 3, x - 2, base - height + 2), fill=light)
    for side, frac in [(-1, .55), (1, .72)]:
        yy = base - int(height * frac)
        d.line((x, yy + 6, x + side * 8, yy + 6, x + side * 8, yy - 4),
               fill=dark, width=5)
        d.line((x + side * 7, yy + 4, x + side * 7, yy - 3),
               fill=mid, width=2)
    d.point((x + 2, base - height + 7), fill=light)


def amber_canyon():
    rng = random.Random(2889)
    im = Image.new("RGBA", (W, H))
    gradient(im, [(0, "#302844"), (43, "#75405d"), (82, "#bd555c"),
                  (126, "#eb885b"), (164, "#f4b46c"), (192, "#8e5550")])
    glow(im, 233, 104, 69, "#ffb653", 130)
    d = ImageDraw.Draw(im)
    d.ellipse((203, 74, 263, 134), fill="#f4a359")
    d.ellipse((207, 77, 259, 130), fill="#ffd180")
    for yy in [89, 103, 117, 126]:
        d.line((204, yy, 262, yy), fill="#efab65")
    for x, y, width in [(17, 43, 68), (88, 62, 51), (264, 32, 73)]:
        d.rectangle((x, y, x + width, y + 2), fill="#925066")
        d.rectangle((x + 9, y - 2, x + width - 15, y), fill="#744460")
        d.line((x + 10, y + 3, x + width - 7, y + 3), fill="#ce7274")
    mesa(d, -17, 97, 83, 174, ("#754b62", "#8c5568", "#b16b71"), rng)
    mesa(d, 103, 122, 64, 176, ("#8a5360", "#9f6066", "#c57a70"), rng)
    mesa(d, 282, 87, 81, 178, ("#70445c", "#8b4d60", "#c1736d"), rng)
    # Construct the arch on its own layer so its opening reveals the sunset.
    arch = Image.new("RGBA", im.size)
    a = ImageDraw.Draw(arch)
    a.polygon([(151, 183), (159, 121), (171, 101), (186, 94),
               (212, 94), (228, 102), (239, 127), (247, 183)],
              fill="#a05b4d")
    a.ellipse((165, 97, 235, 156), fill="#b96d50")
    a.ellipse((179, 113, 221, 163), fill=(0, 0, 0, 0))
    a.rectangle((179, 139, 221, 185), fill=(0, 0, 0, 0))
    a.line((160, 124, 172, 104, 187, 97, 211, 97, 224, 104),
           fill="#e2a16c", width=3)
    a.line((174, 120, 181, 108, 198, 103, 213, 108), fill="#d18b5a")
    for yy in [132, 143, 156, 170]:
        a.line((159, yy, 175, yy - 1), fill="#78473e")
        a.line((225, yy, 240, yy + 1), fill="#854637")
    im.alpha_composite(arch)
    d = ImageDraw.Draw(im)
    ridge(d, [(0, 170), (41, 157), (86, 167), (126, 151),
              (155, 165), (198, 180), (246, 166), (287, 157),
              (331, 170), (360, 163)], "#865548")
    # Timber watchtower.
    for xx in [61, 79]:
        d.line((xx, 151, xx - (3 if xx == 61 else -3), 109),
               fill="#463d3c", width=3)
    d.line((59, 146, 81, 116), fill="#5b453e", width=2)
    d.line((62, 116, 79, 144), fill="#5b453e", width=2)
    d.rectangle((56, 106, 85, 112), fill="#4d3a37")
    d.line((56, 106, 85, 106), fill="#b87e55")
    d.rectangle((59, 95, 82, 105), fill="#5d453e")
    d.rectangle((63, 96, 78, 103), fill="#332f36")
    d.polygon([(54, 95), (70, 85), (87, 95)], fill="#49373b")
    d.line((55, 94, 70, 86, 85, 94), fill="#9f6e55")
    hill(d, 185, 5, .2, "#a36e4d")
    for x, height in [(19, 32), (46, 21), (294, 28), (334, 42)]:
        cactus(d, x, 191, height)
    rock(d, 106, 189, 13, ("#815443", "#b17b54", "#dba477"))
    rock(d, 266, 190, 11, ("#7f5243", "#ab7653", "#d79b6a"))
    road(im, rng, "amber")
    d = ImageDraw.Draw(im)
    for _ in range(95):
        x, y = rng.randrange(W), rng.randint(185, 194)
        d.point((x, y), fill=rng.choice(["#76523e", "#d5ac73", "#b78b58"]))
    for x in [4, 91, 146, 283, 354]:
        d.line((x, 192, x - 2, 187), fill="#b49b61")
        d.line((x, 192, x + 3, 188), fill="#c2a36d")
    return im


def willow(d, rng, x, base, height, palette):
    dark, mid, moss = palette
    top = base - height
    d.polygon([(x - 6, base), (x - 4, base - 26), (x - 10, top + 23),
               (x - 5, top + 8), (x, top + 19), (x + 3, base - 28),
               (x + 8, base)], fill=dark)
    d.line((x - 2, base - 2, x - 1, base - 29, x - 7, top + 24),
           fill=mid, width=2)
    for side in [-1, 1]:
        d.line((x - 2, top + 28, x + side * 15, top + 10,
                x + side * 30, top + 17), fill=dark, width=5)
        d.line((x + side * 11, top + 16, x + side * 28, top + 7),
               fill=dark, width=3)
    for _ in range(33):
        xx = x + rng.randint(-34, 34)
        yy = top + 9 + abs(xx - x) // 5 + rng.randint(-5, 9)
        length = rng.randint(14, 36)
        d.rectangle((xx - 3, yy, xx + 3, yy + 4), fill=dark)
        d.line((xx, yy, xx + rng.choice([-2, 0, 2]), yy + length),
               fill=mid, width=2)
        d.line((xx - 1, yy + 5, xx - 1, yy + length - 4), fill=moss)
        for sy in range(yy + 7, yy + length, 5):
            d.point((xx + 2, sy), fill=moss)


def lantern(im, x, base):
    d = ImageDraw.Draw(im)
    d.rectangle((x - 1, base - 35, x + 1, base), fill="#282f2c")
    d.line((x - 1, base - 34, x - 1, base - 2), fill="#78704c")
    d.line((x, base - 35, x + 8, base - 35, x + 8, base - 30),
           fill="#69715a")
    cy = base - 25
    glow(im, x + 8, cy, 24, "#ffc46a", 140)
    d = ImageDraw.Draw(im)
    d.rectangle((x + 4, cy - 5, x + 12, cy + 5), fill="#1b302e")
    d.rectangle((x + 5, cy - 3, x + 11, cy + 3), fill="#d58b3c")
    d.rectangle((x + 7, cy - 3, x + 9, cy + 2), fill="#ffe4a0")
    d.polygon([(x + 3, cy - 5), (x + 8, cy - 9),
               (x + 13, cy - 5)], fill="#34433a")
    d.line((x + 4, cy + 5, x + 12, cy + 5), fill="#9c8757")


def mirewood():
    rng = random.Random(3813)
    im = Image.new("RGBA", (W, H))
    gradient(im, [(0, "#102c3b"), (64, "#204654"),
                  (125, "#41676b"), (192, "#243e40")])
    glow(im, 232, 43, 41, "#b5ded0", 90)
    d = ImageDraw.Draw(im)
    d.ellipse((217, 28, 247, 58), fill="#9cbbb1")
    d.ellipse((220, 29, 246, 54), fill="#d7ddbd")
    d.rectangle((225, 34, 230, 37), fill="#b9c8b2")
    d.rectangle((237, 44, 242, 48), fill="#b3c5b1")
    for x in range(-10, 380, 21):
        top = rng.randint(35, 95)
        d.polygon([(x - 3, 173), (x - 2, top + 14), (x - 9, top),
                   (x, top + 9), (x + 7, top - 8), (x + 2, top + 22),
                   (x + 4, 173)], fill="#284c54")
        d.line((x, top + 33, x + 10, top + 20), fill="#284c54", width=2)
    for x in [14, 81, 168, 290, 347]:
        willow(d, rng, x, 177, rng.randint(65, 98),
               ("#24474a", "#305455", "#446a60"))
    # Thin broken mist ribbons cross the trunks.
    for y, c in [(79, "#557b7b"), (116, "#4e7471"), (147, "#567a71")]:
        for _ in range(9):
            x = rng.randrange(-30, W)
            length = rng.randint(18, 74)
            d.line((x, y, x + length, y), fill=c)
            d.line((x + 7, y + 2, x + length - 10, y + 2),
                   fill=tint(c, -7))
    hill(d, 174, 5, .8, "#1e3c3b")
    d.rectangle((0, 177, W, 191), fill="#172f33")
    for _ in range(150):
        x, y = rng.randrange(W), rng.randint(178, 191)
        d.line((x, y, x + rng.randint(2, 10), y),
               fill=rng.choice(["#284b4b", "#355653", "#40605a"]))
    for x, height in [(27, 126), (333, 137)]:
        willow(d, rng, x, 191, height,
               ("#102b2d", "#254139", "#46614b"))
    for x in [67, 164, 267]:
        lantern(im, x, 189)
        d = ImageDraw.Draw(im)
        for j in range(4):
            yy = 180 + j * 3
            half = 2 + j
            d.line((x + 8 - half, yy, x + 8 + half, yy),
                   fill=["#a9864b", "#806f43", "#6c6540", "#4e5740"][j])
    d = ImageDraw.Draw(im)
    for _ in range(36):
        x, y = rng.randrange(W), rng.randint(98, 177)
        if rng.random() < .55:
            d.point((x, y), fill="#a7bb73")
            if rng.random() < .3:
                d.point((x + 1, y), fill="#d8d99a")
    road(im, rng, "mire")
    d = ImageDraw.Draw(im)
    grass(d, rng, 191, ["#24483d", "#406247", "#64764d"], 130)
    for x in [17, 102, 217, 310]:
        d.line((x, 191, x + 1, 178), fill="#71805a")
        d.rectangle((x, 177, x + 2, 182), fill="#8a7b4d")
    for x in [49, 130, 288]:
        d.rectangle((x, 190, x + 1, 194), fill="#c7b58a")
        d.rectangle((x - 2, 188, x + 3, 190), fill="#b28760")
        d.line((x - 1, 187, x + 2, 187), fill="#dec49a")
    return im


def fortress_wall(d, rng):
    d.rectangle((88, 137, 310, 190), fill="#435563")
    for row, yy in enumerate(range(139, 191, 7)):
        for xx in range(86 - (row % 2) * 9, 313, 18):
            c = rng.choice(["#526674", "#586d7b", "#4a5f6e", "#627581"])
            d.rectangle((xx + 1, yy, xx + 17, yy + 5), fill=c)
            d.line((xx + 2, yy, xx + 16, yy), fill="#778b94")
    d.rectangle((86, 133, 313, 138), fill="#83959e")
    d.line((86, 138, 313, 138), fill="#2c4153")
    for xx in range(89, 311, 14):
        d.rectangle((xx, 125, xx + 7, 133), fill="#5f7482")
        d.line((xx, 125, xx + 7, 125), fill="#d1dfdd")
    for x in [98, 290]:
        d.rectangle((x - 12, 101, x + 12, 190), fill="#354b60")
        d.rectangle((x - 10, 103, x + 6, 190), fill="#627785")
        for yy in range(108, 190, 8):
            d.line((x - 10, yy, x + 8, yy), fill="#41596a")
            d.line((x - 3 if yy % 16 else x + 3, yy,
                    x - 3 if yy % 16 else x + 3, yy + 7), fill="#41596a")
        d.rectangle((x - 14, 98, x + 14, 104), fill="#80939e")
        for dx in [-13, -3, 7]:
            d.rectangle((x + dx, 90, x + dx + 6, 99), fill="#687e8d")
            d.line((x + dx, 90, x + dx + 6, 90), fill="#e5ece3")
        d.rectangle((x - 2, 116, x + 2, 129), fill="#22384b")
        d.line((x - 1, 116, x - 1, 127), fill="#b38951")
    # Recessed arched gate and individually spaced portcullis bars.
    d.rectangle((178, 160, 215, 190), fill="#1d3041")
    d.pieslice((178, 141, 215, 177), 180, 360, fill="#1d3041")
    d.arc((174, 138, 219, 181), 180, 360, fill="#a0adb1", width=4)
    d.line((175, 160, 175, 190), fill="#a0adb1", width=3)
    d.line((218, 160, 218, 190), fill="#3c5365", width=3)
    for xx in range(181, 215, 6):
        d.line((xx, 155, xx, 191), fill="#52616b")
    for yy in [166, 177]:
        d.line((179, yy, 214, yy), fill="#53636c")


def frostpeak():
    rng = random.Random(4907)
    im = Image.new("RGBA", (W, H))
    gradient(im, [(0, "#293b58"), (66, "#526e8a"), (125, "#9bb4c1"),
                  (192, "#c4d1cf")])
    d = ImageDraw.Draw(im)
    for _ in range(52):
        x, y = rng.randrange(W), rng.randrange(106)
        d.point((x, y), fill=rng.choice(["#a6c3d6", "#d9e3de", "#7d9bb4"]))
    d.ellipse((48, 25, 64, 41), fill="#dbe1d5")
    ridge(d, [(0, 137), (32, 81), (51, 107), (83, 48), (115, 100),
              (144, 61), (173, 108), (204, 76), (235, 113),
              (275, 47), (310, 105), (333, 80), (360, 119)], "#738fa6")
    for x, y, width in [(83, 48, 33), (144, 61, 30), (275, 47, 36),
                        (32, 81, 23), (204, 76, 24)]:
        d.polygon([(x, y), (x - width, y + 53), (x - 13, y + 38),
                   (x - 7, y + 42), (x + 1, y + 26), (x + 9, y + 38),
                   (x + 15, y + 35), (x + width, y + 55)], fill="#d6e2e1")
        d.polygon([(x, y + 2), (x + 3, y + 27), (x + 15, y + 35),
                   (x + width, y + 55)], fill="#a7c2d1")
        d.line((x - 2, y + 8, x - 14, y + 36), fill="#eff0e5")
    ridge(d, [(0, 168), (38, 129), (67, 158), (121, 105),
              (156, 153), (211, 122), (254, 165), (313, 116),
              (360, 154)], "#4d6d85")
    d.polygon([(121, 105), (103, 131), (116, 126), (123, 134),
               (129, 126), (143, 138)], fill="#b7cdd5")
    hill(d, 177, 10, .7, "#466579")
    for x in range(-8, 370, 17):
        pine(d, x, 184, rng.randint(25, 47),
             ("#334f61", "#4b6c77", "#7c9a9e"), snow=True)
    fortress_wall(d, rng)
    for x in [121, 269]:
        brazier(im, x, 138)
    d = ImageDraw.Draw(im)
    for x, size in [(18, 74), (47, 49), (333, 60), (355, 82)]:
        pine(d, x, 192, size, ("#243f51", "#3b5d68", "#7a9c9c"), snow=True)
    road(im, rng, "frost")
    d = ImageDraw.Draw(im)
    for _ in range(200):
        x = rng.randrange(W)
        y = rng.choice([192, 193, 194, 195, 246, 247, 248, 249])
        d.rectangle((x, y, x + rng.randrange(1, 4), y),
                    fill=rng.choice(["#dbe7e3", "#b7ccd3", "#eef1e6"]))
    for x in [69, 323]:
        brazier(im, x, 187)
    d = ImageDraw.Draw(im)
    for x, y in [(14, 32), (106, 24), (181, 59), (309, 40), (344, 104),
                  (75, 151), (242, 84), (23, 171)]:
        d.line((x - 1, y, x + 1, y), fill="#d7e6e8")
        d.line((x, y - 1, x, y + 1), fill="#d7e6e8")
    return im


def gothic_tower(d, rng, x, base, height, width):
    top = base - height
    d.polygon([(x - width // 2, base), (x - width // 2, top + 16),
               (x - width // 3, top + 16), (x, top - 12),
               (x + width // 3, top + 16), (x + width // 2, top + 16),
               (x + width // 2, base)], fill="#171b29")
    d.polygon([(x, top - 9), (x - 2, top + 22),
               (x - 2, base), (x - width // 2 + 3, base),
               (x - width // 2 + 3, top + 18), (x - width // 3, top + 18)],
              fill="#34303b")
    d.line((x - width // 2, top + 19, x - width // 2, base), fill="#705052")
    for yy in range(top + 30, base - 2, 9):
        d.line((x - width // 2 + 2, yy, x + width // 2 - 2, yy),
               fill="#242430")
    for yy in range(top + 32, base - 12, 27):
        d.polygon([(x - 3, yy + 10), (x - 3, yy + 2), (x, yy - 3),
                   (x + 3, yy + 2), (x + 3, yy + 10)], fill="#090f1b")
        d.line((x - 1, yy + 2, x - 1, yy + 8), fill="#d1643c")
    d.rectangle((x - width // 2 - 2, top + 17,
                 x + width // 2 + 2, top + 20), fill="#4a3943")
    d.line((x, top - 18, x, top - 10), fill="#3a303c")


def lavafall(im, rng, x, top, width, base):
    glow(im, x, (top + base) // 2, 43, "#f06329", 90)
    d = ImageDraw.Draw(im)
    d.polygon([(x - width // 2 - 3, top), (x + width // 2 + 2, top),
               (x + width // 2 + 4, base), (x - width // 2 - 4, base)],
              fill="#a43e2d")
    d.rectangle((x - width // 2, top, x + width // 2, base), fill="#f17d2d")
    d.rectangle((x - width // 2 + 2, top, x + 1, base), fill="#ffcc58")
    d.line((x - 1, top, x - 1, base), fill="#fff0a0", width=2)
    for _ in range(35):
        yy = rng.randint(top, base)
        xx = rng.randint(x - width // 2, x + width // 2)
        d.line((xx, yy, xx, min(base, yy + rng.randint(1, 5))),
               fill=rng.choice(["#ffdf78", "#e75d2d", "#fff4ac"]))
    for _ in range(25):
        xx = x + rng.randint(-22, 22)
        yy = base + rng.randint(-5, 5)
        d.line((xx, yy, xx + rng.randint(1, 6), yy),
               fill=rng.choice(["#b6543a", "#dc793f", "#f8ad5a"]))


def cinder_citadel():
    rng = random.Random(5981)
    im = Image.new("RGBA", (W, H))
    gradient(im, [(0, "#191b2a"), (58, "#3d2433"), (112, "#742f39"),
                  (158, "#a8473b"), (192, "#392631")])
    d = ImageDraw.Draw(im)
    for _ in range(18):
        x, y = rng.randrange(-50, W), rng.randrange(15, 105)
        length = rng.randint(25, 95)
        d.rectangle((x, y, x + length, y + 3), fill="#362331")
        d.line((x + 12, y + 4, x + length - 7, y + 4), fill="#5d2a36")
    ridge(d, [(0, 151), (28, 101), (51, 133), (80, 80), (111, 123),
              (143, 102), (178, 141), (216, 96), (246, 126), (282, 85),
              (310, 134), (337, 105), (360, 142)], "#3b2a39")
    for x in [25, 63, 126, 228, 295, 341]:
        gothic_tower(d, rng, x, 175, rng.randint(55, 100), rng.randint(14, 24))
    d.rectangle((80, 135, 287, 177), fill="#242330")
    for yy in range(139, 178, 7):
        for xx in range(80 + (yy % 2) * 7, 288, 16):
            d.rectangle((xx + 1, yy, xx + 14, yy + 5),
                        fill=rng.choice(["#332b37", "#3d303b", "#292735"]))
    for x in [105, 159, 212, 266]:
        d.polygon([(x - 12, 176), (x - 12, 151), (x - 7, 140),
                   (x, 130), (x + 7, 140), (x + 12, 151), (x + 12, 176)],
                  fill="#131927")
        d.line((x - 14, 173, x - 14, 150, x - 8, 138, x, 127,
                x + 8, 138, x + 14, 150, x + 14, 174),
               fill="#67404a", width=2)
    gothic_tower(d, rng, 183, 175, 130, 34)
    d.rectangle((0, 177, W, 191), fill="#1b1d29")
    for x, top, width in [(53, 133, 9), (128, 154, 7), (250, 138, 11), (312, 157, 6)]:
        lavafall(im, rng, x, top, width, 187)
    d = ImageDraw.Draw(im)
    ridge(d, [(0, 183), (19, 166), (31, 181), (45, 176), (69, 188),
              (89, 180), (107, 190), (153, 183), (169, 190), (214, 183),
              (238, 189), (280, 177), (300, 186), (330, 172), (360, 181)],
          "#29252f")
    # Foreground bridge supports and iron rail above the walkable surface.
    for x in [10, 91, 272, 349]:
        d.rectangle((x - 5, 178, x + 5, 191), fill="#3b303a")
        d.line((x - 5, 178, x + 5, 178), fill="#8d514d")
        d.rectangle((x - 6, 175, x + 6, 178), fill="#4d3740")
    d.line((0, 184, 359, 184), fill="#171d28", width=2)
    for x in range(8, W, 12):
        d.line((x, 184, x, 190), fill="#171d28")
    road(im, rng, "cinder")
    for x in [20, 339]:
        brazier(im, x, 184)
    d = ImageDraw.Draw(im)
    for _ in range(85):
        x, y = rng.randrange(W), rng.randrange(15, 190)
        c = rng.choice(["#bf573c", "#f48b42", "#ffd17a", "#8f3e38"])
        d.rectangle((x, y, x, y + (1 if rng.random() < .4 else 0)), fill=c)
        if rng.random() < .16:
            d.point((x + 1, y + 2), fill="#7e3436")
    return im


def sparkle(d, x, y, radius, color, center="#fffde3"):
    d.line((x - radius, y, x + radius, y), fill=color)
    d.line((x, y - radius, x, y + radius), fill=color)
    if radius >= 3:
        d.rectangle((x - 1, y - 1, x + 1, y + 1), fill=color)
    d.point((x, y), fill=center)


def make_vfx():
    sheet = Image.new("RGBA", (256, 64))
    rng = random.Random(6721)
    # Each effect is drawn in isolation to guarantee clean cell boundaries.
    cells = [Image.new("RGBA", (64, 64)) for _ in range(4)]
    im = cells[0]
    glow(im, 33, 29, 30, "#efc66c", 65)
    p = im.load()
    # Rotated elliptical crescent: its tapered tips follow the sweep.
    for y in range(4, 60):
        for x in range(3, 61):
            dx, dy = x - 31, y - 32
            u = dx * .87 + dy * .50
            v = -dx * .50 + dy * .87
            r = math.sqrt((u / 29) ** 2 + (v / 23) ** 2)
            angle = math.atan2(v / 23, u / 29)
            if -2.65 < angle < .72:
                taper = max(0, math.sin((angle + 2.65) / 3.37 * math.pi)) ** .6
                inner = 1 - .31 * taper
                if inner < r < 1:
                    edge = (r - inner) / max(.001, 1 - inner)
                    color = "#fffde8" if edge > .52 else "#f5cf64"
                    if edge < .18:
                        color = "#b87f39"
                    p[x, y] = rgb(color) + (255,)
                elif 1 <= r < 1.045 and taper > .2:
                    p[x, y] = (255, 242, 183, 200)
    d = ImageDraw.Draw(im)
    for x, y, s in [(12, 16, 3), (45, 9, 2), (54, 31, 3), (24, 48, 2), (7, 34, 1)]:
        sparkle(d, x, y, s, "#ffe7a0")
    d.line((14, 44, 8, 48), fill="#c4a465")
    d.line((18, 47, 13, 52), fill="#ffe8a4")

    im = cells[1]
    glow(im, 32, 31, 31, "#ffcf59", 115)
    d = ImageDraw.Draw(im)
    points = []
    for i in range(32):
        a = i * math.pi / 16 - math.pi / 2
        r = (29 if i % 4 == 0 else 22) if i % 2 == 0 else 7
        points.append((round(32 + math.cos(a) * r),
                       round(31 + math.sin(a) * r)))
    d.polygon(points, fill="#e29b35")
    points = []
    for i in range(16):
        a = i * math.pi / 8 - math.pi / 2
        r = 25 if i % 2 == 0 else 7
        points.append((round(32 + math.cos(a) * r),
                       round(31 + math.sin(a) * r)))
    d.polygon(points, fill="#ffe58a")
    d.polygon([(32, 9), (36, 26), (52, 31), (36, 35),
               (32, 53), (28, 36), (12, 31), (28, 27)], fill="#fffbe0")
    d.rectangle((28, 27, 36, 35), fill="#ffffff")
    for x, y in [(11, 13), (52, 15), (9, 44), (51, 49)]:
        sparkle(d, x, y, 2, "#ffd76d")

    im = cells[2]
    glow(im, 32, 33, 30, "#ff7633", 95)
    p = im.load()
    for y in range(5, 59):
        for x in range(5, 59):
            dx, dy = x - 32, y - 33
            a = math.atan2(dy, dx)
            r = math.hypot(dx, dy)
            outer = 21 + 2 * math.sin(a * 9) + 1.5 * math.sin(a * 15 + .6)
            inner = 12 + 1.7 * math.sin(a * 7 + 1)
            if inner < r < outer:
                t = (r - inner) / (outer - inner)
                color = (
                    "#fff5b2" if t < .19 else
                    "#ffd158" if t < .43 else
                    "#ff9235" if t < .72 else
                    "#cf442b"
                )
                p[x, y] = rgb(color) + (255,)
    d = ImageDraw.Draw(im)
    for _ in range(27):
        a = rng.random() * math.tau
        r = rng.randint(24, 29)
        x, y = round(32 + math.cos(a) * r), round(32 + math.sin(a) * r)
        d.rectangle((x, y, x + 1, y + rng.randint(0, 2)),
                    fill=rng.choice(["#ffda68", "#f98931", "#c9472a"]))
    d.polygon([(23, 43), (26, 34), (30, 36), (32, 25), (36, 35),
               (41, 29), (39, 43), (34, 47), (28, 46)], fill="#eb6a2b")
    d.polygon([(28, 43), (31, 35), (34, 40), (36, 37), (35, 45),
               (30, 46)], fill="#ffd66b")

    im = cells[3]
    glow(im, 32, 33, 30, "#edd17c", 85)
    p = im.load()
    for y in range(3, 57):
        half = 5 + (57 - y) // 9
        for x in range(32 - half, 33 + half):
            distance = abs(x - 32)
            alpha = 70 if distance > 6 else 145 if distance > 3 else 215
            if distance > 6 and BAYER[y % 4][x % 4] > 8:
                continue
            color = "#82cdd9" if distance >= half - 1 else "#e5bb60"
            if distance < 3:
                color = "#fff1ad"
            p[x, y] = rgb(color) + (alpha,)
    d = ImageDraw.Draw(im)
    d.ellipse((13, 49, 51, 59), outline="#d5a94b", width=2)
    d.arc((17, 50, 47, 56), 0, 180, fill="#fff1ae")
    d.line((26, 8, 26, 41), fill=(159, 220, 223, 170))
    d.line((38, 4, 38, 39), fill=(255, 228, 149, 190))
    for x, y, s in [(19, 15, 3), (44, 23, 3), (16, 37, 2),
                    (47, 43, 2), (32, 7, 3), (30, 31, 2)]:
        sparkle(d, x, y, s, "#ffe7a1")
    for i, cell in enumerate(cells):
        sheet.alpha_composite(cell, (i * 64, 0))
    return sheet


OUTLINE = "#151b2a"


def icon_canvas():
    return Image.new("RGBA", (32, 32))


def outlined(d, points, fill, width=1):
    d.polygon(points, fill=fill)
    d.line(points + [points[0]], fill=OUTLINE, width=width)


def sword_icon():
    im = icon_canvas()
    d = ImageDraw.Draw(im)
    outlined(d, [(8, 20), (23, 3), (29, 2), (28, 8),
                 (13, 24)], "#8199ad")
    d.polygon([(10, 20), (24, 4), (27, 4), (12, 22)], fill="#e3edf0")
    d.line((13, 21, 26, 6), fill="#f9f5dc")
    d.line((15, 22, 27, 8), fill="#4a607d")
    outlined(d, [(5, 17), (7, 16), (17, 25), (16, 28),
                 (12, 25), (9, 22)], "#c89545")
    d.line((6, 17, 16, 26), fill="#ffe0a0")
    outlined(d, [(8, 22), (11, 25), (6, 30), (3, 27)], "#735048")
    d.line((7, 24, 9, 26), fill="#ce9a67")
    d.line((5, 26, 7, 28), fill="#ce9a67")
    outlined(d, [(2, 26), (6, 27), (7, 30), (3, 31), (1, 29)], "#bd8b43")
    d.point((3, 28), fill="#ffe5a5")
    return im


def shield_icon():
    im = icon_canvas()
    d = ImageDraw.Draw(im)
    outlined(d, [(5, 5), (15, 2), (26, 5), (25, 18),
                 (22, 24), (15, 30), (8, 24), (5, 18)], "#d1a34c")
    outlined(d, [(8, 7), (15, 5), (23, 7), (22, 18),
                 (19, 23), (15, 27), (11, 23), (8, 17)], "#28547e")
    d.polygon([(9, 8), (15, 6), (15, 25), (11, 21), (9, 16)], fill="#477fa4")
    d.line((6, 6, 15, 3, 25, 6), fill="#ffe7a2")
    d.line((7, 8, 7, 17, 10, 23, 15, 28), fill="#f1ce73")
    d.line((24, 9, 23, 18, 20, 24, 16, 28), fill="#8e622f")
    d.polygon([(11, 12), (13, 14), (15, 10), (17, 14), (20, 12),
               (19, 18), (12, 18)], fill="#eac364")
    d.line((12, 20, 19, 20), fill="#ffdf8c")
    d.point((15, 13), fill="#fff1bc")
    for x, y in [(7, 7), (24, 7), (9, 21), (22, 21)]:
        d.point((x, y), fill="#fff0b0")
    return im


def armor_icon():
    im = icon_canvas()
    d = ImageDraw.Draw(im)
    outlined(d, [(7, 5), (11, 3), (13, 6), (19, 6), (21, 3),
                 (25, 5), (29, 11), (26, 16), (23, 14), (23, 25),
                 (26, 28), (19, 30), (16, 28), (12, 30), (6, 28),
                 (9, 24), (9, 14), (6, 16), (2, 11)], "#6e849a")
    d.polygon([(11, 7), (15, 9), (16, 24), (10, 22), (10, 11)],
              fill="#b9cbd1")
    d.polygon([(17, 9), (21, 7), (22, 22), (17, 24)], fill="#849eaf")
    d.line((16, 10, 16, 24), fill="#e8e9db")
    d.line((10, 20, 15, 22, 21, 20), fill="#4b6079")
    d.line((10, 23, 16, 25, 22, 23), fill="#d3dcd8")
    d.polygon([(4, 10), (8, 6), (11, 8), (9, 12), (5, 13)], fill="#d0dadd")
    d.line((4, 10, 8, 7, 10, 8), fill="#f0efdb")
    d.polygon([(21, 8), (24, 6), (27, 10), (25, 13), (23, 12)], fill="#9eb5c3")
    d.line((22, 8, 24, 7, 27, 10), fill="#d5e2e2")
    d.line((9, 26, 14, 28), fill="#aebfc6")
    d.line((18, 28, 23, 27), fill="#aebfc6")
    d.rectangle((13, 5, 18, 7), fill="#273249")
    d.rectangle((14, 24, 18, 26), fill="#b8904d")
    d.point((16, 25), fill="#f2d68a")
    return im


def coin_icon():
    im = icon_canvas()
    d = ImageDraw.Draw(im)
    d.ellipse((4, 3, 28, 29), fill=OUTLINE)
    d.ellipse((5, 4, 27, 28), fill="#94602d")
    d.ellipse((5, 4, 25, 26), fill="#f5c54f")
    d.ellipse((7, 6, 23, 24), fill="#a9712d")
    d.ellipse((8, 7, 23, 24), fill="#deb044")
    d.arc((5, 4, 25, 26), 170, 290, fill="#fff0a0", width=2)
    d.arc((7, 6, 24, 25), 0, 100, fill="#f9d97b")
    d.line((25, 12, 25, 20), fill="#bd8234")
    d.line((27, 12, 27, 20), fill="#e3aa3f")
    d.polygon([(15, 9), (19, 11), (19, 13), (15, 12), (13, 14),
               (18, 16), (19, 19), (16, 22), (12, 21), (11, 18),
               (15, 19), (17, 18), (12, 16), (11, 13)], fill="#93602b")
    d.line((15, 9, 15, 22), fill="#f8d46f")
    sparkle(d, 8, 7, 3, "#fff2b0")
    return im


def ore_icon():
    im = icon_canvas()
    d = ImageDraw.Draw(im)
    outlined(d, [(3, 25), (5, 17), (9, 16), (11, 5), (17, 2),
                 (22, 9), (23, 15), (27, 12), (30, 19), (26, 28),
                 (16, 30), (7, 29)], "#365879")
    d.polygon([(11, 6), (17, 3), (16, 20), (10, 25)], fill="#6ec5da")
    d.polygon([(17, 3), (21, 10), (20, 22), (16, 20)], fill="#3987b0")
    d.polygon([(12, 7), (16, 5), (14, 16), (12, 18)], fill="#c5f1ed")
    d.polygon([(6, 18), (10, 17), (12, 26), (8, 27)], fill="#70abc1")
    d.polygon([(23, 18), (27, 14), (28, 19), (24, 26), (19, 28)],
              fill="#539fc1")
    d.line((27, 15, 25, 21, 21, 26), fill="#b8e9eb")
    d.polygon([(4, 26), (12, 24), (17, 27), (25, 25), (25, 28),
               (16, 30), (7, 29)], fill="#465266")
    d.line((6, 26, 12, 25, 17, 28), fill="#92a6b2")
    sparkle(d, 22, 6, 3, "#b2eff7")
    return im


def medal_icon():
    im = icon_canvas()
    d = ImageDraw.Draw(im)
    outlined(d, [(7, 2), (14, 2), (17, 14), (10, 16)], "#365d9b")
    outlined(d, [(18, 2), (25, 2), (22, 16), (15, 14)], "#a83e50")
    d.line((9, 3, 12, 12), fill="#7db2d0", width=2)
    d.line((21, 3, 19, 12), fill="#e47e7a", width=2)
    d.line((13, 3, 16, 12), fill="#ddc378")
    d.line((24, 3, 21, 12), fill="#ddc378")
    outlined(d, [(16, 11), (20, 14), (25, 15), (25, 20),
                 (28, 24), (23, 26), (21, 30), (16, 28),
                 (11, 30), (9, 26), (5, 24), (8, 20), (8, 15),
                 (13, 14)], "#b58237")
    d.ellipse((9, 13, 23, 27), fill="#f2c65d", outline="#ffe7a0")
    d.ellipse((12, 16, 20, 24), fill="#b67b32")
    d.polygon([(16, 16), (17, 19), (20, 19), (18, 21),
               (19, 24), (16, 22), (13, 24), (14, 21),
               (12, 19), (15, 19)], fill="#ffe6a0")
    d.point((16, 18), fill="#fff8cb")
    return im


def forge_icon():
    im = icon_canvas()
    d = ImageDraw.Draw(im)
    outlined(d, [(3, 15), (23, 15), (29, 12), (29, 17),
                 (24, 21), (19, 21), (19, 26), (25, 28), (25, 30),
                 (6, 30), (6, 28), (11, 26), (11, 22), (5, 21)], "#607b8c")
    d.line((4, 16, 23, 16, 28, 14), fill="#d4dde0")
    d.polygon([(6, 18), (23, 18), (20, 20), (17, 21), (17, 26),
               (12, 26), (12, 21), (6, 20)], fill="#42566d")
    d.line((8, 28, 22, 28), fill="#9badb9")
    outlined(d, [(10, 8), (13, 5), (24, 16), (21, 19)], "#97633c")
    d.line((12, 8, 22, 17), fill="#d1a167")
    outlined(d, [(4, 6), (9, 1), (17, 8), (12, 13)], "#879aa8")
    d.polygon([(5, 6), (9, 2), (13, 6), (9, 10)], fill="#d0d9d9")
    d.line((5, 6, 9, 2, 15, 8), fill="#edf0df")
    d.line((11, 11, 15, 8), fill="#465b76")
    d.point((27, 7), fill="#f6c475")
    d.line((25, 3, 25, 5), fill="#f6c475")
    return im


def horn_icon():
    im = icon_canvas()
    d = ImageDraw.Draw(im)
    outlined(d, [(3, 20), (6, 16), (10, 17), (15, 16), (20, 11),
                 (22, 5), (27, 3), (30, 6), (28, 12), (24, 12),
                 (20, 20), (14, 24), (8, 25)], "#b8873c")
    d.polygon([(5, 20), (8, 18), (12, 20), (18, 17), (21, 12),
               (24, 11), (20, 19), (14, 23), (8, 23)], fill="#e0b45c")
    d.line((7, 19, 12, 20, 17, 18, 21, 13), fill="#ffdf91")
    d.line((9, 24, 15, 23, 21, 19), fill="#82562c")
    outlined(d, [(21, 5), (26, 2), (30, 5), (30, 10),
                 (26, 14), (22, 11)], "#e8bd63")
    d.polygon([(24, 6), (27, 4), (28, 6), (28, 9), (25, 11), (24, 9)],
              fill="#614430")
    d.line((22, 6, 23, 10, 26, 12), fill="#ffe9a1")
    d.line((5, 17, 3, 19, 6, 23), fill="#f7d481")
    outlined(d, [(14, 22), (18, 20), (21, 25), (18, 25),
                 (18, 30), (14, 27), (11, 30)], "#365b8f")
    d.line((15, 23, 15, 27), fill="#7da5bf")
    d.line((17, 22, 19, 24), fill="#e7c66c")
    return im


def make_icons():
    sheet = Image.new("RGBA", (256, 32))
    makers = [
        sword_icon, shield_icon, armor_icon, coin_icon,
        ore_icon, medal_icon, forge_icon, horn_icon,
    ]
    for index, maker in enumerate(makers):
        sheet.alpha_composite(maker(), (index * 32, 0))
    return sheet


def main():
    root = Path("public/assets")
    for folder in ("bg", "vfx", "ui"):
        (root / folder).mkdir(parents=True, exist_ok=True)

    jobs = [
        ("bg/dawnstep.png", dawnstep, (360, 250)),
        ("bg/amber-canyon.png", amber_canyon, (360, 250)),
        ("bg/mirewood.png", mirewood, (360, 250)),
        ("bg/frostpeak.png", frostpeak, (360, 250)),
        ("bg/cinder-citadel.png", cinder_citadel, (360, 250)),
        ("vfx/vfx-sheet.png", make_vfx, (256, 64)),
        ("ui/icons.png", make_icons, (256, 32)),
    ]
    print("Generating deterministic native-resolution RPG pixel art.")
    for relative, make, expected in jobs:
        artwork = make()
        assert artwork.mode == "RGBA"
        assert artwork.size == expected
        if relative.startswith("bg/"):
            assert artwork.getchannel("A").getextrema() == (255, 255)
        else:
            alpha = artwork.getchannel("A")
            assert alpha.getextrema()[0] == 0
            cell_width = 64 if relative.startswith("vfx/") else 32
            for left in range(0, artwork.width, cell_width):
                cell = alpha.crop((left, 0, left + cell_width, artwork.height))
                assert cell.getbbox() is not None

        target = root / relative
        artwork.save(target, format="PNG", optimize=True)
        with Image.open(target) as saved:
            saved.load()
            assert saved.format == "PNG"
            assert saved.mode == "RGBA"
            assert saved.size == expected
            digest = hashlib.sha256(saved.tobytes()).hexdigest()[:16]
        print(f"OK  {target.as_posix():43s} "
              f"{expected[0]}x{expected[1]} RGBA  pixels-sha256={digest}")

    print("Verified 7 PNGs. Background road baseline: y=192; road rows: 192..249.")
    print("VFX: 4 x 64px cells; icons: 8 x 32px cells. No resampling or blur.")


if __name__ == "__main__":
    main()
