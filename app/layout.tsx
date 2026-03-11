import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fila de Espera • Caneca Bistrô',
  description: 'Gestão de fila de espera e mesas para café bistrô.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
