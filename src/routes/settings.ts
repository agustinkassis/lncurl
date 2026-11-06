import { readFileSync } from "node:fs";
import { lookup } from "node:dns/promises";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { rescheduleChargeLoop } from "../charge-loop.js";
import { rescheduleRateLimitCleanup } from "../rate-limit.js";
import {
  getRuntimeSettings,
  saveRuntimeSettings,
  type RuntimeSettings,
} from "../settings.js";
import { isSameOrigin } from "./setup.js";

export function unsafePublicSettingsEnabled(): boolean {
  return process.env.UNSAFE_PUBLIC_SETTINGS === "true";
}

function normalizeAddress(address: string): string {
  return address.replace(/^::ffff:/, "");
}

/** IPv4 default gateway from a /proc/net/route table: inside a container, the Docker bridge (the host). */
export function defaultGateway(routeTable: string): string | null {
  for (const line of routeTable.split("\n").slice(1)) {
    const [, destination, gateway] = line.trim().split(/\s+/);
    if (destination !== "00000000" || !gateway) continue;
    const n = parseInt(gateway, 16);
    return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, n >>> 24].join(".");
  }
  return null;
}

function containerGateway(): string | null {
  try {
    return defaultGateway(readFileSync("/proc/net/route", "utf8"));
  } catch {
    return null;
  }
}

export async function isFromUmbrelAppProxy(
  request: FastifyRequest,
  gateway: string | null = containerGateway(),
): Promise<boolean> {
  if (!unsafePublicSettingsEnabled()) return false;
  // Newer umbrelOS drops the per-app app_proxy container: umbreld's built-in
  // gateway proxies from the host and enforces PROXY_AUTH_BLACKLIST itself
  // (302 to app-auth), so its requests reach us from the bridge gateway.
  if (gateway && normalizeAddress(request.ip) === gateway) return true;
  const host = process.env.UMBREL_APP_PROXY_HOST?.trim();
  if (!host) return false;
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.some(
      ({ address }) => normalizeAddress(address) === normalizeAddress(request.ip),
    );
  } catch {
    return false;
  }
}

export async function configRoutes(fastify: FastifyInstance) {
  fastify.get("/api/config", async () => ({
    unsafePublicSettings: unsafePublicSettingsEnabled(),
  }));
}

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (request, reply) => {
    if (!(await isFromUmbrelAppProxy(request))) {
      return reply.status(403).send({ error: "Umbrel app proxy required." });
    }
  });

  fastify.get("/api/settings", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return getRuntimeSettings();
  });

  fastify.put<{ Body: RuntimeSettings }>("/api/settings", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    if (!isSameOrigin(request)) {
      return reply.status(403).send({ error: "Same-origin request required." });
    }
    try {
      const settings = await saveRuntimeSettings(request.body);
      rescheduleRateLimitCleanup();
      await rescheduleChargeLoop();
      return settings;
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Unable to save settings.",
      });
    }
  });
}
