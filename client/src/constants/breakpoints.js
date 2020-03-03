export const breakpoints = {
    SMALL_DESKTOP: '1600px',
    SMALL_LAPTOP: '1200px',
    TABLET: '800px',
    PHONE: '480px',
}

export const breakpointHit = (breakpoint) => `(max-width: ${breakpoint})`;
export const breakpointNotHit = (breakpoint) => `(min-width: ${breakpoint})`;

export default breakpoints;