import { z } from "zod";
import { ROLES } from "@/lib/auth/permissions";

export const PASSWORD_MIN = 10;

const email = z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid email address"));

export const loginInput = z.object({
  email: z.string().trim().min(1, "Enter your email").max(200),
  password: z.string().min(1, "Enter your password").max(200),
});

export const userInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email,
  role: z.enum(ROLES, "Pick a role"),
});

export const userUpdateInput = userInput.extend({
  active: z.boolean(),
});

export const passwordChangeInput = z
  .object({
    current: z.string().min(1, "Enter your current password").max(200),
    next: z.string().min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`).max(200),
    confirm: z.string().max(200),
  })
  .refine((v) => v.next === v.confirm, { message: "The passwords don't match", path: ["confirm"] })
  .refine((v) => v.next !== v.current, { message: "Choose a password different from the current one", path: ["next"] });

export type UserInput = z.infer<typeof userInput>;
