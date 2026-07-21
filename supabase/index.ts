// supabase/functions/delete-account/index.ts
//
// Deletes the calling user's Supabase Auth account AND all rows/files
// linked to their device_id across users, streaks, stats, settings, and
// the avatars storage bucket. Must be called with the user's own JWT
// (Authorization: Bearer <access_token>) — it identifies the caller from
// that token, so a user can only ever delete their own account.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Client scoped to the CALLER's token — used only to verify who is calling.
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deviceId = user.id; // device_id in your tables IS the auth uid

    // Admin client — service_role key, only ever used server-side here.
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const errors: string[] = [];

    // Delete data rows first (order doesn't matter, no FK cascade defined)
    const tables = ["stats", "streaks", "settings", "users"];
    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq("device_id", deviceId);
      if (error) errors.push(`${table}: ${error.message}`);
    }

    // Delete avatar file, if any
    const { error: storageError } = await adminClient.storage
      .from("avatars")
      .remove([`${deviceId}.jpg`]);
    if (storageError && storageError.message !== "The resource was not found") {
      errors.push(`avatars: ${storageError.message}`);
    }

    // Finally, delete the Auth user itself
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(deviceId);
    if (authDeleteError) {
      errors.push(`auth.deleteUser: ${authDeleteError.message}`);
    }

    if (errors.length > 0) {
      // Still return 200 with partial-failure detail — the account row/auth
      // deletion is the critical part; log the rest for manual cleanup.
      console.error("Partial deletion errors:", errors);
    }

    return new Response(JSON.stringify({ success: true, warnings: errors }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("delete-account fatal error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});