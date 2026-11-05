/**
 * Price the customer actually sees: same formula as the product card
 * (front-vignebbk/app/components/WineProductCard.tsx, `prix * (1 - promotion/100)`).
 * Filters, sorts and price buckets must use this, not the stored `prix`.
 *
 * Accepts Prisma `Decimal` values as well as numbers.
 */
export function discountedPrice(prix: unknown, promotion: unknown): number | null {
  if (prix === null || prix === undefined) return null;
  const base = Number(prix);
  const rate = promotion === null || promotion === undefined ? 0 : Number(promotion);
  return rate ? base * (1 - rate / 100) : base;
}
