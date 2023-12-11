import { template } from "./template.html";

export const PREVIEW_ENDED_MESSAGE = `
<div style="font-size: 14px;">
<h3>Tabnine Chat - Preview Period Ended</h3>
<p>
The preview period for Tabnine Chat in Visual Studio Code has now ended. We hope you found it valuable for your coding projects and enjoyed the experience.
</p>
<p>
To continue using Tabnine Chat and access its full range of features, we invite you to subscribe to one of our plans. 
</p>
<p>
You can find detailed information about our pricing and the additional benefits of a subscription on our <a href="https://www.tabnine.com/pricing">pricing page</a>.
</p>
<p>
If you have any questions or need assistance, our support team is always ready to help. 
</p>
</div>`;

export const html = (logoSrc: string) =>
  template(PREVIEW_ENDED_MESSAGE, logoSrc);
