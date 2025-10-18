import MainLayout from "@/components/layout/MainLayout";
import { blogs } from "@/data/blogs";
import Image from "next/image";
import Link from "next/link";

export default function BlogsIndexPage() {
  return (
    <MainLayout>
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-3xl font-extrabold text-[#181818] mb-6">
            All Blogs
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((b) => (
              <Link key={b.slug} href={`/blog/${b.slug}`} className="group">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full flex flex-col">
                  <div className="relative h-[180px]">
                    <Image
                      src={b.coverImage}
                      alt={b.title}
                      fill
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="px-4 pt-3 pb-5 flex-1 flex flex-col">
                    <div className="text-[10px] text-gray-500 mb-1">
                      {b.author} | {b.date}
                    </div>
                    <div
                      className="font-semibold text-[#181818] mb-1 line-clamp-2"
                      title={b.title}
                    >
                      {b.title}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-3 mt-auto">
                      {b.excerpt}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
