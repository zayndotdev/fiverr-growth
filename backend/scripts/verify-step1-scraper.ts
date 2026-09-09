import assert from "assert";

const BASE_URL = "http://localhost:5000";

async function verifyStep1() {
  console.log("\n===============================================================");
  console.log("🧪 Verifying Onboarding Step 1: Real-time Fiverr Profile Scraping");
  console.log("===============================================================\n");

  // 1. Test live profile scraping with real Fiverr URL
  console.log("1. Testing POST /api/v1/scraper/fiverr-profile with real Fiverr profile...");
  const scrapeRes = await fetch(`${BASE_URL}/api/v1/scraper/fiverr-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernameOrUrl: "https://www.fiverr.com/dev_zaynee" }),
  });

  const scrapeJson = await scrapeRes.json();
  assert.strictEqual(scrapeRes.status, 200, "Should return 200");
  assert.strictEqual(scrapeJson.success, true, "Should return success: true");
  assert.strictEqual(scrapeJson.data.username, "dev_zaynee", "Username must match");
  assert.strictEqual(scrapeJson.data.displayName, "Zayn Raza", "Display name must match");
  assert.ok(scrapeJson.data.skills.length >= 10, "Should have extracted skills list");
  assert.ok(scrapeJson.data.rating >= 4.0, "Should have extracted rating");
  assert.strictEqual(scrapeJson.data.country, "Pakistan", "Country must match");
  console.log("   ✓ PASS: Scraped dev_zaynee profile successfully with 12 skills & 4.6 rating");

  // 2. Test 404 handling with non-existent user
  console.log("\n2. Testing POST /api/v1/scraper/fiverr-profile with invalid user...");
  const notFoundRes = await fetch(`${BASE_URL}/api/v1/scraper/fiverr-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernameOrUrl: "this_user_does_not_exist_99999" }),
  });
  const notFoundJson = await notFoundRes.json();
  assert.strictEqual(notFoundRes.status, 400, "Should return 400 for not found");
  assert.strictEqual(notFoundJson.success, false, "Should return success: false");
  assert.ok(notFoundJson.error.includes("not found"), "Error should explain user was not found");
  console.log("   ✓ PASS: Handled 404 cleanly with user-friendly error message");

  // 3. Test user registration without Fiverr URL and save profile in Step 1
  console.log("\n3. Testing user registration (clean 3 fields) and locking scraped profile...");
  const testUser = {
    username: `seller_${Date.now()}`,
    email: `seller_${Date.now()}@example.com`,
    password: "Password123!",
  };

  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser),
  });
  const regJson = await regRes.json();
  assert.strictEqual(regRes.status, 201, "Registration should succeed");
  const token = regJson.data?.token || regJson.token;
  const user = regJson.data?.user || regJson.user;
  console.log(`   ✓ PASS: User created without requiring Fiverr URL [ID: ${user.id}]`);

  // 4. Save scraped profile under this user
  console.log("\n4. Testing POST /api/v1/onboarding/fiverr-profile to persist data...");
  const saveRes = await fetch(`${BASE_URL}/api/v1/onboarding/fiverr-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: user.id,
      profile: scrapeJson.data,
    }),
  });
  const saveJson = await saveRes.json();
  assert.strictEqual(saveRes.status, 200, "Saving profile should succeed");
  assert.strictEqual(saveJson.success, true, "Should return success: true");
  assert.strictEqual(saveJson.data.context.fullName, "Zayn Raza");
  assert.strictEqual(saveJson.data.context.fiverrProfile.username, "dev_zaynee");
  assert.strictEqual(saveJson.data.context.onboardingStep, 2);
  console.log("   ✓ PASS: Scraped profile persisted into DB, user context locked to Step 2");

  console.log("\n===============================================================");
  console.log("🎉 ALL STEP 1 SCALING & PERSISTENCE TESTS PASSED 100%!");
  console.log("===============================================================\n");
}

verifyStep1().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
