"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface EmailTemplate {
  id: string;
  user_id: string;
  template_type: "confirmation" | "reminder" | "cancellation" | "rescheduled" | "host_notification";
  subject: string;
  greeting: string | null;
  body_text: string | null;
  footer_text: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailTemplateFormProps {
  userId: string;
  templateType: "confirmation" | "reminder" | "cancellation" | "rescheduled" | "host_notification";
  existingTemplate?: EmailTemplate;
  defaults: {
    subject: string;
    greeting: string;
    body_text: string;
  };
}

export function EmailTemplateForm({
  userId,
  templateType,
  existingTemplate,
  defaults,
}: EmailTemplateFormProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(!!existingTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [formData, setFormData] = useState({
    subject: existingTemplate?.subject || defaults.subject,
    greeting: existingTemplate?.greeting || defaults.greeting,
    body_text: existingTemplate?.body_text || defaults.body_text,
    footer_text: existingTemplate?.footer_text || "",
    is_enabled: existingTemplate?.is_enabled ?? true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();

    try {
      if (existingTemplate) {
        // Update existing template
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("email_templates")
          .update({
            subject: formData.subject,
            greeting: formData.greeting || null,
            body_text: formData.body_text || null,
            footer_text: formData.footer_text || null,
            is_enabled: formData.is_enabled,
          })
          .eq("id", existingTemplate.id);
      } else {
        // Create new template
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("email_templates").insert({
          user_id: userId,
          template_type: templateType,
          subject: formData.subject,
          greeting: formData.greeting || null,
          body_text: formData.body_text || null,
          footer_text: formData.footer_text || null,
          is_enabled: formData.is_enabled,
        });
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to save template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!existingTemplate) return;

    setIsResetting(true);
    const supabase = createClient();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("email_templates").delete().eq("id", existingTemplate.id);
      setFormData({
        subject: defaults.subject,
        greeting: defaults.greeting,
        body_text: defaults.body_text,
        footer_text: "",
        is_enabled: true,
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to reset template:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const hasChanges = existingTemplate
    ? formData.subject !== existingTemplate.subject ||
      formData.greeting !== (existingTemplate.greeting || "") ||
      formData.body_text !== (existingTemplate.body_text || "") ||
      formData.footer_text !== (existingTemplate.footer_text || "") ||
      formData.is_enabled !== existingTemplate.is_enabled
    : formData.subject !== defaults.subject ||
      formData.greeting !== defaults.greeting ||
      formData.body_text !== defaults.body_text ||
      formData.footer_text !== "";

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <span>{isExpanded ? "Hide options" : "Customize this email"}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor={`enable-${templateType}`} className="font-medium">
                Enable this email
              </Label>
              <p className="text-sm text-gray-500">
                When disabled, this email will not be sent
              </p>
            </div>
            <Switch
              id={`enable-${templateType}`}
              checked={formData.is_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_enabled: checked })
              }
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor={`subject-${templateType}`}>Subject Line</Label>
            <Input
              id={`subject-${templateType}`}
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder={defaults.subject}
            />
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <Label htmlFor={`greeting-${templateType}`}>Greeting</Label>
            <Input
              id={`greeting-${templateType}`}
              value={formData.greeting}
              onChange={(e) =>
                setFormData({ ...formData, greeting: e.target.value })
              }
              placeholder={defaults.greeting}
            />
            <p className="text-xs text-gray-500">
              Displayed below the email header
            </p>
          </div>

          {/* Body Text (only for reminder) */}
          {templateType === "reminder" && (
            <div className="space-y-2">
              <Label htmlFor={`body-${templateType}`}>Additional Message</Label>
              <Textarea
                id={`body-${templateType}`}
                value={formData.body_text}
                onChange={(e) =>
                  setFormData({ ...formData, body_text: e.target.value })
                }
                placeholder="Optional additional message to include in the reminder"
                rows={3}
              />
            </div>
          )}

          {/* Footer */}
          <div className="space-y-2">
            <Label htmlFor={`footer-${templateType}`}>Footer Text</Label>
            <Input
              id={`footer-${templateType}`}
              value={formData.footer_text}
              onChange={(e) =>
                setFormData({ ...formData, footer_text: e.target.value })
              }
              placeholder="Optional footer text"
            />
            <p className="text-xs text-gray-500">
              Displayed at the bottom of the email
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {existingTemplate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset to defaults"
                  )}
                </Button>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
