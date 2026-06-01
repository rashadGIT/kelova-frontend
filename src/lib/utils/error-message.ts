type AxiosLike = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
};

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;

  const axiosErr = err as AxiosLike;
  const msg = axiosErr.response?.data?.message;

  if (typeof msg === 'string' && msg) return msg;
  if (Array.isArray(msg)) {
    const first = msg[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object' && first !== null) {
      const constraints = (first as Record<string, unknown>).constraints;
      if (constraints && typeof constraints === 'object') {
        const values = Object.values(constraints as Record<string, string>);
        if (values.length > 0) return values[0];
      }
    }
  }

  if (err instanceof Error && err.message) return err.message;

  return fallback;
}
