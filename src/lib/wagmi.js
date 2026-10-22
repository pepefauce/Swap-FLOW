import { createConfig, http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

const connectors = [injected()]

if (walletConnectProjectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId
    })
  )
}

export const config = createConfig({
  chains: [bsc],
  connectors,
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org/')
  }
})
