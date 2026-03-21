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
        sources = []

        # Feature spec の解析
        if config.spec_types.include?("feature_spec")
          feature_files = Dir.glob(File.join(spec_dir, "features/**/*_spec.rb"))
          feature_files.each do |file|
            puts "  解析中: #{file}"
            analyzer = AnalyzerRspec::FeatureSpecAnalyzer.new(file, base_path: File.dirname(spec_dir))
            sources << analyzer.analyze
          end
        end

        # System spec の解析
        if config.spec_types.include?("system_spec")
          system_files = Dir.glob(File.join(spec_dir, "system/**/*_spec.rb"))
          system_files.each do |file|
            puts "  解析中: #{file}"
            analyzer = AnalyzerRspec::SystemSpecAnalyzer.new(file, base_path: File.dirname(spec_dir))
            sources << analyzer.analyze
          end
        end

        # IR JSON を出力
        ir = {
          version: "1.0.0",
          sources: sources
        }

        FileUtils.mkdir_p(RENDERER_DATA_PATH)
        ir_file = File.join(RENDERER_DATA_PATH, "behavior.json")
        File.write(ir_file, JSON.pretty_generate(ir))
        puts "  IR 出力: #{ir_file}"
        puts "spekta build: 完了 (#{sources.length} ファイル解析)"
      end
    end
  end
end
