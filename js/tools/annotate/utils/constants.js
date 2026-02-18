// js/tools/annotate/utils/constants.js

export const TOOLS = {
  SELECT: 'select',
  TEXT: 'text',
  SCRIBBLE: 'scribble',
  HIGHLIGHT: 'highlight',
  SHAPE: 'shape'
};

export const ANNOTATION_TYPES = {
  TEXT: 'text',
  SCRIBBLE: 'scribble',
  HIGHLIGHT: 'highlight',
  SHAPE: 'shape'
};

export const FONTS = {
  NOTO_SANS: 'NotoSans',
  NOTO_SANS_ARABIC: 'NotoSansArabic',
  NOTO_SERIF_HEBREW: 'NotoSerifHebrew',
  STANDARD: 'Standard'
};

export const DEFAULTS = {
  SCALE: 1.5,
  TEXT_SIZE: 16,
  TEXT_COLOR: '#000000',
  TEXT_FONT: FONTS.NOTO_SANS,
  SCRIBBLE_WIDTH: 2,
  SCRIBBLE_COLOR: '#000000',
  HANDLE_SIZE: 16,
  ROTATE_HANDLE_COLOR: '#ff8800',
  SCALE_HANDLE_COLOR: '#0066ff'
};

export const DPR = window.devicePixelRatio || 1;

export const COLORS = {
  SELECTION: '#ff8800',
  TEXT_BORDER: '#0066ff',
  BACKGROUND: 'rgba(255, 255, 255, 0.8)'
};
