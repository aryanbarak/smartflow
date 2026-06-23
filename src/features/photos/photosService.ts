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
  location: string | null;
  isFavorite: boolean;
  memoryDate: string | null;
  createdAt: string;
}

export type PhotoPatch = {
  caption?: string | null;
  tags?: string[];
  albumId?: string | null;
  location?: string | null;
};

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
  "id,user_id,r2_key,thumb_key,file_name,file_size,mime_type,width,height,taken_at,album_id,tags,caption,location,is_favorite,memory_date,created_at";
const ALBUM_COLS = "id,user_id,name,description,cover_photo_id,created_at";

type Row = Record<string, unknown>;

function s(v: unknown): string { return v as string; }
function sn(v: unknown): string | null { return v == null ? null : v as string; }
function nn(v: unknown): number | null { return v == null ? null : v as number; }

function mapPhoto(row: Row): Photo {
  return {
    id: s(row.id),
    userId: s(row.user_id),
    r2Key: s(row.r2_key),
    thumbKey: sn(row.thumb_key),
    fileName: s(row.file_name),
    fileSize: nn(row.file_size),
    mimeType: sn(row.mime_type),
    width: nn(row.width),
    height: nn(row.height),
    takenAt: sn(row.taken_at),
    albumId: sn(row.album_id),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    caption: sn(row.caption),
    location: sn(row.location),
    isFavorite: row.is_favorite === true,
    memoryDate: sn(row.memory_date),
    createdAt: s(row.created_at),
  };
}

function mapAlbum(row: Row): Album {
  return {
    id: s(row.id),
    userId: s(row.user_id),
    name: s(row.name),
    description: sn(row.description),
    coverPhotoId: sn(row.cover_photo_id),
    createdAt: s(row.created_at),
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
        location: null,
      })
      .select(PHOTO_COLS)
      .single();
    if (error) throw error;
    return mapPhoto(data as Row);
  },

  async updatePhoto(id: string, patch: PhotoPatch): Promise<Photo> {
    const updates: Row = {};
    if (patch.caption !== undefined) updates.caption = patch.caption;
    if (patch.tags !== undefined) updates.tags = patch.tags;
    if (patch.albumId !== undefined) updates.album_id = patch.albumId;
    if (patch.location !== undefined) updates.location = patch.location;
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

  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from("photos")
      .update({ is_favorite: isFavorite })
      .eq("id", id);
    if (error) throw error;
  },

  async updateMemoryDate(id: string, date: string | null): Promise<void> {
    const { error } = await supabase
      .from("photos")
      .update({ memory_date: date })
      .eq("id", id);
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
