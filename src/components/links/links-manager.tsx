"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { DraggableList, DraggableItemCard } from "./draggable-list";
import { LinkEditor, AddLinkButton } from "./link-editor";
import { LivePreview } from "./theme-preview";
import { Card, CardContent } from "@/components/ui/card";
import type {
  Link,
  LinkWithEventType,
  EventType,
  PageSettings,
  LinkType,
  InsertLink,
  UpdateLink,
} from "@/lib/types/database";

interface LinksManagerProps {
  userId: string;
  initialLinks: LinkWithEventType[];
  eventTypes: EventType[];
  pageSettings: PageSettings | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export function LinksManager({
  userId,
  initialLinks,
  eventTypes,
  pageSettings,
  username,
  displayName,
  avatarUrl,
}: LinksManagerProps) {
  const router = useRouter();
  const [links, setLinks] = useState<LinkWithEventType[]>(initialLinks);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [_addingLinkType, setAddingLinkType] = useState<LinkType>("url");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map links to include event_type for display
  const linksWithEventTypes = links.map((link) => ({
    ...link,
    event_type: link.event_type_id
      ? eventTypes.find((et) => et.id === link.event_type_id) || null
      : null,
  }));

  const handleReorder = useCallback(
    async (newLinks: LinkWithEventType[]) => {
      setLinks(newLinks);

      // Update positions in database
      const supabase = createClient();
      const updates = newLinks.map((link, index) => ({
        id: link.id,
        position: index,
      }));

      for (const { id, position } of updates) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("links")
          .update({ position })
          .eq("id", id);
      }
    },
    []
  );

  const handleAddLink = (type: LinkType) => {
    setAddingLinkType(type);
    setIsAddingLink(true);
    setEditingLink(null);
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsAddingLink(false);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("links").delete().eq("id", linkId);

    if (error) {
      setError(error.message);
      return;
    }

    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    router.refresh();
  };

  const handleToggleVisibility = async (link: Link) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("links")
      .update({ is_visible: !link.is_visible })
      .eq("id", link.id);

    if (error) {
      setError(error.message);
      return;
    }

    setLinks((prev) =>
      prev.map((l) =>
        l.id === link.id ? { ...l, is_visible: !l.is_visible } : l
      )
    );
  };

  const handleSaveLink = async (data: InsertLink | UpdateLink) => {
    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    try {
      if (editingLink) {
        // Update existing link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("links")
          .update(data)
          .eq("id", editingLink.id);

        if (error) throw error;
      } else {
        // Create new link with next position
        const position = links.length;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("links").insert({
          ...data,
          position,
        });

        if (error) throw error;
      }

      // Close editor and refresh
      setIsAddingLink(false);
      setEditingLink(null);
      router.refresh();

      // Refresh links from server
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newLinks } = await (supabase as any)
        .from("links")
        .select("*, event_types(*)")
        .eq("user_id", userId)
        .order("position", { ascending: true });

      if (newLinks) {
        setLinks(newLinks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save link");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsAddingLink(false);
    setEditingLink(null);
  };

  // Get link type icon and label for display
  const getLinkTypeDisplay = (link: LinkWithEventType) => {
    const icons: Record<LinkType, React.ReactNode> = {
      url: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      event: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      email: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      phone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
        </svg>
      ),
      heading: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M6 12h12" />
          <path d="M6 4v16" />
          <path d="M18 4v16" />
        </svg>
      ),
      divider: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      social: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
        </svg>
      ),
      embed: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      music: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      ),
      video: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    };

    return icons[link.link_type] || icons.url;
  };

  // Generate settings for preview (map snake_case to camelCase)
  const previewSettings = pageSettings
    ? {
        theme: pageSettings.theme,
        primaryColor: pageSettings.primary_color,
        backgroundColor: pageSettings.background_color,
        textColor: pageSettings.text_color,
        backgroundType: pageSettings.background_type,
        gradientStart: pageSettings.gradient_start,
        gradientEnd: pageSettings.gradient_end,
        gradientDirection: pageSettings.gradient_direction,
        buttonStyle: pageSettings.button_style,
        buttonColor: pageSettings.button_color,
        buttonTextColor: pageSettings.button_text_color,
        showAvatar: pageSettings.show_avatar,
        showBio: pageSettings.show_bio,
      }
    : {
        theme: "minimal" as const,
        primaryColor: "#000000",
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
        backgroundType: "solid" as const,
        gradientStart: null,
        gradientEnd: null,
        gradientDirection: null,
        buttonStyle: "rounded" as const,
        buttonColor: null,
        buttonTextColor: null,
        showAvatar: true,
        showBio: true,
      };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Links management */}
      <div className="lg:col-span-2 space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 text-red-700 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Add/Edit form */}
        <AnimatePresence mode="wait">
          {(isAddingLink || editingLink) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <LinkEditor
                    key={editingLink?.id || "new"}
                    link={editingLink || undefined}
                    userId={userId}
                    eventTypes={eventTypes}
                    onSave={handleSaveLink}
                    onCancel={handleCancel}
                    isLoading={isSaving}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add link button */}
        {!isAddingLink && !editingLink && (
          <AddLinkButton onSelect={handleAddLink} />
        )}

        {/* Links list */}
        {links.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-12 h-12 mx-auto"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No links yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Add your first link to get started building your page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <DraggableList
            items={linksWithEventTypes}
            onReorder={handleReorder}
            renderItem={(link, dragHandleProps) => (
              <DraggableItemCard
                dragHandleProps={dragHandleProps}
                onEdit={() => handleEditLink(link)}
                onDelete={() => handleDeleteLink(link.id)}
                onToggleVisibility={() => handleToggleVisibility(link)}
                isVisible={link.is_visible}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">
                    {getLinkTypeDisplay(link)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {link.title}
                    </h4>
                    {link.link_type === "event" && link.event_type && (
                      <p className="text-sm text-gray-500">
                        {link.event_type.length} minute booking
                      </p>
                    )}
                    {link.url && link.link_type !== "event" && (
                      <p className="text-sm text-gray-500 truncate">
                        {link.url}
                      </p>
                    )}
                  </div>
                  {link.click_count > 0 && (
                    <span className="text-xs text-gray-400">
                      {link.click_count} clicks
                    </span>
                  )}
                </div>
              </DraggableItemCard>
            )}
            renderDragOverlay={(link) => (
              <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">
                    {getLinkTypeDisplay(link)}
                  </span>
                  <span className="font-medium text-gray-900">{link.title}</span>
                </div>
              </div>
            )}
          />
        )}
      </div>

      {/* Preview panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
          <Card className="overflow-hidden">
            <LivePreview
              settings={previewSettings}
              user={{ name: displayName || username || "Your Name", avatarUrl: avatarUrl }}
              bio={pageSettings?.bio}
              links={linksWithEventTypes.filter((l) => l.is_visible)}
              className="rounded-lg"
            />
          </Card>
          <p className="mt-3 text-xs text-gray-500 text-center">
            Your public page is at the root URL
          </p>
        </div>
      </div>
    </div>
  );
}
