export type SlashCommand = {
  label: string;
  intent: string;
  description: string;
};
export const SLASH_COMANDS: SlashCommand[] = [
  {
    label: "explain",
    intent: "/explain-code",
    description: "Explain the selected code",
  },
  {
    label: "test",
    intent: "/generate-test-for-code",
    description: "Write tests for the selected code",
  },
  {
    label: "document",
    intent: "/document-code",
    description: "Add documentation for the selected code",
  },
  {
    label: "fix",
    intent: "/fix-code",
    description: "Find errors in the selected code and fix them",
  },
];
