from pathlib import Path
import math
from PIL import Image, ImageDraw

OUTLINE = "#141928"
TRANSPARENT = (0, 0, 0, 0)

IRON = ["#30364d", "#515d75", "#8193a5", "#bacbd0", "#eff4df"]
STEEL = ["#26374e", "#41617a", "#769eaf", "#b4d5dc", "#effff1"]
WOOD = ["#342433", "#663b36", "#995737", "#c38345", "#edb868"]
LEATHER = ["#322333", "#593239", "#89503e", "#bc7950", "#e7ac70"]
GOLD = ["#67404b", "#a7633e", "#d99843", "#f5cb68", "#fff4be"]
BLUE = ["#202b57", "#283f87", "#376bd0", "#68a4ed", "#c0e9fa"]
GREEN = ["#163c41", "#226955", "#36a974", "#79df9a", "#d6ffcc"]
PURPLE = ["#30213f", "#51305f", "#824678", "#c36aab", "#f5b2d3"]
CRIMSON = ["#401e3b", "#79263e", "#b83d52", "#f06b65", "#ffd09a"]
CYAN = ["#183c58", "#246785", "#3aa6bf", "#88e5e5", "#eefff3"]
SLATE = ["#242a40", "#3b4560", "#5c7290", "#91a9b6", "#d1e0d6"]
WHITEGOLD = ["#765575", "#b28b91", "#e5c49b", "#fff1c5", "#ffffed"]


def canvas():
    return Image.new("RGBA", (32, 32), TRANSPARENT)


def polygon(im, points, fill, outline=OUTLINE):
    ImageDraw.Draw(im).polygon(points, fill=fill, outline=outline)


def line(im, points, fill, width=1):
    ImageDraw.Draw(im).line(points, fill=fill, width=width)


def rect(im, box, fill, outline=None):
    ImageDraw.Draw(im).rectangle(box, fill=fill, outline=outline)


def ellipse(im, box, fill, outline=OUTLINE):
    ImageDraw.Draw(im).ellipse(box, fill=fill, outline=outline)


def shaded(im, points, palette):
    """Opaque, indexed-color facets with a one-pixel contour."""
    mask = Image.new("1", im.size)
    ImageDraw.Draw(mask).polygon(points, fill=1)
    xs, ys = zip(*points)
    left, right = min(xs), max(xs)
    top, bottom = min(ys), max(ys)
    width, height = max(1, right - left), max(1, bottom - top)
    p = im.load()
    m = mask.load()
    for y in range(max(0, top), min(im.height - 1, bottom) + 1):
        for x in range(max(0, left), min(im.width - 1, right) + 1):
            if m[x, y]:
                illumination = 0.88 - 0.43 * (x - left) / width
                illumination -= 0.36 * (y - top) / height
                index = max(0, min(len(palette) - 1,
                                   int(illumination * len(palette))))
                p[x, y] = (*rgb(palette[index]), 255)
    ImageDraw.Draw(im).polygon(points, outline=OUTLINE)


def rgb(color):
    return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))


def gem(im, x, y, palette, size=2):
    polygon(im, [(x, y - size), (x + size, y),
                 (x, y + size), (x - size, y)], palette[2])
    line(im, [(x - 1, y), (x, y - 1)], palette[4])
    rect(im, (x, y, x, y), palette[3])


def star(im, x, y, color="#fff5bd", large=False):
    d = ImageDraw.Draw(im)
    d.point((x, y), fill="#ffffff")
    d.point([(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)],
            fill=color)
    if large:
        d.point([(x - 2, y), (x + 2, y), (x, y - 2), (x, y + 2)],
                fill="#eab95f")


def rivet(im, x, y, light="#f1d99c"):
    rect(im, (x, y, x + 1, y + 1), OUTLINE)
    rect(im, (x, y, x, y), light)


def flame(im, points, outer=CRIMSON, inner=GOLD):
    polygon(im, points, outer[2], outline=None)
    xs, ys = zip(*points)
    cx = (min(xs) + max(xs)) // 2
    bottom = max(ys)
    polygon(im, [(cx - 1, bottom), (cx - 2, bottom - 3),
                 (cx, min(ys) + 3), (cx + 1, bottom - 2),
                 (cx + 2, bottom)], inner[3], outline=None)
    rect(im, (cx, bottom - 2, cx, bottom - 1), inner[4])


