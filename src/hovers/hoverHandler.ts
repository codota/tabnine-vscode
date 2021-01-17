import { ExtensionContext, languages, Position } from "vscode";
import { getHover, Hover } from "../binary/requests/hovers";
import { StatePayload } from "../consts";
import setState from "../binary/requests/setState";
import registerHoverCommands from "./hoverActionsHandler";
import showTextDecoration, { isDecorationContains } from "./decorationState";

let currentHover: Hover | null | undefined = null;

languages.registerHoverProvider(
  { pattern: "**" },
  {
    provideHover(_document, position) {
      return handleHoverShown(position);
    },
  }
);

function handleHoverShown(position: Position) {
  if (currentHover && isDecorationContains(position)) {
    void setState({
      [StatePayload.HOVER_SHOWN]: {
        id: currentHover.id,
        text: currentHover.message,
        notification_type: currentHover.notification_type,
        state: currentHover.state
      },
    });
  }
  return null;
}

export default async function setHover(
  context: ExtensionContext,
  position: Position
): Promise<void> {
  currentHover = await getHover();

  if (currentHover?.message) {
    registerHoverCommands(currentHover, context);
    showTextDecoration(position, context, currentHover);
  }
}
