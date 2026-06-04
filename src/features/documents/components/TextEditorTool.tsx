import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, Type,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Highlighter, Eraser,
  Palette, Download, Save, Undo2, Redo2,
  Table2, Image, Settings2, Search, FileText,
  Sparkles, Printer, Check, Loader2, X, FilePlus,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = {
  A4:     { width: 794,  height: 1123 },
  A5:     { width: 559,  height: 794  },
  Letter: { width: 816,  height: 1056 },
} as const;

const MARGINS = { narrow: 32, normal: 64, wide: 96 } as const;

// Pre-declared full strings so Tailwind JIT scans them at build time.
const PAGE_DIM_CLASSES = {
  A4:     { portrait: 'w-[794px] min-h-[1123px]', landscape: 'w-[1123px] min-h-[794px]' },
  A5:     { portrait: 'w-[559px] min-h-[794px]',  landscape: 'w-[794px]  min-h-[559px]' },
  Letter: { portrait: 'w-[816px] min-h-[1056px]', landscape: 'w-[1056px] min-h-[816px]' },
} as const;

const PADDING_CLASSES = { narrow: 'p-8', normal: 'p-16', wide: 'p-24' } as const;

const FONTS = [
  { label: 'Inter (Default)',   value: 'Inter, sans-serif' },
  { label: 'Vazirmatn (فارسی)', value: 'Vazirmatn, sans-serif' },
  { label: 'Times New Roman',   value: 'Times New Roman, serif' },
  { label: 'Georgia',           value: 'Georgia, serif' },
  { label: 'Arial',             value: 'Arial, sans-serif' },
  { label: 'Courier New',       value: 'Courier New, monospace' },
];

const FONT_SIZES = [10, 12, 14, 15, 16, 18, 20, 24, 28, 32, 36, 48, 64];

const DRAFT_KEY = 'dailyflow:editor-draft';

type PageSizeKey  = keyof typeof PAGE_SIZES;
type MarginKey    = keyof typeof MARGINS;

function makeTemplates() {
  const d = new Date().toLocaleDateString('de-DE');
  return {
    formal_letter: { label: 'Formal Letter', icon: '✉️', content: `<h2>Sender Name</h2><p>Street Address<br>City, ZIP</p><p>&nbsp;</p><p>Recipient Name<br>Organization<br>City, ZIP</p><p>&nbsp;</p><p>City, ${d}</p><p>&nbsp;</p><h3>Subject: [Your Subject Here]</h3><p>&nbsp;</p><p>Dear Sir or Madam,</p><p>&nbsp;</p><p>[Your content here...]</p><p>&nbsp;</p><p>Yours sincerely,<br>[Your Name]</p>` },
    report:        { label: 'Report',         icon: '📊', content: `<h1>Report Title</h1><p><strong>Date:</strong> ${d}<br><strong>Author:</strong> [Name]</p><hr><h2>1. Executive Summary</h2><p>[Brief overview...]</p><h2>2. Background</h2><p>[Context...]</p><h2>3. Findings</h2><p>[Main findings...]</p><h2>4. Conclusion</h2><p>[Conclusions...]</p>` },
    meeting_notes: { label: 'Meeting Notes',  icon: '📝', content: `<h1>Meeting Notes</h1><p><strong>Date:</strong> ${d}<br><strong>Participants:</strong> [Names]<br><strong>Location:</strong> [Location]</p><hr><h2>Agenda</h2><ul><li>Topic 1</li><li>Topic 2</li></ul><h2>Discussion</h2><p>[Notes...]</p><h2>Action Items</h2><ul><li>[ ] Task — Owner — Deadline</li></ul>` },
    cv:            { label: 'CV / Resume',     icon: '👤', content: `<h1>Full Name</h1><p>Email · Phone · LinkedIn · City</p><hr><h2>Profile</h2><p>[Professional summary...]</p><h2>Work Experience</h2><h3>Job Title — Company (Year–Year)</h3><ul><li>Achievement 1</li><li>Achievement 2</li></ul><h2>Education</h2><h3>Degree — Institution (Year)</h3><h2>Skills</h2><p>Skill 1 · Skill 2 · Skill 3</p>` },
  };
}

