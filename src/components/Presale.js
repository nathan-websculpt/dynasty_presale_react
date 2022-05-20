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

    //instance of the RFPItem Smart Contract
    const [rfpContractInstance, setRfpContractInstance] = useState(null);
    //instance of the Funding Smart Contract
    const [fundingContractInstance, setFundingContractInstance] = useState(null);

    //subject's deposit amount
    const [depositAmount, setDepositAmount] = useState('');

    const [dappMessage, setDappMessage] = useState('');

    const [showMessage, setShowMessage] = useState(false);
    const [showRFP, setShowRFP] = useState(false);
    const [showApprove, setShowApprove] = useState(false);
    const [showPayment, setShowPayment] = useState(false);


    //init the Smart Contract Instance - when library is available
    useEffect(() => {
        //library gives access to web3
        if(library != null) {
            initContractInstance();
            setDappMessage('');
            setShowMessage(false);
            setShowRFP(true);
            console.log('useEffect() initialized the contract instance');
        } else {
            setDappMessage('You must have a wallet connected to deposit');
            setShowMessage(true);
            setShowRFP(false);
            setShowApprove(false);
            setShowPayment(false);
            console.log('library is null...');
        }
    }, [library]);
    
    async function initContractInstance() {     
        var fundingInstance = new library.eth.Contract(window.funding_abi, '0x9964EdB894D2150bDa68B5513542d1DB4Ab036e3');
        setFundingContractInstance(fundingInstance);
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

    async function makePurchase() {
        let paymentAmt = library.utils.toBN(depositAmount, 'ether' );
        console.log('payment amount', paymentAmt);
        await rfpContractInstance.methods.depositUSDC(
            paymentAmt
          ).send({ from: account }).then(function(receipt){
              let eventLog = receipt.events.DataLog.returnValues[0]; 
              console.log('__>: ', eventLog);
          });
    }

    async function approveUSDC() {
        console.log('approveUSDC running ... ');
        let paymentAmt = library.utils.toBN(depositAmount, 'ether' );
        console.log('amount to approve', paymentAmt);
        let usdc_contract = new library.eth.Contract(window.usdc_abi, '0x1600c9592aC5Bbe9441f0e01441CA4BAc1Ec4e86');
        await usdc_contract.methods.approve('0x9964EdB894D2150bDa68B5513542d1DB4Ab036e3', paymentAmt).send({ from: account}).then(function(receipt) {
            setShowPayment(true);
            console.log('approveUSDC finished: ', receipt);
        }).catch(err => console.log(err));
    }

    async function getRequestSelf() {
        console.log('getRequestSelf running ... ');
        await fundingContractInstance.methods.getRequestsSelf().call({ from: account}).then(function(receipt) {
            console.log('getRequestSelf finished: ', receipt[0][0]);
            var rfpInstance = new library.eth.Contract( window.rfp_abi , receipt[0][0]);        
           setRfpContractInstance(rfpInstance);
           setShowApprove(true);
        }).catch(err => console.log(err));
           

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
                
                <Row className='mt-5 mb-5'>  
                    <Col className='text-center'>
                        <h6 style={{display: showMessage ? "block" : "none"}}>{dappMessage}</h6>
                    </Col>
                </Row> 

                <Row className='mt-5 mb-5'>  
                    <Col className='text-center'>
                        <Button variant='dark' onClick={ getRequestSelf } style={{display: showRFP ? "inline-block" : "none"}}>Request for Payment</Button>  
                    </Col>
                </Row> 

                <Row className='mt-5 mb-5'>
                    <Col md={{span: 4, offset: 4}} className='text-center' style={{display: showApprove ? "inline-block" : "none"}}>
                        <h6>USDC Amount:</h6>
                        <FormControl
                            type='text' value={ depositAmount } 
                            onChange={ (event) => 
                                setDepositAmount(event.target.value) }/>
                    </Col>
                </Row>
                <Row>
                    <Col className='text-center' style={{display: showApprove ? "inline-block" : "none"}}>
                        <Button variant='dark' onClick={ approveUSDC }>approve usdc</Button>  
                    </Col>
                </Row>
                <Row className='mt-3 mb-5'>
                    <Col className='text-center' style={{display: showPayment ? "inline-block" : "none"}}>
                        <Button variant='dark' onClick={ makePurchase }>make payment</Button>  
                    </Col>
                </Row>
        </Container>
    )

}