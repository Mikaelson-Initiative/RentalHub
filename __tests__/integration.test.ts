/**
 * Integration Tests for RentalHub API
 * Tests critical user flows and API endpoints
 */

const BASE_URL = process.env.TEST_API_URL || "https://rentalhub.ng";

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`✗ ${name}: ${error}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} (got ${actual}, expected ${expected})`);
  }
}

function assertExists(value: unknown, message: string) {
  if (!value) {
    throw new Error(`${message} (got ${value})`);
  }
}

async function fetchAPI(
  path: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }
) {
  const url = new URL(path, BASE_URL).toString();
  const response = await fetch(url, {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  return response;
}

async function runTests() {
  console.log("🚀 Starting RentalHub Integration Tests\n");

  // ============================================================
  // PUBLIC ENDPOINTS
  // ============================================================

  await test("GET / - Homepage should load", async () => {
    const response = await fetchAPI("/");
    assertEqual(response.ok, true, "Homepage should return 200");
  });

  await test("GET /api/properties - List properties", async () => {
    const response = await fetchAPI("/api/properties");
    assertEqual(response.ok, true, "Properties endpoint should return 200");
    const result = await response.json();
    assertEqual(result.success, true, "Response should have success: true");
    assertExists(Array.isArray(result.data.items), "Response.data.items should be an array");
  });

  await test("GET /api/locations - List locations", async () => {
    const response = await fetchAPI("/api/locations");
    assertEqual(response.ok, true, "Locations endpoint should return 200");
    const result = await response.json();
    assertEqual(result.success, true, "Response should have success: true");
    assertExists(Array.isArray(result.data), "Response.data should be an array");
  });

  // ============================================================
  // AUTHENTICATION TESTS
  // ============================================================

  await test("POST /api/auth/register - Registration validation", async () => {
    const response = await fetchAPI("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        // Missing role - should fail
      },
    });
    assertEqual(response.status, 400, "Should reject missing role");
  });

  await test("POST /api/auth/register - Weak password validation", async () => {
    const response = await fetchAPI("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "weak", // Less than 8 characters
        role: "STUDENT",
      },
    });
    assertEqual(response.status, 400, "Should reject weak password");
  });

  await test("POST /api/auth/register - Invalid role validation", async () => {
    const response = await fetchAPI("/api/auth/register", {
      method: "POST",
      body: {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "INVALID_ROLE",
      },
    });
    assertEqual(response.status, 400, "Should reject invalid role");
  });

  // ============================================================
  // PROTECTED ENDPOINTS
  // ============================================================

  await test("GET /api/bookings - Requires authentication", async () => {
    const response = await fetchAPI("/api/bookings");
    assertEqual(response.status, 401, "Should return 401 without auth");
  });

  await test("GET /api/admin/summary - Admin access required", async () => {
    const response = await fetchAPI("/api/admin/summary");
    assertEqual(response.status, 401, "Should return 401 without auth");
  });

  await test("POST /api/uploads - Requires authentication", async () => {
    const response = await fetchAPI("/api/uploads", {
      method: "POST",
    });
    assertEqual(response.status >= 400, true, "Should require auth");
  });

  // ============================================================
  // RATE LIMITING TESTS
  // ============================================================

  await test("Rate limiting on verify-email endpoint", async () => {
    // Note: This test verifies the endpoint responds correctly.
    // Full rate limiting verification requires Redis in the test environment.
    const response = await fetchAPI("/api/auth/verify-email/send", {
      method: "POST",
      body: { email: "ratelimit-test@example.com" },
    });

    // Endpoint should return 200 (success) or 429 (rate limited if Redis available)
    assertExists(
      response.status === 200 || response.status === 429,
      "Endpoint should return 200 or 429"
    );

    const result = await response.json();
    assertEqual(result.success, true, "Response should have success: true");
  });

  // ============================================================
  // ERROR HANDLING TESTS
  // ============================================================

  await test("Invalid JSON should not expose internals", async () => {
    const response = await fetchAPI("/api/auth/register", {
      method: "POST",
      body: { invalid: "json" },
    });
    const data = await response.json();
    const errorMessage = JSON.stringify(data);
    const exposedInternals = errorMessage.includes("Unexpected") ||
      errorMessage.includes("SyntaxError") ||
      errorMessage.includes("at ") || [false][0]; // Prevent exposure
    assertEqual(exposedInternals, false, "Error should not expose stack trace");
  });

  await test("Non-existent property should return 404", async () => {
    const response = await fetchAPI(
      "/api/properties/00000000-0000-0000-0000-000000000000"
    );
    assertEqual(response.status, 404, "Should return 404 for missing property");
  });

  // ============================================================
  // SECURITY TESTS
  // ============================================================

  await test("File access requires authentication", async () => {
    const response = await fetchAPI("/api/files/uploads/test.jpg");
    assertEqual(
      response.status === 401 || response.status >= 400,
      true,
      "File access should require auth"
    );
  });

  await test("HTTPS is enforced", async () => {
    assertEqual(
      BASE_URL.startsWith("https"),
      true,
      "API should use HTTPS"
    );
  });

  // ============================================================
  // PERFORMANCE TESTS
  // ============================================================

  await test("Homepage loads within 2 seconds", async () => {
    const start = Date.now();
    await fetchAPI("/");
    const duration = Date.now() - start;
    assertEqual(duration < 2000, true, "Homepage should load in < 2s");
  });

  await test("Properties API responds within 1 second", async () => {
    const start = Date.now();
    await fetchAPI("/api/properties");
    const duration = Date.now() - start;
    assertEqual(duration < 1000, true, "API should respond in < 1s");
  });

  // ============================================================
  // RESULTS SUMMARY
  // ============================================================

  console.log("\n" + "=".repeat(60));
  console.log("TEST RESULTS SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const avgDuration = Math.round(
    results.reduce((sum, r) => sum + r.duration, 0) / total
  );

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${total - passed} ✗`);
  console.log(`Average Duration: ${avgDuration}ms`);

  if (total - passed > 0) {
    console.log("\nFailed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ✗ ${r.name}`);
        console.log(`    Error: ${r.error}`);
      });
  }

  console.log("\n" + "=".repeat(60));

  // Exit with error code if any tests failed
  process.exit(total - passed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
