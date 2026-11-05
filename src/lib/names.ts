// The same rule as TtsModel.name in the ua-tts-eval package. It rules out "." and "..",
// so a valid name is always safe to use as one path segment.
const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const ITEM_ID = /^[0-9a-f]{12}$/;

export function isModelName(value: string): boolean {
  return MODEL_NAME.test(value);
}

export function isItemId(value: string): boolean {
  return ITEM_ID.test(value);
}
