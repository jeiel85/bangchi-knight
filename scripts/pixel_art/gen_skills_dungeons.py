from pathlib import Path
from PIL import Image, ImageDraw

OUTLINE = "#141928"
WHITE = "#fffbea"
GOLD_DARK = "#9b492b"
GOLD = "#e99a32"
GOLD_LIGHT = "#ffda65"
CYAN = "#5de9f0"
STEEL_DARK = "#405571"
STEEL = "#91b8cd"
STEEL_LIGHT = "#dcecf2"


class PixelIcon:
    def __init__(self):
        self.image = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        self.draw = ImageDraw.Draw(self.image)

    def polygon(self, points, color, outline=True):
        self.draw.polygon(points, fill=color)
        if outline:
            self.draw.line(points + [points[0]], fill=OUTLINE, width=1)

    def line(self, points, color, width=1):
        self.draw.line(points, fill=color, width=width)

    def rect(self, box, color, outline=False):
        self.draw.rectangle(box, fill=color, outline=OUTLINE if outline else None)

    def ellipse(self, box, color, outline=True):
        self.draw.ellipse(box, fill=color, outline=OUTLINE if outline else None)

    def pixel(self, x, y, color):
        self.draw.point((x, y), fill=color)

    def spark(self, x, y, color=WHITE, size=2):
        self.line([(x - size, y), (x + size, y)], OUTLINE, 3)
        self.line([(x, y - size), (x, y + size)], OUTLINE, 3)
        self.line([(x - size, y), (x + size, y)], color)
        self.line([(x, y - size), (x, y + size)], color)
        self.pixel(x, y, WHITE)


def whirlwind():
    p = PixelIcon()

    # Three interlocking crescents leave a genuinely transparent vortex core.
    p.polygon(
        [(3, 12), (6, 6), (13, 3), (22, 4), (28, 9), (29, 15),
         (26, 12), (23, 9), (16, 7), (10, 9), (6, 14), (4, 19)],
        STEEL_DARK,
    )
    p.polygon(
        [(4, 12), (8, 7), (14, 5), (21, 5), (26, 9), (27, 12),
         (22, 8), (15, 7), (9, 10), (5, 16)],
        STEEL_LIGHT, False,
    )
    p.line([(8, 7), (14, 4), (21, 5)], WHITE)
    p.line([(10, 10), (16, 8), (22, 9)], STEEL)

    p.polygon(
        [(27, 11), (30, 16), (28, 23), (23, 28), (15, 30),
         (7, 27), (3, 22), (2, 16), (6, 20), (10, 24),
         (16, 25), (22, 23), (25, 19)],
        GOLD_DARK,
    )
    p.polygon(
        [(28, 15), (28, 21), (23, 26), (16, 28), (9, 26),
         (5, 22), (4, 19), (10, 25), (16, 26), (23, 23), (26, 18)],
        GOLD_LIGHT, False,
    )
    p.line([(8, 27), (15, 29), (23, 27), (27, 23)], GOLD)
    p.line([(10, 25), (16, 26), (22, 24)], WHITE)

    p.polygon(
        [(6, 19), (8, 13), (13, 10), (20, 10), (25, 13),
         (26, 18), (23, 22), (17, 24), (11, 22), (9, 19),
         (14, 21), (19, 21), (22, 18), (22, 15), (18, 13),
         (13, 13), (9, 16)],
        STEEL,
    )
    p.line([(9, 14), (13, 11), (19, 11), (23, 13)], STEEL_LIGHT)
    p.line([(12, 22), (18, 23), (23, 20)], WHITE)

    # A recognizable tapered blade breaks through the ring's silhouette.
    p.polygon([(19, 9), (23, 5), (30, 2), (28, 10), (24, 14)], STEEL)
    p.polygon([(21, 9), (29, 3), (25, 11)], WHITE, False)
    p.line([(25, 11), (28, 6)], STEEL_DARK)
    p.polygon([(18, 10), (20, 8), (25, 13), (23, 15)], GOLD_LIGHT)
    p.line([(17, 14), (20, 11)], OUTLINE, 3)
    p.line([(17, 14), (20, 11)], GOLD_DARK)
    p.spark(5, 4, WHITE, 1)
    p.spark(28, 27, WHITE, 1)
    p.pixel(2, 26, GOLD_LIGHT)
    p.pixel(15, 1, WHITE)
    return p.image


