import React, { Component } from 'react';
import { BigButton, themes } from './navigation/buttons';
import styled from 'styled-components';
import { round } from '../helpers/math';

const ClaimedInfo = styled.div``;

export default class Claim extends Component {
    state = { claimTx: null };

    claim = async () => {
        const { claimMethod } = this.props;
        const result = await claimMethod();
        if (result) {
            this.setState({ claimTx: result.tx });
        }
    }

    render() {
        const { amount } = this.props;
        const { claimTx } = this.state;
        return (
            !claimTx ? (
                <BigButton theme={themes.primary} onClick={this.claim} shining>
                    Claim { round(amount, 8) } ETH!
                </BigButton>
            ) : (
                <ClaimedInfo>
                    Reward has been claimed!<br/>
                    Transaction: { claimTx }
                </ClaimedInfo>
            )
        );
    }
}
