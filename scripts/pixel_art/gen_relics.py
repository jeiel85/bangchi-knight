from pathlib import Path
from PIL import Image, ImageDraw

CELL = 32
OUTLINE = "#141928"

GOLD_DARK = "#754129"
GOLD_SHADOW = "#b8752e"
GOLD = "#e9ab3f"
GOLD_LIGHT = "#ffdb72"
GOLD_WHITE = "#fff2bc"

SILVER_DARK = "#384c71"
SILVER = "#819eb5"
SILVER_LIGHT = "#d3edf2"
WHITE = "#fffce8"

BLUE_DARK = "#173b83"
BLUE = "#2864c7"
CYAN = "#55dcef"
ICE = "#c4ffff"

RED_DARK = "#722342"
RED = "#cf3650"
RED_LIGHT = "#ff7770"

GREEN_DARK = "#145244"
GREEN = "#1aaf79"
GREEN_LIGHT = "#75efb0"


def polygon(draw, points, fill, outline=OUTLINE):
    draw.polygon(points, fill=fill)
    if outline:
        draw.line(points + [points[0]], fill=outline, width=1)


def line(draw, points, fill, width=1):
    draw.line(points, fill=fill, width=width)


def sparkle(draw, x, y, color=GOLD_WHITE, large=False):
    draw.point((x, y), fill=WHITE)
    draw.point((x - 1, y), fill=color)
    draw.point((x + 1, y), fill=color)
    draw.point((x, y - 1), fill=color)
    draw.point((x, y + 1), fill=color)
    if large:
        draw.point((x - 2, y), fill=color)
        draw.point((x + 2, y), fill=color)
        draw.point((x, y - 2), fill=color)
        draw.point((x, y + 2), fill=color)
        draw.point((x, y), fill=WHITE)


def canvas():
    image = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def phoenix_plume():
    image, d = canvas()
    polygon(d, [
        (5, 28), (8, 21), (7, 18), (8, 12), (11, 15),
        (11, 9), (15, 12), (15, 6), (18, 9), (21, 3),
        (22, 6), (27, 2), (26, 9), (29, 8), (27, 15),
        (24, 19), (19, 22), (14, 23), (10, 26), (7, 29)
    ], "#982c3b")
    polygon(d, [
        (10, 21), (9, 16), (11, 18), (13, 12), (15, 15),
        (17, 9), (19, 12), (22, 7), (22, 10), (26, 5),
        (24, 13), (27, 12), (24, 17), (20, 20), (14, 22)
    ], "#ed4937", None)
    polygon(d, [
        (11, 22), (13, 18), (13, 15), (16, 17), (18, 12),
        (20, 14), (24, 8), (22, 15), (24, 15), (21, 18),
        (17, 20)
    ], "#ff8b32", None)
    polygon(d, [
        (13, 22), (16, 18), (18, 18), (20, 14), (21, 16),
        (24, 12), (22, 17), (19, 20)
    ], "#ffd35b", None)
    line(d, [(6, 28), (11, 23), (15, 20), (19, 16), (24, 8)], GOLD_DARK, 2)
    line(d, [(7, 27), (12, 22), (16, 19), (20, 15), (24, 8)], "#fff1a2")
    line(d, [(12, 21), (10, 18)], "#ffad42")
    line(d, [(16, 18), (16, 14)], "#ffd963")
    line(d, [(18, 19), (22, 18)], "#fff1a2")
    line(d, [(22, 13), (25, 10)], "#fff1a2")
    line(d, [(7, 26), (5, 28)], GOLD_LIGHT)
    sparkle(d, 7, 7, "#ffca55")
    sparkle(d, 27, 23, "#ffbf45")
    d.point((5, 17), fill="#ffab3f")
    d.point((13, 4), fill="#ffe991")
    d.point((24, 26), fill="#ffde77")
    d.point((29, 18), fill="#ff8b32")
    return image


