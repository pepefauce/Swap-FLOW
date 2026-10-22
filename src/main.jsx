import React from 'react'
import ReactDOM from 'react-dom/client'
import { http, createConfig, WagmiProvider } from 'wagmi'
import { bsc } from 'wagmi/chains'
import App from './App'
import './index.css'

const config = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org/')
  }
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <App />
    </WagmiProvider>
  </React.StrictMode>
)
