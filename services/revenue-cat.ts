export const ENTITLEMENTS = {
  PRO: "pro",
} as const;

export const PRODUCTS = {
  WEEKLY: "scentify_pro_weekly",
  ANNUAL: "scentify_pro_annual",
} as const;

export async function initRevenueCat() {
  return true;
}

export async function purchaseWeekly() {
  return false;
}

export async function checkPremiumStatus() {
  return false;
}
