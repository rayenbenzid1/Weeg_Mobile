// WEEG Mobile Theme v2 — Premium Design System
export const Colors = {
  // Brand
  navy:      '#050d1a',
  navy2:     '#0a1628',
  navy3:     '#101f35',
  blue:      '#1a5cf0',
  blue2:     '#2568f5',
  blue3:     '#3d7ff6',
  blueDim:   '#1040a0',
  orange:    '#f07020',
  orange2:   '#f58030',
  teal:      '#0dcfaa',
  teal2:     '#0bb896',
  purple:    '#7c3aed',

  // Status
  red:       '#e83535',
  redBg:     '#fef0f0',
  redText:   '#b01f1f',
  amber:     '#f59e0b',
  amberBg:   '#fffbeb',
  amberText: '#92400e',
  green:     '#10b981',
  greenBg:   '#f0fdf4',
  greenText: '#065f46',

  // Backgrounds
  bg:        '#f4f6fb',
  surface:   '#ffffff',
  surface2:  '#f9fafc',

  // Borders
  border:    '#e4e9f0',
  border2:   '#d0d8e8',

  // Text
  text:      '#0d1929',
  text2:     '#4a5568',
  text3:     '#8492a6',

  // Misc
  white:     '#ffffff',
  black:     '#000000',

  // Legacy compatibility
  primary:        '#1a5cf0',
  primaryDark:    '#2568f5',
  violet:         '#7c3aed',
  violet600:      '#7c3aed',
  gradientStart:  '#1a5cf0',
  gradientEnd:    '#7c3aed',
  background:     '#f4f6fb',
  backgroundDark: '#0f172a',
  card:           '#ffffff',
  foreground:     '#0d1929',
  muted:          '#8492a6',
  success:        '#10b981',
  warning:        '#f59e0b',
  danger:         '#e83535',
  info:           '#3b82f6',
  indigo600:      '#1a5cf0',
  gray50:         '#f9fafc',
  gray100:        '#f4f6fb',
  gray200:        '#e4e9f0',
  gray300:        '#d0d8e8',
  gray400:        '#b0bec8',
  gray500:        '#8492a6',
  gray600:        '#6b7a8d',
  gray700:        '#4a5568',
  gray800:        '#2d3748',
  gray900:        '#0d1929',
  indigo50:       '#eef2ff',
  indigo100:      '#e0e7ff',
  red50:          '#fef0f0',
  red100:         '#fde0e0',
  red500:         '#e83535',
  red600:         '#cc2a2a',
  green50:        '#f0fdf4',
  green100:       '#dcfce7',
  green500:       '#10b981',
  green600:       '#059669',
  blue50:         '#eff6ff',
  blue100:        '#dbeafe',
  blue500:        '#3b82f6',
  blue600:        '#2563eb',
  orange500:      '#f07020',
  orange600:      '#ea580c',
  purple500:      '#a855f7',
  purple600:      '#9333ea',
  emerald500:     '#10b981',
  yellow50:       '#fefce8',
  yellow500:      '#eab308',
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

export const BorderRadius = {
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  '2xl': 20,
  full: 9999,
};

export const Typography = {
  xs:   11,
  sm:   13,
  base: 15,
  lg:   17,
  xl:   19,
  '2xl': 22,
  '3xl': 28,
  '4xl': 34,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0a1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0a1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  xl: {
    shadowColor: '#1a5cf0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Risk color helpers
export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'critical': return Colors.red;
    case 'high':     return Colors.amber;
    case 'medium':   return Colors.blue;
    case 'low':      return Colors.green;
    default:         return Colors.text3;
  }
}

export function getRiskBg(risk: string): string {
  switch (risk) {
    case 'critical': return Colors.redBg;
    case 'high':     return Colors.amberBg;
    case 'medium':   return Colors.blue50;
    case 'low':      return Colors.greenBg;
    default:         return Colors.surface2;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ok':       return Colors.green;
    case 'low':      return Colors.amber;
    case 'critical': return Colors.orange;
    case 'out':      return Colors.red;
    default:         return Colors.green;
  }
}