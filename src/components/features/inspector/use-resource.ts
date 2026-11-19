"use client";

import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";

export type Resource<T> =
  | { status: "loading"; data?: T }
  | { status: "ready"; data: T }
  | { status: "error"; data?: T; error: string };

interface Settled<T> {
  url: string;
  revision: number;
  data?: T;
  error?: string;
}

/**
 * GETs `url` and reads the body with `read`, which must be stable. Refetches
 * when `revision` changes, keeping the last data for the same URL on screen
 * while it does.
 */
export function useFetchResource<T>(
  url: string,
  read: (response: Response) => Promise<T>,
  revision = 0,
): Resource<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return read(response);
      })
      .then((data) => setSettled({ url, revision, data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : String(error);
        setSettled((previous) => ({
          url,
          revision,
          data: previous?.url === url ? previous.data : undefined,
          error: message,
        }));
      });
    return () => controller.abort();
  }, [url, read, revision]);

  const data = settled?.url === url ? settled.data : undefined;
  if (settled?.url !== url || settled.revision !== revision) {
    return { status: "loading", data };
  }
  if (settled.error !== undefined) {
    return { status: "error", data, error: settled.error };
  }
  return data === undefined
    ? { status: "loading" }
    : { status: "ready", data };
}

/** `useFetchResource` for a JSON body, parsed with `schema`. */
export function useJsonResource<T>(
  url: string,
  schema: z.ZodType<T>,
  revision: number,
): Resource<T> {
  const read = useCallback(
    async (response: Response) => schema.parse(await response.json()),
    [schema],
  );
  return useFetchResource(url, read, revision);
}

const readText = (response: Response) => response.text();

/** `useFetchResource` for a text body. */
export function useTextResource(url: string): Resource<string> {
  return useFetchResource(url, readText);
}
