"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

// Grip icon for drag handle
const GripIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5 text-gray-400"
  >
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

interface SortableItemProps<T> {
  id: string;
  item: T;
  renderItem: (item: T, dragHandleProps: object) => React.ReactNode;
  isDragging?: boolean;
}

function SortableItem<T>({ id, item, renderItem, isDragging: _isDragging }: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isItemDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isItemDragging ? 0.5 : 1,
    zIndex: isItemDragging ? 1 : 0,
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
    className: "cursor-grab active:cursor-grabbing touch-none p-2 -m-2",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, dragHandleProps)}
    </div>
  );
}

interface DraggableListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, dragHandleProps: object) => React.ReactNode;
  renderDragOverlay?: (item: T) => React.ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
}

export function DraggableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  renderDragOverlay,
  className = "",
  gap = "md",
}: DraggableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  const gapClasses = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={`flex flex-col ${gapClasses[gap]} ${className}`}>
          <AnimatePresence>
            {items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                item={item}
                renderItem={renderItem}
                isDragging={activeId === item.id}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay>
        {activeItem && renderDragOverlay ? (
          <motion.div
            initial={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
            animate={{ scale: 1.02, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
          >
            {renderDragOverlay(activeItem)}
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Pre-built drag handle component
export function DragHandle(props: object) {
  return (
    <button
      type="button"
      {...props}
    >
      <GripIcon />
    </button>
  );
}

// Wrapper card for draggable items in edit mode
interface DraggableItemCardProps {
  children: React.ReactNode;
  dragHandleProps: object;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  isVisible?: boolean;
  className?: string;
}

export function DraggableItemCard({
  children,
  dragHandleProps,
  onEdit,
  onDelete,
  onToggleVisibility,
  isVisible = true,
  className = "",
}: DraggableItemCardProps) {
  // Extract className from dragHandleProps since we apply our own styles
  const { className: _dragClassName, ...restDragProps } = dragHandleProps as { className?: string; [key: string]: unknown };

  return (
    <motion.div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="flex items-center">
        {/* Drag handle */}
        <button
          type="button"
          className={`flex items-center justify-center px-3 py-4 border-r border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors cursor-grab active:cursor-grabbing touch-none`}
          {...restDragProps}
        >
          <GripIcon />
        </button>

        {/* Content */}
        <div className={`flex-1 p-4 ${!isVisible ? "opacity-50" : ""}`}>
          {children}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 px-3 border-l border-gray-100">
          {onToggleVisibility && (
            <button
              type="button"
              onClick={onToggleVisibility}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title={isVisible ? "Hide" : "Show"}
            >
              {isVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
