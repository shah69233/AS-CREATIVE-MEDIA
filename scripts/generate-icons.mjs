import fs from 'fs';
import zlib from 'zlib';

function createSolidPng(width, height, r, g, b) {
  function crc32(buf) {
    let table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type);
    const body = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
  }

  // PNG Header
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: 2 (truecolor RGB)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image data: filter byte (0) + width * 3 bytes per scanline
  const rowLen = 1 + width * 3;
  const rawData = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowLen;
    rawData[rowStart] = 0; // No filter
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      // Indigo theme #4f46e5 with slight gradient
      const factor = (x + y) / (width + height);
      rawData[px] = Math.round(r * (0.8 + 0.3 * factor));
      rawData[px + 1] = Math.round(g * (0.8 + 0.3 * factor));
      rawData[px + 2] = Math.round(b * (0.8 + 0.3 * factor));
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = chunk('IDAT', idatData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, chunk('IHDR', ihdr), idatChunk, iendChunk]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createSolidPng(192, 192, 79, 70, 229));
fs.writeFileSync('./public/pwa-512x512.png', createSolidPng(512, 512, 79, 70, 229));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createSolidPng(512, 512, 55, 48, 163));
fs.writeFileSync('./public/apple-touch-icon.png', createSolidPng(180, 180, 79, 70, 229));
console.log('Generated compliant PNG icons in ./public');
