"use client";

import { useState } from "react";
import type { CalendarSummary } from "@/lib/google-calendar";
import { QuickAddForm } from "./quick-add-form";
import { SectionTitle } from "./ui";
import { UpcomingEvents } from "./upcoming-events";

/** Signed-in home: the quick-add form plus the next seven days, which reload after each new event. */
export function QuickAddView({ calendars }: { calendars: CalendarSummary[] }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    // relative: keeps the title above the decorative circle, which reaches it on ~430px phones
    // Desktop: title and upcoming list stack in the left column, the form spans both rows on the right
    <main className="relative mx-auto grid w-full max-w-[1440px] flex-1 content-start gap-6 px-4 pt-5 pb-8 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-x-20 lg:gap-y-10 lg:px-20 lg:pt-10 lg:pb-20">
      <section className="flex flex-col gap-7 lg:pt-10">
        <SectionTitle en="Quick Add">快速新增事件</SectionTitle>
        <p className="hidden text-[17px] leading-[1.9] text-muted lg:block">
          填好標題與時間，
          <br />
          一鍵就能把行程放進你的 Google 日曆。
        </p>
      </section>
      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <QuickAddForm calendars={calendars} onCreated={() => setRefreshKey((k) => k + 1)} />
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">
        <UpcomingEvents refreshKey={refreshKey} />
      </div>
    </main>
  );
}
