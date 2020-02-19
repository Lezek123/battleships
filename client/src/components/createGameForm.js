import React, { Component } from 'react';
import ShipsBoard from './shipsBoard';
import NumberInput from './fields/NumberInput';
import Submit from './fields/Submit';
import { centerFlex } from '../styles/basic';
import styled from 'styled-components';

const StyledGameFormContainer = styled.div`
    ${ centerFlex('column') }
`;
const GameForm = styled.form`
    ${ centerFlex('column') }
`;
const GameFormField = styled.div`
    width: 100%;
    ${ centerFlex('column') };
`;
const BigLabel = styled.label`
    margin-top: 10px;
    font-size: 20px;
`;

export default class CreateGameForm extends Component {
    state = {
        data: {
            initialValue: '0.01',
            bombCost: '0.0002',
            timeoutBlocks: '20',
            ships: [],
        }
    }
    onInputChange = (e, modifiedValue = null) => {
        const {target} = e;
        this.setState(
            ({ data }) =>
            ({ data: { ...data, [target.name]: modifiedValue || target.value } })
        )
    }
    onShipPlacement = (ship) => {
        this.setState(
            ({ data }) =>
            ({ data: { ...data, ships: [...data.ships, ship] } })
        );
    }
    submit = (e) => {
        e.preventDefault();
        const { onSubmit } = this.props;
        onSubmit(this.state.data);
    }
    render() {
        const { data } = this.state;

        return (
            <StyledGameFormContainer>
                <h2>Create a game</h2>
                <GameForm onSubmit={ this.submit }>
                    <GameFormField>
                        <NumberInput
                            label="Initial value"
                            name="initialValue"
                            value={ data.initialValue }
                            onChange={ this.onInputChange }
                            unit={ 'ETH' }
                            min={ 0.00001 }
                            max={ 1 }
                            required={ true }
                            />
                    </GameFormField>
                    <GameFormField>
                        <NumberInput
                            label="Bomb cost"
                            name="bombCost"
                            value={ data.bombCost }
                            onChange={ this.onInputChange }
                            unit={ 'ETH' }
                            min={ 0.00001 }
                            max={ 1 }
                            required={ true }
                            />
                    </GameFormField>
                    <GameFormField>
                        <NumberInput
                            label="Timeout"
                            name="timeoutBlocks"
                            value={ data.timeoutBlocks }
                            onChange={ this.onInputChange }
                            unit={ 'blocks' }
                            min={ 10 }
                            max={ 120 }
                            required={ true }
                            />
                    </GameFormField>
                    <GameFormField>
                        <BigLabel>Ships:</BigLabel>
                        <ShipsBoard onPlacement={ this.onShipPlacement } />
                    </GameFormField>
                    <Submit text="Create game" />
                </GameForm>
            </StyledGameFormContainer>
        )
    }
}
