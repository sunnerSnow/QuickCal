import type { NewEvent } from "./google-calendar";

export type EventFormInput = {
  title: string;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timeZone: string;
  location: string;
  description: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Turns the quick-add form into a Calendar API event, or returns an error message. */
export function buildEvent(input: EventFormInput): { event: NewEvent } | { error: string } {
  const title = input.title.trim();
  if (!title) return { error: "請輸入事件標題" };
  if (!DATE_RE.test(input.date)) return { error: "請選擇日期" };

  const optional = {
    ...(input.location.trim() && { location: input.location.trim() }),
    ...(input.description.trim() && { description: input.description.trim() }),
  };

  if (input.allDay) {
    // All-day end date is exclusive in the Calendar API
    return {
      event: { summary: title, start: { date: input.date }, end: { date: addDays(input.date, 1) }, ...optional },
    };
  }

  if (!TIME_RE.test(input.startTime) || !TIME_RE.test(input.endTime)) {
    return { error: "請填寫開始與結束時間" };
  }
  if (input.startTime === input.endTime) return { error: "結束時間不能和開始時間相同" };

  // An end time earlier than the start means the event runs past midnight
  const endDate = input.endTime < input.startTime ? addDays(input.date, 1) : input.date;
  const timeZone = input.timeZone || "Asia/Taipei";

  return {
    event: {
      summary: title,
      start: { dateTime: `${input.date}T${input.startTime}:00`, timeZone },
      end: { dateTime: `${endDate}T${input.endTime}:00`, timeZone },
      ...optional,
    },
  };
}
