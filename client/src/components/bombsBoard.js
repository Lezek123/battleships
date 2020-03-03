import React, { Component } from 'react';
import Board from './board';
import styled, { css } from 'styled-components';
import { centerFlex } from '../styles/basic';

const StyledBombsBoard = styled.div`
    width: 100%;
    padding: 20px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.2);
    margin-top: 10px;
    ${ centerFlex('column') };
`;

export default class BombsBoard extends Component {
    render() {
        const { onPlacement, onChange, lockedBoard } = this.props;
        return (
            <StyledBombsBoard>
                <Board
                    xSize={10}
                    ySize={10}
                    objectXSize={1}
                    objectYSize={1}
                    onPlacement={ onPlacement }
                    onChange={ onChange }
                    lockedBoard={ lockedBoard }
                    />
            </StyledBombsBoard>
        )
    }
}
