// apps/computer-vision/app/vision_camera/utils/colors.ts

export const CLASS_COLORS: number[][] = [
  [0, 0, 0, 0],
  [51, 255, 87, 180],
  [51, 87, 255, 180],
  [255, 51, 246, 180],
  [51, 255, 246, 180],
  [243, 255, 51, 180],
  [141, 51, 255, 180],
  [255, 131, 51, 180],
  [51, 255, 131, 180],
  [131, 51, 255, 180],
  [255, 255, 51, 180],
  [51, 255, 255, 180],
  [255, 51, 143, 180],
  [127, 51, 255, 180],
  [51, 255, 175, 180],
  [255, 175, 51, 180],
  [179, 255, 51, 180],
  [255, 87, 51, 180],
  [255, 51, 162, 180],
  [51, 162, 255, 180],
  [162, 51, 255, 180],
];

export function hashLabel(label: string): number {
  let hash = 5381;
  for (let i = 0; i < label.length; i++) {
    hash = (hash + hash * 32 + label.charCodeAt(i)) % 1000003;
  }
  return 1 + (Math.abs(hash) % (CLASS_COLORS.length - 1));
}

export function labelColor(label: string): string {
  const color = CLASS_COLORS[hashLabel(label)]!;
  return `rgba(${color[0]},${color[1]},${color[2]},1)`;
}

export function labelColorBg(label: string): string {
  const color = CLASS_COLORS[hashLabel(label)]!;
  return `rgba(${color[0]},${color[1]},${color[2]},0.75)`;
}
