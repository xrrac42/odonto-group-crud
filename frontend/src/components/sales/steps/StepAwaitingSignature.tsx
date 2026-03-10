import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Copy,
} from 'lucide-react'
import axios from 'axios'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthContext } from '../../../contexts/AuthContext'
import type { Sale } from '../../../types'

interface Props {
  sale: Sale
  saleId: string
  docuSealLink: string
  onCancelSale?: () => void
}

export default function StepAwaitingSignature({
  sale,
  saleId,
  docuSealLink,
}: Props) {
  const navigate = useNavigate()
  const { session } = useAuthContext()

  const [status, setStatus] = useState(sale.status)
  const [isSigned, setIsSigned] = useState(sale.status === 'signed')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 🔄 SINCRONIZA COM O BANCO (via props)
  useEffect(() => {
    setStatus(sale.status)
    setIsSigned(sale.status === 'signed')
  }, [sale.status])

  async function getAccessToken() {
    return (
      session?.access_token ??
      (await supabase.auth.getSession()).data.session?.access_token
    )
  }

  async function checkSignature() {
    setLoading(true)
    setMessage('🔍 Verificando assinatura...')

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Sessão não encontrada')

      const res = await axios.get(
  `http://localhost:8080/api/sales/${saleId}/signature`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    params: {
      _ts: Date.now(), // 🔑 cache buster
    },
    timeout: 8000,
  }
)

      const data = res.data

      alert('🔥 STATUS RECEBIDO: ' + data.status) // 🧪 PROVA

      setStatus(data.status)
      setIsSigned(data.is_signed)

      setMessage(
        data.is_signed
          ? '✅ Assinatura confirmada!'
          : '⏳ Ainda aguardando assinatura...'
      )
    } catch (err: any) {
      alert('❌ ERRO NA VERIFICAÇÃO')
      setMessage('❌ Erro ao verificar assinatura')
    } finally {
      setLoading(false) // 🚑 SEMPRE libera
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-semibold">
        Passo 3: Aguardando Assinatura
      </h2>

      {/* STATUS */}
      <div
        className={`border rounded-lg p-6 flex gap-4 ${
          isSigned
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        {isSigned ? (
          <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
        ) : (
          <Clock className="w-8 h-8 text-yellow-600 shrink-0" />
        )}

        <div>
          <p className="font-semibold">
            {isSigned ? 'Assinatura concluída' : 'Aguardando assinatura'}
          </p>
          <p className="text-sm mt-1">
            {isSigned
              ? 'Tudo pronto para avançar.'
              : 'Envie o link abaixo para o cliente assinar.'}
          </p>
          <p className="text-xs mt-2 font-mono">
            STATUS_DB: <b>{status.toUpperCase()}</b>
          </p>
        </div>
      </div>

      {/* LINK DOCUSEAL */}
      {docuSealLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold">
            Link de assinatura (DocuSeal)
          </p>

          <div className="flex gap-2">
            <input
              readOnly
              value={docuSealLink}
              className="flex-1 px-3 py-2 border rounded font-mono text-xs bg-white"
            />

            <button
              onClick={() => {
                navigator.clipboard.writeText(docuSealLink)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.open(docuSealLink, '_blank')}
              className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {copied && (
            <p className="text-xs text-green-600">Link copiado!</p>
          )}
        </div>
      )}

      {/* MENSAGEM */}
      {message && (
        <div className="p-3 border rounded text-sm bg-blue-50 border-blue-200">
          {message}
        </div>
      )}

      {/* AÇÕES */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={checkSignature}
          disabled={loading}
          className="px-6 py-3 border-2 border-green-600 text-green-700 rounded-lg font-bold flex gap-2 items-center disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          />
          {loading ? 'Verificando...' : 'Verificar assinatura'}
        </button>

        {isSigned && (
          <button
            onClick={() =>
              navigate(`/sales/${saleId}/step-4`, { replace: true })
            }
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold flex gap-2 items-center"
          >
            Próximo passo
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}