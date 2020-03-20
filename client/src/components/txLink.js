import React, { Component } from 'react';
import styled from 'styled-components';

const StyledTxLink = styled.a`
    color: #ccddff;
    transition: color 0.5s;
    &:hover {
        color: #fff;
    }
`;

export default class TxLink extends Component {
    render() {
        const { tx } = this.props;
        return (
            <StyledTxLink href={ `https://etherscan.io/tx/${ tx }` } target={ '_blank' }>
                { tx.slice(0, 8) + '...' }
            </StyledTxLink>
        )
    }
}
