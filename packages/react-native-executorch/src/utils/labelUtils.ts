export function buildLabelArray(
  labelMap: Record<string, number | string>
): string[] {
  const labels: string[] = [];
  for (const [name, value] of Object.entries(labelMap)) {
    if (typeof value === 'number') labels[value] = name;
  }
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] == null) labels[i] = '';
  }
  return labels;
}
