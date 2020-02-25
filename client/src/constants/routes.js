export const CREATE_GAME_PATH = '/create-game';
export const GAMES_LIST_PATH = '/games';
export const GAME_PATH = '/game/:id';

export const generateGamePath = (id) => GAME_PATH.replace(':id', id);