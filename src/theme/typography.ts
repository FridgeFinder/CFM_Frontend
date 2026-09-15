const typography = {
  fontFamily: [
    'var(--font-inter)',
    'Inter',
    '"Helvetica Neue"',
    'HelveticaNeue',
    'Helvetica',
    '"TeX Gyre"',
    'TeXGyre',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    margin: '0.5em 0',
    lineHeight: 1.2,
  },
  h2: { fontSize: '2rem', fontWeight: 700, margin: '0.5em 0', lineHeight: 1.2 },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    margin: '0.5em 0',
    lineHeight: 1.2,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: '0.5em 0',
    lineHeight: 1.2,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    margin: '0.5em 0',
    lineHeight: 1.2,
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    margin: '0.5em 0',
    lineHeight: 1.2,
  },
  body1: { fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.6 },
  body2: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
  button: {
    fontSize: '1rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: '0.875rem',
    fontWeight: 500,
    letterSpacing: '0.01em',
    lineHeight: 1.4,
  },
  overline: {
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
};

export default typography;
