import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

type PageSize = 'A4' | 'Letter' | 'auto';

interface ImgFile {
  id: string;
  file: File;
  previewUrl: string;
}

// Convert any image to JPEG ArrayBuffer via canvas (handles webp, gif, etc.)
async function toJpeg(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('Canvas unavailable')); }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        if (!blob) return reject(new Error('Conversion failed'));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Failed to load ${file.name}`)); };
    img.src = url;
  });
}

async function buildPdf(images: ImgFile[], pageSize: PageSize, marginMm: number): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const marginPts = marginMm * 2.835; // mm to points

  for (const { file } of images) {
    const isJpeg = file.type === 'image/jpeg';
    const isPng = file.type === 'image/png';

    let imgBytes: ArrayBuffer;
    let embedAsPng = false;

    if (isJpeg) {
      imgBytes = await file.arrayBuffer();
    } else if (isPng) {
      imgBytes = await file.arrayBuffer();
      embedAsPng = true;
    } else {
      imgBytes = await toJpeg(file); // webp/gif → jpeg
    }

    const embedded = embedAsPng
      ? await pdfDoc.embedPng(imgBytes)
      : await pdfDoc.embedJpg(imgBytes);

    const imgW = embedded.width;
    const imgH = embedded.height;

    let pageW: number;
    let pageH: number;

    if (pageSize === 'auto') {
      pageW = imgW + marginPts * 2;
      pageH = imgH + marginPts * 2;
    } else {
      [pageW, pageH] = pageSize === 'A4' ? PageSizes.A4 : PageSizes.Letter;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    const availW = pageW - marginPts * 2;
    const availH = pageH - marginPts * 2;
    const scale = Math.min(availW / imgW, availH / imgH, 1);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const x = marginPts + (availW - drawW) / 2;
    const y = marginPts + (availH - drawH) / 2;

    page.drawImage(embedded, { x, y, width: drawW, height: drawH });
  }

  return pdfDoc.save();
}

export function ImageToPdfTool() {
  const [images, setImages] = useState<ImgFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [marginMm, setMarginMm] = useState(10);

  const onDrop = useCallback((accepted: File[]) => {
    const newImgs: ImgFile[] = accepted.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImgs]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    multiple: true,
  });

  const remove = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  };

  const { mutate: convert, isPending } = useMutation({
    mutationFn: () => buildPdf(images, pageSize, marginMm),
    onSuccess: (bytes) => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `images_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`PDF created with ${images.length} page${images.length !== 1 ? 's' : ''}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pageSizes: PageSize[] = ['A4', 'Letter', 'auto'];
  const margins = [0, 10, 20];

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
        <ImagePlus size={32} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive ? 'Drop images here' : 'Drag images here or click to select'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF — multiple files</p>
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{images.length} image{images.length !== 1 ? 's' : ''}</span>
            <button type="button" onClick={() => { images.forEach(i => URL.revokeObjectURL(i.previewUrl)); setImages([]); }}
              className="hover:text-destructive transition-colors">Clear all</button>
          </div>

          <Reorder.Group values={images} onReorder={setImages} className="space-y-2" axis="y">
            <AnimatePresence initial={false}>
              {images.map((img, index) => (
                <Reorder.Item key={img.id} value={img}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing"
                  >
                    <span className="text-xs text-muted-foreground w-5 text-center font-mono">{index + 1}</span>
                    <img
                      src={img.previewUrl}
                      alt={img.file.name}
                      className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                    />
                    <p className="text-sm font-medium truncate flex-1">{img.file.name}</p>
                    <button
                      type="button"
                      aria-label={`Remove ${img.file.name}`}
                      onClick={() => remove(img.id)}
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

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Page size</p>
              <div className="flex gap-1">
                {pageSizes.map(s => (
                  <button key={s} type="button" onClick={() => setPageSize(s)}
                    className="flex-1 text-xs py-2 rounded-lg border transition-colors"
                    style={{
                      background: pageSize === s ? 'hsl(var(--primary))' : 'transparent',
                      color: pageSize === s ? 'white' : undefined,
                      borderColor: pageSize === s ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Margin</p>
              <div className="flex gap-1">
                {margins.map(m => (
                  <button key={m} type="button" onClick={() => setMarginMm(m)}
                    className="flex-1 text-xs py-2 rounded-lg border transition-colors"
                    style={{
                      background: marginMm === m ? 'hsl(var(--primary))' : 'transparent',
                      color: marginMm === m ? 'white' : undefined,
                      borderColor: marginMm === m ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    }}>
                    {m}mm
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => convert()}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {isPending ? <Download size={16} className="animate-bounce" /> : <Download size={16} />}
            {isPending ? 'Converting…' : `Convert ${images.length} image${images.length !== 1 ? 's' : ''} to PDF`}
          </button>
        </div>
      )}
    </div>
  );
}
