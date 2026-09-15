import { PaletteOptions } from '@mui/material/styles';

export const applyAlpha = (alpha: string, color: string): string =>
  color + alpha;

export const pinColor = {
  itemsFull: '#97ed7d',
  itemsMany: '#ffe55c',
  itemsFew: '#ffd4ff',
  itemsEmpty: '#ffffff',
  fridgeNotAtLocation: '#d3d3d3',
  fridgeOperation: '#222',
  fridgeGhost: '#e3f2fd',
  reportUnavailable: '#d3d3d3',
};

const grayscale = {
  gradient: [
    '#FFFFFF', //0] white
    '#F6F6F6', //1] whiteSmoke
    '#D8D8D8', //2] lightSilver - veryLightGray
    '#B4B4B4', //3] magneticGray
    '#222222', //4] neroGray
  ],
};

export const designColor = {
  white: grayscale.gradient[0],
  whiteSmoke: grayscale.gradient[1],
  lightSilver: grayscale.gradient[2],
  magneticGray: grayscale.gradient[3],
  neroGray: grayscale.gradient[4],
  black: '#000000',
  borderSubtle: 'rgba(0,0,0,0.1)',
  borderGray: '#E6E7EB',
  mutedText: '#838383',
  secondaryText: '#696969',
  conditionIcon: '#666666',
  dividerMuted: '#999999',
  blue: {
    dark: '#1543D4',
    interactive: '#2563eb',
    darkShade: ['#040B25'],
    navy: '#002F64',
    pale: '#D6E3FF',
    light: '#88B3FF',
    disabled: '#8CA0EA',
    shadow: 'rgba(21, 67, 212, 0.2)',
    shadowHover: 'rgba(21, 67, 212, 0.3)',
    shadowSubtle: 'rgba(21, 67, 212, 0.15)',
  },
  red: {
    danger: '#FF6262',
  },
  green: {
    success: '#10B981',
  },
};

const palette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: designColor.blue.dark,
  },
  secondary: {
    main: designColor.blue.light,
  },
  background: {
    default: designColor.white,
    paper: designColor.white,
  },
  text: {
    primary: designColor.neroGray,
    secondary: applyAlpha('cc', designColor.neroGray),
    disabled: designColor.magneticGray,
  },
  divider: designColor.neroGray,
};

export default palette;
