import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { MYANMAR_CITIES } from "@/lib/format";
import {
  getAlertSettings,
  getShopOverview,
  saveAlertSettings,
  sendTestAlert,
  updateShopSettings,
} from "@/lib/maket.functions";

const alertsQuery = queryOptions({
  queryKey: ["alert-settings"],
  queryFn: () => getAlertSettings(),
});

const overviewQuery = queryOptions({
  queryKey: ["shop-overview"],
  queryFn: () => getShopOverview(),
});

export const Route = createFileRoute("/_authenticated/settings")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(overviewQuery),
      context.queryClient.ensureQueryData(alertsQuery),
    ]);
  },
  component: SettingsPage,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </p>
  ),
  notFoundComponent: () => <p className="p-6 text-sm">Shop not found.</p>,
});

function SettingsPage() {
  const { data } = useSuspenseQuery(overviewQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const save = useServerFn(updateShopSettings);
  const [busy, setBusy] = useState(false);
  const seller = data.seller;
  const [codEnabled, setCodEnabled] = useState(seller.codEnabled);
  const [codCities, setCodCities] = useState<string[]>(seller.codCities);

  const toggleCity = (city: string) => {
    setCodCities((current) =>
      current.includes(city) ? current.filter((name) => name !== city) : [...current, city],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (field: string) => String(form.get(field) ?? "").trim();

    setBusy(true);
    try {
      await save({
        data: {
          businessName: value("businessName"),
          phone: value("phone"),
          tiktokHandle: value("tiktokHandle"),
          kbzpayName: value("kbzpayName"),
          kbzpayNumber: value("kbzpayNumber"),
          wavepayName: value("wavepayName"),
          wavepayNumber: value("wavepayNumber"),
          ayapayName: value("ayapayName"),
          ayapayNumber: value("ayapayNumber"),
          codEnabled,
          codCities,
        },
      });
      toast.success("Shop settings saved.");
      await queryClient.invalidateQueries({ queryKey: ["shop-overview"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your settings.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell title="Shop settings" subtitle="Shown to buyers at checkout">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Shop details</h2>
          <div className="mt-3 space-y-4">
            <Field
              id="businessName"
              label="Business name"
              defaultValue={seller.businessName}
              maxLength={80}
              required
            />
            <Field
              id="phone"
              label="Phone number"
              defaultValue={seller.phone}
              maxLength={40}
              placeholder="09 7xx xxx xxx"
            />
            <Field
              id="tiktokHandle"
              label="TikTok handle (your store link)"
              defaultValue={seller.tiktokHandle}
              maxLength={30}
              required
              hint="Your link is /s/your-handle"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Payment collection</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Buyers see these details on your checkout page so they can transfer the payment.
          </p>
          <div className="mt-3 space-y-4">
            <Field
              id="kbzpayName"
              label="KBZPay account name"
              defaultValue={seller.kbzpayName}
              maxLength={80}
            />
            <Field
              id="kbzpayNumber"
              label="KBZPay number"
              defaultValue={seller.kbzpayNumber}
              maxLength={40}
            />
            <Field
              id="wavepayName"
              label="WavePay account name"
              defaultValue={seller.wavepayName}
              maxLength={80}
            />
            <Field
              id="wavepayNumber"
              label="WavePay number"
              defaultValue={seller.wavepayNumber}
              maxLength={40}
            />
            <Field
              id="ayapayName"
              label="AYAPay account name"
              defaultValue={seller.ayapayName}
              maxLength={80}
            />
            <Field
              id="ayapayNumber"
              label="AYAPay number"
              defaultValue={seller.ayapayNumber}
              maxLength={40}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Cash on delivery</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Off means buyers always pay in advance. On lets buyers in the cities you choose pay
                the delivery person at the door.
              </p>
            </div>
            <Switch
              checked={codEnabled}
              onCheckedChange={setCodEnabled}
              aria-label="Allow cash on delivery"
            />
          </div>

          {codEnabled ? (
            <div className="mt-4">
              <p className="text-xs font-medium">Cities where pay at door is available</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MYANMAR_CITIES.map((city) => {
                  const active = codCities.includes(city);
                  return (
                    <Button
                      key={city}
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => toggleCity(city)}
                    >
                      {city}
                    </Button>
                  );
                })}
              </div>
              {codCities.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Pick at least one city, otherwise buyers still pay in advance.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>


        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </Button>
      </form>

      <OrderAlertsSection />

      <Button variant="ghost" className="mt-4 w-full text-destructive" onClick={handleSignOut}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </AppShell>
  );
}

function OrderAlertsSection() {
  const { data } = useSuspenseQuery(alertsQuery);
  const queryClient = useQueryClient();
  const save = useServerFn(saveAlertSettings);
  const test = useServerFn(sendTestAlert);
  const [chatId, setChatId] = useState(data.telegramChatId);
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    try {
      await save({ data: { telegramChatId: chatId.trim() } });
      await queryClient.invalidateQueries({ queryKey: ["alert-settings"] });
      toast.success("Order alerts updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your alert settings.");
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      await test();
      toast.success("Test alert sent to Telegram.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the test alert.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">New order alerts</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        While this app is open you get a sound and a banner for every new order. Add your Telegram
        chat id to also get a message on your phone.
      </p>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor="telegramChatId">Telegram chat id</Label>
        <Input
          id="telegramChatId"
          inputMode="numeric"
          value={chatId}
          maxLength={40}
          placeholder="e.g. 123456789"
          onChange={(event) => setChatId(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Open Telegram, message @userinfobot and it replies with your id.
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" onClick={handleSave} disabled={busy}>
          Save alerts
        </Button>
        <Button type="button" variant="outline" onClick={handleTest} disabled={busy}>
          Send test
        </Button>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  ...props
}: { id: string; label: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} {...props} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
