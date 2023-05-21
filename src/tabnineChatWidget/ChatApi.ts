import { getState } from "../binary/requests/requests";
import { chatEventRegistry } from './chatEventRegistry'

export function initChatApi() {
    chatEventRegistry.registerEvent('get_jwt', async () => {
        const state = await getState();
        return {
            command: 'send_jwt',
            payload: {
                token: state?.access_token
            }
        }
    });
}
