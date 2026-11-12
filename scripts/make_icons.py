"""Write the PWA icons (blue square, gold puck) with the standard library only."""
import struct
import sys
import zlib
from pathlib import Path

BLUE, GOLD, WHITE = (11, 61, 145), (212, 160, 23), (255, 255, 255)


def png(size: int) -> bytes:
    rows = []
    c, r_out, r_in = size / 2, size * 0.32, size * 0.2
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            d = ((x - c) ** 2 + (y - c) ** 2) ** 0.5
            colour = WHITE if d < r_in else GOLD if d < r_out else BLUE
            row += bytes(colour)
        rows.append(bytes(row))
    raw = zlib.compress(b"".join(rows), 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")


if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "app/public/icons")
    out.mkdir(parents=True, exist_ok=True)
    for s in (192, 512):
        (out / f"icon-{s}.png").write_bytes(png(s))
