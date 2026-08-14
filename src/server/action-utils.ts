import "server-only";

import { z } from "zod";

export type ActionState<T = unknown> = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};

export const initialActionState: ActionState = {};

export function fail<T = unknown>(message: string, errors?: Record<string, string[]>): ActionState<T> {
  return { ok: false, message, errors };
}

export function success<T>(message?: string, data?: T): ActionState<T> {
  return { ok: true, message, data };
}

export function fromZod(error: z.ZodError): ActionState {
  const flat = error.flatten();
  const first = Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0];
  return {
    ok: false,
    message: first ?? "Bitte überprüfe deine Eingaben.",
    errors: flat.fieldErrors as Record<string, string[]>,
  };
}

export function bool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v : undefined;
}

export function num(fd: FormData, key: string) {
  const v = str(fd, key);
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function strList(fd: FormData, key: string) {
  return fd.getAll(key).filter((v): v is string => typeof v === "string" && v.length > 0);
}

/** Sehr einfache In-Memory-Ratenbegrenzung (pro Prozess). */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, remaining: 0, retryAfter: bucket.reset - now };
  return { ok: true, remaining: limit - bucket.count };
}
