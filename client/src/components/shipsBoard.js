import React, { Component } from 'react';
import Board from './board';
import styled, { css } from 'styled-components';
import { centerFlex } from '../styles/basic';
import { BasicButton } from './navigation/buttons';

const StyledShipsBoard = styled.div`
    width: 100%;
    padding: 20px;
    border-radius: 20px;
    background: #333;
    margin-top: 10px;
    ${ centerFlex('column') };
`;

const ShipTypeSelect =  styled.div`
    margin-bottom: 20px;
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
                            <BasicButton key={typeKey} className={ active ? 'active' : '' } onClick={ (e) => this.changeType(e, shipType) }>
                                { shipType.name }
                            </BasicButton>
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
