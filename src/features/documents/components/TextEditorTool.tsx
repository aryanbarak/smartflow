import { useRef, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, List, Download, Save, FileText,
  Heading1, Heading2, Heading3,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { useT } from '@/i18n';

// A4 in points: 595 x 842
const A4_W_PT = 595;
const A4_H_PT = 842;
// A4 at 96dpi: ~794 x 1123 px
const A4_W_PX = 794;
const A4_H_PX = Math.round(A4_W_PX * (A4_H_PT / A4_W_PT));

interface Props {
  onSave?: (file: File, title?: string) => Promise<void>;
}

async function exportToPdf(editorEl: HTMLElement): Promise<Uint8Array> {
  const canvas = await html2canvas(editorEl, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: A4_W_PX,
  });

  const totalH = canvas.height;
  const pageH = Math.round(A4_H_PX * 1.5); // at scale 1.5
  const pageW = canvas.width;

  const pdfDoc = await PDFDocument.create();

  let yOffset = 0;
  while (yOffset < totalH) {
    const sliceH = Math.min(pageH, totalH - yOffset);

    // Draw slice onto a temp canvas
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = pageW;
    sliceCanvas.height = pageH;
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageW, pageH);
    ctx.drawImage(canvas, 0, yOffset, pageW, sliceH, 0, 0, pageW, sliceH);

    const pngData = sliceCanvas.toDataURL('image/png');
    const pngBytes = await fetch(pngData).then(r => r.arrayBuffer());
    const img = await pdfDoc.embedPng(pngBytes);

    const page = pdfDoc.addPage([A4_W_PT, A4_H_PT]);
    page.drawImage(img, { x: 0, y: 0, width: A4_W_PT, height: A4_H_PT });

    yOffset += sliceH;
  }

  return pdfDoc.save();
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function TextEditorTool({ onSave }: Props) {
  const { t } = useT();
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState('16');
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  const isEmpty = () => !editorRef.current?.textContent?.trim();

  const handleExportPdf = async () => {
    if (!editorRef.current || isEmpty()) {
      toast.error('Nothing to export');
      return;
    }
    setIsExporting(true);
    try {
      const bytes = await exportToPdf(editorRef.current);
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `document_${Date.now()}.pdf`);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTxt = () => {
    if (!editorRef.current || isEmpty()) { toast.error('Nothing to export'); return; }
    const text = editorRef.current.innerText ?? '';
    downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), `document_${Date.now()}.txt`);
    toast.success('.txt downloaded');
  };

  const handleSave = async () => {
    if (!editorRef.current || isEmpty() || !onSave) return;
    setIsSaving(true);
    try {
      const bytes = await exportToPdf(editorRef.current);
      const name = `document_${Date.now()}.pdf`;
      const file = new File([bytes], name, { type: 'application/pdf' });
      await onSave(file, name);
      toast.success('Saved to Documents');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toolbarBtn = (label: string, icon: React.ReactNode, onClick: () => void) => (
    <button
      type="button"
      title={label}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
    >
      {icon}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border border-border rounded-xl px-2 py-1.5 bg-muted/30">
        {toolbarBtn('Bold', <Bold size={14} />, () => exec('bold'))}
        {toolbarBtn('Italic', <Italic size={14} />, () => exec('italic'))}
        {toolbarBtn('Underline', <Underline size={14} />, () => exec('underline'))}
        <div className="w-px h-5 bg-border mx-1" />
        {toolbarBtn('H1', <Heading1 size={14} />, () => exec('formatBlock', 'h1'))}
        {toolbarBtn('H2', <Heading2 size={14} />, () => exec('formatBlock', 'h2'))}
        {toolbarBtn('H3', <Heading3 size={14} />, () => exec('formatBlock', 'h3'))}
        {toolbarBtn('Paragraph', <FileText size={14} />, () => exec('formatBlock', 'p'))}
        <div className="w-px h-5 bg-border mx-1" />
        {toolbarBtn('Bullet list', <List size={14} />, () => exec('insertUnorderedList'))}
        <div className="w-px h-5 bg-border mx-1" />
        <select
          value={fontSize}
          onChange={e => { setFontSize(e.target.value); exec('fontSize', e.target.value); }}
          className="text-xs bg-transparent border border-border rounded px-1 py-0.5 text-muted-foreground"
        >
          {['12', '14', '16', '18', '20', '24', '32'].map(s => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start typing…"
        className="min-h-[400px] w-full rounded-xl border border-border bg-background px-6 py-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed overflow-auto"
        style={{ maxWidth: `${A4_W_PX}px`, minHeight: '400px' }}
        onKeyDown={e => {
          // Tab → 4 spaces
          if (e.key === 'Tab') { e.preventDefault(); exec('insertText', '    '); }
        }}
      />

      {/* Export bar */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          <Download size={14} />
          {isExporting ? 'Exporting…' : t('editor_export_pdf')}
        </button>
        <button
          type="button"
          onClick={handleExportTxt}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
        >
          <Download size={14} /> {t('editor_export_txt')}
        </button>
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {isSaving ? 'Saving…' : t('editor_save_docs')}
          </button>
        )}
      </div>
    </div>
  );
}
