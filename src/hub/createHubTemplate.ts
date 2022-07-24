import { IS_OSX } from "../globals/consts";

export const createLayoutTemplate = (content: string): string => `
<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0; min-width: 100%; min-height: 100%">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tabnine Hub</title>
    </head>
    <body style="margin: 0; padding: 0; min-width: 100%; min-height: 100%">
        ${content}
    </body>
</html>`;

export function createLoadingHubTemplate(): string {
  return createLayoutTemplate(`<div
      id="loading"
      frameborder="0"
      style="
        display: block;
        margin: 0;
        padding: 0;
        position: absolute;
        min-width: 100%;
        min-height: 100%;
        visibility: visible;
        background: rgb(37, 37, 38);
        color: white;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      Loading ...
    </div>
      `);
}

export default function createHubTemplate(url: string): string {
  return createLayoutTemplate(`
    <iframe src="${url}" id="config" frameborder="0" style="display: block; margin: 0; padding: 0; position: absolute; min-width: 100%; min-height: 100%; visibility: visible;"></iframe>
    <script>
        window.onfocus = config.onload = function() {
            setTimeout(function() {
                document.getElementById("config").contentWindow.focus();
            }, 100);
        };
        window.addEventListener("message", (e) => {
          let data = e.data;
          switch (data.type) {
            case "keydown": {
              if (${IS_OSX}) {
                window.dispatchEvent(new KeyboardEvent('keydown',data.event));
              }
              break;
            }
            case "link-click": {
              let tempRef = document.createElement("a");
              tempRef.setAttribute("href", data.href);
              config.appendChild(tempRef);
              tempRef.click();
              tempRef.parentNode.removeChild(tempRef);
              break;
            }
            case "navigation": {
              document.getElementById("config").contentWindow.postMessage({type: "navigation", view: data.view}, '*');
              break;
            } 
          }
      }, false);
      </script>
  `);
}
