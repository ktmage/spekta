# frozen_string_literal: true

module Spekta
  module CLI
    module Watch
      POLL_INTERVAL = 1
      RENDERER_DIR = File.expand_path("../../../../renderer-web", __dir__)

      module_function

      def run(config)
        spec_dir = File.expand_path(config.spec_dir)
        patterns = []
        patterns << File.join(spec_dir, "features/**/*_spec.rb") if config.spec_types.include?("feature_spec")
        patterns << File.join(spec_dir, "system/**/*_spec.rb") if config.spec_types.include?("system_spec")

        # 初回ビルド
        Build.run(config)

        # Vite dev サーバーをバックグラウンドで起動
        vite_pid = start_vite
        puts "\nspekta watch: Vite dev サーバーを起動しました"
        puts "  対象: #{patterns.join(', ')}"
        puts "  Ctrl+C で終了"

        mtimes = snapshot(patterns)

        loop do
          sleep POLL_INTERVAL
          current = snapshot(patterns)

          changed = detect_changes(mtimes, current)
          next if changed.empty?

          puts "\n変更検知: #{changed.join(', ')}"
          Build.run(config)
          mtimes = current
        end
      rescue Interrupt
        puts "\nspekta watch: 終了しました"
        Process.kill("TERM", vite_pid) if vite_pid
        Process.wait(vite_pid) if vite_pid
      end

      def start_vite
        pid = spawn("npx vite --open", chdir: RENDERER_DIR, out: "/dev/null", err: "/dev/null")
        Process.detach(pid)
        pid
      end

      def snapshot(patterns)
        files = patterns.flat_map { |p| Dir.glob(p) }
        files.each_with_object({}) do |f, hash|
          hash[f] = File.mtime(f)
        end
      end

      def detect_changes(old_mtimes, new_mtimes)
        changed = []

        new_mtimes.each do |file, mtime|
          if !old_mtimes.key?(file) || old_mtimes[file] != mtime
            changed << File.basename(file)
          end
        end

        old_mtimes.each_key do |file|
          unless new_mtimes.key?(file)
            changed << "#{File.basename(file)} (削除)"
          end
        end

        changed
      end
    end
  end
end
