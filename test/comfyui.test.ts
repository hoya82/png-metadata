// Test for extract ComfyUI output png
import { PngMetadata } from '../src/png-metadata';
import type { Chunk } from '../src/png-metadata';
import { readFileSync } from 'fs';

describe('metadata', function () {
  const file = readFileSync(__dirname + '/ComfyUI_sample.png');
  const bin = new Uint8Array(file);
  const png = new PngMetadata(bin);

  it('isTestFileExists', function () {
    expect(file).toBeDefined();
    expect(bin).toBeDefined();
    expect(bin.byteLength).toBeGreaterThan(0);
  });

  it('isPNG', function () {
    expect(png.isPNG()).toBe(true);
  });

  it('metadataCheck', function () {
    const chunks = png.splitChunks();
    const meta: Record<string, string> = chunks.filter(chunk => chunk.type === 'tEXt')
      .map((chunk) => new TextDecoder().decode(chunk.data))
      .map((text) => text.split('\0'))
      .filter(item => item.length === 2 && item[0]!.length > 0)
      .reduce((acc, [key, value]) => {
        acc[key as string] = value as string;
        return acc;
      }, {} as any)
      ;

    const { prompt, workflow } = meta;

    const promptCheck = readFileSync(__dirname + '/ComfyUI_sample.Prompt.json', 'utf-8');
    expect(() => JSON.parse(prompt!)).not.toThrow();
    expect(JSON.parse(prompt!)).toEqual(JSON.parse(promptCheck!));

    const workflowCheck = readFileSync(__dirname + '/ComfyUI_sample.Workflow.json', 'utf-8');
    expect(() => JSON.parse(workflow!)).not.toThrow();
    expect(JSON.parse(workflow!)).toEqual(JSON.parse(workflowCheck!));
  });
});