def frost_seal():
    image, d = canvas()
    polygon(d, [
        (15, 2), (18, 2), (27, 8), (29, 18),
        (23, 27), (13, 30), (4, 23), (2, 13), (7, 6)
    ], SILVER_DARK)
    polygon(d, [
        (15, 4), (18, 4), (25, 9), (27, 18),
        (22, 25), (13, 28), (6, 22), (4, 13), (8, 8)
    ], SILVER_LIGHT, None)
    polygon(d, [
        (14, 6), (19, 6), (24, 10), (25, 18),
        (21, 24), (13, 26), (8, 21), (6, 14), (9, 9)
    ], "#427399")
    polygon(d, [
        (14, 8), (18, 8), (22, 11), (23, 18),
        (20, 22), (13, 24), (10, 20), (8, 14), (11, 10)
    ], BLUE_DARK, None)
    polygon(d, [(15, 9), (21, 11), (23, 18), (16, 17)], BLUE, None)
    polygon(d, [(10, 14), (15, 9), (16, 17), (12, 22)], "#208db8", None)
    line(d, [(16, 7), (16, 25)], CYAN, 3)
    line(d, [(8, 11), (24, 21)], CYAN, 3)
    line(d, [(8, 21), (24, 11)], CYAN, 3)
    line(d, [(16, 8), (16, 24)], ICE)
    line(d, [(9, 11), (23, 21)], ICE)
    line(d, [(9, 21), (23, 11)], ICE)
    for points in [
        [(12, 9), (16, 12), (20, 9)],
        [(12, 23), (16, 20), (20, 23)],
        [(9, 15), (12, 14), (12, 11)],
        [(20, 11), (20, 14), (23, 15)],
        [(9, 17), (12, 18), (12, 21)],
        [(20, 21), (20, 18), (23, 17)]
    ]:
        line(d, points, ICE)
    polygon(d, [(16, 12), (20, 16), (16, 20), (12, 16)], BLUE_DARK)
    polygon(d, [(16, 13), (19, 16), (16, 18), (14, 16)], CYAN, None)
    line(d, [(16, 13), (14, 16), (16, 16)], WHITE)
    line(d, [(7, 9), (5, 14), (6, 18)], WHITE)
    line(d, [(15, 5), (19, 5), (23, 8)], WHITE)
    line(d, [(24, 22), (21, 26), (16, 28)], SILVER)
    sparkle(d, 27, 6, ICE)
    sparkle(d, 4, 26, ICE)
    return image


def storm_compass():
    image, d = canvas()
    polygon(d, [(13, 1), (18, 1), (20, 3), (20, 6),
                (11, 6), (11, 3)], GOLD_SHADOW)
    d.rectangle((14, 2, 17, 4), fill=OUTLINE)
    line(d, [(13, 2), (13, 4)], GOLD_LIGHT)
    polygon(d, [
        (11, 5), (20, 5), (26, 10), (29, 17), (26, 25),
        (20, 29), (11, 29), (5, 25), (2, 18), (5, 10)
    ], GOLD_DARK)
    polygon(d, [
        (11, 6), (20, 6), (25, 11), (27, 17), (25, 24),
        (20, 27), (11, 27), (6, 23), (4, 17), (7, 11)
    ], GOLD, None)
    line(d, [(5, 17), (7, 11), (12, 7), (19, 7), (23, 10)], GOLD_WHITE)
    line(d, [(8, 24), (12, 27), (20, 27), (25, 23)], GOLD_SHADOW)
    polygon(d, [
        (12, 9), (19, 9), (24, 13), (25, 18),
        (22, 23), (18, 25), (12, 24), (8, 20), (7, 15)
    ], BLUE_DARK)
    polygon(d, [(12, 10), (19, 10), (23, 14),
                (24, 18), (16, 17), (8, 16)], BLUE, None)
    line(d, [(10, 13), (12, 11), (18, 11)], "#4b95da")
    for points in [
        [(16, 10), (16, 12)], [(16, 22), (16, 24)],
        [(8, 17), (10, 17)], [(22, 17), (24, 17)],
        [(10, 12), (11, 13)], [(21, 12), (20, 13)],
        [(10, 22), (11, 21)], [(21, 22), (20, 21)]
    ]:
        line(d, points, GOLD_LIGHT)
    polygon(d, [(20, 10), (18, 17), (12, 24),
                (14, 17)], GOLD_LIGHT)
    polygon(d, [(20, 10), (18, 17), (16, 16)], ICE, None)
    polygon(d, [(14, 18), (16, 19), (12, 24)], GOLD_SHADOW, None)
    polygon(d, [(21, 7), (16, 15), (20, 14),
                (14, 23), (16, 17), (13, 18)], CYAN)
    line(d, [(20, 9), (16, 15), (18, 15), (15, 20)], ICE)
    d.rectangle((15, 16, 17, 18), fill=GOLD_WHITE)
    d.point((17, 18), fill=GOLD_SHADOW)
    line(d, [(2, 8), (5, 7), (7, 8)], CYAN)
    line(d, [(25, 28), (28, 27), (30, 24)], CYAN)
    sparkle(d, 28, 9, GOLD_WHITE)
    d.point((2, 24), fill=CYAN)
    return image


