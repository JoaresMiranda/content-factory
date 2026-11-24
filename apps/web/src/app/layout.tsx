import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Content Factory',
  description: 'Central de produção do canal Mergulho Curioso.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
