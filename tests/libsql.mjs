// Exercise the same suite through the externally configured libSQL adapter.
// Uses an isolated file database, never production credentials.
process.env.OPS_TEST_DRIVER = "libsql";
await import("./api.test.mjs");
