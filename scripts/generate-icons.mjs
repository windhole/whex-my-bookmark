import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../src/icons");

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(rgba, width, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const i = (y * width + x) * 4;
  rgba[i] = r;
  rgba[i + 1] = g;
  rgba[i + 2] = b;
  rgba[i + 3] = a;
}

function fillCircle(rgba, size, cx, cy, radius, r, g, b) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= cy + radius; y += 1) {
    for (let x = Math.floor(cx - radius); x <= cx + radius; x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) setPixel(rgba, size, x, y, r, g, b);
    }
  }
}

function roundedRect(rgba, size, r, g, b) {
  const radius = size * 0.22;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const inX = x >= radius && x < size - radius;
      const inY = y >= radius && y < size - radius;
      const corners = [
        [radius, radius],
        [size - radius, radius],
        [radius, size - radius],
        [size - radius, size - radius],
      ];
      let inside = inX || inY;
      if (!inside) {
        inside = corners.some(([cx, cy]) => {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          return dx * dx + dy * dy <= radius * radius;
        });
      }
      if (inside) setPixel(rgba, size, x, y, r, g, b);
    }
  }
}

function bookmark(rgba, size) {
  const left = Math.round(size * 0.3);
  const right = Math.round(size * 0.7);
  const top = Math.round(size * 0.18);
  const bottom = Math.round(size * 0.86);
  const notch = Math.round(size * 0.58);
  const cx = (left + right) / 2;
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if (y >= notch) {
        const t = (y - notch) / (bottom - notch);
        const cut = t * ((right - left) / 2);
        if (x > cx - cut && x < cx + cut) continue;
      }
      setPixel(rgba, size, x, y, 255, 255, 255);
    }
  }
}

function makeIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  roundedRect(rgba, size, 0, 114, 178);
  fillCircle(rgba, size, size / 2, size / 2, 0, 0, 114, 178);
  bookmark(rgba, size);
  return encodePng(size, size, rgba);
}

mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(outDir, `icon${size}.png`), makeIcon(size));
}
