import React, { Component } from 'react';
import styled from 'styled-components';
import colors from '../constants/colors';

const FIELD_STATES = {
    default: 'default',
    hovered: 'hovered',
    impossible: 'impossible',
    active: 'active',
};

export const DIFF_STATES = {
    both: 'ab',
    board1: 'a',
    board2: 'b',
    none: '-',
}

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

const ObjectImage = styled.div`
    position: absolute;
    pointer-events: none;
    & img {
        width: 100%;
        height: 100%;
    }
`;

const boardFieldColors = {
    default: '#ccc',
    hovered: '#ccffcc',
    impossible: '#ffcccc',
    active: '#33ff33',
};
const boardDiffColors = {
    [DIFF_STATES.both]: '#ff3333',
    [DIFF_STATES.board1]: '#77aaff',
    [DIFF_STATES.board2]: '#ffaa77',
    [DIFF_STATES.none]: '#ccc',
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
    background: ${ props => props.diffState ? boardDiffColors[props.diffState] : boardFieldColors[props.fieldState] };
`;

// Compares two boards and returns array of information wether given field is "true" on both of them, one of them or none of them
export function compareBoards(board1, board2) {
    return board1.map((row, y) =>
        row.map((field, x) => {
            if (board1[y][x] && board2[y][x]) return DIFF_STATES.both;
            else if (board1[y][x]) return DIFF_STATES.board1;
            else if (board2[y][x]) return DIFF_STATES.board2;
            else return DIFF_STATES.none;
        })
    );
}

export default class Board extends Component {
    state = {
        board: null,
        placementPossible: false,
        hoveredField: {},
        placedObjects: []
    }

    componentWillMount() {
        this.initBoard();
    }

    componentDidUpdate(prevProps, prevState) {
        // Re-init if some of the "critical props" have changed
        if (
            prevProps.xSize !== this.props.xSize
            || prevProps.ySize !== this.props.ySize
            || JSON.stringify(prevProps.lockedObjects) !== JSON.stringify(this.props.lockedObjects)
            || JSON.stringify(prevProps.lockedBoard) !== JSON.stringify(this.props.lockedBoard)
        ) {
            this.initBoard();
        }
    }

    getLockedObjects = () => {
        let { lockedObjects = null, lockedBoard = null } = this.props;
        // lockedBoard has priority over lockedObjects this way
        if (lockedBoard) {
            lockedObjects = [];
            lockedBoard.forEach((rows, y) => rows.forEach((f, x) => f && lockedObjects.push({ x, y })));
        }

        return lockedObjects;
    }

    isLocked = () => this.getLockedObjects() ? true : false;

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

    handleBoardChange = () => {
        // Handle onChange callback, which sends back the board as 2d array of true/false
        const { onChange } = this.props;
        const { board } = this.state;
        const { active: activeState } = FIELD_STATES;
        if (onChange) onChange(board.map(row => row.map(fieldState => fieldState === activeState)));
    }

    initBoard() {
        const { xSize, ySize } = this.props;
        const lockedObjects = this.getLockedObjects();

        const board = Array.from(Array(ySize)).map((row, y) =>
            Array.from(Array(xSize)).map((field, x) => {
                if (lockedObjects && lockedObjects.some(object => this.objectContainsField(object, {x, y}))) {
                    return FIELD_STATES.active;
                }
                return FIELD_STATES.default
            })
        );
        this.setState(
            { board, placementPossible: false, placedObjects: lockedObjects || [] },
            this.handleBoardChange
        );
    }

    handleFieldHover = (hoveredY, hoveredX) => {
        let { board, placedObjects } = this.state;
        const { maxObjects } = this.props;

        if (placedObjects.length >= maxObjects || this.isLocked()) return;
        
        const { objectXSize, objectYSize, xSize, ySize } = this.props;

        // Change all non-active fields status to default
        board = board.map(row => row.map(field => field === FIELD_STATES.active ? field : FIELD_STATES.default));
        // Set hovered status on all possible (non-active) fields
        for (let y = hoveredY; (y < hoveredY + objectYSize && y < ySize); y++) {
            for (let x = hoveredX; (x < hoveredX + objectXSize && x < xSize); x++) {
                if (board[y][x] !== FIELD_STATES.active) board[y][x] = FIELD_STATES.hovered;
            }
        }
        // Change "hovered" fields to "impossible" if there are less hovered fields than objectXSize * objectYSize
        const hoveredFieldsLen = board.reduce((a, b) => a + b.filter(field => field === FIELD_STATES.hovered).length, 0);
        const placementPossible = hoveredFieldsLen === objectXSize * objectYSize;
        if (!placementPossible) {
            board = board.map(row => row.map(field => field === FIELD_STATES.hovered ? FIELD_STATES.impossible : field ));
        }

        this.setState({ board, placementPossible, hoveredField: { x: hoveredX, y: hoveredY } });
    }

    clearHoverState = () => {
        const fs = FIELD_STATES;
        this.setState(
            ({ board }) =>
            ({
                placementPossible: false,
                hoveredField: {},
                board: board.map(row => row.map(f => f === fs.active ? f : fs.default ))
            })
        );
    }

    handleFieldClick = (clickedY, clickedX) => {
        let { board, placedObjects, placementPossible } = this.state;
        const { maxObjects, onPlacement, objectXSize, objectYSize, objectImage } = this.props;

        if (!placementPossible) return;

        this.setState({ placementPossible: false });

        if (placedObjects.length >= maxObjects) return;

        board = board.map(row =>
            row.map(fieldState => fieldState === FIELD_STATES.hovered ? FIELD_STATES.active : fieldState)
        );

        const placedObject = {
            x: clickedX,
            y: clickedY,
            xSize: objectXSize,
            ySize: objectYSize,
            objectImage: objectImage
        };

        this.setState(
            { board, placedObjects: [ ...placedObjects, placedObject ] },
            this.handleBoardChange
        );
        if (onPlacement) onPlacement({ x: clickedX, y: clickedY });
    }

    renderObjectImage = ({
        x,
        y,
        xSize = this.props.objectXSize,
        ySize = this.props.objectYSize,
        objectImage = this.props.objectImage,
        key = null
    }) => {
        const { xSize: boardXSize, ySize: boardYSize } = this.props;
        return (
            <ObjectImage
                style={ {
                    width: `${ xSize / boardXSize * 100 }%`,
                    height: `${ ySize / boardYSize * 100 }%`,
                    top: `${ y / boardYSize * 100 }%`,
                    left: `${ x / boardXSize * 100}%`
                } }
                key={ key }
                >
                { objectImage }
            </ObjectImage>
        );
    }

    getDiffState(y, x) {
        const { boardsDiff } = this.props;
        if (boardsDiff && boardsDiff[y][x]) return boardsDiff[y][x];
    }

    render() {
        const locked = this.isLocked();
        const { board, placementPossible, hoveredField, placedObjects } = this.state;
       
        return (
            <BoardContainer>
                <BoardGrid board={board} locked={ locked } onMouseOut={ this.clearHoverState }>
                    { board.map((row, y) => (
                        row.map((fieldState, x) => (
                            <BoardField
                                key={`${y}:${x}`}
                                fieldState={ fieldState }
                                diffState={ this.getDiffState(y, x) }
                                onMouseOver={ () => this.handleFieldHover(y, x) }
                                onClick={ () => this.handleFieldClick(y, x) }
                                locked={ locked }/>
                        ))
                    )) }
                </BoardGrid>
                { placedObjects.map((placedObj, key) => this.renderObjectImage({...placedObj, key })) }
                { placementPossible && this.renderObjectImage(hoveredField) }
            </BoardContainer>
        )
    }
}
