export interface BaseResponse<T = unknown> {
  message: string;
  status: boolean;
  data?: T;
  statusCode: string;
}
