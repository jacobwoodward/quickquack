"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ColorPicker } from "./color-picker";
import { ImageUploader } from "./image-uploader";
import type {
  Link,
  LinkType,
  LinkDisplayStyle,
  IconType,
  EventType,
  InsertLink,
  UpdateLink,
} from "@/lib/types/database";

const linkTypeOptions = [
  { value: "url", label: "URL Link" },
  { value: "event", label: "Booking Event" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "heading", label: "Section Heading" },
  { value: "divider", label: "Divider" },
];

const displayStyleOptions = [
  { value: "standard", label: "Standard Button" },
  { value: "featured", label: "Featured Card" },
  { value: "compact", label: "Compact" },
  { value: "icon_only", label: "Icon Only" },
];

const iconTypeOptions = [
  { value: "lucide", label: "Default Icon" },
  { value: "emoji", label: "Emoji" },
  { value: "custom", label: "Custom Image" },
  { value: "none", label: "No Icon" },
];

// Common emojis for quick selection
const commonEmojis = ["🔗", "📧", "📞", "📅", "💼", "🎵", "🎬", "📸", "💬", "🛒", "📝", "🎯"];

interface LinkEditorProps {
  link?: Link;
  userId: string;
  eventTypes?: EventType[];
  onSave: (data: InsertLink | UpdateLink) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function LinkEditor({
  link,
  userId,
  eventTypes = [],
  onSave,
  onCancel,
  isLoading = false,
}: LinkEditorProps) {
  const [linkType, setLinkType] = useState<LinkType>(link?.link_type || "url");
  const [title, setTitle] = useState(link?.title || "");
  const [description, setDescription] = useState(link?.description || "");
  const [url, setUrl] = useState(link?.url || "");
  const [eventTypeId, setEventTypeId] = useState(link?.event_type_id || "");
  const [displayStyle, setDisplayStyle] = useState<LinkDisplayStyle>(
    link?.display_style || "standard"
  );
  const [iconType, setIconType] = useState<IconType>(link?.icon_type || "lucide");
  const [iconValue, setIconValue] = useState(link?.icon_value || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(link?.thumbnail_url || "");
  const [backgroundColor, setBackgroundColor] = useState(link?.background_color || "");
  const [textColor, setTextColor] = useState(link?.text_color || "");
  const [isVisible, setIsVisible] = useState(link?.is_visible ?? true);
  const [isFeatured, setIsFeatured] = useState(link?.is_featured ?? false);

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync form state when link prop changes (for edit mode)
  // This is an intentional pattern for syncing props to form state
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (link) {
      setLinkType(link.link_type);
      setTitle(link.title);
      setDescription(link.description || "");
      setUrl(link.url || "");
      setEventTypeId(link.event_type_id || "");
      setDisplayStyle(link.display_style);
      setIconType(link.icon_type);
      setIconValue(link.icon_value || "");
      setThumbnailUrl(link.thumbnail_url || "");
      setBackgroundColor(link.background_color || "");
      setTextColor(link.text_color || "");
      setIsVisible(link.is_visible);
      setIsFeatured(link.is_featured);
    } else {
      // Reset to defaults for new link
      setLinkType("url");
      setTitle("");
      setDescription("");
      setUrl("");
      setEventTypeId("");
      setDisplayStyle("standard");
      setIconType("lucide");
      setIconValue("");
      setThumbnailUrl("");
      setBackgroundColor("");
      setTextColor("");
      setIsVisible(true);
      setIsFeatured(false);
    }
  }, [link]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Update URL format based on link type
  useEffect(() => {
    if (linkType === "email" && url && !url.startsWith("mailto:")) {
      // Don't auto-prefix, let user enter email
    } else if (linkType === "phone" && url && !url.startsWith("tel:")) {
      // Don't auto-prefix, let user enter phone
    }
  }, [linkType, url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalUrl = url;
    if (linkType === "email" && url && !url.startsWith("mailto:")) {
      finalUrl = `mailto:${url}`;
    } else if (linkType === "phone" && url && !url.startsWith("tel:")) {
      finalUrl = `tel:${url}`;
    }

    const data: InsertLink | UpdateLink = {
      user_id: userId,
      link_type: linkType,
      title,
      description: description || null,
      url: finalUrl || null,
      event_type_id: linkType === "event" ? eventTypeId || null : null,
      display_style: displayStyle,
      icon_type: iconType,
      icon_value: iconValue || null,
      thumbnail_url: thumbnailUrl || null,
      background_color: backgroundColor || null,
      text_color: textColor || null,
      is_visible: isVisible,
      is_featured: isFeatured,
    };

    await onSave(data);
  };

  const needsUrl = ["url", "email", "phone"].includes(linkType);
  const needsEvent = linkType === "event";
  const canHaveThumbnail = displayStyle === "featured";

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Link Type */}
      <Select
        label="Link Type"
        id="linkType"
        value={linkType}
        onChange={(e) => setLinkType(e.target.value as LinkType)}
        options={linkTypeOptions}
      />

      {/* Title */}
      {linkType !== "divider" && (
        <Input
          label="Title"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            linkType === "heading"
              ? "Section name..."
              : linkType === "event"
              ? "Book a meeting"
              : "Link title..."
          }
          required
        />
      )}

