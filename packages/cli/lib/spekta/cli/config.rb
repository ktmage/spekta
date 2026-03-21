# frozen_string_literal: true

require "yaml"

module Spekta
  module CLI
    class Config
      DEFAULT_SPEC_DIR = "spec/"
      DEFAULT_OUTPUT_FORMAT = "html"
      DEFAULT_OUTPUT_PATH = "dist/spekta"
      DEFAULT_SPEC_TYPES = %w[feature_spec system_spec].freeze

      attr_reader :spec_dir, :output_format, :output_path, :spec_types

      def initialize(config_path = ".spekta.yml")
        data = load_config(config_path)

        @spec_dir = data.dig("spec_dir") || DEFAULT_SPEC_DIR
        @output_format = data.dig("output", "format") || DEFAULT_OUTPUT_FORMAT
        @output_path = data.dig("output", "path") || DEFAULT_OUTPUT_PATH
        @spec_types = data.dig("spec_types") || DEFAULT_SPEC_TYPES.dup
      end

      private

      def load_config(path)
        if File.exist?(path)
          YAML.safe_load_file(path) || {}
        else
          {}
        end
      end
    end
  end
end
