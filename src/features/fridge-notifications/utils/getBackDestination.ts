export function getBackDestination(
  from: string | undefined,
  fridgeId: string
): { href: string; label: string } {
  switch (from) {
    case 'my-fridges':
      return { href: '/my-fridges', label: 'Go To My Fridges' };
    case 'browse':
      return { href: '/browse', label: 'Go To Map' };
    default:
      return { href: `/fridge/${fridgeId}`, label: 'Go To Fridge' };
  }
}
