import { cookies, headers } from "next/headers";
import { LocaleProvider } from "@/features/landing/i18n";
import type { Locale } from "@/features/landing/i18n";

async function getInitialLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const stored = cookieStore.get("multica-locale")?.value;
  if (stored === "en" || stored === "zh") return stored;

  const headersList = await headers();
  const acceptLang = headersList.get("accept-language") ?? "";
  if (acceptLang.includes("zh")) return "zh";

  return "en";
}

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLocale = await getInitialLocale();

  return (
    <div className="h-full overflow-y-auto">
      <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
    </div>
  );
}
