from pathlib import Path
from math import hypot
from PIL import Image, ImageDraw, ImageChops

# All artwork is rasterized directly at its final resolution.
# No resampling, antialiasing, gradients, or partial-alpha pixels are used.

INK = "#141928"
STEEL_D = "#354563"
STEEL_M = "#7389a4"
STEEL_L = "#b9d2df"
WHITE = "#f3fcff"
GOLD_D = "#83502b"
GOLD_M = "#d79a36"
GOLD_L = "#ffdb70"
GOLD_W = "#fff4bd"
BLUE_D = "#172e63"
BLUE_M = "#2459a0"
BLUE_L = "#4b91d0"
RED_D = "#641d39"
RED_M = "#b62b45"
RED_L = "#ee594c"
CYAN = "#80f3ff"


class Pixels:
    def __init__(self, size):
        self.image = Image.new("RGBA", size, (0, 0, 0, 0))
        self.draw = ImageDraw.Draw(self.image)

    def polygon(self, points, fill, edge=None):
        points = [(round(x), round(y)) for x, y in points]
        self.draw.polygon(points, fill=fill)
        if edge:
            self.draw.line(points + [points[0]], fill=edge, width=1)

    def rect(self, box, fill, edge=None):
        self.draw.rectangle(tuple(round(v) for v in box), fill=fill, outline=edge)

    def ellipse(self, box, fill, edge=None):
        self.draw.ellipse(tuple(round(v) for v in box), fill=fill, outline=edge)

    def line(self, points, fill, width=1):
        self.draw.line(
            [(round(x), round(y)) for x, y in points],
            fill=fill,
            width=width,
        )

    def dot(self, x, y, fill):
        self.draw.point((round(x), round(y)), fill=fill)

    def outline(self, color=INK):
        """Add exactly one opaque, four-neighbor silhouette outline."""
        alpha = self.image.getchannel("A")
        expanded = alpha.copy()
        w, h = self.image.size
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            shifted = Image.new("L", (w, h), 0)
            shifted.paste(alpha, (dx, dy))
            expanded = ImageChops.lighter(expanded, shifted)
        result = Image.new("RGBA", (w, h), color)
        result.putalpha(expanded)
        result.alpha_composite(self.image)
        self.image = result
        self.draw = ImageDraw.Draw(self.image)


def sparkle(p, x, y, color=GOLD_W, radius=2):
    p.line([(x - radius, y), (x + radius, y)], color)
    p.line([(x, y - radius), (x, y + radius)], color)
    p.dot(x, y, WHITE)


def sword(p, grip, tip, width=4):
    """Forged blade, fuller, bright cutting edge, guard, and leather grip."""
    gx, gy = grip
    tx, ty = tip
    length = hypot(tx - gx, ty - gy)
    ux, uy = (tx - gx) / length, (ty - gy) / length
    nx, ny = -uy, ux

    def at(distance, across=0):
        return gx + ux * distance + nx * across, gy + uy * distance + ny * across

    p.line([at(-5), at(1)], INK, 4)
    p.line([at(-4), at(0)], RED_D, 2)
    p.line([at(-3, -1), at(-2, -1)], GOLD_L)
    p.polygon(
        [at(2, -width / 2), at(length - 4, -width / 2),
         (tx, ty), at(length - 4, width / 2), at(2, width / 2)],
        STEEL_L, INK,
    )
    p.line([at(3, -1), at(length - 5, -1), (tx, ty)], WHITE)
    p.line([at(3, 1), at(length - 5, 1)], STEEL_M)
    p.line([at(1, -5), at(0, -3), at(0, 3), at(1, 5)], GOLD_D, 3)
    p.line([at(0, -5), at(-1, -3), at(-1, 3), at(0, 5)], GOLD_L)
    p.ellipse((gx - ux * 5 - 1, gy - uy * 5 - 1,
               gx - ux * 5 + 1, gy - uy * 5 + 1), GOLD_M)


