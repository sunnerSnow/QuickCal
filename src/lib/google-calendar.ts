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

/** Calendars the user can add events to, primary first. */
export async function listWritableCalendars(accessToken: string): Promise<CalendarSummary[]> {
  const data = await googleFetch<{ items?: Array<CalendarSummary & { accessRole: string }> }>(
    accessToken,
    "/users/me/calendarList?minAccessRole=writer",
  );
  return (data.items ?? [])
    .map(({ id, summary, primary, backgroundColor }) => ({
      id,
      summary,
      primary: Boolean(primary),
      backgroundColor,
    }))
    .sort((a, b) => Number(b.primary) - Number(a.primary));
}

export async function createEvent(accessToken: string, calendarId: string, event: NewEvent) {
  return googleFetch<{ id: string; htmlLink: string }>(
    accessToken,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    { method: "POST", body: JSON.stringify(event) },
  );
}
