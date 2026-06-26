import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "M0neyPundit",
  description: "Your AI-powered financial survival companion for students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-dark via-darker to-dark">
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}