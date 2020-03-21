import React, { Component } from 'react';
import styled from 'styled-components';
import ContractsManager from '../helpers/contracts';

const StyledTxLink = styled.a`
    color: #ccddff;
    transition: color 0.5s;
    &:hover {
        color: #fff;
    }
`;

const ROPSTEN_CHAIN_ID = 3;

export default class TxLink extends Component {
    state = { isRopsten: false }
    async componentWillMount() {
        const cm = new ContractsManager();
        const web3 = await cm.getWeb3();
        const chainId = await web3.eth.getChainId();
        if (chainId === ROPSTEN_CHAIN_ID) this.setState({ isRopsten: true }); 
    }
    render() {
        const { tx } = this.props;
        const { isRopsten } = this.state;
        return (
            <StyledTxLink href={ `https://${ isRopsten ? 'ropsten.' : '' }etherscan.io/tx/${ tx }` } target={ '_blank' }>
                { tx.slice(0, 8) + '...' }
            </StyledTxLink>
        )
    }
}
