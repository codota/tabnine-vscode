export enum ValidatorMode {
  Background,
  Paste,
}

let validatorMode: ValidatorMode = ValidatorMode.Background;

export function setValidatorMode(m: ValidatorMode) {
  validatorMode = m;
}

export function getValidatorMode(): ValidatorMode {
  return validatorMode;
}
