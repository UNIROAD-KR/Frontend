import type { CalendarOccurrence } from "@/src/api/calendar";

/** Day keys stay in the server's local calendar date; never convert through UTC. */
export function occurrenceCoversDate(event: CalendarOccurrence, date: string) {
  const first = event.startAt.slice(0, 10);
  const last = event.endAt.slice(0, 10);
  if (date < first || date > last) return false;
  // A timed event ending at midnight does not occupy the following day.
  return !(date === last && last > first && !event.allDay && /^00:00(?::00(?:\.0+)?)?$/.test(event.endAt.slice(11)));
}

export function calendarWeekRanges(keys: (string | null)[], events: CalendarOccurrence[]) {
  const ranges: { start: number; end: number }[] = [];
  for (const event of events) {
    const covered = keys.flatMap((key, index) => key && occurrenceCoversDate(event, key) ? [index] : []);
    if (covered.length) ranges.push({ start: covered[0], end: covered[covered.length - 1] });
  }
  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: typeof ranges = [];
  for (const range of ranges) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}
