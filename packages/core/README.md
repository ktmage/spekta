# @ktmage/spekta

Tests are the spec. Generate living documentation from test code.

テストコードから仕様書を自動生成するツールキット。

> [!CAUTION]
> This project is experimental. APIs, schemas, and CLI commands may change without notice.

## Installation

```bash
npm install @ktmage/spekta
```

## Quick Start

```bash
# Initialize project
spekta init

# Add [spekta:*] annotations to your test files, then:
spekta build
```

## Pipeline

```
[Annotator]  Reads test DSL and auto-generates [spekta:*] comments (optional)
    |
[Parser]     Reads [spekta:*] comments and converts to IR
    |
[Exporter]   Generates documentation from IR
```

## Commands

```bash
spekta init                 # Generate .spekta.yml and .spekta/
spekta build                # annotate + render
spekta render               # parse + export only
spekta annotate             # Run Annotator plugins
spekta check                # Validate [spekta:*] annotation syntax
spekta doctor               # Environment diagnostics
spekta {exporter}:{command} # Exporter commands (e.g. web:dev)
```

## Annotations

```ruby
# [spekta:page] User Search             # Page
# [spekta:summary] Search for users     # Summary
# [spekta:section] When data exists      # Section
# [spekta:why] Performance matters       # Reason
# [spekta:text] Additional explanation   # Text
# [spekta:callout] warning Be careful   # Callout (note/warning/tip)
# [spekta:steps]                        # Steps block start
# [spekta:step] Open the page           # Step
# [spekta:steps:end]                    # Steps block end
```

## Official Plugins

### Annotators

| Package | Description |
|---|---|
| `@ktmage/spekta-annotator-rspec` | Auto-generate annotations from RSpec / Capybara tests |
| `@ktmage/spekta-annotator-vitest` | Auto-generate annotations from Vitest tests |

### Exporters

| Package | Description |
|---|---|
| `@ktmage/spekta-exporter-web` | Generate static HTML documentation site with dev server |
| `@ktmage/spekta-exporter-markdown` | Generate Markdown documentation |

## License

[MIT](https://github.com/ktmage/spekta/blob/main/LICENSE)
