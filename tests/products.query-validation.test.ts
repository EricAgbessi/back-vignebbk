import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const count = vi.fn();

vi.mock("../src/utils", () => ({
  prisma: { produits: { findMany: (...a: unknown[]) => findMany(...a), count: (...a: unknown[]) => count(...a) } },
}));
vi.mock("../src/middleware/auth", () => ({
  adminMiddleware: async (_c: unknown, next: () => Promise<void>) => next(),
}));

import productsRoutes from "../src/routes/products.routes";

const get = (qs: string) => productsRoutes.request(`/?${qs}`);

describe("F3 — invalid query params get a clean 400, never reach Prisma", () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
    count.mockReset().mockResolvedValue(0);
  });

  it.each([
    "page=0",
    "page=-1",
    "page=abc",
    "limit=abc",
    "regions=abc",
    "prixMin=abc",
    "types=whisky",
    "cognacRegions=Grande%20Champagne",
  ])("%s → 400", async (qs) => {
    const res = await get(qs);
    expect(res.status).toBe(400);
    expect(findMany).not.toHaveBeenCalled();
  });

  it.each([
    "",
    "page=2&limit=12",
    "regions=1,2",
    "prixMin=1000&prixMax=50000.5",
    "types=vin,champagne",
    "cognacRegions=Grande_Champagne",
    "champagneTypes=Extra_Brut",
  ])("valid query '%s' → 200", async (qs) => {
    const res = await get(qs);
    expect(res.status).toBe(200);
  });
});

describe("F4 — limit is bounded", () => {
  beforeEach(() => {
    findMany.mockReset().mockResolvedValue([]);
    count.mockReset().mockResolvedValue(0);
  });

  it.each(["limit=0", "limit=-5", "limit=101", "limit=100000"])("%s → 400", async (qs) => {
    expect((await get(qs)).status).toBe(400);
  });

  it.each(["limit=1", "limit=60", "limit=100"])("%s → 200", async (qs) => {
    expect((await get(qs)).status).toBe(200);
  });
});
