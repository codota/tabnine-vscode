export const template = (content: string, logoSrc: string) => `<!DOCTYPE html>
<html>
<head>
    <style>
    .logo {
        height: 1.5rem;
        width: 6.75rem;
    }
    </style>
</head>
<body>
<image src="${logoSrc}" class="logo"></image>
${content}
</body>
</html>`;
