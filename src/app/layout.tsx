import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: "/icon.png",
      apple: "/icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mb-bg text-mb-text">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
