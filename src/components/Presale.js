import { useEffect, useState } from 'react';
import { Container, Row, Col, Button, FormControl, InputGroup } from 'react-bootstrap';
import { Injected } from './wallet/Connectors';
import { useWeb3React } from '@web3-react/core';
import '../abi.js';

export default function Presale() {
    
    // active:      Is there a wallet connected?
    // account:     Address 
    // library:     Web3 (or, ethers if that's what you used)
    // connector:   'Injected' connector
    // activate:    Method to connect to wallet
    // deactivate:  Method to disconnect from wallet
    const { active, account, library, connector, activate, deactivate } = useWeb3React();

    //instance of the Smart Contract
    const [contractInstance, setContractInstance] = useState(null);

    //init the Smart Contract Instance - when library is available
    useEffect(() => {
        //library gives access to web3
        if(library != null) {
            initContractInstance();
            console.log('useEffect() initialized the contract instance');
        } else {
            console.log('library is null...');
        }
    }, [library]);
    
    async function initContractInstance() {        
        var ci = new library.eth.Contract( window.cl_abi , '0x9f143Aeba1250A491122D905e84E984Eea3CCDaA');
        
        setContractInstance(ci);
        console.log("init contract instance...");
    }

    async function connectToMetaMask() {
        try {
            await activate(Injected); //calls the activate method provided by useWeb3React()
        } catch (ex) {
            console.log(ex);
        }
    }

    async function disconnectMetaMask() {
        try {
            await deactivate(); //calls the deactivate method provided by useWeb3React()
        } catch (ex) {
            console.log(ex);
        }
    }

    //EVENT LISTENER
    async function startListener() {
        console.log('starting listener...');
        contractInstance.events.allEvents()
            .on('data', (event) => {
                console.log(event);
            })
            .on('error', console.error);

    }

    async function getMaxAmt() {
        //calling the public variable in contract
        let data = await contractInstance.methods.getMaxAmount().call();
        console.log('Max Amount: ', data);
    }

    async function makePurchase() {
        //let paymentAmt = library.utils.toBN(5, 'ether' );
        let paymentAmt = library.utils.fromWei('1000000000000000000', 'ether');
        console.log(paymentAmt);
        await contractInstance.methods.depositUSDC(
            paymentAmt
          ).send({ from: account, value: paymentAmt }).then(function(receipt){
              let eventLog = receipt.events.DataLog.returnValues[0]; 
              console.log('__>: ', eventLog);
          });
    }

    async function approveUSDC() {
        console.log('approveUSDC running ... ');
        let usdc_contract = new library.eth.Contract(window.usdc_abi, '0x1600c9592aC5Bbe9441f0e01441CA4BAc1Ec4e86');
        await usdc_contract.methods.approve(account, library.utils.toBN(5, 'ether' )).send({ from: account}).then(function(receipt) {
            console.log('approveUSDC finished: ', receipt);
        }).catch(err => console.log(err));;
    }

    async function estimateGas() {
        let paymentAmt = library.utils.fromWei('1000000000000000000', 'ether');
        // console.log('payment amt: ', paymentAmt);
        // let encodedABI = contractInstance.methods.depositUSDC(paymentAmt).encodeABI();
        // console.log('encoded abi: ', encodedABI);
        // let estimateGas = await library.eth.estimateGas(
        //     {
        //         //"value": '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b', // Only tokens
        //         "data": contractInstance.methods.depositUSDC(paymentAmt).encodeABI(),
        //         "from": account,
        //         "to": '0xd3B152290e429038Cf9aC0e1F03Bc1e9eB05b6fb'
        //     }
        //     );
        //     console.log('gas estimate', estimateGas);

        await contractInstance.methods.depositUSDC(paymentAmt).estimateGas({from: account, value: paymentAmt})
            .then(function(gasAmount){
                console.log('gas: ', gasAmount);
            })
            .catch(function(error){
                console.log('err: ', error);
            });
    }

    return (
        <Container>
            <Row className='mt-5 mb-5'>
                <Col className='text-center'>
                        {active ? <span>Connected Account: <b>{account}</b></span> : <span>Not Connected</span>} 
                </Col>
            </Row>
            <Row className='mt-5 mb-5'>
                    <Col className='text-center'>
                        <Button 
                            onClick={connectToMetaMask}>
                                Connect to MetaMask
                        </Button>
                    </Col>   
                    <Col className='text-center'>
                        <Button
                            onClick={disconnectMetaMask}>
                                Disconnect
                        </Button>
                    </Col>   
                </Row> 
                <Row>  
                    <Col md={{ span: 4, offset: 2 }} className='text-center'>
                        <Button variant='dark' onClick={ startListener }>Listen</Button>    
                    </Col>
                    <Col md={{ span: 4 }} className='text-center'>
                        <Button variant='dark' onClick={ getMaxAmt }>Max Amount?</Button>  
                    </Col>
                    <Col md={{ span: 4 }} className='text-center'>
                        <Button variant='dark' onClick={ makePurchase }>doit</Button>  
                    </Col>
                    <Col md={{ span: 4 }} className='text-center'>
                        <Button variant='dark' onClick={ approveUSDC }>approve usdc</Button>  
                    </Col>
                    <Col md={{ span: 4 }} className='text-center'>
                        <Button variant='dark' onClick={ estimateGas }>estimate gas</Button>  
                    </Col>
                </Row> 
        </Container>
    )

}