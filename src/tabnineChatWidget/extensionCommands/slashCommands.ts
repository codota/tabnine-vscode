export type SlashCommand = {
  label: string;
  intent: string;
  description: string;
};
export const SLASH_COMANDS: SlashCommand[] = [
  {
    label: "$(feedback) explain",
    intent: "/explain-code",
    description: "Explain the selected code",
  },
  {
    label: "$(beaker) test",
    intent: "/generate-test-for-code",
    description: "Write tests for the selected code",
  },
  {
    label: "$(checklist) document",
    intent: "/document-code",
    description: "Add documentation for the selected code",
  },
  {
    label: "$(symbol-property) fix",
    intent: "/fix-code",
    description: "Find errors in the selected code and fix them",
  },
  {
    label: "$(search) workspace",
    intent: "/workspace",
    description:
      "Ask a question related to any code within your current workspace",
  },
];
