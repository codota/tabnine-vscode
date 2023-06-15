import { ReactComponent as SearchGlobalIcon } from "../assets/search-global.svg";
import { ReactComponent as SearchRepoIcon } from "../assets/search-repo.svg";

export type Intent =
  | "explain-selected-code"
  | "test-this-code"
  | "document-code"
  | "fix-code";

type SlashCommand = {
  intent: Intent;
  description: string;
  icon: JSX.Element;
  prompt?: string;
};

export const slashCommands: SlashCommand[] = [
  {
    intent: "explain-selected-code",
    description: "Explain the selected code",
    icon: <SearchRepoIcon />,
    prompt: "Explain the selected code",
  },
  {
    intent: "test-this-code",
    description: "Write tests for the selected code",
    icon: <SearchGlobalIcon />,
    prompt: "Write tests for the selected code",
  },
  {
    intent: "document-code",
    description: "Add documentation for the selected code",
    icon: <SearchRepoIcon />,
    prompt: "Add documentation for the selected code",
  },
  {
    intent: "fix-code",
    description: "Find errors in the selected code and fix them",
    icon: <SearchGlobalIcon />,
    prompt: "Find errors in the selected code and fix them",
  },
];

export function extractCommandFromText(
  userText: string
): { slashCommand: SlashCommand | undefined; remainingText: string } {
  const slashCommand = slashCommands.find(({ intent }) =>
    userText.startsWith(`/${intent}`)
  );
  let remainingText = "";

  // If a command is found, subtract its length from the user text to get the remaining text.
  if (slashCommand) {
    remainingText = userText.slice(slashCommand.intent.length + 1).trim(); // +1 is for the '/' at the start of the intent
  }

  return { slashCommand: slashCommand, remainingText };
}
