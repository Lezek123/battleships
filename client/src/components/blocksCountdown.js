import React, { Component } from 'react';
import ContractsManager from '../helpers/contracts';
import styled from 'styled-components';
import { blocksToRoundedInterval } from '../helpers/converters';

const countdownThemes = {
    danger: { color: '#ff0000' },
    warning: { color: '#ff9900' },
    default: { color: '#fff' },
}
const StyledBlocksCountdown = styled.span`
    color: ${ props => props.theme.color };
    transition: color 1s;
`;

StyledBlocksCountdown.defaultProps = { theme: countdownThemes.default };

export default class BlocksCountdown extends Component {
    state = { currentBlockNumber: null }

	async componentWillMount() {
		this._contractsManager = new ContractsManager();
        this._web3 = await this._contractsManager.getWeb3();
        const currentBlockNumber = await this._web3.eth.getBlockNumber();
        this.setState({ currentBlockNumber }, this.checkIfTimeoutReached);
		this.newHeadersSubscription = this._web3.eth.subscribe('newBlockHeaders')
			.on('data', this.onNewBlockHeader);
	}

	onNewBlockHeader = (blockHeader) => {
		if (blockHeader.number) {
            this.setState({ currentBlockNumber: blockHeader.number }, this.checkIfTimeoutReached);
		}
    }

    checkIfTimeoutReached = () => {
        const { currentBlockNumber } = this.state;
        const { onTimeoutReached, targetBlock } = this.props;
        if (currentBlockNumber >= targetBlock && onTimeoutReached) {
            onTimeoutReached();
        }
    }
    
    render() {
        const { currentBlockNumber } = this.state;
        const {
            targetBlock,
            warningBelow = 20,
            dangerBelow = 5,
            reachedText = 'Timeout has been reached!'
        } = this.props;

        const blocksLeft = targetBlock - currentBlockNumber;

        let currentTheme = countdownThemes.default;
        if (blocksLeft < dangerBelow) currentTheme = countdownThemes.danger;
        else if (blocksLeft < warningBelow) currentTheme = countdownThemes.warning;

        if (!currentBlockNumber) return null;
        return (
            <StyledBlocksCountdown theme={currentTheme}>
                { blocksLeft > 0 ?
                    `${ blocksLeft } blocks left (${ blocksToRoundedInterval(blocksLeft) })`
                    : `Timeout has been reached!` }
            </StyledBlocksCountdown>
        )
    }
}
