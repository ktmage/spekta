import type { Step } from "./types.js";

/**
 * Convert a step to a natural Japanese phrase.
 * Same logic as the web renderer's ir.ts stepToPhrase.
 */
export function stepToPhrase(step: Step): string {
  switch (step.action) {
    case "visit":
      return "ページを開く";
    case "click_on":
      return `「${step.target}」をクリック`;
    case "fill_in":
      return step.value !== undefined && step.value !== ""
        ? `「${step.target}」に「${step.value}」と入力`
        : `「${step.target}」を空にする`;
    case "select":
      return `「${step.target}」から「${step.value}」を選択`;
    case "expect":
      if (step.target.startsWith("not: ")) {
        return `「${step.target.slice(5)}」が表示されない`;
      }
      return `「${step.target}」が表示される`;
    default:
      return step.target;
  }
}
