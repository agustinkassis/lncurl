import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { validateRuntimeSettings } from "../src/settings.js";
import { isTrustedCaller } from "../src/rate-limit.js";
import {
  configRoutes,
  defaultGateway,
  isFromUmbrelAppProxy,
  settingsRoutes,
  unsafePublicSettingsEnabled,
} from "../src/routes/settings.js";

const valid = {
  chargeAmountSats: 1,
  chargeIntervalMs: 3_600_000,
  gracePeriodSeconds: 3_600,
  rateLimitPerHour: 10,
  rateLimitCleanupMs: 600_000,
  trustedCallerKey: "",
};

test("runtime settings accept safe integers and reject unsafe values", () => {
  assert.deepEqual(validateRuntimeSettings(valid), valid);
  assert.throws(() => validateRuntimeSettings({ ...valid, chargeAmountSats: 0 }));
  assert.throws(() => validateRuntimeSettings({ ...valid, chargeIntervalMs: 1_000 }));
  assert.throws(() => validateRuntimeSettings({ ...valid, rateLimitPerHour: 1.5 }));
});

test("trusted caller key is optional, defaults off, and must be long", () => {
  const { trustedCallerKey: _omit, ...legacy } = valid;
  assert.equal(validateRuntimeSettings(legacy).trustedCallerKey, "");
  assert.throws(() => validateRuntimeSettings({ ...valid, trustedCallerKey: "short" }));
  assert.throws(() => validateRuntimeSettings({ ...valid, trustedCallerKey: 42 }));
  const key = "k".repeat(32);
  assert.equal(validateRuntimeSettings({ ...valid, trustedCallerKey: ` ${key} ` }).trustedCallerKey, key);
});

test("only the exact bearer key is trusted", () => {
  const key = "k".repeat(32);
  assert.equal(isTrustedCaller(`Bearer ${key}`, key), true);
  assert.equal(isTrustedCaller(`Bearer ${key}x`, key), false);
  assert.equal(isTrustedCaller(key, key), false);
  assert.equal(isTrustedCaller(undefined, key), false);
  assert.equal(isTrustedCaller("Bearer ", ""), false);
});

test("public settings default to disabled", () => {
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
  assert.equal(unsafePublicSettingsEnabled(), false);
  process.env.UNSAFE_PUBLIC_SETTINGS = "true";
  assert.equal(unsafePublicSettingsEnabled(), true);
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
});

test("public config exposes only the settings feature flag", async () => {
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
  const app = Fastify();
  await app.register(configRoutes);
  assert.deepEqual((await app.inject({ url: "/api/config" })).json(), {
    unsafePublicSettings: false,
  });
  process.env.UNSAFE_PUBLIC_SETTINGS = "true";
  assert.deepEqual((await app.inject({ url: "/api/config" })).json(), {
    unsafePublicSettings: true,
  });
  await app.close();
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
});

test("settings API only accepts the configured Umbrel proxy", async () => {
  process.env.UNSAFE_PUBLIC_SETTINGS = "true";
  process.env.UMBREL_APP_PROXY_HOST = "127.0.0.1";
  const app = Fastify();
  await app.register(settingsRoutes);

  assert.equal((await app.inject({ url: "/api/settings" })).statusCode, 200);
  assert.equal(
    (await app.inject({ url: "/api/settings", remoteAddress: "127.0.0.2" })).statusCode,
    403,
  );

  await app.close();
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
  delete process.env.UMBREL_APP_PROXY_HOST;
});

const ROUTES = `Iface\tDestination\tGateway \tFlags\tRefCnt\tUse\tMetric\tMask
eth0\t00000000\t010015AC\t0003\t0\t0\t0\t00000000
eth0\t000015AC\t00000000\t0001\t0\t0\t0\t0000FFFF
`;

test("reads the container default gateway from /proc/net/route", () => {
  assert.equal(defaultGateway(ROUTES), "172.21.0.1");
  assert.equal(defaultGateway("Iface\tDestination\tGateway\n"), null);
});

test("trusts the umbrelOS gateway only when public settings are enabled", async () => {
  delete process.env.UMBREL_APP_PROXY_HOST;
  const from = (ip: string) => ({ ip }) as never;
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
  assert.equal(await isFromUmbrelAppProxy(from("10.21.0.1"), "10.21.0.1"), false);
  process.env.UNSAFE_PUBLIC_SETTINGS = "true";
  assert.equal(await isFromUmbrelAppProxy(from("::ffff:10.21.0.1"), "10.21.0.1"), true);
  assert.equal(await isFromUmbrelAppProxy(from("10.21.0.7"), "10.21.0.1"), false);
  assert.equal(await isFromUmbrelAppProxy(from("10.21.0.1"), null), false);
  delete process.env.UNSAFE_PUBLIC_SETTINGS;
});