// ── TextStyle extended with fontSize ────────────────────────────────────────

const TextStyleExt = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: el => el.style.fontSize || null,
        renderHTML: attrs => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
      },
    };
  },
});

// ── PDF export helper ────────────────────────────────────────────────────────

async function captureAsPdf(pageEl: HTMLElement): Promise<Uint8Array> {
  const pxW = pageEl.offsetWidth;
  const pxH = pageEl.scrollHeight;

  const canvas = await html2canvas(pageEl, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: pxW,
    height: pxH,
    logging: false,
  });

  // 1 pt = 96/72 px at screen resolution → ptDim = pxDim * 0.75
  const PT_PER_PX = 0.75;
  const ptW = Math.round(pxW * PT_PER_PX);
  const ptH = Math.round(pxH * PT_PER_PX);
  const pageHPx = Math.round(pageEl.offsetHeight * 1.5);
  const totalH = canvas.height;
  const canvasW = canvas.width;

  const pdfDoc = await PDFDocument.create();
  let yOffset = 0;

  while (yOffset < totalH) {
    const sliceH = Math.min(pageHPx, totalH - yOffset);
    const slice = document.createElement('canvas');
    slice.width = canvasW;
    slice.height = pageHPx;
    const ctx = slice.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, pageHPx);
    ctx.drawImage(canvas, 0, yOffset, canvasW, sliceH, 0, 0, canvasW, sliceH);
    const pngBytes = await fetch(slice.toDataURL('image/png')).then(r => r.arrayBuffer());
    const img = await pdfDoc.embedPng(pngBytes);
    const page = pdfDoc.addPage([ptW, ptH]);
    page.drawImage(img, { x: 0, y: 0, width: ptW, height: ptH });
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

// ── Placeholder + table CSS (injected once) ───────────────────────────────────

function useEditorStyles() {
  useEffect(() => {
    if (document.getElementById('tiptap-editor-css')) return;
    const s = document.createElement('style');
    s.id = 'tiptap-editor-css';
    s.textContent = `
      .tiptap { color: #1a1a1a; }
      .tiptap:focus { outline: none; }
      .tiptap p.is-editor-empty:first-child::before { color:#9ca3af;content:attr(data-placeholder);float:left;height:0;pointer-events:none; }
      .tiptap h1 { font-size:2em;font-weight:bold;margin:.5em 0; }
      .tiptap h2 { font-size:1.5em;font-weight:bold;margin:.5em 0; }
      .tiptap h3 { font-size:1.25em;font-weight:bold;margin:.5em 0; }
      .tiptap ul { list-style-type:disc;padding-left:1.5em;margin:.5em 0; }
      .tiptap ol { list-style-type:decimal;padding-left:1.5em;margin:.5em 0; }
      .tiptap p  { margin:.25em 0; }
      .tiptap a  { color:#2563eb;text-decoration:underline; }
      .tiptap mark { border-radius:2px;padding:0 2px; }
      .tiptap blockquote { border-left:3px solid #d1d5db;padding-left:1em;color:#6b7280;margin:.5em 0; }
      .tiptap code { background:#f3f4f6;border-radius:3px;padding:.1em .3em;font-family:monospace;font-size:.9em; }
      .tiptap pre  { background:#f3f4f6;border-radius:6px;padding:1em;overflow-x:auto; }
      .tiptap pre code { background:none;padding:0; }
      .tiptap hr  { border:none;border-top:1px solid #e5e7eb;margin:1em 0; }
      .tiptap img { max-width:100%;height:auto; }
      .tiptap table { border-collapse:collapse;table-layout:fixed;width:100%;margin:1em 0; }
      .tiptap td,.tiptap th { border:1px solid #d1d5db;padding:6px 8px;vertical-align:top;box-sizing:border-box;position:relative; }
      .tiptap th { font-weight:bold;background:#f3f4f6; }
      .tiptap .selectedCell:after { z-index:2;position:absolute;content:"";left:0;right:0;top:0;bottom:0;background:rgba(37,99,235,.15);pointer-events:none; }
      .tiptap .column-resize-handle { position:absolute;right:-2px;top:0;bottom:-2px;width:4px;background:#2563eb;pointer-events:none; }
    `;
    document.head.appendChild(s);
  }, []);
}

