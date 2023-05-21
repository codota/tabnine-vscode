import { getState } from "../binary/requests/requests";
import { chatEventRegistry } from './chatEventRegistry'

type GetJwtResponse = {
    token: string;
}

export function initChatApi() {
    chatEventRegistry.registerEvent<void, GetJwtResponse>('get_jwt', async () => {
        const state = await getState();
        if (!state) {
            throw new Error("state is undefined");
        }
        if (!state.access_token) {
            throw new Error("state has no access token");
        }
        return {
            command: 'send_jwt',
            payload: {
                token: state.access_token
            }
        }
    });
}
