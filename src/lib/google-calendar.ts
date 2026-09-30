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
