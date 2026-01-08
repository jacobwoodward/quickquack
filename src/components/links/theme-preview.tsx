"use client";

import { motion } from "framer-motion";
import { SocialIconsRow } from "./social-icons";
import type { PageTheme, ButtonStyle, BackgroundType, SocialPlatform, SocialIconStyle } from "@/lib/types/database";

// Theme definitions with all style properties
export interface ThemeConfig {
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  backgroundType: BackgroundType;
  gradientStart?: string;
  gradientEnd?: string;
  gradientDirection?: number;
  buttonStyle: ButtonStyle;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
}

export const themeConfigs: Record<PageTheme, ThemeConfig> = {
  minimal: {
    name: "Minimal",
    description: "Clean and simple",
    primaryColor: "#000000",
    secondaryColor: "#6B7280",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    backgroundType: "solid",
    buttonStyle: "rounded",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#111827",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  bold: {
    name: "Bold",
    description: "Strong and vibrant",
    primaryColor: "#DC2626",
    secondaryColor: "#F97316",
    backgroundColor: "#18181B",
    textColor: "#FFFFFF",
    backgroundType: "solid",
    buttonStyle: "pill",
    buttonColor: "#DC2626",
    buttonTextColor: "#FFFFFF",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  gradient: {
    name: "Gradient",
    description: "Colorful backgrounds",
    primaryColor: "#8B5CF6",
    secondaryColor: "#EC4899",
    backgroundColor: "#1E1B4B",
    textColor: "#FFFFFF",
    backgroundType: "gradient",
    gradientStart: "#4F46E5",
    gradientEnd: "#EC4899",
    gradientDirection: 135,
    buttonStyle: "pill",
    buttonColor: "rgba(255,255,255,0.2)",
    buttonTextColor: "#FFFFFF",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  glassmorphism: {
    name: "Glass",
    description: "Frosted glass effect",
    primaryColor: "#6366F1",
    secondaryColor: "#8B5CF6",
    backgroundColor: "#0F172A",
    textColor: "#F1F5F9",
    backgroundType: "gradient",
    gradientStart: "#1E3A5F",
    gradientEnd: "#312E81",
    gradientDirection: 160,
    buttonStyle: "rounded",
    buttonColor: "rgba(255,255,255,0.1)",
    buttonTextColor: "#FFFFFF",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  brutalist: {
    name: "Brutalist",
    description: "Raw and bold",
    primaryColor: "#000000",
    secondaryColor: "#000000",
    backgroundColor: "#FEF08A",
    textColor: "#000000",
    backgroundType: "solid",
    buttonStyle: "square",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#000000",
    fontFamily: "monospace",
  },
  neon: {
    name: "Neon",
    description: "Glowing cyber vibes",
    primaryColor: "#22D3EE",
    secondaryColor: "#A855F7",
    backgroundColor: "#0A0A0A",
    textColor: "#22D3EE",
    backgroundType: "solid",
    buttonStyle: "outline",
    buttonColor: "transparent",
    buttonTextColor: "#22D3EE",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  soft: {
    name: "Soft",
    description: "Warm and gentle",
    primaryColor: "#F472B6",
    secondaryColor: "#FB923C",
    backgroundColor: "#FFF7ED",
    textColor: "#78350F",
    backgroundType: "solid",
    buttonStyle: "pill",
    buttonColor: "#FED7AA",
    buttonTextColor: "#78350F",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  dark: {
    name: "Dark",
    description: "Sleek dark mode",
    primaryColor: "#3B82F6",
    secondaryColor: "#60A5FA",
    backgroundColor: "#111827",
    textColor: "#F9FAFB",
    backgroundType: "solid",
    buttonStyle: "rounded",
    buttonColor: "#1F2937",
    buttonTextColor: "#F9FAFB",
    fontFamily: "Inter, system-ui, sans-serif",
  },
};

interface ThemeCardProps {
  theme: PageTheme;
  isSelected: boolean;
  onClick: () => void;
}

export function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  const config = themeConfigs[theme];

  const getBackgroundStyle = () => {
    if (config.backgroundType === "gradient" && config.gradientStart && config.gradientEnd) {
      return {
        background: `linear-gradient(${config.gradientDirection || 135}deg, ${config.gradientStart}, ${config.gradientEnd})`,
      };
    }
    return { backgroundColor: config.backgroundColor };
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col overflow-hidden rounded-xl border-2 transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2"
          : "border-gray-200 hover:border-gray-300"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Preview area */}
      <div
        className="w-full aspect-[3/4] p-4 flex flex-col items-center justify-center gap-2"
        style={getBackgroundStyle()}
      >
        {/* Mini avatar */}
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: config.primaryColor }}
        />

        {/* Mini name */}
        <div
          className="w-16 h-2 rounded"
          style={{ backgroundColor: config.textColor, opacity: 0.7 }}
        />

        {/* Mini buttons */}
        <div className="w-full max-w-[80px] space-y-1.5 mt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-full h-4 ${
                config.buttonStyle === "pill"
                  ? "rounded-full"
                  : config.buttonStyle === "square"
                  ? "rounded-none"
                  : "rounded-md"
              }`}
              style={{
                backgroundColor: config.buttonColor,
                border:
                  config.buttonStyle === "outline"
                    ? `1px solid ${config.buttonTextColor}`
                    : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Theme name */}
      <div className="p-2 bg-white border-t border-gray-100">
        <p className="text-sm font-medium text-gray-900">{config.name}</p>
        <p className="text-xs text-gray-500">{config.description}</p>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

interface ThemeGridProps {
  selectedTheme: PageTheme;
  onSelectTheme: (theme: PageTheme) => void;
}

export function ThemeGrid({ selectedTheme, onSelectTheme }: ThemeGridProps) {
  const themes = Object.keys(themeConfigs) as PageTheme[];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {themes.map((theme) => (
        <ThemeCard
          key={theme}
          theme={theme}
          isSelected={selectedTheme === theme}
          onClick={() => onSelectTheme(theme)}
        />
      ))}
    </div>
  );
}

// Full page preview with live data
interface LivePreviewProps {
  settings: {
    theme: PageTheme;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    backgroundType: BackgroundType;
    gradientStart?: string | null;
    gradientEnd?: string | null;
    gradientDirection?: number | null;
    buttonStyle: ButtonStyle;
    buttonColor?: string | null;
    buttonTextColor?: string | null;
    showAvatar: boolean;
    showBio: boolean;
    showSocialIcons?: boolean;
    socialIconStyle?: SocialIconStyle;
  };
  user: {
    name?: string | null;
    avatarUrl?: string | null;
  };
  bio?: string | null;
  links?: Array<{ id: string; title: string }>;
  socialProfiles?: Array<{ platform: SocialPlatform; url: string }>;
  className?: string;
}

export function LivePreview({
  settings,
  user,
  bio,
  links = [],
  socialProfiles = [],
  className = "",
}: LivePreviewProps) {
  const themeConfig = themeConfigs[settings.theme];

  const getBackgroundStyle = () => {
    if (
      settings.backgroundType === "gradient" &&
      settings.gradientStart &&
      settings.gradientEnd
    ) {
      return {
        background: `linear-gradient(${settings.gradientDirection || 135}deg, ${settings.gradientStart}, ${settings.gradientEnd})`,
      };
    }
    return { backgroundColor: settings.backgroundColor || themeConfig.backgroundColor };
  };

  const buttonColor = settings.buttonColor || themeConfig.buttonColor;
  const buttonTextColor = settings.buttonTextColor || themeConfig.buttonTextColor;
  const buttonStyle = settings.buttonStyle || themeConfig.buttonStyle;

  const buttonClasses = {
    rounded: "rounded-lg",
    pill: "rounded-full",
    square: "rounded-none",
    outline: "rounded-lg border-2 bg-transparent",
    shadow: "rounded-lg shadow-lg",
    "3d": "rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
  };

  return (
    <div
      className={`w-full aspect-[9/16] max-h-[600px] p-6 flex flex-col items-center overflow-y-auto ${className}`}
      style={{
        ...getBackgroundStyle(),
        color: settings.textColor || themeConfig.textColor,
        fontFamily: themeConfig.fontFamily,
      }}
    >
      {/* Avatar */}
      {settings.showAvatar && (
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-300 mb-4 flex-shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || ""}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold opacity-50">
              {user.name?.charAt(0) || "?"}
            </div>
          )}
        </div>
      )}

      {/* Name */}
      <h2 className="text-xl font-bold mb-1 flex-shrink-0">{user.name || "Your Name"}</h2>

      {/* Bio */}
      {settings.showBio && bio && (
        <p className="text-sm opacity-70 text-center mb-4 max-w-xs flex-shrink-0">{bio}</p>
      )}

      {/* Social Icons */}
      {settings.showSocialIcons && socialProfiles.length > 0 && (
        <div className="mb-6 flex-shrink-0">
          <SocialIconsRow
            profiles={socialProfiles}
            size="sm"
            iconStyle={settings.socialIconStyle || "filled"}
          />
        </div>
      )}

      {/* Links preview - show ALL links */}
      <div className="w-full max-w-xs space-y-3 flex-shrink-0">
        {links.length > 0 ? (
          links.map((link) => (
            <div
              key={link.id}
              className={`w-full py-3 px-4 text-center text-sm font-medium ${buttonClasses[buttonStyle]}`}
              style={{
                backgroundColor:
                  buttonStyle === "outline" ? "transparent" : buttonColor,
                color: buttonTextColor,
                borderColor: buttonStyle === "outline" ? buttonTextColor : undefined,
              }}
            >
              {link.title}
            </div>
          ))
        ) : (
          <>
            {["Link 1", "Link 2", "Link 3"].map((label) => (
              <div
                key={label}
                className={`w-full py-3 px-4 text-center text-sm font-medium ${buttonClasses[buttonStyle]}`}
                style={{
                  backgroundColor:
                    buttonStyle === "outline" ? "transparent" : buttonColor,
                  color: buttonTextColor,
                  borderColor: buttonStyle === "outline" ? buttonTextColor : undefined,
                }}
              >
                {label}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
