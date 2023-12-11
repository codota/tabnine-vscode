type SCOPE = "block" | "selection" | "none";
export type Action = "test" | "fix" | "explain" | "document" | "workspace";
export type Intent =
  | "/generate-test-for-code"
  | "/fix-code"
  | "/explain-code"
  | "/document-code"
  | "/workspace";

enum LensOrder {
  test = 1,
  fix = 2,
  explain = 3,
  document = 4,
}

export type Command = {
  label: string;
  text: Action;
  intent: Intent;
  description: string;
  scope: SCOPE[];
  multistep: boolean;
  lensOrder?: LensOrder | undefined;
};

export const COMANDS: Command[] = [
  {
    label: "$(feedback) explain",
    text: "explain",
    intent: "/explain-code",
    description: "Explain the selected code",
    scope: ["selection", "block"],
    multistep: false,
    lensOrder: LensOrder.explain,
  },
  {
    label: "$(beaker) test",
    text: "test",
    intent: "/generate-test-for-code",
    description: "Write tests for the selected code",
    scope: ["block"],
    multistep: false,
    lensOrder: LensOrder.test,
  },
  {
    label: "$(checklist) document",
    text: "document",
    intent: "/document-code",
    description: "Add documentation for the selected code",
    scope: ["block"],
    multistep: false,
    lensOrder: LensOrder.document,
  },
  {
    label: "$(symbol-property) fix",
    text: "fix",
    intent: "/fix-code",
    description: "Find errors in the selected code and fix them",
    scope: ["block"],
    multistep: false,
    lensOrder: LensOrder.fix,
  },
  {
    label: "$(search) workspace",
    text: "workspace",
    intent: "/workspace",
    description:
      "Ask a question related to any code within your current workspace",
    scope: ["none"],
    multistep: true,
  },
];
