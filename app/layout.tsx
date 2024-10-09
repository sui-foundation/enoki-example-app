import { Metadata } from "next";
import { ProvidersAndLayout } from "./ProvidersAndLayout";
import "./globals.css";
import '@mysten/dapp-kit/dist/index.css';

export const metadata: Metadata = {
  title: 'Enoki Example App',
  description: 'Learn how to build a dApp with Enoki',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body>
        <ProvidersAndLayout>{children}</ProvidersAndLayout>
      </body>
    </html>
  );
}
