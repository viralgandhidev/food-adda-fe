"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signupSchema, type SignupInput } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    try {
      const response = await authService.signup(data);
      setAuth(response.user, response.token);
      router.push("/");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="hidden w-1/2 bg-[#1C1A1A] lg:block">
        <div className="flex h-full items-center justify-center">
          <Image
            src="/auth-image.png"
            alt="Food Adda"
            width={600}
            height={600}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1C1A1A]">
              Create Account
            </h1>
            <p className="text-sm text-[#8A8A8A]">
              Enter your details to create your FoodAdda account
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register("first_name")}
                  type="text"
                  placeholder="First name"
                  error={errors.first_name?.message}
                  className="h-14 text-base"
                />
                <Input
                  {...register("last_name")}
                  type="text"
                  placeholder="Last name"
                  error={errors.last_name?.message}
                  className="h-14 text-base"
                />
              </div>
              <Input
                {...register("email")}
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                className="h-14 text-base"
              />
              <Input
                {...register("password")}
                type="password"
                placeholder="Create a password"
                error={errors.password?.message}
                className="h-14 text-base"
              />
              <Input
                {...register("phone_number")}
                type="tel"
                placeholder="Phone number"
                error={errors.phone_number?.message}
                className="h-14 text-base"
              />
              <select
                {...register("user_type")}
                className="mt-1 block h-14 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B2B] focus:border-transparent"
              >
                <option value="">Select account type</option>
                <option value="CONSUMER">Consumer</option>
                <option value="SELLER">Seller</option>
              </select>
              {errors.user_type && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.user_type.message}
                </p>
              )}
              <textarea
                {...register("address")}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B2B] focus:border-transparent"
                placeholder="Address"
              />
            </div>
            <Button
              type="submit"
              className="w-full text-base font-semibold mt-8 bg-[#F4D300] rounded-3xl py-3 px-6 text-[#1C1A1A]"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          <p className="text-base text-[#666666] mt-8 text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#FF4B2B] hover:text-[#FF4B2B]/90"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
