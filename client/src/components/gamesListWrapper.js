import React, { Component } from 'react'
import GamesList from './gamesList';
import Loader from './loader';

export default class gamesListWrapper extends Component {
    state = { games: [], fetching: true };
    componentWillMount() {
        this.fetchGames();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.fetchMethod !== this.props.fetchMethod) {
            this.fetchGames();
        }
    }

    async fetchGames() {
        this.setState({ fetching: true}, async () => {
            const { fetchMethod } = this.props;
            const games = await fetchMethod();
            this.setState({ games, fetching: false });
        });
    }

    render() {
        const { games, fetching } = this.state;

        if (fetching) return <Loader text="Fetching games contracts..." />;
        return <GamesList games={games}/>;
    }
}
