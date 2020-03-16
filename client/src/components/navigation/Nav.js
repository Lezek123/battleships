import React, { Component } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { CREATE_GAME_PATH, GAMES_LIST_PATH, MY_GAMES_PATH } from '../../constants/routes';
import { breakpointHit, breakpointNotHit, breakpoints as bp } from '../../constants/breakpoints';
import { MenuIcon } from '../../constants/icons';
import color from '../../constants/colors';

const StyledNav = styled.nav`
    display: flex;
    flex-direction: column;
    @media ${ breakpointNotHit(bp.SMALL_LAPTOP) } {
        align-items: flex-start;
        position: fixed;
        top: 20px;
        left: 0;
    }
    @media ${ breakpointHit(bp.SMALL_LAPTOP) } {
        width: 100%;
        align-items: stretch;
        background: #222;
    }
`;

const NavBody = styled.div`
    display: flex;
    flex-direction: column;
    @media ${ breakpointHit(bp.SMALL_LAPTOP) } {
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transition: max-height 1s, opacity 1s;
        &.expanded {
            max-height: 250px;
            opacity: 1;
        }
    }
`;

const Hamburger = styled.button`
    padding: 15px;
    font-size: 30px;
    line-height: 1;
    text-align: right;
    background: #222;
    border: 0;
    margin-left: auto;
    color: #fff;
    cursor: pointer;
    &:focus {
        outline: 0;
    }
    &.expanded {
        background-color: ${ color.PRIMARY };
    }
    @media ${ breakpointNotHit(bp.SMALL_LAPTOP) } {
        display: none;
    }
`;

const StyledNavLink = styled(NavLink)`
    display: inline-block;
    padding: 15px;
    background: #777;
    color: #fff !important;
    text-decoration: none !important;
    width: 160px;
    text-align: center;
    box-shadow: none;
    transition: box-shadow 0.5s, background-color 0.5s, padding 0.5s, color 0.5s;
    font-size: 18px;
    @media ${ breakpointNotHit(bp.SMALL_LAPTOP) } {
        box-sizing: content-box;
        border-top-right-radius: 100px;
        border-bottom-right-radius: 100px;
        margin: 10px 0;
        &:hover {
            padding: 15px 30px;
        }
        &.active {
            background: #999 !important;
            box-shadow: none !important;
            padding: 15px 30px;
        }
    }
    @media ${ breakpointHit(bp.SMALL_LAPTOP) } {
        width: 100%;
        border-top: 1px solid #333;
        &:hover {
            background: #999;
        }
        &.active {
            background: #fff;
            color: #333 !important;
        }
    }
`;

export default class Nav extends Component {
    state = { expanded: false };
    renderLink(path, text, exact = true) {
        return <StyledNavLink as={ NavLink } to={ path } exact={ exact }>{ text }</StyledNavLink>;
    }
    render() {
        return (
            <StyledNav>
                <Hamburger
                    className={this.state.expanded ? 'expanded' : null}
                    onClick={ () => this.setState(({expanded}) => ({ expanded: !expanded })) }>
                    <MenuIcon />
                </Hamburger>
                <NavBody className={this.state.expanded ? 'expanded' : null}>
                    { this.renderLink('/', 'Homepage') }
                    { this.renderLink(CREATE_GAME_PATH, 'Create a game') }
                    { this.renderLink(GAMES_LIST_PATH, 'Games list') }
                    { this.renderLink(MY_GAMES_PATH, 'My games') }
                </NavBody>
            </StyledNav>
        )
    }
}