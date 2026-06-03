import type { ExportOutput, GeneratedComponent } from "@/types";

const DEFAULT_FILENAME = "dashboard-components.tsx.txt";
const EXPORT_MIME_TYPE = "text/plain;charset=utf-8";

export class ExportTool {
  buildExport(components: GeneratedComponent[]): ExportOutput {
    const sortedComponents = this.sortComponents(components);

    return {
      content: this.formatAsText(sortedComponents),
      filename: this.buildFilename(sortedComponents),
      mimeType: EXPORT_MIME_TYPE,
      componentCount: sortedComponents.length,
      exportedAt: new Date().toISOString(),
    };
  }

  download(
    components: GeneratedComponent[],
    filename?: string,
  ): ExportOutput {
    const exportOutput = this.buildExport(components);
    const downloadFilename = filename ?? exportOutput.filename;

    this.triggerDownload(
      exportOutput.content,
      downloadFilename,
      exportOutput.mimeType,
    );

    return {
      ...exportOutput,
      filename: downloadFilename,
    };
  }

  private formatAsText(components: GeneratedComponent[]): string {
    const header = [
      "// Generated dashboard components",
      `// Exported at: ${new Date().toISOString()}`,
      `// Component count: ${components.length}`,
      "",
    ].join("\n");

    if (components.length === 0) {
      return `${header}// No components to export\n`;
    }

    const blocks = components.map((component) =>
      [
        `// --- ${component.name} ---`,
        `// id: ${component.id}`,
        `// type: ${component.componentType}`,
        `// architectureId: ${component.architectureId}`,
        `// validated: ${component.validated}`,
        component.sourceCode,
        "",
      ].join("\n"),
    );

    return `${header}${blocks.join("\n")}`.trimEnd() + "\n";
  }

  private sortComponents(
    components: GeneratedComponent[],
  ): GeneratedComponent[] {
    return [...components].sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }

  private buildFilename(components: GeneratedComponent[]): string {
    if (components.length === 0) {
      return DEFAULT_FILENAME;
    }

    const architectureId = components[0].architectureId.replace(
      /[^a-zA-Z0-9-_]/g,
      "",
    );

    return `dashboard-${architectureId || "export"}.tsx.txt`;
  }

  private triggerDownload(
    content: string,
    filename: string,
    mimeType: string,
  ): void {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(objectUrl);
  }
}
