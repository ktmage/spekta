# frozen_string_literal: true

require "json"
require "fileutils"

require "spekta/analyzer_rspec"

module Spekta
  module CLI
    module Build
      RENDERER_DATA_PATH = File.expand_path("../../../../renderer-web/public/data", __dir__)

      module_function

      def run(config)
        puts "spekta build: 解析を開始します..."

        spec_dir = File.expand_path(config.spec_dir)
        base_path = File.dirname(spec_dir)
        pages = []
        file_to_pages = {} # ファイルパス → page IDs のマッピング（see 参照解決用）

        # 1パス目: 全ファイルを解析して pages を収集
        if config.spec_types.include?("feature_spec")
          Dir.glob(File.join(spec_dir, "features/**/*_spec.rb")).each do |file|
            puts "  解析中: #{file}"
            analyzer = AnalyzerRspec::FeatureSpecAnalyzer.new(file)
            file_pages = analyzer.analyze
            rel_path = file.sub(%r{\A#{Regexp.escape(base_path)}/?}, "")
            file_to_pages[rel_path] = file_pages.map { |p| p[:id] }
            pages.concat(file_pages)
          end
        end

        if config.spec_types.include?("system_spec")
          Dir.glob(File.join(spec_dir, "system/**/*_spec.rb")).each do |file|
            puts "  解析中: #{file}"
            analyzer = AnalyzerRspec::SystemSpecAnalyzer.new(file)
            file_pages = analyzer.analyze
            rel_path = file.sub(%r{\A#{Regexp.escape(base_path)}/?}, "")
            file_to_pages[rel_path] = file_pages.map { |p| p[:id] }
            pages.concat(file_pages)
          end
        end

        # ページタイトル → ID のマッピング（セクション指定の解決用）
        title_to_id = {}
        pages.each { |p| title_to_id[p[:title]] = p[:id] }

        # 2パス目: see 参照を解決
        resolve_see_references(pages, file_to_pages, title_to_id)

        # IR JSON を出力
        ir = { version: "1.0.0", pages: pages }

        FileUtils.mkdir_p(RENDERER_DATA_PATH)
        ir_file = File.join(RENDERER_DATA_PATH, "behavior.json")
        File.write(ir_file, JSON.pretty_generate(ir))
        puts "  IR 出力: #{ir_file}"

        # 画像ファイルをレンダラーにコピー
        copy_images(pages, base_path)

        puts "spekta build: 完了 (#{pages.length} ページ解析)"
      end

      def resolve_see_references(pages, file_to_pages, title_to_id)
        pages.each do |page|
          resolve_attrs(page[:attributes], file_to_pages, title_to_id)
          resolve_sections(page[:sections], file_to_pages, title_to_id) if page[:sections]
        end
      end

      def resolve_sections(sections, file_to_pages, title_to_id)
        return unless sections
        sections.each do |section|
          resolve_attrs(section[:attributes], file_to_pages, title_to_id)
          resolve_sections(section[:sections], file_to_pages, title_to_id) if section[:sections]
        end
      end

      def resolve_attrs(attrs, file_to_pages, title_to_id)
        return unless attrs
        attrs.each do |attr|
          next unless attr[:type] == "see" && attr[:text]

          text = attr[:text]

          if text.include?(":")
            # spec/features/company_spec.rb:企業詳細ページ — ファイル + セクション指定
            file_path, section_title = text.split(":", 2)
            ref_id = title_to_id[section_title]
            if ref_id
              attr[:ref] = ref_id
              attr.delete(:text)
            else
              $stderr.puts "  警告: see 参照先が見つかりません: #{text}"
            end
          else
            # spec/features/company_spec.rb — ファイル指定のみ（最初の page）
            page_ids = file_to_pages[text]
            if page_ids && !page_ids.empty?
              attr[:ref] = page_ids.first
              attr.delete(:text)
            else
              $stderr.puts "  警告: see 参照先が見つかりません: #{text}"
            end
          end
        end
      end

      def copy_images(pages, base_path)
        images_dir = File.join(RENDERER_DATA_PATH, "images")
        FileUtils.mkdir_p(images_dir)

        image_paths = collect_image_paths(pages)
        return if image_paths.empty?

        image_paths.each do |path|
          src = File.join(base_path, path)
          if File.exist?(src)
            FileUtils.cp(src, images_dir)
            puts "  画像コピー: #{path}"
          end
        end
      end

      def collect_image_paths(nodes)
        paths = []
        nodes.each do |node|
          (node[:attributes] || []).each do |a|
            paths << a[:text] if a[:type] == "image" && a[:text]
          end
          collect_image_paths(node[:sections] || [])
        end
        paths.uniq
      end
    end
  end
end
