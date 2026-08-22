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
    const { user_id, new_password } = await req.json();

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Không có quyền truy cập." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userToken = authHeader.replace("Bearer ", "");

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
        apikey: anonKey,
      },
    });

    if (!userResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Phiên đăng nhập không hợp lệ." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userData = await userResponse.json();

    // Check if caller is admin via is_admin() DB function
    const adminCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/is_admin`,
      {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!adminCheckResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Không thể xác thực quyền quản trị." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminCheckData = await adminCheckResponse.json();
    const isAdmin = adminCheckData === true;

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Chỉ quản trị viên mới có quyền đổi mật khẩu." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update password via Auth Admin API (service role key bypasses RLS)
    const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
      method: "PUT",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: new_password }),
    });

    if (!updateResponse.ok) {
      const errBody = await updateResponse.text();
      return new Response(
        JSON.stringify({ error: `Lỗi cập nhật mật khẩu: ${errBody}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Save old password to history and update profiles.password
    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_save_password_change`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_user_id: user_id,
        p_new_password: new_password,
        p_changed_by: userData.id,
      }),
    });

    if (!rpcResponse.ok) {
      console.error("Failed to save password history:", await rpcResponse.text());
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
