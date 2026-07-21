import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const accessToken = authHeader.slice(7);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      accessToken,
    );
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const userId = user.id;
    const warnings: string[] = [];

    const tables = ["stats", "streaks", "settings", "users"];
    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq(
        "device_id",
        userId,
      );
      if (error) {
        warnings.push(`Failed to delete from ${table}: ${error.message}`);
      }
    }

    const { error: storageError } = await adminClient.storage
      .from("avatars")
      .remove([`${userId}.jpg`]);
    if (storageError && !storageError.message.toLowerCase().includes("not found")) {
      warnings.push(`Failed to delete avatar: ${storageError.message}`);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      userId,
    );
    if (deleteError) {
      return new Response(
        JSON.stringify({
          error: `Failed to delete auth user: ${deleteError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, warnings }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message ?? "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
