import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Licitações Inteligentes - Painel Administrativo",
  description: "Sistema de Gestão de Congressos e Cursos - Segurança Pública",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={cn("antialiased font-sans", inter.variable)}>
        {children}
      </body>
    </html>
  );
}
