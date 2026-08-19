from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/home/ubuntu/webdev-static-assets/bridgex-logo.png")
WEB_PUBLIC = ROOT / "apps/web/client/public"
MOBILE_ASSETS = ROOT / "apps/mobile/assets"

IVORY = (247, 245, 239, 255)


def scaled_logo(size: int) -> Image.Image:
    source = Image.open(SOURCE).convert("RGBA")
    source.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    left = (size - source.width) // 2
    top = (size - source.height) // 2
    canvas.alpha_composite(source, (left, top))
    return canvas


def centered_logo(canvas_size: int, logo_size: int) -> Image.Image:
    logo = scaled_logo(logo_size)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset = (canvas_size - logo_size) // 2
    canvas.alpha_composite(logo, (offset, offset))
    return canvas


WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
MOBILE_ASSETS.mkdir(parents=True, exist_ok=True)

# Same-origin 160px WebP keeps the shared header mark lightweight while preserving the full supplied artwork.
scaled_logo(160).save(WEB_PUBLIC / "bridgex-logo.webp", "WEBP", quality=82, method=6)

# Legacy Android launcher icon: ivory canvas with a safely inset original BridgeX artwork.
legacy = Image.new("RGBA", (512, 512), IVORY)
legacy.alpha_composite(centered_logo(512, 432))
legacy.convert("RGB").save(MOBILE_ASSETS / "icon.png", "PNG", optimize=True)

# Adaptive icon foreground has ample transparent safe-zone padding; Android supplies the ivory background color.
foreground = centered_logo(432, 288)
foreground.save(MOBILE_ASSETS / "android-icon-foreground.png", "PNG", optimize=True)
Image.new("RGB", (432, 432), IVORY[:3]).save(MOBILE_ASSETS / "android-icon-background.png", "PNG", optimize=True)

# Android 13 themed icon: preserve the BridgeX silhouette with a monochrome white mask.
mask = foreground.getchannel("A")
monochrome = Image.new("RGBA", (432, 432), (255, 255, 255, 0))
monochrome.putalpha(mask)
monochrome.save(MOBILE_ASSETS / "android-icon-monochrome.png", "PNG", optimize=True)

# Keep the mobile web favicon aligned with the new supplied mark.
scaled_logo(192).save(MOBILE_ASSETS / "favicon.png", "PNG", optimize=True)
