"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StoreSettingsSchema, StoreSettings } from "@/lib/validator";
import { updateStoreSettings } from "@/lib/actions/settings.actions";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "src/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const DAYS = [
  { label: "Sunday", value: 0, short: "Sun" },
  { label: "Monday", value: 1, short: "Mon" },
  { label: "Tuesday", value: 2, short: "Tue" },
  { label: "Wednesday", value: 3, short: "Wed" },
  { label: "Thursday", value: 4, short: "Thu" },
  { label: "Friday", value: 5, short: "Fri" },
  { label: "Saturday", value: 6, short: "Sat" },
];

const formatDateForInput = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  } catch (e) {
    return "";
  }
};

export default function SettingsForm({ defaultValues }: { defaultValues: StoreSettings }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  
  const form = useForm<StoreSettings>({
    resolver: zodResolver(StoreSettingsSchema),
    defaultValues: {
       ...defaultValues,
       closed_days: defaultValues.closed_days || []
    },
  });

  function onSubmit(values: StoreSettings) {
    startTransition(async () => {
      try {
        await updateStoreSettings(values);
        showToast("Settings updated successfully", "success");
      } catch (error) {
        showToast("Failed to update settings", "error");
        console.error(error);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Pass ID if available */}
        {defaultValues?.id && (
            <input type="hidden" {...form.register("id", { valueAsNumber: true })} />
        )}

        {/* Store Status */}
        <Card>
          <CardHeader>
            <CardTitle>Store Status</CardTitle>
            <CardDescription>Enable or disable your store</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="is_store_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Store Enabled</FormLabel>
                    <FormDescription>When disabled, customers cannot place orders</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
            <CardDescription>Set your daily business hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="open_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="close_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Closed Days */}
        <Card>
          <CardHeader>
            <CardTitle>Closed Days</CardTitle>
            <CardDescription>Select days when your store is closed</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="closed_days"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {DAYS.map((day) => {
                      const isChecked = field.value?.includes(day.value);
                      return (
                        <FormItem
                          key={day.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                return checked
                                  ? field.onChange([...currentValue, day.value])
                                  : field.onChange(currentValue.filter((value) => value !== day.value))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {day.label}
                          </FormLabel>
                        </FormItem>
                      );
                    })}
                  </div>
                  <FormDescription className="mt-4">Customers will be notified about these closures</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* After Hours Orders */}
        <Card>
          <CardHeader>
            <CardTitle>After Hours Orders</CardTitle>
            <CardDescription>Manage orders outside operating hours</CardDescription>
          </CardHeader>
          <CardContent>
             <FormField
              control={form.control}
              name="accept_orders_when_closed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Accept Orders When Closed</FormLabel>
                    <FormDescription>Allow customers to place orders outside operating hours</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Announcement Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Announcement Banner</CardTitle>
            <CardDescription>Display a global announcement to your customers (e.g., holiday closures)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="is_announcement_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Announcement</FormLabel>
                    <FormDescription>Show the banner on the website</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="announcement_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. We will be closed from Jan 5th to Jan 10th." 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="announcement_start_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          value={formatDateForInput(field.value)}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="announcement_end_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                         <Input 
                          type="datetime-local" 
                          {...field} 
                          value={formatDateForInput(field.value)} 
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
