import { auth } from "@/auth";
import { signInWithGoogle, signOutAction } from "@/app/actions";
import { QuickAddForm } from "@/components/quick-add-form";
import { isAuthError, listWritableCalendars, type CalendarSummary } from "@/lib/google-calendar";

const SIGN_IN_MESSAGES = {
  signedOut: "登入 Google 後，就能快速把事件加進你的日曆。",
  expired: "登入已過期，請重新登入。",
  missingScope: "QuickCal 需要日曆權限。請重新登入，並在 Google 同意畫面勾選所有日曆相關選項。",
  failed: "登入失敗，請再試一次。",
};

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

export default async function Home({ searchParams }: PageProps<"/">) {
  const [session, { error: signInError }] = await Promise.all([auth(), searchParams]);

  let content: React.ReactNode;
  if (!session?.accessToken) {
    content = <SignInPanel message={SIGN_IN_MESSAGES[signInError ? "failed" : "signedOut"]} />;
  } else if (session.error) {
    content = (
      <SignInPanel message={SIGN_IN_MESSAGES[session.error === "MissingScope" ? "missingScope" : "expired"]} />
    );
  } else {
    let calendars: CalendarSummary[] | null = null;
    try {
      calendars = (await listWritableCalendars(session.accessToken)).map((c) =>
        // Google shows the primary calendar under the owner's name, not its email-address id
        c.primary && session.user?.name ? { ...c, summary: session.user.name } : c,
      );
    } catch (error) {
      if (!isAuthError(error)) throw error;
    }
    content = calendars ? (
      <QuickAddForm calendars={calendars} />
    ) : (
      <SignInPanel message={SIGN_IN_MESSAGES.missingScope} />
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
