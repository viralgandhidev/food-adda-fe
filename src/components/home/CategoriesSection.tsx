import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryPill from "./CategoryPill";
import { FiBox } from "react-icons/fi";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  productCount: number;
}

interface CategoriesSectionProps {
  categories: Category[];
  // When compact is true, render only the cards grid with no header/button/paddings
  compact?: boolean;
  className?: string;
}

export default function CategoriesSection({
  categories,
  compact = false,
  className = "",
}: CategoriesSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  // Sort and get top 9
  const topCategories = [...categories]
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 9);

  const Grid = (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6 place-items-center ${className}`}
    >
      {topCategories.map((cat) => (
        <CategoryPill
          key={cat.id}
          icon={cat.icon}
          title={cat.name}
          productCount={cat.productCount}
          onClick={() =>
            router.push(`/products-list?page=1&categoryId=${cat.id}`)
          }
        />
      ))}
    </div>
  );

  if (compact) {
    return Grid;
  }

  return (
    <section className="p-16 mb-12">
      <div className="mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <h2 className="text-3xl font-bold text-[#181818]">
          Explore our wide range of categories
        </h2>
        <button
          className="bg-[#F4D300] text-[#181818] font-semibold px-7 py-2 rounded-full shadow hover:bg-yellow-400 transition text-lg w-fit"
          onClick={() => setShowModal(true)}
        >
          View all categories
        </button>
      </div>
      {Grid}
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative max-h-[80vh] flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-8 py-5 border-b border-gray-200 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-[#181818]">
                All Categories
              </h3>
              <button
                className="text-2xl text-[#181818] hover:text-[#F4D300] ml-4"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            {/* List */}
            <div className="overflow-y-auto px-2 py-4 flex-1">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors rounded-lg hover:bg-gray-50 cursor-pointer ${
                    idx !== categories.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                  onClick={() => {
                    setShowModal(false);
                    router.push(`/products-list?page=1&categoryId=${cat.id}`);
                  }}
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF7C2] text-[#F4D300] text-xl shrink-0">
                    {cat.icon}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span
                      className="font-semibold text-base text-[#181818] leading-tight truncate overflow-hidden whitespace-nowrap max-w-[180px]"
                      title={cat.name}
                    >
                      {cat.name}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#F4D300] text-[#181818] font-semibold px-3 py-1 rounded-full text-xs w-fit mt-1 shadow-sm">
                      <FiBox className="mr-1" size={16} />
                      {cat.productCount} Product
                      {cat.productCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
