'use client';

import { useState, useTransition } from 'react';
import { CRAVINGS } from '@/config/cravings';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input, Label } from '@/components/ui/Input';
import { MenuRow } from '@/components/ui/MenuRow';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { deleteMenuItem, upsertMenuItem } from '@/lib/owner/actions';

type Item = {
  id?: string;
  name: string;
  price: number;
  is_veg: boolean;
  craving_tags: string[];
  is_available: boolean;
};

const blank: Item = {
  name: '',
  price: 0,
  is_veg: false,
  craving_tags: [],
  is_available: true,
};

export function MenuManager({ items }: { items: Item[] }) {
  const [editing, setEditing] = useState<Item | null>(null);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await upsertMenuItem(editing);
      toast(
        res.ok ? 'Menu saved' : (res.message ?? 'Could not save'),
        res.ok ? 'positive' : 'error',
      );
      if (res.ok) setEditing(null);
    });
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing(blank)}>+ Add item</Button>

      {items.length === 0 ? (
        <p className="text-text-muted text-sm">
          No items yet — add the first one.
        </p>
      ) : (
        <Card>
          {items.map((item) => (
            <div key={item.id} className="group flex items-center gap-2">
              <div className="flex-1">
                <MenuRow
                  name={item.name}
                  price={item.price}
                  isVeg={item.is_veg}
                  unavailable={!item.is_available}
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await upsertMenuItem({
                        ...item,
                        is_available: !item.is_available,
                      });
                    })
                  }
                >
                  {item.is_available ? 'Sold out' : 'Back in'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(item)}
                >
                  Edit
                </Button>
                <Button
                  variant="urgent-text"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      const res = await deleteMenuItem(item.id!);
                      if (!res.ok)
                        toast(res.message ?? 'Could not delete', 'error');
                    })
                  }
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit item' : 'Add item'}
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="mi-name">Item name</Label>
              <Input
                id="mi-name"
                required
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="mi-price">Price (₹)</Label>
              <Input
                id="mi-price"
                type="number"
                min={0}
                required
                className="font-mono"
                value={editing.price || ''}
                onChange={(e) =>
                  setEditing({ ...editing, price: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex gap-2">
              <Chip
                active={editing.is_veg}
                onClick={() => setEditing({ ...editing, is_veg: true })}
              >
                Veg
              </Chip>
              <Chip
                active={!editing.is_veg}
                onClick={() => setEditing({ ...editing, is_veg: false })}
              >
                Non-veg
              </Chip>
            </div>
            <div>
              <Label>Craving tags (helps students find it)</Label>
              <div className="flex flex-wrap gap-2">
                {CRAVINGS.map((c) => (
                  <Chip
                    key={c.tag}
                    active={editing.craving_tags.includes(c.tag)}
                    onClick={() =>
                      setEditing({
                        ...editing,
                        craving_tags: editing.craving_tags.includes(c.tag)
                          ? editing.craving_tags.filter((t) => t !== c.tag)
                          : [...editing.craving_tags, c.tag],
                      })
                    }
                  >
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Saving…' : 'Save item'}
            </Button>
          </form>
        )}
      </Sheet>
    </div>
  );
}
