import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { albumsService, type Album } from "@/features/photos/photosService";
import { getErrorMessage } from "@/lib/errors";

export function useAlbums() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setAlbums([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await albumsService.listAlbums(user.id);
      setAlbums(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (name: string, description?: string) => {
      if (!user) {
        toast.error("Not signed in");
        return null;
      }
      try {
        const album = await albumsService.createAlbum(user.id, name, description);
        setAlbums((prev) => [album, ...prev]);
        toast(`Album "${name}" created`);
        return album;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return null;
      }
    },
    [user],
  );

  const remove = useCallback(
    async (id: string) => {
      const target = albums.find((a) => a.id === id);
      try {
        await albumsService.deleteAlbum(id);
        setAlbums((prev) => prev.filter((a) => a.id !== id));
        if (target) toast(`Album "${target.name}" deleted`);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [albums],
  );

  return { albums, isLoading, create, remove, refresh };
}
