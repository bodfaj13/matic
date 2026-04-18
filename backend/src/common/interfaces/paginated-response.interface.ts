export interface PaginatedResponse<T = unknown> {
  message: string;
  status: boolean;
  data: T[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
  statusCode: string;
}
