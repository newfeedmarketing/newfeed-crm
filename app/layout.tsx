import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "New Feed CRM",
  description: "CRM financeiro da New Feed Marketing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
