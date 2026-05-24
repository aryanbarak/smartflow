import { supabase } from "@/integrations/supabase/client";

const PHOTOS_API = "https://api.barakzai.cloud";

export interface Photo {
  id: string;
  userId: string;
  r2Key: string;
  thumbKey: string | null;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  takenAt: string | null;
  albumId: string | null;
  tags: string[];
  caption: string | null;
  createdAt: string;
}

export interface Album {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverPhotoId: string | null;
  createdAt: string;
}

export function photoUrl(key: string) {
  return `${PHOTOS_API}/photos/file?key=${encodeURIComponent(key)}`;
}

export function thumbUrl(photo: Photo) {
  return photo.thumbKey ? photoUrl(photo.thumbKey) : photoUrl(photo.r2Key);
}

const PHOTO_COLS =
  "id,user_id,r2_key,thumb_key,file_name,file_size,mime_type,width,height,taken_at,album_id,tags,caption,created_at";
const ALBUM_COLS = "id,user_id,name,description,cover_photo_id,created_at";

type Row = Record<string, unknown>;

function mapPhoto(row: Row): Photo {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    r2Key: String(row.r2_key),
    thumbKey: row.thumb_key != null ? String(row.thumb_key) : null,
    fileName: String(row.file_name),
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    mimeType: row.mime_type != null ? String(row.mime_type) : null,
    width: row.width != null ? Number(row.width) : null,
    height: row.height != null ? Number(row.height) : null,
    takenAt: row.taken_at != null ? String(row.taken_at) : null,
    albumId: row.album_id != null ? String(row.album_id) : null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    caption: row.caption != null ? String(row.caption) : null,
    createdAt: String(row.created_at),
  };
}

function mapAlbum(row: Row): Album {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    description: row.description != null ? String(row.description) : null,
    coverPhotoId: row.cover_photo_id != null ? String(row.cover_photo_id) : null,
    createdAt: String(row.created_at),
  };
}

export const photosService = {
  async listPhotos(userId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from("photos")
      .select(PHOTO_COLS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapPhoto(r as Row));
  },

  async insertPhoto(input: {
    userId: string;
    r2Key: string;
    thumbKey: string | null;
    fileName: string;
    fileSize: number | null;
    mimeType: string | null;
    width: number | null;
    height: number | null;
    albumId?: string | null;
    tags?: string[];
    caption?: string | null;
  }): Promise<Photo> {
    const { data, error } = await supabase
      .from("photos")
      .insert({
        user_id: input.userId,
        r2_key: input.r2Key,
        thumb_key: input.thumbKey,
        file_name: input.fileName,
        file_size: input.fileSize,
        mime_type: input.mimeType,
        width: input.width,
        height: input.height,
        taken_at: null,
        album_id: input.albumId ?? null,
        tags: input.tags ?? [],
        caption: input.caption ?? null,
      })
      .select(PHOTO_COLS)
      .single();
    if (error) throw error;
    return mapPhoto(data as Row);
  },

  async updatePhoto(
    id: string,
    patch: { caption?: string | null; tags?: string[]; albumId?: string | null },
  ): Promise<Photo> {
    const updates: Row = {};
    if (patch.caption !== undefined) updates.caption = patch.caption;
    if (patch.tags !== undefined) updates.tags = patch.tags;
    if (patch.albumId !== undefined) updates.album_id = patch.albumId;
    const { data, error } = await supabase
      .from("photos")
      .update(updates)
      .eq("id", id)
      .select(PHOTO_COLS)
      .single();
    if (error) throw error;
    return mapPhoto(data as Row);
  },

  async deletePhoto(id: string): Promise<void> {
    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) throw error;
  },
};

export const albumsService = {
  async listAlbums(userId: string): Promise<Album[]> {
    const { data, error } = await supabase
      .from("photo_albums")
      .select(ALBUM_COLS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapAlbum(r as Row));
  },

  async createAlbum(userId: string, name: string, description?: string): Promise<Album> {
    const { data, error } = await supabase
      .from("photo_albums")
      .insert({ user_id: userId, name, description: description ?? null })
      .select(ALBUM_COLS)
      .single();
    if (error) throw error;
    return mapAlbum(data as Row);
  },

  async updateAlbum(
    id: string,
    patch: { name?: string; description?: string | null; coverPhotoId?: string | null },
  ): Promise<Album> {
    const updates: Row = {};
    if (patch.name !== undefined) updates.name = patch.name;
    if (patch.description !== undefined) updates.description = patch.description;
    if (patch.coverPhotoId !== undefined) updates.cover_photo_id = patch.coverPhotoId;
    const { data, error } = await supabase
      .from("photo_albums")
      .update(updates)
      .eq("id", id)
      .select(ALBUM_COLS)
      .single();
    if (error) throw error;
    return mapAlbum(data as Row);
  },

  async deleteAlbum(id: string): Promise<void> {
    const { error } = await supabase.from("photo_albums").delete().eq("id", id);
    if (error) throw error;
  },
};
