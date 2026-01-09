import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailTemplateForm } from "@/components/emails/template-form";
import { Mail, Check, X } from "lucide-react";

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

const defaultTemplates: Record<string, { subject: string; greeting: string; body_text: string }> = {
  confirmation: {
    subject: "Confirmed: {{eventTitle}} with {{hostName}}",
    greeting: "Your meeting has been scheduled!",
    body_text: "",
  },
  reminder: {
    subject: "Reminder: {{eventTitle}} with {{hostName}} - Starting Soon",
    greeting: "Your meeting is starting soon!",
    body_text: "",
  },
  cancellation: {
    subject: "Cancelled: {{eventTitle}} with {{hostName}}",
    greeting: "Your meeting has been cancelled.",
    body_text: "",
  },
  rescheduled: {
    subject: "Rescheduled: {{eventTitle}} with {{hostName}}",
    greeting: "Your meeting has been moved to a new time.",
    body_text: "",
  },
  host_notification: {
    subject: "New Booking: {{eventTitle}} with {{guestName}}",
    greeting: "You have a new booking!",
    body_text: "",
  },
};

const templateDescriptions: Record<string, string> = {
  confirmation: "Sent to guest immediately after a booking is confirmed",
  reminder: "Sent to guest 1 hour before the meeting starts",
  cancellation: "Sent to guest when a meeting is cancelled",
  rescheduled: "Sent to guest when a meeting is rescheduled to a new time",
  host_notification: "Sent to you when someone books a meeting",
};

const templateDisplayNames: Record<string, string> = {
  confirmation: "Confirmation",
  reminder: "Reminder",
  cancellation: "Cancellation",
  rescheduled: "Rescheduled",
  host_notification: "New Booking Notification",
};

export default async function EmailsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get existing email templates
  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .eq("user_id", user.id);

  const emailTemplates = templates as EmailTemplate[] | null;

  // Check if email is configured
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || "Bookings <noreply@example.com>";

  // Create template map for easy lookup
  const templateMap = new Map<string, EmailTemplate>();
  emailTemplates?.forEach((t) => templateMap.set(t.template_type, t));

  const templateTypes: Array<"confirmation" | "reminder" | "cancellation" | "rescheduled" | "host_notification"> = [
    "host_notification",
    "confirmation",
    "reminder",
    "cancellation",
    "rescheduled",
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
        <p className="mt-1 text-gray-600">Customize the emails sent to your guests</p>
      </div>

      {/* Email Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Email Configuration</CardTitle>
                <CardDescription>
                  {hasResendKey ? `Sending from: ${emailFrom}` : "Email delivery not configured"}
                </CardDescription>
              </div>
            </div>
            {hasResendKey ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <X className="w-3 h-3" />
                Not configured
              </Badge>
            )}
          </div>
        </CardHeader>
        {!hasResendKey && (
          <CardContent>
            <p className="text-sm text-gray-600">
              To enable email notifications, add your Resend API key to your environment variables:
            </p>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg font-mono text-sm text-gray-900">
              RESEND_API_KEY=re_...
              <br />
              EMAIL_FROM=&quot;Your Name &lt;noreply@yourdomain.com&gt;&quot;
            </div>
          </CardContent>
        )}
      </Card>

      {/* Variable Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Variables</CardTitle>
          <CardDescription>Use these placeholders in your templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-900">{"{{guestName}}"}</code>
            <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-900">{"{{hostName}}"}</code>
            <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-900">{"{{eventTitle}}"}</code>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <div className="space-y-4">
        {templateTypes.map((type) => {
          const existing = templateMap.get(type);
          const defaults = defaultTemplates[type];

          return (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{templateDisplayNames[type]} Email</CardTitle>
                    <CardDescription>{templateDescriptions[type]}</CardDescription>
                  </div>
                  {existing ? (
                    existing.is_enabled ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="default" className="flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Disabled
                      </Badge>
                    )
                  ) : (
                    <Badge variant="secondary">Using defaults</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <EmailTemplateForm
                  userId={user.id}
                  templateType={type}
                  existingTemplate={existing}
                  defaults={defaults}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
