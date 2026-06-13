import type { Metadata } from "next";
import { JetBrains_Mono, Playfair_Display } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-heading-family",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Morning Money",
  description:
    "Plain-English summaries of ASX announcements for the tickers you watch.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
