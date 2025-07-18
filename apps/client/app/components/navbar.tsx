import { Link, useFetcher } from "react-router";

type NavbarProps = {
  username?: string;
};

const Navbar: React.FC<NavbarProps> = ({ username }) => {
  const fetcher = useFetcher();

  return (
    <nav className="flex justify-between items-center px-[5px] py-[10px] relative bg-sky-500 h-9 text-white md:rounded-tl md:rounded-tr">
      <Link to="/">
        <div className="font-semibold text-3xl italic">DKK</div>
      </Link>
      {username ? (
        <ul className="flex space-x-8 ml-10 text-xl">
          <li>
            <Link to={`/${username}`} className="py-1 text-black">
              {username}
            </Link>
            {" | "}
            <fetcher.Form
              method="post"
              action="/logout"
              className="py-1 text-black inline"
            >
              <button className="cursor-pointer">log out</button>
            </fetcher.Form>
          </li>
        </ul>
      ) : null}
    </nav>
  );
};

export default Navbar;
