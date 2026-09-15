import React from 'react';
import { Box, InputBase, IconButton, Theme, SxProps } from '@mui/material';
import {
  Search as SearchIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface SearchMapProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose?: () => void;
  onFocus?: () => void;
  hideCloseIcon?: boolean; // Kept for backwards compatibility if used elsewhere
  sx?: SxProps<Theme>;
}

export function SearchMap({
  searchQuery,
  onSearchChange,
  onFocus,
  sx = {},
}: SearchMapProps): React.ReactElement {
  const [localQuery, setLocalQuery] = React.useState(searchQuery);

  // Sync external resets
  React.useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);
    onSearchChange(val);
  };

  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1000,
        ...sx,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'rgba(0,0,0,0.1)',
          borderBottom: 'none',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 600,
          height: { xs: 52, md: 48 }, // Larger tap target on mobile
          transition: 'box-shadow 0.2s',
          '&:focus-within': {
            boxShadow: '0 4px 16px rgba(21,67,212,0.15)',
          },
        }}
      >
        <SearchIcon
          sx={{ fontSize: { xs: 24, md: 20 }, color: 'text.secondary', mr: 1 }}
        />
        <InputBase
          placeholder="Search by name, street, or zip code..."
          value={localQuery}
          onChange={handleChange}
          onFocus={onFocus}
          sx={{
            flex: 1,
            fontSize: { xs: '1.05rem', md: '1rem' },
            color: 'text.primary',
          }}
          inputProps={{
            'aria-label': 'Search for fridges',
          }}
          fullWidth
        />
        {localQuery.length > 0 && (
          <IconButton
            aria-label="Clear search"
            onClick={handleClear}
            size="small"
            sx={{ color: 'text.secondary', p: { xs: 1, md: 0.5 } }}
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box aria-live="polite" sx={{ display: 'none' }}>
        {localQuery.length > 0 ? `Searching for ${localQuery}` : ''}
      </Box>
    </Box>
  );
}

export default SearchMap;
