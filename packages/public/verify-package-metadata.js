const exptectedMetadata = JSON.stringify(
  {
    id: "75da638c-c45a-44ea-aa3b-8570a3559810",
    publisherDisplayName: "TabNine",
    publisherId: "1924b661-7c19-45d9-9800-edeb32848fd7",
    isPreReleaseVersion: false,
  },
  null,
  2
);

const packageJsonMetadata = JSON.stringify(
  require("./package.json").__metadata,
  null,
  2
);

if (packageJsonMetadata !== exptectedMetadata) {
  throw new Error(
    `Expected package.json metadata to be ${exptectedMetadata} but was ${packageJsonMetadata}`
  );
}
