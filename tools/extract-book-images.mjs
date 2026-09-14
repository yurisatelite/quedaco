#!/usr/bin/env node
// Extrai as imagens embutidas de um PDF (sem dependências) para .local/imagens-mesa/_extraidas/
// Uso:  node tools/extract-book-images.mjs ["E:/RPG/Skyfall RPG - Livro Básico DIGITAL 1.25.pdf"]
//
// NÃO comita nada disso. A saída vai para .local/ (que está no .gitignore).
// Depois: olhe o RELATORIO.md, renomeie as boas para regioes/<id>.jpg, locais/<id>.jpg,
// monstros/<slug>.jpg, itens/<slug>.jpg, quests/<slug>.jpg e suba a pasta para o
// armazenamento da mesa (a mesma de quedaco.assetRoot).

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';
import { local } from './raiz.mjs';

const PDF = process.argv[2] || 'E:/RPG/Skyfall RPG - Livro Básico DIGITAL 1.25.pdf';
const OUT = local('imagens-mesa');
const DUMP = join(OUT, '_extraidas');

/* ---------- PNG mínimo (8 bits, cinza/RGB/RGBA) ---------- */
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
})();
function chunk(type, data) {
  const t = Buffer.from(type, 'latin1');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(width, height, channels, raw) {
  const colorType = channels === 1 ? 0 : channels === 2 ? 4 : channels === 3 ? 2 : 6;
  const stride = width * channels;
  const filtered = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0; // filtro None
    raw.copy(filtered, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = colorType; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(filtered, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- desfaz o preditor PNG do FlateDecode (Predictor >= 10) ---------- */
function unpredict(data, columns, colors, bpc) {
  const bpp = Math.max(1, Math.ceil((colors * bpc) / 8));
  const rowLen = Math.ceil((columns * colors * bpc) / 8);
  const out = Buffer.alloc(rowLen * Math.floor(data.length / (rowLen + 1)));
  let ip = 0, op = 0, prev = Buffer.alloc(rowLen);
  while (ip + 1 + rowLen <= data.length) {
    const ft = data[ip++];
    const row = Buffer.from(data.subarray(ip, ip + rowLen)); ip += rowLen;
    for (let i = 0; i < rowLen; i++) {
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = row[i];
      if (ft === 1) v = (v + a) & 0xff;
      else if (ft === 2) v = (v + b) & 0xff;
      else if (ft === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (ft === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff; }
      row[i] = v;
    }
    row.copy(out, op); op += rowLen; prev = row;
  }
  return out.subarray(0, op);
}

/* ---------- varredura do PDF ---------- */
const bytes = readFileSync(PDF);
const s = bytes.toString('latin1');
rmSync(DUMP, { recursive: true, force: true });
for (const d of ['', '_extraidas', 'regioes', 'locais', 'npcs', 'monstros', 'itens', 'quests']) mkdirSync(join(OUT, d), { recursive: true });

const num = (dict, key) => { const m = dict.match(new RegExp('/' + key + '\\s+(\\d+)')); return m ? parseInt(m[1], 10) : null; };
const report = [];
let idx = 0, streamRe = /stream\r?\n/g, m;

while ((m = streamRe.exec(s))) {
  const dictStart = s.lastIndexOf('<<', m.index);
  if (dictStart < 0) continue;
  const dict = s.slice(dictStart, m.index);
  if (!/\/Subtype\s*\/Image/.test(dict)) continue;

  const dataStart = m.index + m[0].length;
  let dataEnd = s.indexOf('endstream', dataStart);
  if (dataEnd < 0) continue;
  let raw = bytes.subarray(dataStart, dataEnd);
  while (raw.length && (raw[raw.length - 1] === 0x0a || raw[raw.length - 1] === 0x0d)) raw = raw.subarray(0, raw.length - 1);

  const W = num(dict, 'Width'), H = num(dict, 'Height'), bpc = num(dict, 'BitsPerComponent') || 8;
  const filter = (dict.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/) || [])[1] || '';
  const cs = (dict.match(/\/ColorSpace\s*(\[[^\]]*\]|\/\w+)/) || [])[1] || '';
  idx++;
  const tag = String(idx).padStart(4, '0');
  const label = `${tag} ${W || '?'}x${H || '?'} ${filter.replace(/[[\]/]/g, '').trim() || 'raw'}`;

  try {
    if (/DCTDecode/.test(filter)) {
      let jpg = raw;
      const soi = jpg.indexOf(Buffer.from([0xff, 0xd8]));
      if (soi > 0) jpg = jpg.subarray(soi);
      writeFileSync(join(DUMP, `img-${tag}-${W}x${H}.jpg`), jpg);
      report.push(`- **img-${tag}** · ${W}x${H} · JPEG · ${(jpg.length / 1024 | 0)} KB`);
    } else if (/JPXDecode/.test(filter)) {
      writeFileSync(join(DUMP, `img-${tag}-${W}x${H}.jp2`), raw);
      report.push(`- img-${tag} · ${W}x${H} · JPEG2000 (.jp2 — abra e reexporte) · ${(raw.length / 1024 | 0)} KB`);
    } else if (/FlateDecode/.test(filter) && W && H) {
      let data = zlib.inflateSync(raw);
      const pm = dict.match(/\/DecodeParms\s*<<([^>]*)>>/);
      let colors = 1;
      if (/DeviceRGB|ICCBased\s+\d/.test(cs) || (pm && /\/Colors\s+3/.test(pm[1]))) colors = 3;
      if (/DeviceCMYK/.test(cs) || (pm && /\/Colors\s+4/.test(pm[1]))) colors = 4;
      if (pm && /\/Predictor\s+1[0-5]/.test(pm[1])) data = unpredict(data, num({ toString: () => pm[1] }.toString(), 'Columns') || W, colors, bpc);
      if (bpc !== 8) throw new Error(`bpc ${bpc} não suportado`);
      const per = data.length / (W * H);
      if (per >= 3.99) { // RGBA ou CMYK
        if (colors === 4 && /DeviceCMYK/.test(cs)) {
          const rgb = Buffer.alloc(W * H * 3);
          for (let i = 0, j = 0; i < W * H * 4; i += 4, j += 3) {
            const k = data[i + 3];
            rgb[j] = 255 - Math.min(255, data[i] + k);
            rgb[j + 1] = 255 - Math.min(255, data[i + 1] + k);
            rgb[j + 2] = 255 - Math.min(255, data[i + 2] + k);
          }
          writeFileSync(join(DUMP, `img-${tag}-${W}x${H}.png`), encodePng(W, H, 3, rgb));
        } else writeFileSync(join(DUMP, `img-${tag}-${W}x${H}.png`), encodePng(W, H, 4, data.subarray(0, W * H * 4)));
      } else if (per >= 2.99) writeFileSync(join(DUMP, `img-${tag}-${W}x${H}.png`), encodePng(W, H, 3, data.subarray(0, W * H * 3)));
      else if (per >= 0.99) writeFileSync(join(DUMP, `img-${tag}-${W}x${H}.png`), encodePng(W, H, 1, data.subarray(0, W * H)));
      else throw new Error(`bytes ${data.length} não batem com ${W}x${H}`);
      report.push(`- **img-${tag}** · ${W}x${H} · PNG (de FlateDecode) · ${colors} canal(is)`);
    } else {
      writeFileSync(join(DUMP, `img-${tag}-${W || 'x'}x${H || 'x'}.bin`), raw);
      report.push(`- img-${tag} · ${W}x${H} · ${filter || 'sem filtro'} (não convertido — .bin) · ${(raw.length / 1024 | 0)} KB`);
    }
  } catch (err) {
    writeFileSync(join(DUMP, `img-${tag}-ERRO.bin`), raw);
    report.push(`- img-${tag} · ${W}x${H} · ${filter} · ERRO: ${err.message}`);
  }
}

writeFileSync(join(OUT, 'RELATORIO.md'),
  `# Imagens extraídas de ${PDF}\n\n${idx} imagens em \`.local/imagens-mesa/_extraidas/\`.\n\n` +
  `Renomeie as boas para \`regioes/<id>.jpg\`, \`locais/<id>.jpg\`, \`monstros/<slug>.jpg\`, ` +
  `\`itens/<slug>.jpg\`, \`quests/<slug>.jpg\` e suba a pasta \`imagens-mesa\` (sem \`_extraidas\`) ` +
  `para o armazenamento da mesa (o mesmo caminho de \`quedaco.assetRoot\`).\n\n` +
  `IDs em src/book-world.mjs (REGIONS[].id / PLACES[].id).\n\n## Lista\n\n` +
  report.join('\n') + '\n');

console.log(`Pronto: ${idx} imagens em ${DUMP}`);
console.log(`Relatório: ${join(OUT, 'RELATORIO.md')}`);
