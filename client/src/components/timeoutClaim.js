import React, { Component } from 'react';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';
import BlocksCountdown from './blocksCountdown';
import Claim from './claim';

const StyledTimeoutClaim = styled.div`
    margin: 20px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 20px;
    ${ centerFlex('column') };
    flex-wrap: wrap;
    font-size: 18px;
`;
const TimeoutClaimHeader = styled.div`
    ${ centerFlex('row') };
    margin-right: 5px;
`;
const TimeoutHeaderIcon = styled.div`
    font-size: 22px;
    margin-right: 5px;
`;
const TimeoutClaimCountdown = styled.div`
    font-size: 16px;
    width: 100%;
    text-align: center;
`;
const ClaimingSection = styled.div`
    margin-top: 10px;
`;

export default class TimeoutClaim extends Component {
    state = { timeoutReached: false };
    render() {
        const { timeoutName, timeoutIcon, timeoutBlock, canUserClaim, claimMethod, claimAmount } = this.props;
        const { timeoutReached } = this.state;
        return (
            <StyledTimeoutClaim>
                <TimeoutClaimHeader>
                    <TimeoutHeaderIcon>
                        { timeoutIcon }
                    </TimeoutHeaderIcon>
                    { timeoutName } timeout block: #{ timeoutBlock }
                </TimeoutClaimHeader>
                <TimeoutClaimCountdown>
                    <BlocksCountdown targetBlock={ timeoutBlock } onTimeoutReached={ () => this.setState({ timeoutReached: true }) }/>
                </TimeoutClaimCountdown>
                { (timeoutReached && canUserClaim) && (
                    <ClaimingSection>
                        <Claim claimMethod={ claimMethod } amount={ claimAmount }/>
                    </ClaimingSection>
                ) }
            </StyledTimeoutClaim>
        )
    }
}
