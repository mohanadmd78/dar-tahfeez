import './globals.css';

export const metadata = {
  title: 'نظام إدارة حلقة أهل القرآن',
  description: 'نظام خاص لإدارة الطلاب والمتابعة اليومية',
  manifest: '/manifest.json',
  themeColor: '#0F4C3A',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'حلقة أهل القرآن'
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png'
  }
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
