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
import { formatUnits, parseUnits } from 'viem'
import { bsc } from 'wagmi/chains'

const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B7402A6E'
const BUSD_ADDRESS = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
const USDC_ADDRESS = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
const ETH_ADDRESS = '0x2170Ed0880ac9A755fd29B2688956BD959F8aC1e'
const BTCB_ADDRESS = '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'
const ADA_ADDRESS = '0x3EE2200Efb3400fAbB9AacF31297cB5D0B435D47'
const DOGE_ADDRESS = '0xbA2aE424d960c26247Dd6c32edC70B3C1d9f9e'
const CAKE_ADDRESS = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82'
const LINK_ADDRESS = '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD'
const XRP_ADDRESS = '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE'
const SOL_ADDRESS = '0x570A5D26f7765Ecb712C0924E4De545B89fD43dF'
const LTC_ADDRESS = '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94'
const PANCAKE_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
const FLOW_REWARD_ADDRESS = '0x48421f6da4e1d367bc1c6f4f9afa334312969638'
const FEE_WALLET = '0x2da29b4D5297b261B4899D97Df56AE36F195f26d'
const FEE_PERCENT = 1.3

const TOKEN_LIST = [
  { symbol: 'BNB', address: WBNB_ADDRESS, decimals: 18 },
  { symbol: 'USDT', address: USDT_ADDRESS, decimals: 18 },
  { symbol: 'BUSD', address: BUSD_ADDRESS, decimals: 18 },
  { symbol: 'USDC', address: USDC_ADDRESS, decimals: 18 },
  { symbol: 'ETH', address: ETH_ADDRESS, decimals: 18 },
  { symbol: 'BTCB', address: BTCB_ADDRESS, decimals: 18 },
  { symbol: 'ADA', address: ADA_ADDRESS, decimals: 18 },
  { symbol: 'DOGE', address: DOGE_ADDRESS, decimals: 18 },
  { symbol: 'CAKE', address: CAKE_ADDRESS, decimals: 18 },
  { symbol: 'LINK', address: LINK_ADDRESS, decimals: 18 },
  { symbol: 'XRP', address: XRP_ADDRESS, decimals: 18 },
  { symbol: 'SOL', address: SOL_ADDRESS, decimals: 18 },
  { symbol: 'LTC', address: LTC_ADDRESS, decimals: 18 }
]

const TOKEN_MAP = Object.fromEntries(TOKEN_LIST.map((token) => [token.symbol, token]))
const STABLES = {
  USDT: USDT_ADDRESS,
  BUSD: BUSD_ADDRESS,
  USDC: USDC_ADDRESS
}

const ERC20_ABI = [{
  constant: false,
  inputs: [
    { name: 'spender', type: 'address', internalType: 'address' },
    { name: 'amount', type: 'uint256', internalType: 'uint256' }
  ],
  name: 'approve',
  outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
  stateMutability: 'nonpayable',
  type: 'function'
}]

const PANCAKE_ROUTER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' }
    ],
    name: 'getAmountsOut',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin
  return 'https://swap-flow-bsc.pages.dev'
}

