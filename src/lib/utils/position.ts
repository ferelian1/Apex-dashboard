/**
 * Position utilities for the Kanban board gap-based ordering strategy.
 *
 * Columns and tasks use integer position values with gaps (multiples of 1000)
 * to minimize database writes during reordering. A full renumbering pass is
 * triggered only when the gap between adjacent items is exhausted (< 2).
 */

/**
 * Calculates the position value for an item inserted between two existing items.
 *
 * - If both `before` and `after` are null (empty list), returns 1000.
 * - If `before` is null (inserting at the start), returns floor(after / 2).
 * - If `after` is null (inserting at the end), returns before + 1000.
 * - Otherwise, returns the midpoint floor((before + after) / 2).
 *
 * @param before - The position of the item immediately before the insertion point, or null if inserting at the start.
 * @param after  - The position of the item immediately after the insertion point, or null if inserting at the end.
 * @returns The calculated integer position for the new item.
 */
export function calculateInsertPosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1000;
  if (before === null) return Math.floor(after! / 2);
  if (after === null) return before + 1000;
  return Math.floor((before + after) / 2);
}

/**
 * Determines whether a full renumbering pass is needed for a column or board.
 *
 * When the absolute gap between two adjacent position values is less than 2,
 * there is no integer available to insert between them, so all positions must
 * be reassigned as multiples of 1000.
 *
 * @param before - The position of the item immediately before the gap.
 * @param after  - The position of the item immediately after the gap.
 * @returns `true` if the gap is exhausted and renumbering is required; `false` otherwise.
 */
export function needsRenumbering(before: number, after: number): boolean {
  return Math.abs(after - before) < 2;
}

/**
 * Generates a fresh set of evenly-spaced position values for a list of items.
 *
 * Assigns positions as (i + 1) * 1000 for each item index i, producing
 * [1000, 2000, 3000, ...] for the given count. Used after gap exhaustion to
 * restore large gaps between all items in a column or board.
 *
 * @param count - The number of items to renumber.
 * @returns An array of `count` position values in ascending order.
 */
export function renumberPositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * 1000);
}
