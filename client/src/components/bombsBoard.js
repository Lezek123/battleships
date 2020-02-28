import React, { Component } from 'react';
import Board from './board';
import styled, { css } from 'styled-components';
import { centerFlex } from '../styles/basic';

const StyledBombsBoard = styled.div`
    box-sizing: border-box;
    width: 100%;
    padding: 20px;
    border-radius: 20px;
    background: #333;
    margin-top: 10px;
    ${ centerFlex('column') };
`;

export default class BombsBoard extends Component {
    state = { placedBombs: [] };

    getLockedObjects = () => {
        let { lockedObjects = null, lockedBoard } = this.props;

        if (lockedBoard) {
            lockedObjects = [];
            lockedBoard.forEach((cols, x) =>
                cols.forEach((placed, y) => placed && lockedObjects.push({ x, y }))
            );
        }

        return lockedObjects;
    }

    getCurrentBombsBoard = () => {
        const { placedBombs } = this.state;

        // Note that bombs board is array[x][y], not array[y][x] (as in Board component)
        return Array.from(Array(10)).map((cols, x) =>
            Array.from(Array(10)).map((field, y) =>
                placedBombs.some(({ x: placedX, y: placedY}) => x === placedX && y === placedY)
            )
        );
    }
    handlePlacement = (placedBomb) => {
        const { onPlacement } = this.props;

        this.setState(
            ({ placedBombs }) =>
                ({ placedBombs: [...placedBombs, placedBomb] }),
            () => {
                if (onPlacement) onPlacement({
                    ...placedBomb,
                    currentBoard: this.getCurrentBombsBoard()
                }); 
            }
        );
    }

    render() {
        const lockedObjects = this.getLockedObjects();
        return (
            <StyledBombsBoard>
                <Board
                    xSize={10}
                    ySize={10}
                    objectXSize={1}
                    objectYSize={1}
                    onPlacement={ this.handlePlacement }
                    lockedObjects={ lockedObjects }
                    />
            </StyledBombsBoard>
        )
    }
}
