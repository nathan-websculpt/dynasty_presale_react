
//InjectedConnector is an abstraction layer on top of MetaMask logic
import { InjectedConnector } from "@web3-react/injected-connector";

export const Injected = new InjectedConnector({ //InjectedConnector for MetaMask (there are other connectors for other wallets)
    supportedChainIds: [1, 3, 4, 5, 42, 1337], // added '1337' for ganache dev
})