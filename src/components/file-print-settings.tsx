interface Props {
  filename: string;
}

export const FilePrintSettings = ({ filename }: Props) => (
  <article>{filename}</article>
);
