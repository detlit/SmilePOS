/**
 * SmileStore POS — design tokens.
 *
 * Single source of truth for colour. The UI is built on a calm, desaturated
 * blue ("Calm Ocean") chosen so that long POS shifts stay comfortable to read:
 * every step is tuned to a target contrast against white, and the semantic
 * families (success / warning / danger) stay in their conventional hues so
 * state is never signalled by the brand colour alone.
 *
 * Ramp steps are named by role, not by number, so call sites read as intent
 * (`brand.primary`) rather than as a shade (`blue600`).
 *
 * Contrast vs #FFFFFF (WCAG 2.1):
 *   vivid 3.86 · primary 5.61 (AA text) · dark 8.21 · darkest 10.72 (AAA)
 */

/** Brand blue. `primary` is the default action colour; `vivid` is its lighter
 *  partner for gradients and hover, `darkest` is brand-tinted text. */
export const brand = {
  /** page / panel wash */
  bg: '#F3F8FC',
  /** chip, row-stripe, selected-row fill */
  tint: '#E5EEF8',
  /** hairline borders on tinted surfaces */
  border: '#CCDFF1',
  /** stronger border, disabled fills */
  borderStrong: '#A6C8E7',
  /** icons and marks on dark brand surfaces */
  light: '#6BA3D8',
  /** gradient partner, hover state */
  vivid: '#3E86C7',
  /** primary buttons, active nav, links */
  primary: '#2A6AAA',
  /** pressed state, headings on tint */
  dark: '#1E5088',
  /** brand-tinted body text */
  darkest: '#173F6B',
  /** deep surfaces (headers, sidebars) */
  deeper: '#102C4C',
  /** near-black brand ink */
  ink: '#0A1B2E',
  /** navy for large filled areas */
  navy: '#12314F',
} as const;

/** Neutral ramp — slate, cool enough to sit under the blue without clashing. */
export const neutral = {
  bg: '#F8FAFC',
  subtle: '#F1F5F9',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  muted: '#94A3B8',
  body: '#64748B',
  strong: '#475569',
  heading: '#334155',
  ink: '#1E293B',
  black: '#0F172A',
} as const;

/**
 * Semantic state colours. Deliberately NOT blue: money and stock movement must
 * stay readable as good/bad at a glance, independent of the brand hue.
 */
export const semantic = {
  /** positive balance, completed, money in */
  success: '#147F56',
  successBg: '#EDF9F3',
  successTint: '#D3F0E2',
  successBorder: '#A9E1C6',
  successDark: '#0F6845',

  /** expiring soon, low stock, pending */
  warning: '#D97706',
  warningBg: '#FFFBEB',
  warningTint: '#FEF3C7',
  warningBorder: '#FDE68A',
  warningDark: '#92400E',

  /**
   * Negative balance, failed, destructive.
   * `danger` is for marks, borders and text on white (4.83:1). For *text on
   * `dangerBg`* use `dangerDark` — plain `danger` only reaches 4.41:1 there,
   * just under AA.
   */
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerTint: '#FEE2E2',
  dangerBorder: '#FECACA',
  dangerDark: '#B91C1C',

  /** informational, neutral notice */
  info: brand.primary,
  infoBg: brand.bg,
  infoTint: brand.tint,
  infoBorder: brand.border,
} as const;

/**
 * Categorical palette for charts — fixed order, never cycled.
 *
 * Verified with the dataviz palette validator (light surface): lightness band,
 * chroma floor, adjacent-pair CVD separation, normal-vision floor and contrast
 * all pass. The green↔orange pair sits in the 6–8 ΔE band under protanopia, so
 * chart series must also carry a legend or direct labels — which they do.
 *
 * A 9th series is not a generated hue: fold it into "อื่นๆ" (Other).
 */
export const chartSeries = [
  '#2A6AAA', // 1 blue (brand)
  '#E0762A', // 2 orange
  '#1F9D6B', // 3 green
  '#8B5CF6', // 4 purple
  '#0E9BB5', // 5 cyan
  '#DB2777', // 6 magenta
  '#B45309', // 7 amber-brown
  '#65A30D', // 8 olive
] as const;

/**
 * Dark-mode categorical palette. Re-stepped against the #0F172A surface rather
 * than lightened from `chartSeries` — validator: all checks pass (OKLCH L
 * 0.48–0.67 band, chroma floor, contrast >= 3:1).
 */
export const chartSeriesDark = [
  '#4C93CC', // 1 blue
  '#D0742F', // 2 orange
  '#2AA377', // 3 green
  '#8F6FD6', // 4 purple
  '#1C93AC', // 5 cyan
] as const;

/** Single-hue ramp for magnitude (heatmaps, intensity), light → dark. */
export const chartSequential = [
  '#E5EEF8',
  '#CCDFF1',
  '#A6C8E7',
  '#6BA3D8',
  '#3E86C7',
  '#2A6AAA',
  '#1E5088',
  '#173F6B',
] as const;

/** Elevation. Blue-tinted shadows read as one system with the surfaces. */
export const shadow = {
  sm: '0 1px 2px rgba(23, 63, 107, 0.06)',
  md: '0 2px 8px rgba(23, 63, 107, 0.08)',
  lg: '0 4px 16px rgba(23, 63, 107, 0.10)',
  brand: '0 2px 8px rgba(42, 106, 170, 0.30)',
} as const;

export const colors = {
  brand,
  neutral,
  semantic,
  chartSeries,
  chartSeriesDark,
  chartSequential,
  shadow,
};

export default colors;
