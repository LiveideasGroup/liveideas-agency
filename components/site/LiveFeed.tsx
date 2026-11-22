"use client";
import { useEffect, useState } from "react";
import type { Feed } from "@/lib/site/activity";

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** The hero console. Starts from server-rendered data, then refreshes from /api/activity every 20 seconds. */
export function LiveFeed({ initial }: { initial: Feed }) {
  const [feed, setFeed] = useState(initial);

  useEffect(() => {
    if (!initial.live) return;
    let stop = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/activity", { cache: "no-store" });
        if (res.ok && !stop) setFeed(await res.json());
      } catch {
        // Keep showing what we have.
      }
    };
    const id = setInterval(load, 20_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [initial.live]);

  const items = feed.items.slice(0, 6);
  return (
    <div className="console" role="region" aria-label={feed.live ? "Live agent activity" : "Example agent activity"}>
      <div className="console-bar">
        <span className="console-title">
          <span className="dots" aria-hidden="true"><i /><i /><i /></span>
          agents / activity
        </span>
        <span className="status" data-live={feed.live}>{feed.live ? "Live" : "Example"}</span>
      </div>
      <ol className="feed-list" aria-live="polite">
        {items.map((it) => (
          <li key={it.id} className="feed-item" data-status={it.status}>
            <time dateTime={it.at} suppressHydrationWarning>{time(it.at)}</time>
            <span className="agent-tag" data-agent={it.agent}>{it.agent}</span>
            <span className="feed-text">{it.text}</span>
          </li>
        ))}
      </ol>
      {feed.live && feed.stats ? (
        <div className="console-foot">
          <div><b>{feed.stats.tasksDone7d}</b><span>tasks done, 7 days</span></div>
          <div><b>{feed.stats.leadsFound7d}</b><span>companies researched</span></div>
          <div><b>{feed.stats.repliesSent7d}</b><span>written replies sent</span></div>
        </div>
      ) : (
        <p className="console-note">Example of the feed. When it is live, it shows what our agents are doing right now, with no client names or details.</p>
      )}
    </div>
  );
}