// ── AI endpoint URL (same base as analyze) ───────────────────────────────────

const AI_URL = (import.meta.env.VITE_AI_AGENT_URL as string | undefined)
  ?? 'https://api.barakzai.cloud/analyze';

// ── Component ────────────────────────────────────────────────────────────────

export interface TextEditorHandle {
  loadFromLibrary: (html: string, title: string) => void;
}

interface Props {
  onSave?: (file: File, title?: string) => Promise<void>;
}

export const TextEditorTool = forwardRef<TextEditorHandle, Props>(
function TextEditorTool({ onSave }, ref) {  const { t, lang } = useT();
  const { session } = useAuth();

  // Page settings
  const [pageSize, setPageSize]       = useState<PageSizeKey>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin]           = useState<MarginKey>('normal');
  const [docRTL, setDocRTL]           = useState(lang === 'fa');

  // Document meta
  const [docTitle, setDocTitle]     = useState('Untitled Document');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [wordCount, setWordCount]   = useState({ words: 0, chars: 0 });

  // UI panels
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [showFindReplace, setShowFindReplace]   = useState(false);
  const [showTemplates, setShowTemplates]       = useState(false);
  const [findText, setFindText]                 = useState('');
  const [replaceText, setReplaceText]           = useState('');

  // Export / AI state
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const pageRef        = useRef<HTMLDivElement>(null);
  const colorRef       = useRef<HTMLInputElement>(null);
  const hlColorRef     = useRef<HTMLInputElement>(null);
  // Draft auto-save refs (avoids stale closures in TipTap onUpdate)
  const draftTimerRef  = useRef<ReturnType<typeof setTimeout>>();
  const docTitleRef    = useRef(docTitle);

  useEditorStyles();


  // ── TipTap editor ──────────────────────────────────────────────────────────

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,      // disabled — we configure Link separately below
        underline: false, // disabled — we add Underline separately below
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyleExt,
      Color,
      FontFamily.configure({ types: ['textStyle'] }),
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      TiptapImage,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Start writing your document…' }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
        style: 'color: #1a1a1a; font-size: 15px; line-height: 1.7; min-height: 500px;',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount({ words, chars: text.length });
      setSaveStatus('saving');
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title: docTitleRef.current,
          content: ed.getHTML(),
          savedAt: new Date().toISOString(),
        }));
        setSaveStatus('saved');
      }, 2000);
    },
  });

  // Keep docTitleRef current so the onUpdate closure reads the latest title.
  useEffect(() => { docTitleRef.current = docTitle; }, [docTitle]);

  // Cleanup draft timer on unmount.
  useEffect(() => () => clearTimeout(draftTimerRef.current), []);

  // Restore draft on mount (within 7 days).
  useEffect(() => {
    if (!editor) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { title: string; content: string; savedAt: string };
      if (Date.now() - new Date(draft.savedAt).getTime() < 7 * 24 * 60 * 60 * 1000) {
        editor.commands.setContent(draft.content);
        setDocTitle(draft.title);
        docTitleRef.current = draft.title;
        setSaveStatus('saved');
        toast.info(`Draft restored from ${new Date(draft.savedAt).toLocaleTimeString()}`);
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [editor]); // run once when editor is ready

  // Expose loadFromLibrary for DocumentsPage to call imperatively.
  useImperativeHandle(ref, () => ({
    loadFromLibrary: (html: string, title: string) => {
      if (!editor) return;
      editor.commands.clearContent();
      editor.commands.setContent(html);
      editor.commands.focus('start');
      setDocTitle(title);
      docTitleRef.current = title;
      const text = editor.getText();
      setWordCount({
        words: text.trim().split(/\s+/).filter(Boolean).length,
        chars: text.length,
      });
      setSaveStatus('saved');
      localStorage.removeItem(DRAFT_KEY);
    },
  }), [editor]);

  // ── Export helpers ─────────────────────────────────────────────────────────

  const handleExportPdf = async () => {
    if (!pageRef.current || editor?.isEmpty) { toast.error('Nothing to export'); return; }
    setIsExporting(true);
    try {
      const bytes = await captureAsPdf(pageRef.current);
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${docTitle}.pdf`);
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTxt = () => {
    if (!editor || editor.isEmpty) { toast.error('Nothing to export'); return; }
    downloadBlob(new Blob([editor.getText()], { type: 'text/plain;charset=utf-8' }), `${docTitle}.txt`);
    toast.success('.txt downloaded');
  };

  const handleExportDocx = async () => {
    if (!editor || editor.isEmpty) { toast.error('Nothing to export'); return; }
    const lines = editor.getText().split('\n').filter(Boolean);
    const doc = new Document({
      sections: [{ properties: {}, children: lines.map(l => new Paragraph({ children: [new TextRun(l)] })) }],
    });
    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, `${docTitle}.docx`);
    toast.success('.docx downloaded');
  };

  // Intercept Ctrl+S globally — download .docx instead of browser "Save page".
  const exportDocxRef = useRef<() => Promise<void>>(async () => { /* noop until editor ready */ });
  exportDocxRef.current = handleExportDocx; // update every render so closure is fresh

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void exportDocxRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSaveToDocuments = async () => {
    if (!editor || !onSave) return;
    setIsSaving(true);
    try {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle}</title></head><body>${editor.getHTML()}</body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const fileName = `${docTitle}_${timestamp}.html`;
      await onSave(new File([blob], fileName, { type: "text/html" }), docTitle);
      localStorage.removeItem(DRAFT_KEY);
      toast.success('Saved to Documents library');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const content = editor?.getHTML() ?? '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<html><head><title>${docTitle}</title><style>body{font-family:'Times New Roman',serif;margin:64px;color:#1a1a1a}h1{font-size:24px}h2{font-size:20px}h3{font-size:16px}@media print{body{margin:0}}</style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  // ── AI Assistant ───────────────────────────────────────────────────────────

  const handleAiAction = async (action: 'improve' | 'translate' | 'summarize') => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = from === to
      ? editor.getText()
      : editor.state.doc.textBetween(from, to, ' ');

    if (!selectedText.trim()) {
      toast.error('Select text first, or write something in the editor');
      return;
    }

    setIsAiLoading(true);
    const prompts = {
      improve:   `Improve the writing quality of this text. Keep the same language. Return only the improved text:\n\n${selectedText}`,
      translate: `Translate this text to ${docRTL ? 'English' : 'German'}. Return only the translation:\n\n${selectedText}`,
      summarize: `Summarize this text in 2-3 sentences. Keep the same language. Return only the summary:\n\n${selectedText}`,
    };

    try {
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ message: prompts[action], mode: 'general_it' }),
      });
      const data = await res.json() as { answer?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      const result = data.answer ?? '';
      if (from === to) {
        editor.commands.setContent(result);
      } else {
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
      }
      toast.success('✨ Done!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Find & Replace ─────────────────────────────────────────────────────────

  const handleFind = () => {
    if (!editor || !findText) return;
    const count = (editor.getHTML().match(new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) ?? []).length;
    toast.info(`Found ${count} occurrence${count !== 1 ? 's' : ''}`);
  };

  const handleReplace = () => {
    if (!editor || !findText) return;
    const safe = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaced = editor.getHTML().replace(new RegExp(safe, 'gi'), replaceText);
    editor.commands.setContent(replaced);
    toast.success('Replaced all occurrences');
    setShowFindReplace(false);
  };

  // ── Image insert ───────────────────────────────────────────────────────────

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        editor?.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // ── New document ───────────────────────────────────────────────────────────

  const handleNewDocument = () => {
    if (saveStatus === 'unsaved') {
      const ok = window.confirm('You have unsaved changes. Start a new document anyway?');
      if (!ok) return;
    }
    clearTimeout(draftTimerRef.current);
    editor?.commands.clearContent();
    setDocTitle('Untitled Document');
    docTitleRef.current = 'Untitled Document';
    setWordCount({ words: 0, chars: 0 });
    setSaveStatus('saved');
    localStorage.removeItem(DRAFT_KEY);
  };

  // ── Toolbar primitives ─────────────────────────────────────────────────────

  const Btn = ({
    title, active = false, onClick, children, disabled = false,
  }: { title: string; active?: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick(); }}
      className={cn(
        'p-2 rounded-lg text-sm transition-all',
        active
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
          : 'text-slate-400 hover:text-white hover:bg-slate-700/80',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );

  const Div = () => <div className="w-px h-5 bg-slate-600/60 mx-1 self-center" />;

  if (!editor) return null;

  return (
    <div className="w-full space-y-0">

      {/* ── Toolbar (4 connected rows) ────────────────────────────────────── */}
      <div className="bg-slate-800 border border-slate-700 rounded-t-lg">

        {/* Row 1: Title bar */}
        <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-700/50">
          <button type="button" title="New document" onClick={handleNewDocument}
            className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700 transition-colors flex-shrink-0">
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <input
            value={docTitle}
            onChange={e => {
              setDocTitle(e.target.value);
              docTitleRef.current = e.target.value;
              setSaveStatus('saving');
              clearTimeout(draftTimerRef.current);
              draftTimerRef.current = setTimeout(() => {
                if (!editor) return;
                localStorage.setItem(DRAFT_KEY, JSON.stringify({
                  title: e.target.value,
                  content: editor.getHTML(),
                  savedAt: new Date().toISOString(),
                }));
                setSaveStatus('saved');
              }, 2000);
            }}
            className="bg-transparent text-white text-sm font-medium border-0 focus:outline-none flex-1 placeholder:text-slate-600 min-w-0"
            placeholder="Document title..."
            aria-label="Document title"
          />
          <span className="text-xs flex items-center gap-1 whitespace-nowrap flex-shrink-0">
            {saveStatus === 'saving'  && <><Loader2 className="w-3 h-3 animate-spin text-yellow-400" /><span className="text-yellow-400">Saving…</span></>}
            {saveStatus === 'saved'   && <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Saved</span></>}
            {saveStatus === 'unsaved' && <span className="text-orange-400">● Unsaved</span>}
          </span>
        </div>

        {/* Row 2: Formatting — horizontally scrollable on mobile */}
        <div className="overflow-x-auto border-t border-slate-700/50 [&::-webkit-scrollbar]:h-[2px] [&::-webkit-scrollbar-thumb]:bg-slate-600">
          <div className="px-2 py-1.5 flex items-center gap-1 min-w-max">
            <Btn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={13} /></Btn>
            <Btn title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={13} /></Btn>
            <Div />
            <Btn title="Bold (Ctrl+B)"      active={editor.isActive('bold')}      onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={13} /></Btn>
            <Btn title="Italic (Ctrl+I)"    active={editor.isActive('italic')}    onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={13} /></Btn>
            <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={13} /></Btn>
            <Btn title="Strikethrough"      active={editor.isActive('strike')}    onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={13} /></Btn>
            <Div />
            <Btn title="Paragraph" active={editor.isActive('paragraph')}              onClick={() => editor.chain().focus().setParagraph().run()}><Type size={13} /></Btn>
            <Btn title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={13} /></Btn>
            <Btn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={13} /></Btn>
            <Btn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={13} /></Btn>
            <Div />
            <Btn title="Align left"    active={editor.isActive({ textAlign: 'left' })}    onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={13} /></Btn>
            <Btn title="Align center"  active={editor.isActive({ textAlign: 'center' })}  onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={13} /></Btn>
            <Btn title="Align right"   active={editor.isActive({ textAlign: 'right' })}   onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={13} /></Btn>
            <Btn title="Justify"       active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify size={13} /></Btn>
            <Div />
            <Btn title="Bullet list"  active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={13} /></Btn>
            <Btn title="Ordered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={13} /></Btn>
            <Btn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={13} /></Btn>
            <Btn title="Insert image" onClick={insertImage}><Image size={13} /></Btn>
            <Div />
            <Btn title="Link" active={editor.isActive('link')} onClick={() => {
              const prev = (editor.getAttributes('link').href as string) ?? '';
              const url = window.prompt('URL', prev);
              if (url === null) return;
              if (!url) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }}><Link2 size={13} /></Btn>
            <Btn title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}><Highlighter size={13} /></Btn>
            <Btn title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}><Eraser size={13} /></Btn>
          </div>
        </div>

        {/* Row 3: Font / size / colors / RTL + Page / Find / Templates + AI */}
        <div className="border-t border-slate-700/50 px-2 py-1 flex flex-wrap items-center gap-1 bg-slate-800/60">
          <select defaultValue=""
            onChange={e => { editor.chain().focus().setFontFamily(e.target.value).run(); e.target.value = ''; }}
            className="text-xs bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label="Font family">
            <option value="" disabled>Font…</option>
            {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select defaultValue=""
            onChange={e => { editor.chain().focus().setMark('textStyle', { fontSize: `${e.target.value}px` }).run(); e.target.value = ''; }}
            className="text-xs bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-[4.5rem]"
            aria-label="Font size">
            <option value="" disabled>Size…</option>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
          </select>
          <Div />
          <label title="Text color" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer flex items-center transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => colorRef.current?.click()}>
            <Palette size={13} />
            <input ref={colorRef} type="color" aria-label="Text color picker" title="Text color" className="w-0 h-0 opacity-0 absolute" defaultValue="#1a1a1a"
              onInput={e => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()} />
          </label>
          <label title="Highlight color" className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer flex items-center transition-colors" onMouseDown={e => e.preventDefault()} onClick={() => hlColorRef.current?.click()}>
            <Highlighter size={13} />
            <input ref={hlColorRef} type="color" aria-label="Highlight color picker" title="Highlight color" className="w-0 h-0 opacity-0 absolute" defaultValue="#fef08a"
              onInput={e => editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()} />
          </label>
          <Btn title="Toggle RTL / LTR" active={docRTL} onClick={() => setDocRTL(v => !v)}>
            <span className="text-xs font-mono">RTL</span>
          </Btn>
          <Div />
          <button type="button" title="Page settings" onClick={() => { setShowPageSettings(v => !v); setShowTemplates(false); }}
            className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors', showPageSettings ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-700')}>
            <Settings2 size={12} /> Page
          </button>
          <button type="button" title="Find and replace (Ctrl+H)" onClick={() => setShowFindReplace(v => !v)}
            className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors', showFindReplace ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-700')}>
            <Search size={12} /> Find
          </button>
          <button type="button" title="Load a template" onClick={() => { setShowTemplates(v => !v); setShowPageSettings(false); }}
            className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors', showTemplates ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-700')}>
            <FileText size={12} /> Templates
          </button>
          <div className="flex-1" />
          {(['improve', 'translate', 'summarize'] as const).map(action => (
            <button key={action} type="button"
              title={action === 'improve' ? 'Improve writing' : action === 'translate' ? 'Translate selection' : 'Summarize text'}
              disabled={isAiLoading} onClick={() => void handleAiAction(action)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-40 transition-colors">
              {isAiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {action === 'improve' ? 'Improve' : action === 'translate' ? 'Translate' : 'Summarize'}
            </button>
          ))}
        </div>

      </div>

      {/* ── Page Settings panel ───────────────────────────────────────────── */}
      {showPageSettings && (
        <div className="bg-slate-800/80 border-x border-slate-700 px-4 py-3 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Page Size</p>
            <div className="flex gap-1">
              {(['A4', 'A5', 'Letter'] as const).map(s => (
                <button key={s} type="button" onClick={() => setPageSize(s)}
                  className={cn('px-2 py-1 text-xs rounded', pageSize === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-700')}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Orientation</p>
            <div className="flex gap-1">
              {(['portrait', 'landscape'] as const).map(o => (
                <button key={o} type="button" onClick={() => setOrientation(o)}
                  className={cn('px-2 py-1 text-xs rounded capitalize', orientation === o ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-700')}>
                  {o === 'portrait' ? '📄 Portrait' : '🖼 Landscape'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Margins</p>
            <div className="flex gap-1">
              {(['narrow', 'normal', 'wide'] as const).map(m => (
                <button key={m} type="button" onClick={() => setMargin(m)}
                  className={cn('px-2 py-1 text-xs rounded capitalize', margin === m ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-700')}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Find & Replace panel ──────────────────────────────────────────── */}
      {showFindReplace && (
        <div className="bg-slate-800/80 border-x border-slate-700 px-3 py-2 flex flex-wrap gap-2 items-center">
          <input value={findText} onChange={e => setFindText(e.target.value)} placeholder="Find…"
            className="bg-slate-700 text-white text-sm rounded px-2 py-1 w-36 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label="Find text" onKeyDown={e => e.key === 'Enter' && handleFind()} />
          <input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with…"
            className="bg-slate-700 text-white text-sm rounded px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label="Replace text" onKeyDown={e => e.key === 'Enter' && handleReplace()} />
          <button type="button" title="Find" onClick={handleFind} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">Find</button>
          <button type="button" title="Replace all" onClick={handleReplace} className="text-xs px-2 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500">Replace All</button>
          <button type="button" title="Close find & replace" aria-label="Close find and replace" onClick={() => setShowFindReplace(false)} className="text-slate-400 hover:text-white ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Templates panel ──────────────────────────────────────────────── */}
      {showTemplates && (
        <div className="bg-slate-800/80 border-x border-slate-700 px-3 py-2 flex flex-wrap gap-2">
          {Object.entries(makeTemplates()).map(([key, tpl]) => (
            <button key={key} type="button" title={`Load ${tpl.label} template`}
              onClick={() => { editor.commands.setContent(tpl.content); setShowTemplates(false); toast.success(`Template "${tpl.label}" loaded`); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition-colors">
              <span>{tpl.icon}</span> {tpl.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Keyboard hint + page info ──────────────────────────────────────── */}
      <div className="bg-slate-800/30 border-x border-b border-slate-700 px-3 py-1 flex items-center justify-between">
        <span className="hidden md:inline text-xs text-slate-600">
          Ctrl+S Save .docx · Ctrl+B · Ctrl+I · Ctrl+U · Ctrl+Z · Ctrl+H · Ctrl+P
        </span>
        <span className="text-xs text-slate-600 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 inline-block" />
          {pageSize} · {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
        </span>
      </div>

      {/* ── White page area ───────────────────────────────────────────────── */}
      <div
        className="border border-t-0 border-slate-700 rounded-b-lg overflow-auto min-h-[600px] bg-[#eeeae4]"
        onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'h') { e.preventDefault(); setShowFindReplace(true); }
          if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); handlePrint(); }
        }}
      >
        <div
          ref={pageRef}
          dir={docRTL ? 'rtl' : 'ltr'}
          className={cn(
            'mx-auto my-8 shadow-xl rounded-sm overflow-hidden bg-white ring-1 ring-black/8',
            PAGE_DIM_CLASSES[pageSize][orientation],
            PADDING_CLASSES[margin],
          )}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-2 px-1 flex-wrap gap-2">
        <span className="text-xs text-slate-500">
          {wordCount.words} words · {wordCount.chars} chars · ~{Math.max(1, Math.ceil(wordCount.words / 200))} min read
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-[2px] [&::-webkit-scrollbar-thumb]:bg-slate-600">
          <button type="button" title="Download as Word document (Ctrl+S)" onClick={() => void handleExportDocx()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 hover:text-white hover:bg-slate-600 transition-all whitespace-nowrap">
            <Download size={12} /> .docx
          </button>
          <button type="button" title="Print document (Ctrl+P)" onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all whitespace-nowrap">
            <Printer size={12} /> Print
          </button>
          <button type="button" title="Download as PDF" onClick={handleExportPdf} disabled={isExporting}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all disabled:opacity-50 whitespace-nowrap">
            <Download size={12} />
            {isExporting ? 'Exporting…' : 'PDF'}
          </button>
          <button type="button" title="Download as plain text" onClick={handleExportTxt}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all whitespace-nowrap">
            <Download size={12} /> .txt
          </button>
          {onSave && (
            <button type="button" title="Save to Documents library" onClick={() => void handleSaveToDocuments()} disabled={isSaving}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-all disabled:opacity-50 shadow-sm shadow-cyan-500/20 whitespace-nowrap">
              <Save size={12} />
              {isSaving ? 'Saving…' : 'Save to Library'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
TextEditorTool.displayName = 'TextEditorTool';
