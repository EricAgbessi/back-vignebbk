// types/index.ts

export interface ProductFilters {
  type?: string[];
  categories?: string[];
  regions?: number[];
  domaines?: number[];
  classifications?: number[];
  cepages?: number[];
  styles?: string[];
  prixMin?: number;
  prixMax?: number;
  millesimes?: number[];
  alcoolMin?: number;
  alcoolMax?: number;
  bio?: boolean;
  vegetalien?: boolean;
  promotion?: boolean;
  disponible?: boolean;
  champagneTypes?: string[];
  champagneStyles?: string[];
  cognacCategories?: string[];
  cognacRegions?: string[];
  accords?: number[];
  search?: string;
}

export interface ProductSort {
  field:
    | "nom"
    | "prix"
    | "millesime"
    | "teneur_alcool"
    | "cote"
    | "created_at"
    | "ordre_affichage";
  direction?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProductsResponse {
  products: any[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
