"use client";

import { motion } from "framer-motion";
import { themeConfigs } from "@/components/links/theme-preview";
import { SocialIconsRow } from "@/components/links/social-icons";
import { LinkCard } from "@/components/links/link-card";
import type {
  User,
  EventType,
  PageSettings,
  Link as LinkType,
  SocialProfile,
  LinkWithEventType,
  PageTheme,
  ButtonStyle,
} from "@/lib/types/database";

interface PublicPageProps {
  user: User;
  pageSettings: PageSettings | null;
  links: (LinkType & { event_types: EventType | null })[];
  eventTypes: EventType[];
  socialProfiles: SocialProfile[];
  /** Base URL for event type links. Defaults to /book */
  baseUrl?: string;
}

// Default settings when none exist
const defaultSettings: Omit<PageSettings, "user_id" | "created_at" | "updated_at"> = {
  page_title: null,
  bio: null,
  theme: "minimal",
  primary_color: "#000000",
  secondary_color: "#6B7280",
  background_color: "#FFFFFF",
  text_color: "#111827",
  background_type: "solid",
  background_image_url: null,
  gradient_start: null,
  gradient_end: null,
  gradient_direction: null,
  button_style: "rounded",
  button_color: "#FFFFFF",
  button_text_color: "#000000",
  font_family: "Inter, system-ui, sans-serif",
  layout: "list",
  show_avatar: true,
  show_bio: true,
  show_social_icons: true,
  social_icon_style: "filled",
  hide_branding: false,
  custom_css: null,
};

export function PublicPage({
  user,
  pageSettings,
  links,
  eventTypes,
  socialProfiles,
  baseUrl,
}: PublicPageProps) {
  // Merge settings with defaults
  const settings = { ...defaultSettings, ...pageSettings };
  const themeConfig = themeConfigs[settings.theme as PageTheme];

  // Get effective colors (use theme config as fallback)
  const backgroundColor = settings.background_color || themeConfig.backgroundColor;
  const textColor = settings.text_color || themeConfig.textColor;
  const buttonColor = settings.button_color || themeConfig.buttonColor;
  const buttonTextColor = settings.button_text_color || themeConfig.buttonTextColor;
  const buttonStyle = (settings.button_style || themeConfig.buttonStyle) as ButtonStyle;

  // Build background style
  const getBackgroundStyle = () => {
    if (settings.background_type === "gradient" && settings.gradient_start && settings.gradient_end) {
      return {
        background: `linear-gradient(${settings.gradient_direction || 135}deg, ${settings.gradient_start}, ${settings.gradient_end})`,
      };
    }
    if (settings.background_type === "image" && settings.background_image_url) {
      return {
        backgroundImage: `url(${settings.background_image_url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      };
    }
    return { backgroundColor };
  };

  // Convert links to display format
  const displayLinks: LinkWithEventType[] = links.map((link) => ({
    ...link,
    event_type: link.event_types || undefined,
  }));

  // If no custom links exist, create links from event types
  const hasCustomLinks = links.length > 0;
  const fallbackLinks: LinkWithEventType[] = !hasCustomLinks
    ? eventTypes.map((et, index) => ({
        id: et.id,
        user_id: user.id,
        position: index,
        link_type: "event" as const,
        title: et.title,
        description: et.description,
        url: `/book/${et.slug}`,
        event_type_id: et.id,
        display_style: "standard" as const,
        icon_type: "lucide" as const,
        icon_value: null,
        thumbnail_url: null,
        background_color: null,
        text_color: null,
        is_visible: true,
        is_featured: false,
        visible_from: null,
        visible_until: null,
        click_count: 0,
        embed_html: null,
        created_at: et.created_at,
        updated_at: et.updated_at,
        event_type: et,
      }))
    : [];

  const allLinks = hasCustomLinks ? displayLinks : fallbackLinks;

  // Filter visible links (check time-based visibility)
  const now = new Date();
  const visibleLinks = allLinks.filter((link) => {
    if (link.visible_from && new Date(link.visible_from) > now) return false;
    if (link.visible_until && new Date(link.visible_until) < now) return false;
    return true;
  });

  // Separate icon-only links for the social row
  const iconOnlyLinks = visibleLinks.filter((l) => l.display_style === "icon_only");
  const regularLinks = visibleLinks.filter((l) => l.display_style !== "icon_only");

  // Display name below profile photo - always use user's name from profile settings
  const displayName = user.name || user.username;

  // Base URL for event links (defaults to /book)
  const eventBaseUrl = baseUrl ?? "/book";

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Handle link click tracking
  const handleLinkClick = async (link: LinkWithEventType) => {
    // Track click asynchronously
    try {
      await fetch("/api/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: link.id }),
      });
    } catch {
      // Silently fail - don't block navigation
    }
  };

  // Get link URL
  const getLinkUrl = (link: LinkWithEventType) => {
    if (link.link_type === "event" && link.event_type) {
      return `${eventBaseUrl}/${link.event_type.slug}`;
    }
    return link.url || "#";
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ...getBackgroundStyle(),
        color: textColor,
        fontFamily: settings.font_family,
      }}
    >
      {/* Add overlay for image backgrounds */}
      {settings.background_type === "image" && settings.background_image_url && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        />
      )}

      <motion.div
        className="relative max-w-lg mx-auto px-4 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          {/* Avatar */}
          {settings.show_avatar && (
            <div className="mb-4">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={displayName ?? ''}
                  className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white/20 shadow-lg"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold"
                  style={{
                    backgroundColor: settings.primary_color,
                    color: buttonTextColor,
                  }}
                >
                  {(displayName ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Name */}
          <h1 className="text-2xl font-bold">{displayName}</h1>

          {/* Bio */}
          {settings.show_bio && settings.bio && (
            <p className="mt-2 opacity-80 max-w-sm mx-auto">{settings.bio}</p>
          )}

          {/* Social Icons */}
          {settings.show_social_icons && socialProfiles.length > 0 && (
            <div className="mt-4">
              <SocialIconsRow
                profiles={socialProfiles.map((sp) => ({
                  platform: sp.platform,
                  url: sp.url,
                }))}
                iconStyle={settings.social_icon_style || "filled"}
                size="md"
              />
            </div>
          )}
        </motion.div>

        {/* Icon-only links row (if any) */}
        {iconOnlyLinks.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-3 mb-6 flex-wrap"
          >
            {iconOnlyLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                buttonStyle={buttonStyle}
                defaultButtonColor={buttonColor}
                defaultTextColor={buttonTextColor}
                href={getLinkUrl(link)}
                isInternal={link.link_type === "event"}
                onClick={() => handleLinkClick(link)}
              />
            ))}
          </motion.div>
        )}

        {/* Regular Links */}
        <motion.div variants={containerVariants} className="space-y-3">
          {regularLinks.map((link) => (
            <motion.div key={link.id} variants={itemVariants}>
              <LinkCard
                link={link}
                buttonStyle={buttonStyle}
                defaultButtonColor={buttonColor}
                defaultTextColor={buttonTextColor}
                href={getLinkUrl(link)}
                isInternal={link.link_type === "event"}
                onClick={() => handleLinkClick(link)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state */}
        {regularLinks.length === 0 && iconOnlyLinks.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="text-center py-12 opacity-60"
          >
            <p>No links available yet.</p>
          </motion.div>
        )}

      </motion.div>

      {/* Custom CSS - using children instead of dangerouslySetInnerHTML for XSS prevention */}
      {settings.custom_css && <style>{settings.custom_css}</style>}
    </div>
  );
}
