export interface BaseResponse<T> {
  timestamp?: string;
  status?: number;
  message?: string;
  data: T;
}

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

export interface SortObject {
  direction?: string;
  nullHandling?: string;
  ascending?: boolean;
  property?: string;
  ignoreCase?: boolean;
}

export interface PageableObject {
  pageNumber?: number;
  unpaged?: boolean;
  paged?: boolean;
  pageSize?: number;
  offset?: number;
  sort?: SortObject[];
}

export interface PageResponse<T> {
  totalElements: number;
  totalPages: number;
  pageable: PageableObject;
  numberOfElements: number;
  size: number;
  content: T[];
  number: number;
  sort: SortObject[];
  first: boolean;
  last: boolean;
  empty: boolean;
}
