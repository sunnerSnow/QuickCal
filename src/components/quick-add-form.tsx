"use client";

import { useActionState, useEffect, useState } from "react";
import { createEventAction, type CreateEventState } from "@/app/actions";
import type { CalendarSummary } from "@/lib/google-calendar";
import { CategoryPicker } from "./category-picker";

const LAST_CALENDAR_KEY = "quickcal:lastCalendarId";
const DURATIONS = [
  { label: "30 分", minutes: 30 },
  { label: "1 小時", minutes: 60 },
  { label: "2 小時", minutes: 120 },
];

const pad = (n: number) => String(n).padStart(2, "0");
const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (total: number) => {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
};

const inputClass =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/20";

export function QuickAddForm({ calendars }: { calendars: CalendarSummary[] }) {
  const [state, formAction, pending] = useActionState<CreateEventState, FormData>(createEventAction, {
    status: "idle",
  });
  const [calendarList, setCalendarList] = useState(calendars);
  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? "primary");
  const [allDay, setAllDay] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeZone, setTimeZone] = useState("");

  // Defaults depend on the browser's clock and time zone, so set them after mount
  useEffect(() => {
    const now = new Date();
    const nextHour = now.getHours() + 1;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextHour);
    /* eslint-disable react-hooks/set-state-in-effect */
    setDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`);
    setStartTime(fromMinutes(nextHour * 60));
    setEndTime(fromMinutes(nextHour * 60 + 60));
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    try {
      const saved = localStorage.getItem(LAST_CALENDAR_KEY);
      if (saved && calendars.some((c) => c.id === saved)) setCalendarId(saved);
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [calendars]);

  function changeStart(value: string) {
    // Keep the current duration when the start time moves
    if (startTime && endTime && value) {
      setEndTime(fromMinutes(toMinutes(value) + toMinutes(endTime) - toMinutes(startTime)));
    }
    setStartTime(value);
  }

  function changeCalendar(value: string) {
    setCalendarId(value);
    try {
      localStorage.setItem(LAST_CALENDAR_KEY, value);
    } catch {}
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="timeZone" value={timeZone} />

      <input
        name="title"
        required
        autoFocus
        placeholder="事件標題，例如：跟客戶開會"
        className={`${inputClass} text-lg`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <input
          type="date"
          name="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="size-4"
          />
          全天
        </label>
      </div>

      {!allDay && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="time"
              name="startTime"
              required
              value={startTime}
              onChange={(e) => changeStart(e.target.value)}
              className={inputClass}
              aria-label="開始時間"
            />
            <span className="text-black/50 dark:text-white/50">→</span>
            <input
              type="time"
              name="endTime"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
              aria-label="結束時間"
            />
          </div>
          <div className="flex gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.minutes}
                type="button"
                disabled={!startTime}
                onClick={() => setEndTime(fromMinutes(toMinutes(startTime) + d.minutes))}
                className="rounded-full border border-black/15 px-3 py-1 text-sm hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <input name="location" placeholder="地點（選填）" className={inputClass} />
      <textarea name="description" placeholder="說明（選填）" rows={2} className={inputClass} />

      <CategoryPicker
        calendars={calendarList}
        value={calendarId}
        timeZone={timeZone}
        onChange={changeCalendar}
        onCreated={(calendar) => {
          setCalendarList((list) => [...list, calendar]);
          changeCalendar(calendar.id);
        }}
      />

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "新增中…" : "新增到 Google 日曆"}
      </button>

      <div aria-live="polite">
        {state.status === "error" && <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>}
        {state.status === "success" && (
          <p className="text-sm text-green-700 dark:text-green-400">
            {state.message}・
            <a href={state.link} target="_blank" rel="noreferrer" className="underline">
              在 Google 日曆中查看
            </a>
          </p>
        )}
      </div>
    </form>
  );
}
