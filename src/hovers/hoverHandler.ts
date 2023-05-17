import { ExtensionContext, Position, TextDocument } from "vscode";
import { getHover } from "../binary/requests/hovers";
import { StatePayload } from "../globals/consts";
import setState from "../binary/requests/setState";
import registerHoverCommands from "./hoverActionsHandler";
import showTextDecoration, {
  getCurrentHover,
  isDecorationContains,
} from "./decorationState";

export function provideHover(
  _document: TextDocument,
  position: Position
): null {
  handleHoverShown(position);
  return null;
}

function handleHoverShown(position: Position): void {
  const currentHover = getCurrentHover();
  if (currentHover && isDecorationContains(position)) {
    void setState({
      [StatePayload.HOVER_SHOWN]: {
        id: currentHover.id,
        text: currentHover.message,
        notification_type: currentHover.notification_type,
        state: currentHover.state,
      },
    });
  }
}

export default async function setHover(
  context: ExtensionContext,
  position: Position
): Promise<void> {
  const currentHover = await getHover();

  if (currentHover?.title) {
    context.subscriptions.push(registerHoverCommands(currentHover));
    showTextDecoration(position, context, currentHover);
  }
}
