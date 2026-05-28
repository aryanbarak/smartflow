import { supabase } from '@/integrations/supabase/client';

export interface Link {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  is_favorite: boolean;
  favicon_url: string | null;
  created_at: string;
}

type LinkInput = Pick<Link, 'url' | 'title' | 'description' | 'tags' | 'is_favorite'>;

export const linksService = {
  async getAll(): Promise<Link[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Link[];
  },

  async create(input: LinkInput): Promise<Link> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(input.url).hostname}&sz=32`;

    const { data, error } = await supabase
      .from('links')
      .insert({ ...input, user_id: user.id, favicon_url: faviconUrl })
      .select()
      .single();

    if (error) throw error;
    return data as Link;
  },

  async update(id: string, input: Partial<LinkInput>): Promise<void> {
    const { error } = await supabase.from('links').update(input).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('links').delete().eq('id', id);
    if (error) throw error;
  },

  async toggleFavorite(id: string, current: boolean): Promise<void> {
    const { error } = await supabase.from('links').update({ is_favorite: !current }).eq('id', id);
    if (error) throw error;
  },
};
