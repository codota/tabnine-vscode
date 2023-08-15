import { WELCOME_MESSAGE } from "./welcome.html";

const SIGN_IN_BUTTON = `<a style="display: inline-block; background-color: #007acc; color: #fff; border: none; padding: 6px 40%; border-radius: 3px; cursor: pointer; text-decoration: none;" href="command:tabnine.authenticate">Sign in</a>`;

export const html = (iconPath: string) => `<!DOCTYPE html>
<html>
<body>
<img src="${iconPath}" alt="Tabnine logo"> Tabnine
${WELCOME_MESSAGE}
<p>
Please ensure you’re signed in
<div style="text-align: center;">
${SIGN_IN_BUTTON}
</div>
</p>
</body>
</html>`;
