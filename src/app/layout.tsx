import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
export const metadata: Metadata = {
 metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
 title: { default: "AnimeHeaven — Discover Your Next Anime", template: "%s | AnimeHeaven" },
 description: "Discover trending anime, explore genres, find episode guides, and keep up with your next favorite series on AnimeHeaven.",
 applicationName: "AnimeHeaven",
 keywords: ["anime", "anime guide", "anime episodes", "anime discovery", "anime list"],
 robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#090b14", colorScheme: "dark", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="en"><body><SiteHeader/><main>{children}</main><SiteFooter/></body></html>;
}