def citadel_heart():
    image, d = canvas()
    polygon(d, [
        (3, 10), (7, 13), (10, 11), (15, 14), (21, 11),
        (25, 13), (29, 10), (28, 19), (25, 23), (20, 24),
        (16, 29), (11, 25), (6, 23), (3, 18)
    ], GOLD_DARK)
    polygon(d, [(4, 12), (8, 15), (12, 14), (14, 22),
                (9, 23), (5, 19)], GOLD, None)
    polygon(d, [(28, 12), (24, 15), (20, 14), (18, 22),
                (23, 23), (27, 19)], GOLD, None)
    line(d, [(5, 14), (8, 17), (11, 16)], GOLD_WHITE)
    line(d, [(4, 18), (8, 20), (11, 19)], GOLD_LIGHT)
    line(d, [(27, 14), (24, 17), (21, 16)], GOLD_WHITE)
    line(d, [(28, 18), (24, 20), (21, 19)], GOLD_LIGHT)
    polygon(d, [
        (8, 9), (11, 5), (15, 5), (17, 8), (20, 5),
        (24, 6), (26, 10), (25, 16), (21, 21),
        (16, 26), (10, 20), (7, 14)
    ], GREEN_DARK)
    polygon(d, [(8, 10), (12, 6), (15, 6), (17, 10),
                (20, 6), (24, 8), (24, 14), (17, 17)], GREEN, None)
    polygon(d, [(8, 10), (12, 7), (14, 7), (12, 13),
                (8, 14)], GREEN_LIGHT, None)
    polygon(d, [(12, 13), (17, 10), (20, 7), (22, 11),
                (17, 17)], "#3edc9b", None)
    polygon(d, [(8, 14), (12, 13), (17, 17), (16, 24),
                (11, 19)], "#16836c", None)
    polygon(d, [(17, 17), (24, 14), (20, 20), (16, 24)], "#10594e", None)
    line(d, [(10, 9), (12, 7), (14, 7)], "#d8ffe4")
    line(d, [(20, 7), (22, 8)], "#b8ffd7")
    line(d, [(12, 13), (17, 17), (16, 23)], "#72e8a5")
    polygon(d, [(16, 9), (21, 14), (16, 21), (12, 15)], GOLD_LIGHT)
    polygon(d, [(16, 11), (19, 14), (16, 19), (14, 15)], RED_DARK)
    polygon(d, [(16, 12), (18, 14), (16, 17), (15, 14)], RED, None)
    line(d, [(16, 12), (15, 14)], "#ffb3a0")
    polygon(d, [(11, 23), (16, 26), (21, 23),
                (20, 26), (16, 29), (12, 26)], GOLD)
    d.point((16, 27), fill=GOLD_WHITE)
    sparkle(d, 5, 6, GOLD_WHITE)
    sparkle(d, 28, 25, GREEN_LIGHT)
    return image


def golden_dice():
    image, d = canvas()
    polygon(d, [
        (5, 9), (19, 4), (28, 11), (27, 23),
        (13, 29), (4, 21)
    ], GOLD_DARK)
    polygon(d, [(5, 10), (19, 5), (27, 11), (13, 17)], GOLD_LIGHT)
    polygon(d, [(5, 11), (13, 17), (13, 28), (5, 21)], GOLD)
    polygon(d, [(13, 17), (27, 11), (26, 23), (13, 28)], GOLD_SHADOW)
    polygon(d, [(7, 10), (18, 6), (24, 10), (13, 14)], "#ffe893", None)
    polygon(d, [(6, 13), (11, 17), (11, 25), (6, 20)], "#ffc955", None)
    polygon(d, [(15, 18), (25, 14), (24, 22), (15, 26)], "#d59032", None)
    line(d, [(6, 10), (19, 5), (25, 10)], GOLD_WHITE)
    line(d, [(6, 12), (12, 17), (12, 26)], GOLD_LIGHT)
    line(d, [(14, 18), (25, 13)], GOLD_LIGHT)
    line(d, [(15, 27), (25, 23)], "#9d6027")

    def top_pip(x, y):
        polygon(d, [(x, y - 1), (x + 2, y), (x, y + 1), (x - 2, y)], RED_DARK)
        d.point((x, y - 1), fill=RED_LIGHT)
        d.point((x, y), fill=RED)

    def side_pip(x, y):
        polygon(d, [(x, y - 1), (x + 1, y), (x + 1, y + 1),
                    (x, y + 2), (x - 1, y + 1), (x - 1, y)], RED_DARK)
        d.point((x, y), fill=RED_LIGHT)
        d.point((x, y + 1), fill=RED)

    top_pip(11, 10)
    top_pip(17, 8)
    top_pip(16, 12)
    side_pip(8, 17)
    side_pip(10, 23)
    side_pip(17, 19)
    side_pip(23, 16)
    side_pip(17, 24)
    side_pip(23, 21)
    sparkle(d, 4, 6, GOLD_WHITE, True)
    sparkle(d, 28, 26, GOLD_WHITE)
    d.point((25, 3), fill=GOLD_LIGHT)
    d.point((2, 25), fill=GOLD_LIGHT)
    return image


