import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Beyond Ink POS",
  description: "Printing business POS foundation scaffold",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
