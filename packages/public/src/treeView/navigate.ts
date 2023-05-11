import { StateType } from "../globals/consts";
import createHubWebView from "../hub/createHubWebView";
import hubUri from "../hub/hubUri";

export default async function navigate(view?: string): Promise<void> {
  const uri = await hubUri(StateType.TREE_VIEW);
  if (uri) {
    const panel = await createHubWebView(uri, view);
    panel.reveal();
  }
}
