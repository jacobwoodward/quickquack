"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LinkWithEventType, ButtonStyle } from "@/lib/types/database";

// Lucide icons for different link types
// Format price for display - removes .00 decimals
function formatEventPrice(priceCents: number | null | undefined, isPaid: boolean | undefined): string {
  if (!isPaid || !priceCents || priceCents === 0) {
    return "FREE";
  }
  const dollars = priceCents / 100;
  // Only show decimals if they're not .00
  if (dollars % 1 === 0) {
    return `$${dollars.toFixed(0)}`;
  }
  return `$${dollars.toFixed(2)}`;
}

const linkTypeIcons: Record<string, React.ReactNode> = {
  event: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  url: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  email: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  phone: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  music: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  video: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  social: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  embed: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

// Button style classes
const buttonStyles: Record<ButtonStyle, string> = {
  rounded: "rounded-lg",
  pill: "rounded-full",
  square: "rounded-none",
  outline: "rounded-lg border-2 bg-transparent",
  shadow: "rounded-lg shadow-lg",
  "3d": "rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 transition-all",
};

interface LinkCardProps {
  link: LinkWithEventType;
  buttonStyle?: ButtonStyle;
  defaultButtonColor?: string;
  defaultTextColor?: string;
  onClick?: () => void;
  isPreview?: boolean;
  href?: string;
  isInternal?: boolean;
}

function getIcon(link: LinkWithEventType) {
  if (link.icon_type === "none") return null;

  if (link.icon_type === "emoji" && link.icon_value) {
    return <span className="text-xl">{link.icon_value}</span>;
  }

  if (link.icon_type === "custom" && link.icon_value) {
    return (
      <img
        src={link.icon_value}
        alt=""
        className="w-5 h-5 object-contain"
      />
    );
  }

  // Default to lucide icons based on link type
  return linkTypeIcons[link.link_type] || linkTypeIcons.url;
}

// Standard link button style
function StandardLink({ link, buttonStyle = "rounded", defaultButtonColor, defaultTextColor, onClick, isPreview, href, isInternal }: LinkCardProps) {
  const bgColor = link.background_color || defaultButtonColor || "#ffffff";
  const textColor = link.text_color || defaultTextColor || "#000000";
  const isOutline = buttonStyle === "outline";
  const resolvedHref = href || link.url || "#";

  const content = (
    <>
      {getIcon(link)}
      <span className="flex-1 font-medium text-center">{link.title}</span>
      {link.link_type === "event" && link.event_type && (
        <span className="text-sm opacity-70">{formatEventPrice(link.event_type.price_cents, link.event_type.is_paid)}</span>
      )}
    </>
  );

  const className = `w-full flex items-center gap-3 px-5 py-4 ${buttonStyles[buttonStyle]} transition-all hover:scale-[1.02] active:scale-[0.98]`;
  const style = {
    backgroundColor: isOutline ? "transparent" : bgColor,
    color: textColor,
    borderColor: isOutline ? textColor : undefined,
  };

  if (isPreview) {
    return (
      <motion.div
        className={className}
        style={style}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {content}
      </motion.div>
    );
  }

  if (isInternal) {
    return (
      <Link href={resolvedHref} onClick={onClick}>
        <motion.div
          className={className}
          style={style}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.a
      href={resolvedHref}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.a>
  );
}

// Featured card with image
// Note: Featured cards always use rounded-lg, never pill style (looks bad with images)
function FeaturedLink({ link, defaultButtonColor, defaultTextColor, onClick, isPreview, href, isInternal }: LinkCardProps) {
  const bgColor = link.background_color || defaultButtonColor || "#ffffff";
  const textColor = link.text_color || defaultTextColor || "#000000";
  const resolvedHref = href || link.url || "#";

  const content = (
    <>
      {link.thumbnail_url && (
        <div className="w-full aspect-video overflow-hidden">
          <img
            src={link.thumbnail_url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {getIcon(link)}
          <h3 className="font-semibold">{link.title}</h3>
        </div>
        {link.description && (
          <p className="text-sm opacity-70 line-clamp-2">{link.description}</p>
        )}
        {link.link_type === "event" && link.event_type && (
          <p className="text-sm opacity-60 mt-2">
            {formatEventPrice(link.event_type.price_cents, link.event_type.is_paid)}
          </p>
        )}
      </div>
    </>
  );

  // Always use rounded-lg for featured cards - pill/square styles look bad with images
  const className = `w-full flex flex-col overflow-hidden rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]`;
  const style = { backgroundColor: bgColor, color: textColor };

  if (isPreview) {
    return (
      <motion.div
        className={className}
        style={style}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {content}
      </motion.div>
    );
  }

  if (isInternal) {
    return (
      <Link href={resolvedHref} onClick={onClick}>
        <motion.div
          className={className}
          style={style}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.a
      href={resolvedHref}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.a>
  );
}

// Compact link with small icon
function CompactLink({ link, buttonStyle = "rounded", defaultButtonColor, defaultTextColor, onClick, isPreview, href, isInternal }: LinkCardProps) {
  const bgColor = link.background_color || defaultButtonColor || "#ffffff";
  const textColor = link.text_color || defaultTextColor || "#000000";
  const isOutline = buttonStyle === "outline";
  const resolvedHref = href || link.url || "#";

  const content = (
    <>
      <span className="scale-75">{getIcon(link)}</span>
      <span className="flex-1 text-center">{link.title}</span>
    </>
  );

  const className = `w-full flex items-center gap-2 px-4 py-2.5 ${buttonStyles[buttonStyle]} text-sm transition-all hover:scale-[1.02] active:scale-[0.98]`;
  const style = {
    backgroundColor: isOutline ? "transparent" : bgColor,
    color: textColor,
    borderColor: isOutline ? textColor : undefined,
  };

  if (isPreview) {
    return (
      <motion.div
        className={className}
        style={style}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {content}
      </motion.div>
    );
  }

  if (isInternal) {
    return (
      <Link href={resolvedHref} onClick={onClick}>
        <motion.div
          className={className}
          style={style}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.a
      href={resolvedHref}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.a>
  );
}

// Icon only (for social links)
function IconOnlyLink({ link, buttonStyle = "rounded", defaultButtonColor, defaultTextColor, onClick, isPreview, href, isInternal }: LinkCardProps) {
  const bgColor = link.background_color || defaultButtonColor || "#ffffff";
  const textColor = link.text_color || defaultTextColor || "#000000";
  const isOutline = buttonStyle === "outline";
  const resolvedHref = href || link.url || "#";

  const content = getIcon(link);

  const className = `w-12 h-12 flex items-center justify-center ${buttonStyles[buttonStyle]} transition-all hover:scale-110 active:scale-95`;
  const style = {
    backgroundColor: isOutline ? "transparent" : bgColor,
    color: textColor,
    borderColor: isOutline ? textColor : undefined,
  };

  if (isPreview) {
    return (
      <motion.div
        className={className}
        style={style}
        title={link.title}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {content}
      </motion.div>
    );
  }

  if (isInternal) {
    return (
      <Link href={resolvedHref} onClick={onClick} title={link.title}>
        <motion.div
          className={className}
          style={style}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {content}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.a
      href={resolvedHref}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      title={link.title}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {content}
    </motion.a>
  );
}

// Heading (non-clickable)
function HeadingBlock({ link }: { link: LinkWithEventType }) {
  return (
    <motion.div
      className="w-full py-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2
        className="text-lg font-bold"
        style={{ color: link.text_color || "inherit" }}
      >
        {link.title}
      </h2>
      {link.description && (
        <p className="text-sm opacity-70 mt-1">{link.description}</p>
      )}
    </motion.div>
  );
}

// Divider
function DividerBlock({ link }: { link: LinkWithEventType }) {
  return (
    <motion.div
      className="w-full py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <hr
        className="border-t"
        style={{ borderColor: link.text_color || "currentColor", opacity: 0.2 }}
      />
    </motion.div>
  );
}

// Main LinkCard component that routes to the right display
export function LinkCard(props: LinkCardProps) {
  const { link } = props;

  // Handle special link types
  if (link.link_type === "heading") {
    return <HeadingBlock link={link} />;
  }

  if (link.link_type === "divider") {
    return <DividerBlock link={link} />;
  }

  // Route to display style
  const displayStyle = link.display_style || "standard";

  switch (displayStyle) {
    case "featured":
      return <FeaturedLink {...props} />;
    case "compact":
      return <CompactLink {...props} />;
    case "icon_only":
      return <IconOnlyLink {...props} />;
    default:
      return <StandardLink {...props} />;
  }
}

// Grid of icon-only links
export function IconLinkGrid({ links, buttonStyle, defaultButtonColor, defaultTextColor, onClick }: {
  links: LinkWithEventType[];
  buttonStyle?: ButtonStyle;
  defaultButtonColor?: string;
  defaultTextColor?: string;
  onClick?: (link: LinkWithEventType) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {links.map((link) => (
        <IconOnlyLink
          key={link.id}
          link={link}
          buttonStyle={buttonStyle}
          defaultButtonColor={defaultButtonColor}
          defaultTextColor={defaultTextColor}
          onClick={() => onClick?.(link)}
        />
      ))}
    </div>
  );
}
