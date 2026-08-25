import { cn } from '@/lib/cn';

const field =
  'w-full rounded-control border border-border-hairline bg-surface-muted px-3.5 py-2.5 text-sm text-paper placeholder:text-text-muted disabled:cursor-default disabled:border-transparent disabled:bg-surface-raised disabled:text-paper disabled:opacity-100';

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(field, 'min-h-24 resize-y', className)} {...rest} />
  );
}

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
