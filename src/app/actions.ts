"use server";

import { auth, signIn, signOut } from "@/auth";
import { buildEvent } from "@/lib/event-form";
import {
  createCalendar,
  createEvent,
  GoogleApiError,
  isAuthError,
  listUpcomingEvents,
  listWritableCalendars,
  type CalendarSummary,
  type UpcomingEvent,
} from "@/lib/google-calendar";

export type CreateEventState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string; link: string };

export async function signInWithGoogle() {
  // Land on a clean home page, even when signing in from a ?error= URL
  await signIn("google", { redirectTo: "/" });
}

export async function signOutAction() {
  await signOut();
}

export async function createEventAction(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const session = await auth();
  if (!session?.accessToken || session.error) {
    return { status: "error", message: "登入已過期，請重新登入" };
  }

  const text = (key: string) => String(formData.get(key) ?? "");
  const calendarId = text("calendarId") || "primary";
  const result = buildEvent({
    title: text("title"),
    startDate: text("startDate"),
    endDate: text("endDate"),
    allDay: formData.get("allDay") === "on",
    startTime: text("startTime"),
    endTime: text("endTime"),
    timeZone: text("timeZone"),
    location: text("location"),
    description: text("description"),
  });
  if ("error" in result) return { status: "error", message: result.error };

  try {
    const created = await createEvent(session.accessToken, calendarId, result.event);
    return { status: "success", message: `已新增「${result.event.summary}」`, link: created.htmlLink };
  } catch (error) {
    if (isAuthError(error)) {
      return { status: "error", message: "登入已過期或缺少日曆權限，請重新登入" };
    }
    if (error instanceof GoogleApiError && error.status === 403) {
      return { status: "error", message: "你沒有權限寫入這個日曆" };
    }
    console.error("Failed to create event", error);
    return { status: "error", message: "新增失敗，請稍後再試" };
  }
}

const MAX_RANGE_MS = 8 * 86_400_000;

/** Upcoming events in the user's writable calendars between two instants (ISO strings from the browser's clock). */
export async function listUpcomingEventsAction(
  timeMin: string,
  timeMax: string,
): Promise<{ events: UpcomingEvent[] } | { error: string }> {
  const session = await auth();
  if (!session?.accessToken || session.error) return { error: "登入已過期，請重新登入" };

  const min = Date.parse(timeMin);
  const max = Date.parse(timeMax);
  if (Number.isNaN(min) || Number.isNaN(max) || max <= min || max - min > MAX_RANGE_MS) {
    return { error: "時間範圍不正確" };
  }

  try {
    const calendars = await listWritableCalendars(session.accessToken);
    const events = await listUpcomingEvents(
      session.accessToken,
      calendars,
      new Date(min).toISOString(),
      new Date(max).toISOString(),
    );
    return { events };
  } catch (error) {
    if (isAuthError(error)) return { error: "登入已過期或缺少日曆權限，請重新登入" };
    console.error("Failed to list upcoming events", error);
    return { error: "讀取行程失敗，請稍後再試" };
  }
}

export async function createCalendarAction(
  name: string,
  timeZone: string,
): Promise<{ calendar: CalendarSummary } | { error: string }> {
  const session = await auth();
  if (!session?.accessToken || session.error) return { error: "登入已過期，請重新登入" };

  const summary = name.trim();
  if (!summary) return { error: "請輸入分類名稱" };
  if (summary.length > 100) return { error: "分類名稱太長" };

  try {
    const calendar = await createCalendar(session.accessToken, summary, timeZone || "Asia/Taipei");
    return { calendar };
  } catch (error) {
    if (isAuthError(error)) {
      return { error: "缺少「建立日曆」權限，請登出後重新登入並勾選所有日曆選項" };
    }
    console.error("Failed to create calendar", error);
    return { error: "新增分類失敗，請稍後再試" };
  }
}
