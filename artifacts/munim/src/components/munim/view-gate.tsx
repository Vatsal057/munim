import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api";
import { ErrorView, NotFoundView, PageSkeleton } from "./ui";

/** Renders loading / 404 / error states for a view query, else children(data). */
export function ViewGate<T>({ q, children, rows }: { q: UseQueryResult<T, ApiError>; children: (data: T) => ReactNode; rows?: number }) {
  if (q.isPending) return <PageSkeleton rows={rows} />;
  if (q.isError) {
    if (q.error.status === 401) return <PageSkeleton rows={rows} />;
    if (q.error.status === 404) return <NotFoundView />;
    return <ErrorView onRetry={() => q.refetch()} />;
  }
  return <>{children(q.data)}</>;
}
