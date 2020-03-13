import React, { Component } from 'react'
import GamesList from './gamesList';
import Loader from './loader';
import styled from 'styled-components';
import GAME_STATUSES from '../constants/gameStatuses';
import { BasicButton } from './navigation/buttons';
import {centerFlex} from '../styles/basic';
import { breakpoints as bp, breakpointHit } from '../constants/breakpoints';

const StyledGamesListWrapper = styled.div`
    min-height: 100vh;
    padding: 40px 0;
    width: 100%;
    ${ centerFlex('column') }
`;
const GamesListTabs = styled.div`
    display: flex;
    justify-content: center;
    width: calc(100% - 30px);
    justify-content: space-between;
    border-top-left-radius: 15px;
    border-top-right-radius: 15px;
    overflow: hidden;
    border: 3px solid #777;
    padding: 1px;
    border-bottom: 0;
    max-width: 800px;
`;
const GamesListTab = styled(BasicButton)`
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    padding: 10px;
    font-weight: 500;
    flex-grow: 1;
    margin: 1px;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    &:first-child {
        border-top-left-radius: 10px;
        border-top-right-radius: 0;
    }
    &:last-child {
        border-top-left-radius: 0;
        border-top-right-radius: 10px;
    }
    @media ${ breakpointHit(bp.TABLET) } {
        font-size: 16px;
    }
    @media ${ breakpointHit(bp.PHONE) } {
        font-size: 14px;
    }
`;
const GamesListContent = styled.div`
    margin-bottom: auto;
    width: 100%;
    border: 3px solid #777;
    border-radius: 20px;
    flex-grow: 1;
    ${ centerFlex('column') }
    @media ${ breakpointHit(bp.PHONE) } {
        border-radius: 10px;
    }
`;


export default class GamesListWrapper extends Component {
    state = { games: [], gamesStatus: GAME_STATUSES.NEW, fetching: true };
    componentWillMount() {
        this.fetchGames();
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevProps.fetchMethod !== this.props.fetchMethod
            || prevState.gamesStatus !== this.state.gamesStatus
        ) {
            this.fetchGames();
        }
    }

    async fetchGames() {
        this.setState({ fetching: true}, async () => {
            const { fetchMethod } = this.props;
            const games = await fetchMethod(this.state.gamesStatus);
            this.setState({ games, fetching: false });
        });
    }

    renderTab = (gameStatus, text) => {
        const isSelected = this.state.gamesStatus === gameStatus;
        return (
            <GamesListTab
                className={ isSelected ? 'active' : '' }
                onClick={() => !isSelected && this.setState({ gamesStatus: gameStatus })}>
                {text}
            </GamesListTab>
        );
    }

    render() {
        const { games, fetching } = this.state;

        return (
            <StyledGamesListWrapper>
                <GamesListTabs>
                    { this.renderTab(GAME_STATUSES.NEW, 'New') }
                    { this.renderTab(GAME_STATUSES.IN_PROGRESS, 'In progress') }
                    { this.renderTab(GAME_STATUSES.FINISHED, 'Finished') }
                </GamesListTabs>
                <GamesListContent>
                    { fetching ?
                        <Loader text="Fetching games data..." />
                        : <GamesList games={games}/>
                    }
                </GamesListContent>
            </StyledGamesListWrapper>
        );
    }
}
