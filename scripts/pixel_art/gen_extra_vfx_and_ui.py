from pathlib import Path
from PIL import Image, ImageDraw

OUTLINE = "#141928"
STEEL_DARK = "#263344"
STEEL_MID = "#49647a"
STEEL_LIGHT = "#90b5c6"
STEEL_BRIGHT = "#e5f5ee"
GOLD_DARK = "#754224"
GOLD_MID = "#bf7b29"
GOLD = "#edb642"
GOLD_LIGHT = "#ffe58a"
WHITE = "#fff9dc"


class Canvas:
    def __init__(self, size):
        self.image = Image.new("RGBA", size, (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.image)

    def polygon(self, points, fill, outline=OUTLINE):
        self.d.polygon(points, fill=fill)
        if outline:
            self.d.line(points + [points[0]], fill=outline, width=1)

    def rect(self, box, fill, outline=None):
        self.d.rectangle(box, fill=fill, outline=outline)

    def line(self, points, fill, width=1):
        self.d.line(points, fill=fill, width=width)

    def pixel(self, x, y, color):
        self.d.point((x, y), fill=color)

    def star(self, x, y, color=WHITE, size=3):
        if size <= 1:
            self.pixel(x, y, OUTLINE)
            self.pixel(x, y - 1, color)
            return
        self.polygon(
            [(x, y - size), (x + 1, y - 1), (x + size, y),
             (x + 1, y + 1), (x, y + size), (x - 1, y + 1),
             (x - size, y), (x - 1, y - 1)],
            color,
        )
        self.pixel(x, y, "#ffffff")

    def spark(self, x, y, color=GOLD_LIGHT):
        self.rect((x - 1, y - 1, x + 1, y + 1), OUTLINE)
        self.pixel(x, y, color)


def coin(c, x, y, small=False):
    if small:
        c.polygon(
            [(x - 3, y - 2), (x + 2, y - 2), (x + 4, y),
             (x + 2, y + 2), (x - 3, y + 2), (x - 4, y)],
            GOLD_MID,
        )
        c.line([(x - 2, y - 1), (x + 2, y - 1)], GOLD_LIGHT)
        c.line([(x - 2, y + 1), (x + 2, y + 1)], GOLD)
        return
    c.polygon(
        [(x - 4, y - 7), (x + 3, y - 7), (x + 6, y - 4),
         (x + 7, y + 3), (x + 3, y + 7), (x - 4, y + 7),
         (x - 7, y + 3), (x - 7, y - 3)],
        GOLD_DARK,
    )
    c.polygon(
        [(x - 4, y - 6), (x + 2, y - 6), (x + 5, y - 3),
         (x + 5, y + 3), (x + 2, y + 6), (x - 4, y + 5),
         (x - 6, y + 2), (x - 6, y - 3)],
        GOLD,
        None,
    )
    c.line([(x - 4, y + 3), (x - 4, y - 3),
            (x - 2, y - 4), (x + 2, y - 4)], GOLD_LIGHT)
    c.line([(x + 3, y - 2), (x + 3, y + 3),
            (x + 1, y + 4), (x - 2, y + 4)], GOLD_MID)
    c.line([(x + 1, y - 3), (x - 1, y - 3),
            (x - 2, y - 1), (x + 1, y + 1),
            (x + 1, y + 2), (x - 2, y + 2)], GOLD_DARK)
    c.pixel(x - 1, y - 2, WHITE)
    c.pixel(x + 6, y + 1, GOLD)


def crystal(c, x, y, scale=1, tint="blue"):
    if tint == "red":
        dark, mid, light, bright = "#691e47", "#be3055", "#ff6870", "#ffd6ab"
    else:
        dark, mid, light, bright = "#274b77", "#408fb2", "#7ed6e0", "#dcffff"
    points = [(-3, 5), (-5, -1), (-2, -7), (2, -9),
              (5, -3), (4, 4), (0, 7)]
    pts = [(x + a * scale, y + b * scale) for a, b in points]
    c.polygon(pts, dark)
    c.polygon(
        [(x - 2 * scale, y - 6 * scale), (x + 2 * scale, y - 8 * scale),
         (x + scale, y - scale), (x, y + 5 * scale),
         (x - 3 * scale, y + 3 * scale)],
        mid, None,
    )
    c.polygon(
        [(x + 2 * scale, y - 7 * scale), (x + 4 * scale, y - 3 * scale),
         (x + 2 * scale, y), (x + scale, y + 4 * scale),
         (x + scale, y - scale)],
        light, None,
    )
    c.line([(x - 2 * scale, y - 5 * scale),
            (x + scale, y - 7 * scale)], bright)


def make_projectiles():
    cells = []

    c = Canvas((32, 32))
    c.line([(2, 11), (9, 11)], "#214d47")
    c.line([(0, 16), (5, 16)], "#317955")
    c.line([(3, 21), (10, 21)], "#215844")
    c.pixel(1, 12, "#7be79a")
    c.pixel(7, 8, "#55c67f")
    c.polygon([(5, 10), (10, 11), (15, 15), (9, 15), (4, 12)], "#24815b")
    c.polygon([(4, 20), (9, 16), (15, 16), (10, 21), (5, 22)], "#246b51")
    c.line([(6, 11), (10, 12), (12, 14)], "#9bf0a4")
    c.line([(6, 20), (10, 18), (12, 17)], "#50c785")
    c.polygon([(8, 14), (24, 14), (25, 17), (8, 17)], "#875f39")
    c.line([(10, 15), (24, 15)], "#e9c587")
    c.line([(10, 17), (22, 17)], "#493a33")
    c.polygon([(22, 10), (30, 15), (30, 16), (22, 21), (24, 16)], STEEL_MID)
    c.polygon([(23, 11), (29, 15), (25, 15)], STEEL_BRIGHT, None)
    c.line([(25, 16), (28, 16)], STEEL_LIGHT)
    c.pixel(21, 14, "#cbd4b0")
    c.pixel(21, 16, "#cbd4b0")
    cells.append(c.image)

    for frame in range(2):
        c = Canvas((32, 32))
        if frame == 0:
            silhouette = [
                (1, 9), (8, 10), (5, 6), (13, 9), (17, 6), (23, 7),
                (27, 10), (30, 14), (30, 19), (27, 23), (22, 25),
                (16, 24), (11, 26), (12, 22), (4, 24), (8, 19),
                (1, 19), (5, 15), (0, 13), (8, 13),
            ]
        else:
            silhouette = [
                (1, 6), (9, 9), (13, 7), (17, 8), (22, 6), (27, 9),
                (30, 13), (31, 17), (29, 21), (25, 24), (19, 25),
                (14, 23), (8, 26), (10, 21), (2, 22), (6, 17),
                (0, 15), (7, 13), (3, 11), (11, 12),
            ]
        c.polygon(silhouette, "#b63832")
        c.polygon(
            [(5, 12 + frame), (13, 12), (12, 9), (18, 10),
             (22, 8), (26, 11), (29, 15), (28, 20), (24, 23),
             (18, 23), (15, 21), (9, 23), (12, 18),
             (5, 18), (10, 15)],
            "#ee6229", None,
        )
        c.polygon(
            [(10, 14), (17, 13), (18, 10 + frame), (23, 11),
             (27, 14), (28, 18), (25, 21), (20, 22),
             (16, 19), (10, 20), (14, 17)],
            "#ffaf32", None,
        )
        c.polygon(
            [(16, 14 + frame), (22, 12), (25, 14), (26, 18),
             (23, 20), (19, 19), (17, 17), (13, 16)],
            "#ffe677", None,
        )
        c.polygon([(20, 14), (23, 14), (25, 16),
                   (24, 18), (21, 18), (19, 16)], WHITE, None)
        for x, y in ([(3, 5), (9, 28), (13, 3)] if frame == 0
                     else [(2, 26), (7, 4), (17, 28)]):
            c.spark(x, y, "#ffc14d")
        c.pixel(27, 12, "#ffd452")
        cells.append(c.image)

    c = Canvas((32, 32))
    c.polygon([(16, 2), (27, 8), (30, 17), (25, 26),
               (16, 30), (6, 25), (2, 16), (6, 7)], "#174c76")
    c.polygon([(16, 4), (25, 9), (28, 17), (23, 24),
               (16, 28), (8, 23), (4, 16), (8, 9)], "#3da4c5", None)
    c.polygon([(16, 6), (24, 10), (26, 17), (22, 23),
               (16, 26), (9, 22), (6, 16), (9, 10)], OUTLINE)
    c.polygon([(16, 7), (23, 11), (25, 17), (21, 22),
               (16, 25), (10, 21), (7, 16), (10, 11)], "#183c58", None)
    c.line([(6, 16), (10, 9), (16, 6), (24, 10)], "#c7ffff")
    c.line([(28, 16), (24, 23), (16, 28)], "#9af4ff")
    c.line([(10, 19), (14, 23), (22, 14)], "#277d9e", 3)
    c.line([(10, 17), (14, 21), (22, 12)], "#c7ffff", 2)
    c.star(25, 7, WHITE, 4)
    c.star(5, 24, "#9cefff", 3)
    c.spark(3, 5, "#c7ffff")
    c.spark(29, 27, "#79dce8")
    cells.append(c.image)

    c = Canvas((32, 32))
    coin(c, 15, 17)
    c.star(21, 10, WHITE, 3)
    c.spark(7, 23, GOLD_LIGHT)
    cells.append(c.image)

    c = Canvas((32, 32))
    c.polygon([(9, 23), (6, 17), (7, 12), (11, 14),
               (13, 23)], "#2c5475")
    c.polygon([(8, 13), (10, 15), (11, 21), (8, 17)], "#82c9ce", None)
    c.polygon([(16, 24), (18, 15), (24, 12), (25, 18),
               (21, 24)], "#315f83")
    c.polygon([(20, 16), (23, 14), (23, 18),
               (19, 22)], "#8fdbe1", None)
    crystal(c, 15, 17)
    c.line([(10, 25), (20, 25), (24, 22)], STEEL_DARK)
    c.star(23, 8, "#dcffff", 3)
    c.spark(6, 24, "#93d9de")
    cells.append(c.image)

    sheet = Image.new("RGBA", (192, 32), (0, 0, 0, 0))
    for index, cell in enumerate(cells):
        sheet.paste(cell, (index * 32, 0))
    return sheet


def forge_base(c):
    c.polygon([(12, 50), (23, 45), (55, 45), (68, 51),
               (70, 58), (64, 61), (16, 61), (10, 57)], "#343945")
    c.polygon([(13, 51), (25, 47), (55, 47), (65, 51),
               (59, 54), (20, 54)], "#70777c")
    c.line([(16, 56), (24, 56), (26, 59)], "#919493")
    c.line([(48, 57), (58, 56), (64, 57)], "#626b73")
    c.line([(29, 54), (28, 60)], OUTLINE)
    c.line([(48, 54), (49, 60)], OUTLINE)
    c.line([(12, 56), (19, 55), (21, 51)], "#424a56")
    c.polygon([(26, 32), (51, 32), (56, 50), (50, 55),
               (27, 54), (22, 50)], "#69412e")
    c.polygon([(28, 34), (36, 34), (34, 52), (27, 51)], "#a76d3d", None)
    c.polygon([(37, 34), (45, 34), (47, 53),
               (36, 53)], "#875431", None)
    c.line([(29, 38), (28, 43), (30, 47), (29, 51)], "#d09550")
    c.line([(40, 37), (39, 43), (41, 49)], "#59362b")
    c.line([(46, 36), (48, 42), (47, 49)], "#4b302a")
    for yy in (38, 48):
        c.polygon([(25, yy), (51, yy), (53, yy + 3),
                   (24, yy + 3)], "#35404b")
        c.line([(26, yy + 1), (50, yy + 1)], "#74818a")
        c.pixel(29, yy + 2, STEEL_BRIGHT)
        c.pixel(48, yy + 2, STEEL_LIGHT)
    c.polygon([(19, 25), (59, 25), (66, 28), (57, 32),
               (46, 32), (44, 36), (47, 38), (47, 40),
               (29, 40), (29, 38), (32, 35), (30, 31),
               (20, 31), (12, 28)], STEEL_DARK)
    c.polygon([(19, 24), (58, 24), (69, 27), (58, 29),
               (20, 29), (11, 27)], STEEL_MID)
    c.line([(20, 25), (56, 25), (64, 27)], "#a4bec5")
    c.line([(21, 27), (55, 27)], "#7895a5")
    c.line([(34, 31), (43, 31), (40, 35), (41, 37)], "#547084")
    c.line([(31, 39), (45, 39)], "#7b929e")
    c.pixel(23, 26, "#d2ddcf")
    c.pixel(52, 26, "#b8d0cc")


def make_forge():
    result = Image.new("RGBA", (160, 64), (0, 0, 0, 0))
    for frame in range(2):
        c = Canvas((80, 64))
        forge_base(c)
        c.polygon([(18, 22), (50, 22), (60, 24), (51, 26),
                   (19, 25), (15, 24)], "#b64130")
        c.line([(20, 23), (50, 23), (56, 24)], "#ffb340")
        c.line([(27, 24), (49, 24)], "#ffe69b" if frame else "#ff7940")
        c.polygon([(15, 21), (19, 21), (20, 26), (16, 27)], "#716345")
        c.line([(17, 22), (18, 25)], GOLD_LIGHT)
        c.polygon([(7, 22), (15, 22), (15, 25), (7, 25),
                   (5, 24)], "#663e31")
        c.line([(8, 23), (14, 23)], "#bb8751")

        if frame == 0:
            c.polygon([(43, 9), (46, 7), (59, 26), (57, 29)], "#754931")
            c.line([(46, 10), (57, 26)], "#d29c5e")
            c.polygon([(33, 7), (36, 2), (50, 4), (54, 9),
                       (51, 15), (36, 12)], STEEL_DARK)
            c.polygon([(37, 3), (49, 5), (51, 8),
                       (37, 7), (35, 8)], "#8398a0", None)
            c.polygon([(37, 8), (50, 10), (49, 13), (37, 11)], "#435a70", None)
            c.line([(34, 7), (36, 4)], "#d9e3da")
            c.line([(51, 9), (50, 12)], "#a4bdc2")
            c.spark(30, 16, "#ff9a38")
            c.spark(56, 16, "#ffe47b")
            c.spark(62, 35, "#ed7235")
            c.pixel(27, 12, "#fdbf53")
        else:
            c.polygon([(44, 19), (46, 16), (64, 9),
                       (67, 11), (65, 14), (48, 23)], "#825335")
            c.line([(49, 19), (63, 12)], "#dba365")
            c.polygon([(34, 15), (39, 13), (48, 17),
                       (48, 23), (44, 26), (34, 22)], STEEL_DARK)
            c.polygon([(35, 16), (39, 14), (46, 18),
                       (43, 20)], "#91a6ab", None)
            c.line([(35, 18), (42, 21), (46, 20)], "#526e80")
            c.line([(35, 21), (43, 24)], "#c7d9d4")
            c.polygon(
                [(39, 24), (34, 18), (37, 21), (37, 12), (41, 20),
                 (46, 11), (44, 21), (56, 17), (49, 23),
                 (62, 25), (49, 27), (55, 33), (44, 28),
                 (42, 35), (39, 28), (29, 32), (34, 26), (25, 24)],
                "#f27b2b",
            )
            c.polygon([(39, 24), (38, 18), (41, 23), (45, 18),
                       (44, 24), (53, 23), (46, 26), (49, 29),
                       (42, 27), (40, 31), (38, 27), (31, 28),
                       (36, 25), (31, 23)], "#ffd655", None)
            c.rect((38, 24, 44, 26), WHITE)
            for x, y, dx, dy in [
                (26, 15, -3, -3), (55, 12, 3, -4),
                (63, 20, 4, -1), (59, 34, 4, 3),
                (27, 35, -3, 3), (34, 9, -1, -4),
                (49, 37, 1, 3),
            ]:
                c.line([(x, y), (x + dx, y + dy)], OUTLINE, 3)
                c.line([(x, y), (x + dx, y + dy)], "#ffc64e")
                c.pixel(x, y, WHITE)
            c.spark(19, 19, "#ffb548")
            c.spark(69, 30, "#ffe582")
            c.spark(58, 5, "#fff0a1")
        result.paste(c.image, (frame * 80, 0))
    return result


def make_chest():
    c = Canvas((64, 64))
    c.polygon([(10, 51), (17, 47), (48, 47), (56, 52),
               (52, 59), (15, 60), (8, 56)], "#222335")
    c.polygon([(11, 24), (9, 15), (12, 10), (44, 7), (50, 10),
               (53, 24), (48, 29), (16, 31)], "#75432d")
    c.polygon([(13, 14), (44, 11), (47, 14), (49, 23),
               (17, 27)], "#ab713d")
    c.polygon([(15, 16), (43, 13), (45, 16), (47, 22),
               (18, 25)], "#56352c")
    c.line([(17, 18), (43, 15)], "#c18b48")
    c.line([(18, 21), (44, 18)], "#855230")
    c.line([(24, 16), (26, 23)], "#392c2b")
    c.line([(37, 14), (39, 22)], "#392c2b")
    c.polygon([(10, 14), (13, 10), (44, 7), (49, 10),
               (47, 13), (14, 16)], GOLD_DARK)
    c.line([(13, 12), (44, 9), (47, 10)], GOLD_LIGHT)
    c.line([(14, 14), (46, 11)], GOLD)
    for x in (16, 40):
        c.polygon([(x, 11), (x + 4, 10), (x + 8, 26),
                   (x + 4, 28)], GOLD_MID)
        c.line([(x + 1, 12), (x + 5, 25)], GOLD_LIGHT)
        c.pixel(x + 4, 20, WHITE)
    c.polygon([(10, 33), (17, 28), (49, 26), (55, 33),
               (49, 39), (17, 41)], GOLD_DARK)
    c.polygon([(14, 33), (20, 30), (47, 29), (51, 33),
               (46, 36), (20, 38)], "#292c37")
    for x, y in [(19, 31), (27, 29), (35, 31), (43, 30),
                 (47, 34), (24, 35), (34, 35), (17, 35)]:
        coin(c, x, y, small=True)
    crystal(c, 39, 25)
    c.polygon([(44, 33), (45, 25), (51, 21), (53, 27),
               (49, 35)], "#294a71")
    c.polygon([(47, 26), (50, 23), (51, 27),
               (47, 32)], "#93e0e6", None)
    c.line([(47, 26), (49, 24)], "#f0ffff")
    c.polygon([(22, 26), (23, 22), (29, 20), (33, 25),
               (30, 32), (25, 32)], GOLD_DARK)
    c.polygon([(24, 24), (28, 22), (31, 25), (28, 30),
               (25, 28)], "#b72f51")
    c.polygon([(24, 24), (28, 22), (28, 26), (25, 27)], "#ff8190", None)
    c.pixel(26, 24, WHITE)
    c.polygon([(11, 35), (18, 38), (49, 35), (54, 32),
               (53, 53), (47, 58), (17, 57), (11, 52)], "#79482e")
    c.polygon([(14, 39), (21, 41), (46, 39),
               (46, 54), (17, 53)], "#a86a36", None)
    c.polygon([(48, 39), (52, 36), (51, 51),
               (48, 54)], "#50332a", None)
    for y in (44, 49):
        c.line([(16, y), (44, y - 1)], "#5a3629")
        c.line([(17, y + 1), (43, y)], "#c28a46")
    c.line([(26, 41), (27, 44), (24, 46), (24, 50)], "#79472e")
    c.line([(38, 41), (36, 45), (38, 48)], "#79472e")
    for x in (16, 43):
        c.polygon([(x, 39), (x + 4, 39), (x + 4, 55),
                   (x, 55)], GOLD_MID)
        c.line([(x + 1, 40), (x + 1, 53)], GOLD_LIGHT)
        for y in (43, 51):
            c.pixel(x + 2, y, OUTLINE)
            c.pixel(x + 2, y - 1, WHITE)
    c.polygon([(12, 35), (18, 38), (49, 35), (54, 32),
               (54, 36), (49, 39), (18, 42), (12, 39)], GOLD_MID)
    c.line([(14, 36), (19, 39), (48, 36), (52, 34)], GOLD_LIGHT)
    c.line([(18, 55), (46, 56), (51, 52)], GOLD)
    c.polygon([(29, 39), (36, 38), (37, 47),
               (34, 50), (30, 48)], GOLD_DARK)
    c.rect((30, 40, 35, 46), GOLD)
    c.line([(31, 40), (34, 40)], GOLD_LIGHT)
    c.rect((32, 42, 33, 44), OUTLINE)
    c.pixel(33, 45, OUTLINE)
    coin(c, 9, 56, small=True)
    coin(c, 52, 57, small=True)
    c.star(9, 7, WHITE, 3)
    c.star(34, 4, GOLD_LIGHT, 3)
    c.star(56, 17, "#d5ffff", 4)
    c.spark(24, 7, GOLD_LIGHT)
    c.spark(59, 35, GOLD_LIGHT)
    c.spark(5, 29, "#94d8f3")
    return c.image


def mirrored_points(points, axis=119.5):
    return [(int(2 * axis - x), y) for x, y in points]


def make_emblem():
    c = Canvas((240, 80))

    # Fishtail pennants behind the scrolls.
    left_tail = [(14, 42), (49, 36), (57, 53), (37, 61),
                 (15, 65), (21, 53), (10, 50)]
    left_tail_light = [(16, 44), (45, 39), (49, 43),
                       (24, 49), (15, 49)]
    for reflect in (False, True):
        transform = (lambda p: mirrored_points(p)) if reflect else (lambda p: p)
        c.polygon(transform(left_tail), "#203969")
        c.polygon(transform(left_tail_light), "#436aac", None)
        c.line(transform([(17, 62), (37, 57), (51, 51)]), GOLD)
        c.line(transform([(16, 44), (45, 38)]), GOLD_LIGHT)
        c.polygon(transform([(39, 42), (57, 42), (63, 55),
                             (50, 56), (45, 50)]), "#172a4d")
        c.line(transform([(48, 46), (57, 51)]), "#314d7b")

    # Two broad, mirrored swords; their blades remain visible above the shield.
    blade = [(72, 4), (82, 8), (153, 59), (149, 65),
             (77, 14)]
    for reflect in (False, True):
        transform = (lambda p: mirrored_points(p)) if reflect else (lambda p: p)
        c.polygon(transform(blade), STEEL_DARK)
        c.polygon(transform([(74, 6), (81, 9), (151, 59),
                             (149, 61), (79, 12)]), "#a9c9d1", None)
        c.line(transform([(75, 7), (80, 10), (149, 60)]), "#f0fff5")
        c.line(transform([(79, 13), (148, 63)]), "#50718e")
        c.polygon(transform([(149, 60), (153, 58), (167, 68),
                             (164, 72)]), "#68412e")
        for a in range(3):
            c.line(transform([(154 + a * 3, 62 + a * 2),
                              (152 + a * 3, 65 + a * 2)]), GOLD)
        c.polygon(transform([(145, 68), (145, 64), (154, 54),
                             (158, 54), (159, 57), (149, 69)]), GOLD_MID)
        c.line(transform([(147, 65), (155, 56), (157, 56)]), GOLD_LIGHT)
        c.polygon(transform([(163, 68), (168, 67), (172, 71),
                             (169, 75), (165, 74)]), GOLD)
        c.pixel(*transform([(168, 70)])[0], GOLD_LIGHT)

    # Curled royal-blue scrolls spread across the full emblem.
    front_scroll = [
        (27, 30), (44, 25), (63, 27), (82, 36), (94, 39),
        (93, 54), (80, 53), (61, 43), (46, 41), (33, 44),
        (28, 41), (25, 36),
    ]
    for reflect in (False, True):
        transform = (lambda p: mirrored_points(p)) if reflect else (lambda p: p)
        c.polygon(transform(front_scroll), "#244b91")
        c.polygon(transform([(29, 31), (44, 27), (61, 29),
                             (82, 39), (92, 41), (91, 45),
                             (80, 43), (61, 34), (44, 32),
                             (30, 36)]), "#467ac0", None)
        c.polygon(transform([(33, 38), (47, 36), (62, 38),
                             (82, 48), (91, 49), (91, 52),
                             (81, 51), (61, 41), (46, 39),
                             (34, 42)]), "#163567", None)
        c.line(transform([(29, 31), (44, 27), (62, 29),
                          (83, 39), (92, 41)]), GOLD_LIGHT)
        c.line(transform([(32, 42), (46, 39), (62, 41),
                          (81, 51), (91, 52)]), GOLD)
        c.polygon(transform([(28, 31), (34, 31), (37, 35),
                             (36, 39), (33, 42), (28, 40),
                             (26, 36)]), GOLD_MID)
        c.polygon(transform([(29, 33), (33, 33), (35, 36),
                             (33, 39), (29, 38)]), "#28497a")
        c.line(transform([(29, 33), (33, 33), (34, 35)]), GOLD_LIGHT)
        c.line(transform([(48, 30), (49, 37)]), "#6a98cf")
        c.line(transform([(70, 34), (67, 40)]), "#173665")
        c.polygon(transform([(56, 31), (59, 34), (56, 37),
                             (53, 34)]), GOLD, None)

    # Gold outer shield, bevel, inset border, and faceted enamel field.
    c.polygon(
        [(95, 20), (108, 17), (119, 19), (131, 17), (144, 20),
         (145, 40), (141, 53), (132, 64), (120, 74),
         (107, 65), (98, 54), (94, 41)],
        GOLD_DARK,
    )
    c.polygon(
        [(97, 22), (108, 19), (119, 21), (131, 19), (142, 22),
         (143, 40), (139, 52), (130, 62), (120, 71),
         (109, 63), (100, 53), (96, 40)],
        GOLD, None,
    )
    c.line([(98, 23), (108, 20), (119, 22),
            (131, 20), (141, 23)], GOLD_LIGHT)
    c.line([(98, 25), (98, 40), (102, 52),
            (110, 61), (119, 68)], "#fff0a5")
    c.line([(141, 27), (141, 40), (137, 51),
            (128, 61), (120, 68)], "#a26329")
    c.polygon(
        [(101, 25), (109, 23), (119, 25), (130, 23), (138, 25),
         (139, 40), (135, 50), (127, 59), (120, 65),
         (112, 59), (104, 50), (100, 40)],
        "#142d54",
    )
    c.polygon(
        [(103, 27), (109, 25), (119, 27), (130, 25), (136, 27),
         (137, 40), (133, 49), (126, 57), (120, 62),
         (113, 57), (106, 49), (102, 40)],
        "#2854a0", None,
    )
    c.polygon([(103, 28), (110, 26), (119, 28), (119, 59),
               (113, 54), (107, 47), (104, 39)], "#3975c4", None)
    c.polygon([(121, 28), (131, 26), (135, 28), (135, 40),
               (131, 48), (125, 55), (121, 59)], "#203f80", None)
    c.line([(105, 29), (106, 38)], "#6ca7e1")
    c.line([(108, 45), (112, 50)], "#4e8bd0")

    # A compact sword-and-wings expedition charge in the shield.
    c.polygon([(119, 30), (122, 35), (122, 46), (120, 52),
               (117, 46), (117, 35)], GOLD_DARK)
    c.polygon([(119, 32), (120, 35), (120, 46),
               (119, 49), (118, 45), (118, 35)], GOLD_LIGHT, None)
    c.polygon([(116, 39), (109, 35), (110, 42), (116, 47)],
              GOLD_MID)
    c.line([(110, 37), (115, 40)], GOLD_LIGHT)
    c.line([(112, 41), (115, 43)], GOLD)
    c.polygon([(123, 39), (130, 35), (129, 42), (123, 47)],
              GOLD_MID)
    c.line([(129, 37), (124, 40)], GOLD_LIGHT)
    c.line([(127, 41), (124, 43)], GOLD)
    c.polygon([(114, 47), (125, 47), (126, 50),
               (113, 50)], GOLD)
    c.line([(115, 48), (124, 48)], GOLD_LIGHT)
    c.rect((118, 51, 121, 55), GOLD_DARK)
    c.rect((119, 51, 120, 54), GOLD)
    c.polygon([(119, 54), (122, 56), (120, 59),
               (117, 57)], GOLD)
    c.pixel(119, 56, GOLD_LIGHT)

    # The crown overlaps the shield and swords, with a velvet interior.
    c.polygon([(99, 7), (109, 12), (119, 5), (130, 12),
               (140, 7), (136, 20), (103, 20)], "#662842")
    c.polygon([(98, 5), (105, 10), (109, 7), (114, 12),
               (119, 2), (125, 12), (130, 7), (134, 10),
               (141, 5), (137, 20), (102, 20)], GOLD_DARK)
    c.polygon([(101, 8), (106, 13), (109, 10), (115, 15),
               (119, 5), (124, 15), (130, 10), (134, 13),
               (138, 8), (135, 18), (104, 18)], GOLD, None)
    c.line([(102, 9), (106, 14), (109, 11), (114, 15)], GOLD_LIGHT)
    c.line([(116, 13), (119, 6), (122, 13)], "#fff2b6")
    c.line([(131, 11), (134, 14), (137, 10)], GOLD_LIGHT)
    c.polygon([(103, 17), (136, 17), (137, 22),
               (131, 24), (108, 24), (102, 22)], GOLD_MID)
    c.line([(104, 18), (135, 18)], GOLD_LIGHT)
    c.line([(106, 22), (132, 22)], GOLD)
    c.polygon([(118, 17), (121, 17), (123, 20),
               (120, 23), (117, 20)], "#a62e49")
    c.pixel(119, 18, "#ffad9d")
    c.pixel(120, 19, "#ef6070")
    c.pixel(108, 20, "#d9ffff")
    c.pixel(131, 20, "#d9ffff")
    for x, y in [(98, 4), (119, 1), (141, 4)]:
        c.rect((x - 1, y, x + 1, y + 2), OUTLINE)
        c.pixel(x, y, GOLD_LIGHT)
        c.pixel(x, y + 1, GOLD)

    for x, y, size, color in [
        (7, 31, 3, GOLD_LIGHT), (232, 31, 3, GOLD_LIGHT),
        (58, 17, 3, WHITE), (181, 17, 3, WHITE),
        (72, 61, 3, GOLD_LIGHT), (167, 61, 3, GOLD_LIGHT),
        (89, 73, 2, "#86c6ef"), (150, 73, 2, "#86c6ef"),
        (22, 22, 2, "#8cb9f1"), (217, 22, 2, "#8cb9f1"),
    ]:
        c.star(x, y, color, size)
    c.spark(44, 59, GOLD)
    c.spark(195, 59, GOLD)
    return c.image


def verify_image(image, expected_size, cell_size):
    assert image.mode == "RGBA", f"Expected RGBA, got {image.mode}"
    assert image.size == expected_size, (
        f"Expected {expected_size}, got {image.size}"
    )
    alpha_values = set(image.getchannel("A").getdata())
    assert alpha_values == {0, 255}, (
        f"Expected transparent and opaque pixels only, got {alpha_values}"
    )
    cell_width, cell_height = cell_size
    assert image.width % cell_width == 0
    assert image.height % cell_height == 0
    for top in range(0, image.height, cell_height):
        for left in range(0, image.width, cell_width):
            alpha = image.crop(
                (left, top, left + cell_width, top + cell_height)
            ).getchannel("A")
            assert alpha.getbbox() is not None, (
                f"Empty cell at ({left}, {top})"
            )


if __name__ == "__main__":
    root = Path("public/assets")
    assets = [
        ("vfx/projectiles-sheet.png", make_projectiles(), (192, 32), (32, 32)),
        ("ui/forge-anvil.png", make_forge(), (160, 64), (80, 64)),
        ("ui/loot-chest.png", make_chest(), (64, 64), (64, 64)),
        ("ui/title-emblem.png", make_emblem(), (240, 80), (240, 80)),
    ]
    for relative_path, artwork, dimensions, cell_dimensions in assets:
        verify_image(artwork, dimensions, cell_dimensions)
        destination = root / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        artwork.save(destination, format="PNG", optimize=True)
        with Image.open(destination) as saved:
            saved.load()
            verify_image(saved, dimensions, cell_dimensions)
    print("Created and verified all 4 pixel-art RGBA PNG assets.")