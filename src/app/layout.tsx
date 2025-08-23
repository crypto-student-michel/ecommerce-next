import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/app/AuthContext";
import Header from "@/components/app/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "aplicacion web2",
  description: "Ecommerce de productos",
};

/**
 * RootLayout component
 * 
 * This component serves as the root layout for the entire application.
 * It wraps the entire app with the AuthProvider for global authentication state management.
 * It also sets up the basic HTML structure, applies global styles, and includes the Header component.
 * 
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout
 * @returns {JSX.Element} The root layout structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en">
        <body
          className={`container mx-auto space-y-4 p-4 ${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Header />
          <main>{children}</main>
        </body>
      </html>
    </AuthProvider>
  );
}
