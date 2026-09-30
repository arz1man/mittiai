// Generates a realistic 640x480 "leaf photo" JPEG for end-to-end diagnosis testing.
import { writeFileSync } from "fs";

const W = 640, H = 480;
// Raw RGB buffer
const px = Buffer.alloc(W * H * 3);

function set(x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = r; px[i + 1] = g; px[i + 2] = b;
}

// soil-brown background with noise
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const n = Math.random() * 24;
    set(x, y, 150 + n, 128 + n, 96 + n);
  }
}

// leaf body (ellipse-ish, green gradient)
function inLeaf(x, y) {
  const dx = (x - 320) / 250, dy = (y - 240) / 150;
  return dx * dx + dy * dy <= 1;
}
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (inLeaf(x, y)) {
      const t = (x - 70) / 500;
      const n = Math.random() * 14;
      set(x, y, 40 + 30 * t + n, 110 + 60 * (1 - t) + n, 45 + n);
    }
  }
}

// midrib + veins (darker green)
for (let x = 80; x < 570; x++) {
  const y = 240 + Math.sin(x / 90) * 6;
  for (let t = -3; t <= 3; t++) set(x, Math.round(y + t), 30, 80, 32);
}
for (let i = 0; i < 10; i++) {
  const x0 = 110 + i * 46;
  for (let s = 0; s < 60; s++) {
    set(Math.round(x0 + s * 0.6), Math.round(240 - s * 0.9), 34, 88, 36);
    set(Math.round(x0 + s * 0.6), Math.round(240 + s * 0.9), 34, 88, 36);
  }
}

// late-blight lesions: irregular brown patches with pale halos
function lesion(cx, cy, r) {
  for (let y = cy - r * 2; y <= cy + r * 2; y++) {
    for (let x = cx - r * 2; x <= cx + r * 2; x++) {
      const d = Math.hypot(x - cx, y - cy) / r;
      const wobble = 1 + Math.sin(Math.atan2(y - cy, x - cx) * 3.7) * 0.25;
      if (!inLeaf(x, y)) continue;
      if (d < 0.65 * wobble) set(x, y, 62 + Math.random() * 18, 44, 30);       // dark brown core
      else if (d < 1.1 * wobble) set(x, y, 168 + Math.random() * 20, 160, 120); // pale chlorotic halo
    }
  }
}
lesion(250, 180, 34);
lesion(390, 260, 42);
lesion(310, 330, 26);
lesion(460, 170, 22);

// grain
for (let i = 0; i < 4000; i++) {
  const x = Math.random() * W, y = Math.random() * H;
  set(x, y, 0, 0, 0); // will render as darkened speckle mix
}

// minimal baseline JPEG encoder (single 8x8 block grid, quality ~70)
// To keep this dependency-free, we write a PPM and rely on no external tools —
// but browsers/OS APIs can't read PPM. So instead: emit BMP (universally accepted
// by Gemini vision and trivially encodable losslessly).
function bmp() {
  const rowSize = Math.floor((W * 3 + 3) / 4) * 4;
  const dataSize = rowSize * H;
  const fileSize = 54 + dataSize;
  const buf = Buffer.alloc(fileSize);
  buf.write("BM", 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(W, 18);
  buf.writeInt32LE(H, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(dataSize, 34);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const si = (y * W + x) * 3;
      const di = 54 + ((H - 1 - y) * rowSize) + x * 3; // BMP is bottom-up, BGR
      buf[di] = px[si + 2];
      buf[di + 1] = px[si + 1];
      buf[di + 2] = px[si];
    }
  }
  return buf;
}

writeFileSync("scripts/test-leaf.bmp", bmp());
console.log("wrote scripts/test-leaf.bmp (" + fileSize(bmp()) + " bytes)");

function fileSize(b) { return b.length; }
