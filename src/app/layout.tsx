import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice Nudger",
  description: "Automatic payment reminders for freelancers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-lg !border !border-zinc-800 !bg-zinc-950 !text-zinc-100",
              title: "!text-zinc-100",
              description: "!text-zinc-400",
              actionButton: "!bg-emerald-500 !text-zinc-950",
            },
          }}
        />
      </body>
    </html>
  );
}
