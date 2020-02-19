// That's just an example, not implemented yet
import { combineReducers } from 'redux';
import gameReducer from './gameReducer';

export default combineReducers({
    games: gameReducer
});