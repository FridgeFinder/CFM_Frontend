import { createTheme, responsiveFontSizes, Theme } from '@mui/material/styles';

import palette, { applyAlpha, designColor } from './palette';
import typography from './typography';

let theme: Theme = createTheme({
  palette,
  typography,
  spacing: 4,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        color: 'secondary',
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 45,
          textTransform: 'uppercase',
          padding: '8px 24px',
          fontWeight: 700,
          '&.MuiButton-outlined': {
            color: designColor.neroGray,
            borderColor: designColor.blue.dark,
            backgroundColor: designColor.white,
          },
          '&.Mui-disabled': {
            color: designColor.white,
            backgroundColor: applyAlpha('cc', designColor.neroGray),
          },
        },
      },
      variants: [
        {
          props: { size: 'large' },
          style: { minWidth: 300 },
        },
      ],
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
