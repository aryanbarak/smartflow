import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const DOCUMENTS_BUCKET =
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "documents";

export interface Document {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  title: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

function mapRow(row: DocumentRow): Document {
  return {
    id: row.id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id,storage_path,file_name,mime_type,size_bytes,title,description,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapRow(row as DocumentRow));
}

export async function createDocument(meta: {
  storagePath: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  title?: string | null;
  description?: string | null;
}): Promise<Document> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message || "Not authenticated");
  }
  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: userData.user.id,
      storage_path: meta.storagePath,
      file_name: meta.fileName,
      mime_type: meta.mimeType ?? null,
      size_bytes: meta.sizeBytes ?? null,
      title: meta.title ?? null,
      description: meta.description ?? null,
    })
    .select("id,storage_path,file_name,mime_type,size_bytes,title,description,created_at,updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create document");
  return mapRow(data as DocumentRow);
}

export async function updateDocument(
  id: string,
  patch: { title?: string | null; description?: string | null },
): Promise<Document> {
  const { data, error } = await supabase
    .from("documents")
    .update({
      title: patch.title === undefined ? undefined : patch.title,
      description: patch.description === undefined ? undefined : patch.description,
    })
    .eq("id", id)
    .select("id,storage_path,file_name,mime_type,size_bytes,title,description,created_at,updated_at")
    .single();
  if (error || !data) throw error ?? new Error("Failed to update document");
  return mapRow(data as DocumentRow);
}

export async function deleteDocument(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (error || !data) throw error ?? new Error("Failed to fetch document path");
  const storagePath = (data as { storage_path: string }).storage_path;
  const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
  if (storageError) throw storageError;
  const { error: deleteError } = await supabase.from("documents").delete().eq("id", id);
  if (deleteError) throw deleteError;
}

export async function uploadToStorage(
  userId: string,
  file: File,
): Promise<{ storagePath: string; fileName: string }> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const baseName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9؀-ۿ._-]/g, '_')
    .slice(0, 60);
  const safeName = `${baseName}_${ts}.${ext}`;
  const storagePath = `${userId}/${safeName}`;

  console.log('[uploadToStorage] uploading:', { storagePath, mimeType: file.type, size: file.size });

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) {
    console.error('[uploadToStorage] error:', error);
    throw error;
  }

  console.log('[uploadToStorage] success:', storagePath);
  return { storagePath, fileName: safeName };
}

export async function downloadDocument(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(storagePath);
  if (error || !data) throw error ?? new Error("Failed to download file");
  return data;
}

