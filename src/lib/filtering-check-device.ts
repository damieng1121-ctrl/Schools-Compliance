import type { CheckDeviceType, CheckUserType } from "@prisma/client";

export const USER_TYPE_LABEL: Record<CheckUserType, string> = {
  STAFF: "Staff",
  STUDENT: "Student",
  GUEST: "Guest",
  VISITOR: "Visitor",
  OTHER: "Other",
};

export const DEVICE_TYPE_LABEL: Record<CheckDeviceType, string> = {
  LAPTOP: "Laptop",
  DESKTOP: "Desktop",
  CHROMEBOOK: "Chromebook",
  TABLET: "Tablet",
  PHONE: "Phone",
  INTERACTIVE_WHITEBOARD: "Interactive whiteboard",
  NETWORK: "Network/guest Wi-Fi",
  OTHER: "Other",
};

/**
 * Builds the display label stored on a FilteringCheckDevice from its
 * structured fields, e.g. "Staff — Laptop — Reception". At least one of
 * userType/deviceType/location is required by the caller.
 */
export function composeDeviceLabel({
  userType,
  deviceType,
  location,
}: {
  userType?: CheckUserType | null;
  deviceType?: CheckDeviceType | null;
  location?: string | null;
}): string {
  const parts = [
    userType ? USER_TYPE_LABEL[userType] : null,
    deviceType ? DEVICE_TYPE_LABEL[deviceType] : null,
    location?.trim() || null,
  ].filter((p): p is string => !!p);

  return parts.join(" — ");
}
