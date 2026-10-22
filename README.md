# Swap FLOW

Proyecto React + Vite + Tailwind CSS + wagmi/viem + PWA listo para Cloudflare Pages.

## Stack

- Vite
- React
- Tailwind CSS
- Lucide React
- wagmi
- viem
- PWA manifest + service worker

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

## Build para producción

```bash
npm run build
```

## Despliegue en Cloudflare Pages

Configuración recomendada:
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `None`

## Datos oficiales

- Nombre: Swap FLOW
- Token: FLOW (bono/recompensa)
- Red: Binance Smart Chain Mainnet (Chain ID: 56)
- Contrato FLOW: `0x48421f6da4e1d367bc1c6f4f9afa334312969638`
- Wallet Fee (1.3%): `0x2da29b4D5297b261B4899D97Df56AE36F195f26d`
- WhatsApp: `https://wa.me/message/IJDDVLU7C27GO1`

## Arquitectura real usada

- Swap principal: tokens reales de BSC con rutas de PancakeSwap
- FLOW: no entra como par de trading principal, se usa como recompensa/bonus
- Historial local: guardado en localStorage y listo para sincronizar con Supabase
- Referidos: link con `?ref=0x...`

## Tokens principales soportados

- BNB
- USDT
- BUSD
- USDC
- ETH
- BTCB
- ADA
- DOGE
- CAKE
- LINK
- XRP
- SOL
- LTC

## Nota

El proyecto está estructurado como PWA, con manifest y service worker para despliegue en Cloudflare Pages.
