"use client";

import { useActionState, useEffect, useState } from "react";
import { createEventAction, type CreateEventState } from "@/app/actions";
import type { CalendarSummary } from "@/lib/google-calendar";
import { CategoryPicker } from "./category-picker";
import { ArrowRightIcon, CheckIcon, ExternalIcon } from "./icons";
import { FieldLabel, inputBaseClass, inputClass, labelRowClass, pillClass, primaryButtonClass } from "./ui";

const timeInputClass = `${inputBaseClass} h-13 min-w-0 flex-1 border-beige px-2 text-center font-display text-lg`;

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

  const duration = startTime && endTime ? toMinutes(endTime) - toMinutes(startTime) : null;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 lg:gap-[26px] lg:rounded-[40px] lg:bg-white lg:px-14 lg:py-12 lg:shadow-[0_20px_50px_rgba(93,55,19,0.08)]"
    >
      <input type="hidden" name="timeZone" value={timeZone} />

      {/* A card of its own on mobile; on desktop the form itself is the card */}
      <div className="flex flex-col gap-[22px] rounded-[30px] bg-white px-5 pt-[26px] pb-7 shadow-[0_14px_36px_rgba(93,55,19,0.08)] lg:contents">
        <div className="flex flex-col gap-2 sm:gap-2.5">
          <label htmlFor="title" className={labelRowClass}>
            <FieldLabel en="TITLE">事件標題</FieldLabel>
          </label>
          <input
            id="title"
            name="title"
            required
            autoFocus
            placeholder="例如：跟客戶開會"
            className={`${inputBaseClass} h-14 border-gold px-4 text-[17px] ring-4 ring-cream lg:h-16 lg:rounded-[20px] lg:px-6 lg:text-xl`}
          />
        </div>

        <div className="grid gap-[22px] lg:grid-cols-2 lg:gap-6">
          <div className="flex flex-col gap-2 sm:gap-2.5">
            <label htmlFor="date" className={labelRowClass}>
              <FieldLabel en="DATE">日期</FieldLabel>
            </label>
            <div className="flex gap-2.5 lg:gap-3">
              <input
                id="date"
                type="date"
                name="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} min-w-0`}
              />
              <label className="flex h-13 shrink-0 cursor-pointer items-center gap-2 rounded-[18px] bg-cream px-4 text-[15px]">
                <input
                  type="checkbox"
                  name="allDay"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="size-[18px] accent-gold"
                />
                全天
              </label>
            </div>
          </div>

          {!allDay && (
            <div className="flex flex-col gap-2 sm:gap-2.5">
              <span className={labelRowClass}>
                <FieldLabel en="TIME">時間</FieldLabel>
              </span>
              <div className="flex items-center gap-2 lg:gap-2.5">
                <input
                  type="time"
                  name="startTime"
                  required
                  value={startTime}
                  onChange={(e) => changeStart(e.target.value)}
                  className={timeInputClass}
                  aria-label="開始時間"
                />
                <ArrowRightIcon size={18} className="shrink-0 text-gold-ink" />
                <input
                  type="time"
                  name="endTime"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={timeInputClass}
                  aria-label="結束時間"
                />
              </div>
            </div>
          )}
        </div>

        {!allDay && (
          <div className="-mt-2 grid grid-cols-3 gap-2 lg:flex lg:items-center lg:gap-2.5">
            <span className="hidden text-sm text-muted lg:mr-1 lg:inline">時長</span>
            {DURATIONS.map((d) => {
              const selected = duration === d.minutes;
              return (
                <button
                  key={d.minutes}
                  type="button"
                  aria-pressed={selected}
                  disabled={!startTime}
                  onClick={() => setEndTime(fromMinutes(toMinutes(startTime) + d.minutes))}
                  className={`${pillClass} disabled:opacity-40 ${
                    selected ? "border-brown bg-brown text-white" : "border-beige bg-white hover:bg-cream"
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid gap-[22px] lg:grid-cols-2 lg:gap-6">
          <div className="flex flex-col gap-2 sm:gap-2.5">
            <label htmlFor="location" className={labelRowClass}>
              <FieldLabel en="PLACE" optional>
                地點
              </FieldLabel>
            </label>
            <input id="location" name="location" placeholder="例如：台北市信義區" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2 sm:gap-2.5">
            <label htmlFor="description" className={labelRowClass}>
              <FieldLabel en="NOTE" optional>
                說明
              </FieldLabel>
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="補充說明或連結"
              rows={2}
              className={`${inputBaseClass} resize-none border-beige px-4 py-3 text-base lg:h-13`}
            />
          </div>
        </div>

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
      </div>

      <div aria-live="polite" className="empty:hidden">
        {state.status === "error" && (
          <p className="rounded-[20px] border-2 border-[#f2c4bd] bg-white px-5 py-4 text-[15px] text-[#9b2c1f]">
            {state.message}
          </p>
        )}
        {state.status === "success" && (
          <div className="flex items-center gap-4 rounded-[24px] bg-white px-5 py-4 lg:bg-cream">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-leaf text-leaf-ink">
              <CheckIcon size={22} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[17px]">{state.message}</span>
              <a
                href={state.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-gold-ink underline underline-offset-4 hover:no-underline"
              >
                在 Google 日曆中查看
                <ExternalIcon size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Stays pinned to the bottom of the screen on mobile so the form can be submitted without scrolling */}
      <div className="sticky bottom-0 -mx-4 bg-cream px-4 pt-4.5 pb-7 shadow-[0_-10px_24px_rgba(93,55,19,0.06)] lg:static lg:mx-0 lg:flex lg:justify-center lg:bg-transparent lg:p-0 lg:pt-1.5 lg:shadow-none">
        <button type="submit" disabled={pending} className={`${primaryButtonClass} lg:max-w-[420px]`}>
          <span>{pending ? "新增中…" : "新增到 Google 日曆"}</span>
          <ArrowRightIcon size={22} />
        </button>
      </div>
    </form>
  );
}
