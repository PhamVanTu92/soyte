import { adminMenu } from "../adminMenu";

/**
 * Robustly checks if a user has a specific permission.
 * Handles both string arrays and object arrays (checking name/key properties).
 */
export const hasPermission = (
  userPermissions: any,
  requiredPermission: string,
): boolean => {
  if (!userPermissions) return false;
  if (!requiredPermission) return true;

  // 1. Handle array structure (Backward compatibility & user selected permissions)
  if (Array.isArray(userPermissions)) {
    return userPermissions.some((p) => {
      if (typeof p === "string") return p === requiredPermission;
      if (typeof p === "object" && p !== null) {
        return (
          p.name === requiredPermission ||
          p.key === requiredPermission ||
          p.permission === requiredPermission ||
          p.code === requiredPermission
        );
      }
      return false;
    });
  }

  // 2. Handle hierarchical object structure (from API if nested)
  // requiredPermission can be "posts" or "reflect.children.form"
  const parts = requiredPermission.split(".");
  let current = userPermissions;

  for (const part of parts) {
    if (current === undefined || current === null) return false;
    current = current[part];
  }

  if (typeof current === "boolean") return current;
  if (current && typeof current === "object") {
    return Object.values(current).some(
      (v) => v === true || (typeof v === "object" && v !== null),
    );
  }

  return false;
};

/**
 * Returns the first authorized path for an admin user based on their permissions.
 */
export const getLandingPath = (user: any): string => {
  if (!user || user.role !== "admin") return "/";

  const userPermissions = user.permissions;
  if (!userPermissions) return "/";

  for (const item of adminMenu) {
    if (hasPermission(userPermissions, item.permission)) {
      if (item.children && item.children.length > 0) {
        // Find first authorized child
        for (const child of item.children) {
          if (
            hasPermission(
              userPermissions,
              (child as any).permission || item.permission,
            )
          ) {
            return child.to;
          }
        }
      }
      if (item.to) return item.to;
    }
  }

  return "/admin";
};

/**
 * Strictly checks if a specific admin path is authorized for a user.
 * Uses a whitelist approach based on adminMenu mapping.
 */
export const isPathAllowed = (path: string, user: any): boolean => {
  if (!user || user.role !== "admin") return false;

  const userPermissions = user.permissions;
  if (!userPermissions) return false;

  // Normalize path by removing trailing slash for comparison
  const cleanPath = path.replace(/\/$/, "");
  const adminRoot = "/admin";

  // Root admin path is allowed as it handles internal redirection
  if (cleanPath === adminRoot) return true;

  // Search for the path in adminMenu
  for (const item of adminMenu) {
    // 1. Check top-level menu item
    if (item.to) {
      const cleanItemTo = item.to.replace(/\/$/, "");
      if (
        cleanPath === cleanItemTo ||
        cleanPath.startsWith(cleanItemTo + "/")
      ) {
        return hasPermission(userPermissions, item.permission);
      }
    }

    // 2. Check nested children
    if (item.children) {
      const matchingChild = item.children.find((child) => {
        const cleanChildTo = child.to.replace(/\/$/, "");
        return (
          cleanPath === cleanChildTo || cleanPath.startsWith(cleanChildTo + "/")
        );
      });

      if (matchingChild) {
        // Check child's own permission if it exists, otherwise fallback to parent
        const childPermission =
          (matchingChild as any).permission || item.permission;
        return hasPermission(userPermissions, childPermission);
      }
    }
  }

  // Paths starting with /admin that are NOT found in the menu
  // (e.g., system utilities, profile) are allowed only if the user
  // is an admin who has at least some permissions.
  return cleanPath.startsWith(adminRoot);
};