const formatAddress = (value) => {
  if (!value) return ''
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const buildRoute = (fromSymbol, toSymbol) => {
  if (fromSymbol === toSymbol) return []

  const fromToken = TOKEN_MAP[fromSymbol]
  const toToken = TOKEN_MAP[toSymbol]
  if (!fromToken || !toToken) return []

  if (fromSymbol === 'BNB') return [WBNB_ADDRESS, toToken.address]
  if (toSymbol === 'BNB') return [fromToken.address, WBNB_ADDRESS]

  if (STABLES[fromSymbol] && STABLES[toSymbol]) {
    return [fromToken.address, toToken.address]
  }

  if (STABLES[fromSymbol] || STABLES[toSymbol]) {
    return [fromToken.address, toToken.address]
  }

  return [fromToken.address, WBNB_ADDRESS, toToken.address]
}

const normalizeTx = (tx) => ({
  id: tx.id || Date.now() + Math.random(),
  hash: tx.hash || '0x0000...0000',
  type: tx.type || 'Swap',
  amount: tx.amount || '0.00',
  status: tx.status || 'Pendiente',
  time: tx.time || 'Ahora mismo',
  fromToken: tx.fromToken || 'BNB',
  toToken: tx.toToken || 'USDT',
  bonusFlow: tx.bonusFlow || '0.00'
})

function App() {
  const [tab, setTab] = useState('swap')
  const [amount, setAmount] = useState('0.25')
  const [fromToken, setFromToken] = useState('BNB')
  const [toToken, setToToken] = useState('USDT')
  const [refAddress, setRefAddress] = useState('')
  const [hashRate, setHashRate] = useState(2.74)
  const [history, setHistory] = useState([])

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract } = useWriteContract()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get('ref')
    if (ref && ref.startsWith('0x')) {
      setRefAddress(ref)
      localStorage.setItem('swap_flow_referrer', ref)
    } else {
      const savedRef = localStorage.getItem('swap_flow_referrer')
      if (savedRef) setRefAddress(savedRef)
    }
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('swap-flow-history')
      if (saved) {
        setHistory(JSON.parse(saved).map(normalizeTx))
      }
    } catch {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    if (history.length) {
      localStorage.setItem('swap-flow-history', JSON.stringify(history))
    }
  }, [history])

  const { data: bnbBalance } = useBalance({ address, query: { enabled: !!address } })
  const { data: usdtBalance } = useBalance({ address, token: USDT_ADDRESS, query: { enabled: !!address } })

  const isBsc = chainId === bsc.id
  const fromConfig = TOKEN_MAP[fromToken]
  const toConfig = TOKEN_MAP[toToken]
  const route = useMemo(() => buildRoute(fromToken, toToken), [fromToken, toToken])

  const parsedAmountIn = useMemo(() => {
    if (!amount || Number(amount) <= 0 || !Number.isFinite(Number(amount))) return 0n
    try {
      return parseUnits(String(amount), fromConfig.decimals)
    } catch {
      return 0n
    }
  }, [amount, fromConfig.decimals])

  const { data: quoteData, isLoading: isQuoteLoading } = useReadContract({
    address: PANCAKE_ROUTER_ADDRESS,
    abi: PANCAKE_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [parsedAmountIn, route],
    query: { enabled: isBsc && route.length > 0 && parsedAmountIn > 0n }
  })

  const quote = useMemo(() => {
    if (!quoteData || quoteData.length < 2) return '0.00'
    return Number(formatUnits(quoteData[quoteData.length - 1], toConfig.decimals)).toFixed(2)
  }, [quoteData, toConfig.decimals])

  const bonusFlow = useMemo(() => {
    const value = Number(amount || 0)
    return (value * 0.12).toFixed(2)
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
            address: FLOW_REWARD_ADDRESS,
            symbol: 'FLOW',
            decimals: 18,
            image: 'https://raw.githubusercontent.com/ethereum-optimism/brand-kit/main/assets/icon.png'
          }
        }
      })
    } catch (error) {
      console.error(error)
      alert('La wallet rechazó la importación del token.')
    }
  }

  const handleSwap = async () => {
    if (!isConnected) {
      alert('Conecta tu wallet para continuar.')
      return
    }

    if (!route || route.length === 0 || !quoteData || quoteData.length < 2) {
      alert('No hay una ruta real disponible para este intercambio en PancakeSwap.')
      return
    }

    try {
      const amountOutMin = (quoteData[quoteData.length - 1] * 995n) / 1000n
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)
      const cleanBonus = Number(bonusFlow || 0).toFixed(2)

      if (fromToken === 'BNB') {
        writeContract({
          address: PANCAKE_ROUTER_ADDRESS,
          abi: PANCAKE_ROUTER_ABI,
          functionName: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
          args: [amountOutMin, route, address, deadline],
          value: parsedAmountIn
        })
      } else {
        writeContract({
          address: fromConfig.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [PANCAKE_ROUTER_ADDRESS, parsedAmountIn]
        })

        setTimeout(() => {
          writeContract({
            address: PANCAKE_ROUTER_ADDRESS,
            abi: PANCAKE_ROUTER_ABI,
            functionName: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
            args: [parsedAmountIn, amountOutMin, route, address, deadline]
          })
        }, 500)
      }

      try {
        await fetch('https://jsjmgucdcaubbjkeulqg.supabase.co/functions/v1/process-swap-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userWallet: address,
            referrerWallet: refAddress || localStorage.getItem('swap_flow_referrer') || null
          })
        })
      } catch (err) {
        console.error('Error al notificar recompensa a Supabase:', err)
      }

      const newTx = normalizeTx({
        id: Date.now(),
        hash: `${address?.slice(0, 6) || '0x0000'}...${address?.slice(-4) || '0000'}`,
        type: `Swap ${fromToken}→${toToken}`,
        amount: `${quote} ${toToken}`,
        status: 'Pendiente',
        time: 'Ahora mismo',
        fromToken,
        toToken,
        bonusFlow: cleanBonus
      })

      setHistory((current) => [newTx, ...current].slice(0, 12))
      alert('Transacción de swap enviada. Las recompensas de FLOW y referidos se procesarán automáticamente.')
    } catch (error) {
      console.error(error)
      alert('Error al intentar ejecutar el swap real.')
    }
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

  const tokenBalance = bnbBalance ? Number(formatUnits(bnbBalance.value, 18)).toFixed(3) : '0.000'
  const usdtDisplay = usdtBalance ? Number(formatUnits(usdtBalance.value, 18)).toFixed(2) : '0.00'

  return (
    <div className="min-h-screen bg-bg text-white overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
        <header className="card mb-6 sm:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-glow">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold">Swap FLOW</div>
              <div className="text-xs text-slate-400">BSC real + bonus FLOW</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-between sm:justify-end">
            <div className={`badge ${isBsc ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {isBsc ? 'BSC Mainnet' : 'Red no compatible'}
            </div>

            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 font-semibold text-white shadow-glow transition hover:brightness-110 text-center"
              >
                Conectar wallet
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:text-sm">
                  <div className="text-slate-400">BNB</div>
                  <div className="font-semibold">{tokenBalance}</div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:text-sm">
                  <div className="text-slate-400">USDT</div>
                  <div className="font-semibold">{usdtDisplay}</div>
                </div>

                <button
                  onClick={() => disconnect()}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm transition hover:border-white/20 hover:bg-white/10 truncate max-w-[120px]"
                >
                  {formatAddress(address)}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div className="card p-3 sm:p-5">
              <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {['swap', 'referidos', 'historial'].map((name) => (
                    <button
                      key={name}
                      onClick={() => setTab(name)}
                      className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition whitespace-nowrap ${
                        tab === name ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="text-xs sm:text-sm text-slate-400 text-right sm:text-left">No custodio</div>
              </div>

              {tab === 'swap' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="glass p-3 sm:p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-xs sm:text-sm text-slate-400">Minero virtual</div>
                      <RefreshCcw className="h-4 w-4 text-slate-400" />
                    </div>

                    <div className="miner rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 sm:p-5">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Hashrate</div>
                      <div className="mt-2 text-3xl sm:text-4xl font-bold text-cyan-300">{hashRate.toFixed(2)} GH/s</div>
                      <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                        <Sparkles className="h-4 w-4 flex-shrink-0" />
                        Procesando flujo de transacción...
                      </div>
                    </div>
                  </div>

                  <div className="glass p-3 sm:p-4">
                    <div className="mb-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <div className="mb-2 text-xs uppercase text-slate-400">Desde</div>
                        <select
                          value={fromToken}
                          onChange={(event) => setFromToken(event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 outline-none text-sm"
                        >
                          {TOKEN_LIST.map((token) => (
                            <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="mb-2 text-xs uppercase text-slate-400">Hacia</div>
                        <select
                          value={toToken}
                          onChange={(event) => setToToken(event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 outline-none text-sm"
                        >
                          {TOKEN_LIST.map((token) => (
                            <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-slate-400">Tú pagas</span>
                        <span className="text-xs text-slate-400">{fromToken}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <input
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          className="w-full bg-transparent text-xl sm:text-2xl font-semibold outline-none min-w-0"
                          placeholder="0.00"
                        />
                        <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs sm:text-sm flex-shrink-0">{fromToken}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={() => {
                          const currentFrom = fromToken
                          setFromToken(toToken)
                          setToToken(currentFrom)
                        }}
                        className="rounded-full bg-slate-800 p-2 transition hover:bg-slate-700"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs sm:text-sm text-slate-400">Recibes</span>
                        <span className="text-xs text-slate-400">Ruta real</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-xl sm:text-2xl font-semibold truncate">{isQuoteLoading ? 'Cargando...' : quote}</div>
                        <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs sm:text-sm flex-shrink-0">{toToken}</div>
                      </div>
                    </div>
                  </div>

                  <div className="glass p-3 sm:p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-slate-400">Fee de wallet</span>
                      <span className="text-xs sm:text-sm font-semibold text-amber-300">{FEE_PERCENT}%</span>
                    </div>

                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs sm:text-sm text-slate-200">
                      <div className="flex justify-between">
                        <span>Fee estimada</span>
                        <span>{feeValue} {fromToken}</span>
                      </div>
                      <div className="mt-2 flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span>Recaudación</span>
                        <span className="break-all text-left sm:text-right text-amber-300">{FEE_WALLET}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs sm:text-sm text-cyan-100">
                    <div className="flex items-center justify-between">
                      <span>Bonus FLOW</span>
                      <span className="font-semibold">{bonusFlow} FLOW</span>
                    </div>
                    <div className="mt-1 text-xs text-cyan-200/80">FLOW no forma parte del trading principal; se entrega como recompensa.</div>
                  </div>

                  <button
                    onClick={handleSwap}
                    disabled={!route || !quoteData || !isConnected || !isBsc}
                    className={`w-full rounded-xl px-5 py-3 font-bold text-sm sm:text-base text-white transition ${
                      route && quoteData && isConnected && isBsc
                        ? 'bg-gradient-to-r from-emerald-600 to-cyan-500 shadow-glow hover:brightness-110'
                        : 'cursor-not-allowed bg-slate-700 opacity-60'
                    }`}
                  >
                    {!isBsc ? 'Red no compatible' : !route || !quoteData ? 'Ruta no disponible' : 'Aprobar y Swap'}
                  </button>
                </div>
              )}

              {tab === 'referidos' && (
                <div className="space-y-4">
                  <div className="glass p-3 sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Gift className="h-5 w-5 text-cyan-300" />
                      <h3 className="text-base sm:text-lg font-semibold">Programa de Referidos</h3>
                    </div>

                    <label className="mb-2 block text-xs sm:text-sm text-slate-400">Código / Dirección de referencia</label>
                    <input
                      value={refAddress}
                      onChange={(event) => setRefAddress(event.target.value)}
                      placeholder="0x..."
                      className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 outline-none transition focus:border-cyan-500 text-sm"
                    />

                    <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 p-3">
                      <div className="text-xs uppercase text-slate-400">Link generado</div>
                      <div className="mt-2 break-all text-xs sm:text-sm text-cyan-300">{referralLink}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3 text-center">
                        <div className="text-xl sm:text-2xl font-bold">14</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Usuarios</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3 text-center">
                        <div className="text-xl sm:text-2xl font-bold">2.4K</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">FLOW</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3 text-center">
                        <div className="text-xl sm:text-2xl font-bold">8%</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Comisión</div>
                      </div>
                    </div>

                    <button
                      onClick={handleShare}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-pink-600 to-violet-500 px-5 py-3 font-bold text-sm sm:text-base text-white transition hover:brightness-110"
                    >
                      Compartir link
                    </button>
                  </div>
                </div>
              )}

              {tab === 'historial' && (
                <div className="space-y-4">
                  <div className="glass p-3 sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <History className="h-5 w-5 text-cyan-300" />
                      <h3 className="text-base sm:text-lg font-semibold">Historial</h3>
                    </div>

                    <div className="space-y-3">
                      {history.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-xs sm:text-sm text-slate-300">
                          Aún no hay transacciones guardadas localmente.
                        </div>
                      ) : (
                        history.map((tx) => (
                          <div key={tx.id} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-medium text-xs sm:text-sm truncate">{tx.type}</div>
                                <div className="text-[10px] sm:text-xs text-slate-400 truncate">{tx.hash}</div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-semibold text-xs sm:text-sm text-emerald-300">{tx.amount}</div>
                                <div className="text-[10px] sm:text-xs text-slate-400">{tx.status}</div>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between text-[10px] sm:text-xs text-slate-500">
                              <span>{tx.time}</span>
                              <span>Bonus {tx.bonusFlow} FLOW</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="card p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-cyan-300" />
                <h3 className="text-base sm:text-lg font-semibold">FLOW como bono</h3>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <div className="text-xs uppercase text-slate-400">Contrato de referencia</div>
                <div className="mt-1 text-base sm:text-xl font-bold">FLOW</div>
                <div className="mt-2 break-all text-xs sm:text-sm text-cyan-300">{FLOW_REWARD_ADDRESS}</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCopy(FLOW_REWARD_ADDRESS)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm transition hover:bg-white/10 flex items-center justify-center gap-1 sm:gap-2"
                >
                  <Copy className="h-4 w-4" /> Copiar
                </button>
                <button
                  onClick={() => window.open(`https://bscscan.com/token/${FLOW_REWARD_ADDRESS}`, '_blank', 'noopener,noreferrer')}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm transition hover:bg-white/10 flex items-center justify-center gap-1 sm:gap-2"
                >
                  <ExternalLink className="h-4 w-4" /> BscScan
                </button>
              </div>

              <button
                onClick={handleImportToken}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 px-4 py-3 text-xs sm:text-sm font-medium transition hover:brightness-110"
              >
                Importar FLOW a la wallet
              </button>
            </div>

            <div className="card p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-300" />
                <h3 className="text-base sm:text-lg font-semibold">Estado</h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
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
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 flex-shrink-0">Ruta</span>
                  <span className="font-medium text-emerald-300 truncate text-right">{route && route.length ? route.join(' → ') : 'No disponible'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 flex-shrink-0">Recaudación</span>
                  <span className="font-medium truncate text-right">{FEE_WALLET.slice(0, 6)}...{FEE_WALLET.slice(-4)}</span>
                </div>
              </div>
            </div>

            <div className="card p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-300" />
                <h3 className="text-base sm:text-lg font-semibold">Tokens BSC</h3>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['BNB', 'USDT', 'BUSD', 'USDC', 'ETH', 'BTCB', 'ADA', 'DOGE', 'CAKE', 'LINK', 'XRP', 'SOL', 'LTC'].map((token) => (
                  <span key={token} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] sm:text-xs text-slate-200">{token}</span>
                ))}
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 flex items-center justify-center py-4 text-xs sm:text-sm text-slate-400">
          <a
            href="https://wa.me/message/IJDDVLU7C27GO1"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 transition hover:text-white"
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
