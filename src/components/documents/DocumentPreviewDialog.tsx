
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  ExternalLink,
  Loader2,
  Pencil,
  RotateCcw,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { getDocumentSignedUrl } from "@/features/documents/getDocumentUrl";
import { useToast } from "@/hooks/use-toast";

// Keep all pages mounted; overlays are per-page and must not collapse scroll layout.
// Text tool: click to edit, Enter=save, Esc=cancel, drag to move.
const DEBUG = false;
const DEBUG_TEXT = false;
let workerSrcUrl: string;
try {
  workerSrcUrl = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url,
  ).toString();
} catch {
  workerSrcUrl = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.js",
    import.meta.url,
  ).toString();
}
pdfjs.GlobalWorkerOptions.workerSrc = workerSrcUrl;

export interface DocumentPreviewItem {
  id: string;
  name: string;
  path: string;
  contentType: string | null;
  createdAt?: string;
  size?: number | null;
}

type Point = { x: number; y: number };
type ClientPointEvent = { clientX: number; clientY: number };

type StrokeStyle = {
  color: string;
  widthPct: number;
  opacity: number;
  blendMode: GlobalCompositeOperation;
};

type StrokeAnnotation = {
  id: string;
  type: "stroke";
  pageIndex: number;
  points: Point[];
  style: StrokeStyle;
};

type HighlightAnnotation = {
  id: string;
  type: "highlight";
  pageIndex: number;
  rect: { x: number; y: number; w: number; h: number };
  color: string;
  opacity: number;
};

type TextAnnotation = {
  id: string;
  type: "text";
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  fontFamily: "sans" | "serif" | "mono";
  bold: boolean;
  italic: boolean;
  background: boolean;
  createdAt: string;
  updatedAt?: string;
};

type Annotation = StrokeAnnotation | HighlightAnnotation | TextAnnotation;

type EditingText = {
  id?: string;
  pageIndex: number;
  x: number;
  y: number;
  value: string;
  fontSize: number;
  fontFamily: "sans" | "serif" | "mono";
  bold: boolean;
  italic: boolean;
  background: boolean;
  color: string;
  isNew: boolean;
  originalText?: string;
  originalFontSize?: number;
  originalFontFamily?: "sans" | "serif" | "mono";
  originalBold?: boolean;
  originalItalic?: boolean;
  originalBackground?: boolean;
  originalColor?: string;
};

type DragState = {
  id: string;
  pageIndex: number;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  snapshot: Annotation[];
  note: TextAnnotation;
};

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentPreviewItem | null;
}

