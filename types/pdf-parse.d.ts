// ============================================
// TYPE DECLARATION FOR pdf-parse
// This package doesn't have built-in TypeScript types
// ============================================

declare module "pdf-parse" {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: {
      Title?: string;
      Author?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: string;
      ModDate?: string;
    };
    metadata: Record<string, unknown> | null;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: unknown) => string;
    max?: number;
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer | ArrayBuffer,
    options?: PDFOptions
  ): Promise<PDFData>;

  export = pdfParse;
}