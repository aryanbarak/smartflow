import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  Eye,
  FolderOpen,
  Merge,
  Scissors,
  Minimize2,
  Scan,
  ImagePlus,
  PenLine,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatePanel } from "@/components/common/StatePanel";
import { SkeletonListItem } from "@/components/common/Skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocuments } from "@/features/documents/useDocuments";
import type { Document } from "@/features/documents/documentsService";
import { getDocumentSignedUrl } from "@/features/documents/getDocumentUrl";
import { PdfMerge } from "@/features/documents/components/PdfMerge";
import { PdfSplitTool } from "@/features/documents/components/PdfSplitTool";
import { PdfCompressTool } from "@/features/documents/components/PdfCompressTool";
import { PdfOcrTool } from "@/features/documents/components/PdfOcrTool";
import { ImageToPdfTool } from "@/features/documents/components/ImageToPdfTool";
import { TextEditorTool, type TextEditorHandle } from "@/features/documents/components/TextEditorTool";
import { AudioGeneratorTool } from "@/features/documents/components/AudioGeneratorTool";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function formatBytes(value: number | null) {
  if (!value && value !== 0) return "Unknown";
  if (value < 1024) return `${value} B`;
  const kb = value / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

function isPdf(mimeType: string | null, fileName: string) {
  return mimeType?.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
}

function isHtml(mimeType: string | null, fileName: string) {
  return mimeType === 'text/html' || mimeType?.includes('html') || fileName.toLowerCase().endsWith('.html');
}

function ToolCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function DocumentsPage() {
  const {
    documents,
    isLoading,
    isUploading,
    isDeleting,
    error,
    createFromUpload,
    updateMeta,
    remove,
    download,
  } = useDocuments();

  // Library tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("library");
  const editorRef = useRef<TextEditorHandle>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedDocs = useMemo(
    () =>
      (documents as Document[])
        .filter(Boolean)
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        }),
    [documents],
  );
  const isInitialLoading = isLoading && sortedDocs.length === 0;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const isPdfFile = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
    const isHtmlFile = file.type.includes("html") || file.name.toLowerCase().endsWith(".html");
    if (!isPdfFile && !isHtmlFile) {
      setFormError("Only PDF and HTML files are supported.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFormError("File size must be 20MB or less.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }
    setFormError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setFormError("Please choose a file.");
      return;
    }
    setFormError(null);
    await createFromUpload(selectedFile, {
      title: titleInput || null,
      description: descriptionInput || null,
    });
    setSelectedFile(null);
    setTitleInput("");
    setDescriptionInput("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget);
    setDeleteTarget(null);
  };

  const handleView = async (doc: Document) => {
    try {
      const { url } = await getDocumentSignedUrl(doc.storagePath);
      if (isHtml(doc.mimeType, doc.fileName)) {
        const res = await fetch(url);
        const html = await res.text();
        const win = window.open('', '_blank');
        if (!win) return;
        if (html.includes('<html')) {
          win.document.write(html);
        } else {
          win.document.write(`<!DOCTYPE html><html><head>
            <meta charset="utf-8">
            <title>${doc.title ?? 'Document'}</title>
            <style>
              body { font-family: Georgia, serif; max-width: 800px;
                     margin: 40px auto; padding: 20px; color: #1a1a1a;
                     line-height: 1.7; }
              h1 { font-size: 2em; } h2 { font-size: 1.5em; }
            </style>
          </head><body>${html}</body></html>`);
        }
        win.document.close();
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to open document.');
    }
  };

  const handleStartEdit = (doc: Document) => {
    setEditTarget(doc);
    setEditTitle(doc.title ?? doc.fileName);
    setEditDescription(doc.description ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    await updateMeta(editTarget.id, {
      title: editTitle.trim() || null,
      description: editDescription.trim() || null,
    });
    setEditTarget(null);
  };

  const handleOpenInEditor = async (doc: Document) => {
    try {
      const { url } = await getDocumentSignedUrl(doc.storagePath);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      let bodyContent = html;
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch?.[1]) bodyContent = bodyMatch[1].trim();
      if (!bodyContent || bodyContent.length < 5) bodyContent = '<p>Document appears to be empty.</p>';

      const title = doc.title ?? doc.fileName.replace(/\.html?$/i, '');
      setActiveTab('editor');
      editorRef.current?.loadFromLibrary(bodyContent, title);
    } catch (err) {
      console.error('[handleOpenInEditor] error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to open file in editor.');
    }
  };

  function DocList() {
    if (error)
      return (
        <StatePanel
          variant="error"
          title="Unable to load"
          description={error}
        />
      );
    if (isInitialLoading)
      return (
        <div className="space-y-3">
          {["sk-0", "sk-1", "sk-2", "sk-3"].map((id) => (
            <SkeletonListItem key={id} />
          ))}
        </div>
      );
    if (sortedDocs.length === 0)
      return (
        <StatePanel
          variant="empty"
          title="No documents yet"
          description="Upload your first PDF."
        />
      );
    return (
      <div className="space-y-2">
        {sortedDocs.map((doc) => (
          <div
            key={doc.id}
            className={cn(
              "w-full flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors text-left",
              "bg-secondary/40 border-border/60",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {doc.title ?? doc.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(doc.sizeBytes)} · {formatDate(doc.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {(doc.mimeType === 'text/html' ||
                doc.mimeType?.includes('html') ||
                doc.fileName?.toLowerCase().endsWith('.html')) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleOpenInEditor(doc)}
                >
                  <PenLine className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleView(doc)}
              >
                <Eye className="w-3.5 h-3.5 mr-1" /> View
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStartEdit(doc)}
              >
                Rename
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => download(doc)}
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Download
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(doc)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl lg:text-3xl font-semibold mb-1">Documents</h1>
        <p className="text-muted-foreground">
          Upload, manage, and transform your PDFs
        </p>
      </motion.div>

      <Tabs
        value={activeTab}
        className="space-y-6"
        onValueChange={setActiveTab}
      >
        {/* Scrollable tab list for 7 tabs */}
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max gap-0.5 h-auto p-1">
            <TabsTrigger
              value="library"
              className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <FolderOpen size={13} /> Library
            </TabsTrigger>
            <TabsTrigger
              value="merge"
              className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <Merge size={13} /> Merge PDFs
            </TabsTrigger>
            <TabsTrigger
              value="split"
              className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <Scissors size={13} /> Split PDF
            </TabsTrigger>
            <TabsTrigger
              value="compress"
              className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <Minimize2 size={13} /> Compress PDF
            </TabsTrigger>
            <TabsTrigger
              value="ocr"
              className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <Scan size={13} /> OCR
            </TabsTrigger>
            <TabsTrigger
              value="image-pdf"
              className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <ImagePlus size={13} /> Image → PDF
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <PenLine size={13} /> Text Editor
            </TabsTrigger>
            <TabsTrigger
              value="audio"
              className="flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm"
            >
              <Volume2 size={13} /> Audio
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Library Tab ───────────────────────────────────────────── */}
        <TabsContent value="library">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" /> Upload Document
                </CardTitle>
                <CardDescription>PDFs and HTML documents up to 20MB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <Input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf,text/html,.html"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Title (optional)"
                  disabled={isUploading}
                />
                <Textarea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Description (optional)"
                  rows={3}
                  disabled={isUploading}
                />
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading…
                    </>
                  ) : (
                    "Upload document"
                  )}
                </Button>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.name} — {formatBytes(selectedFile.size)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Your Files</CardTitle>
                <CardDescription>
                  {sortedDocs.length} document(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocList />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Merge PDFs Tab ────────────────────────────────────────── */}
        <TabsContent value="merge">
          <ToolCard
            title="Merge PDFs"
            description="Combine multiple PDF files into one. Drag to reorder."
            icon={<Merge className="w-4 h-4 text-primary" />}
          >
            <PdfMerge />
          </ToolCard>
        </TabsContent>

        {/* ── Split PDF Tab ──────────────────────────────────────────── */}
        <TabsContent value="split">
          <ToolCard
            title="Split PDF"
            description="Extract page ranges or split into equal chunks."
            icon={<Scissors className="w-4 h-4 text-primary" />}
          >
            <PdfSplitTool />
          </ToolCard>
        </TabsContent>

        {/* ── Compress PDF Tab ───────────────────────────────────────── */}
        <TabsContent value="compress">
          <ToolCard
            title="Compress PDF"
            description="Re-save with object stream optimization to reduce file size."
            icon={<Minimize2 className="w-4 h-4 text-primary" />}
          >
            <PdfCompressTool />
          </ToolCard>
        </TabsContent>

        {/* ── OCR Tab ────────────────────────────────────────────────── */}
        <TabsContent value="ocr">
          <ToolCard
            title="OCR — Extract Text"
            description="Use Gemini Vision to extract text from PDFs and images."
            icon={<Scan className="w-4 h-4 text-primary" />}
          >
            <PdfOcrTool
              onSave={(file, title) =>
                createFromUpload(file, { title: title ?? null })
              }
            />
          </ToolCard>
        </TabsContent>

        {/* ── Image → PDF Tab ────────────────────────────────────────── */}
        <TabsContent value="image-pdf">
          <ToolCard
            title="Image → PDF"
            description="Convert JPG, PNG, or WebP images into a single PDF. Drag to reorder."
            icon={<ImagePlus className="w-4 h-4 text-primary" />}
          >
            <ImageToPdfTool />
          </ToolCard>
        </TabsContent>

        {/* ── Text Editor Tab ────────────────────────────────────────── */}
        {/* ── Text Editor Tab ────────────────────────────────────────── */}
        <TabsContent
          value="editor"
          forceMount
          className={activeTab === "editor" ? "" : "hidden"}
        >
          <ToolCard
            title="Text Editor"
            description="Write and export documents as PDF or plain text."
            icon={<PenLine className="w-4 h-4 text-primary" />}
          >
            <TextEditorTool
              ref={editorRef}
              onSave={(file, title) =>
                createFromUpload(file, { title: title ?? null })
              }
            />
          </ToolCard>
        </TabsContent>

        {/* ── Audio Generator Tab ───────────────────────────────────────── */}
        <TabsContent value="audio">
          <ToolCard
            title="Audio Generator"
            description="Convert text to natural Persian, German, or English speech via ElevenLabs."
            icon={<Volume2 className="w-4 h-4 text-primary" />}
          >
            <AudioGeneratorTool />
          </ToolCard>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "
              {deleteTarget?.title ?? deleteTarget?.fileName}" from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit metadata dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label htmlFor="edit-doc-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="edit-doc-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-doc-desc" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="edit-doc-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
