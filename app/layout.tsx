import { Outfit } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { APP_URL } from "@/lib/site";
import { PI_LOGIN_SCRIPT } from "@/lib/pi-login-script";

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
  icons: {
    icon: [
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
      { url: "/logo-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
    apple: { url: "/logo-1024.png", sizes: "1024x1024", type: "image/png" },
  },
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
        <link rel="apple-touch-icon" href="/logo-1024.png" />
        <script src="https://sdk.minepi.com/pi-sdk.js" />
        <script dangerouslySetInnerHTML={{ __html: PI_LOGIN_SCRIPT }} />
      </head>
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
