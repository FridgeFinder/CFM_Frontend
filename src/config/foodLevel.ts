import { pinColor } from 'theme/palette';

export const foodLevelConfig: Record<number, { label: string; color: string }> =
  {
    0: { label: 'Empty', color: pinColor.itemsEmpty },
    1: { label: 'Few Items', color: pinColor.itemsFew },
    2: { label: 'Many Items', color: pinColor.itemsMany },
    3: { label: 'Full', color: pinColor.itemsFull },
  };
