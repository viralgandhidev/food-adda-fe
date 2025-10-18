"use client";

import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PrivacyPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/privacy.md", { cache: "no-store" });
        const text = await res.text();
        setContent(text);
      } catch {
        setContent("## Privacy Policy\n\nContent unavailable.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <MainLayout>
      <section className="max-w-[1000px] mx-auto px-6 md:px-8 py-12">
        <h1 className="text-3xl font-extrabold text-[#181818] mb-6">
          Privacy Policy
        </h1>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="max-w-none break-words whitespace-pre-wrap">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-3xl md:text-4xl font-extrabold text-[#181818]"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-2xl font-extrabold text-[#181818]"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-bold text-[#181818]" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="text-[15px] leading-7 text-gray-700 my-0"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="text-[#181818] font-semibold" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-[#F4D300] underline"
                    target="_blank"
                    rel="noreferrer"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc pl-6 my-0 space-y-0" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal pl-6 my-0 space-y-0" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="leading-7 text-gray-700 my-0" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-gray-200 pl-4 text-gray-600 italic my-0"
                    {...props}
                  />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
