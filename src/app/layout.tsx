import type { Metadata } from "next";
import { Source_Serif_4, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import { createServerClient } from "@/lib/supabase";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-source-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rune -- Your AI Ghost Writer",
  description: "Write your book through pure conversation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${sourceSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-dvh">
        <AppHeader user={user} />
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
