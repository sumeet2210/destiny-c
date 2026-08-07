'use client';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function ShareButton({ title, text }: { title: string; text: string }) {
  const toast = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const url = window.location.href.split('?')[0];
        try {
          if (navigator.share) {
            await navigator.share({ title, text, url });
          } else {
            await navigator.clipboard.writeText(url);
            toast('Link copied');
          }
        } catch {
          // user dismissed the share sheet — nothing to do
        }
      }}
    >
      Share
    </Button>
  );
}
