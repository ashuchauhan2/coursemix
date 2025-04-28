import { Geist } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PageTransition } from "@/components/navigation-transitions/PageTransition";
import NavigationProgress from "@/components/navigation-transitions/NavigationProgress";
import ScrollManager from "@/components/navigation-transitions/ScrollManager";
import LinkPreloader from "@/components/navigation-transitions/LinkPreloader";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { FixedThemeToggle } from "@/components/theme/fixed-theme-toggle";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://www.coursemix.ca";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "CourseMix",
  description: "Your Personal Academic Advisor at Brock University",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <ThemeProvider>
          <NavigationProgress />
          <ScrollManager />
          <LinkPreloader />
          <Navbar />
          <PageTransition>
            {children}
          </PageTransition>
          <Footer />
          <FixedThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
