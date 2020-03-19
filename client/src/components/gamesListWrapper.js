import React, { Component } from 'react'
import GamesList from './gamesList';
import Loader from './loader';
import styled, { css } from 'styled-components';
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
    min-width: 0;
    width: calc(33.33% - 2px);
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
    position: relative;
    overflow: hidden;
    margin-bottom: auto;
    padding: 50px 20px;
    width: 100%;
    border: 3px solid #777;
    border-radius: 20px;
    flex-grow: 1;
    ${ centerFlex('column') }
    @media ${ breakpointHit(bp.PHONE) } {
        border-radius: 10px;
    }
`;

const Pagination = styled.div`
    display: flex;
    position: absolute;
    right: 0;
    overflow: hidden;
    ${ props => props.position === 'top' && css`top: 0; border-bottom-left-radius: 20px;` }
    ${ props => props.position === 'bottom' && css`bottom: 0; border-top-left-radius: 20px;` }
`;
const PageLink = styled.button`
    width: 35px;
    height: 35px;
    background: #777;
    color: #fff;
    border: 0;
    font-size: 16px;
    margin-left: 1px;
    cursor: pointer;
    &.active {
        background: #fff;
        color: #222;
        cursor: initial;
    }
    &:focus { outline: 0 };
`;
const PageMore = styled.div`
    width: 35px;
    height: 35px;
    background: #555;
    color: #fff;
    cursor: default;
    ${ centerFlex('column') }
`;

export default class GamesListWrapper extends Component {
    state = { games: [], totalGamesCount: null, page: 1, gamesStatus: GAME_STATUSES.NEW, fetching: true };

    componentWillMount() {
        this.fetchGames();
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevProps.fetchMethod !== this.props.fetchMethod
            || prevState.gamesStatus !== this.state.gamesStatus
        ) {
            this.setState({ page: 1 }, this.fetchGames);
        }
        if (prevState.page !== this.state.page) {
            this.fetchGames();
        }
    }

    async fetchGames() {
        this.setState({ fetching: true}, async () => {
            const { fetchMethod, countMethod } = this.props;
            const { gamesStatus, page } = this.state;
            const games = await fetchMethod(gamesStatus, page);
            const totalGamesCount = await countMethod(gamesStatus);
            this.setState({ games, totalGamesCount, fetching: false });
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

    renderPagination = (position) => {
        const { page, totalGamesCount } = this.state;
        const GAMES_PER_PAGE = 10;
        const pages = Math.ceil(totalGamesCount / GAMES_PER_PAGE);
        if (pages <= 1) return null;
        const beginPage = Math.max(1, page - 5);
        const endPage = Math.min(pages, page + 5);
        const displayedPages = Array.from(Array(endPage - beginPage + 1)).map((v,i) => beginPage+i);
        return (
            <Pagination position={position}>
                { displayedPages.map((pageNum) => (
                    <React.Fragment key={pageNum}>
                        { pageNum === endPage && endPage < pages && <PageMore>...</PageMore> }
                        <PageLink
                            className={ page === pageNum && 'active' }
                            onClick={ () => this.setState({ page: pageNum })}>
                            { pageNum }
                        </PageLink>
                        { pageNum === beginPage && beginPage > 1 && <PageMore>...</PageMore> }
                    </React.Fragment>
                )) }
            </Pagination>
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
                    { this.renderPagination('top') }
                    { fetching ?
                        <Loader text="Fetching games data..." />
                        : <GamesList games={games}/>
                    }
                    { this.renderPagination('bottom') }
                </GamesListContent>
            </StyledGamesListWrapper>
        );
    }
}