def judgment():
    p = PixelIcon()

    # Discrete lightning branches surround the descending sword.
    p.polygon([(10, 1), (7, 7), (10, 7), (6, 15),
               (12, 10), (10, 10), (13, 4)], "#158fa8")
    p.line([(10, 2), (9, 6), (11, 6), (8, 12)], CYAN)
    p.polygon([(23, 2), (20, 8), (23, 9), (21, 16),
               (27, 9), (24, 7), (26, 3)], "#167c9e")
    p.line([(24, 3), (22, 7), (25, 9), (23, 13)], CYAN)

    p.polygon(
        [(2, 26), (7, 23), (13, 22), (22, 22), (29, 25),
         (30, 28), (25, 30), (7, 30), (1, 28)],
        "#116b85",
    )
    p.polygon(
        [(3, 26), (9, 24), (22, 24), (28, 26),
         (25, 28), (8, 28)],
        CYAN, False,
    )
    p.polygon([(7, 26), (12, 25), (22, 25), (26, 26),
               (22, 27), (10, 27)], "#d1fff3", False)
    p.line([(8, 29), (24, 29)], "#249bb1")
    p.polygon([(7, 24), (6, 19), (12, 23), (15, 17),
               (19, 22), (25, 19), (24, 24), (18, 27), (12, 26)], GOLD)
    p.polygon([(11, 24), (14, 21), (17, 23), (21, 22),
               (19, 26), (14, 26)], GOLD_LIGHT, False)

    p.rect((14, 1, 18, 7), GOLD_DARK, True)
    p.rect((15, 2, 17, 6), GOLD)
    p.pixel(16, 2, WHITE)
    p.line([(15, 4), (17, 4)], GOLD_LIGHT)
    p.polygon([(9, 7), (13, 6), (16, 8), (19, 6),
               (23, 7), (21, 10), (18, 10), (16, 12),
               (14, 10), (11, 10)], GOLD)
    p.line([(10, 7), (13, 7), (16, 9), (19, 7), (22, 7)], GOLD_LIGHT)
    p.polygon([(13, 10), (19, 10), (19, 19), (16, 25), (13, 19)], "#36b9ce")
    p.polygon([(14, 11), (16, 12), (16, 23), (14, 18)], WHITE, False)
    p.polygon([(17, 12), (18, 11), (18, 18), (17, 21)], "#a1fff1", False)
    p.pixel(16, 9, WHITE)
    p.spark(3, 17, CYAN, 1)
    p.spark(29, 17, GOLD_LIGHT, 1)
    p.pixel(11, 29, WHITE)
    p.pixel(23, 24, WHITE)
    return p.image


def oath():
    p = PixelIcon()

    # Faceted emerald shield, with gold edging and an inset heart.
    p.polygon([(6, 13), (11, 11), (16, 13), (21, 11),
               (26, 13), (25, 22), (22, 26), (16, 30),
               (10, 26), (7, 22)], GOLD_DARK)
    p.polygon([(8, 14), (11, 13), (16, 15), (21, 13),
               (24, 14), (23, 21), (20, 25), (16, 28),
               (12, 25), (9, 21)], GOLD_LIGHT, False)
    p.polygon([(10, 15), (15, 17), (16, 16), (21, 15),
               (22, 16), (21, 22), (16, 26), (11, 22)], "#08766b")
    p.polygon([(11, 16), (15, 18), (16, 17), (20, 16),
               (20, 21), (16, 24), (12, 21)], "#1dbb87", False)
    p.line([(11, 17), (12, 21), (16, 24)], "#65f6b0")
    p.polygon([(11, 18), (13, 16), (16, 18), (19, 16),
               (21, 18), (20, 21), (16, 24), (12, 21)], "#43e6a0")
    p.polygon([(12, 18), (13, 17), (16, 19), (19, 17),
               (20, 18), (16, 22)], "#b5ffd4", False)
    p.pixel(13, 18, WHITE)

    # Royal five-point crown, with a warm metal underside.
    p.polygon([(5, 5), (10, 8), (11, 3), (15, 7),
               (17, 2), (20, 7), (25, 4), (24, 13),
               (20, 15), (10, 15), (7, 12)], GOLD_DARK)
    p.polygon([(7, 7), (11, 10), (12, 6), (16, 10),
               (17, 5), (20, 10), (23, 7), (22, 12),
               (10, 12)], GOLD, False)
    p.line([(8, 8), (10, 10), (12, 7)], GOLD_LIGHT)
    p.line([(14, 9), (16, 11), (18, 7)], GOLD_LIGHT)
    p.line([(20, 10), (22, 8)], WHITE)
    p.rect((9, 12, 22, 14), GOLD, True)
    p.line([(10, 12), (21, 12)], GOLD_LIGHT)
    p.polygon([(15, 11), (17, 11), (18, 13), (16, 14), (14, 13)], "#08766b")
    p.pixel(16, 12, "#9bffcf")
    p.pixel(11, 13, WHITE)
    p.pixel(21, 13, WHITE)
    p.spark(3, 11, GOLD_LIGHT, 1)
    p.spark(28, 7, GOLD_LIGHT, 1)
    p.spark(27, 23, "#91ffd1", 1)
    p.spark(4, 25, "#91ffd1", 1)
    p.pixel(3, 19, GOLD)
    p.pixel(27, 15, WHITE)
    p.pixel(8, 2, GOLD_LIGHT)
    return p.image