      {/* Description (optional) */}
      {linkType !== "divider" && displayStyle !== "compact" && displayStyle !== "icon_only" && (
        <Textarea
          label="Description (optional)"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description..."
          rows={2}
        />
      )}

      {/* URL input for url/email/phone types */}
      {needsUrl && (
        <Input
          label={
            linkType === "email"
              ? "Email Address"
              : linkType === "phone"
              ? "Phone Number"
              : "URL"
          }
          id="url"
          type={linkType === "email" ? "email" : linkType === "phone" ? "tel" : "url"}
          value={url.replace("mailto:", "").replace("tel:", "")}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            linkType === "email"
              ? "hello@example.com"
              : linkType === "phone"
              ? "+1 (555) 123-4567"
              : "https://..."
          }
          required
        />
      )}

      {/* Event type selector */}
      {needsEvent && (
        <Select
          label="Event Type"
          id="eventType"
          value={eventTypeId}
          onChange={(e) => setEventTypeId(e.target.value)}
          options={[
            { value: "", label: "Select an event type..." },
            ...eventTypes.map((et) => ({
              value: et.id,
              label: `${et.title} (${et.length}m)`,
            })),
          ]}
          required
        />
      )}

      {/* Display Style (for non-special types) */}
      {!["heading", "divider"].includes(linkType) && (
        <Select
          label="Display Style"
          id="displayStyle"
          value={displayStyle}
          onChange={(e) => setDisplayStyle(e.target.value as LinkDisplayStyle)}
          options={displayStyleOptions}
        />
      )}

      {/* Thumbnail for featured style */}
      {canHaveThumbnail && (
        <ImageUploader
          bucket="link-images"
          userId={userId}
          currentUrl={thumbnailUrl}
          onUpload={setThumbnailUrl}
          onRemove={() => setThumbnailUrl("")}
          aspectRatio="video"
          label="Thumbnail Image"
          hint="Recommended: 800x450px (16:9 ratio)"
        />
      )}

      {/* Icon selection */}
      {!["heading", "divider"].includes(linkType) && (
        <div className="space-y-3">
          <Select
            label="Icon"
            id="iconType"
            value={iconType}
            onChange={(e) => setIconType(e.target.value as IconType)}
            options={iconTypeOptions}
          />

          {iconType === "emoji" && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIconValue(emoji)}
                    className={`w-10 h-10 text-xl rounded-lg border transition-all ${
                      iconValue === emoji
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <Input
                id="customEmoji"
                value={iconValue}
                onChange={(e) => setIconValue(e.target.value)}
                placeholder="Or type your own emoji..."
                className="text-center text-xl"
              />
            </div>
          )}

          {iconType === "custom" && (
            <ImageUploader
              bucket="link-images"
              userId={userId}
              currentUrl={iconValue}
              onUpload={setIconValue}
              onRemove={() => setIconValue("")}
              aspectRatio="square"
              maxSizeMB={1}
              hint="Recommended: 64x64px PNG with transparent background"
            />
          )}
        </div>
      )}

      {/* Advanced options toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Advanced options
      </button>

      {/* Advanced options */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-2"
        >
          {/* Custom colors */}
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              label="Background Color"
              color={backgroundColor || "#FFFFFF"}
              onChange={setBackgroundColor}
            />
            <ColorPicker
              label="Text Color"
              color={textColor || "#000000"}
              onChange={setTextColor}
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Visible</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : link ? "Update Link" : "Add Link"}
        </Button>
      </div>
    </motion.form>
  );
}

// Add link button with type selector
interface AddLinkButtonProps {
  onSelect: (type: LinkType) => void;
}

export function AddLinkButton({ onSelect }: AddLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickOptions: Array<{ type: LinkType; label: string; icon: React.ReactNode }> = [
    {
      type: "url",
      label: "Add Link",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      type: "event",
      label: "Add Event",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      type: "heading",
      label: "Add Heading",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M6 12h12" />
          <path d="M6 4v16" />
          <path d="M18 4v16" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 mr-2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Link
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-20"
          >
            {quickOptions.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onSelect(type);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-500">{icon}</span>
                <span className="font-medium text-gray-900">{label}</span>
              </button>
            ))}
            <div className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  onSelect("email");
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
              >
                More options...
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
