/** 前端浏览按钮 loading 目标；按目标区分，避免所有按钮同时显示「选择中…」 */
export type PickingTarget = 'md' | 'cards' | null;

export function browseButtonLabel(
  mine: 'md' | 'cards',
  pickingTarget: PickingTarget,
  idleLabel: string
): string {
  return pickingTarget === mine ? '选择中…' : idleLabel;
}
