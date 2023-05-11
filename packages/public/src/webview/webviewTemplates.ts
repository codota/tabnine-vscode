// eslint-disable-next-line import/prefer-default-export
export const createIFrameTemplate = (url: string): string => `
<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0; min-width: 100%; min-height: 100%">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tabnine Hub</title>
    </head>
    <body style="margin: 0; padding: 0; min-width: 100%; min-height: 100%">
      <iframe src="${url}" id="config" frameborder="0" style="display: block; margin: 0; padding: 0; position: absolute; min-width: 100%; min-height: 100%; visibility: visible;"></iframe>
    </body>
</html>`;