def sovereign_crown():
    image, d = canvas()
    polygon(d, [
        (5, 15), (6, 10), (10, 7), (15, 7),
        (19, 7), (25, 11), (27, 16), (25, 23),
        (7, 23)
    ], RED_DARK)
    polygon(d, [(7, 13), (10, 9), (15, 8), (20, 9),
                (24, 12), (25, 20), (8, 20)], RED, None)
    polygon(d, [(10, 10), (14, 9), (13, 19), (9, 19)], "#f05b62", None)
    polygon(d, [(17, 9), (20, 10), (23, 14), (22, 19),
                (18, 19)], "#a92848", None)
    polygon(d, [
        (3, 9), (8, 14), (10, 6), (15, 13), (17, 3),
        (21, 13), (27, 7), (26, 16), (30, 12),
        (27, 25), (23, 28), (8, 28), (4, 25)
    ], GOLD_DARK)
    polygon(d, [
        (4, 11), (8, 16), (10, 9), (15, 16), (17, 6),
        (21, 16), (26, 10), (24, 19), (28, 15),
        (25, 24), (7, 24)
    ], GOLD, None)
    polygon(d, [(5, 13), (8, 18), (10, 12), (12, 16),
                (10, 21), (7, 21)], GOLD_LIGHT, None)
    polygon(d, [(15, 17), (17, 7), (19, 17), (17, 21)], GOLD_LIGHT, None)
    line(d, [(17, 7), (16, 16)], GOLD_WHITE)
    line(d, [(10, 10), (9, 16)], GOLD_WHITE)
    line(d, [(25, 11), (22, 16)], GOLD_WHITE)
    polygon(d, [(6, 21), (25, 21), (26, 25),
                (22, 27), (9, 27), (5, 25)], GOLD)
    line(d, [(7, 22), (24, 22)], GOLD_WHITE)
    line(d, [(8, 26), (23, 26)], GOLD_SHADOW)
    polygon(d, [(16, 17), (20, 21), (17, 26), (13, 22)], GOLD_DARK)
    polygon(d, [(16, 18), (19, 21), (17, 24), (14, 22)], BLUE_DARK)
    polygon(d, [(16, 19), (18, 21), (16, 23), (15, 21)], BLUE, None)
    line(d, [(16, 19), (15, 21)], ICE)
    polygon(d, [(9, 22), (11, 24), (9, 25), (7, 24)], GREEN_DARK)
    line(d, [(9, 23), (10, 24)], GREEN_LIGHT)
    polygon(d, [(23, 22), (25, 23), (23, 25), (21, 24)], GREEN_DARK)
    line(d, [(23, 23), (22, 24)], GREEN_LIGHT)
    d.rectangle((16, 2, 18, 4), fill=OUTLINE)
    d.point((17, 2), fill=GOLD_WHITE)
    d.point((17, 3), fill=GOLD_LIGHT)
    d.point((10, 7), fill=GOLD_WHITE)
    d.point((27, 8), fill=GOLD_WHITE)
    sparkle(d, 5, 5, GOLD_WHITE)
    sparkle(d, 28, 4, GOLD_WHITE)
    sparkle(d, 29, 27, GOLD_WHITE)
    return image


def create_sheet():
    sheet = Image.new("RGBA", (192, 32), (0, 0, 0, 0))
    artists = [
        phoenix_plume,
        frost_seal,
        storm_compass,
        citadel_heart,
        golden_dice,
        sovereign_crown,
    ]
    for column, artist in enumerate(artists):
        sheet.paste(artist(), (column * CELL, 0))
    return sheet


if __name__ == "__main__":
    sheet = create_sheet()
    assert sheet.mode == "RGBA", "Sheet must use RGBA."
    assert sheet.size == (192, 32), "Sheet must be exactly 192x32."
    assert set(sheet.getchannel("A").getdata()) == {0, 255}, \
        "Alpha must contain only transparent and fully opaque pixels."
    for column in range(6):
        cell = sheet.crop((column * CELL, 0, (column + 1) * CELL, CELL))
        assert cell.getchannel("A").getbbox() is not None, \
            f"Cell {column} is empty."

    destination = Path("public/assets/ui")
    destination.mkdir(parents=True, exist_ok=True)
    output = destination / "relics-sheet.png"
    sheet.save(output, format="PNG", optimize=True)

    with Image.open(output) as saved:
        assert saved.format == "PNG"
        assert saved.mode == "RGBA"
        assert saved.size == (192, 32)
        assert set(saved.getchannel("A").getdata()) == {0, 255}
        for column in range(6):
            assert saved.crop(
                (column * CELL, 0, (column + 1) * CELL, CELL)
            ).getchannel("A").getbbox() is not None