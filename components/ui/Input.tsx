import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

const field =
  'w-full rounded-control border border-border-hairline bg-surface-muted px-3.5 py-2.5 text-sm text-paper placeholder:text-text-muted disabled:opacity-40';

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, className)} {...rest} />;
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(field, 'min-h-24 resize-y', className)}
      {...rest}
    />
  );
});

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(field, 'appearance-none', className)} {...rest}>
      {children}
    </select>
  );
}

export function Label({
  className,
  children,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'text-text-muted mb-1.5 block text-[13px] font-medium',
        className,
      )}
      {...rest}
    >
      {children}
    </label>
  );
}
