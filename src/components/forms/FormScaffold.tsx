import React from "react";

type FormScaffoldProps = {
  title: string; // Big title: e.g., B2B
  subtitle?: string; // Small above title: e.g., Subscribe
  description?: string; // Small text below title
  children: React.ReactNode;
  sectionTitle?: string;
  onSubmit?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  showTerms?: boolean;
  agreed?: boolean;
  onToggleTerms?: (checked: boolean) => void;
};

export function FormScaffold({
  title,
  subtitle = "Subscribe",
  description = "Please fill out this form to subscribe with us.",
  children,
  onSubmit,
  submitting,
  submitLabel = "Submit",
  showTerms,
  agreed,
  onToggleTerms,
  sectionTitle = "Company Details",
}: FormScaffoldProps) {
  return (
    <div className="min-h-screen bg-[#FFFEF7] flex items-start justify-center py-16">
      <div className="w-full max-w-5xl">
        <h2 className="text-[13px] font-medium text-[#6B7280] tracking-wide">
          {subtitle}
        </h2>
        <h1 className="mt-1 text-[40px] leading-tight font-extrabold text-[#181818]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-[#6B7280]">{description}</p>
        ) : null}

        <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-8 mt-10">
          <h3 className="text-[15px] font-semibold text-[#111827] mb-5">
            {sectionTitle}
          </h3>
          {children}

          <div className="mt-8 flex items-center justify-between">
            {showTerms ? (
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                  checked={!!agreed}
                  onChange={(e) =>
                    onToggleTerms && onToggleTerms(e.target.checked)
                  }
                />
                <span>I read & agreed to the terms and conditions</span>
              </label>
            ) : (
              <span />
            )}

            {onSubmit && (
              <button
                onClick={onSubmit}
                disabled={!!submitting || (showTerms && !agreed)}
                className="inline-flex items-center justify-center rounded-full bg-[#F4D300] px-7 py-2.5 text-[15px] font-semibold text-[#181818] shadow-sm hover:bg-yellow-400 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : submitLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12px] font-semibold text-[#374151]">{children}</span>
  );
}

export function FieldWrapper({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </label>
  );
}

export const inputBaseClass =
  "h-11 rounded-xl border border-gray-200 px-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-300";
