// Test script for C-18 (FPS >= 45 in stage 1-1) and C-28 (zero JS errors during full flow)
import { chromium } from 'playwright';

const GAME_URL = 'http://localhost:8080';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForState(page, targetState, timeoutMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const state = await page.evaluate(() => {
            return window.__gameDebug ? window.__gameDebug.state : null;
        });
        if (state === targetState) return true;
        await delay(100);
    }
    const finalState = await page.evaluate(() => {
        return window.__gameDebug ? window.__gameDebug.state : 'N/A';
    });
    console.log(`  [WARN] Timed out waiting for state "${targetState}" (current: "${finalState}")`);
    return false;
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 960, height: 720 } });
    const page = await context.newPage();

    // ===== C-28: Collect all JS errors =====
    const jsErrors = [];
    page.on('pageerror', (error) => {
        jsErrors.push({ type: 'pageerror', message: error.message, stack: error.stack });
    });
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            jsErrors.push({ type: 'console.error', text: msg.text() });
        }
    });

    console.log('=== Starting Game Flow Tests (C-18, C-28) ===\n');

    // Step 1: Load the game
    console.log('[1] Loading game...');
    await page.goto(GAME_URL, { waitUntil: 'load', timeout: 10000 });
    await delay(1500); // Wait for game to initialize

    // Verify game loaded
    let state = await page.evaluate(() => window.__gameDebug ? window.__gameDebug.state : null);
    console.log(`    Game state after load: ${state}`);

    if (state !== 'TITLE') {
        console.log('    [WARN] Expected TITLE state, waiting...');
        await waitForState(page, 'TITLE');
    }
    console.log('    Title screen loaded.\n');

    // Step 2: Press Enter to go to world map
    console.log('[2] Pressing Enter to go to world map...');
    await page.keyboard.press('Enter');
    await delay(1200); // Wait for iris-wipe transition (~500ms + buffer)

    const reachedWorldMap = await waitForState(page, 'WORLD_MAP', 5000);
    state = await page.evaluate(() => window.__gameDebug.state);
    console.log(`    State after Enter: ${state}`);

    if (!reachedWorldMap) {
        // Maybe there's a "Continue" option and save data — try pressing Enter again
        // or maybe we need to navigate to "New Game" first
        console.log('    Trying ArrowDown + Enter in case Continue is selected but needs New Game...');
        await page.keyboard.press('Enter');
        await delay(1200);
        state = await page.evaluate(() => window.__gameDebug.state);
        console.log(`    State after second Enter: ${state}`);
        if (state !== 'WORLD_MAP') {
            await waitForState(page, 'WORLD_MAP', 5000);
        }
    }
    console.log('    World map reached.\n');

    // Step 3: Press Enter to enter stage 1-1
    console.log('[3] Pressing Enter to enter stage 1-1...');
    await page.keyboard.press('Enter');
    await delay(1500); // Iris-wipe transition

    const reachedStage = await waitForState(page, 'STAGE', 8000);
    state = await page.evaluate(() => window.__gameDebug.state);
    console.log(`    State after Enter: ${state}`);

    if (!reachedStage) {
        console.log('    [ERR] Failed to enter stage 1-1');
    }
    console.log('    Stage 1-1 entered.\n');

    // Step 4: Wait 3 seconds for gameplay to stabilize
    console.log('[4] Waiting 3 seconds for gameplay to stabilize...');
    await delay(3000);

    // Step 5: Read FPS (C-18)
    console.log('[5] Reading FPS...');
    const fpsData = await page.evaluate(() => {
        const debug = window.__gameDebug;
        return {
            fps: debug.fps,
            frameCount: debug.frameCount,
            updateCount: debug.updateCount,
            state: debug.state
        };
    });
    console.log(`    FPS: ${fpsData.fps}`);
    console.log(`    Frame count: ${fpsData.frameCount}`);
    console.log(`    Update count: ${fpsData.updateCount}`);
    console.log(`    Current state: ${fpsData.state}\n`);

    // ===== C-28 continued: Pause/Resume/Return flow =====

    // Step 6: Press Escape to pause
    console.log('[6] Pressing Escape to pause...');
    await page.keyboard.press('Escape');
    await delay(500);

    state = await page.evaluate(() => window.__gameDebug.state);
    console.log(`    State after Escape: ${state}`);

    if (state !== 'PAUSED') {
        console.log('    [WARN] Expected PAUSED state, waiting...');
        await waitForState(page, 'PAUSED', 3000);
        state = await page.evaluate(() => window.__gameDebug.state);
        console.log(`    State now: ${state}`);
    }
    console.log('    Game paused.\n');

    // Step 7: Wait 500ms
    await delay(500);

    // Step 8: Press Escape to resume (Escape resumes from pause per the code)
    console.log('[8] Pressing Escape to resume...');
    await page.keyboard.press('Escape');
    await delay(500);

    state = await page.evaluate(() => window.__gameDebug.state);
    console.log(`    State after Escape: ${state}`);
    console.log('    Game resumed.\n');

    // Step 9: Wait 500ms
    await delay(500);

    // Step 10: Press Escape again to pause
    console.log('[10] Pressing Escape to pause again...');
    await page.keyboard.press('Escape');
    await delay(500);

    state = await page.evaluate(() => window.__gameDebug.state);
    console.log(`    State after Escape: ${state}`);
    console.log('    Game paused again.\n');

    // Step 11: Navigate to "Return to World Map" (index 4 in pause menu)
    // Pause menu starts at index 0 (Resume), so we need 4 ArrowDown presses
    // Options: Resume(0), Volume(1), Mute(2), Restart Stage(3), Return to World Map(4), Quit to Title(5)
    console.log('[11] Navigating to "Return to World Map"...');
    for (let i = 0; i < 4; i++) {
        await page.keyboard.press('ArrowDown');
        await delay(150);
    }

    // Verify selection
    const selectedIdx = await page.evaluate(() => Menu.selectedIndex);
    console.log(`    Selected menu index: ${selectedIdx} (expected 4 = "Return to World Map")`);

    // Press Enter to confirm
    console.log('    Pressing Enter to return to world map...');
    await page.keyboard.press('Enter');
    await delay(1500); // Wait for iris-wipe transition

    const backToWorldMap = await waitForState(page, 'WORLD_MAP', 5000);
    state = await page.evaluate(() => window.__gameDebug.state);
    console.log(`    State after Return to World Map: ${state}\n`);

    // ===== RESULTS =====
    console.log('==========================================');
    console.log('              TEST RESULTS');
    console.log('==========================================\n');

    // C-18: FPS check
    const c18Pass = fpsData.fps >= 45;
    console.log(`C-18: Gameplay FPS >= 45 during stage 1-1`);
    console.log(`  Measured FPS: ${fpsData.fps}`);
    console.log(`  Result: ${c18Pass ? 'PASS' : 'FAIL'}\n`);

    // C-28: JS errors check
    const c28Pass = jsErrors.length === 0;
    console.log(`C-28: Zero JS errors during full game flow`);
    console.log(`  Errors found: ${jsErrors.length}`);
    if (jsErrors.length > 0) {
        for (const err of jsErrors) {
            console.log(`    - [${err.type}] ${err.message || err.text}`);
            if (err.stack) {
                // Print first 3 lines of stack
                const stackLines = err.stack.split('\n').slice(0, 3);
                for (const line of stackLines) {
                    console.log(`      ${line}`);
                }
            }
        }
    }
    console.log(`  Result: ${c28Pass ? 'PASS' : 'FAIL'}\n`);

    console.log('==========================================');
    console.log(`  C-18: ${c18Pass ? 'PASS' : 'FAIL'}    C-28: ${c28Pass ? 'PASS' : 'FAIL'}`);
    console.log('==========================================');

    await browser.close();

    // Exit with appropriate code
    process.exit((c18Pass && c28Pass) ? 0 : 1);
})();
