import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vinlyst",
  description: "A social network for music reviews",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mb-bg text-mb-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
