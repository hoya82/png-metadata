// Simple test
import { PngMetadata as png } from '../src/png-metadata';
import type { Chunk } from '../src/png-metadata';
import { readFileSync } from 'fs';

function arrayBufferEquals(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const viewA = new Uint8Array(a);
  const viewB = new Uint8Array(b);
  for (let i = 0; i < viewA.length; i++) {
    if (viewA[i] !== viewB[i]) return false;
  }
  return true;
}

describe('test', function () {
  const file = readFileSync(__dirname + '/simple.png');
  const bin = new Uint8Array(file);

  it('isTestFileExists', function () {
    expect(file).toBeDefined();
    expect(bin).toBeDefined();
    expect(bin.byteLength).toBeGreaterThan(0);
  });

  it('isPNG', function () {
    expect(png.isPNG(bin)).toBe(true);
  });

  it('splitChunk', function () {
    const chunks:Chunk[] = png.splitChunks(bin);
    const bin2 = png.joinChunks(chunks);
    expect(bin.byteLength).toBe(bin2.byteLength);
    expect(arrayBufferEquals(bin, bin2)).toBe(true);
  });

  // This image has corrupt data at the end,
  // but we should be able to read it anyway
  const currupted = readFileSync(__dirname + '/garbage_data_after_iend.png');

  it('splitChunkWithGarbageData', function() {
    expect(() => {
      png.splitChunks(currupted);
    }).not.toThrow();
  });
});
