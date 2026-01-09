import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, DollarSign, CreditCard, AlertCircle } from "lucide-react";
import { isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage() {
  const stripeConfigured = isStripeConfigured();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get recent payments if Stripe is configured
  let recentPayments: Array<{
    id: string;
    amount_cents: number;
    status: string;
    guest_name: string;
    guest_email: string;
    created_at: string;
  }> = [];

  if (user && stripeConfigured) {
    // First get user's event type IDs
    const { data: eventTypesData } = await supabase
      .from("event_types")
      .select("id")
      .eq("user_id", user.id);

    const eventTypeIds = (eventTypesData || []).map((e: { id: string }) => e.id);

    if (eventTypeIds.length > 0) {
      const { data: payments } = await supabase
        .from("payments")
        .select(`
          id,
          amount_cents,
          status,
          guest_name,
          guest_email,
          created_at,
          event_type_id
        `)
        .in("event_type_id", eventTypeIds)
        .order("created_at", { ascending: false })
        .limit(10);

      recentPayments = (payments || []) as typeof recentPayments;
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "refunded":
        return <Badge variant="default">Refunded</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "failed":
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-gray-600">
          Manage Stripe integration and view payment history
        </p>
      </div>

      {/* Stripe Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Integration
              </CardTitle>
              <CardDescription>
                Connect Stripe to accept payments for your bookings
              </CardDescription>
            </div>
            {stripeConfigured ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <X className="w-3 h-3" />
                Not connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {stripeConfigured ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    Stripe is configured
                  </p>
                  <p className="text-sm text-green-700">
                    You can now create paid event types and accept payments from
                    your guests.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Stripe Dashboard
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">
                    Stripe is not configured
                  </p>
                  <p className="text-sm text-amber-700">
                    Add your Stripe API keys to enable paid bookings.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Setup Instructions</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>
                    Go to your{" "}
                    <a
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Stripe API keys page
                    </a>
                  </li>
                  <li>Copy your Secret key (starts with sk_)</li>
                  <li>
                    Add it to your <code className="bg-gray-200 px-1 rounded text-gray-900">.env.local</code> file:
                    <pre className="mt-2 bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                      STRIPE_SECRET_KEY=sk_live_...{"\n"}
                      STRIPE_WEBHOOK_SECRET=whsec_...
                    </pre>
                  </li>
                  <li>
                    Set up a webhook endpoint in Stripe pointing to:{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs text-gray-900">
                      {process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com"}/api/stripe/webhook
                    </code>
                  </li>
                  <li>Restart your application</li>
                </ol>
              </div>

              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#635BFF] rounded-lg hover:bg-[#5851db] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Get Stripe API Keys
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      {stripeConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Payments
            </CardTitle>
            <CardDescription>
              View your recent payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                        Guest
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                        Amount
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                        Status
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.guest_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {payment.guest_email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-medium text-gray-900">
                          {formatPrice(payment.amount_cents)}
                        </td>
                        <td className="py-3 px-2">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No payments yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Payments will appear here once guests book paid events
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
