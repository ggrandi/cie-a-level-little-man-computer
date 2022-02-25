import { toBaseNString } from "./utils";

const repository = `ggrandi/cie-a-level-little-man-computer`;

interface IssueParams {
  title: string;
  body: string;
  labels: string;
}

const urlEscape = (s: string): string =>
  s.replaceAll(/[^\w]/g, (char) => `%${toBaseNString(char.charCodeAt(0), 16, 2)}`);

const createIssue = ({ body, title, labels }: IssueParams): void => {
  const url = new URL(
    `https://github.com/${repository}/issues/new?title=${urlEscape(title)}&body=${urlEscape(
      body
    )}&labels=${urlEscape(labels)}`
  );

  const anchor = document.createElement("a");
  anchor.setAttribute("href", url.href);
  anchor.setAttribute("target", "_blank");
  anchor.setAttribute("rel", "noopener noreferrer");

  anchor.click();
};

export const suggestExample = (title: string, example: string): void => {
  createIssue({
    title: `New Example: ${title}`,
    labels: "enhancement",
    body: `Here is the example I want to suggest:\n\n\`\`\`plaintext\n${example}\n\`\`\``,
  });
};
