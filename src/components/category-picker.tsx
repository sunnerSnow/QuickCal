"use client";

import { useState, useTransition } from "react";
import { createCalendarAction } from "@/app/actions";
import type { CalendarSummary } from "@/lib/google-calendar";

type Props = {
  calendars: CalendarSummary[];
  value: string;
  timeZone: string;
  onChange: (id: string) => void;
  onCreated: (calendar: CalendarSummary) => void;
};

/** Pick which Google calendar ("category") the event goes into, or create a new one. */
export function CategoryPicker({ calendars, value, timeZone, onChange, onCreated }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function create() {
    setError("");
    startTransition(async () => {
      const result = await createCalendarAction(name, timeZone);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onCreated(result.calendar);
      setName("");
      setAdding(false);
    });
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm text-black/60 dark:text-white/60">分類</legend>
      <div className="flex flex-wrap gap-2">
        {calendars.map((c) => {
          const selected = c.id === value;
          return (
            <label
              key={c.id}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                selected
                  ? "border-blue-600 bg-blue-600/10 font-medium"
                  : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              }`}
            >
              <input
                type="radio"
                name="calendarId"
                value={c.id}
                checked={selected}
                onChange={() => onChange(c.id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-sm"
                style={{ backgroundColor: c.backgroundColor ?? "#9e9e9e" }}
              />
              {c.summary}
            </label>
          );
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-black/30 px-3 py-1.5 text-sm text-black/70 hover:bg-black/5 dark:border-white/30 dark:text-white/70 dark:hover:bg-white/10"
          >
            ＋ 新增分類
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // Enter would otherwise submit the event form
              if (e.key === "Enter") {
                e.preventDefault();
                if (name.trim()) create();
              }
              if (e.key === "Escape") setAdding(false);
            }}
            autoFocus
            maxLength={100}
            placeholder="新分類名稱，例如：健身"
            aria-label="新分類名稱"
            className="min-w-0 flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-white/20"
          />
          <button
            type="button"
            onClick={create}
            disabled={pending || !name.trim()}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "建立中…" : "建立"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setError("");
            }}
            className="px-2 text-sm text-black/60 hover:underline dark:text-white/60"
          >
            取消
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </fieldset>
  );
}
