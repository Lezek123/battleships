import React, { Component } from 'react';
import styled from 'styled-components';

const BoardContainer = styled.div`
    width: 100%;
    padding-top: 100%;
    height: 0;
    position: relative;
`;

const BoardGrid = styled.div`
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: grid;
    column-gap: 1px;
    row-gap: 1px;
    grid-template-rows: ${ props => props.board.map(() => '1fr').join(' ') };
    grid-template-columns: ${ props => props.board[0].map(() => '1fr').join(' ') };
`;

const boardFieldColors = {
    default: '#ccc',
    hovered: '#ccffcc',
    impossible: '#ffcccc',
    active: '#00ff00',
};
const BoardField = styled.div`
    width: 100%;
    height: 100%;
    cursor: pointer;
    background: ${ props => boardFieldColors[props.fieldState] };
`;

export default class Board extends Component {
    state = {
        board: null,
        selectedFields: [] // TODO: Maybe change to "placedObjects" with x, y, objectXLength and objectYLength?
    }

    fieldStates = {
        default: 'default',
        hovered: 'hovered',
        impossible: 'impossible',
        active: 'active',
    }

    componentWillMount() {
        this.initBoard();
    }

    componentWillUpdate(nextProps, nextState) {
        if (nextProps.xSize !== this.props.xSize || nextProps.ySize !== this.props.ySize) {
            this.initBoard();
        }
    }

    initBoard() {
        const {xSize, ySize} = this.props;
        const board = Array.from(Array(ySize)).map(row =>
            Array.from(Array(xSize)).map(field => this.fieldStates.default)
        );
        this.setState({ board });
    }

    handleFieldHover = (hoveredY, hoveredX) => {
        let { board, selectedFields } = this.state;
        const { maxObjects } = this.props;
        const { fieldStates } = this;

        if (selectedFields.length >= maxObjects) return;

        const { objectXSize, objectYSize, xSize, ySize } = this.props;

        // Change all non-active fields status to default
        board = board.map(row => row.map(field => field === fieldStates.active ? field : fieldStates.default));
        // Set hovered status on all possible (non-active) fields
        for (let y = hoveredY; (y < hoveredY + objectYSize && y < ySize); y++) {
            for (let x = hoveredX; (x < hoveredX + objectXSize && x < xSize); x++) {
                if (board[y][x] !== fieldStates.active) board[y][x] = fieldStates.hovered;
            }
        }
        // Change "hovered" fields to "impossible" if there are less hovered fields than objectXSize * objectYSize
        const hoveredFieldsLen = board.reduce((a, b) => a + b.filter(field => field === fieldStates.hovered).length, 0);
        if (hoveredFieldsLen < objectXSize * objectYSize) {
            board = board.map(row => row.map(field => field === fieldStates.hovered ? fieldStates.impossible : field ));
        }

        this.setState({ board });
    }

    handleFieldClick = (clickedY, clickedX) => {
        let { board, selectedFields } = this.state;
        const { maxObjects, onPlacement } = this.props;
        const { fieldStates } = this;

        if (selectedFields.length >= maxObjects) return;

        board = board.map(row =>
            row.map(fieldState => fieldState === fieldStates.hovered ? fieldStates.active : fieldState)
        );

        this.setState({ board, selectedFields: [ ...selectedFields, { x: clickedX, y: clickedY } ] });
        if (onPlacement) onPlacement({ x: clickedX, y: clickedY });
    }

    render() {
        const { board } = this.state; 
        return (
            <BoardContainer>
                <BoardGrid board={ board}>
                    { board.map((row, rowKey) => (
                        row.map((fieldState, fieldKey) => (
                            <BoardField
                                key={fieldKey}
                                fieldState={ fieldState }
                                onMouseOver={ () => this.handleFieldHover(rowKey, fieldKey) }
                                onClick={ () => this.handleFieldClick(rowKey, fieldKey) } />
                        ))
                    )) }
                </BoardGrid>
            </BoardContainer>
        )
    }
}
