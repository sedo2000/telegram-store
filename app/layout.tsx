import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "متجري",
  description: "متجر إلكتروني مرتبط بقناة Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