def sword(rarity):
    im = canvas()
    metal = [IRON, STEEL, BLUE, CRIMSON, WHITEGOLD][rarity]
    trim = [IRON, GREEN, GOLD, PURPLE, GOLD][rarity]

    # Construct upright at pixel resolution, then rotate with nearest sampling.
    if rarity == 0:
        blade = [(15, 2), (18, 6), (18, 19), (13, 19), (13, 6)]
    elif rarity == 1:
        blade = [(16, 1), (18, 5), (18, 19), (13, 19), (13, 5)]
    elif rarity == 2:
        blade = [(15, 1), (19, 6), (19, 17), (17, 20),
                 (13, 20), (11, 17), (12, 6)]
    elif rarity == 3:
        blade = [(16, 1), (20, 6), (19, 8), (21, 10),
                 (19, 12), (20, 15), (18, 19), (12, 19),
                 (11, 15), (12, 12), (10, 10), (12, 7), (12, 5)]
    else:
        blade = [(16, 0), (20, 6), (19, 8), (19, 17),
                 (17, 20), (13, 20), (11, 17), (12, 8), (12, 5)]

    shaded(im, blade, metal)
    line(im, [(15, 5), (14, 16)], metal[4])
    line(im, [(16, 6), (16, 17)], metal[1])
    if rarity >= 2:
        line(im, [(17, 7), (17, 16)], metal[3])
        rect(im, (14, 9, 14, 11), STEEL[4] if rarity == 2 else metal[4])

    if rarity == 0:
        shaded(im, [(10, 18), (20, 18), (21, 21), (18, 21),
                    (17, 20), (13, 20), (12, 21), (9, 21)], IRON)
    elif rarity == 1:
        shaded(im, [(9, 18), (13, 19), (18, 19), (21, 17),
                    (22, 20), (18, 22), (12, 22), (9, 21)], STEEL)
        line(im, [(10, 19), (13, 20), (18, 20), (20, 19)], GREEN[3])
    elif rarity == 2:
        shaded(im, [(8, 17), (11, 18), (13, 20), (18, 20),
                    (21, 17), (23, 17), (22, 22), (18, 23),
                    (12, 23), (8, 21)], GOLD)
        line(im, [(9, 18), (12, 21)], GOLD[4])
    elif rarity == 3:
        shaded(im, [(7, 16), (11, 18), (12, 20), (18, 20),
                    (21, 16), (24, 15), (22, 21), (24, 23),
                    (19, 23), (16, 22), (12, 23), (7, 22),
                    (9, 20)], PURPLE)
        line(im, [(9, 18), (12, 21), (18, 21), (21, 18)], CRIMSON[3])
    else:
        shaded(im, [(5, 15), (10, 17), (12, 19), (18, 19),
                    (21, 16), (25, 14), (24, 19), (22, 20),
                    (24, 21), (19, 23), (16, 22), (12, 23),
                    (7, 21), (9, 20), (6, 18)], GOLD)
        line(im, [(7, 17), (11, 20), (13, 21)], WHITEGOLD[4])
        line(im, [(18, 21), (21, 19), (23, 17)], WHITEGOLD[4])

    shaded(im, [(13, 22), (17, 22), (17, 28), (13, 28)], LEATHER)
    for y in (23, 25, 27):
        line(im, [(14, y), (16, y)], trim[2])
    ellipse(im, (12, 27, 18, 31), trim[2])
    gem(im, 15, 29, trim, 2)
    if rarity:
        gem(im, 15, 21, trim, 2)

    im = im.rotate(-43, resample=Image.Resampling.NEAREST, expand=False)
    if rarity == 2:
        star(im, 25, 6, BLUE[3])
        rect(im, (27, 13, 27, 14), BLUE[3])
    elif rarity == 3:
        flame(im, [(18, 6), (18, 2), (20, 4), (22, 1),
                   (22, 6), (20, 9)], PURPLE, CRIMSON)
        flame(im, [(24, 17), (25, 12), (27, 14), (29, 10),
                   (28, 17), (26, 19)], CRIMSON, GOLD)
        rect(im, (13, 4, 13, 5), CRIMSON[3])
    elif rarity == 4:
        star(im, 24, 3, GOLD[3], True)
        star(im, 28, 15, GOLD[4])
        star(im, 5, 11, GOLD[3])
        rect(im, (19, 3, 19, 3), WHITEGOLD[4])
    return im


def crown(im, x, y, palette=GOLD):
    polygon(im, [(x - 4, y - 2), (x - 2, y),
                 (x, y - 3), (x + 2, y), (x + 4, y - 2),
                 (x + 3, y + 3), (x - 3, y + 3)], palette[2])
    line(im, [(x - 2, y + 1), (x + 2, y + 1)], palette[4])


