import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  integrationEnvReady,
  createTestUser,
  deleteTestUser,
  pairTestUsers,
  type TestUser,
} from "./helpers";

const { ready, reason } = integrationEnvReady();

describe.runIf(ready)("HeartLink security boundaries (live project)", () => {
  let alice: TestUser;
  let bob: TestUser;
  let carol: TestUser; // unpaired third party

  beforeAll(async () => {
    alice = await createTestUser("alice");
    bob = await createTestUser("bob");
    carol = await createTestUser("carol");
  }, 30_000);

  afterAll(async () => {
    await Promise.all(
      [alice, bob, carol].filter(Boolean).map((u) => deleteTestUser(u.id))
    );
  });

  it("an unpaired user cannot create an alert", async () => {
    const { error } = await carol.client.rpc("create_alert");
    expect(error).toBeTruthy();
    expect(error!.message).toMatch(/No trusted contact connected/);
  });

  it("pairing works and creates a queryable relationship for both sides", async () => {
    const relationshipId = await pairTestUsers(alice, bob);
    expect(relationshipId).toBeTruthy();

    const { data: aliceView } = await alice.client
      .from("relationships")
      .select("*")
      .eq("id", relationshipId)
      .maybeSingle();
    const { data: bobView } = await bob.client
      .from("relationships")
      .select("*")
      .eq("id", relationshipId)
      .maybeSingle();

    expect(aliceView).toBeTruthy();
    expect(bobView).toBeTruthy();
  }, 20_000);

  it("a third party cannot see a relationship they're not part of", async () => {
    const { data: relationships } = await alice.client.from("relationships").select("id");
    const relationshipId = relationships?.[0]?.id;
    expect(relationshipId).toBeTruthy();

    const { data: carolView } = await carol.client
      .from("relationships")
      .select("*")
      .eq("id", relationshipId!)
      .maybeSingle();

    expect(carolView).toBeNull();
  });

  it("creating a second alert while one is open returns the SAME alert, not a duplicate", async () => {
    const { data: first, error: firstError } = await alice.client.rpc("create_alert");
    expect(firstError).toBeNull();

    const { data: second, error: secondError } = await alice.client.rpc("create_alert");
    expect(secondError).toBeNull();

    expect((second as { id: string }).id).toBe((first as { id: string }).id);
  }, 20_000);

  it("the recipient (bob) can see the alert; an unrelated user (carol) cannot", async () => {
    const { data: aliceAlerts } = await alice.client
      .from("emergency_alerts")
      .select("id")
      .eq("sender_id", alice.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const alertId = aliceAlerts?.[0]?.id;
    expect(alertId).toBeTruthy();

    const { data: bobView } = await bob.client
      .from("emergency_alerts")
      .select("*")
      .eq("id", alertId!)
      .maybeSingle();
    expect(bobView).toBeTruthy();

    const { data: carolView } = await carol.client
      .from("emergency_alerts")
      .select("*")
      .eq("id", alertId!)
      .maybeSingle();
    expect(carolView).toBeNull();
  });

  it("carol (uninvolved) cannot acknowledge alice's alert to bob", async () => {
    const { data: aliceAlerts } = await alice.client
      .from("emergency_alerts")
      .select("id")
      .eq("sender_id", alice.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const alertId = aliceAlerts?.[0]?.id;

    const { error } = await carol.client.rpc("acknowledge_alert", { alert_id: alertId! });
    expect(error).toBeTruthy();
    expect(error!.message).toMatch(/not found or already resolved/);
  });

  it("alice (the sender, not the recipient) cannot acknowledge her own alert", async () => {
    const { data: aliceAlerts } = await alice.client
      .from("emergency_alerts")
      .select("id")
      .eq("sender_id", alice.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const alertId = aliceAlerts?.[0]?.id;

    const { error } = await alice.client.rpc("acknowledge_alert", { alert_id: alertId! });
    expect(error).toBeTruthy();
  });

  it("bob (the actual recipient) CAN acknowledge the alert", async () => {
    const { data: aliceAlerts } = await alice.client
      .from("emergency_alerts")
      .select("id")
      .eq("sender_id", alice.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const alertId = aliceAlerts?.[0]?.id;

    const { error } = await bob.client.rpc("acknowledge_alert", { alert_id: alertId! });
    expect(error).toBeNull();

    const { data: after } = await alice.client
      .from("emergency_alerts")
      .select("status")
      .eq("id", alertId!)
      .single();
    expect(after?.status).toBe("ACKNOWLEDGED");
  });

  it("cancel_alert rejects an already-acknowledged alert", async () => {
    const { data: aliceAlerts } = await alice.client
      .from("emergency_alerts")
      .select("id")
      .eq("sender_id", alice.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const alertId = aliceAlerts?.[0]?.id;

    const { error } = await alice.client.rpc("cancel_alert", { alert_id: alertId! });
    expect(error).toBeTruthy();
    expect(error!.message).toMatch(/already acknowledged/);
  });

  it("carol cannot read alice's pain episodes (not paired, no alert between them)", async () => {
    const { data: aliceEpisodes } = await alice.client.from("pain_episodes").select("id").limit(1);
    const episodeId = aliceEpisodes?.[0]?.id;
    expect(episodeId).toBeTruthy();

    const { data: carolView } = await carol.client
      .from("pain_episodes")
      .select("*")
      .eq("id", episodeId!)
      .maybeSingle();
    expect(carolView).toBeNull();
  });

  it("carol cannot insert a medication for alice", async () => {
    const { error } = await carol.client.from("medications").insert({
      user_id: alice.id,
      name: "Should not be allowed",
    });
    expect(error).toBeTruthy();
  });

  it("redeeming an invalid pairing code fails clearly", async () => {
    const { error } = await carol.client.rpc("redeem_pairing_code", {
      input_code: "AAAAAA",
    });
    expect(error).toBeTruthy();
    expect(error!.message).toMatch(/not valid/);
  });
});

describe.skipIf(ready)("HeartLink security boundaries (live project)", () => {
  it(`skipped — ${reason}`, () => {
    // Intentionally empty: this test's only job is to make the skip
    // reason visible in test output instead of silently vanishing.
  });
});
