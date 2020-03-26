import React, { Component } from 'react';
import Board from './board';
import styled, { css } from 'styled-components';
import { centerFlex } from '../styles/basic';
import { SmallButton } from './navigation/buttons';
import horizontalShipImg from '../images/horizontal-ship.png';
import verticalShipImg from '../images/vertical-ship.png';

const StyledShipsBoard = styled.div`
    width: 100%;
    padding: 20px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.2);
    ${ centerFlex('column') };
`;

const ShipTypeSelect =  styled.div`
    margin-bottom: 20px;
    width: 100%;
    display: flex;
    justify-content: space-evenly;
`;

export default class ShipsBoard extends Component {
    shipTypes = {
        horizontal: {
            name: 'horizontal',
            objectXSize: 5,
            objectYSize: 1,
            objectImage: <img src={ horizontalShipImg } alt="Horizontal ship" />
        },
        vertical: {
            name: 'vertical',
            objectXSize: 1,
            objectYSize: 5,
            objectImage: <img src={ verticalShipImg } alt="Vertical ship" />
        },
    }
    constructor(props) {
        super(props);
        const { shipTypes } = this;
        this.state = { shipType: shipTypes.vertical, placedShips: [] }; 
    }
    getLockedObjects = () => {
        let { lockedObjects = null, lockedShips } = this.props;

        if (lockedShips) {
            lockedObjects = lockedShips.map(
                ({ x, y, vertical }) => {
                    const shipType = this.shipTypes[vertical ? 'vertical' : 'horizontal'];
                    return { x, y, xSize: shipType.objectXSize, ySize: shipType.objectYSize, objectImage: shipType.objectImage }
                }
            );
        }

        return lockedObjects;
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
        const { onChange, boardsDiff, children } = this.props;
        const lockedObjects = this.getLockedObjects();
        return (
            <StyledShipsBoard>
                { !lockedObjects && (
                    <ShipTypeSelect>
                        { Object.keys(shipTypes).map(typeKey => {
                            const shipType = shipTypes[typeKey];
                            const active = selectedShipType.name === shipType.name;
                            return (
                                <SmallButton key={typeKey} className={ active ? 'active' : '' } onClick={ (e) => this.changeType(e, shipType) }>
                                    { shipType.name }
                                </SmallButton>
                            );
                        })}
                    </ShipTypeSelect>
                ) }
                <Board
                    xSize={10}
                    ySize={10}
                    objectXSize={selectedShipType.objectXSize}
                    objectYSize={selectedShipType.objectYSize}
                    objectImage={selectedShipType.objectImage}
                    maxObjects={5}
                    lockedObjects={ lockedObjects }
                    onPlacement={ this.handlePlacement }
                    onChange={ onChange }
                    boardsDiff={ boardsDiff }/>
                { children }
            </StyledShipsBoard>
        )
    }
}
