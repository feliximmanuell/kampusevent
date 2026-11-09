export class HttpError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);
export const unauthorized = (message = 'Silakan login terlebih dahulu') =>
  new HttpError(401, message);
export const forbidden = (message = 'Anda tidak memiliki akses') => new HttpError(403, message);
export const notFound = (message = 'Data tidak ditemukan') => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);
