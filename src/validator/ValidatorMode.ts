export enum ValidatorMode {
  Background,
  Paste,
}

let validatorMode: ValidatorMode = ValidatorMode.Background;

export function setValidatorMode(m: ValidatorMode): void {
  validatorMode = m;
}

export function getValidatorMode(): ValidatorMode {
  return validatorMode;
}
