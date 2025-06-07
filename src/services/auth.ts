import { api } from "@/lib/api";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  phone_number: z.string().optional(),
  user_type: z.enum(["CONSUMER", "SELLER"]),
  address: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export const authService = {
  login: async (data: LoginInput) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  signup: async (data: SignupInput) => {
    const response = await api.post("/auth/signup", data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (data: Partial<SignupInput>) => {
    const response = await api.put("/auth/me", data);
    return response.data;
  },
};
