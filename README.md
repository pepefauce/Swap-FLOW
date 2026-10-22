# Swap FLOW

Proyecto React + Vite + Tailwind CSS + wagmi/viem + PWA orientado a Cloudflare Pages.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build para producción

```bash
npm run build
```

## Deploy en Cloudflare Pages

Configuración recomendada:
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/`

## Variables de entorno

Crea un archivo `.env` si quieres activar WalletConnect:

```bash
VITE_WALLETCONNECT_PROJECT_ID=tu_project_id
```

## Datos del proyecto

- Nombre: Swap FLOW
- Red: Binance Smart Chain Mainnet (Chain ID: 56)
- Flow reward address: `0x48421f6da4e1d367bc1c6f4f9afa334312969638`
- Wallet Fee (1.3%): `0x2da29b4D5297b261B4899D97Df56AE36F195f26d`
- WhatsApp: `https://wa.me/message/IJDDVLU7C27GO1`

## Arquitectura de trading

- FLOW no entra en el swap principal.
- FLOW se usa como bonus/recompensa, no como activo de trading real.
- El swap principal soporta tokens reales de BSC con liquidez en PancakeSwap y rutas disponibles, como:
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

## Stack incluido

- React
- Vite
- Tailwind CSS
- Lucide React
- wagmi
- viem
- PWA
