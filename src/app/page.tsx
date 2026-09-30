import { auth } from "@/auth";
import { signInWithGoogle, signOutAction } from "@/app/actions";
import { QuickAddForm } from "@/components/quick-add-form";
import { GoogleApiError, listWritableCalendars, type CalendarSummary } from "@/lib/google-calendar";

function SignInPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-black/70 dark:text-white/70">{message}</p>
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          使用 Google 帳號登入
        </button>
      </form>
    </div>
  );
}

export default async function Home() {
  const session = await auth();

  let content: React.ReactNode;
  if (!session?.accessToken) {
    content = <SignInPanel message="登入 Google 後，就能快速把事件加進你的日曆。" />;
  } else if (session.error) {
    content = <SignInPanel message="登入已過期，請重新登入。" />;
  } else {
    let calendars: CalendarSummary[] | null = null;
    try {
      calendars = await listWritableCalendars(session.accessToken);
    } catch (error) {
      if (!(error instanceof GoogleApiError && error.status === 401)) throw error;
    }
    content = calendars ? (
      <QuickAddForm calendars={calendars} />
    ) : (
      <SignInPanel message="無法讀取日曆，請重新登入並允許日曆權限。" />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">QuickCal</h1>
        {session?.user && (
          <form action={signOutAction} className="flex items-center gap-3 text-sm">
            <span className="truncate text-black/60 dark:text-white/60">{session.user.email}</span>
            <button type="submit" className="shrink-0 underline hover:no-underline">
              登出
            </button>
          </form>
        )}
      </header>
      <section className="rounded-2xl border border-black/10 p-5 shadow-sm dark:border-white/15">
        {content}
      </section>
    </main>
  );
}
