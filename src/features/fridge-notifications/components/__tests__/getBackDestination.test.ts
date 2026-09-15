import { getBackDestination } from '../../utils/getBackDestination';

describe('getBackDestination', () => {
  it('returns my-fridges route when from is "my-fridges"', () => {
    const result = getBackDestination('my-fridges', 'fridge-1');
    expect(result).toEqual({ href: '/my-fridges', label: 'Go To My Fridges' });
  });

  it('returns browse route when from is "browse"', () => {
    const result = getBackDestination('browse', 'fridge-1');
    expect(result).toEqual({ href: '/browse', label: 'Go To Map' });
  });

  it('returns fridge profile route when from is undefined', () => {
    const result = getBackDestination(undefined, 'fridge-1');
    expect(result).toEqual({ href: '/fridge/fridge-1', label: 'Go To Fridge' });
  });

  it('returns fridge profile route for an unrecognised from value', () => {
    const result = getBackDestination('unknown', 'fridge-abc');
    expect(result).toEqual({
      href: '/fridge/fridge-abc',
      label: 'Go To Fridge',
    });
  });
});
