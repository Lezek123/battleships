import React, { Component } from 'react';
import ContractsManager from '../helpers/contracts';
import Loader from './loader';
import FinishedGame from './finishedGame';
import JoinedGame from './joinedGame';
import PendingGame from './pendingGame';
import GAME_STATUSES from '../constants/gameStatuses';
import styled from 'styled-components';
import { centerFlex } from '../styles/basic';
import axios from 'axios';
import colors from '../constants/colors';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';

const GamePage = styled.div`
    ${ centerFlex('column') };
    width: 100%;
    padding: 20px 0;
`;
const GamePageHeader = styled.h1`
    margin: 0;
`;
const GameUserRole = styled.div`
    color: ${ props => props.isCreator ? colors.CREATOR : colors.BOMBER };
    font-size: 14px;
`;

/* Styled components shared on all game pages: */
export const StyledGame = styled.div`
    width: 100%;
    ${ centerFlex('column') };
`;
export const GameMain = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 1000px;
    margin-top: 20px;
    @media ${ breakpointHit(bp.TABLET) } {
        flex-direction: column;
    }
`;
export const GameData = styled.div`
    width: calc(50% - 10px);
    @media ${ breakpointHit(bp.TABLET) } {
        width: 100%;
    }
`;
export const LiveView = styled.div`
    width: calc(50% - 10px);
    background: rgba(0,0,0,0.2);
    border-radius: 20px;
    padding: 15px 20px 20px 20px;
    position: relative;
    ${ centerFlex('column') };
    @media ${ breakpointHit(bp.TABLET )} {
        width: 100%;
        min-height: 200px;
    }
`;
export const LiveViewTitle = styled.h2`
    font-size: 24px;
    margin-top: 0;
    margin-bottom: 10px;
    font-weight: 600;
`;
export const BoardContainer = styled.div`
    position: relative;
    width: 100%;
    max-width: 500px;
`;
export const BoardLoader = styled.div`
    position: absolute;
    top: 20px;
    left: 20px;
    width: calc(100% - 40px);
    height: calc(100% - 40px);
    background: rgba(0,0,0,0.6);
    ${centerFlex('column')};
`;

const UPDATE_INTERVAL_TIME = 5000;

export default class Game extends Component {
    state = { game: null, fetching: true }
    
    async componentWillMount() {
        this._contractsManager = new ContractsManager();
        this.reloadGame();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.index !== this.props.index) this.reloadGame();
    }

    componentWillUnmount() {
        if (this.updateInterval) clearInterval(this.updateInterval);
    }

    reloadGame = async () => {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.setState({ fetching: true }, this.updateGame);
        this.updateInterval = setInterval(this.updateGame, UPDATE_INTERVAL_TIME);
    }

    updateGame = async () => {
        const { index } = this.props;
        const game = (await axios.get(`/games/by_index/${ index }`)).data;
        const userAddr = await this._contractsManager.getUserAddr();
        game.isUserCreator = this._contractsManager.compareAddr(userAddr, game.creatorAddr);
        game.isUserBomber = this._contractsManager.compareAddr(userAddr, game.bomberAddr);
        this.setState({ game, fetching: false });
    }



    render() {
        const { game, fetching } = this.state;
        
        if (fetching) return <Loader text="Fetching game data..." />;
        if (!game) return <h1>Game not found!</h1>; // TODO: 404 component
        
        return (
            <GamePage>
                <GamePageHeader>Game #{ game.gameIndex }</GamePageHeader>
                { (game.isUserCreator || game.isUserBomber) && (
                    <GameUserRole isCreator={ game.isUserCreator }>
                        { game.isUserCreator ? 'Created by you' : 'Bombed by you' }
                    </GameUserRole>
                ) }
                { game.status === GAME_STATUSES.NEW && <JoinedGame game={game} /> }
                { game.status === GAME_STATUSES.IN_PROGRESS && <PendingGame game={game} /> }
                { game.status === GAME_STATUSES.FINISHED && <FinishedGame game={game} /> }
            </GamePage>
        );
    }
}
