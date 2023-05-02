import { window } from "vscode";
import { fireEvent } from "../binary/requests/requests";
import setState from "../binary/requests/setState";
import { StatePayload } from "../globals/consts";

type MessageOptions = {
  messageId: string;
  messageText: string;
  buttonText: string;
  action: () => void;
};

export default async function showMessage(
  options: MessageOptions
): Promise<void> {
  void setState({
    [StatePayload.NOTIFICATION_SHOWN]: {
      id: options.messageId,
      text: options.messageText,
      notification_type: "System",
      state: null,
    },
  });

  await window
    .showInformationMessage(options.messageText, options.buttonText)
    .then((selected) => {
      if (selected === options.buttonText) {
        options.action();
      }
      void fireEvent({
        name: `Notification ${selected ? "Clicked" : "Dismissed"}`,
        action_type: "button",
        message_name: options.messageId,
        source: "ide",
        type: "System",
        message_text: options.messageText,
        action_name: selected || "dismissed",
      });
    });
}
