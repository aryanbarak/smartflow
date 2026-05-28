import { useState } from 'react';
import { Plus, Trash2, ShoppingCart, X, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useShoppingList,
  useAddShoppingItem,
  useToggleShoppingItem,
  useDeleteShoppingItem,
  useClearChecked,
} from './useShoppingList';
import { SHOPPING_CATEGORIES } from './shoppingService';

function AddItemForm({ onClose }: { onClose: () => void }) {
  const { mutate: add, isPending } = useAddShoppingItem();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Other');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');

  function handleAdd() {
    if (!name.trim()) return;
    add(
      {
        name: name.trim(),
        category,
        quantity: quantity ? Number(quantity) : null,
        unit: unit.trim() || null,
        checked: false,
      },
      { onSuccess: () => { setName(''); setQuantity(''); setUnit(''); onClose(); } },
    );
  }

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Add Item</span>
        <button type="button" aria-label="Close" onClick={onClose}><X size={14} /></button>
      </div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        placeholder="Item name"
        autoFocus
        className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="Qty"
          className="bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <input
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="Unit (kg, pcs…)"
          className="bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        aria-label="Category"
        className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      >
        {SHOPPING_CATEGORIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={!name.trim() || isPending}
        onClick={handleAdd}
        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {isPending ? 'Adding...' : 'Add'}
      </button>
    </div>
  );
}

export function ShoppingList() {
  const { data: items = [], isLoading } = useShoppingList();
  const { mutate: toggle } = useToggleShoppingItem();
  const { mutate: remove } = useDeleteShoppingItem();
  const { mutate: clearChecked, isPending: clearing } = useClearChecked();
  const [showAdd, setShowAdd] = useState(false);

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  const grouped = unchecked.reduce<Record<string, typeof unchecked>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="text-center text-sm text-muted-foreground py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-primary" />
          <span className="text-sm font-semibold">Shopping List</span>
          <span className="text-xs text-muted-foreground">({unchecked.length} remaining)</span>
        </div>
        <div className="flex items-center gap-2">
          {checked.length > 0 && (
            <button
              type="button"
              onClick={() => clearChecked()}
              disabled={clearing}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <CheckCheck size={12} />
              Clear done
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Add item"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>

      {showAdd && <AddItemForm onClose={() => setShowAdd(false)} />}

      {items.length === 0 && !showAdd && (
        <div className="text-center text-muted-foreground py-8">
          <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">List is empty</p>
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{cat}</p>
          {catItems.map(item => (
            <div key={item.id} className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors">
              <button
                type="button"
                aria-label={item.checked ? 'Uncheck item' : 'Check item'}
                onClick={() => toggle({ id: item.id, checked: !item.checked })}
                className={cn(
                  'w-4 h-4 rounded border flex-shrink-0 transition-colors',
                  item.checked ? 'bg-primary border-primary' : 'border-muted-foreground',
                )}
              />
              <span className={cn('flex-1 text-sm', item.checked && 'line-through text-muted-foreground')}>
                {item.name}
                {item.quantity != null && (
                  <span className="text-muted-foreground ml-1">
                    × {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                  </span>
                )}
              </span>
              <button
                type="button"
                aria-label="Delete item"
                onClick={() => remove(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-destructive text-muted-foreground transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ))}

      {checked.length > 0 && (
        <div className="space-y-1 opacity-60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Done</p>
          {checked.map(item => (
            <div key={item.id} className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors">
              <button
                type="button"
                aria-label="Uncheck item"
                onClick={() => toggle({ id: item.id, checked: false })}
                className="w-4 h-4 rounded border flex-shrink-0 bg-primary border-primary transition-colors"
              />
              <span className="flex-1 text-sm line-through text-muted-foreground">{item.name}</span>
              <button
                type="button"
                aria-label="Delete item"
                onClick={() => remove(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-destructive text-muted-foreground transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
