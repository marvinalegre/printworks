import { Link, useNavigation } from "react-router";
import type { Route } from "./+types/home";
import classNames from "classnames";

import PriceGrid from "../components/price-grid";
import Navbar from "~/components/navbar";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Printworks" }];
}

export async function clientLoader() {
  const res = await fetch("/api/auth/me");
  if (res.status === 200) {
    const { username } = await res.json();
    return { username };
  }
  return { username: null };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { username } = loaderData;
  const navigation = useNavigation();

  return (
    <>
      <Navbar username={username} />

      <div
        className={classNames({
          "opacity-25 transition-opacity duration-200 delay-200":
            navigation.state === "loading",
        })}
      >
        <div className="max-w-72 mx-auto">
          <img src="/dkk-logo.svg" className="my-5 mx-auto" />
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            to="/order"
            tabIndex={1}
            className="mt-10 px-6 py-3 bg-green-500 text-white text-lg font-bold rounded-md shadow-lg hover:bg-green-600 transition duration-300 ease-in-out"
          >
            Start Order
          </Link>
        </div>

        <PriceGrid />

        <div className="my-10 mx-auto max-w-xl px-4 py-8">
          <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
            Our Location
          </h2>
          <div className="min-w-full table-auto border-collapse border border-gray-200">
            <iframe
              className="w-full border-2 border-white"
              height="350"
              src="https://www.openstreetmap.org/export/embed.html?bbox=120.3809013962746%2C17.573594692696744%2C120.3847208619118%2C17.576215629558963&amp;layer=mapnik&amp;marker=17.574906444380407%2C120.38281112909317"
            ></iframe>
            <a href="https://www.openstreetmap.org/?mlat=17.574906&amp;mlon=120.382811#map=19/17.574905/120.382811">
              View Larger Map
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
