import { describe, it, expect, vi, beforeEach } from "vitest";

type Row = { id: number; prix: number | null; promotion: number | null };

// Catalogue: 337 is the real case from TESTS-FILTRES F2 (shown at 89 002).
let catalogue: Row[] = [];

// Minimal in-memory stand-in for the Prisma calls the services make: honours
// where.id.in, where.prix (gte/lte/lt on the stored, pre-discount price — which
// is what MySQL would do), orderBy on one or two columns, skip/take, select.
function fakeFindMany(args: any = {}) {
  let list = [...catalogue];
  const w = args.where ?? {};
  if (w.id?.in) list = list.filter(r => w.id.in.includes(r.id));
  if (w.prix) list = list.filter(r => matchRange(r.prix, w.prix));
  const order = args.orderBy ? (Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]) : [];
  list.sort((a: any, b: any) => {
    for (const o of order) {
      const [k, dir] = Object.entries(o)[0] as [string, string];
      const d = (a[k] ?? -Infinity) - (b[k] ?? -Infinity);
      if (d) return dir === "asc" ? d : -d;
    }
    return 0;
  });
  if (args.skip) list = list.slice(args.skip);
  if (args.take !== undefined) list = list.slice(0, args.take);
  if (args.select) return Promise.resolve(list.map(r => pick(r, args.select)));
  return Promise.resolve(list);
}
function matchRange(v: number | null, r: any) {
  if (v === null) return false;
  if (r.gte !== undefined && v < r.gte) return false;
  if (r.lte !== undefined && v > r.lte) return false;
  if (r.lt !== undefined && v >= r.lt) return false;
  return true;
}
function pick(r: any, select: any) {
  return Object.fromEntries(Object.keys(select).map(k => [k, r[k]]));
}
function fakeAggregate() {
  const p = catalogue.map(r => r.prix).filter((v): v is number => v !== null);
  return Promise.resolve({ _min: { prix: Math.min(...p) }, _max: { prix: Math.max(...p) }, _avg: { prix: 0 } });
}
const fakeCount = (args: any = {}) => fakeFindMany({ where: args.where }).then(l => l.length);

vi.mock("../src/utils", () => ({
  prisma: {
    produits: {
      findMany: (a: any) => fakeFindMany(a),
      count: (a: any) => fakeCount(a),
      aggregate: () => fakeAggregate(),
    },
  },
}));
vi.mock("../src/transformers/product.transformer", () => ({
  ProductTransformer: { formatProducts: (p: any[]) => p },
}));

import { ProductsService } from "../src/services/products.service";
import { FiltersService } from "../src/services/filters.service";
import { productQuerySchema } from "../src/schemas/product.schema";

const list = (q: Record<string, string>) =>
  new ProductsService().getFilteredProducts(productQuerySchema.parse(q));
const ids = (r: any) => r.products.map((p: any) => p.id);

describe("F2 — price filter and sort use the discounted (displayed) price", () => {
  beforeEach(() => {
    catalogue = [
      { id: 337, prix: 100002, promotion: 11 }, // shown 89 001.78
      { id: 1, prix: 89001, promotion: 50 },    // shown 44 500.5
      { id: 2, prix: 60000, promotion: null },  // shown 60 000
      { id: 3, prix: 95000, promotion: 0 },     // shown 95 000
    ];
  });

  it("prixMin/prixMax match the price shown on the card", async () => {
    const r = await list({ prixMin: "89000", prixMax: "89003" });
    expect(ids(r)).toEqual([337]);
    expect(r.pagination.totalCount).toBe(1);
  });

  it("a 50 000 – 100 000 range keeps 337 and drops the product shown at 44 500", async () => {
    const r = await list({ prixMin: "50000", prixMax: "100000", limit: "50" });
    expect(ids(r).sort()).toEqual([2, 3, 337]);
  });

  it("prix_asc sorts on the discounted price", async () => {
    const r = await list({ sortBy: "prix_asc", limit: "50" });
    expect(ids(r)).toEqual([1, 2, 337, 3]);
  });

  it("prix_desc sorts on the discounted price", async () => {
    const r = await list({ sortBy: "prix_desc", limit: "50" });
    expect(ids(r)).toEqual([3, 337, 2, 1]);
  });

  it("price sort paginates consistently", async () => {
    const p2 = await list({ sortBy: "prix_asc", limit: "2", page: "2" });
    expect(ids(p2)).toEqual([337, 3]);
    expect(p2.pagination.totalCount).toBe(4);
    expect(p2.pagination.totalPages).toBe(2);
  });

  it("price filter combines with a non-price sort", async () => {
    const r = await list({ prixMin: "50000", sortBy: "nom_asc", limit: "50" });
    expect(ids(r).sort()).toEqual([2, 3, 337]);
  });
});

describe("F2 — filter-panel price buckets count on the discounted price", () => {
  beforeEach(() => {
    catalogue = [
      { id: 337, prix: 100002, promotion: 11 },
      { id: 2, prix: 20000, promotion: null },
      { id: 3, prix: 180000, promotion: 0 },
    ];
  });

  // Shown prices 20 000 / 89 002 / 180 000 → step 50 000, buckets start at
  // 0, 50 000, 100 000, 150 000. 337 belongs in [50 000, 100 000), and the
  // [100 000, 150 000) bucket (where its pre-discount price sits) is empty.
  it("337 is counted in the bucket that contains 89 002, not 100 002", async () => {
    const { ranges } = await (new FiltersService() as any).getPrixRanges();
    expect(ranges.map((r: any) => [r.min, r.max, r.count])).toEqual([
      [0, 50000, 1],
      [50000, 100000, 1],
      [150000, null, 1],
    ]);
  });
});
