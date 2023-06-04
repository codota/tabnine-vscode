declare module "*.svg" {
  import React = require("react");

  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const content: string;
  export default content;
}

declare module "*.woff2" {
  const content: any;
  export default content;
}

declare module "*.woff" {
  const content: any;
  export default content;
}

declare module "*.png" {
  const content: any;
  export default content;
}

declare global {
  type Window = { Cypress: any };
}
