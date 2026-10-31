import { Typography } from '@mui/material';
import { designColor } from 'theme/palette';

export function GhostUpdatesNotice(): React.ReactElement {
  return (
    <Typography
      sx={{
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'center',
        color: designColor.secondaryText,
        backgroundColor: designColor.whiteSmoke,
        border: `1px solid ${designColor.lightSilver}`,
        borderRadius: '12px',
        px: 2,
        py: 1.5,
        fontSize: '0.875rem',
      }}
    >
      Updates are disabled for Ghost fridges
    </Typography>
  );
}
