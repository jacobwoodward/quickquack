import { getConfigStatus, isFullyConfigured } from "@/lib/config";
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const configStatus = getConfigStatus();
  const fullyConfigured = isFullyConfigured();
  const requiredCount = configStatus.filter((s) => s.required).length;
  const configuredRequiredCount = configStatus.filter(
    (s) => s.required && s.configured
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QuickQuack Setup</h1>
          <p className="mt-2 text-gray-600">
            Configure your environment to get QuickQuack running
          </p>
        </div>

        {/* Overall Status */}
        <div
          className={`rounded-lg p-6 mb-8 ${
            fullyConfigured
              ? "bg-green-50 border border-green-200"
              : "bg-amber-50 border border-amber-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {fullyConfigured ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <AlertCircle className="w-8 h-8 text-amber-600" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {fullyConfigured
                  ? "All required services configured!"
                  : `${configuredRequiredCount}/${requiredCount} required services configured`}
              </h2>
              <p className="text-sm text-gray-600">
                {fullyConfigured
                  ? "Your QuickQuack instance is ready to use."
                  : "Complete the configuration below to finish setup."}
              </p>
            </div>
          </div>
          {fullyConfigured && (
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Service Configuration
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {configStatus.map((status) => (
              <div key={status.service} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {status.configured ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : status.required ? (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {status.service}
                        </h4>
                        {status.required ? (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                            Required
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {status.description}
                      </p>
                      {!status.configured &&
                        status.missingVars &&
                        status.missingVars.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Missing environment variables:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {status.missingVars.map((v) => (
                                <code
                                  key={v}
                                  className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-900 rounded font-mono"
                                >
                                  {v}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                  {status.helpUrl && (
                    <a
                      href={status.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      Docs
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Setup Guide
            </h3>
          </div>
          <div className="px-6 py-4 space-y-6">
            {/* Step 1 */}
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center">
                  1
                </span>
                Set up Supabase
              </h4>
              <ol className="mt-2 ml-8 text-sm text-gray-600 list-decimal space-y-1">
                <li>
                  Create a free account at{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    supabase.com
                  </a>
                </li>
                <li>Create a new project</li>
                <li>
                  Go to SQL Editor and run the migrations from{" "}
                  <code className="bg-gray-100 px-1 rounded text-gray-900">
                    supabase/migrations/
                  </code>
                </li>
                <li>
                  Copy your project URL and API keys from Settings &rarr; API
                </li>
              </ol>
            </div>

            {/* Step 2 */}
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center">
                  2
                </span>
                Set up Google OAuth
              </h4>
              <ol className="mt-2 ml-8 text-sm text-gray-600 list-decimal space-y-1">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Create a project and enable Google Calendar API</li>
                <li>Create OAuth 2.0 credentials (Web application)</li>
                <li>
                  Add redirect URI:{" "}
                  <code className="bg-gray-100 px-1 rounded text-gray-900">
                    https://YOUR_PROJECT.supabase.co/auth/v1/callback
                  </code>
                </li>
                <li>
                  In Supabase, enable Google provider under Authentication
                  &rarr; Providers
                </li>
              </ol>
            </div>

            {/* Step 3 */}
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center">
                  3
                </span>
                Configure Environment Variables
              </h4>
              <p className="mt-2 ml-8 text-sm text-gray-600">
                Add these to your Vercel project settings or{" "}
                <code className="bg-gray-100 px-1 rounded text-gray-900">.env.local</code>{" "}
                file:
              </p>
              <pre className="mt-2 ml-8 text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                {`# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required - Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Required - Your domain
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Required - Email notifications
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=Your Name <bookings@your-domain.com>

# Optional - Payments
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Optional - Cron job security
CRON_SECRET=your-random-secret`}
              </pre>
            </div>

            {/* Step 4 */}
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center">
                  4
                </span>
                Deploy
              </h4>
              <ol className="mt-2 ml-8 text-sm text-gray-600 list-decimal space-y-1">
                <li>Push your code to GitHub</li>
                <li>
                  Import the repository in{" "}
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Vercel
                  </a>
                </li>
                <li>Add all environment variables</li>
                <li>Deploy and enjoy!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help?{" "}
            <a
              href="https://github.com/yourusername/quickquack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View the documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
