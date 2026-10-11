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
          {links.map((l) => (
            <li>
              <a href={l.href}>{l.name}</a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
};
