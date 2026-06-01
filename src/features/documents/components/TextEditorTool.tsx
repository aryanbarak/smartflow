import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, Type,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered,
  Link2, Highlighter, Eraser,
  Palette, Download, Save,
  Undo2, Redo2,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

const A4_W_PT = 595;
const A4_H_PT = 842;
const A4_W_PX = 794;
const A4_H_PX = Math.round(A4_W_PX * (A4_H_PT / A4_W_PT));

interface Props {
  onSave?: (file: File, title?: string) => Promise<void>;
}

// Inject TipTap placeholder CSS once
function usePlaceholderStyles() {
  useEffect(() => {
    if (document.getElementById('tiptap-placeholder-css')) return;
    const style = document.createElement('style');
    style.id = 'tiptap-placeholder-css';
    style.textContent = `
      .tiptap p.is-editor-empty:first-child::before {
        color: #9ca3af;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }
      .tiptap:focus { outline: none; }
      .tiptap h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
      .tiptap h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
      .tiptap h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
      .tiptap ul { list-style-type: disc; padding-left: 1.5em; margin: 0.5em 0; }
      .tiptap ol { list-style-type: decimal; padding-left: 1.5em; margin: 0.5em 0; }
      .tiptap p { margin: 0.25em 0; }
      .tiptap a { color: #2563eb; text-decoration: underline; }
      .tiptap mark { border-radius: 2px; padding: 0 2px; }
      .tiptap blockquote { border-left: 3px solid #d1d5db; padding-left: 1em; color: #6b7280; margin: 0.5em 0; }
      .tiptap code { background: #f3f4f6; border-radius: 3px; padding: 0.1em 0.3em; font-family: monospace; font-size: 0.9em; }
      .tiptap pre { background: #f3f4f6; border-radius: 6px; padding: 1em; overflow-x: auto; }
      .tiptap pre code { background: none; padding: 0; }
      .tiptap hr { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
    `;
    document.head.appendChild(style);
  }, []);
}

async function exportToPdf(pageEl: HTMLElement): Promise<Uint8Array> {
  const canvas = await html2canvas(pageEl, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: A4_W_PX,
    logging: false,
  });

  const totalH = canvas.height;
  const pageH = Math.round(A4_H_PX * 1.5);
  const pageW = canvas.width;
  const pdfDoc = await PDFDocument.create();

  let yOffset = 0;
  while (yOffset < totalH) {
    const sliceH = Math.min(pageH, totalH - yOffset);
    const slice = document.createElement('canvas');
    slice.width = pageW;
    slice.height = pageH;
    const ctx = slice.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageW, pageH);
    ctx.drawImage(canvas, 0, yOffset, pageW, sliceH, 0, 0, pageW, sliceH);
    const pngBytes = await fetch(slice.toDataURL('image/png')).then(r => r.arrayBuffer());
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
  const pageRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  usePlaceholderStyles();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
    ],
    editorProps: {
      attributes: {
        class: 'min-h-[500px] p-8 focus:outline-none',
        style: 'color: #1a1a1a; background: white; font-size: 15px; line-height: 1.7;',
      },
    },
  });

  const isEmpty = () => !editor || editor.isEmpty;

  // ── Export helpers ──────────────────────────────────────────────────────────

  const handleExportPdf = async () => {
    if (!pageRef.current || isEmpty()) { toast.error('Nothing to export'); return; }
    setIsExporting(true);
    try {
      const bytes = await exportToPdf(pageRef.current);
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `document_${Date.now()}.pdf`);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTxt = () => {
    if (!editor || isEmpty()) { toast.error('Nothing to export'); return; }
    const text = editor.getText();
    downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), `document_${Date.now()}.txt`);
    toast.success('.txt downloaded');
  };

  const handleSave = async () => {
    if (!pageRef.current || isEmpty() || !onSave) return;
    setIsSaving(true);
    try {
      const bytes = await exportToPdf(pageRef.current);
      const name = `document_${Date.now()}.pdf`;
      await onSave(new File([bytes], name, { type: 'application/pdf' }), name);
      toast.success('Saved to Documents');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toolbar helpers ─────────────────────────────────────────────────────────

  const Btn = ({
    title, active = false, onClick, children,
  }: { title: string; active?: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={cn(
        'p-1.5 rounded text-sm transition-colors',
        active
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-700',
      )}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-slate-700 mx-0.5 self-center" />;

  if (!editor) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-t-lg p-2 flex flex-wrap items-center gap-1">

        {/* History */}
        <Btn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={14} />
        </Btn>
        <Btn title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={14} />
        </Btn>

        <Divider />

        {/* Text style */}
        <Btn title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </Btn>
        <Btn title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </Btn>
        <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={14} />
        </Btn>
        <Btn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </Btn>

        <Divider />

        {/* Headings */}
        <Btn title="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
          <Type size={14} />
        </Btn>
        <Btn title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={14} />
        </Btn>
        <Btn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={14} />
        </Btn>
        <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={14} />
        </Btn>

        <Divider />

        {/* Alignment */}
        <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={14} />
        </Btn>
        <Btn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={14} />
        </Btn>
        <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={14} />
        </Btn>
        <Btn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify size={14} />
        </Btn>

        <Divider />

        {/* Lists */}
        <Btn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </Btn>
        <Btn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </Btn>

        <Divider />

        {/* Insert */}
        <Btn
          title="Insert link"
          active={editor.isActive('link')}
          onClick={() => {
            const prev = editor.getAttributes('link').href as string ?? '';
            const url = window.prompt('URL', prev);
            if (url === null) return;
            if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }}
        >
          <Link2 size={14} />
        </Btn>
        <Btn
          title="Highlight"
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
        >
          <Highlighter size={14} />
        </Btn>
        <Btn
          title="Clear formatting"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <Eraser size={14} />
        </Btn>

        <Divider />

        {/* Font color */}
        <label
          title="Font color"
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer flex items-center transition-colors"
          onMouseDown={e => e.preventDefault()}
          onClick={() => colorInputRef.current?.click()}
        >
          <Palette size={14} />
          <input
            ref={colorInputRef}
            type="color"
            aria-label="Font color picker"
            title="Font color"
            className="w-0 h-0 opacity-0 absolute"
            defaultValue="#1a1a1a"
            onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
          />
        </label>
      </div>

      {/* Keyboard hint */}
      <div className="bg-slate-800/50 border-x border-slate-700 px-3 py-1">
        <span className="text-xs text-slate-500">
          Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline · Ctrl+Z Undo
        </span>
      </div>

      {/* ── White page area ─────────────────────────────────────────── */}
      <div className="border border-t-0 border-slate-700 rounded-b-lg overflow-auto bg-[#f0f0f0] min-h-[540px]">
        <div
          ref={pageRef}
          className="mx-auto my-6 shadow-xl rounded bg-white w-[794px] min-h-[1123px]"
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Export bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 pt-3">
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
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Download size={14} /> {t('editor_export_txt')}
        </button>
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {isSaving ? 'Saving…' : t('editor_save_docs')}
          </button>
        )}
      </div>
    </div>
  );
}
