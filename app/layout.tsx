import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import { DemoProvider } from "@/lib/demo-store";
import "./globals.css";


export const metadata: Metadata = {
  title: "CoBuy",
  description: "AI purchasing agent for independent restaurants",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
