import type { Metadata } from 'next';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { FlowbiteInit } from '@/components/layout/FlowbiteInit';

export const metadata: Metadata = {
  title: 'NHATROSO - Property Management',
  description: 'Professional property and rental management platform',
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="antialiased bg-gray-surface">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <FlowbiteInit />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
