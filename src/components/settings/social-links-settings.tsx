"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SocialIcon, platformNames, platformColors } from "@/components/links/social-icons";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { SocialProfile, SocialPlatform, InsertSocialProfile } from "@/lib/types/database";

// Top platforms to show first
const topPlatforms: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "twitter",
];

// All platform options for the select
const platformOptions: { value: SocialPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "twitch", label: "Twitch" },
  { value: "discord", label: "Discord" },
  { value: "spotify", label: "Spotify" },
  { value: "snapchat", label: "Snapchat" },
  { value: "pinterest", label: "Pinterest" },
  { value: "threads", label: "Threads" },
  { value: "mastodon", label: "Mastodon" },
  { value: "bluesky", label: "Bluesky" },
  { value: "other", label: "Other Website" },
];

// URL placeholders for each platform
const urlPlaceholders: Record<SocialPlatform, string> = {
  instagram: "https://instagram.com/username",
  twitter: "https://x.com/username",
  tiktok: "https://tiktok.com/@username",
  youtube: "https://youtube.com/@channel",
  linkedin: "https://linkedin.com/in/username",
  github: "https://github.com/username",
  facebook: "https://facebook.com/username",
  twitch: "https://twitch.tv/username",
  discord: "https://discord.gg/invite",
  spotify: "https://open.spotify.com/artist/...",
  snapchat: "https://snapchat.com/add/username",
  pinterest: "https://pinterest.com/username",
  threads: "https://threads.net/@username",
  mastodon: "https://mastodon.social/@username",
  bluesky: "https://bsky.app/profile/username",
  other: "https://yourwebsite.com",
};

interface SocialLinksSettingsProps {
  userId: string;
  initialProfiles: SocialProfile[];
}

// Draggable item component (needed to use useDragControls hook)
interface DraggableItemProps {
  profile: SocialProfile;
  editingId: string | null;
  editUrl: string;
  isSaving: boolean;
  onEdit: (id: string, url: string) => void;
  onCancelEdit: () => void;
  onUpdateProfile: (id: string) => void;
  onEditUrlChange: (url: string) => void;
  onToggleVisibility: (profile: SocialProfile) => void;
  onDelete: (id: string) => void;
}

