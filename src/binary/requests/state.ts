import { StateType } from "../../consts";
import { State } from "../state";
import { getState } from "./requests";
import { openConfigWithSource } from "../../commandsHandler";

export default async function getStateA(): Promise<State | null | undefined> {
  const state = await getState();

  if (state?.should_open_hub) {
    void openConfigWithSource(StateType.INFO)();
  }

  return state;
}