def ore_mine():
    p = PixelIcon()

    # Jagged rock silhouette and deeply recessed tunnel.
    p.polygon([(2, 28), (3, 12), (7, 5), (12, 2),
               (21, 2), (27, 7), (30, 16), (29, 29)], "#343b50")
    p.polygon([(4, 15), (6, 8), (11, 4), (15, 3), (12, 9),
               (8, 12), (7, 20)], "#65778b", False)
    p.polygon([(21, 4), (25, 7), (28, 14), (26, 18),
               (23, 10), (18, 8)], "#4b5b74", False)
    p.line([(6, 10), (9, 6), (12, 5)], "#96a4ad")
    p.line([(24, 8), (26, 12)], "#8797a5")
    p.polygon([(8, 12), (12, 8), (21, 8), (25, 13),
               (25, 28), (7, 28)], "#1b2438")
    p.polygon([(12, 12), (21, 12), (22, 26), (10, 26)], "#11202c", False)

    # Blue-steel seams behind the timber frame.
    p.line([(13, 12), (15, 16), (13, 20), (14, 24)], "#277d9c", 2)
    p.line([(15, 16), (19, 14), (22, 16)], "#45bbcf")
    p.polygon([(10, 21), (11, 15), (14, 13), (16, 18), (14, 23)], "#3589af")
    p.polygon([(11, 20), (12, 16), (14, 14), (14, 19)], "#a9f5fb", False)
    p.polygon([(17, 24), (17, 18), (20, 16), (23, 20), (21, 25)], "#226485")
    p.polygon([(18, 23), (18, 19), (20, 17), (20, 22)], "#64dcea", False)

    p.polygon([(5, 10), (9, 8), (11, 10), (10, 28),
               (5, 28)], "#774b38")
    p.line([(7, 12), (7, 26)], "#c48b52")
    p.line([(9, 14), (8, 20), (9, 24)], "#4a3540")
    p.polygon([(23, 9), (27, 11), (27, 28), (22, 28)], "#774b38")
    p.line([(24, 12), (24, 26)], "#c48b52")
    p.line([(26, 17), (25, 21)], "#4a3540")
    p.polygon([(4, 9), (8, 6), (24, 6), (28, 9),
               (27, 12), (5, 12)], "#a46b42")
    p.line([(7, 8), (24, 8), (26, 9)], "#e1aa67")
    p.line([(6, 11), (25, 11)], "#664037")
    for x, y in [(7, 10), (25, 10), (7, 25), (24, 25)]:
        p.pixel(x, y, STEEL_LIGHT)
    p.polygon([(2, 29), (7, 26), (12, 28), (19, 27),
               (27, 27), (30, 30), (3, 30)], "#4c596a")
    p.line([(9, 28), (13, 28)], STEEL)

    # Two crossed tools: dark edges keep them legible over the tunnel.
    p.line([(10, 16), (25, 28)], OUTLINE, 4)
    p.line([(10, 16), (25, 28)], "#aa703e", 2)
    p.line([(11, 16), (24, 26)], "#e1aa67")
    p.line([(24, 15), (10, 29)], OUTLINE, 4)
    p.line([(24, 15), (10, 29)], "#ae7747", 2)
    p.line([(23, 16), (11, 28)], "#edbd79")
    p.polygon([(5, 16), (8, 12), (12, 12), (16, 15),
               (18, 20), (13, 17), (10, 15)], STEEL)
    p.line([(7, 15), (9, 13), (12, 13), (15, 15)], STEEL_LIGHT)
    p.polygon([(17, 15), (20, 12), (25, 12), (29, 16),
               (26, 15), (23, 15), (19, 18)], STEEL)
    p.line([(20, 13), (25, 13), (27, 15)], WHITE)
    p.pixel(23, 14, CYAN)
    p.pixel(4, 20, "#69d5ed")
    return p.image


