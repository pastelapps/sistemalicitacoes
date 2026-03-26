'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SwitchCamera, Keyboard } from 'lucide-react'

interface QrScannerProps {
  onScan: (uuid: string) => void
  enabled: boolean
}

export function QrScanner({ onScan, enabled }: QrScannerProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [mostrarInput, setMostrarInput] = useState(false)
  const [codigoManual, setCodigoManual] = useState('')
  const [scannerAtivo, setScannerAtivo] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)
  const lastScanRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)

  const iniciarScanner = useCallback(async () => {
    if (!enabled) return

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      // Stop existing scanner if any
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
        } catch {
          // ignore
        }
        scannerRef.current = null
      }

      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          const now = Date.now()
          // Debounce: ignore same code within 3 seconds
          if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 3000) {
            return
          }
          lastScanRef.current = decodedText
          lastScanTimeRef.current = now
          onScan(decodedText)
        },
        () => {
          // QR code parse error - ignore
        }
      )

      setScannerAtivo(true)
    } catch (err) {
      console.error('Erro ao iniciar scanner:', err)
      setScannerAtivo(false)
    }
  }, [enabled, facingMode, onScan])

  useEffect(() => {
    if (enabled) {
      iniciarScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
        scannerRef.current = null
        setScannerAtivo(false)
      }
    }
  }, [enabled, iniciarScanner])

  const alternarCamera = async () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  const handleCodigoManual = () => {
    const codigo = codigoManual.trim()
    if (codigo) {
      onScan(codigo)
      setCodigoManual('')
    }
  }

  return (
    <div className="space-y-3">
      <div
        id="qr-reader"
        className="w-full rounded-lg overflow-hidden bg-black min-h-[300px]"
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={alternarCamera}
          disabled={!scannerAtivo}
          className="flex-1"
        >
          <SwitchCamera className="h-4 w-4 mr-2" />
          Alternar Câmera
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMostrarInput(!mostrarInput)}
          className="flex-1"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Digitar código
        </Button>
      </div>

      {mostrarInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Cole o UUID do QR Code"
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCodigoManual()
            }}
          />
          <Button onClick={handleCodigoManual} disabled={!codigoManual.trim()}>
            Validar
          </Button>
        </div>
      )}
    </div>
  )
}
