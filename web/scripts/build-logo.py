"""
Builds the two wordmark files from logo.png at the repository root.

The artwork is printed on a paper card, and neither keeping it nor cutting it off works
everywhere: over the map the cut-out emblem's own shadow reads as a dirty edge, and over
the header's cream pill the card reads as a box. So there are two.

    logo-saltopia.png       the card, shaped to the emblem, dissolving to transparent
    logo-saltopia-flat.png  the emblem alone, for the cream header and the dark footer

Run with: python3 scripts/build-logo.py
"""

import colorsys
import shutil
import statistics
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "logo.png"
PUBLIC = ROOT / "web" / "public"

# How much room the card is given to dissolve into, in source pixels.
PAD = 150

# A small patch of the mask lying well clear of the emblem is not emblem. The card has a
# fleuron in each corner; the crop cuts the frame but keeps their tips, and being saturated
# they pass the paper test - four marks round the wordmark on the title screen, reported
# by the owner on 2026-09-28. Measured on the reduced masks, every such tip sits more than
# 14px from the emblem and every real piece of it - the banner's letters are islands too -
# within 10px.
MIN_ISLAND_SHARE = 0.005
STRAY_DISTANCE = 14


def drop_islands(mask):
    """Remove small regions standing apart from the emblem, found by a breadth-first fill.

    Pure Python on purpose: the machine that builds the logo has Pillow and no numpy, and
    the masks this runs on are reduced to a few hundred thousand pixels.
    """
    width, height = mask.size
    pixels = mask.load()
    label = [[0] * width for _ in range(height)]
    regions = [[]]
    for start_y in range(height):
        for start_x in range(width):
            if pixels[start_x, start_y] == 0 or label[start_y][start_x]:
                continue
            region = len(regions)
            points = []
            queue = deque([(start_x, start_y)])
            label[start_y][start_x] = region
            while queue:
                x, y = queue.popleft()
                points.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] and not label[ny][nx]:
                        label[ny][nx] = region
                        queue.append((nx, ny))
            regions.append(points)

    emblem = max(regions, key=len)
    body = Image.new("L", mask.size, 0)
    body_pixels = body.load()
    for x, y in emblem:
        body_pixels[x, y] = 255
    near = body.filter(ImageFilter.MaxFilter(STRAY_DISTANCE * 2 + 1)).load()

    out = mask.copy()
    result = out.load()
    for points in regions[1:]:
        small = len(points) < len(emblem) * MIN_ISLAND_SHARE
        if small and not any(near[x, y] for x, y in points):
            for x, y in points:
                result[x, y] = 0
    return out


def emblem_mask(image):
    """Where the artwork is, as opposed to the paper it is printed on.

    Connectivity finds the sheet - a colour key cannot tell the paper from the cream
    inside the banner - and a saturation test then takes the torn edge and the shadow
    the emblem casts on it, which a brightness test misses.
    """
    width, height = image.size
    marker = (255, 0, 255)
    work = image.copy()
    for x in range(0, width, 2):
        ImageDraw.floodfill(work, (x, 0), marker, thresh=58)
        ImageDraw.floodfill(work, (x, height - 1), marker, thresh=58)
    for y in range(0, height, 2):
        ImageDraw.floodfill(work, (0, y), marker, thresh=58)
        ImageDraw.floodfill(work, (width - 1, y), marker, thresh=58)

    mask = Image.new("L", (width, height), 255)
    pixels, painted, out = image.load(), work.load(), mask.load()
    for y in range(height):
        for x in range(width):
            if painted[x, y] == marker:
                out[x, y] = 0
                continue
            red, green, blue = (channel / 255 for channel in pixels[x, y])
            if colorsys.rgb_to_hsv(red, green, blue)[1] < 0.22:
                out[x, y] = 0
    return drop_islands(mask)


def paper_colour(image):
    """The sheet's colour, as the median of the border: a corner still holds the frame."""
    pixels = image.load()
    width, height = image.size
    samples = [pixels[x, y] for x in range(0, width, 7) for y in (0, height - 1)]
    samples += [pixels[x, y] for y in range(0, height, 7) for x in (0, width - 1)]
    return tuple(int(statistics.median(sample[index] for sample in samples)) for index in range(3))


def cropped_artwork():
    source = Image.open(SOURCE).convert("RGB")
    width, height = source.size
    return source.crop((int(width * 0.030), int(height * 0.045), int(width * 0.970), int(height * 0.955)))


def build_card(crop):
    """The emblem on its paper, the paper shaped to the emblem and faded out."""
    card = Image.new("RGB", (crop.width + PAD * 2, crop.height + PAD * 2), paper_colour(crop))
    card.paste(crop, (PAD, PAD))

    small = card.resize((card.width // 3, card.height // 3), Image.LANCZOS)
    emblem = emblem_mask(small)

    # Grow a little, fade a lot: that proportion is what makes the card read as a halo
    # around the emblem rather than as a rectangle.
    plate = emblem
    for _ in range(3):
        plate = plate.filter(ImageFilter.MaxFilter(7))
    plate = plate.filter(ImageFilter.GaussianBlur(26))
    plate = ImageChops.lighter(plate, emblem.filter(ImageFilter.MaxFilter(5)))
    # The halo is only there to lift the emblem off the map, so it is kept faint: a
    # gamma pulls the midtones down and leaves what is already opaque alone.
    plate = plate.point(lambda value: int(255 * (value / 255) ** 2.6))
    plate = ImageChops.lighter(plate, emblem.filter(ImageFilter.MaxFilter(3)))

    alpha = plate.resize(card.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))
    out = card.convert("RGBA")
    out.putalpha(alpha)
    return out.crop(out.getbbox())


def build_flat(crop):
    """The emblem alone, for backgrounds that are already a flat colour."""
    small = crop.resize((crop.width // 2, crop.height // 2), Image.LANCZOS)
    mask = emblem_mask(small)
    alpha = mask.resize(crop.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.1))
    out = crop.convert("RGBA")
    out.putalpha(alpha)
    return out.crop(out.getbbox())


def save(image, name, longest):
    image.thumbnail((longest, longest), Image.LANCZOS)
    image.quantize(colors=250, method=Image.FASTOCTREE).save(PUBLIC / name, optimize=True)
    print(f"{name}: {image.size[0]}x{image.size[1]}")


# Where Next keeps its optimised copies, keyed by URL rather than by file: a rebuilt logo
# at the same path is not seen until they go. Only these two names are ever removed.
IMAGE_CACHES = (ROOT / "web" / ".next" / "dev" / "cache" / "images", ROOT / "web" / ".next" / "cache" / "images")


def drop_image_cache():
    for cache in IMAGE_CACHES:
        if cache.is_dir() and cache.name == "images":
            shutil.rmtree(cache)


def main():
    crop = cropped_artwork()
    save(build_card(crop), "logo-saltopia.png", 1000)
    save(build_flat(crop), "logo-saltopia-flat.png", 900)
    drop_image_cache()


if __name__ == "__main__":
    main()
