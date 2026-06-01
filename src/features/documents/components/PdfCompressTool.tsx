import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Minimize2, FileText, Download } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useT } from '@/i18n';

type Quality = 'high' | 'medium' | 'low';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function compressPdf(file: File): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return pdfDoc.save({ useObjectStreams: true });
}

export function PdfCompressTool() {
  const { t } = useT();
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<Quality>('medium');
  const [result, setResult] = useState<{ bytes: Uint8Array; size: number } | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const { mutate: compress, isPending } = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file');
      const bytes = await compressPdf(file);
      return { bytes, size: bytes.byteLength };
    },
    onSuccess: (r) => {
      setResult(r);
      const saved = file!.size - r.size;
      const pct = Math.round((saved / file!.size) * 100);
      if (saved > 0) {
        toast.success(`Saved ${formatBytes(saved)} (${pct}%)`);
      } else {
        toast.info('File already optimized — no further reduction possible');
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const download = () => {
    if (!result || !file) return;
    const blob = new Blob([result.bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, '') + '_compressed.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const qualityOptions: { key: Quality; label: string }[] = [
    { key: 'high', label: t('compress_quality_high') },
    { key: 'medium', label: t('compress_quality_medium') },
    { key: 'low', label: t('compress_quality_low') },
  ];

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
        <Minimize2 size={32} className="mx-auto mb-3 text-muted-foreground" />
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
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
              {result && (
                <span className={result.size < file.size ? 'text-green-500 ml-2' : 'text-muted-foreground ml-2'}>
                  → {formatBytes(result.size)}
                  {result.size < file.size && ` (−${Math.round((1 - result.size / file.size) * 100)}%)`}
                </span>
              )}
            </p>
          </div>
          <button type="button" onClick={() => { setFile(null); setResult(null); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Remove
          </button>
        </div>
      )}

      {file && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{t('compress_quality')}</p>
            <div className="flex gap-2">
              {qualityOptions.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQuality(key)}
                  className="flex-1 text-xs py-2 rounded-lg border transition-colors"
                  style={{
                    background: quality === key ? 'hsl(var(--primary))' : 'transparent',
                    color: quality === key ? 'white' : undefined,
                    borderColor: quality === key ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">{t('compress_note')}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => compress()}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {isPending ? <Minimize2 size={16} className="animate-pulse" /> : <Minimize2 size={16} />}
              {isPending ? 'Compressing…' : 'Compress'}
            </button>

            {result && (
              <button
                type="button"
                onClick={download}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm font-medium"
              >
                <Download size={15} /> Download
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
