// Sprint 16: Full browser validation test
// Runs window.runPlayabilityCheck() in the actual game and verifies all 130 checks PASS
import { chromium } from 'playwright';

const URL = 'http://localhost:8080';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log('Loading game...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Run the full playability check
  console.log('Running window.runPlayabilityCheck()...\n');
  const report = await page.evaluate(() => {
    return window.runPlayabilityCheck();
  });

  if (!report) {
    console.log('ERROR: runPlayabilityCheck() returned null/undefined');
    await browser.close();
    process.exit(1);
  }

  // Report has aggregate data + .stages array
  console.log(`Aggregate: ${report.passCount} pass, ${report.failCount} fail, ${report.totalChecks} total, allPass=${report.allPass}`);
  console.log(`Stages in report: ${report.stageCount}`);

  let totalPass = 0;
  let totalFail = 0;
  let totalChecks = 0;

  if (report.stageCount !== 13) {
    console.log('ERROR: Expected 13 stages, got', report.stageCount);
  }

  for (const stageResult of report.stages) {
    const sid = stageResult.stageId;
    console.log(`\n=== Stage ${sid}: ${stageResult.name} ===`);

    // PATH check
    totalChecks++;
    const pathPass = stageResult.pathResult === 'PASS';
    if (pathPass) totalPass++; else totalFail++;
    console.log(`  [${pathPass ? 'PASS' : 'FAIL'}] PATH: ${stageResult.details}`);

    // ARENA checks (4)
    const arenaChecks = ['enclosure', 'minWidth', 'platforms', 'entry'];
    for (const check of arenaChecks) {
      totalChecks++;
      const pass = stageResult.arenaResult[check]?.result === 'PASS';
      if (pass) totalPass++; else totalFail++;
      console.log(`  [${pass ? 'PASS' : 'FAIL'}] ARENA.${check}: ${stageResult.arenaResult[check]?.details}`);
    }

    // DIFFICULTY checks (5)
    const diffChecks = ['vulnerabilityWindow', 'bossHP', 'enemyDensity', 'hazardPercentage', 'minPlatformWidth'];
    for (const check of diffChecks) {
      totalChecks++;
      const pass = stageResult.difficultyResult[check]?.result === 'PASS';
      if (pass) totalPass++; else totalFail++;
      console.log(`  [${pass ? 'PASS' : 'FAIL'}] DIFF.${check}: ${stageResult.difficultyResult[check]?.details}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total checks: ${totalChecks} (expected 130)`);
  console.log(`PASS: ${totalPass}`);
  console.log(`FAIL: ${totalFail}`);

  if (totalFail === 0 && totalChecks === 130) {
    console.log('\n✓ ALL 130 CHECKS PASS — Sprint 16 validation complete!');
  } else if (totalFail > 0) {
    console.log(`\n✗ ${totalFail} FAILURES — needs fixing`);
  }

  // Check for console errors
  const criticalErrors = consoleErrors.filter(e =>
    !e.includes('favicon') && !e.includes('DevTools') && !e.includes('net::ERR')
  );
  if (criticalErrors.length > 0) {
    console.log(`\nConsole errors: ${criticalErrors.join('; ')}`);
  }

  await browser.close();
  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
