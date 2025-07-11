import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, { message: "The username must contain at least 3 character(s)" })
  .max(20, { message: "The username must contain at most 20 character(s)" })
  .refine((val) => !/^\d/.test(val), {
    message: "The username cannot begin with a number",
  })
  .refine((val) => /^[A-Za-z0-9]+$/.test(val), {
    message: "The username may only contain letters and numbers",
  });

export const passwordSchema = z
  .string()
  .min(8, { message: "The password must contain at least 8 character(s)" })
  .max(40, {
    message: "The password must contain at most 40 character(s)",
  });

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});