def sun(im, x, y, palette=GOLD):
    for dx, dy in ((0, -5), (0, 5), (-5, 0), (5, 0),
                   (-4, -4), (4, -4), (-4, 4), (4, 4)):
        line(im, [(x + dx * 3 // 5, y + dy * 3 // 5),
                  (x + dx, y + dy)], palette[3])
    ellipse(im, (x - 3, y - 3, x + 3, y + 3), palette[2])
    line(im, [(x - 1, y - 2), (x + 1, y - 2)], palette[4])
    rect(im, (x - 2, y - 1, x - 2, y), palette[4])


def shield(rarity):
    im = canvas()
    if rarity == 0:
        ellipse(im, (4, 4, 27, 28), IRON[1])
        ellipse(im, (6, 6, 25, 26), IRON[3])
        ellipse(im, (7, 7, 24, 25), WOOD[2])
        for x in (11, 16, 21):
            line(im, [(x, 8), (x, 24)], WOOD[0])
            line(im, [(x + 1, 9), (x + 1, 23)], WOOD[3])
        line(im, [(9, 12), (12, 13)], WOOD[4])
        line(im, [(18, 21), (21, 22)], WOOD[1])
        ellipse(im, (11, 11, 20, 21), IRON[1])
        ellipse(im, (12, 12, 19, 19), IRON[3])
        rect(im, (13, 13, 15, 14), IRON[4])
        for x, y in ((9, 8), (22, 9), (7, 17), (24, 17), (16, 25)):
            rivet(im, x, y, IRON[4])
        return im

    if rarity == 1:
        outer = [(5, 6), (10, 3), (21, 3), (27, 6),
                 (25, 18), (21, 24), (16, 29), (10, 24), (6, 18)]
        inner = [(8, 8), (12, 6), (20, 6), (24, 8),
                 (22, 18), (16, 25), (10, 18)]
        shaded(im, outer, GREEN)
        shaded(im, inner, STEEL)
        line(im, [(16, 7), (16, 22)], STEEL[1])
        line(im, [(15, 7), (15, 20)], STEEL[4])
        gem(im, 16, 13, GREEN, 3)
        for x, y in ((7, 7), (24, 7), (9, 19), (22, 19)):
            rivet(im, x, y, GREEN[4])
    elif rarity == 2:
        shaded(im, [(5, 5), (11, 3), (21, 3), (27, 5),
                    (26, 17), (23, 23), (16, 29),
                    (9, 24), (5, 18)], GOLD)
        shaded(im, [(8, 7), (13, 6), (20, 6), (24, 7),
                    (23, 17), (20, 23), (16, 26),
                    (11, 22), (8, 17)], BLUE)
        line(im, [(9, 8), (9, 16), (12, 21)], BLUE[4])
        crown(im, 16, 10)
        # A tiny heraldic lion: mane, muzzle, raised paw, body and curled tail.
        polygon(im, [(14, 14), (17, 13), (19, 15), (18, 17),
                     (17, 18), (19, 21), (17, 23), (13, 23),
                     (14, 20), (13, 18), (11, 17), (12, 15)], GOLD[3])
        rect(im, (16, 15, 16, 15), OUTLINE)
        line(im, [(18, 19), (21, 18), (21, 15), (20, 14)], GOLD[3])
        line(im, [(14, 18), (11, 19), (11, 21)], GOLD[4])
        star(im, 28, 9, BLUE[3])
    elif rarity == 3:
        shaded(im, [(4, 3), (10, 6), (15, 3), (21, 6),
                    (28, 2), (27, 12), (29, 16), (25, 22),
                    (21, 25), (16, 30), (10, 26),
                    (6, 22), (3, 16), (5, 12)], PURPLE)
        shaded(im, [(8, 9), (15, 7), (23, 9), (24, 18),
                    (20, 23), (16, 26), (11, 23), (7, 18)], CRIMSON)
        shaded(im, [(10, 11), (16, 9), (22, 11), (21, 19),
                    (16, 24), (11, 19)], PURPLE)
        line(im, [(7, 5), (8, 10), (6, 16), (10, 22)], CRIMSON[3])
        line(im, [(24, 8), (25, 13), (24, 18)], PURPLE[3])
        gem(im, 16, 15, CRIMSON, 4)
        line(im, [(15, 20), (15, 22), (17, 22)], CRIMSON[4])
        rect(im, (15, 12, 15, 14), "#fff0cd")
        rect(im, (2, 9, 2, 10), PURPLE[3])
        rect(im, (28, 25, 28, 26), CRIMSON[3])
    else:
        # Layered feather-shaped wings, enclosed by dark pixel contours.
        for points in (
            [(4, 6), (9, 10), (12, 19), (8, 23), (4, 19), (2, 13)],
            [(27, 6), (23, 10), (20, 19), (24, 23), (28, 19), (30, 13)]
        ):
            shaded(im, points, GOLD)
        line(im, [(4, 10), (7, 17), (9, 19)], WHITEGOLD[4])
        line(im, [(4, 15), (7, 20)], GOLD[4])
        line(im, [(27, 10), (25, 17), (23, 19)], WHITEGOLD[4])
        line(im, [(28, 15), (25, 20)], GOLD[4])
        shaded(im, [(8, 6), (12, 5), (16, 2), (20, 5),
                    (24, 6), (24, 18), (21, 24), (16, 29),
                    (11, 24), (8, 18)], GOLD)
        shaded(im, [(11, 9), (16, 6), (21, 9), (21, 18),
                    (18, 23), (16, 25), (13, 22), (11, 18)], WHITEGOLD)
        sun(im, 16, 15)
        gem(im, 16, 6, CYAN, 2)
        line(im, [(10, 10), (10, 18), (13, 23)], GOLD[4])
        star(im, 4, 3, GOLD[3])
        star(im, 28, 26, GOLD[4])
        star(im, 25, 2, GOLD[3])
    return im


def armor(rarity):
    im = canvas()
    body_palette = [LEATHER, STEEL, BLUE, PURPLE, GOLD][rarity]
    trim = [WOOD, GREEN, GOLD, CRIMSON, WHITEGOLD][rarity]

    # Interior silhouette: open neck, arms and clearly separated waist.
    shaded(im, [(10, 6), (12, 4), (19, 4), (22, 6),
                (24, 11), (22, 17), (23, 26), (20, 29),
                (11, 29), (8, 26), (9, 17), (7, 11)], body_palette)
    polygon(im, [(12, 4), (19, 4), (18, 8), (13, 8)], OUTLINE)
    line(im, [(13, 5), (18, 5)], body_palette[1])

    if rarity == 0:
        shaded(im, [(5, 7), (10, 6), (12, 10), (9, 16),
                    (4, 14), (3, 10)], LEATHER)
        shaded(im, [(21, 6), (26, 7), (29, 10), (27, 14),
                    (22, 16), (20, 10)], LEATHER)
        line(im, [(11, 10), (11, 21)], LEATHER[0])
        line(im, [(20, 10), (20, 21)], LEATHER[0])
        for y in (11, 14, 17, 20):
            rect(im, (12, y, 12, y), LEATHER[4])
            rect(im, (19, y, 19, y), LEATHER[3])
        line(im, [(14, 10), (17, 10)], LEATHER[3])
        rect(im, (8, 22, 23, 25), LEATHER[0], OUTLINE)
        rect(im, (13, 22, 18, 26), GOLD[2], OUTLINE)
        rect(im, (15, 23, 16, 24), LEATHER[0])
        line(im, [(10, 27), (13, 27)], LEATHER[3])
    else:
        if rarity == 1:
            shaded(im, [(6, 7), (11, 4), (13, 8), (10, 15),
                        (5, 17), (3, 12)], GREEN)
            shaded(im, [(20, 4), (26, 7), (29, 12), (26, 17),
                        (21, 14), (18, 8)], GREEN)
            shoulders = [
                [(5, 8), (10, 7), (12, 11), (10, 15), (4, 14), (3, 11)],
                [(22, 7), (27, 8), (29, 11), (28, 14), (22, 15), (20, 11)]
            ]
        elif rarity == 2:
            shoulders = [
                [(4, 7), (10, 5), (13, 10), (10, 16), (3, 14), (2, 10)],
                [(21, 5), (27, 7), (30, 10), (28, 14), (21, 16), (19, 10)]
            ]
        elif rarity == 3:
            shoulders = [
                [(2, 4), (7, 7), (10, 4), (13, 10), (10, 17),
                 (5, 15), (2, 17), (3, 11), (1, 10)],
                [(22, 4), (25, 7), (30, 4), (29, 10), (31, 11),
                 (28, 13), (30, 17), (23, 16), (19, 10)]
            ]
        else:
            shoulders = [
                [(1, 5), (6, 7), (10, 5), (13, 10), (10, 17),
                 (6, 15), (3, 11)],
                [(22, 5), (26, 7), (30, 5), (28, 12),
                 (25, 15), (21, 17), (19, 10)]
            ]

        for points in shoulders:
            shaded(im, points, body_palette if rarity != 1 else STEEL)
        if rarity >= 2:
            line(im, [(4, 9), (8, 8), (10, 10)], trim[3])
            line(im, [(22, 8), (26, 9), (28, 11)], trim[3])
            line(im, [(4, 13), (9, 14)], trim[2])
            line(im, [(23, 14), (27, 13)], trim[2])

        shaded(im, [(11, 10), (15, 12), (16, 18), (11, 19), (9, 15)],
               STEEL if rarity < 3 else body_palette)
        shaded(im, [(20, 10), (22, 15), (20, 19), (16, 18), (16, 12)],
               body_palette)
        line(im, [(11, 11), (14, 12)], STEEL[4] if rarity < 3 else trim[4])
        for y in (21, 24, 27):
            line(im, [(10, y), (15, y + 1), (21, y)], body_palette[0])
            line(im, [(11, y - 1), (15, y), (20, y - 1)], body_palette[3])
        rect(im, (9, 23, 22, 25), trim[1], OUTLINE)
        gem(im, 16, 24, trim, 2)

        if rarity == 1:
            gem(im, 16, 10, GREEN, 2)
            rivet(im, 6, 10, STEEL[4])
            rivet(im, 25, 10, STEEL[4])
        elif rarity == 2:
            line(im, [(12, 9), (16, 11), (20, 9)], GOLD[3])
            gem(im, 16, 12, BLUE, 2)
            line(im, [(10, 18), (15, 20), (21, 18)], GOLD[2])
            star(im, 27, 3, BLUE[3])
        elif rarity == 3:
            for x, y in ((7, 11), (24, 11), (12, 19), (19, 19)):
                line(im, [(x - 1, y), (x, y + 1), (x + 1, y)], PURPLE[3])
            gem(im, 16, 15, CRIMSON, 3)
            rect(im, (15, 13, 15, 15), "#fff0b6")
            line(im, [(12, 7), (13, 9)], CRIMSON[3])
            line(im, [(20, 7), (19, 9)], CRIMSON[3])
            rect(im, (2, 22, 2, 23), CRIMSON[3])
            rect(im, (28, 21, 28, 22), PURPLE[3])
        else:
            line(im, [(3, 7), (7, 11), (10, 12)], WHITEGOLD[4])
            line(im, [(4, 10), (7, 13)], GOLD[4])
            line(im, [(28, 7), (25, 11), (22, 12)], WHITEGOLD[4])
            line(im, [(28, 10), (25, 13)], GOLD[4])
            sun(im, 16, 15, GOLD)
            rect(im, (15, 14, 16, 16), WHITEGOLD[4])
            star(im, 3, 22, GOLD[3])
            star(im, 28, 20, GOLD[4])
            star(im, 16, 1, GOLD[4])
    return im


def vanguard():
    im = canvas()
    flame(im, [(4, 21), (3, 15), (6, 17), (5, 9), (9, 12),
               (10, 4), (14, 9), (16, 1), (20, 7), (23, 4),
               (23, 12), (28, 9), (26, 17), (29, 16),
               (27, 25), (21, 29), (10, 29)], CRIMSON, GOLD)
    # Two independently outlined blades cross over the central flame.
    shaded(im, [(5, 4), (10, 6), (23, 21), (20, 24),
                (7, 9)], STEEL)
    line(im, [(7, 6), (20, 21)], STEEL[4])
    shaded(im, [(27, 4), (25, 10), (12, 24), (8, 21),
                (22, 7)], STEEL)
    line(im, [(25, 6), (11, 21)], STEEL[4])
    for points in (
        [(17, 22), (20, 19), (25, 24), (23, 26)],
        [(6, 24), (11, 19), (14, 22), (9, 27)]
    ):
        shaded(im, points, GOLD)
    line(im, [(22, 25), (26, 29)], OUTLINE, 3)
    line(im, [(22, 25), (26, 29)], CRIMSON[3])
    line(im, [(9, 25), (5, 29)], OUTLINE, 3)
    line(im, [(9, 25), (5, 29)], CRIMSON[3])
    gem(im, 16, 18, GOLD, 2)
    return im


def bulwark():
    im = canvas()
    polygon(im, [(4, 8), (8, 4), (24, 4), (28, 8), (27, 20),
                 (21, 27), (16, 31), (10, 27), (4, 20)], CYAN[1], None)
    shaded(im, [(5, 8), (10, 5), (22, 5), (27, 8), (25, 20),
                (21, 25), (16, 29), (10, 25), (6, 20)], CYAN)
    shaded(im, [(8, 10), (12, 8), (20, 8), (24, 10),
                (22, 20), (16, 25), (10, 20)], BLUE)
    line(im, [(7, 9), (7, 18), (11, 24), (16, 28)], CYAN[4])
    line(im, [(25, 10), (24, 19), (20, 24)], CYAN[3])
    shaded(im, [(10, 17), (10, 12), (12, 12), (12, 14),
                (15, 14), (15, 11), (17, 11), (17, 14),
                (20, 14), (20, 12), (22, 12), (22, 19),
                (18, 22), (14, 22), (10, 19)], STEEL)
    rect(im, (14, 17, 18, 22), OUTLINE)
    rect(im, (15, 18, 17, 21), CYAN[3])
    gem(im, 16, 7, CYAN, 2)
    star(im, 3, 5, CYAN[3])
    star(im, 29, 21, CYAN[3])
    rect(im, (2, 13, 2, 16), CYAN[2])
    rect(im, (29, 10, 29, 12), CYAN[2])
    return im


def coin(im, x, y):
    ellipse(im, (x - 2, y - 1, x + 2, y + 2), GOLD[2])
    line(im, [(x - 1, y), (x + 1, y)], GOLD[4])
    rect(im, (x, y + 1, x + 1, y + 1), GOLD[3])


def crystal(im, x, y, height=7):
    shaded(im, [(x, y - height), (x + 3, y - height + 3),
                (x + 2, y), (x, y + 2), (x - 2, y),
                (x - 2, y - height + 3)], BLUE)
    line(im, [(x, y - height + 2), (x - 1, y - 1)], CYAN[4])


def plunder():
    im = canvas()
    # Raised lid with a dark, visible open interior.
    shaded(im, [(5, 7), (24, 5), (28, 8), (27, 15),
                (6, 17), (3, 13)], WOOD)
    polygon(im, [(6, 9), (23, 7), (25, 9), (25, 13),
                 (7, 15)], WOOD[0])
    line(im, [(7, 8), (23, 6)], GOLD[3])
    line(im, [(6, 9), (7, 14)], GOLD[2])
    line(im, [(22, 8), (23, 13)], GOLD[2])
    shaded(im, [(3, 17), (25, 14), (29, 17), (28, 27),
                (7, 30), (3, 26)], WOOD)
    polygon(im, [(5, 17), (24, 15), (27, 17), (8, 21)], OUTLINE)
    for x, y in ((9, 15), (13, 13), (16, 16), (20, 14), (23, 16)):
        coin(im, x, y)
    crystal(im, 22, 13, 8)
    crystal(im, 26, 16, 6)
    coin(im, 12, 17)
    coin(im, 17, 15)
    line(im, [(6, 22), (25, 19)], WOOD[4])
    line(im, [(6, 26), (25, 23)], WOOD[1])
    polygon(im, [(7, 20), (10, 20), (10, 28), (7, 28)], GOLD[2])
    polygon(im, [(23, 18), (26, 18), (25, 27), (22, 27)], GOLD[2])
    line(im, [(8, 21), (8, 27)], GOLD[4])
    rect(im, (15, 20, 19, 25), GOLD[3], OUTLINE)
    rect(im, (17, 22, 17, 23), OUTLINE)
    coin(im, 3, 29)
    coin(im, 28, 29)
    star(im, 12, 5, GOLD[3])
    return im


def royal_forge():
    im = canvas()
    shaded(im, [(21, 2), (27, 2), (27, 12), (21, 12)], SLATE)
    line(im, [(22, 5), (26, 5)], SLATE[1])
    line(im, [(22, 8), (26, 8)], SLATE[1])
    shaded(im, [(7, 9), (23, 9), (28, 14), (28, 27),
                (30, 27), (30, 30), (2, 30), (2, 27),
                (4, 27), (4, 14)], SLATE)
    polygon(im, [(9, 17), (12, 13), (20, 13), (24, 17),
                 (24, 26), (9, 26)], OUTLINE)
    polygon(im, [(11, 18), (14, 15), (19, 15), (22, 18),
                 (22, 26), (11, 26)], CRIMSON[1], None)
    flame(im, [(12, 25), (12, 20), (15, 22), (16, 16),
               (19, 20), (21, 18), (21, 25)], CRIMSON, GOLD)
    line(im, [(13, 25), (21, 25)], GOLD[4])
    for points in (
        [(5, 16), (9, 16)], [(5, 21), (8, 21)],
        [(25, 17), (27, 17)], [(25, 23), (27, 23)],
        [(6, 27), (25, 27)], [(7, 12), (10, 12)]
    ):
        line(im, points, SLATE[0])
    line(im, [(5, 15), (8, 12), (11, 12)], SLATE[3])
    line(im, [(4, 28), (27, 28)], SLATE[3])
    crown(im, 15, 7)
    gem(im, 15, 9, BLUE, 1)
    # Small anvil on the masonry ledge.
    polygon(im, [(2, 21), (8, 21), (7, 23), (5, 24),
                 (6, 26), (2, 26), (3, 24), (1, 23)], IRON[3])
    rect(im, (24, 0, 25, 0), SLATE[2])
    rect(im, (28, 1, 29, 1), SLATE[1])
    return im


def war_academy():
    im = canvas()
    line(im, [(18, 2), (18, 12)], OUTLINE)
    polygon(im, [(19, 2), (28, 3), (26, 6), (29, 8),
                 (19, 7)], BLUE[2])
    line(im, [(20, 3), (26, 4)], BLUE[4])
    rect(im, (21, 4, 22, 5), GOLD[3])
    shaded(im, [(7, 10), (24, 10), (24, 27), (27, 28),
                (27, 30), (4, 30), (4, 28), (7, 27)], SLATE)
    shaded(im, [(5, 8), (9, 8), (9, 11), (12, 11),
                (12, 8), (17, 8), (17, 11), (20, 11),
                (20, 8), (25, 8), (25, 15), (5, 15)], STEEL)
    line(im, [(6, 14), (24, 14)], SLATE[0])
    line(im, [(8, 16), (23, 16)], SLATE[3])
    line(im, [(8, 21), (23, 21)], SLATE[0])
    line(im, [(8, 26), (23, 26)], SLATE[0])
    for x, y in ((11, 17), (20, 22), (16, 25)):
        line(im, [(x, y), (x, y + 3)], SLATE[1])
    polygon(im, [(12, 30), (12, 25), (14, 22), (17, 22),
                 (19, 25), (19, 30)], OUTLINE)
    polygon(im, [(14, 29), (14, 25), (15, 24), (17, 25),
                 (17, 29)], WOOD[2], None)
    rect(im, (10, 17, 12, 20), OUTLINE)
    rect(im, (11, 17, 11, 19), GOLD[3])
    rect(im, (19, 17, 21, 20), OUTLINE)
    rect(im, (20, 17, 20, 19), GOLD[3])
    polygon(im, [(4, 16), (7, 16), (7, 24), (5, 26), (4, 23)], BLUE[2])
    polygon(im, [(24, 16), (27, 16), (27, 23), (25, 26), (24, 24)], BLUE[2])
    line(im, [(5, 18), (5, 22)], GOLD[3])
    line(im, [(25, 18), (25, 22)], GOLD[3])
    return im


def wheel(im, x, y):
    ellipse(im, (x - 4, y - 4, x + 4, y + 4), WOOD[1])
    ellipse(im, (x - 3, y - 3, x + 3, y + 3), WOOD[3])
    ellipse(im, (x - 2, y - 2, x + 2, y + 2), WOOD[0])
    line(im, [(x - 2, y - 2), (x + 2, y + 2)], WOOD[3])
    line(im, [(x - 2, y + 2), (x + 2, y - 2)], WOOD[3])
    rect(im, (x, y - 2, x, y + 2), WOOD[3])
    rect(im, (x - 2, y, x + 2, y), WOOD[3])
    rect(im, (x, y, x, y), GOLD[4])


def supply_wagon():
    im = canvas()
    line(im, [(25, 21), (31, 23)], OUTLINE, 3)
    line(im, [(25, 21), (30, 22)], WOOD[3])
    shaded(im, [(3, 15), (25, 15), (27, 19), (26, 25),
                (5, 25), (3, 22)], WOOD)
    # Covered rear half, with a dark arch revealing cargo.
    shaded(im, [(3, 16), (3, 10), (5, 6), (8, 4),
                (17, 4), (21, 7), (22, 16)], WHITEGOLD)
    line(im, [(8, 5), (6, 9), (6, 15)], GOLD[1])
    line(im, [(13, 5), (11, 9), (11, 15)], GOLD[2])
    polygon(im, [(16, 16), (16, 10), (18, 7), (20, 9),
                 (21, 16)], WOOD[0])
    line(im, [(17, 9), (18, 7), (20, 10), (21, 15)], WHITEGOLD[4])
    crystal(im, 24, 17, 7)
    coin(im, 19, 17)
    coin(im, 23, 18)
    shaded(im, [(3, 18), (26, 18), (26, 24), (5, 24), (3, 22)], WOOD)
    line(im, [(5, 20), (25, 20)], WOOD[4])
    line(im, [(5, 22), (25, 22)], WOOD[0])
    rect(im, (7, 18, 8, 24), GOLD[2], OUTLINE)
    rect(im, (22, 18, 23, 24), GOLD[2], OUTLINE)
    wheel(im, 9, 26)
    wheel(im, 24, 26)
    rect(im, (13, 25, 19, 26), OUTLINE)
    return im


def window(im, x, y, width=4, height=5):
    rect(im, (x, y, x + width, y + height), OUTLINE)
    rect(im, (x + 1, y + 1, x + width - 1, y + height - 1), GOLD[3])
    rect(im, (x + 1, y + 1, x + width - 1, y + 2), GOLD[4])
    line(im, [(x + width // 2, y + 1),
              (x + width // 2, y + height - 1)], WOOD[1])


def guild_hall():
    im = canvas()
    shaded(im, [(23, 3), (27, 3), (27, 12), (23, 12)], SLATE)
    line(im, [(24, 5), (26, 5)], SLATE[3])
    shaded(im, [(5, 13), (25, 13), (27, 28), (4, 28)], WHITEGOLD)
    polygon(im, [(3, 14), (16, 3), (29, 14), (28, 16),
                 (16, 7), (4, 16)], SLATE[1])
    line(im, [(5, 13), (16, 4), (27, 13)], SLATE[3])
    for points in (
        [(9, 11), (13, 11)], [(14, 8), (18, 8)],
        [(19, 11), (23, 11)], [(6, 14), (10, 14)],
        [(22, 14), (26, 14)]
    ):
        line(im, points, SLATE[2])
    line(im, [(5, 16), (26, 16)], WOOD[1], 2)
    line(im, [(6, 17), (6, 27)], WOOD[1], 2)
    line(im, [(25, 17), (25, 27)], WOOD[1], 2)
    line(im, [(16, 8), (16, 17)], WOOD[1])
    line(im, [(7, 27), (11, 23)], WOOD[2])
    line(im, [(21, 23), (24, 27)], WOOD[2])
    window(im, 8, 18, 4, 5)
    window(im, 20, 18, 4, 5)
    polygon(im, [(13, 28), (13, 22), (14, 20), (17, 20),
                 (19, 22), (19, 28)], OUTLINE)
    rect(im, (14, 22, 17, 27), WOOD[2])
    line(im, [(15, 22), (15, 27)], WOOD[3])
    rect(im, (17, 25, 17, 25), GOLD[4])
    rect(im, (3, 28, 28, 30), SLATE[1], OUTLINE)
    line(im, [(5, 29), (26, 29)], SLATE[3])
    # Crossed banner poles and two colored cloth tails over the entrance.
    line(im, [(11, 10), (20, 18)], OUTLINE)
    line(im, [(21, 10), (12, 18)], OUTLINE)
    polygon(im, [(10, 11), (14, 13), (12, 18), (10, 16), (8, 16)], BLUE[2])
    polygon(im, [(22, 11), (18, 13), (20, 18), (22, 16), (24, 16)], CRIMSON[2])
    rect(im, (10, 13, 11, 14), GOLD[3])
    rect(im, (21, 13, 22, 14), GOLD[3])
    gem(im, 16, 12, GOLD, 1)
    return im


def compose(columns, rows, icons):
    sheet = Image.new("RGBA", (columns * 32, rows * 32), TRANSPARENT)
    assert len(icons) == columns * rows
    for index, icon in enumerate(icons):
        assert icon.mode == "RGBA" and icon.size == (32, 32)
        sheet.alpha_composite(icon, ((index % columns) * 32,
                                     (index // columns) * 32))
    return sheet


def verify_sheet(im, expected_size, columns, rows):
    assert im.mode == "RGBA", f"Expected RGBA, got {im.mode}"
    assert im.size == expected_size, (im.size, expected_size)
    alpha_values = set(im.getchannel("A").getdata())
    assert alpha_values == {0, 255}, f"Nonbinary or missing alpha: {alpha_values}"
    for row in range(rows):
        for col in range(columns):
            cell = im.crop((col * 32, row * 32,
                            (col + 1) * 32, (row + 1) * 32))
            assert cell.getchannel("A").getbbox() is not None, (
                f"Empty cell at column {col}, row {row}"
            )


if __name__ == "__main__":
    output = Path("public/assets/ui")
    output.mkdir(parents=True, exist_ok=True)

    equipment = compose(
        5, 3,
        [sword(rarity) for rarity in range(5)]
        + [shield(rarity) for rarity in range(5)]
        + [armor(rarity) for rarity in range(5)]
    )
    tactics = compose(
        7, 1,
        [vanguard(), bulwark(), plunder(), royal_forge(),
         war_academy(), supply_wagon(), guild_hall()]
    )

    verify_sheet(equipment, (160, 96), 5, 3)
    verify_sheet(tactics, (224, 32), 7, 1)

    equipment_path = output / "equipment-sheet.png"
    tactics_path = output / "tactics-sheet.png"
    equipment.save(equipment_path, format="PNG", optimize=True)
    tactics.save(tactics_path, format="PNG", optimize=True)

    # Verify the actual saved artifacts as well as the in-memory sheets.
    with Image.open(equipment_path) as saved:
        verify_sheet(saved, (160, 96), 5, 3)
    with Image.open(tactics_path) as saved:
        verify_sheet(saved, (224, 32), 7, 1)