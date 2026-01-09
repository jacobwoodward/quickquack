"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AvatarUploader } from "@/components/links/image-uploader";
import type { User, TimeFormat } from "@/lib/types/database";

interface ProfileFormProps {
  profile: User;
}

const TIME_FORMAT_OPTIONS = [
  { value: "12h", label: "12-hour (1:00 PM)" },
  { value: "24h", label: "24-hour (13:00)" },
];

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(profile.name || "");
  const [timezone, setTimezone] = useState(profile.timezone);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(profile.time_format || "12h");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("users")
      .update({
        name: name || null,
        timezone,
        time_format: timeFormat,
        avatar_url: avatarUrl || null,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      router.refresh();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          Profile updated successfully
        </div>
      )}

      {/* Avatar Upload */}
      <div className="flex items-center gap-6">
        <AvatarUploader
          userId={profile.id}
          currentUrl={avatarUrl || undefined}
          onUpload={(url) => setAvatarUrl(url)}
          onRemove={() => setAvatarUrl("")}
          size="lg"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">Profile Photo</p>
          <p className="text-sm text-gray-500 mt-1">
            Click on the image to upload a new photo. JPG, PNG, GIF or WebP. Max 5MB.
          </p>
        </div>
      </div>

      <Input
        label="Name"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />

      <Input
        label="Email"
        id="email"
        value={profile.email}
        disabled
        className="bg-gray-50"
      />

      <Select
        label="Timezone"
        id="timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        options={TIMEZONE_OPTIONS}
      />

      <Select
        label="Time Format"
        id="time_format"
        value={timeFormat}
        onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
        options={TIME_FORMAT_OPTIONS}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
