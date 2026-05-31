import { PDFDocument } from 'pdf-lib';

export const pdfToolsService = {
  async mergePdfs(files: File[]): Promise<Uint8Array> {
    if (files.length < 2) throw new Error('At least 2 PDFs required');

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }

    return mergedPdf.save();
  },

  async splitPdf(
    file: File,
    mode: 'all-pages' | 'range',
    range?: { start: number; end: number }
  ): Promise<Uint8Array[]> {
    const arrayBuffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(arrayBuffer);
    const totalPages = sourcePdf.getPageCount();

    if (mode === 'all-pages') {
      const results: Uint8Array[] = [];
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(page);
        results.push(await newPdf.save());
      }
      return results;
    }

    const start = Math.max(0, (range?.start ?? 1) - 1);
    const end = Math.min(totalPages - 1, (range?.end ?? totalPages) - 1);
    const newPdf = await PDFDocument.create();
    const pageIndices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const pages = await newPdf.copyPages(sourcePdf, pageIndices);
    pages.forEach(page => newPdf.addPage(page));
    return [await newPdf.save()];
  },

  downloadPdf(bytes: Uint8Array, filename: string): void {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  async getPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    return pdf.getPageCount();
  },
};
