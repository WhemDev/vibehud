/**
 * Production theme: "brutalist", chosen from the style catalog.
 * Hard black borders, offset shadows, flat process-yellow alerts.
 * One committed visual world — the panel does not follow light/dark mode.
 */
export const theme = {
  bg: '#f2efe6',
  card: '#ffffff',
  well: '#e9e4d4',
  ink: '#14120e',
  muted: '#55503f',
  line: '#14120e',

  ok: '#16a34a',
  doing: '#e8952f',
  todo: '#8a8471',
  danger: '#e23c2e',

  warnBg: '#ffe14d',
  okBg: '#a7f3c0',
  tagBg: '#14120e',
  tagInk: '#ffe14d',

  bw: 2,
  shadow: '3px 3px 0 #14120e',
  shadowSmall: '2px 2px 0 #14120e',

  fontHead: "'Archivo', ui-sans-serif, system-ui, sans-serif",
  fontBody: "'Archivo', ui-sans-serif, system-ui, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
} as const

export const statusColor: Record<string, string> = {
  done: theme.ok,
  doing: theme.doing,
  todo: theme.todo,
}

export const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=JetBrains+Mono:wght@400;700&display=swap'
