require "rails_helper"

# [spekta:summary] キーワードや条件で検索する機能。【テスト更新】
# [spekta:see] spec/features/detail_spec.rb
feature "検索" do
  context "データが存在する場合" do
    scenario "キーワードで検索できる" do
      visit search_path
      fill_in "キーワード", with: "テスト"
      click_on "検索"
      expect(page).to have_content "テスト結果"
    end
  end

  context "データが存在しない場合" do
    scenario "該当なしと表示される" do
      visit search_path
      fill_in "キーワード", with: "存在しない"
      click_on "検索"
      expect(page).to have_content "該当なし"
    end
  end
end
