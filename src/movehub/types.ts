/** Swatch color shown for each LED color name. */
export const COLOR_HEX: Record<string, string> = {
  off: '#2A2D34',
  pink: '#E85D9C',
  purple: '#7B4FD6',
  blue: '#1F4FD1',
  lightblue: '#4BA3E3',
  cyan: '#1FB5B0',
  green: '#2E9E4F',
  yellow: '#F2C230',
  orange: '#EE7A1F',
  red: '#D63A2F',
  white: '#FFFFFF'
};

/** Color indexes (0–10), used both for the hub LED and the color sensor. */
export const MOVE_HUB_COLORS: {
  index: number;
  id: string;
  name: string;
  hex: string;
}[] = [
  { index: 0, id: 'off', name: 'Off', hex: '#2A2D34' },
  { index: 1, id: 'pink', name: 'Pink', hex: '#E85D9C' },
  { index: 2, id: 'purple', name: 'Purple', hex: '#7B4FD6' },
  { index: 3, id: 'blue', name: 'Blue', hex: '#1F4FD1' },
  { index: 4, id: 'lightblue', name: 'Light blue', hex: '#4BA3E3' },
  { index: 5, id: 'cyan', name: 'Cyan', hex: '#1FB5B0' },
  { index: 6, id: 'green', name: 'Green', hex: '#2E9E4F' },
  { index: 7, id: 'yellow', name: 'Yellow', hex: '#F2C230' },
  { index: 8, id: 'orange', name: 'Orange', hex: '#EE7A1F' },
  { index: 9, id: 'red', name: 'Red', hex: '#D63A2F' },
  { index: 10, id: 'white', name: 'White', hex: '#FFFFFF' }
];
