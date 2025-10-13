import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';

export class FileUtils {
  static getFilePath(fileName: string): string {
    return new URL(`../../files/${fileName}`, import.meta.url).pathname;
  }

  static getDownloadPath(fileName: string): string {
    const baseName = fileName.split('.')[0];
    const extension = fileName.split('.').pop();
    return new URL(`../../files/${baseName}_downloaded.${extension}`, import.meta.url).pathname;
  }

  static async saveStreamToFile(stream: ReadableStream, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      const readableStream = Readable.fromWeb(stream as any);

      readableStream.pipe(writeStream);

      writeStream.on('finish', () => {
        console.log('Downloaded file saved to:', filePath);
        resolve();
      });

      writeStream.on('error', reject);
    });
  }

  static async compareFiles(blob1: Blob, blob2: Blob): Promise<boolean> {
    const buffer1 = Buffer.from(await blob1.arrayBuffer());
    const buffer2 = Buffer.from(await blob2.arrayBuffer());
    return buffer1.equals(buffer2);
  }
}
