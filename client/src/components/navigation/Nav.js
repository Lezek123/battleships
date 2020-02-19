import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { NavLink } from 'react-router-dom';
import { CREATE_GAME_PATH, GAMES_LIST_PATH } from '../../constants/routes';

const StyledNav = styled.nav`
    ${ props => props.fixed && css`
        position: fixed;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    ` }
`;

const StyledNavLink = styled(NavLink)`
    display: inline-block;
    padding: 20px;
    margin: ${ props => props.fixed ? '10px 0' : '0 20px' };
    background: #777;
    color: #fff !important;
    text-decoration: none !important;
    width: 200px;
    text-align: center;
    box-shadow: none;
    transition: box-shadow 0.5s, background-color 0.5s, padding 0.5s;
    font-size: 20px;
    ${ props => props.fixed ?
        css`
            border-top-right-radius: 100px;
            border-bottom-right-radius: 100px;
        `
        :
        css`
            border-radius: 100px;
        `
    }
    &:hover {
        ${ props => props.fixed ?
            css`
                padding: 20px 40px;
            `
            :
            css`
                background: none;
                box-shadow: 0 0 5px #fff;
            `
        }
    }
    &.active {
        background: #999 !important;
        box-shadow: none !important;
        padding: 20px 40px;
    }
`;

export default class Nav extends Component {
    render() {
        const { fixed } = this.props;
        return (
            <StyledNav fixed={fixed}>
                { fixed && <StyledNavLink fixed={fixed} to="/" exact={true}>Home</StyledNavLink> }
                <StyledNavLink fixed={fixed} to={ CREATE_GAME_PATH }>Create game</StyledNavLink>
                <StyledNavLink fixed={fixed} to={ GAMES_LIST_PATH }>Games list</StyledNavLink>
            </StyledNav>
        )
    }
}