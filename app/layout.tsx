import './globals.css';

export const metadata = {
  title: 'نظام إدارة دار التحفيظ',
  description: 'نظام خاص لإدارة الطلاب والمتابعة اليومية'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-ink font-body min-h-screen">{children}</body>
    </html>
  );
}
