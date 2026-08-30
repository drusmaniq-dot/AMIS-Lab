import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { AuthSessionProvider } from "@/components/session-provider";
import { I18nProvider } from "@/components/i18n-provider";
import { Toaster } from "@/components/ui/sonner";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isRtl } from "@/lib/i18n/config";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "AMIS Lab",
  description: "Advanced Materials, Innovation & Sustainability research group",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dict } = await getDictionary();
  const rtl = isRtl(locale);
  const font = rtl ? notoSansArabic : inter;

  return (
    <html lang={locale} dir={rtl ? "rtl" : "ltr"} className={`${font.variable} antialiased`}>
      <body>
        <AuthSessionProvider>
          <I18nProvider locale={locale} dict={dict}>
            {children}
            <Toaster />
          </I18nProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
