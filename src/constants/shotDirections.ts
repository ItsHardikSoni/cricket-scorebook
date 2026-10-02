import { ShotDirection } from '@/types/cricket';

export const SHOT_DIRECTIONS: { value: ShotDirection; label: string; shortLabel: string; angle: number }[] = [
  { value: 'third_man', label: 'Third man', shortLabel: '3rd', angle: 270 },
  { value: 'point', label: 'Point', shortLabel: 'Point', angle: 315 },
  { value: 'cover', label: 'Cover', shortLabel: 'Cover', angle: 0 },
  { value: 'mid_off', label: 'Mid-off', shortLabel: 'M-off', angle: 45 },
  { value: 'straight', label: 'Straight', shortLabel: 'Straight', angle: 90 },
  { value: 'mid_on', label: 'Mid-on', shortLabel: 'M-on', angle: 135 },
  { value: 'mid_wicket', label: 'Mid-wicket', shortLabel: 'M-wkt', angle: 180 },
  { value: 'fine_leg', label: 'Fine leg', shortLabel: 'Fine', angle: 225 },
];