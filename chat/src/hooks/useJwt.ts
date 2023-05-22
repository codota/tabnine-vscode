import { useState, useEffect } from 'react';
import { ExtensionMessageEvent } from '../types/MessageEventTypes';
import { vscode } from '../utils/vscodeApi';

type JwtResponse = {
    token?: string;
}

export function useJwt() {
    const [jwt, setJwt] = useState<string | undefined>();

    useEffect(() => {
        vscode.postMessage({
            command: 'get_jwt'
        });

        const handleMessage = (event: ExtensionMessageEvent<JwtResponse>) => {
            const message = event.data;
            if (message.command === 'send_jwt') {
                setJwt(message.payload?.token);
            }
        }

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        }
    }, []);

    return jwt;
}