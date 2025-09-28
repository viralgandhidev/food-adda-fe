"use client";

import { blogs } from "@/data/blogs";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function BlogDetail({ params }: { params: { slug: string } }) {
  const post = blogs.find((b) => b.slug === params.slug);
  if (!post) {
    return (
      <div className="px-6 md:px-12 py-16 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">Blog not found</h1>
        <Link href="/" className="text-[#F4D300] underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-[#FDFDFF]">
      {/* Hero */}
      <div className="relative h-[220px] md:h-[320px]">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow">
            {post.title}
          </h1>
          <div className="text-xs md:text-sm text-gray-200 mt-2">
            {post.author} • {post.date}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 md:px-12 -mt-10 md:-mt-14 relative z-10">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 md:p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-3xl md:text-4xl font-extrabold text-[#181818] mt-6 mb-3"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-2xl font-extrabold text-[#181818] mt-6 mb-2"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-xl font-bold text-[#181818] mt-5 mb-2"
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p
                  className="text-[15px] leading-7 text-gray-700 my-3"
                  {...props}
                />
              ),
              strong: ({ node, ...props }) => (
                <strong className="text-[#181818] font-semibold" {...props} />
              ),
              em: ({ node, ...props }) => <em className="italic" {...props} />,
              a: ({ node, ...props }) => (
                <a
                  className="text-[#F4D300] underline"
                  target="_blank"
                  rel="noreferrer"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-6 my-3 space-y-2" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-6 my-3 space-y-2" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="leading-7 text-gray-700" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-gray-200 pl-4 text-gray-600 italic my-4"
                  {...props}
                />
              ),
            }}
          >
            {post.body}
          </ReactMarkdown>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center px-5 py-2 rounded-full bg-[#F4D300] text-[#181818] font-semibold"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
