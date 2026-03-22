import { describe, it } from "vitest";

// [spekta:summary] キーワードや条件で検索する機能。【テスト更新】
describe("検索", () => {
  describe("データが存在する場合", () => {
    it("キーワードで検索できる", () => {
      // [spekta:step] 検索画面を開く
      // [spekta:step] 「キーワード」に「テスト」と入力する
      // [spekta:step] 「検索」ボタンをクリックする
      // [spekta:step] 検索結果が表示される
    });
  });

  describe("データが存在しない場合", () => {
    it("該当なしと表示される", () => {
      // [spekta:step] 検索画面を開く
      // [spekta:step] 「キーワード」に「存在しない」と入力する
      // [spekta:step] 「検索」ボタンをクリックする
      // [spekta:step] 「該当なし」と表示される
    });
  });
});
