import type { AnnotatorPlugin, Annotation } from "@ktmage/spekta/plugin";

const plugin: AnnotatorPlugin = {
  name: "rspec",
  filePatterns: ["*_spec.rb"],

  annotate(filePath: string, source: string): Annotation[] {
    const lines = source.split("\n");
    const annotations: Annotation[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // feature "title" do / describe "title" do → page
      const pageMatch = line.match(/^\s*(?:feature|describe)\s+["'](.+?)["']\s+do/);
      if (pageMatch) {
        // Top-level (no or minimal indent) → page, otherwise section
        const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
        annotations.push({
          line: lineNum,
          type: indent <= 0 ? "page" : "section",
          text: pageMatch[1],
        });
        continue;
      }

      // context "title" do → section
      const contextMatch = line.match(/^\s*context\s+["'](.+?)["']\s+do/);
      if (contextMatch) {
        annotations.push({ line: lineNum, type: "section", text: contextMatch[1] });
        continue;
      }

      // scenario "title" do / it "title" do → section (leaf)
      const scenarioMatch = line.match(/^\s*(?:scenario|it)\s+["'](.+?)["']\s+do/);
      if (scenarioMatch) {
        annotations.push({ line: lineNum, type: "section", text: scenarioMatch[1] });
        continue;
      }

      // visit xxx_path → step: ページを開く
      const visitMatch = line.match(/^\s*visit\s+/);
      if (visitMatch) {
        annotations.push({ line: lineNum, type: "step", text: "ページを開く" });
        continue;
      }

      // fill_in "label", with: "value" → step
      const fillInMatch = line.match(/^\s*fill_in\s+["'](.+?)["']\s*,\s*with:\s*["'](.+?)["']/);
      if (fillInMatch) {
        annotations.push({
          line: lineNum,
          type: "step",
          text: `「${fillInMatch[1]}」に「${fillInMatch[2]}」と入力`,
        });
        continue;
      }

      // click_on "label" → step
      const clickMatch = line.match(/^\s*click_on\s+["'](.+?)["']/);
      if (clickMatch) {
        annotations.push({
          line: lineNum,
          type: "step",
          text: `「${clickMatch[1]}」をクリック`,
        });
        continue;
      }

      // select "value", from: "label" → step
      const selectMatch = line.match(/^\s*select\s+["'](.+?)["']\s*,\s*from:\s*["'](.+?)["']/);
      if (selectMatch) {
        annotations.push({
          line: lineNum,
          type: "step",
          text: `「${selectMatch[2]}」から「${selectMatch[1]}」を選択`,
        });
        continue;
      }

      // expect(page).to have_content "text" → step
      const expectContentMatch = line.match(/^\s*expect\(page\)\.to\s+have_content\s+["'](.+?)["']/);
      if (expectContentMatch) {
        annotations.push({
          line: lineNum,
          type: "step",
          text: `「${expectContentMatch[1]}」が表示される`,
        });
        continue;
      }

      // expect(page).not_to have_content "text" → step
      const expectNoContentMatch = line.match(/^\s*expect\(page\)\.not_to\s+have_content\s+["'](.+?)["']/);
      if (expectNoContentMatch) {
        annotations.push({
          line: lineNum,
          type: "step",
          text: `「${expectNoContentMatch[1]}」が表示されない`,
        });
        continue;
      }
    }

    return annotations;
  },
};

export default plugin;
