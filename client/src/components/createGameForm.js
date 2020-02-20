import React, { Component } from 'react';
import ShipsBoard from './shipsBoard';
import NumberInput from './fields/NumberInput';
import Submit from './fields/Submit';
import { centerFlex } from '../styles/basic';
import styled from 'styled-components';
import { Info as InfoIcon } from '@material-ui/icons';
import color from '../constants/colors';

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

const StyledFieldInfo = styled.div`
    margin: 10px 0;
    ${ centerFlex('row') };
    color: ${ color.INFO_LIGHT };
`;
const FieldInfoIcon = styled(InfoIcon)`
    margin-right: 5px;
`;
const FieldInfo = ({ text }) => (
    <StyledFieldInfo>
        <FieldInfoIcon />
        { text }
    </StyledFieldInfo>
);

export default class CreateGameForm extends Component {
    state = {
        data: {
            initialValue: '0.01',
            bombCost: '0.0002',
            timeoutBlocks: '20',
            ships: [],
        },
        validity: {
            initialValue: true,
            bombCost: true,
            timeoutBlocks: true
        }
    }

    onInputChange = (e, modifiedValue = null, errors = []) => {
        const {target} = e;
        this.setState(
            ({ data, validity }) => (
                {
                    data: { ...data, [target.name]: modifiedValue || target.value },
                    validity: { ...validity, [target.name]: errors.length === 0 ? true : false }
                }
            )
        )
    }

    onShipPlacement = (ship) => {
        const newShipsLength = this.state.data.ships.length + 1;
        this.setState(
            ({ data, validity }) => (
                {
                    data: { ...data, ships: [...data.ships, ship] },
                    validity: { ...validity, ships: newShipsLength === 5 ? true : false }
                }
            ),
        );
    }

    isValid = () => {
        const { data, validity } = this.state;
        return Object.keys(data).every(fieldName => validity[fieldName]);
    }

    submit = (e) => {
        e.preventDefault();
        const { onSubmit } = this.props;

        if (this.isValid()) {
            onSubmit(this.state.data);
        }
    }

    render() {
        const { data, validity } = this.state;

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
                            min={ validity.initialValue ? data.initialValue / 100 : 0.00001 }
                            max={ validity.initialValue ? data.initialValue / 26 : 1 }
                            required={ true }
                            />
                            { (validity.initialValue && validity.bombCost) && (
                                <FieldInfo
                                    text= { `Placing more than ${ Math.ceil(data.initialValue / data.bombCost) - 1 } bombs will become unprofitable` } />
                            ) }
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
                    <Submit text="Create game" disabled={ !this.isValid() }/>
                </GameForm>
            </StyledGameFormContainer>
        )
    }
}
