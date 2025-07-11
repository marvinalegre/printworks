import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
} from "react-router";
import { useState } from "react";
import zxcvbn from "zxcvbn";
import type { Route } from "./+types/login";
import { registerSchema } from "@printworks/validation";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Printworks | Register" }];
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = Object.fromEntries(await request.formData());

  try {
    registerSchema.parse(formData);
  } catch (e) {
    return { errMessage: e.errors[0].message };
  }

  const zxcvbnResult = zxcvbn(formData.password);
  if (zxcvbnResult.score < 3) {
    let message = "The password is weak.";
    if (zxcvbnResult.feedback.warning) {
      message = `${message} ${zxcvbnResult.feedback.warning}.`;
    } else if (zxcvbnResult.feedback.suggestions.length > 0) {
      message = `${message} ${zxcvbnResult.feedback.suggestions[0]}`;
    }
    return { errMessage: message };
  }

  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (res.status === 201) {
    return redirect("/");
  } else if (res.status === 409) {
    return { errMessage: "This username is unavailable." };
  } else {
    return { errMessage: "Something went wrong. Please try again later." };
  }
}

export async function clientLoader() {
  const res = await fetch("/api/auth/me");
  if (res.status === 200) {
    return redirect("/");
  }
  return null;
}

export default function Register() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const [passwordType, setPasswordType] = useState("password");

  return (
    <>
      <nav className="flex justify-between items-center px-[5px] py-[10px] relative bg-sky-500 h-9 text-white md:rounded-tl md:rounded-tr">
        <Link to="/">
          <div className="font-semibold text-3xl italic">DKK</div>
        </Link>
      </nav>

      <div className="p-2 md:p-8 mt-[15vh] md:mt-[10vh]">
        <Form
          method="post"
          className="px-4 py-8 max-w-sm mx-auto bg-form-gray rounded-lg space-y-4 md:p-8"
        >
          {actionData && navigation.state === "idle" ? (
            <p className="p-4 text-lg">{actionData.errMessage}</p>
          ) : null}
          <input
            autoFocus
            autoComplete="off"
            name="username"
            required
            placeholder="username"
            className="w-full p-2 placeholder-gray-500 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            id="password"
            name="password"
            type={passwordType}
            required
            placeholder="password"
            className="w-full p-2 placeholder-gray-500 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            onClick={() => {
              if (passwordType === "password") {
                setPasswordType("text");
              } else {
                setPasswordType("password");
              }
            }}
            className="focus:outline-none focus:ring-2 focus:ring-black"
            type="checkbox"
            id="show-password"
          />{" "}
          <label
            className="text-gray-600 text-sm mt-4 cursor-pointer"
            htmlFor="show-password"
          >
            show password
          </label>
          <div className="mt-4 space-x-6 text-right">
            <button
              type="submit"
              className="rounded bg-sky-500 px-4 py-2 text-xl font-bold text-white hover:bg-sky-600 w-full disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black"
              disabled={navigation.state === "submitting"}
            >
              register
            </button>
          </div>
          <p className="mt-12 text-gray-600">
            Already have an account?{" "}
            <Link className="underline" to="/login">
              Log in here.
            </Link>
          </p>
        </Form>
      </div>
    </>
  );
}
