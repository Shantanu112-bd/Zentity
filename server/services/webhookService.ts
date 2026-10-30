import crypto from "crypto";
import { db } from "../db/index.ts";
import type { WebhookRecord } from "../db/index.ts";

export interface WebhookDeliveryResult {
  webhookId: string;
  status: "DELIVERED" | "FAILED" | "PENDING";
  statusCode?: number;
  error?: string;
  signature?: string;
}

export function computeWebhookSignature(payload: any, secret: string, timestamp: number): string {
  const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
  const toSign = `${timestamp}.${serialized}`;
  return crypto.createHmac("sha256", secret).update(toSign).digest("hex");
}

export function verifyWebhookSignature(
  payload: any,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  // Format: t=<timestamp>,v1=<signature>
  const parts = signatureHeader.split(",");
  let timestamp = 0;
  let signature = "";

  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = parseInt(v, 10);
    if (k === "v1") signature = v;
  }

  if (!timestamp || !signature) return false;

  // Check replay timestamp within tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false;
  }

  const expected = computeWebhookSignature(payload, secret, timestamp);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export class WebhookService {
  public async enqueue(
    destinationUrl: string,
    eventType: string,
    payload: any,
    secret: string,
    tenantId?: string
  ): Promise<WebhookRecord> {
    const id = `wh-${crypto.randomBytes(12).toString("hex")}`;
    const secretHash = crypto.createHash("sha256").update(secret).digest("hex");

    const record: WebhookRecord = {
      id,
      tenantId,
      destinationUrl,
      secretHash,
      eventType,
      payload,
      attempts: 0,
      maxAttempts: 3,
      status: "PENDING",
      createdAt: new Date(),
    };

    await db.enqueueWebhook(record);
    return record;
  }

  public async deliverOne(
    webhook: WebhookRecord,
    secret: string
  ): Promise<WebhookDeliveryResult> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = computeWebhookSignature(webhook.payload, secret, timestamp);
    const signatureHeader = `t=${timestamp},v1=${signature}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(webhook.destinationUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Pramaan-Signature": signatureHeader,
          "X-Pramaan-Timestamp": timestamp.toString(),
          "X-Pramaan-Event": webhook.eventType,
          "User-Agent": "Pramaan-ZK-Webhook-Delivery/1.0",
        },
        body: JSON.stringify(webhook.payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        await db.updateWebhookStatus(webhook.id, "DELIVERED", res.status);
        return { webhookId: webhook.id, status: "DELIVERED", statusCode: res.status, signature: signatureHeader };
      } else {
        const attempts = (webhook.attempts || 0) + 1;
        const newStatus = attempts >= (webhook.maxAttempts || 3) ? "FAILED" : "PENDING";
        await db.updateWebhookStatus(webhook.id, newStatus, res.status, `HTTP error ${res.status}`);
        return { webhookId: webhook.id, status: newStatus, statusCode: res.status, error: `HTTP ${res.status}` };
      }
    } catch (err: any) {
      const attempts = (webhook.attempts || 0) + 1;
      const newStatus = attempts >= (webhook.maxAttempts || 3) ? "FAILED" : "PENDING";
      const errorMsg = err?.name === "AbortError" ? "Delivery timed out (5000ms)" : err?.message || "Delivery failed";
      await db.updateWebhookStatus(webhook.id, newStatus, 0, errorMsg);
      return { webhookId: webhook.id, status: newStatus, error: errorMsg };
    }
  }
}

export const webhookService = new WebhookService();
