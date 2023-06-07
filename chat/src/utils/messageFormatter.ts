export type MessageSegment =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "highlight"; content: string }
  | { type: "bullet"; content: string }
  | { type: "code"; content: string; language: string };

const TYPES_REGEX = [
  { type: "bold", regexp: /\*\*(.+?)\*\*/gs },
  { type: "highlight", regexp: /'([^'\s]+)'/gs },
  { type: "bullet", regexp: /^- (.+?)$/gms },
  { type: "code", regexp: /```(\w+)?\n?(.+?)```/gs },
];

export function getMessageSegments(response: string): MessageSegment[] {
  const parts: MessageSegment[] = [];

  let currIndex = 0;
  while (currIndex < response.length) {
    let nextMatch: RegExpExecArray | null = null;
    let matchType: string | null = null;

    for (const { type, regexp } of TYPES_REGEX) {
      regexp.lastIndex = currIndex; // Set where to start searching
      const match = regexp.exec(response);
      if (match && (nextMatch === null || match.index < nextMatch.index)) {
        nextMatch = match;
        matchType = type;
      }
    }

    if (nextMatch && nextMatch.index > currIndex) {
      parts.push({
        type: "text",
        content: response.slice(currIndex, nextMatch.index),
      });
      currIndex = nextMatch.index;
    }

    if (nextMatch) {
      if (matchType === "code") {
        parts.push({
          type: matchType,
          content: nextMatch[2].trim(),
          language: nextMatch[1],
        });
      } else {
        parts.push({ type: matchType as any, content: nextMatch[1] });
      }
      currIndex = nextMatch.index + nextMatch[0].length;
    } else {
      parts.push({ type: "text", content: response.slice(currIndex) });
      break;
    }
  }

  // Filter out empty text parts
  return parts.filter((part) => part.content.trim() !== "");
}
