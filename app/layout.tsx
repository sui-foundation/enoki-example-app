'use client';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EnokiFlowProvider } from "@mysten/enoki/react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <EnokiFlowProvider apiKey="enoki_public_818d52256623b170c33438c51070eaa0">
        <body className={inter.className}>{children}</body>
      </EnokiFlowProvider>
    </html>
  );
}
