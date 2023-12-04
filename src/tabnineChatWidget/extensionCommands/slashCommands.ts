type SCOPE = "block" | "selection" | "none";
export type SlashCommand = {
  label: string;
  intent: string;
  description: string;
  scope: SCOPE[];
  multistep: boolean;
};

export const SLASH_COMANDS: SlashCommand[] = [
  {
    label: "$(feedback) explain",
    intent: "/explain-code",
    description: "Explain the selected code",
    scope: ["selection", "block"],
    multistep: false,
  },
  {
    label: "$(beaker) test",
    intent: "/generate-test-for-code",
    description: "Write tests for the selected code",
    scope: ["block"],
    multistep: false,
  },
  {
    label: "$(checklist) document",
    intent: "/document-code",
    description: "Add documentation for the selected code",
    scope: ["block"],
    multistep: false,
  },
  {
    label: "$(symbol-property) fix",
    intent: "/fix-code",
    description: "Find errors in the selected code and fix them",
    scope: ["block"],
    multistep: false,
  },
  {
    label: "$(search) workspace",
    intent: "/workspace",
    description:
      "Ask a question related to any code within your current workspace",
    scope: ["none"],
    multistep: true,
  },
];
