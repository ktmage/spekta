# frozen_string_literal: true

require_relative "cli/config"
require_relative "cli/build"
require_relative "cli/watch"

module Spekta
  module CLI
    COMMANDS = %w[build watch].freeze

    def self.run(args)
      command = args.first

      if command.nil?
        $stderr.puts "Usage: spekta <command>"
        $stderr.puts "Commands: #{COMMANDS.join(', ')}"
        exit 1
      end

      unless COMMANDS.include?(command)
        $stderr.puts "Unknown command: #{command}"
        $stderr.puts "Commands: #{COMMANDS.join(', ')}"
        exit 1
      end

      config = Config.new

      case command
      when "build"
        Build.run(config)
      when "watch"
        Watch.run(config)
      end
    end
  end
end
