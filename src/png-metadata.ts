export const PNG_SIG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export const ChunkTypes = [
  'bKGD', // gives the default background color. It is intended for use when there is no better choice available, such as in standalone image viewers (but not web browsers; see below for more details).
  'cHRM', // gives the chromaticity coordinates of the display primaries and white point.
  'cICP', // specifies the color space, transfer function and matrix coefficients as defined in ITU-T H.273.[22] It is intended for use with HDR imagery without requiring a color profile.[23]
  'dSIG', // is for storing digital signatures.[24]
  'eXIf', // stores Exif metadata.[25]
  'gAMA', // specifies gamma. The gAMA chunk contains only 4 bytes, and its value represents the gamma value multiplied by 100,000; for example, the gamma value 1/3.4 calculates to 29411.7647059 ((1/3.4)*(100,000)) and is converted to an integer (29412) for storage.[26]
  'hIST', // can store the histogram, or total amount of each color in the image.
  'iCCP', // is an ICC color profile.
  'iTXt', // contains a keyword and UTF-8 text, with encodings for possible compression and translations marked with language tag. The Extensible Metadata Platform (XMP) uses this chunk with a keyword 'XML:com.adobe.xmp'
  'pHYs', // holds the intended pixel size (or pixel aspect ratio); the pHYs contains "Pixels per unit, X axis" (4 bytes), "Pixels per unit, Y axis" (4 bytes), and "Unit specifier" (1 byte) for a total of 9 bytes.[27]
  'sBIT', // (significant bits) indicates the color-accuracy of the source data; this chunk contains a total of between 1 and 5 bytes, depending on the color type.[28][29][30]
  'sPLT', // suggests a palette to use if the full range of colors is unavailable.
  'sRGB', // indicates that the standard sRGB color space is used; the sRGB chunk contains only 1 byte, which is used for "rendering intent" (4 values—0, 1, 2, and 3—are defined for rendering intent).[31]
  'sTER', // stereo-image indicator chunk for stereoscopic images.[32]
  'tEXt', // can store text that can be represented in ISO/IEC 8859-1, with one key-value pair for each chunk. The "key" must be between one and 79 characters long. Separator is a null character. The "value" can be any length, including zero up to the maximum permissible chunk size minus the length of the keyword and separator. Neither "key" nor "value" can contain null character. Leading or trailing spaces are also disallowed.
  'tIME', // stores the time that the image was last changed.
  'tRNS', // contains transparency information. For indexed images, it stores alpha channel values for one or more palette entries. For truecolor and grayscale images, it stores a single pixel value that is to be regarded as fully transparent.
  'zTXt', // contains compressed text (and a compression method marker) with the same limits as tEXt.
];

/*
The lowercase first letter in these chunks indicates that they are not needed for the PNG specification. The lowercase last letter in some chunks indicates that they are safe to copy, even if the application concerned does not understand them.
*/

export type ChunkTypes = typeof ChunkTypes[number];
export interface Chunk {
  size: number;
  type: string;
  data: Uint8Array;
  crc: number;
};

export class PngMetadata {
  private static textDecoder = new TextDecoder();
  private static textEncoder = new TextEncoder();

  private view: DataView;

  constructor(data: ArrayBuffer | Uint8Array) {
    this.view = new DataView(data instanceof ArrayBuffer ? data : data.buffer);
  }

  isPNG(): boolean {
    for(let i=0; i<PNG_SIG.length; i++) {
      if(this.view.getUint8(i) !== PNG_SIG[i]) return false;
    }
    return true;
  }

  splitChunks(): Chunk[] {
    let offset = PNG_SIG.length;
    const chunks: Chunk[] = [];

    while (offset < this.view.byteLength) {
      if(offset + 8 > this.view.byteLength) break;

      const size = this.view.getUint32(offset);
      offset += 4;

      const type = PngMetadata.textDecoder.decode(new Uint8Array(this.view.buffer, offset, 4));
      offset += 4;

      if (offset + size + 4 > this.view.byteLength) break;

      const chunkData = new Uint8Array(this.view.buffer, offset, size);
      offset += size;

      const crc = this.view.getUint32(offset);
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
