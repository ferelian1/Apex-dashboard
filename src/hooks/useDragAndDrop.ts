'use client';

/**
 * useDragAndDrop — dnd-kit sensor and handler configuration for the Kanban board.
 *
 * Configures PointerSensor (activation distance 8px) and KeyboardSensor.
 * Exports sensor config and handler factories for handleDragStart,
 * handleDragOver, and handleDragEnd.
 *
 * Requirements: 10.5
 */

import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/** Shape of the active drag item tracked in BoardView state. */
export interface ActiveDragItem {
  id: string;
  type: 'task' | 'column';
}

/**
 * Returns the configured dnd-kit sensors for the Kanban board.
 *
 * - PointerSensor: activates after 8px of movement to distinguish clicks from drags.
 * - KeyboardSensor: enables full keyboard drag-and-drop accessibility.
 */
export function useBoardSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // px — prevents accidental drags on click (Req 10.5)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

/**
 * Creates a handleDragStart handler that extracts the active item type and id.
 *
 * @param setActiveItem - State setter from BoardView's useState.
 */
export function createDragStartHandler(
  setActiveItem: (item: ActiveDragItem | null) => void,
) {
  return function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const type = active.data.current?.type as 'task' | 'column' | undefined;
    if (type) {
      setActiveItem({ id: String(active.id), type });
    }
  };
}

/**
 * Creates a handleDragEnd handler that clears the active item.
 * The actual move logic lives in BoardView where optimistic state is managed.
 *
 * @param setActiveItem - State setter from BoardView's useState.
 */
export function createDragEndHandler(
  setActiveItem: (item: ActiveDragItem | null) => void,
) {
  return function handleDragEnd(_event: DragEndEvent) {
    setActiveItem(null);
  };
}

export type { DragStartEvent, DragOverEvent, DragEndEvent };
