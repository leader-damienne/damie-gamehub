import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { APP_URL } from "@/lib/site";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Damie GameHub",
  description:
    "Hub de jeux HTML5 pour Pioneers : lobby, tournois, classements et paiements en Pi.",
  applicationName: "Damie GameHub",
  manifest: "/manifest.json",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070707",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
      </head>
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
