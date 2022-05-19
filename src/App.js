import logo from './logo.svg';
import './App.css';
import { Web3ReactProvider } from '@web3-react/core';
import Web3 from 'web3';
import Presale from './components/Presale';

//returns a new Web3 object, with provider
function getLibrary(provider) {
  return new Web3(provider);
}

function App() {
  return (
    //wrapping everything with the provider
    //gives access to all the good stuff for talking to blockchain
    <Web3ReactProvider getLibrary={ getLibrary }>
      <Presale />
    </Web3ReactProvider>
  );
}

export default App;
