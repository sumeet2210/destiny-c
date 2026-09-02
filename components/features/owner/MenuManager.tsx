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
  const availableSections = sections;
  const [editing, setEditing] = useState<Item | null>(null);
  const [beforeEdit, setBeforeEdit] = useState<Item | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(),
  );
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dirty =
    editing !== null &&
    JSON.stringify(editing) !==
      JSON.stringify(beforeEdit ?? blank(editing.section_name));

  const closeEditor = () => {
    setEditing(null);
    setBeforeEdit(null);
  };

  const save = () => {
    if (!editing) return;
    const savedSection = editing.section_name;
    startTransition(async () => {
      const res = await upsertMenuItem(editing);
      toast(
        res.ok ? 'Menu saved' : (res.message ?? 'Could not save'),
        res.ok ? 'positive' : 'error',
      );
      if (res.ok) {
        setExpandedSections((current) => new Set(current).add(savedSection));
        closeEditor();
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
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

      {availableSections.length === 0 ? (
        <Card className="text-text-muted text-sm">
          Create your first subsection, such as Starters, Main Course, or
          Desserts. You can then add items inside it.
        </Card>
      ) : (
        <div className="space-y-4">
          {availableSections.map((section, sectionIndex) => {
            const sectionItems = items.filter(
              (item) => item.section_name === section,
            );
            const expanded = expandedSections.has(section);
            const contentId = `menu-subsection-${sectionIndex}-items`;
            return (
              <Card key={section} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-paper text-base font-semibold">
                    {section}
                  </h2>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-expanded={expanded}
                      aria-controls={contentId}
                      onClick={() =>
                        setExpandedSections((current) => {
                          const next = new Set(current);
                          if (next.has(section)) next.delete(section);
                          else next.add(section);
                          return next;
                        })
                      }
                    >
                      {expanded
                        ? 'Hide items'
                        : `Show items (${sectionItems.length})`}
                    </Button>
                    <Button
                      type="button"
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
                </div>
                {expanded ? (
                  <div id={contentId}>
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
                            <div className="flex flex-wrap gap-1">
                              <Button
                                type="button"
                                variant={
                                  item.is_available ? 'primary' : 'secondary'
                                }
                                size="sm"
                                disabled={pending}
                                aria-pressed={item.is_available}
                                onClick={() =>
                                  startTransition(async () => {
                                    const res = await upsertMenuItem({
                                      ...item,
                                      is_available: !item.is_available,
                                    });
                                    if (res.ok) {
                                      toast(
                                        item.is_available
                                          ? 'Item marked not available'
                                          : 'Item marked available',
                                        'positive',
                                      );
                                      router.refresh();
                                    } else
                                      toast(
                                        res.message ?? 'Could not update item',
                                        'error',
                                      );
                                  })
                                }
                              >
                                {item.is_available
                                  ? 'Available'
                                  : 'Not available'}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                onClick={() => {
                                  setBeforeEdit(item);
                                  setEditing(item);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="urgent-text"
                                size="sm"
                                disabled={pending}
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
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

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
                    : '!border-green-700 !text-green-500'
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
                    : '!border-red-700 !text-red-500'
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
