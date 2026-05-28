export type Role = "super_admin" | "manager" | "warehouse" | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "مدیر ارشد",
  manager: "مدیر",
  warehouse: "کارمند انبار",
  viewer: "بازدیدکننده",
};

export type Permission =
  | "view_dashboard"
  | "view_inventory"
  | "edit_inventory"
  | "view_serials"
  | "edit_serials"
  | "view_pricing"
  | "edit_pricing"
  | "view_financials"
  | "view_commitments"
  | "manage_users"
  | "manage_settings"
  | "manage_vault"
  | "bulk_import"
  | "export_data";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "view_dashboard", "view_inventory", "edit_inventory", "view_serials", "edit_serials",
    "view_pricing", "edit_pricing", "view_financials", "view_commitments",
    "manage_users", "manage_settings", "manage_vault", "bulk_import", "export_data",
  ],
  manager: [
    "view_dashboard", "view_inventory", "edit_inventory", "view_serials", "edit_serials",
    "view_pricing", "edit_pricing", "view_financials", "view_commitments",
    "bulk_import", "export_data",
  ],
  warehouse: [
    "view_dashboard", "view_inventory", "view_serials", "edit_serials", "view_commitments",
  ],
  viewer: ["view_dashboard", "view_inventory", "view_serials"],
};

export const hasPermission = (role: Role | undefined, perm: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
};
