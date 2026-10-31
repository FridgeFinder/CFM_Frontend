'use client';

import React, { useRef, useState } from 'react';
import { Box, IconButton, LinearProgress, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { designColor } from 'theme/palette';

export function FridgePhotoPicker({
  previewUrl,
  disabled = false,
  loading = false,
  onSelect,
  onRemove,
  onError,
}: {
  previewUrl: string | null;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onError: (message: string) => void;
}): React.ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function select(file?: File) {
    if (!file || disabled || loading) return;
    if (!file.type.startsWith('image/')) {
      onError('Please choose an image file.');
      return;
    }
    onSelect(file);
  }

  return (
    <Box
      role="button"
      tabIndex={disabled || loading ? -1 : 0}
      aria-label="Click or drag a photo here"
      aria-disabled={disabled || loading}
      onClick={() => {
        if (!disabled && !loading) inputRef.current?.click();
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (!disabled && !loading) inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled && !loading) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        select(event.dataTransfer.files[0]);
      }}
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: { xs: 180, sm: 220 },
        borderRadius: 2,
        border: '1.5px dashed',
        borderColor: dragging ? designColor.blue.dark : designColor.borderGray,
        bgcolor: dragging ? designColor.blue.pale : 'grey.50',
        overflow: 'hidden',
        cursor: disabled || loading ? 'default' : 'pointer',
        display: 'grid',
        placeItems: 'center',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
      }}
    >
      {previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt="Selected fridge upload preview"
          onError={() =>
            onError(
              'Could not display the fridge photo. Choose another image or remove it.'
            )
          }
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            bgcolor: designColor.whiteSmoke,
          }}
        />
      ) : (
        <Typography
          sx={{
            position: 'relative',
            zIndex: 1,
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          {loading ? 'Loading existing photo...' : 'Click or drag a photo here'}
        </Typography>
      )}
      {previewUrl ? (
        <IconButton
          aria-label="Remove uploaded photo"
          size="small"
          disabled={disabled || loading}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            bgcolor: designColor.red.danger,
            color: designColor.white,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            '&:hover': { bgcolor: '#E54F4F' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
      {loading ? (
        <LinearProgress
          sx={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      <Box
        component="input"
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label="Choose fridge photo"
        disabled={disabled || loading}
        onClick={(event) => event.stopPropagation()}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          select(event.target.files?.[0]);
          event.target.value = '';
        }}
        sx={{ display: 'none' }}
      />
    </Box>
  );
}
