import Image from "next/image";
import { FiSearch } from "react-icons/fi";

export default function HeroSection() {
  return (
    <section className="relative h-[665px] flex pt-36 px-16 bg-black">
      {/* Background Image */}
      <Image
        src="/images/hero-bg.jpg"
        alt="Hero Background"
        fill
        className="object-cover object-center opacity-70"
        priority
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Content */}
      <div className="relative z-10 max-w-3xl px-4 gap-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Your <span className="text-[#F4D300]">one-stop</span> platform for all
          food industry needs.
        </h1>
        <p className="text-[#D0D0D0] mb-14">
          From small businesses to large-scale enterprises, we empower food
          industry professionals & businesses with a network to source, connect,
          and grow.
        </p>
        <form className="flex max-w-2xl bg-white rounded-full shadow-lg overflow-hidden">
          <input
            type="text"
            placeholder="Search"
            className="flex-1 px-6 py-4 bg-transparent text-gray-500 placeholder-gray-400 focus:outline-none text-lg font-medium border-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-4 bg-[#FFD600] text-black font-bold text-lg rounded-r-full hover:bg-yellow-400 transition"
            style={{ minWidth: 120 }}
          >
            <FiSearch size={22} />
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
