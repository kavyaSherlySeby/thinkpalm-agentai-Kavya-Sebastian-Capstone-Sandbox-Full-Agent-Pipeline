export function buildSelfClosingTag(
  componentName: string,
  props?: Readonly<Record<string, string>>,
): string {
  if (!props || Object.keys(props).length === 0) {
    return `<${componentName} />`;
  }

  const attributes = Object.entries(props)
    .map(([name, value]) => `${name}="${escapeAttributeValue(value)}"`)
    .join(" ");

  return `<${componentName} ${attributes} />`;
}

function escapeAttributeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
