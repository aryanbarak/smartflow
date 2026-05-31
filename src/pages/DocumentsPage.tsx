import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload, FileText, Download, Trash2, Loader2, Eye,
  FolderOpen, Merge, Sparkles, File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatePanel } from "@/components/common/StatePanel";
import { SkeletonListItem } from "@/components/common/Skeletons";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDocuments } from "@/features/documents/useDocuments";
import type { Document } from "@/features/documents/documentsService";
import { getDocumentSignedUrl } from "@/features/documents/getDocumentUrl";
import { PdfMerge } from "@/features/documents/components/PdfMerge";
import { DocumentSummary } from "@/features/documents/components/DocumentSummary";
import { DocumentTranslation } from "@/features/documents/components/DocumentTranslation";
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

// Extend Document type with optional AI fields returned from Supabase
type DocumentWithAi = Document & {
  summary?: string | null;
  key_points?: string[] | null;
  word_count?: number | null;
  summary_language?: string | null;
  summary_generated_at?: string | null;
  extracted_text?: string | null;
};

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
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [editTarget, setEditTarget] = useState<Document | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // AI Tools tab state
  const [aiDoc, setAiDoc] = useState<DocumentWithAi | null>(null);
  const [aiFile, setAiFile] = useState<File | null>(null);

  const sortedDocs = useMemo(
    () => (documents as DocumentWithAi[])
      .filter(doc => isPdf(doc.mimeType, doc.fileName))
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
    if (!file) { setSelectedFile(null); return; }
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setFormError("Only PDF files are supported.");
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
    if (!selectedFile) { setFormError("Please choose a file."); return; }
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
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to open PDF.");
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

  const handleAiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && (file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf"))) {
      setAiFile(file);
    }
  };

  const aiFileStatusText = aiFile ? `File loaded: ${aiFile.name}` : 'Load PDF for AI processing';

  // Shared document list for the library and AI selector
  function DocList({ onSelect }: { onSelect?: (doc: DocumentWithAi) => void }) {
    if (error) return <StatePanel variant="error" title="Unable to load" description={error} />;
    if (isInitialLoading) return (
      <div className="space-y-3">
        {['sk-0', 'sk-1', 'sk-2', 'sk-3'].map(id => <SkeletonListItem key={id} />)}
      </div>
    );
    if (sortedDocs.length === 0) return (
      <StatePanel variant="empty" title="No documents yet" description="Upload your first PDF." />
    );
    return (
      <div className="space-y-2">
        {sortedDocs.map(doc => {
          const rowClass = onSelect
            ? "cursor-pointer hover:bg-muted/50 border-border/60 bg-secondary/30"
            : "bg-secondary/40 border-border/60";
          const sharedClass = cn(
            "w-full flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors text-left",
            rowClass,
            aiDoc?.id === doc.id && "border-primary bg-primary/5",
          );
          const inner = (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title ?? doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(doc.sizeBytes)} · {formatDate(doc.createdAt)}
                    {doc.summary && <span className="ml-2 text-primary">✦ AI</span>}
                  </p>
                </div>
              </div>
              {!onSelect && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => handleView(doc)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleStartEdit(doc)}>
                    Rename
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => download(doc)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Download
                  </Button>
                  <Button
                    variant="destructive" size="sm"
                    disabled={isDeleting}
                    onClick={() => setDeleteTarget(doc)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </>
          );
          return onSelect ? (
            <button key={doc.id} type="button" className={sharedClass} onClick={() => onSelect(doc)}>
              {inner}
            </button>
          ) : (
            <div key={doc.id} className={sharedClass}>{inner}</div>
          );
        })}
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
        <p className="text-muted-foreground">Upload, merge, and analyze your PDFs</p>
      </motion.div>

      <Tabs defaultValue="library" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="library" className="flex items-center gap-1.5">
            <FolderOpen size={14} /> Library
          </TabsTrigger>
          <TabsTrigger value="merge" className="flex items-center gap-1.5">
            <Merge size={14} /> Merge PDFs
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-1.5">
            <Sparkles size={14} /> AI Tools
          </TabsTrigger>
        </TabsList>

        {/* ── Library Tab ───────────────────────────────────────────── */}
        <TabsContent value="library">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" /> Upload Document
                </CardTitle>
                <CardDescription>PDFs up to 20MB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <Input ref={inputRef} type="file" accept="application/pdf,.pdf"
                  onChange={handleFileChange} disabled={isUploading} />
                <Input value={titleInput} onChange={e => setTitleInput(e.target.value)}
                  placeholder="Title (optional)" disabled={isUploading} />
                <Textarea value={descriptionInput} onChange={e => setDescriptionInput(e.target.value)}
                  placeholder="Description (optional)" rows={3} disabled={isUploading} />
                <Button onClick={handleUpload} disabled={isUploading || !selectedFile} className="w-full">
                  {isUploading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Uploading…</> : "Upload document"}
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
                <CardDescription>{sortedDocs.length} document(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <DocList />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Merge PDFs Tab ────────────────────────────────────────── */}
        <TabsContent value="merge">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Merge className="w-4 h-4 text-primary" /> Merge PDFs
              </CardTitle>
              <CardDescription>
                Combine multiple PDF files into one. Drag to reorder pages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PdfMerge />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Tools Tab ──────────────────────────────────────────── */}
        <TabsContent value="tools">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Document selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" /> Select Document
                </CardTitle>
                <CardDescription>Click a document to analyze it with AI</CardDescription>
              </CardHeader>
              <CardContent>
                <DocList onSelect={doc => { setAiDoc(doc); setAiFile(null); }} />
              </CardContent>
            </Card>

            {/* AI panels */}
            <div className="space-y-4">
              {aiDoc ? (
                <>
                  <div className="bg-muted/30 rounded-xl px-4 py-3 flex items-center gap-3">
                    <FileText size={16} className="text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{aiDoc.title ?? aiDoc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(aiDoc.sizeBytes)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAiDoc(null); setAiFile(null); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  {/* File picker — needed for fresh extraction */}
                  <div className="border border-dashed border-border rounded-xl p-4 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <FileIcon size={12} />
                      {aiFileStatusText}
                    </p>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      aria-label="Load PDF file for AI processing"
                      onChange={handleAiFileChange}
                      className="text-xs text-muted-foreground file:mr-2 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-muted file:text-foreground file:text-xs hover:file:bg-muted/70 cursor-pointer"
                    />
                    {aiDoc.extracted_text && !aiFile && (
                      <p className="text-xs text-primary">
                        ✦ Cached text available — translation works without re-loading
                      </p>
                    )}
                  </div>

                  <DocumentSummary
                    document={{
                      id: aiDoc.id,
                      file_name: aiDoc.fileName,
                      summary: aiDoc.summary,
                      key_points: aiDoc.key_points,
                      word_count: aiDoc.word_count,
                      summary_language: aiDoc.summary_language,
                      summary_generated_at: aiDoc.summary_generated_at,
                    }}
                    file={aiFile}
                  />

                  <div className="border border-border rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Languages size={15} className="text-primary" />
                      <span className="text-sm font-medium">Translation</span>
                    </div>
                    <DocumentTranslation
                      document={{
                        id: aiDoc.id,
                        file_name: aiDoc.fileName,
                        extracted_text: aiDoc.extracted_text,
                      }}
                      file={aiFile}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3 border border-dashed border-border rounded-xl">
                  <Sparkles size={32} className="opacity-30" />
                  <p className="text-sm">Select a document from the list</p>
                  <p className="text-xs opacity-60">AI Summary + DeepL Translation</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.title ?? deleteTarget?.fileName}" from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit metadata dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label htmlFor="edit-doc-title" className="text-sm font-medium">Title</label>
              <Input id="edit-doc-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-doc-desc" className="text-sm font-medium">Description</label>
              <Textarea id="edit-doc-desc" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Languages(props: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size ?? 16} height={props.size ?? 16}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" />
      <path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" />
    </svg>
  );
}
