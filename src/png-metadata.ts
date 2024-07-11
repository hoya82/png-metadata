export const PNG_SIG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export interface Chunk {
  size: number;
  type: string;
  data: Uint8Array;
  crc: number;
};

export class PngMetadata {
  private static textDecoder = new TextDecoder();
  private static textEncoder = new TextEncoder();

  static isPNG(data: ArrayBuffer | Uint8Array): boolean {
    const signature = new Uint8Array(data.slice(0, 8));
    return signature.every((byte, index) => byte === PNG_SIG[index]);
  }

  static splitChunks(data: ArrayBuffer | Uint8Array): Chunk[] {
    const view = new DataView(data instanceof ArrayBuffer ? data : data.buffer);
    let offset = PNG_SIG.length;
    const chunks: Chunk[] = [];

    while (offset < view.byteLength) {
      if(offset + 8 > view.byteLength) break;

      const size = view.getUint32(offset);
      offset += 4;

      const type = PngMetadata.textDecoder.decode(new Uint8Array(data.slice(offset, offset + 4)));
      offset += 4;

      if (offset + size + 4 > view.byteLength) break;

      const chunkData = new Uint8Array(data.slice(offset, offset + size));
      offset += size;

      const crc = view.getUint32(offset);
      offset += 4;

      chunks.push({ size, type, data: chunkData, crc });
    }

    return chunks;
  }

  static joinChunks(chunks: Chunk[]): ArrayBuffer {
    const totalSize = PNG_SIG.length + chunks.reduce((sum, chunk) => sum + 12 + chunk.size, 0);
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const uint8Array = new Uint8Array(buffer);

    uint8Array.set(PNG_SIG, 0);
    let offset = PNG_SIG.length;

    for (const chunk of chunks) {
      view.setUint32(offset, chunk.size);
      offset += 4;

      uint8Array.set(PngMetadata.textEncoder.encode(chunk.type), offset);
      offset += 4;

      uint8Array.set(chunk.data, offset);
      offset += chunk.size;

      view.setUint32(offset, chunk.crc);
      offset += 4;
    }

    return buffer;
  }

  static createChunk(type: string, data: Uint8Array): Chunk {
    const typeArray = PngMetadata.textEncoder.encode(type);
    const crc = PngMetadata.crc32(new Uint8Array([...typeArray, ...data]));
    return { size: data.length, type, data, crc };
  }

  private static crc32(data: Uint8Array): number {
    let crc = -1;
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ PngMetadata.crcTable[(crc ^ data[i]!) & 0xFF]!;
    }
    return (crc ^ -1) >>> 0;
  }

  private static crcTable: number[] = (() => {
    const table: number[] = new Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[i] = c;
    }
    return table;
  })();
}
