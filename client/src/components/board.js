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
    opacity: ${ props => props.locked ? 0.7 : 1 };
`;

const boardFieldColors = {
    default: '#ccc',
    hovered: '#ccffcc',
    impossible: '#ffcccc',
    active: '#00ff00',
};
const boardFieldCursors = {
    default: 'initial',
    hovered: 'pointer',
    impossible: 'not-allowed',
    active: 'initial'
}
const BoardField = styled.div`
    width: 100%;
    height: 100%;
    cursor: ${ props => props.locked ? 'not-allowed' : boardFieldCursors[props.fieldState] };
    background: ${ props => boardFieldColors[props.fieldState] };
`;

export default class Board extends Component {
    state = {
        board: null,
        placementPossible: false,
        placedObjects: []
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

    componentDidUpdate(prevProps) {
        if (
            prevProps.xSize !== this.props.xSize
            || prevProps.ySize !== this.props.ySize
            || JSON.stringify(prevProps.lockedObjects) !== JSON.stringify(this.props.lockedObjects)
        ) {
            this.initBoard();
        }
    }

    objectContainsField(object, fieldCoordinates) {
        const { objectXSize, objectYSize } = this.props;
        // Provided objects may have different dimensions than current (fetched from props)
        object.xSize = object.xSize || objectXSize;
        object.ySize = object.ySize || objectYSize;
        return (
            fieldCoordinates.x >= object.x
            && fieldCoordinates.x < object.x + object.xSize
            && fieldCoordinates.y >= object.y
            && fieldCoordinates.y < object.y + object.ySize
        );
    }

    initBoard() {
        const { xSize, ySize, lockedObjects } = this.props;
        const board = Array.from(Array(ySize)).map((rows, y) =>
            Array.from(Array(xSize)).map((field, x) => (
                lockedObjects && lockedObjects.some(object => this.objectContainsField(object, {x, y})) ?
                    this.fieldStates.active
                    : this.fieldStates.default
            ))
        );
        this.setState({ board });
    }

    handleFieldHover = (hoveredY, hoveredX) => {
        let { board, placedObjects } = this.state;
        const { maxObjects, lockedObjects } = this.props;
        const { fieldStates } = this;

        if (placedObjects.length >= maxObjects || lockedObjects) return;
        
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
        const placementPossible = hoveredFieldsLen === objectXSize * objectYSize;
        if (!placementPossible) {
            board = board.map(row => row.map(field => field === fieldStates.hovered ? fieldStates.impossible : field ));
        }

        this.setState({ board, placementPossible });
    }

    handleFieldClick = (clickedY, clickedX) => {
        let { board, placedObjects, placementPossible } = this.state;
        const { maxObjects, onPlacement } = this.props;
        const { fieldStates } = this;

        if (!placementPossible) return;

        this.setState({ placementPossible: false });

        if (placedObjects.length >= maxObjects) return;

        board = board.map(row =>
            row.map(fieldState => fieldState === fieldStates.hovered ? fieldStates.active : fieldState)
        );

        this.setState({ board, placedObjects: [ ...placedObjects, { x: clickedX, y: clickedY } ] });
        if (onPlacement) onPlacement({ x: clickedX, y: clickedY });
    }

    render() {
        const locked = this.props.lockedObjects ? true : false;
        const { board } = this.state; 
        return (
            <BoardContainer>
                <BoardGrid board={board} locked={ locked }>
                    { board.map((row, rowKey) => (
                        row.map((fieldState, fieldKey) => (
                            <BoardField
                                key={fieldKey}
                                fieldState={ fieldState }
                                onMouseOver={ () => this.handleFieldHover(rowKey, fieldKey) }
                                onClick={ () => this.handleFieldClick(rowKey, fieldKey) }
                                locked={ locked }/>
                        ))
                    )) }
                </BoardGrid>
            </BoardContainer>
        )
    }
}
