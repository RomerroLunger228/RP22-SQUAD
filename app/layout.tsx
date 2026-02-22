import type { Metadata } from "next";
import "./globals.css";
import "../styles/animations.css";
import { Outfit, Montserrat, Cormorant_Garamond } from "next/font/google";
import FooterNavigation from "@/components/ui/FooterNavigation";
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from '@/lib/query-client';
import { TelegramInit } from '@/components/telegram/TelegramInit';

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["100","200","300","400","500","600","700","800","900"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  weight: ["100","200","300","400","500","600","700","800","900"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-cormorant-garamond",
  weight: ["300","400","500","600","700"],
  style: ["normal", "italic"],
  display: "swap",
});


// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "RP22 - Telegram Mini App",
  description: "Appointment booking service in Telegram",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script 
          src="https://telegram.org/js/telegram-web-app.js"
          async
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`antialiased ${outfit.variable} ${montserrat.variable} ${cormorantGaramond.variable} min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <TelegramInit>
            <main className="flex-1 pb-20 bg-[#111213]">
              {children}
            </main>
            <FooterNavigation />
            <Toaster 
              position="top-center"
              toastOptions={{
                style: {
                  background: '#000000',
                  color: '#ffffff',
                  fontFamily: 'var(--font-montserrat)',
                  border: '1px solid #333333',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#0ed05fff',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </TelegramInit>
        </QueryProvider>
      </body>
    </html>
  );
}
