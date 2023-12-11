import { template } from "./template.html";

export const PART_OF_A_TEAM_MESSAGE = `
<h3>Welcome to Tabnine Chat</h3>
<h4>Tabnine Chat is currently in Beta</h4>
<p>To use Tabnine chat please make sure you are part of a team.</p>`;

export const html = (logoSrc: string) =>
  template(PART_OF_A_TEAM_MESSAGE, logoSrc);
