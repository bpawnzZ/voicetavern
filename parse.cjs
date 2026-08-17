const fs = require('fs');
const file = process.argv[2];
const buffer = fs.readFileSync(file);
const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
let offset = 8;
while (offset < dataView.byteLength) {
  const length = dataView.getUint32(offset);
  const type = String.fromCharCode(
    dataView.getUint8(offset + 4),
    dataView.getUint8(offset + 5),
    dataView.getUint8(offset + 6),
    dataView.getUint8(offset + 7)
  );
  if (type === 'tEXt') {
    const chunkData = new Uint8Array(buffer.buffer, buffer.byteOffset + offset + 8, length);
    const textDecoder = new TextDecoder('iso-8859-1');
    const text = textDecoder.decode(chunkData);
    const nullIdx = text.indexOf('\0');
    if (nullIdx !== -1) {
      const keyword = text.substring(0, nullIdx);
      if (keyword === 'chara') {
        const charaBase64 = text.substring(nullIdx + 1);
        const decoded = Buffer.from(charaBase64, 'base64').toString('utf8');
        console.log(decoded);
        process.exit(0);
      }
    }
  }
  offset += 12 + length;
}
console.log('No chara chunk found');
