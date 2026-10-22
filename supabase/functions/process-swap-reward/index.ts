import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { ethers } from 'https://esm.sh/ethers@6.7.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const FLOW_TOKEN_ADDRESS = '0x48421f6da4e1d367bc1c6f4f9afa334312969638'
const PANCAKE_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
const FLOW_PER_USDT = 300
const REFERRAL_BONUS_PERCENT = 0.10
const MIN_SWAP_USDT = 0.01
const MAX_SWAP_USDT = 500000

const RPC_LIST = [
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
  'https://bsc-dataseed3.binance.org/',
  'https://bscrpc.com'
]

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
]

type RewardPayload = {
  userWallet: string
  referrerWallet?: string | null
  swapAmountUsdt: number
  txHash: string
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim()
}

function isValidAddress(value: unknown) {
  return typeof value === 'string' && ethers.isAddress(value)
}

function normalizeAddress(value: string) {
  return ethers.getAddress(value)
}

async function getWorkingProvider() {
  for (const url of RPC_LIST) {
    try {
      const provider = new ethers.JsonRpcProvider(url)
      await provider.getBlockNumber()
      return provider
    } catch {
      // intenta con el siguiente RPC
    }
  }
  throw new Error('No se pudo conectar a ningún nodo RPC de BSC')
}

async function verifySwapTx({ txHash, userWallet, provider }: { txHash: string; userWallet: string; provider: ethers.JsonRpcProvider }) {
  if (!txHash || typeof txHash !== 'string') throw new Error('txHash requerido')

  const tx = await provider.getTransaction(txHash)
  if (!tx) throw new Error('La transacción no existe en BSC')

  const receipt = await provider.getTransactionReceipt(txHash)
  if (!receipt) throw new Error('La transacción aún no está confirmada')
  if (receipt.status !== 1) throw new Error('La transacción falló')

  if (!tx.from || tx.from.toLowerCase() !== userWallet.toLowerCase()) {
    throw new Error('La transacción no pertenece a la wallet del usuario')
  }

  if (!tx.to || tx.to.toLowerCase() !== PANCAKE_ROUTER_ADDRESS.toLowerCase()) {
    throw new Error('La tx no corresponde al router de PancakeSwap')
  }

  return { txHash, txFrom: tx.from, txTo: tx.to, confirmed: true }
}

async function isAlreadyProcessed({ supabaseAdmin, txHash, userWallet }: { supabaseAdmin: any; txHash: string; userWallet: string }) {
  const { data, error } = await supabaseAdmin
    .from('swap_rewards')
    .select('id')
    .eq('tx_hash', txHash.toLowerCase())
    .limit(1)

  if (error) {
    console.error('Error consultando duplicados:', error)
    return false
  }

  if (data && data.length > 0) return true

  return false
}

