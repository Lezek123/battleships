export const colors = {
    MAIN_BG: '#282c34',
    PRIMARY: '#465d8a',
    DANGER: '#ff0077',
    INFO_LIGHT: '#b7e6ea',
    INFO_DARK: '#225588',
    CREATOR: '#aaddff',
    BOMBER: '#ffbb99',
    WIN: '#ffeeaa',
    LOSE: '#ff7777'
};

export const colorWithAlpha = (color, alpha) => {
    let colorAsArr = color.replace('#', '').split('');
    let rgba = [];
    for (let i = 0; i < 3; ++i) {
        const colorHex = colorAsArr.slice(i*2, (i+1)*2).join('');
        rgba.push(parseInt(colorHex, 16));
    }
    rgba.push(alpha);
    return `rgba(${rgba.join(', ')})`;
}

export default colors;