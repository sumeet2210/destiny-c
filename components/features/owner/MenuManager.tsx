'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input, Label, Select } from '@/components/ui/Input';
import { MenuRow } from '@/components/ui/MenuRow';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import {
  createMenuSection,
  deleteMenuItem,
  upsertMenuItem,
} from '@/lib/owner/actions';

type Item = {
  id?: string;
  name: string;
  price: number;
  is_veg: boolean;
  craving_tags: string[];
  is_available: boolean;
  section_name: string;
};

const blank = (sectionName: string): Item => ({
  name: '',
  price: 0,
  is_veg: false,
  craving_tags: [],
  is_available: true,
  section_name: sectionName,
});

export function MenuManager({
  items,
  sections,
}: {
  items: Item[];
  sections: string[];
}) {
  const router = useRouter();
  const availableSections = sections.length > 0 ? sections : ['Menu'];
  const [editing, setEditing] = useState<Item | null>(null);
  const [beforeEdit, setBeforeEdit] = useState<Item | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dirty =
    editing !== null &&
    JSON.stringify(editing) !==
      JSON.stringify(beforeEdit ?? blank(availableSections[0]));

  const closeEditor = () => {
    setEditing(null);
    setBeforeEdit(null);
  };

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await upsertMenuItem(editing);
      toast(
        res.ok ? 'Menu saved' : (res.message ?? 'Could not save'),
        res.ok ? 'positive' : 'error',
      );
      if (res.ok) {
        closeEditor();
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setBeforeEdit(null);
            setEditing(blank(availableSections[0]));
          }}
        >
          + Add item
        </Button>
        <Button variant="outline" onClick={() => setAddingSection(true)}>
          + Add subsection
        </Button>
      </div>

      {addingSection ? (
        <Card>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const res = await createMenuSection(sectionName);
                toast(
                  res.ok
                    ? 'Subsection added'
                    : (res.message ?? 'Could not add subsection'),
                  res.ok ? 'positive' : 'error',
                );
                if (res.ok) {
                  setSectionName('');
                  setAddingSection(false);
                  router.refresh();
                }
              });
            }}
          >
            <div className="min-w-56 flex-1">
              <Label htmlFor="menu-section-name">Subsection name</Label>
              <Input
                id="menu-section-name"
                required
                maxLength={60}
                placeholder="Starters"
                value={sectionName}
                onChange={(event) => setSectionName(event.target.value)}
              />
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAddingSection(false)}
            >
              Cancel
            </Button>
          </form>
        </Card>
      ) : null}

      <div className="space-y-4">
        {availableSections.map((section) => {
          const sectionItems = items.filter(
            (item) => item.section_name === section,
          );
          return (
            <Card key={section} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-paper text-base font-semibold">
                  {section}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBeforeEdit(null);
                    setEditing(blank(section));
                  }}
                >
                  + Add item
                </Button>
              </div>
              {sectionItems.length === 0 ? (
                <p className="text-text-muted text-[13px]">
                  No items in this subsection yet.
                </p>
              ) : (
                <div className="grid gap-x-6 sm:grid-cols-2">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-2"
                    >
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
                              const res = await upsertMenuItem({
                                ...item,
                                is_available: !item.is_available,
                              });
                              if (res.ok) router.refresh();
                              else
                                toast(
                                  res.message ?? 'Could not update item',
                                  'error',
                                );
                            })
                          }
                        >
                          {item.is_available ? 'Sold out' : 'Back in'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBeforeEdit(item);
                            setEditing(item);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="urgent-text"
                          size="sm"
                          onClick={() =>
                            startTransition(async () => {
                              const res = await deleteMenuItem(item.id!);
                              if (res.ok) router.refresh();
                              else
                                toast(
                                  res.message ?? 'Could not delete',
                                  'error',
                                );
                            })
                          }
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Sheet
        open={editing !== null}
        onClose={closeEditor}
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
              <Label htmlFor="mi-section">Subsection</Label>
              <Select
                id="mi-section"
                required
                value={editing.section_name}
                onChange={(e) =>
                  setEditing({ ...editing, section_name: e.target.value })
                }
              >
                {availableSections.map((section) => (
                  <option key={section}>{section}</option>
                ))}
              </Select>
            </div>
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
                className={
                  editing.is_veg
                    ? '!border-green-600 !bg-green-600 !text-white'
                    : undefined
                }
                onClick={() => setEditing({ ...editing, is_veg: true })}
              >
                Veg
              </Chip>
              <Chip
                active={!editing.is_veg}
                className={
                  !editing.is_veg
                    ? '!border-red-600 !bg-red-600 !text-white'
                    : undefined
                }
                onClick={() => setEditing({ ...editing, is_veg: false })}
              >
                Non-veg
              </Chip>
            </div>
            {dirty ? (
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? 'Saving…' : 'Save'}
              </Button>
            ) : null}
          </form>
        )}
      </Sheet>
    </div>
  );
}
