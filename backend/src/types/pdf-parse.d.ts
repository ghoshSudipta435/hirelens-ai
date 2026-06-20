declare module 'pdf-parse' {
  export class PDFParse {
    constructor(buffer: Buffer);
    load(): Promise<void>;
    getText(): Promise<string>;
    destroy(): void;
  }
}
