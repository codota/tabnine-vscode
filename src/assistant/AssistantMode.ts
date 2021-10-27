export enum AssistantMode {
  Background,
  Paste,
}

let assistantMode: AssistantMode = AssistantMode.Background;

export function setAssistantMode(m: AssistantMode): void {
  assistantMode = m;
}

export function getAssistantMode(): AssistantMode {
  return assistantMode;
}
