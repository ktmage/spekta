import type { AnnotatorPlugin, Annotation } from "@ktmage/spekta/plugin";

const plugin: AnnotatorPlugin = {
  name: "rspec",
  filePatterns: ["*_spec.rb"],

  annotate(filePath: string, source: string): Annotation[] {
    const lines = source.split("\n");
    const annotations: Annotation[] = [];
    let inScenario = false;
    let stepsStarted = false;
    let lastStepLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // feature "title" do / describe "title" do → section
      // [spekta:page] は手書き。Annotator は section のみ生成する。
      const describeMatch = line.match(/^\s*(?:feature|describe)\s+["'](.+?)["']\s+do/);
      if (describeMatch) {
        if (stepsStarted) {
          annotations.push({ line: lastStepLine + 1, type: "steps:end", text: "" });
          stepsStarted = false;
        }
        annotations.push({ line: lineNum, type: "section", text: describeMatch[1] });
        inScenario = false;
        continue;
      }

      // context "title" do → section
      const contextMatch = line.match(/^\s*context\s+["'](.+?)["']\s+do/);
      if (contextMatch) {
        if (stepsStarted) {
          annotations.push({ line: lastStepLine + 1, type: "steps:end", text: "" });
          stepsStarted = false;
        }
        annotations.push({ line: lineNum, type: "section", text: contextMatch[1] });
        inScenario = false;
        continue;
      }

      // scenario "title" do / it "title" do → section + start collecting steps
      const scenarioMatch = line.match(/^\s*(?:scenario|it)\s+["'](.+?)["']\s+do/);
      if (scenarioMatch) {
        if (stepsStarted) {
          annotations.push({ line: lastStepLine + 1, type: "steps:end", text: "" });
          stepsStarted = false;
        }
        annotations.push({ line: lineNum, type: "section", text: scenarioMatch[1] });
        inScenario = true;
        continue;
      }

      // end → close scenario
      if (inScenario && line.match(/^\s*end\s*$/)) {
        if (stepsStarted) {
          annotations.push({ line: lastStepLine + 1, type: "steps:end", text: "" });
          stepsStarted = false;
        }
        inScenario = false;
        continue;
      }

      if (!inScenario) continue;

      // Capybara DSL → step annotations
      let stepText: string | null = null;

      const visitMatch = line.match(/^\s*visit\s+/);
      if (visitMatch) stepText = "ページを開く";

      const fillInMatch = line.match(/^\s*fill_in\s+["'](.+?)["']\s*,\s*with:\s*["'](.+?)["']/);
      if (fillInMatch) stepText = `「${fillInMatch[1]}」に「${fillInMatch[2]}」と入力`;

      const clickMatch = line.match(/^\s*click_on\s+["'](.+?)["']/);
      if (clickMatch) stepText = `「${clickMatch[1]}」をクリック`;

      const selectMatch = line.match(/^\s*select\s+["'](.+?)["']\s*,\s*from:\s*["'](.+?)["']/);
      if (selectMatch) stepText = `「${selectMatch[2]}」から「${selectMatch[1]}」を選択`;

      const expectContentMatch = line.match(/^\s*expect\(page\)\.to\s+have_content\s+["'](.+?)["']/);
      if (expectContentMatch) stepText = `「${expectContentMatch[1]}」が表示される`;

      const expectNoContentMatch = line.match(/^\s*expect\(page\)\.not_to\s+have_content\s+["'](.+?)["']/);
      if (expectNoContentMatch) stepText = `「${expectNoContentMatch[1]}」が表示されない`;

      if (stepText) {
        if (!stepsStarted) {
          annotations.push({ line: lineNum, type: "steps", text: "" });
          stepsStarted = true;
        }
        annotations.push({ line: lineNum, type: "step", text: stepText });
        lastStepLine = lineNum;
      }
    }

    // Close unclosed steps at end of file
    if (stepsStarted) {
      annotations.push({ line: lastStepLine + 1, type: "steps:end", text: "" });
    }

    return annotations;
  },
};

export default plugin;
