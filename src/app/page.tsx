import { auth } from "@/auth";
import { signInWithGoogle, signOutAction } from "@/app/actions";
import { QuickAddForm } from "@/components/quick-add-form";
import { ArrowRightIcon, CalendarCheckIcon, CheckIcon, InfoIcon, LogoutIcon } from "@/components/icons";
import { primaryButtonClass, SectionTitle } from "@/components/ui";
import { isAuthError, listWritableCalendars, type CalendarSummary } from "@/lib/google-calendar";

const SIGN_IN_MESSAGES = {
  expired: "登入已過期，請重新登入。",
  missingScope: "QuickCal 需要日曆權限。請重新登入，並在 Google 同意畫面勾選所有日曆相關選項。",
  failed: "登入失敗，請再試一次。",
};

const FEATURES = ["自動帶入下一個整點的時間", "依日曆顏色分類，也能新增分類", "記住你上次使用的日曆"];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 sm:gap-3.5">
      <span className="flex size-[38px] items-center justify-center rounded-full bg-gold sm:size-12">
        <CalendarCheckIcon className="size-5 sm:size-6" />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-display text-[22px] leading-none font-bold tracking-wide sm:text-[26px]">QuickCal</span>
        <span className="hidden text-[13px] text-muted sm:block">快速新增 Google 日曆事件</span>
      </span>
    </div>
  );
}

function CalendarIllustration() {
  return (
    <div className="relative flex h-[300px] items-center justify-center overflow-hidden rounded-[40px] bg-beige lg:h-[640px] lg:rounded-[60px]">
      <div className="absolute top-6 left-6 size-[70px] rounded-full bg-cream lg:top-15 lg:left-15 lg:size-30" />
      <div className="absolute right-7 bottom-7 size-11 rounded-full bg-leaf lg:right-18 lg:bottom-20 lg:size-18" />
      <div className="relative w-[210px] -rotate-4 overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(93,55,19,0.14)] lg:w-[340px] lg:rounded-[40px]">
        <div className="flex h-14 items-center justify-center bg-gold font-display text-lg font-bold tracking-[0.14em] lg:h-22 lg:text-2xl">
          QUICKCAL
        </div>
        <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-7 text-gold-ink lg:gap-5 lg:pt-10 lg:pb-12">
          <CalendarCheckIcon className="size-16 lg:size-24" strokeWidth={1.6} />
          <div className="flex w-full flex-col gap-2 lg:gap-3">
            <span className="h-2 w-full rounded-full bg-cream" />
            <span className="h-2 w-2/3 rounded-full bg-cream" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInView({ notice }: { notice?: string }) {
  return (
    <main className="mx-auto grid w-full max-w-[1440px] flex-1 gap-8 px-4 pb-9 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-20 lg:pb-20">
      <CalendarIllustration />
      <section className="flex max-w-[520px] flex-col gap-6 lg:gap-8">
        <div className="flex flex-col gap-3.5">
          <SectionTitle en="Welcome">三秒鐘，排好一個行程</SectionTitle>
          <p className="text-base leading-[1.8] text-muted lg:text-lg">登入 Google 後，就能快速把事件加進你的日曆。</p>
        </div>
        <ul className="hidden flex-col gap-3.5 text-[17px] lg:flex">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-white text-gold-ink">
                <CheckIcon size={16} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
        <form action={signInWithGoogle} className="lg:max-w-[420px]">
          <button type="submit" className={primaryButtonClass}>
            <span>使用 Google 帳號登入</span>
            <ArrowRightIcon size={22} />
          </button>
        </form>
        {notice && (
          <p
            role="alert"
            className="flex items-start gap-3.5 rounded-[20px] border-2 border-beige bg-white px-5 py-4 text-[15px] leading-[1.7]"
          >
            <InfoIcon size={22} className="mt-0.5 shrink-0 text-gold-ink" />
            {notice}
          </p>
        )}
      </section>
    </main>
  );
}

function QuickAddView({ calendars }: { calendars: CalendarSummary[] }) {
  return (
    <main className="mx-auto grid w-full max-w-[1440px] flex-1 gap-6 px-4 pt-5 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-20 lg:px-20 lg:pt-10 lg:pb-20">
      <section className="flex flex-col gap-7 lg:pt-10">
        <SectionTitle en="Quick Add">快速新增事件</SectionTitle>
        <p className="hidden text-[17px] leading-[1.9] text-muted lg:block">
          填好標題與時間，
          <br />
          一鍵就能把行程放進你的 Google 日曆。
        </p>
      </section>
      <QuickAddForm calendars={calendars} />
    </main>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const [session, { error: signInError }] = await Promise.all([auth(), searchParams]);

  let content: React.ReactNode;
  if (!session?.accessToken) {
    content = <SignInView notice={signInError ? SIGN_IN_MESSAGES.failed : undefined} />;
  } else if (session.error) {
    content = (
      <SignInView notice={SIGN_IN_MESSAGES[session.error === "MissingScope" ? "missingScope" : "expired"]} />
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
      <QuickAddView calendars={calendars} />
    ) : (
      <SignInView notice={SIGN_IN_MESSAGES.missingScope} />
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute -top-18 -right-22 size-60 rounded-full bg-beige lg:-top-35 lg:-right-30 lg:size-95" />
      <header className="relative mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between gap-4 px-4 lg:h-24 lg:px-20">
        <Logo />
        {session?.user && (
          <form action={signOutAction} className="flex min-w-0 items-center gap-4">
            <span className="hidden truncate text-[15px] text-muted sm:block">{session.user.email}</span>
            <button
              type="submit"
              aria-label="登出"
              className="flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-brown bg-white px-3 text-[15px] transition hover:bg-brown hover:text-white sm:px-5"
            >
              <LogoutIcon size={16} />
              <span className="hidden sm:inline">登出</span>
            </button>
          </form>
        )}
      </header>
      {content}
    </div>
  );
}
