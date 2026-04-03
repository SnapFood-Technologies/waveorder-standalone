/**
 * Convert a UTC instant to the string expected by <input type="datetime-local">
 * using wall-clock components in the given IANA timezone.
 */
export function instantToDatetimeLocalInTimeZone(
  isoOrDate: string | Date,
  timeZone: string | null | undefined
): string {
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return ''
  const tz = (timeZone && String(timeZone).trim()) || 'UTC'
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }
  let fmt: Intl.DateTimeFormat
  try {
    fmt = new Intl.DateTimeFormat('en-CA', opts)
  } catch {
    fmt = new Intl.DateTimeFormat('en-CA', { ...opts, timeZone: 'UTC' })
  }
  const parts = fmt.formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  const y = get('year')
  const mo = get('month')
  const da = get('day')
  const h = get('hour')
  const mi = get('minute')
  if (!y || !mo || !da || h === '' || mi === '') return ''
  return `${y}-${mo}-${da}T${h}:${mi}`
}

function zonedCalendarParts(
  utcMs: number,
  timeZone: string
): { y: number; mo: number; d: number; h: number; mi: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date(utcMs))
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? 'NaN', 10)
  return { y: num('year'), mo: num('month'), d: num('day'), h: num('hour'), mi: num('minute') }
}

/**
 * Interpret `YYYY-MM-DDTHH:mm` as wall time in `timeZone` and return the UTC ISO string.
 * Falls back to `new Date(localStr)` if the pattern does not match.
 */
export function datetimeLocalInTimeZoneToIsoUtc(
  localStr: string,
  timeZone: string | null | undefined
): string {
  const trimmed = localStr.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed)
  if (!m) {
    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }
  const y = +m[1]
  const mo = +m[2]
  const da = +m[3]
  const h = +m[4]
  const mi = +m[5]
  const tz = (timeZone && String(timeZone).trim()) || 'UTC'
  if (tz === 'UTC') {
    return new Date(Date.UTC(y, mo - 1, da, h, mi, 0)).toISOString()
  }

  const target = { y, mo, d: da, h, mi }
  const matches = (utcMs: number) => {
    const p = zonedCalendarParts(utcMs, tz)
    return (
      p.y === target.y &&
      p.mo === target.mo &&
      p.d === target.d &&
      p.h === target.h &&
      p.mi === target.mi
    )
  }

  // Search a ±8 day window around a naive UTC guess (covers TZ/DST edges)
  const naive = Date.UTC(y, mo - 1, da, h, mi, 0)
  const step = 60 * 1000
  const windowMs = 8 * 24 * 60 * 60 * 1000
  for (let t = naive - windowMs; t <= naive + windowMs; t += step) {
    if (matches(t)) {
      return new Date(t).toISOString()
    }
  }

  // Invalid local time (e.g. DST gap) — keep prior behavior: parse as local browser time
  const d = new Date(trimmed)
  return Number.isNaN(d.getTime()) ? new Date(naive).toISOString() : d.toISOString()
}
