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
const STABLES = { USDT: USDT_ADDRESS, BUSD: BUSD_ADDRESS, USDC: USDC_ADDRESS }

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
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

const buildRoute = (fromSymbol, toSymbol) => {
  if (fromSymbol === toSymbol) return []
  const fromToken = TOKEN_MAP[fromSymbol]
  const toToken = TOKEN_MAP[toSymbol]
  if (!fromToken || !toToken) return []

  if (fromSymbol === 'BNB') return [WBNB_ADDRESS, toToken.address]
  if (toSymbol === 'BNB') return [fromToken.address, WBNB_ADDRESS]
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
  const [amount, setAmount] = useState('0.01')
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
      if (saved) setHistory(JSON.parse(saved).map(normalizeTx))
    } catch {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    if (history.length) localStorage.setItem('swap-flow-history', JSON.stringify(history))
  }, [history])

  const { data: bnbBalance } = useBalance({ address, query: { enabled: !!address } })
  const { data: usdtBalance } = useBalance({ address, token: USDT_ADDRESS, query: { enabled: !!address } })

  const isBsc = chainId === bsc.id || true
  const fromConfig = TOKEN_MAP[fromToken]
  const toConfig = TOKEN_MAP[toToken]
  const route = useMemo(() => buildRoute(fromToken, toToken), [fromToken, toToken])

  const parsedAmountIn = useMemo(() => {
    const validAmount = amount && Number(amount) > 0 ? amount : '0.001'
    try {
      return parseUnits(String(validAmount), fromConfig.decimals)
    } catch {
      return parseUnits('0.001', 18)
    }
  }, [amount, fromConfig.decimals])

  const { data: quoteData, isLoading: isQuoteLoading } = useReadContract({
    address: PANCAKE_ROUTER_ADDRESS,
    abi: PANCAKE_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [parsedAmountIn, route],
    query: { enabled: route.length > 0 && parsedAmountIn > 0n }
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
        return Math.max(1.8, Math.min(4.2, Number((current + delta).toFixed(2))))
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const handleConnect = () => {
    const connector = connectors.find((item) => item.name === 'MetaMask') || connectors[0]
    if (connector) connect({ connector })
    else alert('Instala MetaMask o Trust Wallet para continuar.')
  }

  const handleCopy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      alert('Texto copiado')
    } catch {
      alert('No fue posible copiar')
    }
  }

  const handleImportToken = async () => {
    if (!window.ethereum) return alert('No se detectó una wallet compatible.')
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
    }
  }

  const handleSwap = async () => {
    if (!isConnected) return alert('Conecta tu wallet para continuar.')
    if (!route || route.length === 0 || !quoteData || quoteData.length < 2) {
      return alert('No hay una ruta real disponible.')
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
        console.error('Error enviando a Supabase:', err)
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
      alert('Transacción enviada correctamente.')
    } catch (error) {
      console.error(error)
      alert('Error ejecutando el swap.')
    }
  }

  const tokenBalance = bnbBalance ? Number(formatUnits(bnbBalance.value, 18)).toFixed(3) : '0.000'
  const usdtDisplay = usdtBalance ? Number(formatUnits(usdtBalance.value, 18)).toFixed(2) : '0.00'

  return (
    <div className="min-h-screen bg-bg text-white w-full overflow-x-hidden">
      <div className="w-full max-w-md mx-auto px-3 py-4 box-border">
        
        {/* HEADER COMPACTO AJUSTADO A MÓVIL */}
        <header className="card mb-4 p-3 w-full box-border">
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-bold">Swap FLOW</div>
                <div className="text-[10px] text-slate-400">BSC + bonus FLOW</div>
              </div>
            </div>

            <div className="badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[10px] px-2 py-1">
              <ShieldCheck className="h-3 w-3" />
              BSC
            </div>
          </div>

          <div className="w-full pt-2 border-t border-white/10">
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 font-semibold text-xs text-white text-center shadow-glow"
              >
                Conectar wallet
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 w-full">
                <div className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-center">
                  <span className="text-slate-400 block text-[9px]">BNB</span>
                  <span className="font-semibold block text-[11px] truncate">{tokenBalance}</span>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-center">
                  <span className="text-slate-400 block text-[9px]">USDT</span>
                  <span className="font-semibold block text-[11px] truncate">{usdtDisplay}</span>
                </div>

                <button
                  onClick={() => disconnect()}
                  className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-[11px] hover:bg-white/10 flex items-center justify-center truncate"
                >
                  {formatAddress(address)}
                </button>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="space-y-4 w-full box-border">
          
          {/* PESTAÑAS DE NAVEGACIÓN */}
          <div className="card p-3 w-full box-border">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                {['swap', 'referidos', 'historial'].map((name) => (
                  <button
                    key={name}
                    onClick={() => setTab(name)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                      tab === name ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-400">No custodio</div>
            </div>

            {/* TAB: SWAP */}
            {tab === 'swap' && (
              <div className="space-y-3 w-full">
                
                {/* MINERO VIRTUAL REINTEGRADO */}
                <div className="glass p-3 w-full box-border">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-medium">Minero virtual</div>
                    <RefreshCcw className="h-3.5 w-3.5 text-slate-400 animate-spin" />
                  </div>

                  <div className="miner rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Hashrate Actual</div>
                    <div className="mt-1 text-2xl font-bold text-cyan-300">{hashRate.toFixed(2)} GH/s</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                      Procesando bloque de red...
                    </div>
                  </div>
                </div>

                {/* CAJA DE SELECCIÓN Y SWAP */}
                <div className="glass p-3 w-full box-border">
                  <div className="grid gap-2 grid-cols-2">
                    <div>
                      <div className="mb-1 text-[10px] uppercase text-slate-400">Desde</div>
                      <select
                        value={fromToken}
                        onChange={(e) => setFromToken(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950/60 p-2 text-xs outline-none text-white"
                      >
                        {TOKEN_LIST.map((t) => (
                          <option key={t.symbol} value={t.symbol} className="bg-slate-900 text-white">{t.symbol}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="mb-1 text-[10px] uppercase text-slate-400">Hacia</div>
                      <select
                        value={toToken}
                        onChange={(e) => setToToken(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950/60 p-2 text-xs outline-none text-white"
                      >
                        {TOKEN_LIST.map((t) => (
                          <option key={t.symbol} value={t.symbol} className="bg-slate-900 text-white">{t.symbol}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/50 p-2.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Tú pagas</span>
                      <span>{fromToken}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-transparent text-lg font-semibold outline-none min-w-0 text-white"
                        placeholder="0.00"
                      />
                      <span className="rounded bg-slate-800 px-2 py-1 text-xs flex-shrink-0">{fromToken}</span>
                    </div>
                  </div>

                  <div className="my-2 flex justify-center">
                    <button
                      onClick={() => {
                        const tmp = fromToken
                        setFromToken(toToken)
                        setToToken(tmp)
                      }}
                      className="rounded-full bg-slate-800 p-1.5 hover:bg-slate-700 transition"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-cyan-300" />
                    </button>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-slate-950/50 p-2.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Recibes (PancakeSwap)</span>
                      <span>Ruta real</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="text-lg font-semibold truncate min-w-0 text-emerald-300">
                        {isQuoteLoading ? 'Cargando...' : quote}
                      </div>
                      <span className="rounded bg-slate-800 px-2 py-1 text-xs flex-shrink-0">{toToken}</span>
                    </div>
                  </div>
                </div>

                {/* DETALLES DE FEE Y RECAUDACIÓN */}
                <div className="glass p-3 w-full box-border text-xs">
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Comisión de Mediación</span>
                    <span className="text-amber-300 font-semibold">{FEE_PERCENT}%</span>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span>Fee estimada:</span>
                      <span>{feeValue} {fromToken}</span>
                    </div>
                    <div className="mt-1 text-[10px] break-all text-amber-300">
                      Recaudación: {FEE_WALLET}
                    </div>
                  </div>
                </div>

                {/* BONUS FLOW */}
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-xs text-cyan-100">
                  <div className="flex justify-between font-semibold">
                    <span>Bonus Recompensa</span>
                    <span>{bonusFlow} FLOW</span>
                  </div>
                  <div className="mt-1 text-[10px] text-cyan-200/80">
                    FLOW se entrega mediante Edge Function al confirmar el swap.
                  </div>
                </div>

                {/* BOTÓN PRINCIPAL DE SWAP */}
                <button
                  onClick={handleSwap}
                  disabled={!route || !quoteData || quote === '0.00' || !isConnected}
                  className={`w-full rounded-xl py-3 font-bold text-sm text-white transition ${
                    route && quoteData && quote !== '0.00' && isConnected
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-500 shadow-glow hover:brightness-110'
                      : 'cursor-not-allowed bg-slate-700 opacity-60'
                  }`}
                >
                  {!isConnected 
                    ? 'Conecta tu wallet' 
                    : (!quoteData || quote === '0.00') 
                      ? 'Calculando cotización...' 
                      : 'Aprobar y Swap'}
                </button>
              </div>
            )}

            {/* TAB: REFERIDOS */}
            {tab === 'referidos' && (
              <div className="space-y-3">
                <div className="glass p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-cyan-300" />
                    <h3 className="text-sm font-semibold">Programa de Referidos</h3>
                  </div>

                  <label className="text-[10px] text-slate-400 block mb-1">Tu Billetera / Patrocinador</label>
                  <input
                    value={refAddress}
                    onChange={(e) => setRefAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-lg border border-white/10 bg-slate-950/60 p-2 text-xs outline-none text-white"
                  />

                  <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/50 p-2 break-all text-[11px] text-cyan-300">
                    {referralLink}
                  </div>

                  <button
                    onClick={() => handleCopy(referralLink)}
                    className="mt-3 w-full rounded-lg bg-gradient-to-r from-pink-600 to-violet-500 py-2.5 font-bold text-xs text-white shadow-glow"
                  >
                    Copiar Link de Referido
                  </button>
                </div>
              </div>
            )}

            {/* TAB: HISTORIAL */}
            {tab === 'historial' && (
              <div className="glass p-3">
                <div className="mb-2 flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-sm font-semibold">Historial de Swaps</h3>
                </div>

                <div className="space-y-2">
                  {history.length === 0 ? (
                    <div className="text-xs text-slate-400">Sin historial local registrado.</div>
                  ) : (
                    history.map((tx) => (
                      <div key={tx.id} className="rounded-lg border border-white/10 bg-slate-950/50 p-2 text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium">{tx.type}</span>
                          <span className="text-emerald-300">{tx.amount}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>{tx.hash}</span>
                          <span>+ {tx.bonusFlow} FLOW</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* INFORMACIÓN DEL TOKEN FLOW Y ESTADO */}
          <div className="card p-3 w-full box-border">
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-cyan-300" />
              <h3 className="text-sm font-semibold">Contrato Oficial FLOW</h3>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-950/50 p-2 break-all text-[11px] text-cyan-300">
              {FLOW_REWARD_ADDRESS}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCopy(FLOW_REWARD_ADDRESS)}
                className="rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs flex items-center justify-center gap-1 hover:bg-white/10"
              >
                <Copy className="h-3 w-3" /> Copiar
              </button>
              <button
                onClick={() => window.open(`https://bscscan.com/token/${FLOW_REWARD_ADDRESS}`, '_blank')}
                className="rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs flex items-center justify-center gap-1 hover:bg-white/10"
              >
                <ExternalLink className="h-3 w-3" /> BscScan
              </button>
            </div>

            <button
              onClick={handleImportToken}
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 py-2 text-xs font-medium text-white shadow-glow"
            >
              Importar FLOW a la Wallet
            </button>
          </div>

        </main>

        <footer className="mt-4 flex justify-center py-2">
          <a
            href="https://wa.me/message/IJDDVLU7C27GO1"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Soporte por WhatsApp
          </a>
        </footer>

      </div>
    </div>
  )
}

export default App
