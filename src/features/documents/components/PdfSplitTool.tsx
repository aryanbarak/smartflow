import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Scissors, FileText, Download } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useT } from '@/i18n';

// Each comma-separated segment becomes its own output PDF.
// "1-3, 5, 7-9" → [[1,2,3], [5], [7,8,9]]
function parseRangeToChunks(input: string, total: number): number[][] {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .reduce<number[][]>((acc, part) => {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        const pages: number[] = [];
        for (let i = a; i <= Math.min(b, total); i++) if (i >= 1) pages.push(i);
        if (pages.length) acc.push(pages);
      } else {
        const n = Number(part);
        if (n >= 1 && n <= total) acc.push([n]);
      }
      return acc;
    }, []);
}

function splitByN(total: number, n: number): number[][] {
  const chunks: number[][] = [];
  for (let i = 1; i <= total; i += n) {
    const chunk: number[] = [];
    for (let j = i; j < i + n && j <= total; j++) chunk.push(j);
    chunks.push(chunk);
  }
  return chunks;
}

async function pdfChunkFromPages(source: ArrayBuffer, pageNums: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(source);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, pageNums.map(n => n - 1));
  pages.forEach(p => out.addPage(p));
  return out.save();
}

async function downloadZip(chunks: Uint8Array[], baseName: string): Promise<void> {
  const zip = new JSZip();
  chunks.forEach((bytes, i) => zip.file(`${baseName}_part${i + 1}.pdf`, bytes));
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseName}_split.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PdfSplitTool() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<'range' | 'every'>('range');
  const [rangeInput, setRangeInput] = useState('');
  const [everyN, setEveryN] = useState(1);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    try {
      const buf = await f.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      setFile(f);
      setPageCount(pdf.getPageCount());
      setRangeInput('');
    } catch {
      toast.error(`Could not read ${f.name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const { mutate: splitAndDownload, isPending } = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file');
      const buf = await file.arrayBuffer();
      let chunks: number[][];
      if (mode === 'range') {
        chunks = parseRangeToChunks(rangeInput, pageCount);
        if (!chunks.length) throw new Error('No valid pages in range');
      } else {
        if (everyN < 1) throw new Error('N must be at least 1');
        chunks = splitByN(pageCount, everyN);
      }
      const pdfs = await Promise.all(chunks.map(pages => pdfChunkFromPages(buf, pages)));
      const baseName = file.name.replace(/\.pdf$/i, '');
      if (pdfs.length === 1) {
        // Single output: download directly
        const blob = new Blob([pdfs[0]], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_split.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await downloadZip(pdfs, baseName);
      }
      return pdfs.length;
    },
    onSuccess: (count) => toast.success(`Split into ${count} PDF${count !== 1 ? 's' : ''}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const canSplit = file && (mode === 'range' ? rangeInput.trim().length > 0 : everyN >= 1);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
        style={{
          borderColor: isDragActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          background: isDragActive ? 'hsl(var(--primary) / 0.05)' : 'transparent',
        }}
      >
        <input {...getInputProps()} />
        <Scissors size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop PDF here' : 'Drag a PDF here or click to select'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Single file only</p>
      </div>

      {file && (
        <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3">
          <FileText size={16} className="text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{pageCount} pages</p>
          </div>
          <button type="button" onClick={() => { setFile(null); setPageCount(0); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Remove
          </button>
        </div>
      )}

      {file && (
        <div className="space-y-3">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {(['range', 'every'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 text-xs py-2 rounded-lg border transition-colors"
                style={{
                  background: mode === m ? 'hsl(var(--primary))' : 'transparent',
                  color: mode === m ? 'white' : undefined,
                  borderColor: mode === m ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                }}
              >
                {m === 'range' ? 'Page ranges' : t('split_every_n')}
              </button>
            ))}
          </div>

          {mode === 'range' ? (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Pages — {t('split_pages_hint')}
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={e => setRangeInput(e.target.value)}
                placeholder={t('split_pages_hint')}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-muted-foreground">
                Each comma-separated segment becomes a separate PDF
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Pages per chunk</label>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={everyN}
                onChange={e => setEveryN(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {everyN >= 1 && pageCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  → {Math.ceil(pageCount / everyN)} PDF{Math.ceil(pageCount / everyN) !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => splitAndDownload()}
            disabled={isPending || !canSplit}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {isPending ? <Download size={16} className="animate-bounce" /> : <Scissors size={16} />}
            {isPending ? 'Splitting…' : 'Split & Download'}
          </button>
        </div>
      )}
    </div>
  );
}
