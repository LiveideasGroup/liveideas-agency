import nodemailer from "nodemailer";
import { db, getSetting, logEvent } from "./db.js";

/**
 * Sends emails the owner has approved. Nothing else in the system sends email.
 * Without SMTP settings it does nothing, so approved emails simply wait.
 */
export async function sendApprovedEmails(): Promise<number> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return 0;

  if (await getSetting<boolean>("kill_switch", false)) return 0;

  const cap = Number(await getSetting<number>("daily_send_cap", 40));
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await db()
    .from("approvals")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", dayStart.toISOString());
  const room = cap - (sentToday ?? 0);
  if (room <= 0) return 0;

  const { data: queue } = await db()
    .from("approvals")
    .select("id, lead_id, payload")
    .eq("kind", "email")
    .eq("status", "approved")
    .order("decided_at", { ascending: true })
    .limit(Math.min(room, 10));
  if (!queue?.length) return 0;

  const transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user, pass },
  });

  const from = process.env.SENDER_FROM ?? user;
  const signature = process.env.SENDER_SIGNATURE ?? process.env.COMPANY_NAME ?? "LiveIdeas";
  const footer =
    process.env.OPT_OUT_FOOTER ??
    "If this isn't relevant, reply \"no thanks\" and we won't contact you again.";

  let sent = 0;
  for (const item of queue) {
    const { to, subject, body } = item.payload as { to: string; subject: string; body: string };

    if (item.lead_id) {
      const { data: lead } = await db().from("leads").select("status").eq("id", item.lead_id).maybeSingle();
      if (lead?.status === "opted_out") {
        await db().from("approvals").update({ status: "failed", owner_note: "lead opted out" }).eq("id", item.id);
        continue;
      }
    }

    try {
      await transport.sendMail({ from, to, subject, text: `${body}\n\n${signature}\n\n${footer}` });
      await db().from("approvals").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", item.id);
      if (item.lead_id) {
        await db().from("leads").update({ status: "contacted", updated_at: new Date().toISOString() }).eq("id", item.lead_id);
      }
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db().from("approvals").update({ status: "failed", owner_note: message }).eq("id", item.id);
      await logEvent("sales", `Email to ${to} failed: ${message}`, "error");
    }
  }
  if (sent) await logEvent("sales", `Sent ${sent} approved email${sent === 1 ? "" : "s"}`);
  return sent;
}
