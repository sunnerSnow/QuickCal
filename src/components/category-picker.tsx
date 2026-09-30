"use client";

import { useState, useTransition } from "react";
import { createCalendarAction } from "@/app/actions";
import type { CalendarSummary } from "@/lib/google-calendar";
import { CheckIcon, PlusIcon } from "./icons";
import { FieldLabel, labelRowClass, pillClass } from "./ui";

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
    <fieldset className="flex flex-col gap-3">
      <legend className={`${labelRowClass} mb-2.5 sm:mb-3`}>
        <FieldLabel en="CATEGORY">分類</FieldLabel>
      </legend>
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {calendars.map((c) => {
          const selected = c.id === value;
          return (
            <label
              key={c.id}
              className={`${pillClass} cursor-pointer has-focus-visible:ring-4 has-focus-visible:ring-beige ${
                selected ? "border-gold bg-cream" : "border-beige bg-white hover:bg-cream"
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
                className="size-3 shrink-0 rounded-[4px]"
                style={{ backgroundColor: c.backgroundColor ?? "#9e9e9e" }}
              />
              {c.summary}
              {selected && <CheckIcon size={15} className="text-gold-ink" />}
            </label>
          );
        })}
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={`${pillClass} border-dashed border-gold bg-transparent hover:bg-cream`}
          >
            <PlusIcon size={16} />
            新增分類
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
            className="h-11 min-w-0 flex-1 rounded-full border-2 border-dashed border-gold bg-white px-4 text-[15px] text-brown outline-none placeholder:text-muted focus:border-solid focus:ring-4 focus:ring-cream"
          />
          <button
            type="button"
            onClick={create}
            disabled={pending || !name.trim()}
            className="h-11 shrink-0 rounded-full bg-brown px-[18px] text-[15px] text-white transition hover:bg-brown/85 disabled:opacity-50"
          >
            {pending ? "建立中…" : "建立"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setError("");
            }}
            className="h-11 shrink-0 px-2 text-[15px] text-muted hover:underline"
          >
            取消
          </button>
        </div>
      )}
      {error && <p className="text-sm text-[#9b2c1f]">{error}</p>}
    </fieldset>
  );
}
