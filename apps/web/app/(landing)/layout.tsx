import { LocaleProvider } from "@/features/landing/i18n";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <LocaleProvider initialLocale="en">{children}</LocaleProvider>
    </div>
  );
}
