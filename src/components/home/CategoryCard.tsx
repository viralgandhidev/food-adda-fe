import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  id: string;
  name: string;
  imageUrl: string;
  productCount: number;
}

const DEFAULT_CATEGORY_IMAGE = "/images/default-category.jpg";

export default function CategoryCard({
  id,
  name,
  imageUrl,
  productCount,
}: CategoryCardProps) {
  return (
    <Link href={`/category/${id}`} className="group">
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
        <Image
          src={imageUrl || DEFAULT_CATEGORY_IMAGE}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm opacity-90">{productCount} items</p>
        </div>
      </div>
    </Link>
  );
}
