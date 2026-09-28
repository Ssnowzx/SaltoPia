"""Put back the edge the generator's upscale took out.

The image generator tops out at 1280x720 and 1152x864. The briefs ask for twice that, so
what lands in `public/images` is that native frame enlarged: the file is the right size for
the space it fills, but the detail is the smaller picture's, and a hero drawn across a
Retina window reads as a photograph taken on an old phone.

Enlarging cannot invent detail, but it does smear the edges that were there, and an unsharp
mask puts those back. Everything else on these pages is crisp - type, crests, the map - so
a soft photograph next to them looks like a mistake rather than a limit.

The settings are deliberately short of what the picture will take: past roughly 150% the
roofs and the shoreline grow pale outlines, which reads as processing rather than focus.

Running it twice would sharpen an already sharpened file, so each result is recorded by
digest and skipped on the next run. A replaced photograph has a new digest, so it is caught
without being told; `--force` sharpens everything again.

Whatever format the generator saves in, the pages look for `.webp`: a `.png`, `.jpg` or
`.jpeg` found in these folders is first re-encoded to WebP beside itself, and the original
is removed once the WebP is written and reads back as an image.

It finishes by emptying the dev server's image cache, which keys on the request URL and not
on the file behind it: without that, replacing a photograph in place changes nothing on
screen, however hard the page is refreshed.

    npm run images:sharpen [-- --force]
"""

from __future__ import annotations

import json
import shutil
import sys
from hashlib import sha1
from pathlib import Path

from PIL import Image, ImageFilter

WEB = Path(__file__).resolve().parent.parent
IMAGES = WEB / "public" / "images"
MANIFEST = WEB / "scripts" / ".sharpened.json"

# Where the photographs live. Galleries, menus and the contest page are included so a batch
# dropped in later is caught by the same pass.
FOLDERS = ("heroes", "experiences", "places", "menu", "contest")

# What the generator may hand back instead of WebP.
CONVERTIBLE = (".png", ".jpg", ".jpeg")

# Radius in pixels, strength as a percentage, and the difference a pixel needs before it is
# touched at all - the threshold is what keeps sky and water from turning grainy.
UNSHARP = {"radius": 2.4, "percent": 120, "threshold": 3}

QUALITY = 90

# Both places Next has kept its optimised copies. Only these two names are ever removed.
IMAGE_CACHES = (WEB / ".next" / "dev" / "cache" / "images", WEB / ".next" / "cache" / "images")


def drop_image_cache() -> int:
    """Empty the optimiser's cache so the new files are the ones served."""
    dropped = 0
    for cache in IMAGE_CACHES:
        if cache.is_dir() and cache.name == "images":
            dropped += len(list(cache.iterdir()))
            shutil.rmtree(cache)
    return dropped


def digest(path: Path) -> str:
    return sha1(path.read_bytes()).hexdigest()


def photographs() -> list[Path]:
    found: list[Path] = []
    for folder in FOLDERS:
        root = IMAGES / folder
        if root.is_dir():
            found.extend(sorted(root.rglob("*.webp")))
    return found


def convert_to_webp() -> int:
    """Re-encode any PNG or JPEG in the photograph folders as WebP, beside the original."""
    converted = 0
    for folder in FOLDERS:
        root = IMAGES / folder
        if not root.is_dir():
            continue
        for source in sorted(p for p in root.rglob("*") if p.suffix.lower() in CONVERTIBLE):
            target = source.with_suffix(".webp")
            with Image.open(source) as image:
                image.convert("RGB").save(target, "WEBP", quality=QUALITY, method=6)
            # Only once the WebP opens as an image is the original let go.
            with Image.open(target) as check:
                check.verify()
            source.unlink()
            converted += 1
            print(f"  converted {source.relative_to(IMAGES)} -> {target.name}")
    return converted


def main() -> None:
    converted = convert_to_webp()
    if converted:
        print(f"CONVERTED {converted} files to WebP")
    force = "--force" in sys.argv
    done: dict[str, str] = {} if force else json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}

    sharpened = 0
    skipped = 0
    for path in photographs():
        key = str(path.relative_to(IMAGES))
        if done.get(key) == digest(path):
            skipped += 1
            continue

        image = Image.open(path).convert("RGB")
        image.filter(ImageFilter.UnsharpMask(**UNSHARP)).save(path, "WEBP", quality=QUALITY, method=6)
        done[key] = digest(path)
        sharpened += 1
        print(f"  {key} {image.width}x{image.height}")

    MANIFEST.write_text(json.dumps(done, indent=2, sort_keys=True) + "\n")
    cached = drop_image_cache() if sharpened > 0 else 0
    print(f"SHARPENED {sharpened} photographs, {skipped} already done, {cached} stale copies dropped")


if __name__ == "__main__":
    main()