function formatBytes(value: number | null | undefined) {
  if (!value && value !== 0) return "Unknown";
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  document,
}: DocumentPreviewDialogProps) {
  const { toast } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [viewMode, setViewMode] = useState<"single" | "scroll">("scroll");
  const [tool, setTool] = useState<"pan" | "draw" | "highlight" | "text">("pan");
  const [strokeColor, setStrokeColor] = useState("#36d399");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [textColor, setTextColor] = useState("#0f172a");
  const [textFontSize, setTextFontSize] = useState(16);
  const [textFontFamily, setTextFontFamily] = useState<"sans" | "serif" | "mono">("sans");
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textBackground, setTextBackground] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [currentStrokePage, setCurrentStrokePage] = useState<number | null>(null);
  const [currentHighlight, setCurrentHighlight] = useState<{
    pageIndex: number;
    start: Point;
    end: Point;
  } | null>(null);
  const [editingText, setEditingText] = useState<EditingText | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [pageSizes, setPageSizes] = useState<Record<number, { width: number; height: number }>>({});
  const pageContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const currentStrokeRef = useRef<Point[]>([]);
  const annotationsRef = useRef<Annotation[]>([]);
  const dragTextRef = useRef<DragState | null>(null);
  const lastTextOpenRef = useRef(0);
  const isHydratingRef = useRef(false);

  const docKey = useMemo(
    () => `${document?.id ?? ""}:${document?.path ?? ""}`,
    [document?.id, document?.path],
  );
  const documentPath = document?.path ?? null;
  const isPdf = useMemo(() => {
    if (!document) return false;
    if (document.contentType?.includes("pdf")) return true;
    return document.name.toLowerCase().endsWith(".pdf");
  }, [document]);
  const pdfFile = useMemo(
    () => (signedUrl ? { url: signedUrl } : null),
    [signedUrl],
  );
  const storageKey = useMemo(
    () => (document?.id ? `dailyflow:doc:${document.id}:annotations` : null),
    [document?.id],
  );
  const textPrefsKey = useMemo(
    () => (document?.id ? `dailyflow:doc:${document.id}:textPrefs` : null),
    [document?.id],
  );

  const logDebug = useCallback((...args: unknown[]) => {
    if (DEBUG) console.debug(...args);
  }, []);
  const logTextDebug = useCallback((...args: unknown[]) => {
    if (DEBUG_TEXT) console.debug(...args);
  }, []);

  const createAnnotationId = useCallback(
    () => `anno_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const pushUndoSnapshot = useCallback((snapshot: Annotation[]) => {
    setUndoStack((prev) => [...prev, snapshot]);
    setRedoStack([]);
  }, []);

  const commitAnnotations = useCallback((next: Annotation[]) => {
    pushUndoSnapshot(annotationsRef.current);
    setAnnotations(next);
  }, [pushUndoSnapshot]);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    if (tool === "text") {
      logTextDebug("[text] mode active");
    }
  }, [logTextDebug, tool]);

  useEffect(() => {
    if (!open || !documentPath) {
      setSignedUrl(null);
      setError(null);
      setScale(1);
      setNumPages(0);
      setPageNumber(1);
      setActivePage(1);
      setTool("pan");
      setIsDrawing(false);
      setCurrentStroke([]);
      setCurrentStrokePage(null);
      setCurrentHighlight(null);
      setEditingText(null);
      setSelectedTextId(null);
      setAnnotations([]);
      setUndoStack([]);
      setRedoStack([]);
      setIsLoading(false);
      isHydratingRef.current = false;
      return;
    }

    setSignedUrl(null);
    setError(null);
    setScale(1);
    setNumPages(0);
    setPageNumber(1);
    setActivePage(1);
    setTool("pan");
    setIsDrawing(false);
    setCurrentStroke([]);
    setCurrentStrokePage(null);
    setCurrentHighlight(null);
    setEditingText(null);
    setSelectedTextId(null);
    setAnnotations([]);
    setUndoStack([]);
    setRedoStack([]);
    if (isPdf) setViewMode("scroll");
  }, [open, docKey, documentPath, isPdf]);

  useEffect(() => {
    if (!open || !storageKey) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { annotations?: Annotation[] };
      if (!Array.isArray(parsed.annotations)) return;
      isHydratingRef.current = true;
      setAnnotations(parsed.annotations);
      setUndoStack([]);
      setRedoStack([]);
      logDebug("[anno] loaded", { key: storageKey, count: parsed.annotations.length });
      setTimeout(() => {
        isHydratingRef.current = false;
      }, 0);
    } catch (err) {
      logDebug("[anno] load failed", err);
    }
  }, [logDebug, open, storageKey]);

  useEffect(() => {
    if (!open || !storageKey) return;
    if (isHydratingRef.current) return;
    const handle = window.setTimeout(() => {
      const payload = { annotations };
      const json = JSON.stringify(payload);
      localStorage.setItem(storageKey, json);
      logDebug("[anno] saved", { key: storageKey, bytes: json.length });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [annotations, logDebug, open, storageKey]);

  useEffect(() => {
    if (!open || !textPrefsKey) return;
    const raw = localStorage.getItem(textPrefsKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        color?: string;
        fontSize?: number;
        fontFamily?: "sans" | "serif" | "mono";
        bold?: boolean;
        italic?: boolean;
        background?: boolean;
      };
      if (parsed.color) setTextColor(parsed.color);
      if (parsed.fontSize) setTextFontSize(parsed.fontSize);
      if (parsed.fontFamily) setTextFontFamily(parsed.fontFamily);
      if (typeof parsed.bold === "boolean") setTextBold(parsed.bold);
      if (typeof parsed.italic === "boolean") setTextItalic(parsed.italic);
      if (typeof parsed.background === "boolean") setTextBackground(parsed.background);
    } catch {
      // ignore invalid prefs
    }
  }, [open, textPrefsKey]);

  useEffect(() => {
    if (!textPrefsKey) return;
    const payload = JSON.stringify({
      color: textColor,
      fontSize: textFontSize,
      fontFamily: textFontFamily,
      bold: textBold,
      italic: textItalic,
      background: textBackground,
    });
    localStorage.setItem(textPrefsKey, payload);
  }, [textBackground, textBold, textColor, textFontFamily, textFontSize, textItalic, textPrefsKey]);

  useEffect(() => {
    setEditingText((prev) =>
      prev
        ? {
            ...prev,
            color: textColor,
            fontSize: textFontSize,
            fontFamily: textFontFamily,
            bold: textBold,
            italic: textItalic,
            background: textBackground,
          }
        : prev,
    );
  }, [textBackground, textBold, textColor, textFontFamily, textFontSize, textItalic]);

  const updatePageSize = useCallback((pageIndex: number) => {
    const container = pageContainerRefs.current[pageIndex];
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    setPageSizes((prev) => ({
      ...prev,
      [pageIndex]: { width: rect.width, height: rect.height },
    }));
  }, []);

  const getTextBox = useCallback(
    (note: TextAnnotation, size: { width: number; height: number }) => {
      const fontSizePx = note.fontSize * scale;
      const lines = note.text.split("\n");
      const maxChars = Math.max(...lines.map((line) => line.length), 1);
      const width = Math.min(260, Math.max(40, maxChars * fontSizePx * 0.6));
      const lineHeight = fontSizePx * 1.25;
      const height = lines.length * lineHeight;
      return { width, height, fontSizePx, lineHeight };
    },
    [scale],
  );

  const redrawPage = useCallback(
    (pageIndex: number) => {
      const canvas = canvasRefs.current[pageIndex];
      const size = pageSizes[pageIndex];
      if (!canvas || !size?.width || !size?.height) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, size.width, size.height);
      ctx.textBaseline = "top";

      const pageAnnotations = annotations.filter((anno) => anno.pageIndex === pageIndex);
      for (const anno of pageAnnotations) {
        if (anno.type === "stroke") {
          if (anno.points.length < 2) continue;
          ctx.globalAlpha = anno.style.opacity;
          ctx.globalCompositeOperation = anno.style.blendMode;
          ctx.strokeStyle = anno.style.color;
          ctx.lineWidth = anno.style.widthPct * size.width;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();
          anno.points.forEach((point, index) => {
            const x = point.x * size.width;
            const y = point.y * size.height;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }

        if (anno.type === "highlight") {
          ctx.globalAlpha = anno.opacity;
          ctx.globalCompositeOperation = "multiply";
          ctx.fillStyle = anno.color;
          ctx.fillRect(
            anno.rect.x * size.width,
            anno.rect.y * size.height,
            anno.rect.w * size.width,
            anno.rect.h * size.height,
          );
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }

        if (anno.type === "text") {
          const { fontSizePx, lineHeight } = getTextBox(anno, size);
          const resolvedFamily = anno.fontFamily ?? "sans";
          const fontFamily =
            resolvedFamily === "serif"
              ? "serif"
              : resolvedFamily === "mono"
                ? "monospace"
                : "system-ui, sans-serif";
          const fontWeight = anno.bold ? "700" : "400";
          const fontStyle = anno.italic ? "italic" : "normal";
          ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`;
          const lines = anno.text.split("\n");
          const paddingX = 4;
          const paddingY = 2;
          if (anno.background) {
            ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
            lines.forEach((line, idx) => {
              const metrics = ctx.measureText(line || " ");
              const x = anno.x * size.width;
              const y = anno.y * size.height + idx * lineHeight;
              ctx.fillRect(
                x - paddingX,
                y - paddingY,
                metrics.width + paddingX * 2,
                lineHeight + paddingY * 2,
              );
            });
          }
          ctx.fillStyle = anno.color;
          lines.forEach((line, idx) => {
            ctx.fillText(
              line,
              anno.x * size.width,
              anno.y * size.height + idx * lineHeight,
            );
          });
        }
      }

      if (tool === "draw" && isDrawing && currentStrokePage === pageIndex && currentStrokeRef.current.length > 1) {
        const widthPct = strokeWidth / size.width;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = widthPct * size.width;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        currentStrokeRef.current.forEach((point, index) => {
          const x = point.x * size.width;
          const y = point.y * size.height;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      if (tool === "highlight" && isDrawing && currentHighlight?.pageIndex === pageIndex) {
        const rect = currentHighlight;
        const x = Math.min(rect.start.x, rect.end.x);
        const y = Math.min(rect.start.y, rect.end.y);
        const w = Math.abs(rect.start.x - rect.end.x);
        const h = Math.abs(rect.start.y - rect.end.y);
        ctx.globalAlpha = 0.28;
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = strokeColor;
        ctx.fillRect(x * size.width, y * size.height, w * size.width, h * size.height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
    },
    [
      annotations,
      currentHighlight,
      currentStrokePage,
      getTextBox,
      isDrawing,
      pageSizes,
      strokeColor,
      strokeWidth,
      tool,
    ],
  );

  useEffect(() => {
    Object.keys(pageSizes).forEach((pageKey) => {
      const pageIndex = Number(pageKey);
      if (Number.isNaN(pageIndex)) return;
      const canvas = canvasRefs.current[pageIndex];
      const size = pageSizes[pageIndex];
      if (!canvas || !size?.width || !size?.height) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(size.width * dpr);
      canvas.height = Math.round(size.height * dpr);
      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawPage(pageIndex);
    });
  }, [pageSizes, redrawPage]);

  useEffect(() => {
    Object.keys(pageSizes).forEach((pageKey) => {
      const pageIndex = Number(pageKey);
      if (Number.isNaN(pageIndex)) return;
      redrawPage(pageIndex);
    });
  }, [annotations, currentStroke, currentHighlight, pageSizes, redrawPage]);

  useEffect(() => {
    currentStrokeRef.current = currentStroke;
  }, [currentStroke]);

  useEffect(() => {
    setEditingText(null);
  }, [pageNumber, tool, viewMode]);

  useEffect(() => {
    if (activePage !== pageNumber) {
      setPageNumber(activePage);
    }
  }, [activePage, pageNumber]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const pageIndex = Number(entry.target.getAttribute("data-page"));
        if (Number.isNaN(pageIndex)) return;
        updatePageSize(pageIndex);
      });
    });
    Object.entries(pageContainerRefs.current).forEach(([pageKey, node]) => {
      if (!node) return;
      node.setAttribute("data-page", pageKey);
      observer.observe(node);
    });
    return () => observer.disconnect();
  }, [updatePageSize, numPages, viewMode]);

  useEffect(() => {
    if (!open || !documentPath) return;
    let alive = true;
    const controller = new AbortController();
    setIsLoading(true);

    const loadPreview = async () => {
      try {
        const { url } = await getDocumentSignedUrl(documentPath);
        if (!alive) return;
        setSignedUrl(url);
        setError(null);
      } catch (err) {
        if (!alive) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        toast({
          variant: "destructive",
          title: "Failed to load preview",
          description: message,
        });
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void loadPreview();
    return () => {
      alive = false;
      controller.abort();
    };
  }, [documentPath, open, toast]);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const next = prev[prev.length - 1];
      setRedoStack((redoPrev) => [...redoPrev, annotationsRef.current]);
      setAnnotations(next);
      logDebug("[undo]", { count: next.length });
      return prev.slice(0, -1);
    });
  }, [logDebug]);

  const handleRedo = useCallback(() => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const next = prev[prev.length - 1];
      setUndoStack((undoPrev) => [...undoPrev, annotationsRef.current]);
      setAnnotations(next);
      logDebug("[redo]", { count: next.length });
      return prev.slice(0, -1);
    });
  }, [logDebug]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const isCmd = event.metaKey || event.ctrlKey;
      if (isCmd) {
        if (event.key.toLowerCase() === "z") {
          event.preventDefault();
          if (event.shiftKey) handleRedo();
          else handleUndo();
          return;
        }
        if (event.key.toLowerCase() === "y") {
          event.preventDefault();
          handleRedo();
          return;
        }
      }
      if (tool === "text" && selectedTextId && (event.key === "Backspace" || event.key === "Delete")) {
        event.preventDefault();
        const snapshot = annotationsRef.current;
        const next = snapshot.filter((anno) => anno.id !== selectedTextId);
        pushUndoSnapshot(snapshot);
        setAnnotations(next);
        setSelectedTextId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRedo, handleUndo, pushUndoSnapshot, selectedTextId, tool]);

  const handleDownload = () => {
    if (!signedUrl) return;
    const link = document?.name ?? "document";
    const a = window.document.createElement("a");
    a.href = signedUrl;
    a.download = link;
    a.target = "_blank";
    a.rel = "noreferrer";
    window.document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const getNormalizedPoint = (event: ClientPointEvent, pageIndex: number) => {
    const container = pageContainerRefs.current[pageIndex];
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  const openTextEditor = useCallback(
    (payload: EditingText) => {
      logTextDebug("[text] open editor", payload);
      setEditingText(payload);
      setSelectedTextId(payload.id ?? null);
    },
    [logTextDebug],
  );

  const commitTextEdit = useCallback(() => {
    if (!editingText) return;
    const trimmed = editingText.value.trim();
    const snapshot = annotationsRef.current;

    if (editingText.isNew) {
      if (!trimmed) {
        setEditingText(null);
        return;
      }
      const newAnno: TextAnnotation = {
        id: createAnnotationId(),
        type: "text",
        pageIndex: editingText.pageIndex,
        x: editingText.x,
        y: editingText.y,
        text: trimmed,
        color: editingText.color,
        fontSize: editingText.fontSize,
        fontFamily: editingText.fontFamily,
        bold: editingText.bold,
        italic: editingText.italic,
        background: editingText.background,
        createdAt: new Date().toISOString(),
      };
      commitAnnotations([...snapshot, newAnno]);
      setSelectedTextId(newAnno.id);
      setEditingText(null);
      return;
    }

    const targetId = editingText.id;
    if (!targetId) {
      setEditingText(null);
      return;
    }

    if (!trimmed) {
      const next = snapshot.filter((anno) => anno.id !== targetId);
      pushUndoSnapshot(snapshot);
      setAnnotations(next);
      setSelectedTextId(null);
      setEditingText(null);
      return;
    }

    const next = snapshot.map((anno) => {
      if (anno.id !== targetId || anno.type !== "text") return anno;
      return {
        ...anno,
        text: trimmed,
        color: editingText.color,
        fontSize: editingText.fontSize,
        fontFamily: editingText.fontFamily,
        bold: editingText.bold,
        italic: editingText.italic,
        background: editingText.background,
        updatedAt: new Date().toISOString(),
      };
    });
    pushUndoSnapshot(snapshot);
    setAnnotations(next);
    setEditingText(null);
  }, [commitAnnotations, createAnnotationId, editingText, pushUndoSnapshot]);

  const cancelTextEdit = useCallback(() => {
    if (!editingText) return;
    setEditingText(null);
  }, [editingText]);

  const handleTextCreate = useCallback(
    (event: ClientPointEvent, pageIndex: number) => {
      if (tool !== "text") return;
      const now = performance.now();
      if (now - lastTextOpenRef.current < 200) return;
      lastTextOpenRef.current = now;
      if (activePage !== pageIndex) setActivePage(pageIndex);
      updatePageSize(pageIndex);
      logTextDebug("[text] container click", {
        pageIndex,
        clientX: event.clientX,
        clientY: event.clientY,
      });
      const point = getNormalizedPoint(event, pageIndex);
      if (!point) return;
      logTextDebug("[text] normalized", point);
      openTextEditor({
        pageIndex,
        x: point.x,
        y: point.y,
        value: "",
        fontSize: textFontSize,
        fontFamily: textFontFamily,
        bold: textBold,
        italic: textItalic,
        background: textBackground,
        color: textColor,
        isNew: true,
      });
    },
    [
      activePage,
      getNormalizedPoint,
      logTextDebug,
      openTextEditor,
      textBackground,
      textBold,
      textColor,
      textFontFamily,
      textFontSize,
      textItalic,
      tool,
      updatePageSize,
    ],
  );

  const handleTextPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, note: TextAnnotation, size: { width: number; height: number }) => {
      if (tool !== "text") return;
      if (editingText?.id === note.id) return;
      event.stopPropagation();
      setSelectedTextId(note.id);
      dragTextRef.current = {
        id: note.id,
        pageIndex: note.pageIndex,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: note.x,
        originY: note.y,
        moved: false,
        snapshot: annotationsRef.current,
        note,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [editingText?.id, tool],
  );

  const handleTextPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, size: { width: number; height: number }) => {
      const drag = dragTextRef.current;
      if (!drag) return;
      if (drag.pointerId !== event.pointerId) return;
      const deltaX = (event.clientX - drag.startX) / size.width;
      const deltaY = (event.clientY - drag.startY) / size.height;
      if (Math.abs(deltaX) > 0.001 || Math.abs(deltaY) > 0.001) drag.moved = true;
      const nextX = Math.max(0, Math.min(1, drag.originX + deltaX));
      const nextY = Math.max(0, Math.min(1, drag.originY + deltaY));
      setAnnotations((prev) =>
        prev.map((anno) =>
          anno.id === drag.id && anno.type === "text"
            ? { ...anno, x: nextX, y: nextY, updatedAt: new Date().toISOString() }
            : anno,
        ),
      );
    },
    [],
  );

  const handleTextPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragTextRef.current;
    if (!drag) return;
    if (drag.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved) {
      pushUndoSnapshot(drag.snapshot);
    } else if (tool === "text") {
      const note = drag.note;
      const noteFontFamily = note.fontFamily ?? "sans";
      const noteBold = !!note.bold;
      const noteItalic = !!note.italic;
      const noteBackground = !!note.background;
      setTextColor(note.color);
      setTextFontSize(note.fontSize);
      setTextFontFamily(noteFontFamily);
      setTextBold(noteBold);
      setTextItalic(noteItalic);
      setTextBackground(noteBackground);
      openTextEditor({
        id: note.id,
        pageIndex: note.pageIndex,
        x: note.x,
        y: note.y,
        value: note.text,
        fontSize: note.fontSize,
        fontFamily: noteFontFamily,
        bold: noteBold,
        italic: noteItalic,
        background: noteBackground,
        color: note.color,
        isNew: false,
        originalText: note.text,
        originalFontSize: note.fontSize,
        originalFontFamily: noteFontFamily,
        originalBold: noteBold,
        originalItalic: noteItalic,
        originalBackground: noteBackground,
        originalColor: note.color,
      });
    }
    dragTextRef.current = null;
  }, [
    openTextEditor,
    pushUndoSnapshot,
    setTextBackground,
    setTextBold,
    setTextFontFamily,
    setTextFontSize,
    setTextItalic,
    setTextColor,
    tool,
  ]);

  const handleClear = () => {
    commitAnnotations([]);
    setSelectedTextId(null);
    setEditingText(null);
  };

  if (!document) return null;

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>, pageIndex: number) => {
    if (tool !== "draw" && tool !== "highlight") return;
    if (activePage !== pageIndex) {
      setActivePage(pageIndex);
      logDebug("[preview] activePage=", pageIndex);
    }
    const point = getNormalizedPoint(event, pageIndex);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    if (tool === "draw") {
      setCurrentStrokePage(pageIndex);
      setCurrentStroke([point]);
    }
    if (tool === "highlight") {
      setCurrentHighlight({ pageIndex, start: point, end: point });
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>, pageIndex: number) => {
    if (!isDrawing) return;
    if (tool === "draw" && currentStrokePage === pageIndex) {
      const point = getNormalizedPoint(event, pageIndex);
      if (!point) return;
      setCurrentStroke((prev) => [...prev, point]);
    }
    if (tool === "highlight" && currentHighlight?.pageIndex === pageIndex) {
      const point = getNormalizedPoint(event, pageIndex);
      if (!point) return;
      setCurrentHighlight((prev) => (prev ? { ...prev, end: point } : prev));
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>, pageIndex: number) => {
    if (!isDrawing) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDrawing(false);
    if (tool === "draw" && currentStrokePage === pageIndex) {
      if (currentStroke.length > 1) {
        const style: StrokeStyle = {
          color: strokeColor,
          widthPct: strokeWidth / (pageSizes[pageIndex]?.width || 1),
          opacity: 1,
          blendMode: "source-over",
        };
        const stroke: StrokeAnnotation = {
          id: createAnnotationId(),
          type: "stroke",
          pageIndex,
          points: currentStroke,
          style,
        };
        commitAnnotations([...annotationsRef.current, stroke]);
      }
      setCurrentStroke([]);
      setCurrentStrokePage(null);
    }
    if (tool === "highlight" && currentHighlight?.pageIndex === pageIndex) {
      const start = currentHighlight.start;
      const end = currentHighlight.end;
      const rect = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        w: Math.abs(start.x - end.x),
        h: Math.abs(start.y - end.y),
      };
      if (rect.w > 0 && rect.h > 0) {
        const highlight: HighlightAnnotation = {
          id: createAnnotationId(),
          type: "highlight",
          pageIndex,
          rect,
          color: strokeColor,
          opacity: 0.28,
        };
        commitAnnotations([...annotationsRef.current, highlight]);
      }
      setCurrentHighlight(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>{document.name}</DialogTitle>
          <div className="text-xs text-muted-foreground">
            {formatBytes(document.size)} · {formatDate(document.createdAt)}
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2 border border-border/60 rounded-md px-3 py-2">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setScale(1)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {isPdf && viewMode === "single" && numPages > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="secondary" size="icon" onClick={() => setPageNumber((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>
                Page {pageNumber} / {numPages || 1}
              </span>
              <Button variant="secondary" size="icon" onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" disabled={!signedUrl} onClick={() => signedUrl && window.open(signedUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={handleDownload} disabled={!signedUrl}>
              <Download className="w-4 h-4" />
            </Button>
            {isPdf && (
              <Button variant="secondary" size="sm" onClick={handleUndo} disabled={!canUndo}>
                Undo
              </Button>
            )}
            {isPdf && (
              <Button variant="secondary" size="sm" onClick={handleRedo} disabled={!canRedo}>
                Redo
              </Button>
            )}
            {isPdf && (
              <Button
                variant={tool === "draw" ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  setTool((value) => (value === "draw" ? "pan" : "draw"));
                  setIsDrawing(false);
                  logDebug("[preview] mode=", "draw");
                }}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Draw
              </Button>
            )}
            {isPdf && (
              <Button
                variant={tool === "highlight" ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  setTool((value) => (value === "highlight" ? "pan" : "highlight"));
                  setIsDrawing(false);
                  logDebug("[preview] mode=", "highlight");
                }}
              >
                Highlight
              </Button>
            )}
            {(tool === "draw" || tool === "highlight") && (
              <div className="flex items-center gap-1">
                {"#36d399,#60a5fa,#f97316".split(",").map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-5 w-5 rounded-full border border-border"
                    style={{
                      backgroundColor: color,
                      outline: strokeColor === color ? "2px solid var(--ring)" : "none",
                    }}
                    onClick={() => setStrokeColor(color)}
                    aria-label={`Set color ${color}`}
                  />
                ))}
                <Button variant={strokeWidth === 2 ? "default" : "secondary"} size="sm" onClick={() => setStrokeWidth(2)}>
                  S
                </Button>
                <Button variant={strokeWidth === 4 ? "default" : "secondary"} size="sm" onClick={() => setStrokeWidth(4)}>
                  M
                </Button>
                <Button variant={strokeWidth === 6 ? "default" : "secondary"} size="sm" onClick={() => setStrokeWidth(6)}>
                  L
                </Button>
              </div>
            )}
            {isPdf && (
              <Button
                variant={tool === "text" ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  setTool((value) => (value === "text" ? "pan" : "text"));
                  setIsDrawing(false);
                  logDebug("[preview] mode=", "text");
                }}
              >
                <Type className="w-4 h-4 mr-1" />
                Text
              </Button>
            )}
            {tool === "text" && (
              <div className="flex items-center gap-1">
                {"#0f172a,#1f2937,#2563eb,#dc2626,#16a34a,#f59e0b".split(",").map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-5 w-5 rounded-full border border-border"
                    style={{
                      backgroundColor: color,
                      outline: textColor === color ? "2px solid var(--ring)" : "none",
                    }}
                    onClick={() => setTextColor(color)}
                    aria-label={`Set text color ${color}`}
                  />
                ))}
                <select
                  className="h-7 rounded border border-border bg-background px-2 text-xs"
                  value={textFontSize}
                  onChange={(event) => setTextFontSize(Number(event.target.value))}
                >
                  {[12, 14, 16, 18, 24, 32, 40, 48].map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
                <select
                  className="h-7 rounded border border-border bg-background px-2 text-xs"
                  value={textFontFamily}
                  onChange={(event) => setTextFontFamily(event.target.value as "sans" | "serif" | "mono")}
                >
                  <option value="sans">Sans</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>
                <Button
                  variant={textBold ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setTextBold((prev) => !prev)}
                >
                  B
                </Button>
                <Button
                  variant={textItalic ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setTextItalic((prev) => !prev)}
                >
                  I
                </Button>
                <Button
                  variant={textBackground ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setTextBackground((prev) => !prev)}
                >
                  BG
                </Button>
              </div>
            )}
            {isPdf && (
              <Button variant="secondary" size="sm" onClick={handleClear}>
                <Eraser className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {tool === "text" && (
          <div className="mt-1 text-xs text-muted-foreground">
            Text mode: click to place text. Enter=save, Esc=cancel.
          </div>
        )}

        <div className="min-h-[60vh] max-h-[75vh] overflow-auto rounded-md border border-border/60 bg-muted/20">
          <div className="p-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading preview...
              </div>
            )}
            {!isLoading && error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            {!isLoading && !error && signedUrl && isPdf && pdfFile && (
              <div className="w-full">
                <Document
                  key={docKey}
                  file={pdfFile}
                  onLoadSuccess={(pdf) => {
                    setNumPages(pdf.numPages);
                    setPageNumber((p) => Math.min(Math.max(1, p), pdf.numPages));
                    logDebug("[preview] numPages=", pdf.numPages);
                  }}
                  onSourceError={(err) => setError(err instanceof Error ? err.message : String(err))}
                  onLoadError={(err) => setError(err instanceof Error ? err.message : String(err))}
                >
                  {numPages > 0 &&
                    Array.from({ length: numPages }, (_, index) => {
                      const pageIndex = index + 1;
                      const isHidden = viewMode === "single" && pageIndex !== pageNumber;
                      const size = pageSizes[pageIndex];
                      const pageNotes = annotations.filter(
                        (anno) => anno.type === "text" && anno.pageIndex === pageIndex,
                      ) as TextAnnotation[];
                      return (
                        <div
                          key={`page:${docKey}:${pageIndex}`}
                          ref={(node) => {
                            pageContainerRefs.current[pageIndex] = node;
                          }}
                          className="relative inline-block my-3"
                          style={{
                            display: isHidden ? "none" : "inline-block",
                            cursor: tool === "text" ? "text" : "default",
                          }}
                          onPointerDown={(event) => {
                            if ((event.target as HTMLElement).closest("[data-text-hitbox]")) return;
                            handleTextCreate(event, pageIndex);
                          }}
                          onClick={(event) => {
                            if ((event.target as HTMLElement).closest("[data-text-hitbox]")) return;
                            handleTextCreate(event, pageIndex);
                          }}
                        >
                          <Page
                            pageNumber={pageIndex}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            onRenderSuccess={() => updatePageSize(pageIndex)}
                          />
                          {pageNotes.map((note) => {
                            if (!size) return null;
                            const { width, height } = getTextBox(note, size);
                            const isSelected = selectedTextId === note.id;
                            return (
                              <div
                                key={note.id}
                                data-text-hitbox
                                className="absolute z-20 rounded"
                                style={{
                                  left: `${note.x * size.width}px`,
                                  top: `${note.y * size.height}px`,
                                  width: `${width}px`,
                                  height: `${height}px`,
                                  border: isSelected ? "1px solid var(--ring)" : "1px solid transparent",
                                  backgroundColor: isSelected ? "rgba(59, 130, 246, 0.08)" : "transparent",
                                  pointerEvents: tool === "text" ? "auto" : "none",
                                  cursor: tool === "text" ? "move" : "default",
                                }}
                                onPointerDown={(event) => handleTextPointerDown(event, note, size)}
                                onPointerMove={(event) => handleTextPointerMove(event, size)}
                                onPointerUp={handleTextPointerUp}
                                onDoubleClick={(event) => {
                                  event.stopPropagation();
                                  const noteFontFamily = note.fontFamily ?? "sans";
                                  const noteBold = !!note.bold;
                                  const noteItalic = !!note.italic;
                                  const noteBackground = !!note.background;
                                  setTextColor(note.color);
                                  setTextFontSize(note.fontSize);
                                  setTextFontFamily(noteFontFamily);
                                  setTextBold(noteBold);
                                  setTextItalic(noteItalic);
                                  setTextBackground(noteBackground);
                                  openTextEditor({
                                    id: note.id,
                                    pageIndex,
                                    x: note.x,
                                    y: note.y,
                                    value: note.text,
                                    fontSize: note.fontSize,
                                    fontFamily: noteFontFamily,
                                    bold: noteBold,
                                    italic: noteItalic,
                                    background: noteBackground,
                                    color: note.color,
                                    isNew: false,
                                    originalText: note.text,
                                    originalFontSize: note.fontSize,
                                    originalFontFamily: noteFontFamily,
                                    originalBold: noteBold,
                                    originalItalic: noteItalic,
                                    originalBackground: noteBackground,
                                    originalColor: note.color,
                                  });
                                }}
                              />
                            );
                          })}
                          {editingText && editingText.pageIndex === pageIndex && size && (() => {
                            const editWidth = Math.min(260, Math.max(140, size.width - 16));
                            const left = Math.min(
                              Math.max(0, editingText.x * size.width),
                              Math.max(0, size.width - editWidth),
                            );
                            const top = Math.min(
                              Math.max(0, editingText.y * size.height),
                              Math.max(0, size.height - 32),
                            );
                            logTextDebug("[text] editor render", {
                              pageIndex,
                              left,
                              top,
                              width: editWidth,
                            });
                            return (
                              <textarea
                                autoFocus
                                className="absolute z-30 rounded border border-border bg-white px-2 py-1 text-xs shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                style={{
                                  left: `${left}px`,
                                  top: `${top}px`,
                                  width: `${editWidth}px`,
                                  fontSize: `${editingText.fontSize * scale}px`,
                                  fontFamily:
                                    editingText.fontFamily === "serif"
                                      ? "serif"
                                      : editingText.fontFamily === "mono"
                                        ? "monospace"
                                        : "system-ui, sans-serif",
                                  fontWeight: editingText.bold ? 700 : 400,
                                  fontStyle: editingText.italic ? "italic" : "normal",
                                  color: editingText.color,
                                  caretColor: editingText.color,
                                  WebkitTextFillColor: editingText.color,
                                  backgroundColor: editingText.background
                                    ? "rgba(15, 23, 42, 0.18)"
                                    : "white",
                                }}
                                value={editingText.value}
                                onChange={(event) =>
                                  setEditingText((prev) =>
                                    prev ? { ...prev, value: event.target.value } : prev,
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    commitTextEdit();
                                  }
                                  if (event.key === "Escape") {
                                    event.preventDefault();
                                    cancelTextEdit();
                                  }
                                }}
                                onBlur={commitTextEdit}
                              />
                            );
                          })()}
                          <canvas
                            ref={(node) => {
                              canvasRefs.current[pageIndex] = node;
                            }}
                            className="absolute inset-0 z-10"
                            style={{
                              pointerEvents: tool === "draw" || tool === "highlight" ? "auto" : "none",
                              cursor: tool === "text" ? "text" : tool === "pan" ? "default" : "crosshair",
                            }}
                            onPointerDown={(event) => handlePointerDown(event, pageIndex)}
                            onPointerMove={(event) => handlePointerMove(event, pageIndex)}
                            onPointerUp={(event) => handlePointerUp(event, pageIndex)}
                            onPointerCancel={(event) => handlePointerUp(event, pageIndex)}
                          />
                        </div>
                      );
                    })}
                </Document>
              </div>
            )}
            {!isLoading && !error && signedUrl && !isPdf && (
              <div className="text-sm text-muted-foreground">
                Preview supports PDFs only.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Manual test checklist:
// - open doc, draw on page 1, go page 2, draw, go back page 1: both exist
// - reload page: annotations persist
// - zoom in/out: overlays align
// - undo/redo across pages works
