import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreateUserSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
  displayName: z.string().trim().min(1).max(120),
  role: z.enum(["super_admin", "manager", "accountant", "employee"]),
});

/**
 * Create a new user. Only callable by an existing super_admin or manager
 * ("Senior Manager"). Password hashing is delegated to Supabase Auth
 * (server-side bcrypt) — we never hash on the Worker/Edge runtime, so this
 * is fully Cloudflare-edge compatible.
 */
export const createUserWithRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Gate: caller must be super_admin or manager
    const { data: roles, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (roleErr) throw new Error(roleErr.message);
    const callerRoles = (roles ?? []).map((r) => r.role);
    const isAllowed =
      callerRoles.includes("super_admin") || callerRoles.includes("manager");
    if (!isAllowed) {
      throw new Error("Forbidden: only Senior Manager can create users");
    }

    // Use admin client to create the auth user (bcrypt-hashed by Supabase)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { display_name: data.displayName },
      });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Failed to create user");
    }

    const newId = created.user.id;

    // Ensure profile exists (handle_new_user trigger should create it, but be safe)
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: newId, display_name: data.displayName }, { onConflict: "id" });

    // Replace any auto-assigned role with the chosen one
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newId, role: data.role });
    if (insErr) throw new Error(insErr.message);

    return { ok: true as const, id: newId };
  });
