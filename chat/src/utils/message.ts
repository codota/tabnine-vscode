export type MessageSegment = {
  text: string;
  kind: "text" | "code" | "highlight" | "bold";
  language?: string;
};

export function getMessageSegments(text: string): MessageSegment[] {
  const regex = /```(.*?)(\n[\s\S]*?(```|$))/g;
  let match;
  let result: MessageSegment[] = [];
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const precedingText = text.substring(lastIndex, match.index);
    result = result.concat(getBoldAndHighlightedSegments(precedingText));

    const codeText = match[2].trim().replace("```", "");
    result.push({
      text: codeText.trim(),
      kind: "code",
      language: match[1].trim(),
    });

    lastIndex = regex.lastIndex;
  }

  const trailingText = text.substring(lastIndex);
  result = result.concat(getBoldAndHighlightedSegments(trailingText));

  return result;
}

function getBoldAndHighlightedSegments(text: string): MessageSegment[] {
  let highlightMatch;
  let result: MessageSegment[] = [];
  let lastIndex = 0;
  const highlightRegex = /'([^\s]*?)'/g;

  while ((highlightMatch = highlightRegex.exec(text)) !== null) {
    const precedingText = text.substring(lastIndex, highlightMatch.index);
    result = result.concat(getBoldSegments(precedingText));

    const highlightText = highlightMatch[1].trim();
    result.push({
      text: highlightText,
      kind: "highlight",
    });

    lastIndex = highlightRegex.lastIndex;
  }

  const remainingText = text.substring(lastIndex);
  result = result.concat(getBoldSegments(remainingText));

  return result;
}

function getBoldSegments(text: string): MessageSegment[] {
  const regex = /\*\*(.*?)\*\*/g;
  let match;
  let result: MessageSegment[] = [];
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const precedingText = text.substring(lastIndex, match.index).trim();
    if (precedingText) {
      result.push({
        text: precedingText,
        kind: "text",
      });
    }

    const boldText = match[1].trim();
    result.push({
      text: boldText,
      kind: "bold",
    });

    lastIndex = regex.lastIndex;
  }

  const trailingText = text.substring(lastIndex).trim();
  if (trailingText) {
    result.push({
      text: trailingText,
      kind: "text",
    });
  }

  return result;
}

export function getMessageTimestampFormatted(messageTime?: string) {
  if (!messageTime) {
    return null;
  }
  const conversationTime = new Date(Number(messageTime));
  const day = conversationTime.getDate();
  const month = conversationTime.toLocaleString("default", {
    month: "short",
  });
  const year = conversationTime.getFullYear();
  const hours = conversationTime.getHours();
  const minutes = conversationTime.getMinutes().toString().padStart(2, "0");
  return `${day} ${month}, ${year} - ${hours}:${minutes}`;
}
