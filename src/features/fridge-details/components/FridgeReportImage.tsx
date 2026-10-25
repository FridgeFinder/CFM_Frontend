'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface FridgeReportImageProps {
  src: string;
  alt: string;
  expandedAlt: string;
  priority?: boolean;
  borderRadius?: string;
  marginBottom?: number;
}

export function FridgeReportImage({
  src,
  alt,
  expandedAlt,
  priority = false,
  borderRadius = '12px',
  marginBottom = 0,
}: FridgeReportImageProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef({ distance: 0, zoom: 1 });

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ): void => {
    if (event.pointerType !== 'touch') return;

    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (activePointers.current.size === 2) {
      const [first, second] = [...activePointers.current.values()];
      pinchStartRef.current = {
        distance: Math.hypot(first.x - second.x, first.y - second.y),
        zoom,
      };
    }
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ): void => {
    if (!activePointers.current.has(event.pointerId)) return;

    activePointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (
      activePointers.current.size < 2 ||
      pinchStartRef.current.distance === 0
    ) {
      return;
    }

    const [first, second] = [...activePointers.current.values()];
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    setZoom(
      Math.min(
        3,
        Math.max(
          1,
          pinchStartRef.current.zoom *
            (distance / pinchStartRef.current.distance)
        )
      )
    );
  };

  const handlePointerEnd = (
    event: React.PointerEvent<HTMLDivElement>
  ): void => {
    activePointers.current.delete(event.pointerId);
    if (activePointers.current.size < 2) pinchStartRef.current.distance = 0;
  };

  const close = (): void => {
    setOpen(false);
    setZoom(1);
    setZoomOrigin('50% 50%');
    activePointers.current.clear();
    pinchStartRef.current = { distance: 0, zoom: 1 };
  };

  const toggleDesktopZoom = (
    event?: React.MouseEvent<HTMLDivElement>
  ): void => {
    if (window.innerWidth < 900) return;

    if (zoom === 1 && event) {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        const x = Math.min(
          100,
          Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)
        );
        const y = Math.min(
          100,
          Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100)
        );
        setZoomOrigin(`${x}% ${y}%`);
      } else {
        setZoomOrigin('50% 50%');
      }
    } else if (zoom === 1) {
      setZoomOrigin('50% 50%');
    }

    setZoom(zoom === 1 ? 2 : 1);
  };

  return (
    <>
      <ButtonBase
        aria-label="Expand fridge status photo"
        onClick={() => setOpen(true)}
        sx={{
          position: 'relative',
          display: 'block',
          width: '100%',
          maxHeight: { xs: 325, md: 350 },
          aspectRatio: '1 / 1.1',
          mb: marginBottom,
          backgroundColor: '#F5F5F5',
          borderRadius,
          overflow: 'hidden',
          cursor: 'zoom-in',
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 600px) 100vw, 864px"
          style={{ objectFit: 'contain' }}
        />
      </ButtonBase>

      <Dialog
        open={open}
        onClose={close}
        maxWidth={false}
        aria-labelledby="fridge-status-photo-viewer-title"
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: '100vw', md: 'calc(100% - 32px)' },
            height: { xs: '100dvh', md: 'calc(100% - 32px)' },
            maxWidth: { xs: 'none', md: 1280 },
            maxHeight: { xs: 'none', md: 900 },
            m: { xs: 0, md: 2 },
            borderRadius: { xs: 0, md: 1 },
            backgroundColor: 'rgba(18, 18, 18, 0.96)',
            color: 'white',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          id="fridge-status-photo-viewer-title"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            p: 0,
            overflow: 'hidden',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
          }}
        >
          Fridge status photo viewer
        </DialogTitle>
        <DialogContent sx={{ position: 'relative', p: 0, overflow: 'hidden' }}>
          <IconButton
            aria-label="Close image viewer"
            onClick={close}
            sx={{
              position: 'absolute',
              zIndex: 1,
              top: 12,
              right: 12,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            role="button"
            tabIndex={0}
            aria-label={zoom === 1 ? 'Zoom in on photo' : 'Zoom out on photo'}
            onClick={toggleDesktopZoom}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleDesktopZoom();
              }
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            sx={{
              position: 'absolute',
              inset: 0,
              touchAction: 'none',
              cursor: {
                xs: 'default',
                md: zoom === 1 ? 'zoom-in' : 'zoom-out',
              },
              outline: 'none',
            }}
          >
            <Image
              src={src}
              alt={expandedAlt}
              fill
              sizes="100vw"
              style={{
                objectFit: 'contain',
                transform: `scale(${zoom})`,
                transformOrigin: zoomOrigin,
                transition: 'transform 150ms ease-out',
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
