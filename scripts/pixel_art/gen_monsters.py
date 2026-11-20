from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

# All artwork is drawn directly on the native pixel grid.
# No resizing, smoothing, antialiasing, or translucent pixels are used.

INK = "#151322"
STEEL = ("#252b3b", "#414b60", "#73899a", "#bdd5da")
ICE = ("#254e76", "#388aa9", "#73d7e8", "#d4fbf5")
GOLD = ("#67402e", "#a66a2f", "#e5ae43", "#ffdf89")
BONE = ("#796154", "#bca788", "#ead9af", "#fff1cf")
LEATHER = ("#302332", "#533333", "#89523c", "#b77b50")
RED = ("#442039", "#812c42", "#c94b48", "#f18a62")
FIRE = ("#a3313d", "#ec5534", "#ffa63c", "#fff0a0")


class PixelArt:
    def __init__(self, width, height):
        self.image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        self.width = width
        self.height = height

    def poly(self, points, fill, edge=INK):
        mask = Image.new("L", self.image.size, 0)
        ImageDraw.Draw(mask).polygon(points, fill=255)
        self._shape(mask, fill, edge)

    def box(self, xy, fill, edge=None):
        mask = Image.new("L", self.image.size, 0)
        ImageDraw.Draw(mask).rectangle(xy, fill=255)
        self._shape(mask, fill, edge)

    def oval(self, xy, fill, edge=INK):
        mask = Image.new("L", self.image.size, 0)
        ImageDraw.Draw(mask).ellipse(xy, fill=255)
        self._shape(mask, fill, edge)

    def _shape(self, mask, fill, edge):
        if edge is not None:
            expanded = mask.copy()
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                shifted = Image.new("L", mask.size, 0)
                shifted.paste(mask, (dx, dy))
                expanded = ImageChops.lighter(expanded, shifted)
            self.image.paste(edge, (0, 0), expanded)
        self.image.paste(fill, (0, 0), mask)

    def line(self, points, fill, width=1, edge=None):
        mask = Image.new("L", self.image.size, 0)
        ImageDraw.Draw(mask).line(points, fill=255, width=width)
        self._shape(mask, fill, edge)

    def dot(self, x, y, fill):
        self.image.putpixel((x, y), ImageColorRGBA(fill))

    def facet(self, points, fill):
        self.poly(points, fill, edge=None)

    def finish(self):
        # Reinforce only the outside silhouette with a one-pixel,
        # strictly four-neighbor outline.
        alpha = self.image.getchannel("A")
        expanded = alpha.copy()
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            shifted = Image.new("L", alpha.size, 0)
            shifted.paste(alpha, (dx, dy))
            expanded = ImageChops.lighter(expanded, shifted)
        border = ImageChops.subtract(expanded, alpha)
        self.image.paste(INK, (0, 0), border)
        return self.image


def ImageColorRGBA(color):
    if isinstance(color, tuple):
        return color if len(color) == 4 else color + (255,)
    value = color.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def plate(a, points, palette=STEEL):
    a.poly(points, palette[1])
    x0 = min(x for x, y in points)
    x1 = max(x for x, y in points)
    y0 = min(y for x, y in points)
    y1 = max(y for x, y in points)
    cx = (x0 + x1) // 2
    cy = (y0 + y1) // 2
    a.facet([points[0], points[1], (cx, cy), (x0 + 1, cy)], palette[2])
    a.line([(x0 + 1, cy), (cx, y1 - 1), (x1 - 1, cy)], palette[0])
    a.line([points[0], points[1]], palette[3])


