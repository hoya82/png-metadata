# PNG Metadata TypeScript Library

This TypeScript library provides functionality to work with PNG metadata, allowing you to extract, modify, and create PNG chunks. It's a modern, optimized, and cross-platform version of the original [node-png-metadata](https://github.com/kujirahand/node-png-metadata) library.

## Features

- Extract metadata from PNG files
- Create and modify PNG chunks
- Cross-platform compatibility (works in browsers, Node.js, and Bun)
- Written in TypeScript for type safety
- No dependencies

## Installation

You can install this library using npm:

```bash
npm install png-metadata-ts
```

Or using yarn:

```bash
yarn add png-metadata-ts
```


## Usage Examples

### Browser Environment

This example assumes you're using a module bundler like Vite or webpack with TypeScript support.

```typescript
import { PngMetadata } from 'png-metadata-ts';

async function processPngFile(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (PngMetadata.isPNG(arrayBuffer)) {
      const chunks = PngMetadata.splitChunks(arrayBuffer);

      // Example: Add a text chunk with a comment
      const commentChunk = PngMetadata.createChunk('tEXt', new TextEncoder().encode('Comment\0Hello from browser!'));
      chunks.splice(-1, 0, commentChunk);

      // Join chunks back into a PNG file
      const modifiedPngData = PngMetadata.joinChunks(chunks);

      // Create a Blob from the modified PNG data
      const blob = new Blob([modifiedPngData], { type: 'image/png' });

      // Create a download link for the modified PNG
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modified.png';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      console.error('The provided file is not a valid PNG.');
    }
  } catch (error) {
    console.error('Error processing PNG file:', error);
  }
}

// Usage in an event listener
document.getElementById('fileInput')?.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    processPngFile(file);
  }
});
```

### Server Environment (Node.js / Bun)

This example works for both Node.js and Bun with ESM. The only difference is in how the file is read, which is noted in the comments.

```typescript
import { PngMetadata } from 'png-metadata-ts';
import { promises as fs } from 'fs';

async function processPngFile(filePath: string, outputPath: string) {
  try {
    // Node.js
    const fileData = await fs.readFile(filePath);
    const arrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength);

    // Bun (uncomment the following line and comment out the above two lines if using Bun)
    // const arrayBuffer = await Bun.file(filePath).arrayBuffer();

    if (PngMetadata.isPNG(arrayBuffer)) {
      const chunks = PngMetadata.splitChunks(arrayBuffer);

      // Example: Add a text chunk with a comment
      const commentChunk = PngMetadata.createChunk('tEXt', new TextEncoder().encode('Comment\0Hello from server!'));
      chunks.splice(-1, 0, commentChunk);

      // Join chunks back into a PNG file
      const modifiedPngData = PngMetadata.joinChunks(chunks);

      // Write the modified PNG data to a file
      await fs.writeFile(outputPath, new Uint8Array(modifiedPngData));

      console.log(`Modified PNG saved to ${outputPath}`);
    } else {
      console.error('The provided file is not a valid PNG.');
    }
  } catch (error) {
    console.error('Error processing PNG file:', error);
  }
}

// Usage
processPngFile('input.png', 'output.png');
```

Note: For Bun, you would use `Bun.file(filePath).arrayBuffer()` to read the file instead of `fs.readFile`. The rest of the code remains the same for both environments.

These examples demonstrate how to use the PNG Metadata library to read a PNG file, add a text chunk with a comment, and save the modified PNG in both browser and server environments.

## API

### `PngMetadata.isPNG(data: ArrayBuffer | Uint8Array): boolean`

Checks if the given data is a valid PNG file.

### `PngMetadata.splitChunks(data: ArrayBuffer | Uint8Array): Chunk[]`

Splits a PNG file into its constituent chunks.

### `PngMetadata.joinChunks(chunks: Chunk[]): ArrayBuffer`

Joins PNG chunks back into a complete PNG file.

### `PngMetadata.createChunk(type: string, data: Uint8Array): Chunk`

Creates a new PNG chunk with the given type and data.

## Compatibility

This library is compatible with:

- Modern browsers
- Node.js (version 14 and above)
- Bun runtime

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- Original library: [node-png-metadata](https://github.com/kujirahand/node-png-metadata) by [kujirahand](https://github.com/kujirahand)
- TypeScript conversion and optimization: Claude (AI Assistant)
- Packaging and testing: Hoya Kim <hoya@mychar.info>

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.