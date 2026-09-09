import assert from "assert";

const BASE_URL = "http://localhost:5000";

async function verifyFullOnboarding() {
  console.log("\n===============================================================");
  console.log("🧪 Verifying Complete 3-Step Onboarding Architecture & Flow");
  console.log("===============================================================\n");

  // 1. Register a fresh user
  console.log("1. Registering new user...");
  const testUser = {
    username: `seller_flow_${Date.now()}`,
    email: `seller_flow_${Date.now()}@test.com`,
    password: "Password123!",
  };

  const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser),
  });

  const regJson = await regRes.json();
  assert.strictEqual(regRes.status, 201, "Registration should return 201");
  assert.strictEqual(regJson.success, true, "Registration should succeed");

  const token = regJson.data?.token || regJson.token;
  const user = regJson.data?.user || regJson.user;
  assert.ok(token, "JWT token must be present");
  assert.strictEqual(user.onboardingCompleted, false, "Initial onboardingCompleted must be false");
  assert.strictEqual(user.onboardingSkipped, false, "Initial onboardingSkipped must be false");
  assert.strictEqual(user.onboardingStep, 1, "Initial onboardingStep must be 1");
  console.log(`   ✓ PASS: Registered user [ID: ${user.id}], flags: completed=false, skipped=false, step=1`);

  // 2. Test Step 1: Scrape & Confirm Profile
  console.log("\n2. Testing Step 1: Scraping & confirming Fiverr profile...");
  const scrapeRes = await fetch(`${BASE_URL}/api/v1/scraper/fiverr-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ usernameOrUrl: "dev_zaynee" }),
  });
  const scrapeJson = await scrapeRes.json();
  assert.strictEqual(scrapeJson.success, true, "Scraping should succeed");
  assert.strictEqual(scrapeJson.data.username, "dev_zaynee");

  // Save profile under this user
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
  assert.strictEqual(saveJson.success, true, "Saving profile should succeed");
  console.log("   ✓ PASS: Step 1 completed — Profile linked to user");

  // 3. Test Step 2: Generate ICPs
  console.log("\n3. Testing Step 2: Generating ICPs from profile data...");
  const icpRes = await fetch(`${BASE_URL}/api/v1/onboarding/generate-icps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId: user.id }),
  });
  const icpJson = await icpRes.json();
  assert.strictEqual(icpRes.status, 200, "ICP generation should return 200");
  assert.strictEqual(icpJson.success, true, "ICP generation should succeed");

  const profiles = icpJson.data?.icpProfiles || icpJson.data;
  assert.ok(Array.isArray(profiles), "ICPs must be an array");
  assert.ok(profiles.length >= 2, `Should generate at least 2 ICPs, got ${profiles.length}`);
  console.log(`   ✓ PASS: Generated ${profiles.length} ICPs:`);
  for (const p of profiles) {
    console.log(`     - [${p.priority.toUpperCase()}] ${p.personaName} (Confidence: ${p.confidenceScore})`);
  }

  // Confirm ICPs
  console.log("\n4. Testing Step 2 confirmation: Saving ICPs to DB...");
  const confirmIcpRes = await fetch(`${BASE_URL}/api/v1/onboarding/confirm-icps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId: user.id,
      icpProfiles: profiles,
    }),
  });
  const confirmIcpJson = await confirmIcpRes.json();
  assert.strictEqual(confirmIcpJson.success, true, "Confirming ICPs should succeed");
  console.log("   ✓ PASS: Step 2 completed — ICPs saved to database");

  // 5. Test Step 3: Complete Onboarding
  console.log("\n5. Testing Step 3: Completing onboarding...");
  const completeRes = await fetch(`${BASE_URL}/api/v1/user/onboarding`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ completed: true, step: 3 }),
  });
  const completeJson = await completeRes.json();
  assert.strictEqual(completeJson.success, true, "Completing onboarding should succeed");

  // Verify status via GET /user/onboarding
  const statusRes = await fetch(`${BASE_URL}/api/v1/user/onboarding`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const statusJson = await statusRes.json();
  assert.strictEqual(statusJson.success, true);
  assert.strictEqual(statusJson.data.onboardingCompleted, true, "Status must show onboardingCompleted=true");
  assert.strictEqual(statusJson.data.onboardingStep, 3, "Status must show onboardingStep=3");
  assert.strictEqual(statusJson.data.hasProfile, true, "Status must show hasProfile=true");
  assert.strictEqual(statusJson.data.hasIcps, true, "Status must show hasIcps=true");
  console.log("   ✓ PASS: Step 3 completed — User marked onboardingCompleted=true");

  // 6. Test Settings / Redo Onboarding
  console.log("\n6. Testing Settings: Resetting onboarding to Step 1...");
  const resetRes = await fetch(`${BASE_URL}/api/v1/user/onboarding`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ completed: false, skipped: false, step: 1 }),
  });
  const resetJson = await resetRes.json();
  assert.strictEqual(resetJson.success, true);

  const resetStatusRes = await fetch(`${BASE_URL}/api/v1/user/onboarding`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const resetStatusJson = await resetStatusRes.json();
  assert.strictEqual(resetStatusJson.data.onboardingCompleted, false);
  assert.strictEqual(resetStatusJson.data.onboardingStep, 1);
  console.log("   ✓ PASS: Settings redo successfully reset onboarding to Step 1");

  console.log("\n===============================================================");
  console.log("🎉 ALL 3-STEP ONBOARDING END-TO-END TESTS PASSED 100%!");
  console.log("===============================================================\n");
}

verifyFullOnboarding().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
