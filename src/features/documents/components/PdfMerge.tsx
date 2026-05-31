import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FilePlus, Trash2, Download, Merge } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { pdfToolsService } from '../pdfToolsService';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

interface PdfFile {
  id: string;
  file: File;
  pages: number;
}

export function PdfMerge() {
  const [files, setFiles] = useState<PdfFile[]>([]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const newFiles: PdfFile[] = [];
    for (const file of accepted) {
      try {
        const pages = await pdfToolsService.getPageCount(file);
        newFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          pages,
        });
      } catch {
        toast.error(`Could not read ${file.name}`);
      }
    }
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const { mutate: merge, isPending } = useMutation({
    mutationFn: () => pdfToolsService.mergePdfs(files.map(f => f.file)),
    onSuccess: (bytes) => {
      const baseName = files[0].file.name.replace('.pdf', '');
      pdfToolsService.downloadPdf(bytes, `${baseName}_merged.pdf`);
      toast.success(`${files.length} PDFs merged`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
  const totalPages = files.reduce((sum, f) => sum + f.pages, 0);

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
        <FilePlus size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop PDFs here' : 'Drag PDFs here or click to select'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Select multiple files to merge</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{files.length} files — {totalPages} pages total</span>
            <button type="button" onClick={() => setFiles([])} className="hover:text-destructive transition-colors">
              Clear all
            </button>
          </div>

          <Reorder.Group values={files} onReorder={setFiles} className="space-y-2" axis="y">
            <AnimatePresence initial={false}>
              {files.map((pdfFile, index) => (
                <Reorder.Item key={pdfFile.id} value={pdfFile}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing"
                  >
                    <span className="text-xs text-muted-foreground w-5 text-center font-mono">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{pdfFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">{pdfFile.pages} pages</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${pdfFile.file.name}`}
                      onClick={() => remove(pdfFile.id)}
                      className="p-1 rounded hover:text-destructive transition-colors text-muted-foreground"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <p className="text-xs text-muted-foreground text-center">Drag rows to reorder</p>
        </div>
      )}

      {files.length >= 2 && (
        <button
          type="button"
          onClick={() => merge()}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isPending ? (
            <Download size={16} className="animate-bounce" />
          ) : (
            <Merge size={16} />
          )}
          {isPending ? 'Merging…' : `Merge ${files.length} PDFs (${totalPages} pages)`}
        </button>
      )}
    </div>
  );
}
