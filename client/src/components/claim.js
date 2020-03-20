import React, { Component } from 'react';
import { BigButton, themes } from './navigation/buttons';
import styled from 'styled-components';
import { round } from '../helpers/math';
import Loader from './loader';
import TxLink from './txLink';

const ClaimedInfo = styled.div`
    text-align: center;
`;

export default class Claim extends Component {
    state = { claiming: false, claimTx: null };

    claim = async () => {
        const { claimMethod } = this.props;
        this.setState({ claiming: true });
        try {
            const result = await claimMethod();
            this.setState({ claiming: false, claimTx: result.tx });
        } catch(e) {
            console.log(e);
            this.setState({ claiming: false });
        }
    }

    render() {
        const { amount } = this.props;
        const { claimTx, claiming } = this.state;
        if (claiming) {
            return <Loader text={ `Claiming ${ round(amount, 8) } ETH...` }/>;
        }
        else if (!claimTx) {
            return (
                <BigButton theme={themes.primary} onClick={this.claim} shining>
                    Claim { round(amount, 8) } ETH!
                </BigButton>
            );
        }
        else {
            return (
                <ClaimedInfo>
                    Reward has been claimed!<br/>
                    Transaction: <TxLink tx={ claimTx } />
                </ClaimedInfo>
            );
        }
    }
}
