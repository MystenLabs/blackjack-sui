import * as z from "zod";

export const LoginFormSchema = z.object({
  username: z.string().min(5).max(50),
  password: z.string().min(1, "Password is required"),
});