def boss_arena():
    p = PixelIcon()

    # Colosseum tiers, pillars and recessed arches.
    p.polygon([(4, 14), (5, 8), (11, 5), (21, 5),
               (27, 8), (28, 14), (26, 27), (6, 27)], "#644b55")
    p.polygon([(6, 9), (11, 7), (21, 7), (26, 9),
               (25, 12), (7, 12)], "#b58a73", False)
    p.line([(6, 9), (11, 6), (21, 6), (26, 9)], "#e1b48a")
    for x in (7, 12, 18, 23):
        p.rect((x, 10, x + 2, 18), "#302939", True)
        p.pixel(x + 1, 10, "#dbad82")
    p.line([(5, 18), (27, 18)], "#c09372")
    p.rect((5, 25, 27, 28), "#674447", True)
    p.line([(6, 26), (26, 26)], "#a77965")

    # Crimson ceremonial shield.
    p.polygon([(8, 12), (15, 10), (23, 12), (24, 20),
               (21, 26), (16, 30), (10, 26), (7, 20)], GOLD_DARK)
    p.polygon([(9, 13), (15, 12), (22, 13), (22, 20),
               (19, 25), (16, 28), (12, 25), (9, 20)], GOLD_LIGHT, False)
    p.polygon([(11, 14), (16, 13), (20, 14), (21, 20),
               (18, 24), (16, 26), (12, 23), (10, 19)], "#9b254c")
    p.polygon([(12, 15), (16, 14), (19, 15), (19, 20),
               (16, 24), (13, 21)], "#dc4160", False)
    p.line([(12, 16), (12, 19)], "#ff7977")

    # Crown above a compact, readable ivory skull.
    p.polygon([(10, 5), (13, 7), (16, 2), (19, 7),
               (22, 5), (21, 11), (11, 11)], GOLD_DARK)
    p.polygon([(12, 7), (14, 9), (16, 5), (18, 9),
               (20, 7), (20, 10), (12, 10)], GOLD_LIGHT, False)
    p.pixel(16, 7, WHITE)
    p.rect((12, 10, 20, 12), GOLD, True)
    p.pixel(16, 11, "#f0525f")
    p.polygon([(12, 14), (19, 14), (21, 17), (20, 21),
               (18, 22), (18, 24), (13, 24), (13, 22),
               (11, 21), (10, 17)], "#c6a88c")
    p.polygon([(12, 15), (18, 15), (20, 17), (19, 20),
               (17, 21), (14, 21), (12, 20), (11, 17)], "#f9e4b4", False)
    p.line([(13, 15), (17, 15)], WHITE)
    p.polygon([(12, 17), (15, 18), (14, 20), (12, 19)], OUTLINE, False)
    p.polygon([(17, 18), (19, 17), (19, 19), (17, 20)], OUTLINE, False)
    p.pixel(13, 18, "#f45052")
    p.pixel(18, 18, "#f45052")
    p.polygon([(15, 20), (16, 19), (17, 21), (15, 21)], OUTLINE, False)
    p.line([(14, 22), (14, 23)], WHITE)
    p.line([(16, 22), (16, 23)], WHITE)

    # Twin braziers frame the trophy with sharply stepped flames.
    for x in (3, 28):
        p.polygon([(x - 1, 29), (x - 1, 24), (x - 3, 21),
                   (x + 3, 21), (x + 1, 24), (x + 1, 29)], GOLD_DARK)
        p.line([(x, 24), (x, 28)], GOLD_LIGHT)
        p.line([(x - 2, 22), (x + 2, 22)], GOLD_LIGHT)
        p.polygon([(x - 2, 20), (x - 3, 17), (x - 1, 14),
                   (x, 10), (x + 2, 14), (x + 3, 18),
                   (x + 2, 20)], "#d94439")
        p.polygon([(x - 1, 19), (x - 1, 16), (x, 13),
                   (x + 1, 17), (x + 2, 19)], "#ffa743", False)
        p.line([(x, 17), (x, 20)], "#fff1a3")
    p.pixel(2, 8, GOLD)
    p.pixel(29, 7, GOLD_LIGHT)
    return p.image


if __name__ == "__main__":
    output_dir = Path("public/assets/ui")
    output_dir.mkdir(parents=True, exist_ok=True)

    icons = [whirlwind(), judgment(), oath(), ore_mine(), boss_arena()]
    sheet = Image.new("RGBA", (160, 32), (0, 0, 0, 0))
    for column, icon in enumerate(icons):
        assert icon.size == (32, 32)
        sheet.paste(icon, (column * 32, 0))

    assert sheet.mode == "RGBA"
    assert sheet.size == (160, 32)
    assert set(sheet.getchannel("A").getdata()) == {0, 255}
    for column in range(5):
        cell = sheet.crop((column * 32, 0, (column + 1) * 32, 32))
        assert cell.getchannel("A").getbbox() is not None

    output_path = output_dir / "skills-dungeons.png"
    sheet.save(output_path, format="PNG", optimize=True)

    with Image.open(output_path) as saved:
        saved.load()
        assert saved.format == "PNG"
        assert saved.mode == "RGBA"
        assert saved.size == (160, 32)
        assert set(saved.getchannel("A").getdata()) == {0, 255}
        for column in range(5):
            assert saved.crop(
                (column * 32, 0, (column + 1) * 32, 32)
            ).getchannel("A").getbbox() is not None