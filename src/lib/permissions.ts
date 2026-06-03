export type Role =
  | "super_admin"
  | "manager"
  | "accountant"
  | "employee"
  | "warehouse"
  | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "مدیر ارشد",
  manager: "مدیر",
  accountant: "حسابدار",
  employee: "کارمند",
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
  // Accountant: financial data only — explicitly blocked from commitments.
  accountant: [
    "view_dashboard", "view_financials", "view_pricing", "export_data",
  ],
  // Employee: shipping commitments only — explicitly blocked from financials.
  employee: [
    "view_dashboard", "view_commitments", "view_serials",
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

/** Landing route for each role after login or after hitting a blocked page. */
export const roleHome = (role: Role | undefined): string => {
  switch (role) {
    case "accountant":
      return "/financials";
    case "employee":
      return "/commitments";
    default:
      return "/dashboard";
  }
};
