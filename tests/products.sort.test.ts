import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const count = vi.fn();

vi.mock("../src/utils", () => ({
  prisma: { produits: { findMany: (...a: unknown[]) => findMany(...a), count: (...a: unknown[]) => count(...a) } },
}));

import { ProductsService } from "../src/services/products.service";
import { productQuerySchema } from "../src/schemas/product.schema";

const SORTS = ["prix_asc", "prix_desc", "note_desc", "nom_asc", "promotion_desc", "nouveaute"] as const;

describe("F1 — stable pagination", () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
    count.mockReset().mockResolvedValue(0);
  });

  it.each(SORTS)("sortBy=%s ends with a unique tiebreaker on id", async (sortBy) => {
    await new ProductsService().getFilteredProducts(productQuerySchema.parse({ sortBy }));

    const { orderBy } = findMany.mock.calls[0][0];
    expect(Array.isArray(orderBy)).toBe(true);
    expect(orderBy[orderBy.length - 1]).toEqual({ id: "asc" });
    expect(orderBy.length).toBe(2);
  });
});
