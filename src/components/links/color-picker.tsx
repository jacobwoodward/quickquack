"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { motion, AnimatePresence } from "framer-motion";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  presets?: string[];
}

const defaultPresets = [
  "#000000", "#FFFFFF", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899",
];

export function ColorPicker({
  color,
  onChange,
  label,
  presets = defaultPresets,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5" ref={pickerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Color swatch button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 w-full px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
        >
          <div
            className="w-6 h-6 rounded-md border border-gray-200 shadow-inner"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-gray-700 uppercase font-mono">
            {color}
          </span>
        </button>

        {/* Dropdown picker */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200"
            >
              <HexColorPicker color={color} onChange={onChange} />

              {/* Hex input */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-500">#</span>
                <HexColorInput
                  color={color}
                  onChange={onChange}
                  prefixed={false}
                  className="flex-1 px-2 py-1 text-sm font-mono border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>

              {/* Presets */}
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChange(preset)}
                    className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
                      color.toLowerCase() === preset.toLowerCase()
                        ? "ring-2 ring-blue-500 ring-offset-1"
                        : "border-gray-200"
                    }`}
                    style={{ backgroundColor: preset }}
                    title={preset}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Inline color picker for smaller spaces
interface InlineColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  presets?: string[];
}

export function InlineColorPicker({
  color,
  onChange,
  presets = defaultPresets,
}: InlineColorPickerProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
            color.toLowerCase() === preset.toLowerCase()
              ? "border-gray-900 scale-110"
              : "border-transparent"
          }`}
          style={{ backgroundColor: preset }}
          title={preset}
        />
      ))}
    </div>
  );
}

// Gradient picker for background gradients
interface GradientPickerProps {
  startColor: string;
  endColor: string;
  direction: number;
  onStartColorChange: (color: string) => void;
  onEndColorChange: (color: string) => void;
  onDirectionChange: (direction: number) => void;
  label?: string;
}

const directions = [
  { value: 0, label: "Top" },
  { value: 45, label: "Top Right" },
  { value: 90, label: "Right" },
  { value: 135, label: "Bottom Right" },
  { value: 180, label: "Bottom" },
  { value: 225, label: "Bottom Left" },
  { value: 270, label: "Left" },
  { value: 315, label: "Top Left" },
];

export function GradientPicker({
  startColor,
  endColor,
  direction,
  onStartColorChange,
  onEndColorChange,
  onDirectionChange,
  label,
}: GradientPickerProps) {
  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Gradient preview */}
      <div
        className="w-full h-20 rounded-lg border border-gray-200"
        style={{
          background: `linear-gradient(${direction}deg, ${startColor}, ${endColor})`,
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <ColorPicker
          label="Start Color"
          color={startColor}
          onChange={onStartColorChange}
        />
        <ColorPicker
          label="End Color"
          color={endColor}
          onChange={onEndColorChange}
        />
      </div>

      {/* Direction selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Direction
        </label>
        <div className="grid grid-cols-4 gap-2">
          {directions.map((dir) => (
            <button
              key={dir.value}
              type="button"
              onClick={() => onDirectionChange(dir.value)}
              className={`p-2 text-xs rounded-lg border transition-colors ${
                direction === dir.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              }`}
            >
              {dir.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
