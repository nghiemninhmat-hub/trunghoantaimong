import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const jsonResponse = (body: unknown, status = 200) => new Response(
  JSON.stringify(body),
  { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !serviceRoleKey || !anonKey || !authHeader) {
      return jsonResponse({ error: "Không có quyền truy cập." }, 401);
    }

    const userToken = authHeader.replace(/^Bearer\s+/i, "");
    const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!adminCheckResponse.ok || (await adminCheckResponse.json()) !== true) {
      return jsonResponse({ error: "Chỉ quản trị viên mới có quyền sao lưu tài khoản." }, 403);
    }

    const users: Record<string, unknown>[] = [];
    for (let page = 1; ; page += 1) {
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=1000`, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      });
      if (!response.ok) return jsonResponse({ error: "Không thể đọc dữ liệu tài khoản." }, 502);

      const body = await response.json() as { users?: Record<string, unknown>[] };
      const pageUsers = Array.isArray(body.users) ? body.users : [];
      users.push(...pageUsers.map((user) => ({
        id: user.id,
        email: user.email,
        phone: user.phone,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: user.last_sign_in_at,
        confirmed_at: user.confirmed_at,
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at,
        banned_until: user.banned_until,
        role: user.role,
        aud: user.aud,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      })));
      if (pageUsers.length < 1000) break;
    }

    return jsonResponse({ auth_accounts: users });
  } catch (error) {
    console.error("admin-export-auth error:", error);
    return jsonResponse({ error: "Không thể sao lưu dữ liệu tài khoản." }, 500);
  }
});
