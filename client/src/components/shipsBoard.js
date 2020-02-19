import React, { Component } from 'react';
import Board from './board';
import styled, { css } from 'styled-components';
import { centerFlex } from '../styles/basic';

const StyledShipsBoard = styled.div`
    width: 100%;
    ${ centerFlex('column') };
`;

const ShipTypeSelect =  styled.div`
    margin: 10px 0;
`;

const ShipTypeButton = styled.button`
    border-radius: 20px;
    padding: 10px 20px;
    font-size: 16px;
    margin: 5px;
    border: 0;
    background: ${ props => props.active ? '#000033 !important' : '#ccc' };
    color: ${ props => props.active ? '#fff !important' : 'inherit' };
    cursor: pointer;
    &:hover {
        background: #fff;
    }
`;

export default class ShipsBoard extends Component {
    shipTypes = {
        horizontal: {
            name: 'horizontal',
            objectXSize: 5,
            objectYSize: 1,
        },
        vertical: {
            name: 'vertical',
            objectXSize: 1,
            objectYSize: 5,
        },
    }
    constructor(props) {
        super(props);
        const { shipTypes } = this;
        this.state = { shipType: shipTypes.vertical, placedShips: [] }; 
    }
    changeType = (e, shipType) => {
        e.preventDefault();
        this.setState({ shipType });
    }
    handlePlacement = (placedObject) => {
        const { shipType } = this.state;
        const { onPlacement } = this.props;

        const placedShip = { ...placedObject, vertical: (shipType === this.shipTypes.vertical) };
        this.setState(
            ({ placedShips }) =>
            ({ placedShips: [...placedShips, placedShip] })
        );

        if (onPlacement) onPlacement({ ...placedShip }); 
    }
    render() {
        const { shipTypes } = this;
        const { shipType: selectedShipType } = this.state;
        return (
            <StyledShipsBoard>
                <ShipTypeSelect>
                    { Object.keys(shipTypes).map(typeKey => {
                        const shipType = shipTypes[typeKey];
                        const active = selectedShipType.name === shipType.name;
                        return (
                            <ShipTypeButton key={typeKey} active={ active } onClick={ (e) => this.changeType(e, shipType) }>
                                { shipType.name }
                            </ShipTypeButton>
                        );
                    })}
                </ShipTypeSelect>
                <Board
                    xSize={10}
                    ySize={10}
                    objectXSize={selectedShipType.objectXSize}
                    objectYSize={selectedShipType.objectYSize}
                    maxObjects={5}
                    onPlacement={ this.handlePlacement } />
            </StyledShipsBoard>
        )
    }
}