def crystal(a, x, y, h, w=4, palette=ICE):
    a.poly([(x, y), (x + w, y + h // 3), (x + w - 1, y + h),
            (x - w + 1, y + h - 1), (x - w, y + h // 2)], palette[1])
    a.facet([(x, y), (x, y + h - 2), (x - w + 1, y + h - 1),
             (x - w + 1, y + h // 2)], palette[2])
    a.line([(x, y + 1), (x - w + 1, y + h // 2)], palette[3])


def rivets(a, points, color=STEEL[3]):
    for x, y in points:
        a.box((x, y, x, y), color)


def flame(a, x, base, h, w=5, phase=0):
    lean = 2 if phase else -2
    a.poly([(x - w, base), (x - w - 1, base - h // 3),
            (x - 2, base - h // 2), (x - 3, base - h),
            (x + lean, base - h + 3), (x + 2, base - h // 2),
            (x + w, base - h + 5), (x + w + 1, base - h // 3),
            (x + w - 1, base)], FIRE[0])
    a.facet([(x - w + 1, base), (x - 1, base - h // 2),
             (x, base - h + 5), (x + 2, base - h // 3),
             (x + w - 1, base - h // 2), (x + 2, base)], FIRE[1])
    a.facet([(x - 2, base), (x, base - h // 3 - 1),
             (x + 2, base - 2), (x + 1, base)], FIRE[2])
    a.box((x - 1, base - 2, x, base), FIRE[3])


def curved_blade(a, points, highlight, fiery=False):
    a.poly(points, FIRE[1] if fiery else STEEL[2])
    a.line(highlight, FIRE[3] if fiery else STEEL[3])
    if fiery:
        a.line([(x + 1, y + 2) for x, y in highlight[:-1]], FIRE[2])


def goblin(frame):
    a = PixelArt(48, 48)
    skin = ("#244333", "#3f7442", "#77ac4d", "#b6d567")
    d = frame
    # Far-side limbs and long, backwards-pointing ear.
    a.poly([(30, 25), (36, 29), (37, 35), (33, 37), (29, 32)], skin[0])
    a.poly([(28, 33), (34, 34), (35 + d * 3, 40),
            (39, 42), (33, 43), (29, 39)], LEATHER[1])
    a.box((32, 41, 39, 43), LEATHER[0], INK)
    a.poly([(25, 13), (39, 9 + d), (34, 18), (25, 21)], skin[1])
    a.facet([(29, 14), (36, 12 + d), (32, 17)], "#b08355")
    # Bent front leg.
    a.poly([(19, 32), (26, 34), (24 - d * 3, 39),
            (22 - d * 4, 42), (14 - d * 3, 43),
            (14 - d * 3, 40), (19, 37)], skin[1])
    a.line([(20, 35), (21 - d * 3, 38), (17 - d * 3, 40)], skin[2], 2)
    a.poly([(14 - d * 3, 40), (21 - d * 3, 40),
            (22 - d * 3, 43), (12 - d * 3, 43)], LEATHER[1])
    # Ragged fitted vest.
    a.poly([(20, 23), (29, 22), (34, 27), (32, 35),
            (28, 33), (25, 36), (21, 34), (17, 35), (18, 28)], LEATHER[1])
    a.facet([(21, 24), (25, 24), (23, 31), (19, 32)], LEATHER[2])
    a.line([(27, 25), (26, 32)], LEATHER[0])
    a.line([(18, 32), (31, 31)], "#be8651", 2, INK)
    a.box((24, 30, 26, 32), GOLD[2], INK)
    # Head is strongly profiled to the left.
    a.poly([(14, 12), (23, 10), (29, 14), (29, 22),
            (24, 27), (15, 25), (12, 22), (8, 21),
            (11, 17)], skin[1])
    a.facet([(15, 13), (22, 12), (25, 15), (22, 20),
             (13, 20), (10, 21), (12, 17)], skin[2])
    a.poly([(14, 15), (5, 12), (9, 20), (14, 21)], skin[2])
    a.line([(7, 14), (11, 17)], skin[3])
    a.line([(12, 16), (19, 15)], skin[0], 2)
    a.box((12, 17, 16, 18), "#f6cf58")
    a.dot(12, 17, "#df4d3e")
    a.dot(13, 17, "#fff4ad")
    a.line([(10, 23), (16, 24), (20, 22)], "#29302a")
    a.box((13, 23, 14, 24), BONE[2])
    a.line([(19, 12), (22, 11), (25, 12)], skin[3])
    # Front forearm and a differently angled dagger in each frame.
    if frame:
        a.poly([(20, 26), (17, 29), (10, 27), (8, 29),
                (11, 33), (20, 33), (24, 29)], skin[1])
        a.line([(19, 27), (17, 30), (11, 29)], skin[2], 2)
        a.line([(9, 27), (10, 33)], LEATHER[2], 2, INK)
        a.poly([(8, 28), (2, 23), (2, 27), (7, 31)], "#9b775d")
        a.line([(2, 23), (7, 27)], "#d3bda0")
        a.dot(4, 27, "#783b30")
    else:
        a.poly([(22, 26), (19, 30), (15, 33), (13, 32),
                (12, 35), (17, 37), (24, 32)], skin[1])
        a.line([(21, 27), (20, 30), (15, 33)], skin[2], 2)
        a.line([(12, 31), (17, 34)], LEATHER[2], 2, INK)
        a.poly([(13, 31), (11, 22), (9, 20), (9, 29), (11, 33)], "#9b775d")
        a.line([(9, 20), (10, 28)], "#d3bda0")
        a.dot(12, 28, "#783b30")
    return a.finish()


def boar(frame):
    a = PixelArt(48, 48)
    fur = ("#382632", "#663333", "#9a4d3a", "#cf8151")
    # Tail and staggered trotting legs.
    a.line([(39, 28), (44, 26), (45, 29), (43, 31)], fur[1], 2, INK)
    for x, offset in ((15, frame * 3), (32, -frame * 3)):
        a.poly([(x, 31), (x + 5, 32), (x + 3 + offset, 40),
                (x - 1 + offset, 41)], fur[0])
        a.box((x - 2 + offset, 40, x + 3 + offset, 43), STEEL[0], INK)
    a.poly([(10, 24), (16, 18), (30, 18), (38, 22),
            (41, 29), (39, 35), (31, 38), (16, 36), (9, 32)], fur[1])
    a.facet([(14, 23), (21, 20), (32, 21), (36, 25),
             (31, 29), (18, 28)], fur[2])
    a.line([(17, 21), (25, 20), (31, 21)], fur[3])
    for x in (18, 22, 26, 30):
        a.poly([(x, 20), (x - 1, 15), (x + 3, 19)], fur[0])
    # Near legs.
    for x, offset in ((13, -frame * 3), (32, frame * 3)):
        a.poly([(x, 32), (x + 5, 33), (x + 4 + offset, 40),
                (x + offset, 41)], fur[2])
        a.line([(x + 1, 34), (x + 1 + offset, 39)], fur[3])
        a.box((x - 1 + offset, 41, x + 5 + offset, 43), STEEL[0], INK)
        a.box((x + offset, 41, x + 2 + offset, 41), STEEL[2])
    # Sloping, spiked shoulder armor.
    plate(a, [(20, 20), (27, 18), (32, 23), (29, 31), (23, 32), (18, 27)])
    a.poly([(22, 20), (22, 14), (26, 19)], STEEL[2])
    a.poly([(29, 21), (32, 16), (32, 24)], STEEL[2])
    rivets(a, [(21, 24), (25, 29), (29, 24)])
    a.line([(33, 26), (36, 33)], LEATHER[0], 3)
    # Left-facing wedge-shaped head and heavy snout.
    a.poly([(12, 22), (19, 24), (18, 32), (13, 36),
            (5, 35), (3, 31), (5, 27)], fur[1])
    a.facet([(7, 26), (12, 24), (17, 26), (13, 29), (5, 30)], fur[2])
    a.poly([(14, 24), (12, 17), (18, 20), (19, 25)], fur[1])
    a.line([(14, 20), (16, 23)], fur[3])
    a.box((3, 30, 8, 34), "#8e514a", INK)
    a.box((3, 30, 7, 30), "#bd7b65")
    a.dot(4, 32, fur[0])
    a.dot(7, 32, fur[0])
    a.line([(10, 26), (15, 25)], fur[0], 2)
    a.box((10, 27, 13, 28), "#ef5845")
    a.dot(10, 27, "#ffd98b")
    # Tusks curl forwards and upwards.
    a.poly([(9, 34), (7, 30), (7, 26), (5, 28),
            (5, 33), (7, 37), (11, 36)], BONE[1])
    a.line([(7, 35), (6, 32), (6, 29)], BONE[3])
    a.poly([(15, 33), (12, 31), (11, 28), (10, 31),
            (12, 35), (15, 35)], BONE[2])
    return a.finish()


def bandit(frame):
    a = PixelArt(48, 48)
    cloth = ("#292634", "#49404a", "#7a665e", "#b19678")
    # Loose scarf ends stream behind the character.
    a.poly([(27, 18), (36, 20), (43, 17 + frame * 3),
            (40, 23), (44, 25), (34, 24), (26, 22)], RED[1])
    a.line([(29, 20), (36, 22), (40, 21)], RED[2])
    a.poly([(25, 32), (31, 32), (33 + frame * 2, 40),
            (37, 43), (29, 43), (26, 38)], cloth[0])
    a.poly([(18, 32), (25, 34), (21 - frame * 3, 40),
            (19 - frame * 3, 43), (11 - frame * 3, 43),
            (13 - frame * 3, 40)], cloth[1])
    a.box((12 - frame * 3, 41, 20 - frame * 3, 43), LEATHER[0], INK)
    a.box((29, 41, 37, 43), LEATHER[0], INK)
    a.line([(15 - frame * 3, 40), (18 - frame * 3, 40)], cloth[2])
    a.poly([(19, 22), (28, 21), (32, 27), (30, 35),
            (24, 34), (20, 36), (15, 32)], STEEL[0])
    a.facet([(19, 24), (24, 23), (24, 30), (18, 32)], STEEL[1])
    a.line([(20, 24), (28, 31)], LEATHER[2], 2, INK)
    a.line([(17, 32), (30, 32)], LEATHER[1], 2, INK)
    a.box((23, 31, 25, 33), GOLD[2], INK)
    rivets(a, [(19, 26), (18, 29), (28, 26)], STEEL[2])
    # Hood, brow shadow, and crimson mask.
    a.poly([(15, 9), (23, 7), (29, 12), (30, 21),
            (25, 25), (15, 23), (11, 18), (12, 12)], cloth[1])
    a.facet([(15, 10), (23, 9), (25, 12), (16, 13), (13, 17), (12, 15)], cloth[2])
    a.line([(16, 10), (21, 9)], cloth[3])
    a.poly([(13, 14), (22, 13), (24, 17), (20, 21),
            (12, 19)], "#b18a66")
    a.line([(13, 14), (21, 14)], INK, 2)
    a.box((13, 15, 16, 15), "#f9da99")
    a.dot(13, 15, "#231f31")
    a.poly([(12, 18), (22, 17), (25, 20), (22, 23), (14, 22)], RED[1])
    a.line([(13, 18), (20, 19)], RED[3])
    a.line([(16, 21), (22, 21)], RED[2])
    # Scimitar attack moves from raised guard to a forward slash.
    if frame:
        a.poly([(21, 25), (17, 28), (11, 26), (9, 29),
                (17, 33), (24, 30)], STEEL[1])
        a.box((7, 26, 11, 29), "#b18a66", INK)
        a.line([(9, 24), (8, 31)], GOLD[2], 2, INK)
        curved_blade(a, [(8, 27), (3, 23), (2, 16), (4, 11),
                         (4, 19), (7, 22), (10, 25)],
                     [(4, 12), (3, 18), (4, 22), (8, 26)])
    else:
        a.poly([(27, 25), (32, 23), (32, 18), (28, 16),
                (26, 19), (27, 22), (23, 25)], STEEL[1])
        a.box((27, 14, 30, 17), "#b18a66", INK)
        a.line([(25, 15), (32, 17)], GOLD[2], 2, INK)
        curved_blade(a, [(28, 14), (29, 6), (34, 3), (39, 3),
                         (34, 6), (32, 11), (31, 15)],
                     [(29, 12), (31, 6), (35, 4), (38, 3)])
        a.poly([(18, 25), (15, 29), (11, 30), (12, 33),
                (18, 32), (22, 28)], STEEL[1])
    return a.finish()


def scorpion(frame):
    a = PixelArt(48, 48)
    shell = ("#30243b", "#654132", "#af7339", "#e6af55")
    # Raised tail curves from the right rump back toward the left.
    tail = [(34, 30), (40, 26), (43, 20), (42, 13),
            (38, 8), (32, 7), (28 - frame * 2, 10)]
    a.line(tail, shell[0], 7, INK)
    a.line([(x - 1, y - 1) for x, y in tail], shell[2], 4)
    for x, y in tail[1:-1]:
        a.line([(x - 2, y - 2), (x + 2, y + 1)], shell[0], 2)
        a.dot(x - 1, y - 2, shell[3])
    sx = 28 - frame * 2
    a.poly([(sx + 2, 8), (sx - 3, 9), (sx - 5, 13),
            (sx - 3, 18 + frame * 2), (sx, 14), (sx + 3, 12)], "#763d91")
    a.line([(sx - 2, 10), (sx - 3, 13)], "#d48ce4")
    a.dot(sx - 3, 16 + frame, "#edb8f0")
    # Six articulated legs, alternating between frames.
    for index, (x, y) in enumerate(((17, 29), (24, 30), (31, 30))):
        off = 2 if (index + frame) % 2 else -1
        a.line([(x, y), (x + 3, y + 6), (x + 7 + off, 39),
                (x + 6 + off, 42)], shell[1], 3, INK)
        a.line([(x + 3, y + 5), (x + 6 + off, 38)], shell[3])
    a.poly([(15, 26), (23, 23), (33, 25), (37, 30),
            (34, 35), (24, 37), (15, 33)], shell[0])
    for x, y in ((29, 26), (23, 25), (17, 27)):
        a.poly([(x, y), (x + 6, y + 1), (x + 7, y + 5),
                (x + 3, y + 8), (x - 2, y + 5)], shell[2])
        a.line([(x, y + 1), (x + 4, y + 1)], shell[3])
        a.facet([(x + 5, y + 2), (x + 6, y + 5),
                 (x + 3, y + 7), (x + 1, y + 6)], shell[1])
    for index, x in enumerate((16, 23, 30)):
        off = -2 if (index + frame) % 2 else 1
        a.line([(x, 33), (x - 2, 38), (x + off, 42),
                (x - 3 + off, 43)], shell[2], 2, INK)
        a.dot(x - 2, 38, shell[3])
    # Left-facing face and paired snapping claws.
    a.poly([(11, 28), (17, 27), (19, 31), (15, 35), (10, 33)], shell[1])
    a.box((10, 29, 12, 30), "#ff7650")
    a.dot(10, 29, "#fff1a0")
    for y, shift in ((25, frame * -2), (35, frame * 2)):
        a.line([(15, y + 1), (10, y + shift), (7, y + shift)], shell[2], 3, INK)
        cy = y + shift
        a.poly([(8, cy - 2), (4, cy - 3), (2, cy - 1),
                (2, cy + 2), (5, cy + 4), (9, cy + 2)], shell[2])
        a.line([(4, cy - 2), (6, cy - 1)], shell[3])
        if frame:
            a.poly([(4, cy), (1, cy - 3), (1, cy + 1), (4, cy + 2)], shell[1])
        else:
            a.line([(2, cy), (5, cy + 1)], shell[0])
    return a.finish()


def bogling(frame):
    a = PixelArt(48, 48)
    moss = ("#183d3f", "#286354", "#4a9470", "#8ac58a")
    # Long hanging vines define the swamp silhouette.
    for x, y, length in ((33, 19, 17), (37, 23, 13), (13, 20, 14)):
        a.line([(x, y), (x + 2, y + 7), (x + frame, y + length)],
               moss[0], 2, INK)
        a.dot(x + frame, y + length + 2, moss[2])
    a.poly([(26, 32), (33, 31), (34, 39), (38, 42),
            (38, 43), (29, 43), (26, 39)], moss[0])
    a.poly([(16, 32), (24, 34), (21 - frame * 2, 39),
            (23 - frame * 2, 43), (12 - frame * 2, 43),
            (12 - frame * 2, 41)], moss[1])
    a.line([(16, 37), (15 - frame * 2, 41), (20 - frame * 2, 41)], moss[2], 2)
    a.poly([(17, 19), (29, 17), (35, 25), (33, 35),
            (25, 38), (16, 34), (12, 27)], moss[1])
    a.facet([(17, 23), (23, 21), (28, 25), (25, 32),
             (18, 32)], moss[2])
    a.oval((24, 16, 36, 27), moss[1])
    a.oval((25, 17, 31, 21), moss[2], None)
    a.line([(26, 17), (30, 17)], moss[3])
    a.oval((9, 18, 21, 28), moss[2])
    a.line([(11, 20), (15, 19), (18, 20)], moss[3])
    # Flattened head: glowing eyes sit under mossy brow ridges.
    a.poly([(12, 13), (23, 11), (29, 16), (27, 25),
            (19, 28), (10, 24), (8, 19)], moss[1])
    a.facet([(12, 14), (22, 13), (25, 16), (15, 17),
             (10, 19)], moss[2])
    a.line([(10, 18), (16, 17), (18, 18)], moss[0], 2)
    a.box((10, 19, 14, 20), "#d7e86b")
    a.dot(11, 19, "#ffffc0")
    a.box((21, 18, 23, 19), "#d7e86b")
    a.line([(11, 24), (16, 25), (22, 23)], moss[0])
    a.box((14, 24, 15, 25), "#bfd3a3")
    for x, y in ((13, 13), (17, 12), (25, 14), (30, 20), (17, 30)):
        a.box((x, y, x + 2, y + 1), moss[3])
    # Heavy near arm hangs in A and reaches forward in B.
    if frame:
        a.poly([(13, 24), (11, 28), (5, 27), (3, 31),
                (7, 34), (14, 32), (19, 26)], moss[1])
        a.line([(13, 25), (11, 29), (6, 29)], moss[2], 2)
        for x, y in ((3, 30), (4, 33), (7, 34)):
            a.line([(x + 2, y), (x, y + 1)], BONE[1], 2, INK)
    else:
        a.poly([(13, 25), (10, 30), (8, 36), (10, 39),
                (15, 37), (17, 30), (19, 26)], moss[1])
        a.line([(13, 27), (12, 31), (10, 35)], moss[2], 2)
        for x in (9, 12, 15):
            a.line([(x, 37), (x - 1, 40)], BONE[1], 1, INK)
    a.line([(27, 25), (29, 29), (27, 34)], moss[0], 2)
    a.line([(20, 27), (21, 31), (19, 35)], moss[3])
    a.dot(27, 37, moss[2])
    return a.finish()


def golem(frame):
    a = PixelArt(48, 48)
    rock = ("#252e43", "#43536c", "#7189a1", "#b5cbd4")
    # Crystals and the far arm are drawn behind the torso.
    crystal(a, 34, 8, 14, 4)
    crystal(a, 39, 14, 10, 3)
    a.poly([(33, 24), (40, 23), (43, 31), (41, 36),
            (35, 36), (32, 30)], rock[0])
    plate(a, [(33, 32), (41, 31), (43, 36), (40, 39), (33, 37)], rock)
    plate(a, [(25, 33), (33, 33), (35 + frame, 41),
              (38, 43), (27, 43), (25, 39)], rock)
    plate(a, [(13, 33), (22, 34), (20 - frame * 2, 40),
              (22 - frame * 2, 43), (10 - frame * 2, 43),
              (11 - frame * 2, 39)], rock)
    # Massive angular torso.
    plate(a, [(13, 19), (28, 17), (36, 23), (33, 34),
              (25, 38), (15, 34), (10, 27)], rock)
    a.line([(29, 22), (28, 26), (31, 28), (28, 34)], rock[0])
    a.line([(17, 30), (20, 32), (19, 35)], rock[0])
    # Chest core with nested, sharp-edged light.
    a.poly([(20, 23), (26, 22), (29, 27), (25, 32),
            (19, 30), (17, 26)], "#173847")
    a.poly([(21, 24), (25, 24), (27, 27), (24, 30),
            (20, 28)], "#35bcd1", None)
    a.line([(22, 25), (24, 25), (24, 28), (22, 28)], "#d7fff6")
    a.line([(17, 24), (14, 22)], ICE[2])
    a.line([(27, 31), (30, 33)], ICE[2])
    # Small deep-set head.
    plate(a, [(15, 9), (24, 8), (29, 13), (27, 20),
              (20, 23), (12, 19), (12, 13)], rock)
    a.line([(12, 15), (21, 14)], rock[0], 3)
    a.box((12, 15, 16, 16), ICE[2])
    a.box((12, 15, 14, 15), ICE[3])
    a.line([(13, 20), (20, 20)], rock[0])
    crystal(a, 14, 12, 11, 4)
    crystal(a, 8, 18, 9, 3)
    # Near fist changes from a low guard to a forward punch.
    if frame:
        plate(a, [(12, 23), (18, 27), (14, 33), (7, 31), (6, 26)], rock)
        plate(a, [(2, 26), (9, 24), (13, 28), (11, 34),
                  (3, 34), (2, 31)], rock)
        a.line([(3, 29), (8, 28)], rock[3])
        a.line([(5, 31), (5, 33)], rock[0])
        a.line([(8, 31), (8, 33)], rock[0])
    else:
        plate(a, [(9, 24), (16, 25), (17, 33), (11, 36), (6, 31)], rock)
        plate(a, [(6, 32), (14, 31), (17, 36), (15, 40),
                  (6, 40), (4, 36)], rock)
        a.line([(7, 34), (12, 33)], rock[3])
        a.line([(8, 37), (8, 39)], rock[0])
        a.line([(12, 37), (12, 39)], rock[0])
    return a.finish()


def wyvern(frame):
    a = PixelArt(48, 48)
    scale = ("#472139", "#842c42", "#c5484c", "#f28562")
    wing = ("#392037", "#67263f", "#a13e4c", "#d76c5d")
    # Tail curls up behind the hovering body.
    a.poly([(29, 28), (35, 28), (41, 23), (43, 17),
            (45, 21), (43, 28), (37, 33), (29, 33)], scale[1])
    a.line([(33, 30), (39, 27), (42, 23)], scale[2])
    a.poly([(42, 19), (44, 14), (46, 20)], scale[2])
    if frame == 0:
        # Raised wing: long finger bones and scalloped membrane.
        a.poly([(26, 24), (24, 13), (29, 3), (32, 9),
                (38, 5), (38, 14), (44, 12), (41, 22),
                (35, 19), (31, 23)], wing[1])
        a.facet([(27, 21), (28, 12), (30, 6), (32, 13),
                 (36, 10), (35, 18)], wing[2])
        a.line([(26, 24), (29, 12), (29, 4)], scale[3], 2)
        a.line([(29, 12), (38, 6)], scale[2])
        a.line([(29, 12), (37, 19), (43, 13)], scale[2])
        a.line([(29, 12), (31, 22)], scale[0])
    else:
        a.poly([(26, 23), (35, 23), (44, 29), (40, 30),
                (43, 38), (35, 35), (34, 41), (29, 36),
                (25, 37), (23, 29)], wing[1])
        a.facet([(27, 26), (34, 26), (40, 29), (34, 30),
                 (36, 35), (30, 33)], wing[2])
        a.line([(25, 25), (34, 27), (43, 29)], scale[3], 2)
        a.line([(34, 27), (41, 37)], scale[2])
        a.line([(34, 27), (33, 39)], scale[2])
        a.line([(34, 27), (25, 35)], scale[0])
    # Far leg and small gripping claws.
    a.line([(27, 30), (30, 35), (27, 37)], scale[0], 3, INK)
    a.line([(27, 37), (24, 37)], BONE[1], 1, INK)
    a.poly([(16, 21), (23, 19), (30, 24), (30, 30),
            (26, 34), (20, 32), (17, 27)], scale[1])
    a.facet([(18, 22), (22, 21), (26, 24), (24, 28),
             (19, 27)], scale[2])
    a.poly([(17, 24), (21, 25), (24, 29), (25, 32),
            (21, 32), (17, 28)], FIRE[2])
    a.line([(18, 27), (22, 28)], FIRE[0])
    a.line([(20, 30), (23, 31)], FIRE[0])
    # Horned head and long left-facing snout.
    a.poly([(12, 15), (18, 13), (23, 17), (21, 23),
            (15, 26), (8, 23), (4, 22), (4, 18),
            (10, 18)], scale[1])
    a.facet([(12, 16), (17, 15), (20, 17), (17, 19),
             (7, 20), (5, 19), (11, 18)], scale[2])
    a.poly([(17, 14), (20, 8), (21, 14)], BONE[1])
    a.poly([(13, 15), (13, 10), (16, 14)], BONE[2])
    a.line([(11, 18), (16, 17)], scale[0], 2)
    a.box((11, 19, 14, 19), "#ffc15a")
    a.dot(11, 19, "#fff2a6")
    a.dot(5, 20, scale[0])
    a.line([(5, 23), (12, 24), (16, 22)], scale[0], 2)
    a.line([(6, 23), (11, 23)], FIRE[2])
    a.dot(7, 23, FIRE[3])
    a.box((10, 23, 11, 24), BONE[3])
    a.line([(20, 30), (18 - frame * 2, 34), (14 - frame * 2, 34)],
           scale[2], 3, INK)
    a.line([(13 - frame * 2, 34), (12 - frame * 2, 36)], BONE[2], 1, INK)
    # Scale clusters catch the top-left light.
    for x, y in ((24, 23), (27, 26), (29, 29), (34, 29)):
        a.line([(x, y), (x + 1, y + 1), (x + 2, y)], scale[3])
    return a.finish()


def orc_chief(frame):
    a = PixelArt(80, 80)
    skin = ("#294337", "#4b6b42", "#7da052", "#bbca76")
    fur = ("#40303a", "#715445", "#ad8764", "#deba84")
    # Far arm and a broad, furred waistcloth.
    a.poly([(49, 31), (60, 30), (65, 39), (61, 49),
            (54, 47), (51, 39)], skin[0])
    a.poly([(30, 48), (53, 47), (58, 60), (52, 63),
            (47, 60), (42, 64), (37, 60), (29, 62), (25, 56)], LEATHER[1])
    for x in (30, 37, 44, 51):
        a.line([(x, 51), (x + 1, 58)], LEATHER[2], 2)
    # Planted feet; attack stance spreads the leading leg.
    plate(a, [(43, 59), (53, 58), (57, 69), (62, 72),
              (61, 73), (45, 73), (42, 68)])
    fx = -4 if frame else 0
    plate(a, [(28, 58), (39, 60), (36 + fx, 69),
              (38 + fx, 73), (21 + fx, 73), (22 + fx, 69)])
    a.line([(24 + fx, 71), (33 + fx, 71)], STEEL[2])
    # Barrel torso with readable muscle planes.
    a.poly([(27, 27), (44, 25), (57, 33), (54, 47),
            (46, 54), (31, 52), (24, 43), (22, 34)], skin[1])
    a.facet([(28, 29), (38, 28), (40, 36), (35, 40),
             (27, 37), (25, 33)], skin[2])
    a.facet([(42, 29), (49, 31), (52, 36), (44, 39), (41, 36)], skin[2])
    a.line([(39, 32), (39, 42), (42, 46)], skin[0])
    a.line([(30, 43), (36, 44)], skin[0])
    a.line([(44, 43), (49, 42)], skin[0])
    a.line([(31, 48), (49, 47)], skin[2])
    a.line([(30, 29), (50, 49)], LEATHER[1], 4, INK)
    rivets(a, [(34, 33), (39, 38), (44, 43)], GOLD[2])
    a.line([(28, 51), (52, 51)], LEATHER[0], 4, INK)
    a.box((36, 49, 43, 53), GOLD[1], INK)
    a.box((38, 50, 41, 52), GOLD[3])
    # Fur-trimmed iron shoulder.
    a.poly([(45, 26), (56, 25), (63, 29), (64, 35),
            (61, 35), (61, 39), (57, 37), (54, 40),
            (52, 36), (46, 35)], fur[1])
    a.line([(48, 27), (55, 27), (61, 31)], fur[3], 2)
    plate(a, [(47, 25), (55, 24), (61, 29), (59, 34), (48, 33)])
    a.poly([(52, 25), (53, 18), (57, 25)], STEEL[2])
    rivets(a, [(49, 29), (57, 30)])
    # Neck and snarling left-facing head.
    a.poly([(27, 18), (42, 16), (48, 23), (44, 31),
            (34, 35), (24, 30), (20, 26), (21, 22)], skin[1])
    a.facet([(25, 20), (33, 19), (37, 23), (33, 28),
             (23, 27), (21, 25)], skin[2])
    a.poly([(42, 20), (51, 17), (47, 25), (42, 27)], skin[1])
    a.line([(45, 21), (48, 19)], skin[3])
    a.line([(22, 23), (31, 21)], skin[0], 2)
    a.box((23, 24, 27, 25), "#f6bd49")
    a.dot(23, 24, "#f45d40")
    a.line([(21, 29), (28, 31), (36, 28)], INK, 2)
    a.poly([(23, 30), (22, 25), (25, 27), (26, 31)], BONE[2])
    a.poly([(32, 30), (34, 25), (35, 29)], BONE[2])
    a.line([(28, 25), (30, 28)], RED[2], 2)
    a.line([(37, 24), (39, 28)], RED[2], 2)
    # Skull helmet with sweeping horns.
    plate(a, [(24, 12), (34, 9), (43, 12), (47, 18),
              (43, 22), (36, 18), (23, 20), (21, 17)])
    a.poly([(25, 13), (19, 11), (16, 5), (16, 11),
            (20, 16), (25, 17)], BONE[1])
    a.line([(17, 7), (18, 11), (22, 14)], BONE[3])
    a.poly([(39, 12), (46, 9), (49, 3), (50, 9),
            (46, 15), (42, 17)], BONE[1])
    a.line([(48, 6), (47, 10), (43, 13)], BONE[3])
    a.poly([(32, 12), (37, 12), (39, 15), (36, 18),
            (32, 17), (30, 15)], BONE[1])
    a.box((32, 14, 33, 15), STEEL[0])
    a.box((36, 14, 37, 15), STEEL[0])
    a.box((34, 17, 35, 18), BONE[2])
    # Front arm and enormous studded club.
    if frame:
        a.poly([(24, 31), (29, 36), (23, 43), (15, 41),
                (12, 36), (17, 32)], skin[1])
        a.line([(21, 33), (24, 36), (19, 39)], skin[2], 3)
        plate(a, [(12, 35), (18, 35), (20, 41), (14, 43), (10, 40)])
        a.line([(16, 38), (7, 23)], LEATHER[2], 5, INK)
        a.poly([(4, 12), (12, 9), (20, 20), (18, 27),
                (10, 30), (3, 21)], LEATHER[1])
        a.facet([(5, 13), (10, 11), (15, 18), (8, 22), (4, 19)], LEATHER[2])
        a.line([(5, 15), (13, 11)], STEEL[2], 3, INK)
        a.line([(9, 25), (18, 21)], STEEL[2], 3, INK)
        for x, y in ((5, 20), (11, 17), (15, 23)):
            a.poly([(x, y), (x - 3, y - 4), (x + 2, y - 2)], STEEL[3])
    else:
        a.poly([(23, 32), (29, 36), (25, 45), (19, 49),
                (13, 45), (14, 38)], skin[1])
        a.line([(21, 33), (23, 38), (20, 43)], skin[2], 3)
        plate(a, [(13, 43), (21, 43), (23, 49), (17, 52), (12, 48)])
        a.line([(17, 47), (12, 63)], LEATHER[2], 5, INK)
        a.poly([(6, 56), (16, 55), (21, 65), (19, 72),
                (7, 73), (3, 66)], LEATHER[1])
        a.facet([(7, 57), (12, 57), (14, 67), (7, 70), (5, 65)], LEATHER[2])
        a.line([(5, 61), (18, 60)], STEEL[2], 3, INK)
        a.line([(6, 70), (19, 68)], STEEL[2], 3, INK)
        for x, y in ((5, 65), (17, 65), (11, 57)):
            a.poly([(x, y), (x - 2, y - 4), (x + 2, y - 2)], STEEL[3])
    return a.finish()


def canyon_king(frame):
    a = PixelArt(80, 80)
    armor = ("#302337", "#563646", "#8b5960", "#c78d76")
    # Long tattered scarlet cape, visibly swept out in the attack.
    a.poly([(41, 21), (55, 23), (60, 37), (68 + frame * 4, 50),
            (74, 67), (67, 64), (66, 72), (59, 68),
            (54, 73), (50, 68), (44, 71), (40, 54)], RED[0])
    a.facet([(48, 25), (54, 26), (58, 41), (68, 62),
             (62, 60), (59, 67), (53, 52)], RED[1])
    a.line([(50, 27), (53, 42), (60, 57), (63, 63)], RED[2], 2)
    a.line([(46, 35), (48, 51), (50, 62)], RED[2])
    # Rear blazing greatsword.
    if frame:
        curved_blade(a, [(57, 37), (62, 26), (68, 17), (75, 13),
                         (73, 21), (67, 31), (61, 41)],
                     [(59, 37), (64, 26), (70, 18), (74, 14)], True)
        flame(a, 69, 25, 13, 3, frame)
        a.line([(54, 40), (61, 44)], GOLD[2], 3, INK)
    else:
        curved_blade(a, [(57, 40), (59, 22), (65, 10), (71, 7),
                         (69, 17), (65, 29), (62, 42)],
                     [(59, 38), (61, 22), (66, 12), (70, 8)], True)
        flame(a, 66, 22, 12, 3, frame)
        a.line([(54, 40), (64, 42)], GOLD[2], 3, INK)
    # Tall armored legs.
    plate(a, [(42, 53), (52, 52), (54, 66), (59, 72),
              (58, 73), (43, 73), (40, 65)], armor)
    fx = -4 if frame else 0
    plate(a, [(28, 52), (39, 54), (35 + fx, 67),
              (36 + fx, 73), (21 + fx, 73), (23 + fx, 68)], armor)
    a.line([(26 + fx, 61), (32 + fx, 62)], GOLD[2], 2)
    a.line([(44, 61), (51, 60)], GOLD[2], 2)
    a.line([(24 + fx, 71), (33 + fx, 71)], GOLD[1])
    # Layered breastplate and gold-edged armored skirt.
    plate(a, [(29, 25), (43, 24), (53, 30), (51, 45),
              (44, 53), (30, 51), (25, 39)], armor)
    a.line([(28, 28), (38, 35), (49, 28)], GOLD[2], 2, INK)
    a.poly([(29, 44), (49, 44), (54, 56), (46, 59),
            (40, 53), (33, 59), (25, 56)], RED[1])
    a.line([(30, 45), (28, 54), (33, 56)], GOLD[2])
    a.line([(46, 46), (50, 54), (46, 56)], GOLD[2])
    a.line([(29, 45), (49, 44)], GOLD[1], 3, INK)
    a.box((37, 43, 43, 47), GOLD[2], INK)
    a.box((39, 44, 41, 46), "#ed6560")
    plate(a, [(48, 26), (57, 27), (61, 34), (55, 39), (47, 35)], armor)
    a.line([(49, 27), (56, 28), (59, 33)], GOLD[3])
    a.line([(55, 37), (58, 42)], armor[2], 5, INK)
    # Profile, beard, and elaborate crimson turban.
    a.poly([(29, 14), (42, 13), (47, 19), (43, 28),
            (35, 32), (26, 27), (23, 22), (26, 18)], "#b58262")
    a.facet([(28, 17), (34, 16), (37, 19), (33, 24),
             (25, 23)], "#dbad7c")
    a.line([(25, 20), (33, 19)], "#4c2c37", 2)
    a.box((26, 21, 29, 21), "#ffdf8d")
    a.dot(26, 21, "#332331")
    a.poly([(26, 25), (31, 26), (36, 23), (41, 23),
            (39, 31), (35, 35), (29, 31)], "#432b36")
    a.line([(29, 28), (34, 30), (38, 27)], "#87534c")
    a.poly([(25, 10), (35, 5), (45, 9), (49, 16),
            (45, 20), (37, 16), (25, 18), (22, 15)], RED[1])
    a.facet([(26, 10), (35, 7), (43, 10), (45, 13),
             (34, 11), (24, 14)], RED[2])
    a.line([(24, 16), (35, 13), (46, 17)], GOLD[2], 2, INK)
    a.line([(28, 10), (34, 9), (40, 11)], RED[3])
    a.poly([(35, 13), (38, 10), (41, 14), (38, 18)], GOLD[2])
    a.box((37, 13, 38, 15), "#9be5cf")
    a.poly([(44, 10), (47, 3), (53, 2), (50, 6), (49, 12)], BONE[2])
    # Near sword: raised guard versus a low sweeping attack.
    if frame:
        a.poly([(28, 30), (31, 35), (22, 41), (14, 39),
                (13, 34), (20, 32)], armor[1])
        a.line([(24, 32), (23, 36), (17, 36)], armor[2], 2)
        a.box((10, 35, 15, 39), "#c8966d", INK)
        a.line([(12, 33), (13, 42)], GOLD[2], 3, INK)
        curved_blade(a, [(12, 37), (5, 40), (3, 48), (5, 57),
                         (10, 63), (8, 54), (8, 47), (15, 41)],
                     [(11, 39), (6, 43), (5, 49), (6, 56), (9, 61)], True)
        flame(a, 6, 54, 12, 3, frame)
    else:
        a.poly([(27, 30), (29, 37), (23, 40), (17, 35),
                (17, 28), (22, 26)], armor[1])
        a.box((15, 24, 20, 29), "#c8966d", INK)
        a.line([(12, 27), (23, 29)], GOLD[2], 3, INK)
        curved_blade(a, [(16, 25), (10, 19), (9, 12), (12, 4),
                         (7, 7), (4, 15), (7, 23), (15, 29)],
                     [(16, 26), (9, 21), (6, 15), (8, 8), (11, 5)], True)
        flame(a, 7, 19, 12, 3, frame)
    return a.finish()


def swamp_behemoth(frame):
    a = PixelArt(80, 80)
    bark = ("#192e35", "#2b4b43", "#527357", "#8a9b68")
    toxic = ("#164b3e", "#1e9560", "#68db77", "#d8ff9c")
    # Spined back, distant roots, and trailing moss.
    for x, y, h, w in ((40, 6, 22, 5), (51, 8, 23, 5),
                        (62, 17, 20, 5), (69, 29, 15, 4)):
        crystal(a, x, y, h, w, toxic)
    a.line([(59, 49), (69, 54), (73, 63), (69, 70)],
           bark[0], 8, INK)
    a.line([(69, 63), (75, 68)], bark[1], 3, INK)
    # Huge trunk legs terminate in splayed root feet.
    a.poly([(45, 53), (59, 50), (64, 65), (72, 71),
            (72, 73), (62, 72), (57, 74), (48, 73),
            (48, 68), (43, 62)], bark[1])
    a.line([(53, 58), (56, 65), (62, 71)], bark[2], 3)
    fx = -3 if frame else 0
    a.poly([(25, 53), (41, 55), (38 + fx, 65),
            (40 + fx, 72), (35 + fx, 74), (29 + fx, 72),
            (19 + fx, 74), (17 + fx, 71), (24 + fx, 65)], bark[1])
    a.line([(29, 60), (28 + fx, 67), (22 + fx, 71)], bark[2], 3)
    a.line([(34, 65), (33 + fx, 71)], bark[0], 2)
    # Hunched, lichen-covered body.
    a.poly([(25, 23), (40, 17), (55, 22), (65, 34),
            (65, 48), (56, 59), (42, 63), (27, 58),
            (18, 48), (17, 33)], bark[1])
    a.facet([(28, 25), (39, 21), (49, 24), (54, 32),
             (43, 38), (29, 36), (22, 32)], bark[2])
    a.facet([(26, 43), (35, 46), (40, 56), (28, 54), (22, 48)], bark[2])
    a.line([(45, 38), (48, 43), (44, 49), (48, 56)], bark[0], 2)
    a.line([(54, 31), (58, 38), (55, 45)], bark[0], 2)
    a.line([(32, 45), (34, 50), (32, 54)], bark[3])
    # Moss shelves and droplets arranged as deliberate clusters.
    for x, y in ((31, 22), (44, 23), (54, 28), (59, 38), (40, 52), (25, 48)):
        a.poly([(x - 4, y), (x + 3, y - 1), (x + 5, y + 2),
                (x + 2, y + 4), (x - 5, y + 3)], "#426d45", None)
        a.line([(x - 3, y), (x + 2, y)], "#9cb26b")
        a.line([(x + 1, y + 3), (x, y + 7)], "#294d3c", 2)
    # Heavy head juts left, with a cavernous toothed maw.
    hy = 1 if frame else 0
    a.poly([(18, 23 + hy), (31, 20 + hy), (39, 25 + hy),
            (38, 39 + hy), (30, 46 + hy), (17, 44 + hy),
            (9, 37 + hy), (9, 29 + hy)], bark[1])
    a.facet([(17, 25 + hy), (29, 23 + hy), (33, 26 + hy),
             (26, 30 + hy), (11, 31 + hy)], bark[2])
    a.poly([(11, 33), (22, 32), (30, 30), (33, 35),
            (29, 43 + frame * 3), (19, 43 + frame * 3),
            (11, 39 + frame * 2)], "#111f2b")
    a.facet([(15, 40 + frame), (25, 39 + frame),
             (29, 42 + frame * 2), (20, 43 + frame * 2)], "#64474a")
    for x, y in ((13, 33), (19, 33), (26, 32)):
        a.poly([(x, y), (x + 3, y), (x + 1, y + 5)], "#bec48a")
    for x in (18, 25):
        a.poly([(x, 43 + frame * 2), (x + 3, 43 + frame * 2),
                (x + 2, 39 + frame * 2)], "#d7d6a0")
    a.line([(12, 28), (22, 26)], bark[0], 3)
    a.box((14, 28, 19, 29), toxic[2])
    a.box((14, 28, 16, 28), toxic[3])
    a.line([(28, 26), (32, 27)], toxic[2], 2)
    # Root arm shifts into a wide, forward smash.
    if frame:
        a.poly([(20, 37), (26, 43), (20, 52), (10, 52),
                (5, 48), (7, 41), (13, 39)], bark[1])
        a.line([(19, 40), (20, 46), (13, 48), (8, 46)], bark[2], 3)
        for y in (43, 48, 52):
            a.line([(10, y), (4, y + 1), (2, y + 4)], bark[2], 3, INK)
            a.dot(3, y + 3, bark[3])
    else:
        a.poly([(19, 38), (26, 43), (23, 54), (19, 64),
                (11, 66), (7, 60), (11, 48)], bark[1])
        a.line([(18, 41), (19, 51), (14, 60)], bark[2], 3)
        for x in (9, 14, 19):
            a.line([(x, 61), (x - 2, 67), (x, 71)], bark[2], 3, INK)
            a.dot(x - 1, 69, bark[3])
    for x, y in ((22, 38), (29, 23), (51, 30)):
        a.line([(x, y), (x - 2, y + 8), (x, y + 13)], "#3a8255", 2)
        a.dot(x, y + 15, toxic[2])
    return a.finish()


def frost_giant(frame):
    a = PixelArt(80, 80)
    steel = ("#25344d", "#425a79", "#789eb6", "#c2e5ec")
    skin = ("#315475", "#5b8ca8", "#94cbd7", "#d1eff0")
    # Royal fur cape and distant arm.
    a.poly([(40, 20), (56, 23), (62, 39), (66, 67),
            (59, 70), (53, 67), (48, 71), (42, 62)], "#29445e")
    a.line([(54, 29), (57, 43), (59, 64)], "#4b7390", 2)
    a.poly([(51, 29), (59, 32), (63, 43), (59, 48),
            (52, 44), (49, 36)], steel[0])
    plate(a, [(53, 40), (61, 39), (64, 47), (59, 51), (52, 47)], steel)
    # Greaves and heavy ice-edged boots.
    plate(a, [(42, 52), (53, 52), (56, 67), (61, 71),
              (60, 73), (43, 73), (40, 65)], steel)
    fx = -3 if frame else 0
    plate(a, [(27, 53), (38, 54), (35 + fx, 66),
              (36 + fx, 73), (20 + fx, 73), (21 + fx, 69)], steel)
    a.line([(23 + fx, 71), (33 + fx, 71)], ICE[2], 2)
    a.line([(45, 71), (57, 71)], ICE[2], 2)
    crystal(a, 29 + fx, 57, 8, 3)
    crystal(a, 48, 57, 8, 3)
    # Breastplate with layered, frosted planes.
    plate(a, [(28, 25), (44, 23), (55, 31), (52, 47),
              (44, 56), (30, 54), (23, 44), (23, 32)], steel)
    a.line([(28, 28), (38, 35), (50, 29)], ICE[2], 2)
    a.line([(38, 36), (38, 47)], steel[0], 2)
    a.poly([(36, 36), (40, 33), (44, 37), (41, 43), (37, 42)], ICE[1])
    a.line([(39, 35), (39, 41)], ICE[3])
    a.line([(27, 49), (50, 49)], "#334353", 4, INK)
    a.box((35, 47, 42, 51), STEEL[2], INK)
    a.box((37, 48, 40, 50), ICE[2])
    a.poly([(27, 52), (38, 53), (36, 61), (29, 63), (25, 59)], steel[1])
    a.line([(28, 53), (27, 58), (30, 60)], ICE[2])
    a.poly([(41, 53), (51, 52), (55, 59), (47, 62), (41, 59)], steel[1])
    # Huge shoulder ice.
    plate(a, [(44, 25), (54, 22), (61, 28), (59, 35), (47, 34)], steel)
    crystal(a, 49, 17, 13, 4)
    crystal(a, 58, 20, 11, 4)
    # Pale, severe face, looking left.
    a.poly([(27, 12), (38, 10), (46, 16), (44, 27),
            (36, 32), (25, 27), (22, 21), (23, 16)], skin[1])
    a.facet([(27, 14), (35, 13), (38, 17), (33, 23),
             (23, 22), (25, 17)], skin[2])
    a.line([(23, 18), (32, 17)], steel[0], 2)
    a.box((24, 19, 28, 20), ICE[2])
    a.box((24, 19, 26, 19), ICE[3])
    a.poly([(24, 25), (29, 26), (34, 23), (42, 24),
            (42, 31), (38, 38), (35, 34), (32, 41),
            (29, 34), (25, 36), (23, 29)], ICE[1])
    a.facet([(25, 26), (29, 28), (31, 26), (30, 35),
             (28, 31), (26, 33)], ICE[2])
    a.line([(35, 27), (34, 35)], ICE[3])
    a.line([(39, 26), (38, 31)], ICE[2])
    # Jagged crown.
    a.poly([(25, 13), (22, 5), (29, 9), (32, 2),
            (36, 9), (42, 3), (43, 11), (48, 8),
            (45, 17), (35, 14)], ICE[1])
    a.facet([(24, 7), (29, 11), (32, 4), (33, 12),
             (28, 13)], ICE[2])
    a.line([(25, 13), (35, 11), (45, 15)], ICE[3])
    a.box((34, 11, 37, 14), "#f3ffff", INK)
    # Halberd pose: upright guard or a descending forward cleave.
    if frame:
        a.poly([(25, 31), (29, 38), (23, 44), (15, 40),
                (14, 34), (20, 30)], skin[1])
        plate(a, [(13, 33), (21, 35), (22, 41), (16, 44), (11, 39)], steel)
        a.line([(32, 57), (9, 18)], "#637e8c", 4, INK)
        a.line([(31, 56), (10, 19)], ICE[3])
        a.poly([(10, 20), (3, 21), (3, 12), (8, 5),
                (10, 12), (16, 11), (20, 16), (15, 23)], ICE[1])
        a.facet([(4, 13), (8, 7), (8, 14), (11, 17),
                 (6, 19), (4, 18)], ICE[2])
        a.line([(4, 18), (4, 12), (8, 6)], ICE[3])
        a.poly([(10, 14), (11, 3), (15, 10)], ICE[2])
    else:
        a.poly([(25, 32), (28, 38), (22, 44), (15, 43),
                (12, 38), (16, 32)], skin[1])
        plate(a, [(12, 37), (20, 37), (22, 44), (15, 47), (10, 43)], steel)
        a.line([(11, 70), (13, 13)], "#637e8c", 4, INK)
        a.line([(10, 69), (12, 14)], ICE[3])
        a.poly([(13, 14), (6, 18), (3, 15), (3, 8),
                (8, 3), (8, 9), (13, 10), (18, 6),
                (20, 13), (17, 20), (13, 20)], ICE[1])
        a.facet([(4, 9), (7, 5), (7, 11), (12, 13),
                 (7, 16), (4, 14)], ICE[2])
        a.line([(4, 14), (4, 9), (7, 5)], ICE[3])
        a.poly([(12, 11), (14, 2), (16, 10)], ICE[2])
        a.line([(9, 24), (16, 24)], GOLD[2], 2, INK)
    return a.finish()


def flame_lord(frame):
    a = PixelArt(80, 80)
    obsidian = ("#231e32", "#403044", "#69505b", "#9b7773")
    # The flame mantle is built from opaque nested flame silhouettes.
    for x, base, h, w in ((31, 40, 29, 6), (43, 36, 33, 7),
                           (56, 43, 34, 7), (65, 54, 29, 6),
                           (60, 65, 29, 6), (48, 65, 26, 5)):
        flame(a, x + (frame if x > 40 else -frame), base, h, w, frame)
    # Far armored arm.
    plate(a, [(51, 29), (61, 29), (66, 40), (61, 48),
              (54, 44), (49, 36)], obsidian)
    a.line([(59, 33), (61, 39), (58, 43)], FIRE[1], 2)
    # Broad armored legs and taloned boots.
    plate(a, [(43, 53), (55, 51), (58, 66), (64, 71),
              (63, 73), (47, 73), (42, 65)], obsidian)
    fx = -4 if frame else 0
    plate(a, [(28, 52), (39, 54), (35 + fx, 66),
              (37 + fx, 73), (19 + fx, 73), (22 + fx, 68)], obsidian)
    a.line([(29, 57), (32, 62), (28 + fx, 67)], FIRE[1], 2)
    a.line([(49, 56), (47, 62), (53, 68)], FIRE[1], 2)
    a.line([(29, 58), (31, 61)], FIRE[2])
    a.line([(49, 58), (48, 61)], FIRE[2])
    for x, y in ((22 + fx, 71), (29 + fx, 71), (49, 71), (57, 71)):
        a.poly([(x, y), (x - 3, y + 2), (x + 3, y + 2)], STEEL[2])
    # Sharp black breastplate surrounding the furnace core.
    plate(a, [(27, 25), (43, 22), (56, 30), (53, 45),
              (44, 55), (30, 52), (23, 42), (22, 32)], obsidian)
    a.line([(26, 29), (34, 35), (32, 41), (38, 46)], FIRE[1], 2)
    a.line([(48, 28), (43, 35), (47, 40), (42, 47)], FIRE[1], 2)
    a.line([(27, 30), (33, 35), (32, 38)], FIRE[2])
    a.line([(47, 29), (44, 35)], FIRE[2])
    a.poly([(36, 31), (42, 29), (46, 35), (42, 44),
            (37, 43), (33, 37)], FIRE[0])
    a.poly([(38, 32), (41, 31), (43, 36), (40, 41),
            (36, 37)], FIRE[2], None)
    a.line([(39, 33), (40, 36), (38, 38)], FIRE[3])
    a.line([(28, 49), (51, 48)], obsidian[0], 4, INK)
    a.poly([(35, 47), (42, 46), (46, 50), (41, 54),
            (35, 53), (32, 50)], GOLD[1])
    a.box((37, 49, 41, 51), FIRE[2])
    a.poly([(28, 52), (37, 54), (34, 62), (28, 61), (24, 57)], obsidian[1])
    a.line([(28, 54), (30, 59)], FIRE[1])
    a.poly([(42, 54), (52, 51), (57, 59), (48, 63), (41, 60)], obsidian[1])
    a.line([(49, 54), (51, 59)], FIRE[1])
    # Raised, jagged shoulder armor.
    plate(a, [(45, 25), (53, 21), (62, 25), (65, 33),
              (57, 37), (47, 33)], obsidian)
    a.poly([(52, 24), (53, 15), (58, 24)], obsidian[2])
    a.poly([(60, 27), (66, 21), (65, 31)], obsidian[2])
    a.line([(48, 27), (54, 29), (58, 34)], FIRE[1], 2)
    # Horned, left-facing demon helm.
    plate(a, [(27, 12), (38, 9), (46, 15), (45, 25),
              (36, 32), (25, 27), (21, 21), (23, 16)], obsidian)
    a.poly([(25, 14), (18, 10), (17, 3), (14, 7),
            (16, 14), (23, 20)], obsidian[1])
    a.line([(16, 7), (18, 12), (22, 15)], obsidian[3])
    a.poly([(39, 12), (45, 8), (46, 2), (50, 7),
            (48, 14), (42, 19)], obsidian[1])
    a.line([(47, 5), (48, 8), (45, 13)], obsidian[3])
    a.line([(23, 20), (31, 18), (34, 20)], INK, 3)
    a.line([(24, 20), (30, 19)], FIRE[2], 2)
    a.dot(24, 20, FIRE[3])
    a.line([(38, 19), (41, 20)], FIRE[1], 2)
    a.poly([(24, 25), (30, 24), (34, 26), (40, 23),
            (37, 29), (30, 30)], "#160f22")
    a.line([(26, 26), (30, 27), (35, 26)], FIRE[2])
    a.poly([(30, 28), (34, 28), (33, 33)], obsidian[2])
    a.line([(34, 13), (33, 16), (36, 18)], FIRE[1])
    # Front arm and the enormous molten sword.
    if frame:
        a.poly([(24, 31), (29, 37), (24, 44), (16, 41),
                (12, 36), (16, 31)], obsidian[1])
        plate(a, [(12, 34), (20, 35), (22, 41), (15, 44), (10, 39)], obsidian)
        a.line([(18, 41), (10, 26)], LEATHER[1], 5, INK)
        a.line([(5, 29), (17, 24)], GOLD[1], 3, INK)
        a.poly([(9, 26), (3, 17), (3, 4), (9, 6),
                (17, 14), (15, 24), (12, 28)], obsidian[1])
        a.facet([(5, 7), (8, 8), (13, 15), (12, 24),
                 (9, 24), (5, 16)], FIRE[1])
        a.line([(5, 8), (7, 14), (10, 17), (10, 23)], FIRE[3], 2)
        a.line([(13, 13), (14, 17), (12, 21)], FIRE[2])
        flame(a, 6, 18, 12, 3, frame)
    else:
        a.poly([(24, 31), (28, 37), (24, 46), (17, 49),
                (12, 44), (14, 36)], obsidian[1])
        plate(a, [(12, 42), (20, 42), (23, 48), (16, 51), (10, 47)], obsidian)
        a.line([(17, 46), (14, 56)], LEATHER[1], 5, INK)
        a.line([(7, 54), (22, 57)], GOLD[1], 3, INK)
        a.poly([(11, 57), (19, 59), (19, 68), (14, 74),
                (8, 70), (7, 62)], obsidian[1])
        a.facet([(11, 59), (16, 60), (16, 68), (13, 72),
                 (10, 68), (9, 63)], FIRE[1])
        a.line([(12, 59), (13, 64), (12, 69), (14, 72)], FIRE[3], 2)
        a.line([(16, 61), (14, 65)], FIRE[2])
        flame(a, 9, 68, 12, 3, frame)
    return a.finish()


ENEMIES = (
    ("goblin", goblin),
    ("boar", boar),
    ("bandit", bandit),
    ("scorpion", scorpion),
    ("bogling", bogling),
    ("golem", golem),
    ("wyvern", wyvern),
)

BOSSES = (
    ("orc_chief", orc_chief),
    ("canyon_king", canyon_king),
    ("swamp_behemoth", swamp_behemoth),
    ("frost_giant", frost_giant),
    ("flame_lord", flame_lord),
)


def build_sheet(entries, cell_size):
    sheet = Image.new(
        "RGBA", (cell_size * 2, cell_size * len(entries)), (0, 0, 0, 0)
    )
    for row, (name, render) in enumerate(entries):
        frames = []
        for frame in range(2):
            sprite = render(frame)
            assert sprite.mode == "RGBA"
            assert sprite.size == (cell_size, cell_size)
            assert set(sprite.getchannel("A").getdata()) <= {0, 255}
            bounds = sprite.getbbox()
            assert bounds is not None, name
            assert bounds[0] >= 0 and bounds[1] >= 0, (name, frame, bounds)
            assert bounds[2] <= cell_size and bounds[3] <= cell_size, (
                name, frame, bounds
            )
            sheet.paste(sprite, (frame * cell_size, row * cell_size))
            frames.append(sprite)
        assert frames[0].tobytes() != frames[1].tobytes(), (
            name, "Animation frames must differ"
        )
    return sheet


def main():
    output = Path("public/assets/sprites")
    output.mkdir(parents=True, exist_ok=True)

    for filename, entries, cell_size, expected in (
        ("enemies.png", ENEMIES, 48, (96, 336)),
        ("bosses.png", BOSSES, 80, (160, 400)),
    ):
        sheet = build_sheet(entries, cell_size)
        assert sheet.size == expected
        path = output / filename
        sheet.save(path, format="PNG", optimize=True)

        with Image.open(path) as verified:
            verified.load()
            assert verified.mode == "RGBA"
            assert verified.size == expected
            assert set(verified.getchannel("A").getdata()) == {0, 255}
            print(
                f"{path.as_posix()}: "
                f"{verified.width}x{verified.height} "
                f"{verified.mode}; 2 columns x {len(entries)} rows; "
                "binary alpha verified"
            )


if __name__ == "__main__":
    main()
