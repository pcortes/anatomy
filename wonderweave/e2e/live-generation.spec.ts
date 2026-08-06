import { expect, test, type Page } from "@playwright/test";
import type { GenerateResponse } from "../app/lib/learning-artifact";
import { NARRATION_END_CUE } from "../app/lib/voice-contract";

test.beforeEach(async ({ page }) => {
  test.skip(process.env.LIVE_E2E !== "1", "LIVE_E2E=1 is required; mocked evidence is not accepted.");
  const productionBaseUrl = process.env.PRODUCTION_BASE_URL;
  const sitesBypassBearer = process.env.SITES_BYPASS_BEARER;
  if (productionBaseUrl && sitesBypassBearer) {
    const productionOrigin = new URL(productionBaseUrl).origin;
    await page.route(`${productionOrigin}/**`, async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          "OAI-Sites-Authorization": `Bearer ${sitesBypassBearer}`,
        },
      });
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("real model API returns a validated, uncached learning artifact", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One live API proof is sufficient.");
  const response = await request.post("/api/generate", {
    data: {
      topic: "Counting seeds",
      objective: "Recognize and compare small groups of seeds using quantities from 1 to 5.",
      domain: "early-math",
      age: 6,
      durationMinutes: 8,
      context: `Use structured seed arrangements and one-to-one touching cues. Live evidence run ${Date.now()}.`,
    },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const payload = await response.json() as GenerateResponse;
  expect(payload.receipt.provider).toBe("anthropic");
  expect(payload.receipt.model).toMatch(/^claude-/);
  expect(payload.receipt.validation).toEqual({ schema: "pass", policy: "pass" });
  expect(payload.receipt.traceId).toMatch(/^gen_/);
  expect(payload.receipt.latencyMs).toBeLessThanOrEqual(110_000);
  expect(payload.artifact.schemaVersion).toBe("2.1");
  expect(payload.artifact.domain).toBe("early-math");
  expect(payload.artifact.age).toBe(6);
  expect(payload.artifact.durationMinutes).toBe(8);
  expect(payload.artifact.explore.categories).toHaveLength(2);
  expect(payload.artifact.model.exampleEmoji).toBeTruthy();
  expect(payload.artifact.narration.explore.length).toBeGreaterThan(10);
  expect(payload.artifact.explore.items.length).toBeGreaterThanOrEqual(4);
  expect(payload.artifact.explore.categories.every((category) => Boolean(category.emoji))).toBe(true);
  expect(payload.artifact.explore.categories.every((category) => category.visualCue.trim().length > 3)).toBe(true);
  expect(payload.artifact.explore.categories.map((category) => category.id)).toEqual(["home-1", "home-2"]);
  expect(payload.artifact.explore.items.map((item) => item.id)).toEqual(payload.artifact.explore.items.map((_, index) => `picture-${index + 1}`));
  expect(payload.artifact.check.choices.every((choice) => Boolean(choice.emoji))).toBe(true);
  expect(payload.artifact.check.choices.map((choice) => choice.id)).toEqual(payload.artifact.check.choices.map((_, index) => `choice-${index + 1}`));
  expect(payload.artifact.check.choices.filter((choice) => choice.correct)).toHaveLength(1);
  expect(JSON.stringify(payload.artifact)).not.toMatch(/https?:\/\/|<script|javascript:|fixture/i);

  await testInfo.attach("live-api-proof.json", {
    body: JSON.stringify({
      traceId: payload.receipt.traceId,
      provider: payload.receipt.provider,
      model: payload.receipt.model,
      latencyMs: payload.receipt.latencyMs,
      title: payload.artifact.title,
      schema: payload.receipt.validation.schema,
      policy: payload.receipt.validation.policy,
    }, null, 2),
    contentType: "application/json",
  });
});

test("real OpenAI API mints a short-lived Realtime credential", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One live Realtime API proof is sufficient.");
  const response = await request.post("/api/realtime/token");

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const payload = await response.json() as { value: string; expiresAt: number; model: string };
  expect(payload.value).toMatch(/^ek_/);
  expect(payload.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  expect(payload.model).toBe("gpt-realtime-2.1");

  await testInfo.attach("live-realtime-proof.json", {
    body: JSON.stringify({
      model: payload.model,
      ephemeralCredential: "present-and-redacted",
      expiresAt: payload.expiresAt,
      cache: response.headers()["cache-control"],
    }, null, 2),
    contentType: "application/json",
  });
});

test("a pre-reader gets an automatic, uninterrupted /s/ lesson with a non-reader-first interface", async ({ page }, testInfo) => {
  test.setTimeout(600_000);
  await page.goto(process.env.PRODUCTION_BASE_URL ? `/?voiceEvidence=${Date.now()}` : "/");
  await expect(page.getByTestId("learning-studio")).toBeVisible();
  await page.getByTestId("topic-input").fill("The hissing /s/ sound like a snake");
  await page.getByTestId("objective-input").fill("Hear the first sound in familiar words and identify which words begin with /s/.");
  await page.getByTestId("domain-early-literacy").click();
  await page.getByTestId("age-input").selectOption("6");
  await page.getByTestId("duration-input").selectOption("8");

  const generated = page.waitForResponse((response) => response.url().endsWith("/api/generate") && response.request().method() === "POST");
  await page.getByTestId("generate-button").click();
  const response = await generated;
  expect(response.status()).toBe(200);
  const payload = await response.json() as GenerateResponse;
  expect(payload.artifact.explore.instruction).not.toMatch(/dinosaur/i);
  expect(payload.artifact.explore.items.map((item) => item.detail).join(" ")).not.toMatch(/dinosaur/i);

  await expect(page.getByTestId("lesson-preview")).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId("preview-title")).toHaveText(payload.artifact.title);
  await expect(page.getByTestId("receipt-model")).toHaveText(payload.receipt.model);
  await page.screenshot({ path: testInfo.outputPath("teacher-preview.png"), fullPage: true });

  await page.getByTestId("try-lesson-button").click();
  await expect(page.getByTestId("hook-stage")).toBeVisible();
  await assertPreReaderOperable(page, "hook-stage");
  await expect(page.getByTestId("begin-explore-button")).toHaveAccessibleName("Show me the example");
  await expect(page.getByTestId("voice-status")).toHaveAccessibleName("Tap your Wonder Buddy to hear help again");
  let narrationCompletionCount = 0;
  if (testInfo.project.name === "desktop-chromium") {
    expect(await page.evaluate(() => "RTCPeerConnection" in window && Boolean(navigator.mediaDevices?.getUserMedia))).toBe(true);
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-voice-connected", "true", { timeout: 45_000 });
    await expect(page.getByTestId("start-sound-button")).toHaveCount(0);
    await expect(page.locator('audio[data-wonderweave-voice="true"]')).toHaveCount(1);
    await expect.poll(async () => page.locator('audio[data-wonderweave-voice="true"]').evaluate((audio) => {
      const element = audio as HTMLAudioElement;
      return Boolean(element.srcObject) && !element.paused;
    }), { timeout: 15_000 }).toBe(true);
    await expect.poll(async () => Number(await page.getByTestId("voice-status").getAttribute("data-narration-count")), { timeout: 45_000 }).toBeGreaterThan(0);
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-narration-protected", "true");
    narrationCompletionCount = await expectCompleteNarration(page, narrationCompletionCount, [
      payload.artifact.hook.prompt,
      payload.artifact.hook.wonderQuestion,
      NARRATION_END_CUE,
    ]);
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-narration-protected", "false", { timeout: 150_000 });
  }
  await page.screenshot({ path: testInfo.outputPath("audio-first-hook.png"), fullPage: true });
  if (testInfo.project.name === "desktop-chromium") {
    const firstNarrationCount = Number(await page.getByTestId("voice-status").getAttribute("data-narration-count"));
    await page.getByTestId("repeat-instruction").click();
    await expect.poll(async () => Number(await page.getByTestId("voice-status").getAttribute("data-narration-count")), { timeout: 45_000 }).toBeGreaterThan(firstNarrationCount);
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-narration-protected", "true");
    await page.getByTestId("begin-explore-button").click();
    await expect(page.getByTestId("model-stage")).toBeVisible();
    narrationCompletionCount = await expectCompleteNarration(page, narrationCompletionCount, [
      payload.artifact.model.exampleLabel,
      payload.artifact.model.explanation,
      payload.artifact.model.gestureCue,
      NARRATION_END_CUE,
    ]);
    expect(narrationCompletionCount).toBe(2);
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-narration-protected", "false", { timeout: 150_000 });
  } else {
    await page.getByTestId("begin-explore-button").click();
    await expect(page.getByTestId("model-stage")).toBeVisible();
  }
  await assertPreReaderOperable(page, "model-stage");
  await expect(page.getByTestId("model-stage")).toContainText(payload.artifact.model.exampleLabel);
  await expect(page.getByTestId("start-guided-play")).toHaveAccessibleName("My turn");
  const focusHome = payload.artifact.explore.categories
    .map((category) => ({
      category,
      matchingPictures: payload.artifact.explore.items.filter((item) => item.category === category.id && item.label.trim().toLowerCase().startsWith("s")).length,
    }))
    .sort((left, right) => right.matchingPictures - left.matchingPictures)[0];
  expect(focusHome?.matchingPictures).toBeGreaterThan(0);
  await expect(page.getByTestId("model-destination-home")).toHaveAttribute("data-category-id", focusHome!.category.id);
  await expect(page.getByTestId("model-destination-home")).toContainText(focusHome!.category.emoji);
  await expect(page.getByTestId("model-destination-home")).toContainText("S");
  await assertOnlyLearningSymbolIsVisible(page, "model-stage", "S");
  await page.screenshot({ path: testInfo.outputPath("worked-example.png"), fullPage: true });
  await page.getByTestId("start-guided-play").click();
  await expect(page.getByTestId("explore-stage")).toBeVisible();
  await assertPreReaderOperable(page, "explore-stage");
  await expect(page.getByTestId("prereader-picture-path")).toHaveAccessibleName("Tap a picture, listen, then tap a picture home");
  await expect(page.getByTestId("learning-focus-symbol")).toHaveText("S");
  await assertOnlyLearningSymbolIsVisible(page, "explore-stage", "S");

  if (testInfo.project.name === "desktop-chromium") {
    narrationCompletionCount = await expectCompleteNarration(page, narrationCompletionCount, [
      payload.artifact.explore.categories[0]!.visualCue,
      payload.artifact.explore.categories[1]!.visualCue,
      payload.artifact.explore.items[0]!.label,
      NARRATION_END_CUE,
    ]);
    const beforeHomeMap = Number(await page.getByTestId("voice-status").getAttribute("data-narration-count"));
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-narration-protected", "false", { timeout: 150_000 });
    await page.getByTestId("explore-read-aloud").click();
    await expect.poll(async () => Number(await page.getByTestId("voice-status").getAttribute("data-narration-count")), { timeout: 45_000 }).toBeGreaterThan(beforeHomeMap);
    narrationCompletionCount = await expectCompleteNarration(page, narrationCompletionCount, [
      payload.artifact.explore.categories[0]!.visualCue,
      payload.artifact.explore.categories[1]!.visualCue,
      NARRATION_END_CUE,
    ]);
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-narration-protected", "false", { timeout: 150_000 });

    const firstCategory = payload.artifact.explore.categories[0]!;
    const beforeHomeReplay = Number(await page.getByTestId("voice-status").getAttribute("data-narration-count"));
    await page.getByTestId(`category-audio-${firstCategory.id}`).click();
    await expect.poll(async () => Number(await page.getByTestId("voice-status").getAttribute("data-narration-count")), { timeout: 45_000 }).toBeGreaterThan(beforeHomeReplay);
  }

  for (const [index, item] of payload.artifact.explore.items.entries()) {
    const beforeItemAudio = testInfo.project.name === "desktop-chromium" && index === 0
      ? Number(await page.getByTestId("voice-status").getAttribute("data-narration-count"))
      : null;
    await page.getByTestId(`explore-item-${item.id}`).click();
    if (beforeItemAudio !== null) {
      await expect.poll(async () => Number(await page.getByTestId("voice-status").getAttribute("data-narration-count")), { timeout: 45_000 }).toBeGreaterThan(beforeItemAudio);
    }
    await page.getByTestId(`category-${item.category}`).click();
    await expect(page.getByTestId("explore-feedback")).toContainText(item.label);
  }

  await page.getByTestId("continue-to-check").click();
  await expect(page.getByTestId("check-stage")).toBeVisible();
  await assertPreReaderOperable(page, "check-stage");
  if (testInfo.project.name === "desktop-chromium") {
    narrationCompletionCount = await expectCompleteNarration(page, narrationCompletionCount, [
      payload.artifact.check.prompt,
      payload.artifact.check.choices.at(-1)!.label,
      NARRATION_END_CUE,
    ]);
  }
  const incorrect = payload.artifact.check.choices.find((choice) => !choice.correct);
  const correct = payload.artifact.check.choices.find((choice) => choice.correct);
  expect(incorrect).toBeTruthy();
  expect(correct).toBeTruthy();
  await page.getByTestId(`check-choice-${incorrect!.id}`).click();
  await expect(page.getByTestId("supportive-hint")).toBeVisible();
  await expect(page.getByTestId("supportive-hint")).not.toContainText(/^Wrong\.?$/i);
  await assertPreReaderOperable(page, "check-stage");
  await page.getByTestId(`check-choice-${correct!.id}`).click();
  await expect(page.getByTestId("correct-feedback")).toBeVisible();
  await page.getByTestId("continue-to-transfer").click();
  await expect(page.getByTestId("transfer-stage")).toBeVisible();
  await expect(page.getByTestId("transfer-stage")).toContainText(payload.artifact.transfer.prompt);
  await assertPreReaderOperable(page, "transfer-stage");
  if (testInfo.project.name === "desktop-chromium") {
    await expectCompleteNarration(page, narrationCompletionCount, [
      payload.artifact.transfer.prompt,
      payload.artifact.transfer.adultCue,
      NARRATION_END_CUE,
    ]);
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-last-narration-outcome", "completed");
    await expect(page.getByTestId("voice-status")).toHaveAttribute("data-narration-protected", "false", { timeout: 150_000 });
  }
  await page.screenshot({ path: testInfo.outputPath("learner-finish.png"), fullPage: true });

  await assertKeyboardFocus(page);
});

async function expectCompleteNarration(page: Page, previousCompletionCount: number, requiredPhrases: string[]) {
  const voiceStatus = page.getByTestId("voice-status");
  await expect.poll(async () => {
    const completed = Number(await voiceStatus.getAttribute("data-narration-complete-count"));
    const transcript = normalizeSpokenText(await voiceStatus.getAttribute("data-last-spoken-transcript") ?? "");
    return completed > previousCompletionCount
      && requiredPhrases.every((phrase) => transcript.includes(normalizeSpokenText(phrase)));
  }, {
    timeout: 150_000,
    intervals: [500, 1_000, 2_000],
    message: `Expected the live voice transcript to finish the page and include: ${requiredPhrases.join(" | ")}`,
  }).toBe(true);
  return Number(await voiceStatus.getAttribute("data-narration-complete-count"));
}

function normalizeSpokenText(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function assertPreReaderOperable(page: Page, stageTestId: string) {
  await expect(page.getByTestId(stageTestId)).toHaveAttribute("data-prereader", "true");
  const violations = await page.getByTestId("learning-experience").evaluate((root) => {
    return Array.from(root.querySelectorAll("button")).flatMap((button) => {
      if (button.closest('[data-grownup-only="true"]')) return [];
      const style = window.getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || rect.width <= 2 || rect.height <= 2) return [];
      const name = button.getAttribute("aria-label") ?? button.textContent?.replace(/\s+/g, " ").trim() ?? "unnamed button";
      const hasPictureCue = Boolean(button.querySelector('svg, [aria-hidden="true"], [data-picture-control="true"]'));
      const problems: string[] = [];
      if (!hasPictureCue) problems.push(`${name}: text-only control`);
      if (rect.width < 44 || rect.height < 44) problems.push(`${name}: target is ${Math.round(rect.width)} by ${Math.round(rect.height)}`);
      return problems;
    });
  });
  expect(violations, `${stageTestId} contains an action that depends on reading or is too small to tap`).toEqual([]);
}

async function assertOnlyLearningSymbolIsVisible(page: Page, stageTestId: string, learningSymbol: string) {
  const visibleAlphabeticText = await page.getByTestId(stageTestId).evaluate((root) => {
    const values: string[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const value = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const parent = node.parentElement;
      if (value && /[A-Za-z]/.test(value) && parent && !parent.closest('[class*="srOnly"], [data-grownup-only="true"]')) {
        const style = window.getComputedStyle(parent);
        const rect = parent.getBoundingClientRect();
        if (style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 2 && rect.height > 2) {
          values.push(value);
        }
      }
      node = walker.nextNode();
    }
    return values;
  });
  expect(visibleAlphabeticText.every((value) => value === learningSymbol), `${stageTestId} exposes a word the child may think they must decode`).toBe(true);
  expect(visibleAlphabeticText).toContain(learningSymbol);
}

async function assertKeyboardFocus(page: Page) {
  await page.keyboard.press("Tab");
  const focusVisible = await page.evaluate(() => {
    const active = document.activeElement;
    return active instanceof HTMLElement && active !== document.body && active.tabIndex >= 0;
  });
  expect(focusVisible).toBe(true);
}
