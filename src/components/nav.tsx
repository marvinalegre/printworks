interface Link {
  name: string;
  href: string;
}

interface Props {
  links?: Link[];
}

export const Nav = ({ links }: Props) => {
  return (
    <nav class="container">
      <ul>
        <li>
          <a href="/">
            <strong>Printworks</strong>
          </a>
        </li>
      </ul>
      {links && (
        <ul>
          {links.map((l) => {
            if (l.name !== "log out") {
              return (
                <li>
                  <a href={l.href}>{l.name}</a>
                </li>
              );
            } else {
              return null;
            }
          })}
          {links.some((l) => l.name === "log out") && (
            <li>
              <a fx-action="/logout" fx-method="post">
                log out
              </a>
            </li>
          )}
        </ul>
      )}
    </nav>
  );
};
