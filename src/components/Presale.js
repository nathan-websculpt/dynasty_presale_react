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
    //instance of the ERC20 Smart Contract
    const [usdcContractInstance, setusdcContractInstance] = useState(null);

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

            if(rfpContractInstance != null) {
                handleAllowanceDisplay();
            }
        } else {
            setDappMessage('You must have a wallet connected to deposit');
            setShowMessage(true);
            setShowRFP(false);
            setShowApprove(false);
            setShowPayment(false);
        }
    }, [library, rfpContractInstance]);
    
    async function initContractInstance() {     
        var fundingInstance = new library.eth.Contract(window.funding_abi, '0xEd148Baa6CD5721dcc43595273D40F6f1bffdED8');
        setFundingContractInstance(fundingInstance);

        var usdc_contract = new library.eth.Contract(window.usdc_abi, '0x1600c9592aC5Bbe9441f0e01441CA4BAc1Ec4e86');
        setusdcContractInstance(usdc_contract);
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

    async function approveUSDC() {
        let isNotNumber = isNaN(depositAmount);
        console.log('isNotNumber: ', isNotNumber);

        if(isNotNumber == false) {
            let USDCdecimals = await usdcContractInstance.methods.decimals().call();
            let paymentAmt = handleToConversion(depositAmount, USDCdecimals);
            console.log('amount to approve: ', paymentAmt);

            await usdcContractInstance.methods.approve('0xEd148Baa6CD5721dcc43595273D40F6f1bffdED8', paymentAmt).send({ from: account}).then(function(receipt) {
                setShowPayment(true);
                console.log('approveUSDC finished: ', receipt);
            }).catch(err => console.log(err));
        } else {
            alert('please enter a valid number');
        }
    }

    async function makePurchase() {
        let isNotNumber = isNaN(depositAmount);
        console.log('isNotNumber: ', isNotNumber);

        if(isNotNumber == false) {
            let USDCdecimals = await usdcContractInstance.methods.decimals().call();
            let paymentAmt = handleToConversion(depositAmount, USDCdecimals);
            console.log('amount to deposit: ', paymentAmt);

            await rfpContractInstance.methods.depositUSDC(
                paymentAmt
            ).send({ from: account }).then(function(receipt){
                console.log('deposit __>: ', receipt);
                handleAllowanceDisplay();
            }).catch(err => console.log(err));     
        } else {
            alert('please enter a valid number');
        }
    }

    async function getRequestSelf() {
        await fundingContractInstance.methods.getRequestsSelf().call({ from: account}).then(function(receipt) {
            console.log('getRequestSelf finished: ', receipt[0][0]);
            var rfpInstance = new library.eth.Contract( window.rfp_abi , receipt[0][0]);        
           setRfpContractInstance(rfpInstance);
           setShowApprove(true);
        }).catch(err => console.log(err));       
    }

    async function handleAllowanceDisplay() {
        let USDCdecimals = await usdcContractInstance.methods.decimals().call();
        if(rfpContractInstance != null) {
            let maxAmt = await rfpContractInstance.methods.getMaxAmountUSDC().call({from: account});
            console.log('max amount: ', maxAmt);

            let paidAmt = await rfpContractInstance.methods.getPaidAmountUSDC().call({from: account});
            console.log('paid amount: ', paidAmt);

            let diff = maxAmt - paidAmt;
            if(diff > 0) {
                diff = diff / (10 ** USDCdecimals);
                setDappMessage('You can still deposit: ' + diff);
                setShowMessage(true);
            } else {
                setDappMessage('You have deposited the max amount allowed');
                setShowMessage(true);
            }
        }
    }

    function handleToConversion (amount, dec){
        let stringf = "";
        for(var i=0;i < dec; i++){
            stringf = stringf+"0";
        }
        return amount+stringf;
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
                        <h5 style={{display: showMessage ? "block" : "none"}}>{dappMessage}</h5>
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