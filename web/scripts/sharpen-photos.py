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

# Where the photographs live. Galleries are included so a batch dropped in later is caught
# by the same pass.
FOLDERS = ("heroes", "experiences", "places")

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


def main() -> None:
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
