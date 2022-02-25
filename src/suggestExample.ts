const repository = `ggrandi/cie-a-level-little-man-computer`;

interface IssueParams {
  title: string;
  body: string;
  labels: string;
}

const createIssue = ({ body, title, labels }: IssueParams): void => {
  const url = new URL(
    `https://github.com/${repository}/issues/new?title=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent(labels)}`
  );

  open(url, "_blank", "noopener noreferrer");
};

export const suggestExample = (title: string, example: string): void => {
  createIssue({
    title: `New Example: ${title}`,
    labels: "enhancement",
    body: `Here is the example I want to suggest:\n\n\`\`\`plaintext\n${example}\n\`\`\``,
  });
};
