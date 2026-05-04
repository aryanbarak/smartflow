import { supabase } from "@/integrations/supabase/client";
import { DOCUMENTS_BUCKET } from "@/features/documents/documentsService";

export async function getDocumentSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 10);
  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Failed to generate signed URL");
  }
  return { url: data.signedUrl };
}
