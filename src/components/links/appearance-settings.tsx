"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeGrid, LivePreview, themeConfigs } from "./theme-preview";
import { ColorPicker, GradientPicker } from "./color-picker";
import { ImageUploader } from "./image-uploader";
import { IconStyleGrid } from "./social-icons";
import type {
  PageSettings,
  PageTheme,
  BackgroundType,
  ButtonStyle,
  Link,
  UpdatePageSettings,
  SocialProfile,
  SocialIconStyle,
} from "@/lib/types/database";

const buttonStyleOptions = [
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
  { value: "square", label: "Square" },
  { value: "outline", label: "Outline" },
  { value: "shadow", label: "Shadow" },
  { value: "3d", label: "3D" },
];

const backgroundTypeOptions = [
  { value: "solid", label: "Solid Color" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
];

const fontOptions = [
  { value: "Inter, system-ui, sans-serif", label: "Inter (Modern)" },
  { value: "Georgia, serif", label: "Georgia (Classic)" },
  { value: "monospace", label: "Monospace (Technical)" },
  { value: "'Playfair Display', serif", label: "Playfair (Elegant)" },
  { value: "'Space Grotesk', sans-serif", label: "Space Grotesk (Geometric)" },
];

interface AppearanceSettingsProps {
  userId: string;
  initialSettings: PageSettings;
  user: {
    name: string | null;
    avatarUrl: string | null;
    username: string | null;
  };
  links: Link[];
  socialProfiles: SocialProfile[];
}

export function AppearanceSettings({
  userId,
  initialSettings,
  user,
  links,
  socialProfiles,
}: AppearanceSettingsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [pageTitle, setPageTitle] = useState(initialSettings.page_title || "");
  const [theme, setTheme] = useState<PageTheme>(initialSettings.theme);
  const [bio, setBio] = useState(initialSettings.bio || "");
  const [primaryColor, setPrimaryColor] = useState(initialSettings.primary_color);
  const [backgroundColor, setBackgroundColor] = useState(initialSettings.background_color);
  const [textColor, setTextColor] = useState(initialSettings.text_color);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(initialSettings.background_type);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(initialSettings.background_image_url || "");
  const [gradientStart, setGradientStart] = useState(initialSettings.gradient_start || "#4F46E5");
  const [gradientEnd, setGradientEnd] = useState(initialSettings.gradient_end || "#EC4899");
  const [gradientDirection, setGradientDirection] = useState(initialSettings.gradient_direction || 135);
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(initialSettings.button_style);
  const [buttonColor, setButtonColor] = useState(initialSettings.button_color || "#FFFFFF");
  const [buttonTextColor, setButtonTextColor] = useState(initialSettings.button_text_color || "#000000");
  const [fontFamily, setFontFamily] = useState(initialSettings.font_family);
  const [showAvatar, setShowAvatar] = useState(initialSettings.show_avatar);
  const [showBio, setShowBio] = useState(initialSettings.show_bio);
  const [showSocialIcons, setShowSocialIcons] = useState(initialSettings.show_social_icons);
  const [socialIconStyle, setSocialIconStyle] = useState<SocialIconStyle>(initialSettings.social_icon_style || "filled");

  // Apply theme preset
  const handleThemeSelect = (newTheme: PageTheme) => {
    setTheme(newTheme);
    const config = themeConfigs[newTheme];
    setPrimaryColor(config.primaryColor);
    setBackgroundColor(config.backgroundColor);
    setTextColor(config.textColor);
    setBackgroundType(config.backgroundType);
    setButtonStyle(config.buttonStyle);
    setButtonColor(config.buttonColor);
    setButtonTextColor(config.buttonTextColor);
    setFontFamily(config.fontFamily);

    if (config.gradientStart) setGradientStart(config.gradientStart);
    if (config.gradientEnd) setGradientEnd(config.gradientEnd);
    if (config.gradientDirection) setGradientDirection(config.gradientDirection);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    const data: UpdatePageSettings = {
      page_title: pageTitle || null,
      theme,
      bio: bio || null,
      primary_color: primaryColor,
      background_color: backgroundColor,
      text_color: textColor,
      background_type: backgroundType,
      background_image_url: backgroundType === "image" ? backgroundImageUrl : null,
      gradient_start: backgroundType === "gradient" ? gradientStart : null,
      gradient_end: backgroundType === "gradient" ? gradientEnd : null,
      gradient_direction: backgroundType === "gradient" ? gradientDirection : null,
      button_style: buttonStyle,
      button_color: buttonColor,
      button_text_color: buttonTextColor,
      font_family: fontFamily,
      show_avatar: showAvatar,
      show_bio: showBio,
      show_social_icons: showSocialIcons,
      social_icon_style: socialIconStyle,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("page_settings")
      .update(data)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    }

    setIsSaving(false);
  };

  // Generate preview settings
  const previewSettings = {
    theme,
    primaryColor,
    backgroundColor,
    textColor,
    backgroundType,
    gradientStart: backgroundType === "gradient" ? gradientStart : null,
    gradientEnd: backgroundType === "gradient" ? gradientEnd : null,
    gradientDirection: backgroundType === "gradient" ? gradientDirection : null,
    buttonStyle,
    buttonColor,
    buttonTextColor,
    showAvatar,
    showBio,
    showSocialIcons,
    socialIconStyle,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings panel */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 text-red-700 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-green-50 text-green-700 rounded-lg text-sm"
          >
            Settings saved successfully!
          </motion.div>
        )}

        {/* Theme selector */}
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeGrid selectedTheme={theme} onSelectTheme={handleThemeSelect} />
          </CardContent>
        </Card>

        {/* Profile settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Page Title"
              id="pageTitle"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="My Links"
            />

            <Textarea
              label="Bio"
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={3}
            />

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAvatar}
                  onChange={(e) => setShowAvatar(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show avatar</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showBio}
                  onChange={(e) => setShowBio(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show bio</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSocialIcons}
                  onChange={(e) => setShowSocialIcons(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show social icons</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Social Icon Style */}
        {showSocialIcons && socialProfiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Social Icon Style</CardTitle>
            </CardHeader>
            <CardContent>
              <IconStyleGrid
                selectedStyle={socialIconStyle}
                onSelectStyle={setSocialIconStyle}
              />
            </CardContent>
          </Card>
        )}

        {/* Background settings */}
        <Card>
          <CardHeader>
            <CardTitle>Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Background Type"
              id="backgroundType"
              value={backgroundType}
              onChange={(e) => setBackgroundType(e.target.value as BackgroundType)}
              options={backgroundTypeOptions}
            />

            {backgroundType === "solid" && (
              <ColorPicker
                label="Background Color"
                color={backgroundColor}
                onChange={setBackgroundColor}
              />
            )}

            {backgroundType === "gradient" && (
              <GradientPicker
                startColor={gradientStart}
                endColor={gradientEnd}
                direction={gradientDirection}
                onStartColorChange={setGradientStart}
                onEndColorChange={setGradientEnd}
                onDirectionChange={setGradientDirection}
              />
            )}

            {backgroundType === "image" && (
              <ImageUploader
                bucket="backgrounds"
                userId={userId}
                currentUrl={backgroundImageUrl}
                onUpload={setBackgroundImageUrl}
                onRemove={() => setBackgroundImageUrl("")}
                aspectRatio="video"
                label="Background Image"
                hint="Recommended: 1920x1080px or higher"
              />
            )}

            <ColorPicker
              label="Text Color"
              color={textColor}
              onChange={setTextColor}
            />
          </CardContent>
        </Card>

        {/* Button settings */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Button Style"
              id="buttonStyle"
              value={buttonStyle}
              onChange={(e) => setButtonStyle(e.target.value as ButtonStyle)}
              options={buttonStyleOptions}
            />

            <div className="grid grid-cols-2 gap-4">
              <ColorPicker
                label="Button Color"
                color={buttonColor}
                onChange={setButtonColor}
              />
              <ColorPicker
                label="Button Text Color"
                color={buttonTextColor}
                onChange={setButtonTextColor}
              />
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              label="Font Family"
              id="fontFamily"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              options={fontOptions}
            />
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Preview panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Live Preview</h3>
          <Card className="overflow-hidden">
            <LivePreview
              settings={previewSettings}
              user={{
                name: user.name,
                avatarUrl: user.avatarUrl,
              }}
              bio={showBio ? bio : undefined}
              links={links.map((l) => ({ id: l.id, title: l.title }))}
              socialProfiles={socialProfiles
                .filter((p) => p.is_visible)
                .map((p) => ({ platform: p.platform, url: p.url }))}
              className="rounded-lg min-h-[500px]"
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
