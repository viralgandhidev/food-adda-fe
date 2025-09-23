import { ReactNode } from "react";
import { FiBox } from "react-icons/fi";

interface CategoryPillProps {
  icon: ReactNode;
  title: string;
  productCount: number;
  onClick?: () => void;
}

export default function CategoryPill({
  icon,
  title,
  productCount,
  onClick,
}: CategoryPillProps) {
  return (
    <div
      className={`flex items-center bg-white border border-gray-200 rounded-full shadow-lg px-6 py-5 gap-5 w-full min-w-[320px] my-2 ${
        onClick ? "cursor-pointer hover:shadow-xl transition" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FFF7C2] text-[#F4D300] text-2xl">
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <span
          className="font-bold text-lg text-[#181818] leading-tight truncate overflow-hidden whitespace-nowrap max-w-[180px]"
          title={title}
        >
          {title}
        </span>
        <span className="inline-flex items-center gap-1 bg-[#F4D300] text-[#181818] font-semibold px-3 py-1 rounded-full text-xs w-fit mt-1 shadow-sm">
          <FiBox className="mr-1" size={16} />
          {productCount} Product{productCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
