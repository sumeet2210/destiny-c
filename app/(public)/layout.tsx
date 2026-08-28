import { AppShell } from '@/components/features/AppShell';

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return <AppShell allowOwner>{children}</AppShell>;
}
