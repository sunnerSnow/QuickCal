const API_BASE = "https://www.googleapis.com/calendar/v3";

export type CalendarSummary = {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
};

export type EventTime = { dateTime: string; timeZone: string } | { date: string };

export type NewEvent = {
  summary: string;
  start: EventTime;
  end: EventTime;
  location?: string;
  description?: string;
};

export class GoogleApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Expired token (401) or scopes the user didn't grant (403). */
export function isAuthError(error: unknown): error is GoogleApiError {
  return (
    error instanceof GoogleApiError &&
    (error.status === 401 || (error.status === 403 && /insufficient authentication scopes/i.test(error.message)))
  );
}

async function googleFetch<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GoogleApiError(res.status, body?.error?.message ?? res.statusText);
  }
  return body as T;
}

type CalendarListEntry = {
  id: string;
  summary: string;
  summaryOverride?: string;
  primary?: boolean;
  backgroundColor?: string;
};

function toSummary(entry: CalendarListEntry): CalendarSummary {
  return {
    id: entry.id,
    // summaryOverride is the name the user gave the calendar in their own list
    summary: entry.summaryOverride ?? entry.summary,
    primary: Boolean(entry.primary),
    backgroundColor: entry.backgroundColor,
  };
}

/** Calendars the user can add events to, primary first. */
export async function listWritableCalendars(accessToken: string): Promise<CalendarSummary[]> {
  const data = await googleFetch<{ items?: CalendarListEntry[] }>(
    accessToken,
    "/users/me/calendarList?minAccessRole=writer",
  );
  return (data.items ?? []).map(toSummary).sort((a, b) => Number(b.primary) - Number(a.primary));
}

/** Creates a secondary calendar and returns it as it appears in the user's calendar list. */
export async function createCalendar(accessToken: string, summary: string, timeZone: string) {
  const created = await googleFetch<{ id: string }>(accessToken, "/calendars", {
    method: "POST",
    body: JSON.stringify({ summary, timeZone }),
  });
  // The list entry carries the colour Google assigned
  const entry = await googleFetch<CalendarListEntry>(
    accessToken,
    `/users/me/calendarList/${encodeURIComponent(created.id)}`,
  );
  return toSummary(entry);
}

export async function createEvent(accessToken: string, calendarId: string, event: NewEvent) {
  return googleFetch<{ id: string; htmlLink: string }>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: "POST", body: JSON.stringify(event) },
  );
}

export type UpcomingEvent = {
  id: string;
  calendarId: string;
  color?: string;
  title: string;
  link: string;
  start: EventTime;
  end: EventTime;
  location?: string;
};

type EventListItem = {
  id: string;
  summary?: string;
  htmlLink: string;
  start: EventTime;
  end: EventTime;
  location?: string;
};

const startKey = (t: EventTime) => ("dateTime" in t ? t.dateTime : t.date);

/** Events across the given calendars that end after `timeMin` and start before `timeMax`, soonest first. */
export async function listUpcomingEvents(
  accessToken: string,
  calendars: CalendarSummary[],
  timeMin: string,
  timeMax: string,
): Promise<UpcomingEvent[]> {
  const query = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin,
    timeMax,
    // Per calendar; a week with more than 50 events in one calendar gets truncated (no paging)
    maxResults: "50",
    fields: "items(id,summary,htmlLink,start,end,location)",
  });
  // One calendar failing (unshared or deleted since the list was fetched) shouldn't hide the rest;
  // only auth errors are reported, so the caller can prompt for a fresh sign-in
  const settled = await Promise.allSettled(
    calendars.map(async (calendar) => {
      const data = await googleFetch<{ items?: EventListItem[] }>(
        accessToken,
        `/calendars/${encodeURIComponent(calendar.id)}/events?${query}`,
      );
      return (data.items ?? []).map(
        (item): UpcomingEvent => ({
          id: `${calendar.id}/${item.id}`,
          calendarId: calendar.id,
          color: calendar.backgroundColor,
          title: item.summary?.trim() || "（無標題）",
          link: item.htmlLink,
          start: item.start,
          end: item.end,
          ...(item.location && { location: item.location }),
        }),
      );
    }),
  );
  const perCalendar: UpcomingEvent[][] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") perCalendar.push(result.value);
    else if (isAuthError(result.reason)) throw result.reason;
    else console.error("Failed to list events for a calendar", result.reason);
  }
  // Google returns dateTime values with varying UTC offsets, so compare instants rather than text
  return perCalendar.flat().sort((a, b) => Date.parse(startKey(a.start)) - Date.parse(startKey(b.start)));
}
