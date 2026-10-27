// Minimal RIFF/WAVE parser: proves a file is uncompressed PCM and reads its true properties.
export function parseWav(buf: Buffer) {
  if (buf.length < 44 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE')
    throw new Error('Not a RIFF/WAVE file');
  let off = 12;
  let fmt: { format: number; channels: number; sampleRate: number; bits: number } | null = null;
  let dataBytes = 0;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') {
      fmt = {
        format: buf.readUInt16LE(off + 8),
        channels: buf.readUInt16LE(off + 10),
        sampleRate: buf.readUInt32LE(off + 12),
        bits: buf.readUInt16LE(off + 22),
      };
    } else if (id === 'data') {
      dataBytes = Math.min(size, buf.length - off - 8);
      break;
    }
    off += 8 + size + (size % 2);
  }
  if (!fmt || !dataBytes) throw new Error('Missing fmt or data chunk');
  const durationS = dataBytes / (fmt.sampleRate * fmt.channels * (fmt.bits / 8));
  return { ...fmt, durationS };
}
