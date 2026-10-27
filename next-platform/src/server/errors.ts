export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function fail(status: number, message: string): never {
  throw new AppError(status, message);
}
export function log(event: string, details: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({ time: new Date().toISOString(), event, ...details }),
  );
}
export function api(fn: (request: Request, context: any) => Promise<Response>) {
  return async (request: Request, context: any) => {
    const traceId = crypto.randomUUID();
    try {
      return await fn(request, context);
    } catch (e) {
      if (!(e instanceof AppError))
        log("request_failed", {
          traceId,
          error: e instanceof Error ? e.message : "unknown",
        });
      return Response.json(
        {
          error:
            e instanceof AppError
              ? e.message
              : "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
          traceId,
        },
        { status: e instanceof AppError ? e.status : 500 },
      );
    }
  };
}
