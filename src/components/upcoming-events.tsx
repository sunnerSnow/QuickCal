"use client";

import { useEffect, useState } from "react";
import { listUpcomingEventsAction } from "@/app/actions";
import { addDays } from "@/lib/event-form";
import type { EventTime, UpcomingEvent } from "@/lib/google-calendar";
import { ExternalIcon } from "./icons";
import { FieldLabel, labelRowClass } from "./ui";

const DAYS = 7;
const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isAllDay = (t: EventTime): t is { date: string } => "date" in t;

type DayGroup = { date: string; label: string; sub: string; events: UpcomingEvent[] };
type Status = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; days: DayGroup[] };

const shortDate = new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric" });
const weekday = new Intl.DateTimeFormat("zh-TW", { weekday: "short" });
const clock = new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });

// Date-only strings would parse as UTC midnight; build a local date instead
function parseLocalDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayLabel(date: string, today: string) {
  if (date === today) return "今天";
  if (date === addDays(today, 1)) return "明天";
  return weekday.format(parseLocalDate(date));
}

/** The local day an event is shown under: ongoing events stay on today. */
function displayDay(event: UpcomingEvent, today: string) {
  const start = isAllDay(event.start) ? event.start.date : localDate(new Date(event.start.dateTime));
  return start < today ? today : start;
}

function groupByDay(events: UpcomingEvent[], today: string): DayGroup[] {
  const groups = new Map<string, UpcomingEvent[]>();
  for (const event of events) {
    const day = displayDay(event, today);
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({
      date,
      label: dayLabel(date, today),
      sub: shortDate.format(parseLocalDate(date)),
      // All-day events first, then by start time (already sorted by the server)
      events: [...list.filter((e) => isAllDay(e.start)), ...list.filter((e) => !isAllDay(e.start))],
    }));
}

function timeText(event: UpcomingEvent, day: string) {
  if (isAllDay(event.start) && isAllDay(event.end)) {
    // The API's all-day end date is exclusive
    const lastDay = addDays(event.end.date, -1);
    return lastDay > day ? `全天 · 至 ${shortDate.format(parseLocalDate(lastDay))}` : "全天";
  }
  if (isAllDay(event.start) || isAllDay(event.end)) return "全天";
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  const startDay = localDate(start);
  const endDay = localDate(end);
  const from = startDay < day ? `${shortDate.format(start)} ${clock.format(start)}` : clock.format(start);
  const to = endDay > day ? `${shortDate.format(end)} ${clock.format(end)}` : clock.format(end);
  return `${from} – ${to}`;
}

/** The next seven days of events from the user's calendars; reloads whenever `refreshKey` changes. */
export function UpcomingEvents({ refreshKey }: { refreshKey: number }) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const today = localDate(now);
    // Through the end of the seventh day, local time
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + DAYS);
    listUpcomingEventsAction(now.toISOString(), end.toISOString())
      .then((result) => {
        if (cancelled) return;
        setStatus(
          "error" in result
            ? { kind: "error", message: result.error }
            : { kind: "ready", days: groupByDay(result.events, today) },
        );
      })
      // Offline, or the deployment changed under us: don't leave the skeleton spinning forever
      .catch(() => {
        if (!cancelled) setStatus({ kind: "error", message: "讀取行程失敗，請檢查網路後重新整理" });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section aria-labelledby="upcoming-title" className="flex min-w-0 flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="upcoming-title" className={labelRowClass}>
          <FieldLabel en="NEXT 7 DAYS">接下來 7 天</FieldLabel>
        </h2>
        <a
          href="https://calendar.google.com/"
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1.5 text-[13px] text-gold-ink underline underline-offset-4 hover:no-underline"
        >
          開啟 Google 日曆
          <ExternalIcon size={13} />
        </a>
      </div>

      {status.kind === "loading" && (
        <div aria-busy className="flex flex-col gap-3" aria-label="載入行程中">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-[18px] bg-beige/60" />
          ))}
        </div>
      )}

      {status.kind === "error" && <p className="text-sm text-[#9b2c1f]">{status.message}</p>}

      {status.kind === "ready" && status.days.length === 0 && (
        <p className="rounded-[18px] border-2 border-dashed border-beige px-4 py-5 text-center text-[15px] text-muted">
          接下來 7 天沒有行程
        </p>
      )}

      {status.kind === "ready" && status.days.length > 0 && (
        <ol className="flex flex-col gap-4">
          {status.days.map((day) => (
            <li key={day.date} className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2 px-1">
                <span className="text-[15px]">{day.label}</span>
                <span className="font-display text-[13px] font-bold tracking-wide text-muted">{day.sub}</span>
              </div>
              <ul className="flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(93,55,19,0.06)] lg:bg-cream lg:shadow-none">
                {day.events.map((event) => (
                  <li key={event.id} className="border-t border-beige first:border-t-0">
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-cream lg:hover:bg-beige/60"
                    >
                      <span
                        aria-hidden
                        className="h-9 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: event.color ?? "#9e9e9e" }}
                      />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-[15px]">{event.title}</span>
                        <span className="truncate font-display text-[13px] tracking-wide text-muted">
                          {timeText(event, day.date)}
                          {event.location && ` · ${event.location}`}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