function DraggableItem({
  profile,
  editingId,
  editUrl,
  isSaving,
  onEdit,
  onCancelEdit,
  onUpdateProfile,
  onEditUrlChange,
  onToggleVisibility,
  onDelete,
}: DraggableItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={profile}
      id={profile.id}
      dragListener={false}
      dragControls={dragControls}
      className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${
        profile.is_visible ? "border-gray-200" : "border-gray-200 opacity-50"
      }`}
    >
      <div
        className="text-gray-400 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: platformColors[profile.platform], color: "white" }}
      >
        <SocialIcon platform={profile.platform} />
      </div>

      {editingId === profile.id ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            type="url"
            value={editUrl}
            onChange={(e) => onEditUrlChange(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => onUpdateProfile(profile.id)}
            disabled={isSaving}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelEdit}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{platformNames[profile.platform]}</p>
            <p className="text-xs text-gray-500 truncate">{profile.url}</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(profile.id, profile.url)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </button>

            <button
              onClick={() => onToggleVisibility(profile)}
              className={`p-2 transition-colors ${
                profile.is_visible
                  ? "text-gray-400 hover:text-gray-600"
                  : "text-gray-300 hover:text-gray-500"
              }`}
              title={profile.is_visible ? "Hide" : "Show"}
            >
              {profile.is_visible ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              )}
            </button>

            <button
              onClick={() => onDelete(profile.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </Reorder.Item>
  );
}

export function SocialLinksSettings({ userId, initialProfiles }: SocialLinksSettingsProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<SocialProfile[]>(initialProfiles);
  const [isAdding, setIsAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>("instagram");
  const [newUrl, setNewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  // Get platforms that haven't been added yet
  const availablePlatforms = platformOptions.filter(
    (p) => !profiles.some((profile) => profile.platform === p.value) || p.value === "other"
  );

  const handleQuickAdd = async (platform: SocialPlatform) => {
    setNewPlatform(platform);
    setNewUrl("");
    setIsAdding(true);
  };

  const handleAddProfile = async () => {
    if (!newUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createClient();
    const position = profiles.length;

    const newProfile: InsertSocialProfile = {
      user_id: userId,
      platform: newPlatform,
      url: newUrl,
      position,
      is_visible: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: insertError } = await (supabase as any)
      .from("social_profiles")
      .insert(newProfile)
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setProfiles([...profiles, data]);
      setIsAdding(false);
      setNewUrl("");
      router.refresh();
    }

    setIsSaving(false);
  };

  const handleUpdateProfile = async (id: string) => {
    if (!editUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    try {
      new URL(editUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("social_profiles")
      .update({ url: editUrl })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfiles(profiles.map((p) => (p.id === id ? { ...p, url: editUrl } : p)));
      setEditingId(null);
      router.refresh();
    }

    setIsSaving(false);
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Remove this social link?")) return;

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from("social_profiles")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setProfiles(profiles.filter((p) => p.id !== id));
    router.refresh();
  };

  const handleToggleVisibility = async (profile: SocialProfile) => {
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("social_profiles")
      .update({ is_visible: !profile.is_visible })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProfiles(
      profiles.map((p) => (p.id === profile.id ? { ...p, is_visible: !p.is_visible } : p))
    );
  };

  const handleReorder = async (newOrder: SocialProfile[]) => {
    // Update local state immediately for smooth UX
    setProfiles(newOrder);

    // Update positions in database
    const supabase = createClient();

    // Update each profile's position
    const updates = newOrder.map((profile, index) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("social_profiles")
        .update({ position: index })
        .eq("id", profile.id)
    );

    try {
      await Promise.all(updates);
      router.refresh();
    } catch (_err) {
      setError("Failed to save new order");
    }
  };

  // Filter top platforms that haven't been added
  const quickAddPlatforms = topPlatforms.filter(
    (platform) => !profiles.some((p) => p.platform === platform)
  );

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 text-red-700 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Quick Add Buttons */}
      {quickAddPlatforms.length > 0 && !isAdding && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Quick add popular platforms:</p>
          <div className="flex flex-wrap gap-2">
            {quickAddPlatforms.map((platform) => (
              <button
                key={platform}
                onClick={() => handleQuickAdd(platform)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-gray-900"
              >
                <SocialIcon platform={platform} colored />
                <span className="text-sm font-medium">{platformNames[platform]}</span>
              </button>
            ))}
            <button
              onClick={() => {
                setIsAdding(true);
                setNewPlatform(availablePlatforms[0]?.value || "other");
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-600"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">More</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: platformColors[newPlatform], color: "white" }}
                >
                  <SocialIcon platform={newPlatform} />
                </div>
                <Select
                  id="platform"
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                  options={availablePlatforms}
                  className="flex-1"
                />
              </div>

              <Input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder={urlPlaceholders[newPlatform]}
                className="w-full"
              />

              <div className="flex gap-2">
                <Button onClick={handleAddProfile} disabled={isSaving}>
                  {isSaving ? "Adding..." : "Add Link"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Profiles */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Your social links:</p>
          <Reorder.Group
            axis="y"
            values={profiles}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {profiles.map((profile) => (
              <DraggableItem
                key={profile.id}
                profile={profile}
                editingId={editingId}
                editUrl={editUrl}
                isSaving={isSaving}
                onEdit={(id, url) => {
                  setEditingId(id);
                  setEditUrl(url);
                }}
                onCancelEdit={() => setEditingId(null)}
                onUpdateProfile={handleUpdateProfile}
                onEditUrlChange={setEditUrl}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDeleteProfile}
              />
            ))}
          </Reorder.Group>
        </div>
      )}

      {/* Empty State */}
      {profiles.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No social links added yet.</p>
          <p className="text-sm">Add your social profiles to display them on your page.</p>
        </div>
      )}
    </div>
  );
}