def kite_shield(p, x, y, narrow=False):
    w = 10 if narrow else 13
    points = [(x, y + 2), (x + w // 2, y),
              (x + w, y + 2), (x + w - 1, y + 11),
              (x + w // 2, y + 17), (x + 1, y + 11)]
    p.polygon(points, GOLD_D, INK)
    p.polygon([(x + 1, y + 3), (x + w // 2, y + 1),
               (x + w - 1, y + 3), (x + w - 2, y + 10),
               (x + w // 2, y + 15), (x + 2, y + 10)], GOLD_L)
    p.polygon([(x + 3, y + 4), (x + w // 2, y + 3),
               (x + w - 3, y + 4), (x + w - 3, y + 10),
               (x + w // 2, y + 13), (x + 3, y + 10)], BLUE_D)
    p.line([(x + 4, y + 5), (x + 4, y + 10)], BLUE_L)
    cx = x + w // 2
    p.rect((cx - 1, y + 5, cx + 1, y + 11), GOLD_M)
    p.rect((cx - 3, y + 7, cx + 3, y + 8), GOLD_L)
    p.line([(cx, y + 5), (cx, y + 11)], GOLD_W)
    p.dot(x + 2, y + 3, WHITE)
    p.dot(x + w - 2, y + 4, GOLD_W)


def knight(frame):
    p = Pixels((64, 64))
    bob = -2 if frame == 1 else 0
    lean = -2 if frame == 3 else 3 if frame == 4 else 0

    def pts(points):
        return [(x + lean, y + bob) for x, y in points]

    def poly(points, fill, edge=None):
        p.polygon(pts(points), fill, edge)

    # Cape sits behind armor, with several independent stepped folds.
    cape_end = (13, 49) if frame in (0, 3) else (10, 46)
    poly([(25, 28), (19, 31), (16, 38), cape_end,
          (19, 48), (22, 51), (29, 44), (31, 31)], RED_D, INK)
    poly([(24, 30), (20, 35), (18, 43), (14, 46),
          (21, 44), (24, 47), (27, 37)], RED_M)
    poly([(22, 32), (21, 38), (18, 43), (22, 41), (25, 34)], RED_L)
    p.line(pts([(14, 47), (19, 46), (22, 49), (25, 45)]), GOLD_M)

    # Leg poses retain a fixed ground plane.
    if frame == 0:
        legs = [(24, 47, 21, 56), (33, 47, 37, 56)]
    elif frame == 2:
        legs = [(24, 47, 28, 56), (33, 47, 31, 56)]
    elif frame == 4:
        legs = [(27, 47, 23, 56), (37, 46, 43, 56)]
    else:
        legs = [(25 + lean, 47 + bob, 25 + lean, 56),
                (33 + lean, 47 + bob, 34 + lean, 56)]
    for x, y, fx, fy in legs:
        p.polygon([(x - 3, y), (x + 3, y), (fx + 3, fy - 2),
                   (fx + 5, fy), (fx + 5, 57), (fx - 3, 57),
                   (fx - 3, fy - 3)], STEEL_D, INK)
        p.line([(x - 1, y + 1), (fx - 1, fy - 3), (fx + 2, fy - 2)], STEEL_L, 2)
        p.line([(fx - 2, 56), (fx + 3, 56)], STEEL_M)
        p.dot(fx - 1, 53, WHITE)

    poly([(23, 31), (35, 30), (38, 41), (35, 49),
          (23, 49), (21, 42)], BLUE_D, INK)
    poly([(25, 32), (32, 32), (33, 43), (30, 48), (24, 47)], BLUE_M)
    poly([(25, 33), (28, 33), (27, 42), (24, 45)], BLUE_L)
    p.line(pts([(23, 47), (29, 48), (35, 47)]), GOLD_L)
    p.line(pts([(29, 33), (29, 44)]), GOLD_M, 2)
    p.line(pts([(26, 36), (32, 36)]), GOLD_L)
    p.line(pts([(22, 41), (36, 41)]), GOLD_D, 3)
    p.line(pts([(22, 40), (36, 40)]), GOLD_L)
    p.rect((28 + lean, 40 + bob, 31 + lean, 42 + bob), GOLD_W, GOLD_D)

    for sx, sy in ((21, 30), (34, 29)):
        poly([(sx - 3, sy + 2), (sx, sy), (sx + 5, sy + 1),
              (sx + 6, sy + 6), (sx + 1, sy + 8),
              (sx - 3, sy + 6)], STEEL_D, INK)
        poly([(sx - 2, sy + 2), (sx, sy + 1), (sx + 4, sy + 2),
              (sx + 3, sy + 5), (sx - 2, sy + 5)], STEEL_L)
        p.line(pts([(sx - 1, sy + 2), (sx + 2, sy + 2)]), WHITE)
        p.line(pts([(sx - 2, sy + 6), (sx + 2, sy + 7),
                    (sx + 5, sy + 5)]), GOLD_M)

    # Plume: curled crimson silhouette, amber quill, individual feather teeth.
    poly([(29, 17), (27, 12), (23, 10), (18, 11), (13, 14),
          (9, 19), (14, 18), (12, 22), (18, 19), (17, 23),
          (22, 18), (25, 19), (27, 22), (31, 20)], RED_D, INK)
    poly([(27, 17), (24, 12), (19, 12), (15, 15), (12, 18),
          (19, 16), (17, 20), (23, 16)], RED_M)
    p.line(pts([(14, 16), (19, 13), (23, 13), (27, 17)]), RED_L, 2)
    p.line(pts([(18, 14), (23, 14), (28, 19)]), GOLD_L)

    # Greathelm with right-facing brow and projecting cheek guard.
    poly([(25, 17), (34, 16), (39, 20), (40, 27), (37, 31),
          (27, 32), (23, 28), (23, 21)], STEEL_D, INK)
    poly([(25, 20), (28, 18), (34, 18), (37, 20),
          (36, 24), (25, 24)], STEEL_M)
    poly([(26, 19), (30, 18), (33, 18), (31, 23), (25, 23)], STEEL_L)
    p.line(pts([(26, 19), (30, 18), (34, 18)]), WHITE)
    poly([(25, 24), (39, 23), (39, 26), (35, 27),
          (35, 30), (32, 31), (32, 27), (25, 27)], INK)
    p.line(pts([(33, 24), (38, 24)]), CYAN)
    p.dot(37 + lean, 24 + bob, WHITE)
    poly([(26, 28), (30, 29), (31, 31), (27, 30)], STEEL_M)
    p.line(pts([(37, 28), (36, 30)]), STEEL_L)
    for hx, hy in ((27, 28), (29, 29), (38, 21)):
        p.dot(hx + lean, hy + bob, GOLD_M)

    shield_x = 18 + lean
    shield_y = 35 + bob
    kite_shield(p, shield_x, shield_y, frame == 2)

    # Sword positions and right gauntlet.
    if frame == 3:
        grip, tip = (36, 29), (20, 7)
    elif frame == 4:
        grip, tip = (41, 36), (61, 34)
    elif frame == 5:
        grip, tip = (43, 29), (45, 4)
    else:
        grip, tip = (40 + lean, 39 + bob), (48 + lean, 20 + bob)
    p.line([(37 + lean, 34 + bob), grip], STEEL_D, 5)
    p.line([(37 + lean, 33 + bob), (grip[0] - 1, grip[1] - 1)], STEEL_L, 2)
    sword(p, grip, tip)
    p.rect((grip[0] - 2, grip[1] - 1, grip[0] + 1, grip[1] + 2),
           STEEL_M, INK)
    p.line([(grip[0] - 1, grip[1] - 1), (grip[0] + 1, grip[1] - 1)], WHITE)
    p.outline()

    if frame == 3:
        sparkle(p, 20, 7, WHITE, 2)
    if frame == 4:
        # A broad, broken pixel crescent wraps around the horizontal blade.
        p.polygon([(44, 14), (51, 17), (57, 22), (61, 29),
                   (62, 35), (60, 42), (55, 48), (48, 51),
                   (52, 46), (56, 39), (57, 33), (55, 27),
                   (51, 21)], GOLD_M)
        p.polygon([(46, 16), (53, 21), (58, 28), (60, 34),
                   (58, 41), (53, 47), (56, 40), (57, 34),
                   (54, 26), (50, 21)], GOLD_W)
        p.line([(51, 21), (56, 27), (58, 33), (57, 39)], WHITE, 2)
        p.line([(46, 30), (52, 31)], GOLD_W)
        p.line([(48, 40), (53, 39)], GOLD_L)
        p.dot(61, 23, WHITE)
        p.dot(51, 15, GOLD_L)
    if frame == 5:
        for x, y, r in ((39, 9, 2), (51, 17, 2), (39, 22, 1), (50, 5, 1)):
            sparkle(p, x, y, GOLD_W, r)
    return p.image


def ranger(frame):
    p = Pixels((48, 48))
    bob = -1 if frame == 1 else 0
    draw_pose = frame == 2
    release = frame == 3
    green_d, green_m, green_l = "#153d35", "#28734b", "#64b56a"
    skin_d, skin_m, skin_l = "#a45f41", "#e0a66a", "#ffe0a0"

    # Quiver and fletching are visible behind the hood.
    p.polygon([(12, 21), (16, 20), (22, 35), (17, 37)], "#633d30", INK)
    p.line([(14, 24), (18, 32)], "#b98446")
    for x, y in ((11, 15), (14, 13), (17, 15)):
        p.line([(x, y), (x + 5, y + 12)], "#c0a174")
        p.polygon([(x - 2, y), (x - 2, y + 4), (x + 2, y + 5),
                   (x + 1, y + 1)], "#d1e0b5", INK)
    p.polygon([(16, 22 + bob), (12, 29), (9 if frame == 1 else 11, 39),
               (17, 37), (21, 41), (27, 36), (27, 24 + bob)], green_d, INK)
    p.polygon([(17, 24), (15, 32), (13, 36), (18, 35),
               (21, 38), (22, 29)], green_m)
    p.line([(16, 28), (15, 34), (18, 36)], green_l)
    for x, ex in ((20, 19), (27, 29)):
        p.polygon([(x - 2, 34), (x + 2, 34), (ex + 2, 41),
                   (ex + 4, 42), (ex + 4, 43), (ex - 2, 43)],
                  "#664532", INK)
        p.line([(x, 36), (ex, 40)], "#b7854c")
        p.line([(ex - 1, 42), (ex + 2, 42)], "#bc9b60")

    p.polygon([(18, 23 + bob), (27, 22 + bob), (30, 33),
               (27, 37), (18, 36), (16, 30)], "#755036", INK)
    p.polygon([(19, 25 + bob), (24, 24 + bob), (25, 34), (19, 34)], "#af8248")
    p.line([(18, 33), (28, 32)], "#342c2a", 2)
    p.rect((23, 32, 25, 34), GOLD_M)
    p.line([(18, 25 + bob), (27, 31)], "#c9b06a", 2)

    # Hood has a deep opening, sunlit rim, and a tapered back.
    p.polygon([(14, 15 + bob), (18, 10 + bob), (25, 10 + bob),
               (30, 14 + bob), (31, 21 + bob), (27, 25 + bob),
               (18, 25 + bob), (13, 21 + bob)], green_d, INK)
    p.polygon([(16, 15 + bob), (19, 11 + bob), (24, 11 + bob),
               (28, 14 + bob), (25, 15 + bob), (19, 19 + bob),
               (16, 23 + bob)], green_m)
    p.line([(17, 15 + bob), (20, 12 + bob), (24, 12 + bob)], green_l)
    p.polygon([(22, 15 + bob), (28, 15 + bob), (30, 20 + bob),
               (28, 24 + bob), (22, 24 + bob), (19, 21 + bob)], skin_d, INK)
    p.polygon([(23, 16 + bob), (27, 16 + bob), (28, 19 + bob),
               (30, 20 + bob), (27, 21 + bob), (27, 23 + bob),
               (23, 23 + bob)], skin_m)
    p.line([(24, 17 + bob), (27, 17 + bob)], skin_l)
    p.rect((27, 18 + bob, 28, 19 + bob), INK)
    p.dot(28, 18 + bob, "#e9ffd4")
    p.polygon([(20, 15 + bob), (26, 14 + bob), (28, 16 + bob),
               (24, 16 + bob), (23, 20 + bob), (21, 18 + bob),
               (21, 23 + bob), (18, 22 + bob)], GOLD_M)
    p.line([(20, 16 + bob), (22, 15 + bob), (25, 15 + bob)], GOLD_W)
    p.line([(20, 20 + bob), (19, 23 + bob)], GOLD_L)

    bx = 36 if draw_pose or release else 33
    p.line([(27, 27), (bx - 1, 28)], "#57422f", 4)
    p.line([(28, 26), (bx - 1, 27)], skin_m, 2)
    # Recurve tips curl back toward the archer.
    bow = [(bx - 2, 15), (bx + 1, 17), (bx + 3, 22),
           (bx + 4, 28), (bx + 2, 34), (bx - 1, 38), (bx - 3, 38)]
    p.line(bow, INK, 3)
    p.line(bow, "#a86b37")
    p.line([(bx + 1, 19), (bx + 2, 23), (bx + 3, 28)], "#ebc47b")
    pull = 24 if draw_pose else bx
    p.line([(bx - 2, 15), (pull, 27), (bx - 3, 38)], "#dce6bd")
    if draw_pose:
        p.line([(22, 28), (20, 30), (25, 28)], skin_m, 3)
        p.line([(23, 27), (42, 27)], "#d7c68d")
        p.polygon([(40, 24), (45, 27), (40, 29)], "#89fa97", INK)
        p.line([(41, 26), (43, 27)], "#eaffd0")
        p.polygon([(24, 27), (26, 24), (29, 25), (27, 27)], "#c1e9a4")
    elif release:
        p.line([(22, 27), (27, 25)], skin_l, 2)
        p.line([(39, 25), (46, 25)], "#d9f8b1")
        p.polygon([(44, 23), (46, 25), (44, 27)], "#b6ffad")
    else:
        p.line([(26, 29), (28, 33)], skin_m, 3)
    p.outline()
    if draw_pose:
        sparkle(p, 43, 21, "#c4ff9e", 1)
    return p.image


def flame(p, x, y, variant=0, scale=1):
    def tr(points):
        return [(x + a * scale, y + b * scale) for a, b in points]
    sway = 1 if variant % 2 else -1
    p.polygon(tr([(-4, 3), (-5, 0), (-3, -4), (-2, -1),
                  (sway, -8), (3, -4), (3, -1), (5, -3),
                  (5, 2), (2, 5), (-2, 5)]), "#a52932", INK)
    p.polygon(tr([(-3, 2), (-3, -1), (-1, -3), (0, -5),
                  (2, -2), (3, 1), (2, 4), (-1, 4)]), "#f36b29")
    p.polygon(tr([(-1, 3), (-2, 1), (0, -2), (2, 1), (1, 3)]), "#ffd45f")
    p.line(tr([(0, 0), (0, 2)]), "#fff6be")


def pyro(frame):
    p = Pixels((48, 48))
    bob = -1 if frame == 1 else 0
    charge, cast = frame == 2, frame == 3
    # Boots, cloak lining, and layered robe.
    p.rect((18, 40, 23, 43), "#4b303c", INK)
    p.rect((27, 40, 33, 43), "#4b303c", INK)
    p.line([(19, 42), (22, 42)], "#af7147")
    p.line([(28, 42), (32, 42)], "#af7147")
    p.polygon([(18, 24 + bob), (28, 23 + bob), (31, 30),
               (35, 40), (31, 42), (26, 40), (21, 42),
               (14, 40), (17, 32)], RED_D, INK)
    p.polygon([(20, 25 + bob), (26, 25 + bob), (27, 33),
               (30, 40), (25, 39), (22, 40), (18, 39)], "#bc3c39")
    p.polygon([(21, 27 + bob), (23, 28 + bob), (22, 35),
               (24, 39), (20, 39), (19, 35)], "#f17b3f")
    p.line([(16, 39), (21, 41), (26, 39), (31, 41), (34, 40)], GOLD_M)
    p.line([(24, 27 + bob), (26, 37)], GOLD_L)
    p.line([(18, 31), (28, 31)], "#572638", 2)
    p.rect((23, 30, 26, 32), GOLD_M, GOLD_D)
    p.dot(24, 31, GOLD_W)

    # Shadowed face with warm, luminous eyes and a small scarf.
    p.polygon([(18, 17 + bob), (28, 16 + bob), (30, 21 + bob),
               (28, 26 + bob), (20, 26 + bob), (17, 22 + bob)], "#3d293c", INK)
    p.polygon([(24, 18 + bob), (28, 18 + bob), (29, 22 + bob),
               (27, 24 + bob), (24, 23 + bob)], "#7c4743")
    p.line([(21, 21 + bob), (23, 21 + bob)], "#ffc654")
    p.line([(27, 20 + bob), (29, 20 + bob)], "#ffd76a")
    p.dot(28, 20 + bob, GOLD_W)
    p.polygon([(19, 25 + bob), (25, 26 + bob), (29, 24 + bob),
               (28, 28 + bob), (22, 29 + bob)], "#ee8a42", INK)
    p.line([(21, 26 + bob), (25, 27 + bob), (27, 26 + bob)], GOLD_L)

    # Crooked hat: deliberately asymmetric with an amber turned tip.
    p.polygon([(15, 18 + bob), (17, 13 + bob), (19, 8 + bob),
               (23, 8 + bob), (26, 12 + bob), (30, 13 + bob),
               (27, 14 + bob), (24, 13 + bob), (28, 17 + bob),
               (32, 19 + bob), (29, 21 + bob), (19, 21 + bob),
               (13, 20 + bob)], RED_D, INK)
    p.polygon([(17, 17 + bob), (20, 9 + bob), (22, 9 + bob),
               (23, 13 + bob), (26, 17 + bob)], RED_M)
    p.line([(19, 15 + bob), (21, 10 + bob), (22, 12 + bob)], RED_L)
    p.line([(16, 18 + bob), (23, 19 + bob), (29, 18 + bob)], GOLD_M, 2)
    p.line([(16, 18 + bob), (22, 18 + bob)], GOLD_L)
    p.dot(24, 18 + bob, GOLD_W)
    p.line([(25, 12 + bob), (28, 13 + bob)], GOLD_L)

    sx = 36 if cast else 34
    sy = 16 if cast else 12 if charge else 20
    p.polygon([(28, 27), (32, 26), (sx, sy + 7),
               (sx + 2, sy + 9), (32, 32), (28, 32)], RED_M, INK)
    p.line([(29, 28), (32, 28), (sx, sy + 8)], "#ed7542")
    p.line([(sx - 1, 41), (sx, sy + 10), (sx - 2, sy + 5),
            (sx + 1, sy + 2)], INK, 4)
    p.line([(sx - 1, 41), (sx, sy + 10), (sx - 2, sy + 5),
            (sx + 1, sy + 2)], "#8e5639", 2)
    p.line([(sx - 2, 36), (sx - 1, 29), (sx - 1, sy + 10)], "#d89c54")
    p.line([(sx - 3, sy + 6), (sx, sy + 8), (sx + 3, sy + 5)], GOLD_M, 2)
    p.polygon([(sx, sy - 3), (sx + 3, sy), (sx + 1, sy + 5),
               (sx - 2, sy + 2)], "#ffb33f", INK)
    p.line([(sx, sy - 1), (sx + 1, sy + 2)], GOLD_W)
    flame(p, sx, sy - 2, frame)
    p.rect((sx - 2, sy + 10, sx + 1, sy + 12), "#d79866", INK)
    p.dot(sx - 1, sy + 10, "#ffce91")
    p.outline()

    if charge:
        p.line([(28, 14), (27, 11), (30, 8), (35, 7)], "#ffab44")
        p.line([(39, 12), (41, 17), (39, 21)], "#f96b32")
        for x, y in ((29, 17), (40, 9), (25, 10), (39, 24)):
            sparkle(p, x, y, GOLD_L, 1)
    if cast:
        p.polygon([(39, 18), (44, 17), (41, 14), (46, 15),
                   (46, 20), (43, 23), (38, 22)], "#ec542a")
        p.polygon([(39, 19), (44, 18), (46, 19),
                   (43, 21), (39, 21)], "#ffd064")
        p.line([(40, 19), (44, 19)], GOLD_W)
        p.line([(42, 11), (44, 10)], "#ffb448")
        p.dot(46, 25, "#ffcc62")
        p.dot(39, 27, "#f47c36")
    return p.image


def banneret(frame):
    p = Pixels((48, 48))
    raised = frame == 2
    bob = -1 if raised else 0
    # Long blue mantle and armored greaves.
    p.polygon([(16, 24 + bob), (12, 38), (17, 36), (21, 40),
               (29, 37), (29, 24 + bob)], BLUE_D, INK)
    p.polygon([(17, 26), (15, 35), (19, 34), (22, 37), (23, 27)], BLUE_M)
    p.line([(14, 37), (17, 35), (21, 38)], GOLD_M)
    for x in (20, 27):
        p.polygon([(x - 2, 34), (x + 2, 34), (x + 2, 40),
                   (x + 4, 42), (x + 4, 43), (x - 2, 43)], STEEL_D, INK)
        p.line([(x - 1, 36), (x - 1, 40), (x + 2, 42)], STEEL_L, 2)
        p.line([(x - 1, 42), (x + 3, 42)], GOLD_M)
    p.polygon([(17, 24 + bob), (27, 23 + bob), (30, 31),
               (28, 37), (18, 37), (15, 30)], BLUE_D, INK)
    p.polygon([(19, 25 + bob), (25, 25 + bob), (26, 34),
               (21, 35), (18, 33)], BLUE_M)
    p.line([(20, 26 + bob), (21, 32)], BLUE_L, 2)
    p.line([(23, 25 + bob), (23, 34)], GOLD_L)
    p.line([(20, 28 + bob), (26, 28 + bob)], GOLD_L)
    p.line([(17, 34), (28, 34)], GOLD_M, 2)
    p.dot(23, 34, GOLD_W)

    for x in (16, 28):
        p.polygon([(x - 3, 25 + bob), (x, 23 + bob),
                   (x + 4, 25 + bob), (x + 3, 29 + bob),
                   (x - 2, 29 + bob)], STEEL_M, INK)
        p.line([(x - 2, 25 + bob), (x, 24 + bob),
                (x + 2, 25 + bob)], WHITE)
        p.line([(x - 2, 28 + bob), (x + 2, 28 + bob)], GOLD_M)

    # Pale hair, cheek, silver-gold helm, and layered wing ornaments.
    p.polygon([(17, 17 + bob), (27, 16 + bob), (28, 23 + bob),
               (24, 27 + bob), (18, 25 + bob), (16, 22 + bob)], GOLD_D, INK)
    p.polygon([(23, 17 + bob), (28, 18 + bob), (29, 22 + bob),
               (26, 24 + bob), (22, 23 + bob)], "#edb68b", INK)
    p.dot(27, 20 + bob, BLUE_D)
    p.dot(27, 19 + bob, WHITE)
    p.line([(25, 23 + bob), (26, 23 + bob)], "#fff0c5")
    p.polygon([(17, 14 + bob), (21, 11 + bob), (27, 12 + bob),
               (30, 16 + bob), (29, 19 + bob), (22, 18 + bob),
               (20, 23 + bob), (16, 22 + bob)], STEEL_D, INK)
    p.polygon([(18, 15 + bob), (22, 12 + bob), (26, 13 + bob),
               (28, 16 + bob), (22, 16 + bob), (19, 20 + bob)], STEEL_L)
    p.line([(19, 14 + bob), (22, 13 + bob), (25, 13 + bob)], WHITE)
    p.line([(22, 12 + bob), (23, 16 + bob), (29, 17 + bob)], GOLD_L)
    p.dot(24, 16 + bob, "#71d6e0")
    p.polygon([(17, 18 + bob), (13, 15 + bob), (11, 10 + bob),
               (14, 12 + bob), (14, 9 + bob), (17, 12 + bob),
               (18, 15 + bob), (20, 17 + bob)], STEEL_M, INK)
    p.line([(13, 12 + bob), (15, 16 + bob), (17, 17 + bob)], WHITE)
    p.line([(15, 12 + bob), (17, 15 + bob)], GOLD_L)
    p.polygon([(28, 15 + bob), (30, 11 + bob), (32, 9 + bob),
               (32, 13 + bob), (30, 17 + bob)], STEEL_L, INK)
    p.dot(31, 12 + bob, WHITE)

    # Standard is kept clear of the helmet so both silhouettes read.
    sx, top = 35, 3 if raised else 6
    p.line([(sx, 42), (sx, top + 3)], GOLD_D, 3)
    p.line([(sx - 1, 41), (sx - 1, top + 3)], GOLD_L)
    p.polygon([(sx, top), (sx + 2, top + 4), (sx, top + 7),
               (sx - 2, top + 4)], GOLD_L, INK)
    p.dot(sx, top + 3, GOLD_W)
    if frame == 1:
        cloth = [(36, top + 6), (41, top + 7), (45, top + 5),
                 (44, top + 12), (46, top + 16), (40, top + 16),
                 (36, top + 14)]
    else:
        cloth = [(36, top + 6), (41, top + 5), (46, top + 7),
                 (44, top + 11), (46, top + 15), (41, top + 14),
                 (36, top + 15)]
    p.polygon(cloth, BLUE_D, INK)
    p.polygon([(37, top + 7), (41, top + 7), (44, top + 8),
               (42, top + 11), (44, top + 13), (38, top + 12)], BLUE_M)
    p.line([(37, top + 7), (41, top + 6), (45, top + 8)], GOLD_L)
    p.line([(37, top + 14), (41, top + 13), (45, top + 15)], GOLD_M)
    p.line([(40, top + 8), (40, top + 12)], GOLD_L)
    p.line([(38, top + 10), (42, top + 10)], GOLD_L)
    p.dot(40, top + 10, GOLD_W)
    hand_y = 23 if raised else 29
    p.line([(29, 28 + bob), (33, hand_y), (35, hand_y)], STEEL_D, 4)
    p.line([(29, 27 + bob), (33, hand_y - 1)], STEEL_L, 2)
    p.rect((33, hand_y - 1, 36, hand_y + 1), STEEL_M, INK)
    p.dot(34, hand_y - 1, WHITE)
    p.outline()
    if frame == 3:
        for x, y, color, r in (
            (10, 30, "#bcffc0", 2), (29, 38, GOLD_W, 2),
            (18, 7, GOLD_L, 1), (40, 33, "#86efb2", 2),
            (14, 41, GOLD_L, 1), (31, 20, "#c6ffca", 1),
        ):
            sparkle(p, x, y, color, r)
        p.line([(9, 36), (11, 38), (14, 39)], "#65c68f")
        p.line([(28, 42), (32, 41), (34, 38)], "#a9e8a3")
    return p.image


def portrait():
    p = Pixels((64, 64))
    p.rect((0, 0, 63, 63), INK)
    p.rect((1, 1, 62, 62), GOLD_D)
    p.rect((2, 2, 61, 61), GOLD_L)
    p.rect((3, 3, 60, 60), "#13203b")
    p.rect((5, 5, 58, 58), "#1c3051", "#365072")
    p.polygon([(6, 6), (40, 6), (6, 40)], "#243d5a")
    p.polygon([(58, 21), (58, 58), (28, 58)], "#101b32")

    # Red mantle and cropped cobalt bust.
    p.polygon([(14, 43), (24, 36), (43, 36), (53, 44),
               (58, 58), (6, 58)], RED_D, INK)
    p.polygon([(13, 47), (23, 42), (24, 58), (8, 58)], RED_M)
    p.line([(15, 47), (11, 56)], RED_L, 2)
    p.polygon([(22, 40), (41, 40), (49, 58), (16, 58)], BLUE_D, INK)
    p.polygon([(26, 43), (36, 43), (40, 58), (22, 58)], BLUE_M)
    p.polygon([(26, 44), (30, 44), (28, 58), (23, 58)], BLUE_L)
    p.line([(32, 43), (32, 58)], GOLD_M, 3)
    p.line([(26, 49), (38, 49)], GOLD_L, 3)
    p.line([(32, 44), (32, 56)], GOLD_W)

    for x, y in ((13, 43), (42, 42)):
        p.polygon([(x - 5, y + 3), (x - 2, y - 2),
                   (x + 5, y - 3), (x + 11, y + 2),
                   (x + 12, y + 9), (x + 5, y + 13),
                   (x - 4, y + 10)], STEEL_D, INK)
        p.polygon([(x - 3, y + 2), (x, y - 1), (x + 5, y - 1),
                   (x + 9, y + 2), (x + 7, y + 6),
                   (x - 3, y + 6)], STEEL_M)
        p.polygon([(x - 2, y + 2), (x, y), (x + 5, y),
                   (x + 6, y + 2), (x + 3, y + 4),
                   (x - 2, y + 4)], STEEL_L)
        p.line([(x, y), (x + 4, y)], WHITE, 2)
        p.line([(x - 3, y + 9), (x + 4, y + 11),
                (x + 9, y + 8)], GOLD_M, 2)

    # A large feather curling toward the left.
    p.polygon([(31, 20), (29, 12), (24, 7), (17, 6),
               (11, 9), (7, 15), (10, 15), (7, 21),
               (12, 18), (10, 25), (16, 20), (16, 25),
               (22, 19), (26, 22)], RED_D, INK)
    p.polygon([(28, 17), (24, 10), (18, 8), (13, 10),
               (10, 15), (16, 13), (13, 20), (20, 15),
               (20, 20), (24, 17)], RED_M)
    p.line([(12, 13), (16, 10), (20, 10), (24, 13)], RED_L, 2)
    p.line([(16, 11), (21, 12), (25, 16), (29, 22)], GOLD_L)
    p.dot(18, 9, GOLD_W)

    # Greathelm: crown, brow, cheek plates, rivets and deep T aperture.
    p.polygon([(25, 18), (37, 16), (46, 21), (49, 29),
               (48, 38), (43, 44), (29, 45), (22, 39),
               (21, 28), (22, 22)], STEEL_D, INK)
    p.polygon([(24, 23), (28, 19), (37, 18), (43, 22),
               (44, 28), (24, 29)], STEEL_M)
    p.polygon([(25, 23), (29, 20), (35, 19), (35, 27),
               (25, 28)], STEEL_L)
    p.line([(25, 23), (29, 20), (35, 19)], WHITE, 2)
    p.line([(37, 20), (42, 23), (44, 27)], "#98b3ca")
    p.line([(35, 19), (35, 27)], GOLD_M)
    p.polygon([(24, 30), (46, 28), (48, 30), (47, 34),
               (40, 35), (40, 42), (35, 43), (34, 35),
               (25, 35)], INK)
    p.line([(35, 31), (45, 30)], "#358fb0", 2)
    p.line([(38, 30), (45, 30)], CYAN)
    p.line([(41, 30), (44, 30)], WHITE)
    p.polygon([(24, 36), (32, 37), (33, 43), (28, 41),
               (24, 38)], STEEL_M)
    p.line([(25, 36), (31, 38)], STEEL_L)
    p.polygon([(43, 36), (47, 35), (45, 40), (42, 42)], STEEL_M)
    p.line([(46, 36), (44, 40)], STEEL_L)
    for x, y in ((26, 25), (43, 25), (27, 38), (30, 40), (45, 37)):
        p.dot(x, y, GOLD_M)
    p.line([(28, 44), (35, 46), (43, 43)], GOLD_D)
    p.line([(29, 44), (35, 45), (40, 44)], GOLD_L)

    # Reassert the frame so the bust is neatly cropped behind it.
    p.rect((0, 0, 63, 63), None, INK)
    p.rect((1, 1, 62, 62), None, GOLD_D)
    p.rect((2, 2, 61, 61), None, GOLD_L)
    p.rect((3, 3, 60, 60), None, "#13203b")
    for x, y in ((5, 5), (58, 5), (5, 58), (58, 58)):
        p.rect((x - 2, y - 2, x + 2, y + 2), GOLD_D, INK)
        p.rect((x - 1, y - 1, x + 1, y + 1), GOLD_M)
        p.dot(x - 1, y - 1, GOLD_W)
        p.dot(x + 1, y + 1, GOLD_D)
    for x in (10, 53):
        p.line([(x, 2), (x, 4)], GOLD_M)
        p.line([(x, 59), (x, 61)], GOLD_M)
    return p.image


def sheet(frame_function, count, frame_size):
    w, h = frame_size
    image = Image.new("RGBA", (w * count, h), (0, 0, 0, 0))
    for index in range(count):
        frame = frame_function(index)
        if frame.mode != "RGBA" or frame.size != frame_size:
            raise ValueError("Invalid animation frame")
        image.alpha_composite(frame, (index * w, 0))
    return image


def main():
    root = Path("public/assets")
    sprites = root / "sprites"
    ui = root / "ui"
    sprites.mkdir(parents=True, exist_ok=True)
    ui.mkdir(parents=True, exist_ok=True)

    assets = [
        (sprites / "knight.png", sheet(knight, 6, (64, 64)), (384, 64)),
        (ui / "knight-portrait.png", portrait(), (64, 64)),
        (sprites / "ranger.png", sheet(ranger, 4, (48, 48)), (192, 48)),
        (sprites / "pyro.png", sheet(pyro, 4, (48, 48)), (192, 48)),
        (sprites / "banneret.png", sheet(banneret, 4, (48, 48)), (192, 48)),
    ]

    for path, artwork, expected_size in assets:
        if artwork.size != expected_size or artwork.mode != "RGBA":
            raise ValueError(f"Unexpected image format: {path}")
        alpha_values = set(artwork.getchannel("A").getdata())
        if not alpha_values.issubset({0, 255}):
            raise ValueError(f"Non-binary alpha detected: {path}")
        artwork.save(path, format="PNG", optimize=True)
        with Image.open(path) as verified:
            verified.load()
            if verified.size != expected_size or verified.mode != "RGBA":
                raise ValueError(f"Saved PNG verification failed: {path}")
        print(f"{path.as_posix()} — {expected_size[0]}x{expected_size[1]} RGBA PNG")
    print("Verified 5 pixel-art assets; crisp binary alpha throughout.")


if __name__ == "__main__":
    main()
