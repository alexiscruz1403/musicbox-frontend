export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
}
