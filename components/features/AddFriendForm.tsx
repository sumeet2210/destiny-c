'use client';

import { useState, useTransition } from 'react';
import { STUDENT_EMAIL_DOMAINS } from '@/config/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { sendFriendRequest } from '@/lib/api/social';

export function AddFriendForm({ onChanged }: { onChanged?: () => void }) {
  const [email, setEmail] = useState('');
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            try {
              await sendFriendRequest(email);
              toast('Request sent', 'positive');
              setEmail('');
              onChanged?.();
            } catch (err) {
              toast(
                err instanceof Error ? err.message : 'Could not send',
                'error',
              );
            }
          });
        }}
        className="flex items-end gap-2"
      >
        <div className="flex-1">
          <Label htmlFor="friend-email">Add by institute email</Label>
          <Input
            id="friend-email"
            type="email"
            required
            placeholder={`rollno@${STUDENT_EMAIL_DOMAINS[0]}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? '…' : 'Add'}
        </Button>
      </form>
    </Card>
  );
}
