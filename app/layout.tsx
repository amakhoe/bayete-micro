import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from 'next-themes';

export const metadata: Metadata = {
  title: 'MicroGestor',
  description: 'Sistema Inteligente de Gestão de Microcrédito com Dashboard, Relatórios e CRUD.',
  openGraph: {
    title: 'MicroGestor',
    description: 'Sistema Inteligente de Gestão de Microcrédito com Dashboard, Relatórios e CRUD.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MicroGestor',
    description: 'Sistema Inteligente de Gestão de Microcrédito com Dashboard, Relatórios e CRUD.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
