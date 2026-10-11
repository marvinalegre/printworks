import { z } from "zod";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

const options = {
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations,
};
const zxcvbn = new ZxcvbnFactory(options);

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long")
  .max(30, "Username must be at most 30 characters long")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores",
  )
  .refine((val) => !/^[0-9]/.test(val), {
    message: "Username cannot start with a number",
  });

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .max(128, "Password must be at most 128 characters long")
  .refine(
    (pw) => !/^\s|\s$/.test(pw),
    "Password cannot start or end with a space.",
  )
  .superRefine((password, ctx) => {
    const result = zxcvbn.check(password);

    if (result.score < 3) {
      if (result.feedback.warning) {
        ctx.addIssue({
          code: "custom",
          message: result.feedback.warning,
        });
      }

      for (const suggestion of result.feedback.suggestions) {
        ctx.addIssue({
          code: "custom",
          message: suggestion,
        });
      }
    }
  });

export const signupSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
  })
  .superRefine((data, ctx) => {
    const username = data.username.toLowerCase();
    const password = data.password.toLowerCase();

    if (username.length > 0 && password.includes(username)) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password cannot contain your username.",
      });
    }
  });
