type TextSegment = {
  text: string;
  kind: "text";
};

type CodeSegment = {
  text: string;
  kind: "code";
  language: string;
};

export type MessageSegment = TextSegment | CodeSegment;

export function getMessageSegments(text: string): MessageSegment[] {
  const regex = /```(.*?)(\n[\s\S]*?(```|$))/g;
  let match;
  let result: MessageSegment[] = [];
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add preceding text segment, if any
    const precedingText = text.substring(lastIndex, match.index).trim();
    if (precedingText) {
      result.push({
        text: precedingText.trim(),
        kind: "text",
      });
    }

    // Add code segment
    const codeText = match[2].trim().replace("```", ""); // Remove closing backticks, if present
    result.push({
      text: codeText.trim(),
      kind: "code",
      language: match[1].trim(),
    });

    lastIndex = regex.lastIndex;
  }

  // Add trailing text segment, if any
  const trailingText = text.substring(lastIndex).trim();
  if (trailingText) {
    result.push({
      text: trailingText.trim(),
      kind: "text",
    });
  }

  return result;
}

export function getMessageTimestampFormatted(messageTime?: string) {
  debugger;
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
