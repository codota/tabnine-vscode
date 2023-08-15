export const WELCOME_MESSAGE = `
<h1>Welcome to Tabnine Chat</h1>
<h2>Tabnine Chat is currently in Beta</h2>
<p>We understand that waiting for this awesome feature isn’t easy, but we guarantee it will be worth it. 
Tabnine Chat will soon be available to all users, and we'll make sure to keep you informed. Thank you for your patience!
<a href="https://www.tabnine.com/#ChatSection">Learn More</a></p>`;

export const html = (iconPath: string) => `<!DOCTYPE html>
<html>
<body>
<img src="${iconPath}" alt="Tabnine logo"> Tabnine
${WELCOME_MESSAGE}
</body>
</html>`;
