import { Toaster } from '@/components/ui/sonner'

export default function CredenciamentoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#1a2332] text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">Licitações Inteligentes — Credenciamento</h1>
      </header>
      <main className="p-4 max-w-2xl mx-auto">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  )
}
