require "rails_helper"

# [spekta:summary] 詳細情報を確認するページ。
# [spekta:see] spec/features/search_spec.rb
feature "詳細ページ" do
  context "データが存在する場合" do
    # [spekta:why] 基本情報はユーザーが最初に確認する項目であるため。
    scenario "基本情報が表示される" do
      visit detail_path
      expect(page).to have_content "基本情報"
    end
  end
end
