import {
  Notification,
  NotificationActions,
} from "../binary/requests/notifications";

export default async function executeNotificationAction(
  notification: Notification,
  selected: string | undefined
): Promise<void> {
  const selectedAction = notification.options.find(
    ({ key }) => key === selected
  );

  switch (selectedAction?.action) {
    case NotificationActions.NONE:
    default:
      // Nothing to do. It is either unrecognized or undefined, and for both we do nothing.
      return Promise.resolve();
  }
}
