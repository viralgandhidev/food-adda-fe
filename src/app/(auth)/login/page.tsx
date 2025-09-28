"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { loginSchema, type LoginInput } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AxiosError } from "axios";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loginError, setLoginError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setLoginError("");
      const response = await authService.login(data);
      // Store token in localStorage for API requests
      localStorage.setItem("token", response.token);
      // Update auth store
      setAuth(response.user, response.token);
      router.replace("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          setLoginError("Invalid email or password");
        } else if (error.response?.status === 500) {
          setLoginError("Something went wrong. Please try again later.");
        } else {
          setLoginError(
            error.response?.data?.message || "An error occurred during login"
          );
        }
      } else {
        setLoginError("An unexpected error occurred. Please try again.");
      }
      return;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="hidden w-1/2 bg-[#1C1A1A] lg:block">
        <div className="flex h-full items-center justify-center">
          <Image
            src="/auth-img.jpg"
            alt="Food Adda"
            width={600}
            height={600}
            className="object-contain"
            priority
            onError={(e) => {
              console.error("Image failed to load:", e);
            }}
            quality={100}
          />
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1C1A1A]">Welcome Back!</h1>
            <p className="text-sm text-[#8A8A8A]">
              Enter your email id & password to log in to your FoodAdda account
            </p>
          </div>

          {loginError && (
            <div className="rounded-md bg-red-50 p-4 mb-3">
              <p className="text-sm text-red-600">{loginError}</p>
            </div>
          )}

          <form
            className="space-y-8"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
          >
            <div className="space-y-3">
              <div>
                {/* <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                >
                  Email
                </label> */}
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email"
                  error={errors.email?.message}
                  className="h-14 text-base"
                />
              </div>

              <div>
                {/* <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#1A1A1A]"
                >
                  Password
                </label> */}
                <Input
                  {...register("password")}
                  type="password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  className="h-14 text-base"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-[#FF4B2B] focus:ring-[#FF4B2B]"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-[#666666]"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-medium text-[#FF4B2B] hover:text-[#FF4B2B]/90"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full text-base font-semibold mt-8 bg-[#F4D300] rounded-3xl py-3 px-6 text-[#1C1A1A]"
                  isLoading={isSubmitting}
                >
                  Log in
                </Button>

                <p className="text-base text-[#666666]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-semibold text-[#FF4B2B] hover:text-[#FF4B2B]/90"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>

            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E5E5]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#F5F5F5] px-4 text-[#666666]">
                  Or continue with
                </span>
              </div>
            </div> */}

            {/* <div className="grid grid-cols-2 gap-4">
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
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