function getAuthenticatedWallet(user: any) {
  const candidate =
    user?.user_metadata?.wallet ??
    user?.user_metadata?.wallet_address ??
    user?.app_metadata?.wallet ??
    null

  if (!candidate) return null
  return normalizeAddress(candidate)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405)
  }

  try {
    const authToken = getBearerToken(req)
    if (!authToken) {
      return jsonResponse({ error: 'Token de autenticación requerido' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Faltan variables de entorno' }, 500)
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${authToken}` } }
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser(authToken)
    if (userError || !user) {
      return jsonResponse({ error: 'No autorizado', details: userError?.message ?? null }, 401)
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return jsonResponse({ error: 'Payload inválido' }, 400)
    }

    const { userWallet, referrerWallet, swapAmountUsdt, txHash } = body as Partial<RewardPayload>

    if (!txHash || typeof txHash !== 'string') {
      return jsonResponse({ error: 'txHash requerido' }, 400)
    }

    if (!isValidAddress(userWallet)) {
      return jsonResponse({ error: 'userWallet no válido' }, 400)
    }

    const normalizedUserWallet = normalizeAddress(userWallet)
    const authenticatedWallet = getAuthenticatedWallet(user)

    if (authenticatedWallet && authenticatedWallet.toLowerCase() !== normalizedUserWallet.toLowerCase()) {
      return jsonResponse({ error: 'La wallet enviada no coincide con la wallet autenticada' }, 403)
    }

    const parsedAmount = Number(swapAmountUsdt)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return jsonResponse({ error: 'swapAmountUsdt inválido' }, 400)
    }

    if (parsedAmount < MIN_SWAP_USDT || parsedAmount > MAX_SWAP_USDT) {
      return jsonResponse({ error: `swapAmountUsdt fuera de rango (${MIN_SWAP_USDT} - ${MAX_SWAP_USDT})` }, 400)
    }

    const referrer = referrerWallet && isValidAddress(referrerWallet) ? normalizeAddress(referrerWallet) : null
    if (referrer && referrer.toLowerCase() === normalizedUserWallet.toLowerCase()) {
      return jsonResponse({ error: 'El referido no puede ser el mismo usuario' }, 400)
    }

    const provider = await getWorkingProvider()
    const verifiedTx = await verifySwapTx({ txHash, userWallet: normalizedUserWallet, provider })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const duplicate = await isAlreadyProcessed({
      supabaseAdmin,
      txHash,
      userWallet: normalizedUserWallet
    })

    if (duplicate) {
      return jsonResponse({ success: false, error: 'La recompensa para esta transacción ya fue procesada' }, 409)
    }

    const privateKey = Deno.env.get('DISTRIBUTOR_PRIVATE_KEY')
    if (!privateKey) {
      return jsonResponse({ error: 'Falta DISTRIBUTOR_PRIVATE_KEY' }, 500)
    }

    const wallet = new ethers.Wallet(privateKey, provider)
    const flowContract = new ethers.Contract(FLOW_TOKEN_ADDRESS, ERC20_ABI, wallet)

    const rewardFlow = parsedAmount * FLOW_PER_USDT
    const rewardWei = ethers.parseUnits(rewardFlow.toFixed(4), 18)

    const distributorBalanceWei = await flowContract.balanceOf(wallet.address)
    if (distributorBalanceWei < rewardWei) {
      return jsonResponse({
        error: 'Fondos insuficientes en la wallet distribuidora de FLOW',
        distributorWallet: wallet.address
      }, 500)
    }

    const userTx = await flowContract.transfer(normalizedUserWallet, rewardWei)
    const userReceipt = await userTx.wait()

    let referrerRewardFlow = 0
    let referrerTxHash: string | null = null

    if (referrer) {
      const refBonus = rewardFlow * REFERRAL_BONUS_PERCENT
      const refBonusWei = ethers.parseUnits(refBonus.toFixed(4), 18)

      if (distributorBalanceWei >= rewardWei + refBonusWei) {
        const refTx = await flowContract.transfer(referrer, refBonusWei)
        const refReceipt = await refTx.wait()
        referrerRewardFlow = refBonus
        referrerTxHash = refReceipt.hash
      } else {
        console.warn('No hay saldo suficiente para el bonus de referido')
      }
    }

    const logPayload = {
      user_wallet: normalizedUserWallet.toLowerCase(),
      referrer_wallet: referrer ? referrer.toLowerCase() : null,
      tx_hash: txHash.toLowerCase(),
      swap_amount_usdt: parsedAmount,
      reward_flow: rewardFlow,
      referrer_reward_flow: referrerRewardFlow,
      status: 'processed',
      created_at: new Date().toISOString()
    }

    const { error: insertError } = await supabaseAdmin
      .from('swap_rewards')
      .insert(logPayload)

    if (insertError) {
      console.error('Error guardando log:', insertError)
    }

    return jsonResponse({
      success: true,
      message: 'Recompensa de FLOW procesada',
      data: {
        userWallet: normalizedUserWallet,
        referrerWallet: referrer,
        txHash: verifiedTx.txHash,
        swapValueUsdt: parsedAmount,
        rewardFlow,
        userTxHash: userReceipt.hash,
        referrerRewardFlow,
        referrerTxHash
      }
    })
  } catch (error: any) {
    console.error('Error en process-swap-reward:', error)
    return jsonResponse({
      error: error.message || 'Error interno del servidor'
    }, 500)
  }
})
