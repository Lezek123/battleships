import React, { Component } from 'react';
import styled from 'styled-components';
import Board from './board';
import { centerFlex } from '../styles/basic';
import { fetchGameContractData } from '../helpers/contracts';
import { getWeb3 } from '../helpers/web3';
import { round } from '../helpers/math';
import Submit from './fields/Submit';
import { FormField, FieldInfo } from './fields/formFields';
// import { useParams } from 'react-router-dom';

const StyledGame = styled.div`
    width: 400px;
    ${ centerFlex('column') };
`;
const AttackForm = styled.form`
    width: 100%;
    ${ centerFlex('column') }
`;

export default class JoinedGame extends Component {
    state = {
        contractData: null,
        placedBombs: [],
    }
    
    async componentWillMount() {
        this.web3 = await getWeb3();
        const contractData = await fetchGameContractData(this.props.address);
        this.setState({ contractData });
    }

    onBombPlacement = (placedBombCoordinates) => {
        this.setState(({ placedBombs }) => ({ placedBombs: [...placedBombs, placedBombCoordinates] }));
    }

    isAttackValid = () => {
        return this.state.placedBombs.length >= 25;
    }

    getPlacedBombsAs2dArray = () => {
        const { placedBombs } = this.state;

        return Array.from(Array(10)).map((cols, x) =>
            Array.from(Array(10)).map((field, y) =>
                placedBombs.some(({ x: placedX, y: placedY}) => x === placedX && y === placedY)
            )
        );
    }

    submitAttack = async (e) => {
        e.preventDefault();
        if (!this.isAttackValid()) return;

        const { contractData: { contractInstance, bombCost }, placedBombs } = this.state;
        const bombsCost = bombCost * placedBombs.length;
        const playerAddr = this.web3.currentProvider.selectedAddress;

        await contractInstance.setBombs(
            this.getPlacedBombsAs2dArray(),
            { from: playerAddr, value: this.web3.utils.toWei(bombsCost.toString()) }
        );
    }

    render() {
        const { contractData, placedBombs } = this.state;
        
        return (
            <StyledGame>
                <h1>Place your bombs</h1>
                <AttackForm onSubmit={ this.submitAttack }>
                    <FormField>
                        <Board xSize={10} ySize={10} objectXSize={1} objectYSize={1} onPlacement={ this.onBombPlacement }/>
                        { contractData && (
                            <div>
                                <div>Bombs placed: { placedBombs.length }</div>
                                <div>Total bombs cost: { round(placedBombs.length * contractData.bombCost, 8) } ETH</div>
                                <div>Winning reward: { round(contractData.prize - placedBombs.length * contractData.bombCost, 8) } ETH</div>
                            </div>
                        ) }
                        { !this.isAttackValid() && <FieldInfo text={ `You have to place at least 25 bombs` } /> }
                    </FormField>
                    <Submit text="Attack" disabled={ !this.isAttackValid() } />
                </AttackForm>
            </StyledGame>
        )
    }
}
