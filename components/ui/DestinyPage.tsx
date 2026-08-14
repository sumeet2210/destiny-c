import { cn } from '@/lib/cn';
import styles from './destiny-page.module.css';

export function DestinyPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <main className={cn(styles.page, className)}>{children}</main>;
}
