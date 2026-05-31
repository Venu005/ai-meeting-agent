import '@repo/ui/globals.css';
import Providers from '@/app/providers';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { almarai, instrumentSerif } from '@/lib/fonts';
import GlobalLoading from './loading';

export const metadata: Metadata = {
  title: 'Meetra — AI Meeting Notes & Bot',
  description:
    'Meetra joins your Google Meet calls and delivers structured notes, key points, and docs tailored to your role.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning className={`dark ${almarai.variable} ${instrumentSerif.variable}`}>
      <body className={`${almarai.className} antialiased`}>
        <Suspense fallback={<GlobalLoading />}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
