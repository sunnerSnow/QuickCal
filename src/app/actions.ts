"use server";

import { auth, signIn, signOut } from "@/auth";
import { buildEvent } from "@/lib/event-form";
import { createEvent, GoogleApiError } from "@/lib/google-calendar";

export type CreateEventState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string; link: string };

export async function signInWithGoogle() {
  await signIn("google");
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
    date: text("date"),
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
    if (error instanceof GoogleApiError && error.status === 401) {
      return { status: "error", message: "登入已過期，請重新登入" };
    }
    console.error("Failed to create event", error);
    return { status: "error", message: "新增失敗，請稍後再試" };
  }
}
