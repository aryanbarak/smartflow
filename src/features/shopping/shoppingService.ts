import { supabase } from '@/integrations/supabase/client';

export interface ShoppingItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  created_at: string;
}

export const SHOPPING_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat',
  'Bakery',
  'Frozen',
  'Drinks',
  'Snacks',
  'Cleaning',
  'Personal Care',
  'Other',
] as const;

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

export const shoppingService = {
  async getAll(): Promise<ShoppingItem[]> {
    const user = await getUser();
    const { data } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', user.id)
      .order('checked', { ascending: true })
      .order('created_at', { ascending: true });
    return (data ?? []) as ShoppingItem[];
  },

  async add(item: Omit<ShoppingItem, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    const user = await getUser();
    await supabase.from('shopping_items').insert({ ...item, user_id: user.id });
  },

  async toggle(id: string, checked: boolean): Promise<void> {
    await supabase.from('shopping_items').update({ checked }).eq('id', id);
  },

  async delete(id: string): Promise<void> {
    await supabase.from('shopping_items').delete().eq('id', id);
  },

  async clearChecked(): Promise<void> {
    const user = await getUser();
    await supabase
      .from('shopping_items')
      .delete()
      .eq('user_id', user.id)
      .eq('checked', true);
  },
};
