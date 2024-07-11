// Test for extract ComfyUI output png
import { PngMetadata as png } from '../src/png-metadata';
import type { Chunk } from '../src/png-metadata';
import { readFileSync } from 'fs';

describe('metadata', function () {
  const file = readFileSync(__dirname + '/sd_webui_sample.png');
  const bin = new Uint8Array(file);

  it('isTestFileExists', function () {
    expect(file).toBeDefined();
    expect(bin).toBeDefined();
    expect(bin.byteLength).toBeGreaterThan(0);
  });

  it('isPNG', function () {
    expect(png.isPNG(bin)).toBe(true);
  });

  it('metadataCheck', function () {
    const chunks = png.splitChunks(bin);
    const meta: Record<string, string> = chunks.filter(chunk => chunk.type === 'tEXt')
      .map((chunk) => new TextDecoder().decode(chunk.data))
      .map((text) => text.split('\0'))
      .filter(item => item.length === 2 && item[0]!.length > 0)
      .reduce((acc, [key, value]) => {
        acc[key as string] = value as string;
        return acc;
      }, {} as any)
      ;

    const { parameters } = meta;

    const parametersCheck = readFileSync(__dirname + '/sd_webui_parameters.txt', 'utf-8');
    expect(parameters).toEqual(parametersCheck);
  });
});