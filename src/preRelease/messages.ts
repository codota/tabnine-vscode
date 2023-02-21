import { window } from "vscode";

export type MessageOptions = {
  messageId: string;
  messageText: string;
  buttonText: string;
  action: () => void;
};

export default async function showMessage(
  options: MessageOptions
): Promise<void> {
  // void setState({
  //   [StatePayload.NOTIFICATION_SHOWN]: {
  //     id: options.messageId,
  //     text: options.messageText,
  //     notification_type: "System",
  //     state: null,
  //   },
  // });

  await window
    .showInformationMessage(options.messageText, options.buttonText)
    .then((selected) => {
      if (selected === options.buttonText) {
        options.action();
      }
    });
}
