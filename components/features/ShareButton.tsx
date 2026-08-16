'use client';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';

export function ShareButton({
  title,
  text,
  className,
  showIcon = false,
  iconOnly = false,
}: {
  title: string;
  text: string;
  className?: string;
  showIcon?: boolean;
  iconOnly?: boolean;
}) {
  const toast = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(className)}
      aria-label={iconOnly ? 'Share this restaurant' : undefined}
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
      {showIcon ? <ShareIcon /> : null}
      {iconOnly ? null : 'Share'}
    </Button>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" fill="none" stroke="currentColor" />
      <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" />
      <circle cx="18" cy="19" r="2.5" fill="none" stroke="currentColor" />
      <path
        d="m8.3 10.9 7.4-4.6M8.3 13.1l7.4 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
