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
    <div className="flex min-h-screen bg-[#F5F5F5]">
      {/* Left side - Image */}
      <div className="hidden w-1/2 bg-[#FF4B2B] lg:block">
        <div className="flex h-full items-center justify-center p-12">
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
            <h1 className="text-4xl font-bold text-[#1A1A1A]">
              Create Account
            </h1>
            <p className="mt-3 text-base text-[#666666]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#FF4B2B] hover:text-[#FF4B2B]/90"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                  >
                    First Name
                  </label>
                  <Input
                    {...register("first_name")}
                    type="text"
                    placeholder="Enter first name"
                    error={errors.first_name?.message}
                    className="h-14 text-base"
                  />
                </div>
                <div>
                  <label
                    htmlFor="last_name"
                    className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                  >
                    Last Name
                  </label>
                  <Input
                    {...register("last_name")}
                    type="text"
                    placeholder="Enter last name"
                    error={errors.last_name?.message}
                    className="h-14 text-base"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                >
                  Email
                </label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email"
                  error={errors.email?.message}
                  className="h-14 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                >
                  Password
                </label>
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Create a password"
                  error={errors.password?.message}
                  className="h-14 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="phone_number"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                >
                  Phone Number
                </label>
                <Input
                  {...register("phone_number")}
                  type="tel"
                  placeholder="Enter phone number"
                  error={errors.phone_number?.message}
                  className="h-14 text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="user_type"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                >
                  Account Type
                </label>
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
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                >
                  Address
                </label>
                <textarea
                  {...register("address")}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B2B] focus:border-transparent"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-14 w-full text-base font-semibold"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E5E5]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#F5F5F5] px-4 text-[#666666]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                className="h-14 w-full text-base font-medium"
                onClick={() => {}}
              >
                <Image
                  src="/google.svg"
                  alt="Google"
                  width={24}
                  height={24}
                  className="mr-3"
                />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-14 w-full text-base font-medium"
                onClick={() => {}}
              >
                <Image
                  src="/facebook.svg"
                  alt="Facebook"
                  width={24}
                  height={24}
                  className="mr-3"
                />
                Facebook
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
