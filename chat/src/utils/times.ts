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
