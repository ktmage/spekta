# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name = "spekta-cli"
  spec.version = "0.1.0"
  spec.authors = ["Spekta"]
  spec.summary = "CLI for Spekta documentation generator"

  spec.required_ruby_version = ">= 3.3"

  spec.files = Dir["lib/**/*.rb", "bin/*"]
  spec.bindir = "bin"
  spec.executables = ["spekta"]

  spec.add_dependency "spekta-analyzer-rspec", "~> 0.1"
end
