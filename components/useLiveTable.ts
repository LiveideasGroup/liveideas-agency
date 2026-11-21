"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Loads rows with `query` and reloads them whenever any of `tables` changes,
 * using Supabase Realtime. Keeps the dashboard live without manual refresh.
 */
export function useLiveTable<T>(
  key: string,
  tables: string[],
  query: (sb: SupabaseClient) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const sb = useRef(supabaseBrowser()).current;
  const [rows, setRows] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const queryRef = useRef(query);
  queryRef.current = query;

  const reload = useCallback(async () => {
    const { data, error } = await queryRef.current(sb);
    setError(error?.message ?? null);
    if (data) setRows(data);
    setLoading(false);
  }, [sb]);

  useEffect(() => {
    reload();
    const channel = sb.channel(`live-${key}`);
    for (const table of tables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => reload());
    }
    channel.subscribe();
    return () => {
      sb.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, reload, sb]);

  return { rows, error, loading, reload, sb };
}
