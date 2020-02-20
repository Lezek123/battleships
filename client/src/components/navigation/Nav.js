import React, { Component } from 'react';
import styled, { css } from 'styled-components';
import { NavLink } from 'react-router-dom';
import { CREATE_GAME_PATH, GAMES_LIST_PATH } from '../../constants/routes';
import { BigButton } from './buttons';

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

const FixedNavLink = styled(NavLink)`
    display: inline-block;
    padding: 20px;
    margin: 10px 0;
    background: #777;
    color: #fff !important;
    text-decoration: none !important;
    width: 200px;
    text-align: center;
    box-shadow: none;
    transition: box-shadow 0.5s, background-color 0.5s, padding 0.5s;
    font-size: 20px;
    border-top-right-radius: 100px;
    border-bottom-right-radius: 100px;
    &:hover {
        padding: 20px 40px;
    }
    &.active {
        background: #999 !important;
        box-shadow: none !important;
        padding: 20px 40px;
    }
`;

export default class Nav extends Component {
    renderLink(path, text, exact = true) {
        const { fixed } = this.props;
        const LinkComponent = fixed ? FixedNavLink : BigButton;

        return <LinkComponent as={ NavLink } to={ path } exact={ exact }>{ text }</LinkComponent>;
    }
    render() {
        const { fixed } = this.props;
        return (
            <StyledNav fixed={fixed}>
                { fixed && this.renderLink('/', 'Homepage') }
                { this.renderLink(CREATE_GAME_PATH, 'Create a game') }
                { this.renderLink(GAMES_LIST_PATH, 'Games list') }
            </StyledNav>
        )
    }
}