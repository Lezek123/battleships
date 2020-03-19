import React, { Component } from 'react';
import ContractsManager from '../helpers/contracts';
import GAME_STATUSES from '../constants/gameStatuses';
import { shipsToBoard } from '../helpers/converters';
import { compareBoards } from './board';
import styled from 'styled-components';
import { JoinTimeoutIcon, RevealTimeoutIcon, PrizeIcon } from '../constants/icons';
import { centerFlex } from '../styles/basic';
import colors from '../constants/colors';
import { Link } from 'react-router-dom';
import { generateGamePath } from '../constants/routes';
import { breakpointHit, breakpointNotHit, breakpoints as bp } from '../constants/breakpoints';

const StyledClaimNotifications = styled.div`
    display: flex;
    @media ${ breakpointNotHit(bp.SMALL_LAPTOP) } {
        position: fixed;
        top: 20px;
        right: 0;
        display: flex;
        flex-direction: column;
    }
    @media ${ breakpointHit(bp.SMALL_LAPTOP) } {
        width: 100%;
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-evenly;
        background: rgba(255, 255, 255, 0.6);
    }
`;
const NotificationsBoxContainer = styled.div`
    margin: 10px 0;
    ${ centerFlex('column') }
    width: 200px;
    @media ${ breakpointHit(bp.SMALL_LAPTOP) } {
        width: 100px;
    }
`;
const NotificationsBox = styled.div`
    cursor: ${ props => props.notificationsCount ? 'pointer' : 'initial' };
    width: 60px;
    height: 60px;
    border-radius: 100%;
    background: ${ props => props.notificationsCount ? colors.PRIMARY : '#777' };
    box-shadow: ${ props => props.notificationsCount ? `0 0 10px ${ colors.INFO_LIGHT }` : 'none' };
    ${ centerFlex('column') };
    position: relative;
`;
const NotificationsIcon = styled.div`
    font-size: 24px;
`;
const NotificationsCount = styled.div`
    background: ${ colors.INFO_LIGHT };
    width: 20px;
    height: 20px;
    ${ centerFlex('column') };
    border-radius: 100%;
    color: #222;
    position: absolute;
    bottom: 0;
    right: 0;
`;
const NotificationsGamesList = styled.div`
    margin-top: 5px;
    z-index: 2;
    ${ centerFlex('column') };
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 1s, opacity 1s;
    &.expanded {
        max-height: 250px;
        opacity: 1;
    }
    border: 1px solid #777;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.4);
    @media ${ breakpointHit(bp.SMALL_LAPTOP) } {
        margin-right: - 30px;
        width: 160px;
    }
`;
const GameLink = styled(Link)`
    color: #fff;
    margin: 10px 20px;
`;

class ClaimNotificationsBox extends Component {
    state = { open: false };

    toggleOpened = () => {
        const { opened, onOpen, onClose } = this.props;
        if (opened) onClose();
        else onOpen();
    }

    render() {
        const { icon, gameIndexes, opened } = this.props;
        return (
            <NotificationsBoxContainer>
                <NotificationsBox notificationsCount={ gameIndexes.length } onClick={ this.toggleOpened }>
                    <NotificationsIcon>{ icon }</NotificationsIcon>
                    { gameIndexes.length > 0 && (
                        <NotificationsCount>{ gameIndexes.length }</NotificationsCount>
                    ) }
                </NotificationsBox>
                <NotificationsGamesList className={ opened ? 'expanded' : '' }>
                    { gameIndexes.map((gameIndex, key) => (
                        <GameLink key={key} to={ generateGamePath(gameIndex) }>Game #{ gameIndex}</GameLink>
                    )) }
                </NotificationsGamesList>
            </NotificationsBoxContainer>
        );
    }
}

export default class CalimNotifications extends Component {
    state = {
        joinTimeoutGames: [],
        revealTimeoutGames: [],
        wonGames: [],
        openedBox: null
    };

    componentWillMount() {
        this._contractsManager = new ContractsManager();
        this.updateNotifications();
        this.interval = setInterval(this.updateNotifications, 10000);
    }

    setOpenedBox = (boxIndex) => {
        this.setState({ openedBox: boxIndex });
    }

    updateNotifications = async () => {
        let joinTimeoutGames = [], revealTimeoutGames = [], wonGames = [];
        const web3 = await this._contractsManager.getWeb3();
        const usersGames = await this._contractsManager.fetchUsersGames();
        const currentBlockNumber = await web3.eth.getBlockNumber();
        for (let game of usersGames) {
            if (
                game.isUserCreator
                && game.status === GAME_STATUSES.NEW
                && game.joinTimeoutBlockNumber <= currentBlockNumber
            ) {
                joinTimeoutGames.push(game.gameIndex);
            }
            else if (
                game.isUserBomber
                && game.status === GAME_STATUSES.IN_PROGRESS
                && game.revealTimeoutBlockNumber <= currentBlockNumber
            ) {
                revealTimeoutGames.push(game.gameIndex);
            }
            else {
                // TODO: Move this logic to some revealHelper? (it's used in 2 places now)
                const revealedDataRes = await fetch('/reveal/' + game.gameIndex);
                const revealedData = await revealedDataRes.json();
                if (revealedData.ships) {
                    const shipsBoard = shipsToBoard(revealedData.ships);
                    const compareRes = compareBoards(shipsBoard, game.bombsBoard);
                    const isCreatorWinner = compareRes.some(row => row.some(resField => resField === 'a'));
                    if ((game.isUserCreator && isCreatorWinner) || (game.isUserBomber && !isCreatorWinner)) {
                        wonGames.push(game.gameIndex);
                    }
                }
            }
        }
        this.setState({ joinTimeoutGames, revealTimeoutGames, wonGames });
    }

    render() {
        const { joinTimeoutGames, revealTimeoutGames, wonGames, openedBox } = this.state;
        return (
            <StyledClaimNotifications>
                <ClaimNotificationsBox onOpen={ () => this.setOpenedBox(1) } onClose={ () => this.setOpenedBox(null) } opened={ openedBox === 1 } icon={ <PrizeIcon /> } gameIndexes={ wonGames } />
                <ClaimNotificationsBox onOpen={ () => this.setOpenedBox(2) } onClose={ () => this.setOpenedBox(null) } opened={ openedBox === 2 } icon={ <RevealTimeoutIcon /> } gameIndexes={ revealTimeoutGames } />
                <ClaimNotificationsBox onOpen={ () => this.setOpenedBox(3) } onClose={ () => this.setOpenedBox(null) } opened={ openedBox === 3 } icon={ <JoinTimeoutIcon /> } gameIndexes={ joinTimeoutGames } />
            </StyledClaimNotifications>
        )
    }
}
