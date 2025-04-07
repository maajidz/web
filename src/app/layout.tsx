import type { Metadata } from "next";
import { Inter, Pacifico } from "next/font/google";
import Script from "next/script";
import "@/globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/react"


const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });

export const metadata: Metadata = {
  title: "Flattr - Find Your Perfect Flatmate",
  description: "Swipe, match, and connect with compatible flatmates in your area.",
};

const DAISYUI_THEMES = [
  "light", 
  "dark", 
  "cupcake", 
  "bumblebee", 
  "emerald", 
  "corporate", 
  "synthwave", 
  "retro", 
  "cyberpunk", 
  "valentine", 
  "halloween", 
  "garden", 
  "forest", 
  "aqua", 
  "lofi", 
  "pastel", 
  "fantasy", 
  "wireframe", 
  "black", 
  "luxury",
  "dracula", 
  "cmyk", 
  "autumn", 
  "business", 
  "acid", 
  "lemonade", 
  "night", 
  "coffee", 
  "winter", 
  "dim", 
  "nord", 
  "sunset"
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${pacifico.variable}`} suppressHydrationWarning>
      <head>
        <Script id="theme-change-fart-prevention" strategy="beforeInteractive">
          {`
            (function() {
              const theme = localStorage.getItem('theme') || 'light';
              document.documentElement.setAttribute('data-theme', theme);
            })()
          `}
        </Script>
      </head>
      <body className="m-6">
        <AuthProvider>
          <Navbar />
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
} 