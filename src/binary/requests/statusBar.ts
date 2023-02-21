import { MessageAction } from "../../globals/consts";

export type StatusBarStatus = {
  id: string;
  message: string;
  title: string | undefined;
  actions: MessageAction[];
  notification_type: unknown;
  duration_seconds?: number;
  state: unknown;
};
