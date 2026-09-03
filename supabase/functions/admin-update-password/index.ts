import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id, new_password, admin_id } = await req.json();

    if (!user_id || !new_password) {
      return new Response(
        JSON.stringify({ error: "Thiếu user_id hoặc new_password." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof new_password !== "string" || new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Mật khẩu phải có ít nhất 6 ký tự." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing env vars");
      return new Response(
        JSON.stringify({ error: "Cấu hình máy chủ chưa đầy đủ." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Không có quyền truy cập." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userToken = authHeader.replace("Bearer ", "");

    // Verify caller is an admin
    const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!adminCheckResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Không thể xác thực quyền quản trị." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminCheckData = await adminCheckResponse.json();
    if (adminCheckData !== true) {
      return new Response(
        JSON.stringify({ error: "Chỉ quản trị viên mới có quyền đổi mật khẩu." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Call the DB function admin_update_user_password using service role key
    // service_role has bypassrls so the function's admin check is skipped
    // The function updates auth.users (bcrypt), revokes sessions, syncs profiles.password, saves history
    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_update_user_password`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_user_id: user_id,
        p_new_password: new_password,
        p_admin_id: admin_id ?? null,
      }),
    });

    if (!rpcResponse.ok) {
      const errBody = await rpcResponse.text();
      console.error("RPC admin_update_user_password failed:", errBody);
      return new Response(
        JSON.stringify({ error: "Không thể cập nhật mật khẩu." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rpcData = await rpcResponse.json();
    if (!rpcData || !rpcData.success) {
      return new Response(
        JSON.stringify({ error: rpcData?.error || "Đổi mật khẩu thất bại." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Lỗi không xác định." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
