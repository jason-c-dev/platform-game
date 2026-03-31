import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';

async function runTests() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('=== Sprint 14 Evaluation Tests ===\n');

    // Navigate to game
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Let game initialize

    // =========================================
    // TEST: Run window.runPlayabilityCheck()
    // =========================================
    console.log('--- Running window.runPlayabilityCheck() ---');

    let report;
    try {
        report = await page.evaluate(() => {
            return window.runPlayabilityCheck();
        });
        console.log('runPlayabilityCheck() returned successfully');
        console.log(`  stageCount: ${report.stageCount}`);
        console.log(`  passCount: ${report.passCount}`);
        console.log(`  failCount: ${report.failCount}`);
        console.log(`  totalChecks: ${report.totalChecks}`);
        console.log(`  categoryCounts:`, JSON.stringify(report.categoryCounts));
    } catch (e) {
        console.log('FAIL: runPlayabilityCheck() threw error:', e.message);
        await browser.close();
        return;
    }

    // =========================================
    // C-26: All 13 stages present with correct IDs
    // =========================================
    const expectedIds = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3', '3-1', '3-2', '3-3', '4-1', '4-2', '4-3', '5-1'];
    const actualIds = report.stages.map(s => s.stageId);
    console.log(`\nC-26: stages=${report.stages.length}, ids=${JSON.stringify(actualIds)}`);
    console.log(`  Expected: ${JSON.stringify(expectedIds)}`);
    console.log(`  Match: ${JSON.stringify(actualIds) === JSON.stringify(expectedIds) ? 'PASS' : 'FAIL'}`);

    // =========================================
    // C-01: arenaResult.enclosure check for each stage
    // =========================================
    console.log('\n--- C-01: arenaResult.enclosure ---');
    for (const stage of report.stages) {
        const enc = stage.arenaResult?.enclosure;
        const hasField = enc && (enc.result === 'PASS' || enc.result === 'FAIL');
        console.log(`  ${stage.stageId}: ${hasField ? `${enc.result} - ${enc.details}` : 'MISSING'}`);
    }

    // =========================================
    // C-03: arenaResult.minWidth check for each stage
    // =========================================
    console.log('\n--- C-03: arenaResult.minWidth ---');
    for (const stage of report.stages) {
        const mw = stage.arenaResult?.minWidth;
        const hasField = mw && (mw.result === 'PASS' || mw.result === 'FAIL') && mw.measured !== undefined;
        console.log(`  ${stage.stageId}: ${hasField ? `${mw.result} - measured=${mw.measured} - ${mw.details}` : 'MISSING or incomplete'}`);
    }

    // =========================================
    // C-04: arenaResult.platforms check for each stage
    // =========================================
    console.log('\n--- C-04: arenaResult.platforms ---');
    for (const stage of report.stages) {
        const pl = stage.arenaResult?.platforms;
        const hasField = pl && (pl.result === 'PASS' || pl.result === 'FAIL') && pl.count !== undefined;
        console.log(`  ${stage.stageId}: ${hasField ? `${pl.result} - count=${pl.count} - ${pl.details}` : 'MISSING or incomplete'}`);
    }

    // =========================================
    // C-05: arenaResult.entry check for each stage
    // =========================================
    console.log('\n--- C-05: arenaResult.entry ---');
    for (const stage of report.stages) {
        const en = stage.arenaResult?.entry;
        const hasField = en && (en.result === 'PASS' || en.result === 'FAIL');
        console.log(`  ${stage.stageId}: ${hasField ? `${en.result} - ${en.details}` : 'MISSING'}`);
    }

    // =========================================
    // C-07: difficultyResult.vulnerabilityWindow per stage
    // =========================================
    console.log('\n--- C-07: difficultyResult.vulnerabilityWindow ---');
    const vulnExpected = { 0: 3.0, 1: 2.5, 2: 2.0, 3: 1.5, 4: 1.5 };
    for (const stage of report.stages) {
        const vw = stage.difficultyResult?.vulnerabilityWindow;
        const hasField = vw && (vw.result === 'PASS' || vw.result === 'FAIL') && vw.expected !== undefined && vw.actual !== undefined;
        console.log(`  ${stage.stageId}: ${hasField ? `${vw.result} - expected=${vw.expected}s actual=${vw.actual}s - ${vw.details}` : 'MISSING or incomplete'}`);
    }

    // =========================================
    // C-09: difficultyResult.bossHP per stage
    // =========================================
    console.log('\n--- C-09: difficultyResult.bossHP ---');
    for (const stage of report.stages) {
        const hp = stage.difficultyResult?.bossHP;
        const hasField = hp && (hp.result === 'PASS' || hp.result === 'FAIL') && hp.actual !== undefined && hp.min !== undefined && hp.max !== undefined;
        console.log(`  ${stage.stageId}: ${hasField ? `${hp.result} - actual=${hp.actual} range=[${hp.min},${hp.max}] - ${hp.details}` : 'MISSING or incomplete'}`);
    }

    // =========================================
    // C-11: difficultyResult.enemyDensity per stage
    // =========================================
    console.log('\n--- C-11: difficultyResult.enemyDensity ---');
    for (const stage of report.stages) {
        const ed = stage.difficultyResult?.enemyDensity;
        const hasField = ed && (ed.result === 'PASS' || ed.result === 'FAIL') && ed.maxPerScreen !== undefined && ed.worldLimit !== undefined;
        console.log(`  ${stage.stageId}: ${hasField ? `${ed.result} - maxPerScreen=${ed.maxPerScreen} limit=${ed.worldLimit} - ${ed.details}` : 'MISSING or incomplete'}`);
    }

    // =========================================
    // C-13: difficultyResult.hazardPercentage per stage
    // =========================================
    console.log('\n--- C-13: difficultyResult.hazardPercentage ---');
    for (const stage of report.stages) {
        const hz = stage.difficultyResult?.hazardPercentage;
        const hasField = hz && (hz.result === 'PASS' || hz.result === 'FAIL') && hz.actual !== undefined && hz.limit !== undefined;
        console.log(`  ${stage.stageId}: ${hasField ? `${hz.result} - actual=${hz.actual}% limit=${hz.limit}% - ${hz.details}` : 'MISSING or incomplete'}`);
    }

    // =========================================
    // C-15: difficultyResult.minPlatformWidth per stage
    // =========================================
    console.log('\n--- C-15: difficultyResult.minPlatformWidth ---');
    for (const stage of report.stages) {
        const pw = stage.difficultyResult?.minPlatformWidth;
        const hasField = pw && (pw.result === 'PASS' || pw.result === 'FAIL') && pw.narrowest !== undefined && pw.worldMin !== undefined;
        console.log(`  ${stage.stageId}: ${hasField ? `${pw.result} - narrowest=${pw.narrowest} min=${pw.worldMin} - ${pw.details}` : 'MISSING or incomplete'}`);
    }

    // =========================================
    // C-17: Report structure - pathResult, arenaResult, difficultyResult
    // =========================================
    console.log('\n--- C-17: Report structure ---');
    for (const stage of report.stages) {
        const hasPath = stage.pathResult !== undefined;
        const hasArena = stage.arenaResult !== undefined;
        const hasDiff = stage.difficultyResult !== undefined;
        console.log(`  ${stage.stageId}: pathResult=${hasPath} arenaResult=${hasArena} difficultyResult=${hasDiff}`);
    }

    // =========================================
    // C-18: arenaResult sub-checks structure
    // =========================================
    console.log('\n--- C-18: arenaResult structure ---');
    const stage1 = report.stages[0];
    const arenaKeys = ['enclosure', 'minWidth', 'platforms', 'entry'];
    for (const key of arenaKeys) {
        const sub = stage1.arenaResult?.[key];
        const hasResult = sub?.result !== undefined;
        const hasDetails = sub?.details !== undefined;
        console.log(`  ${key}: result=${hasResult ? sub.result : 'MISSING'} details=${hasDetails ? 'present' : 'MISSING'}`);
    }

    // =========================================
    // C-19: difficultyResult sub-checks structure
    // =========================================
    console.log('\n--- C-19: difficultyResult structure ---');
    const diffKeys = ['vulnerabilityWindow', 'bossHP', 'enemyDensity', 'hazardPercentage', 'minPlatformWidth'];
    for (const key of diffKeys) {
        const sub = stage1.difficultyResult?.[key];
        const hasResult = sub?.result !== undefined;
        const hasDetails = sub?.details !== undefined;
        console.log(`  ${key}: result=${hasResult ? sub.result : 'MISSING'} details=${hasDetails ? 'present' : 'MISSING'}`);
    }

    // =========================================
    // C-20: Top-level aggregate counts
    // =========================================
    console.log('\n--- C-20: Top-level aggregate counts ---');
    console.log(`  passCount: ${report.passCount}`);
    console.log(`  failCount: ${report.failCount}`);
    console.log(`  totalChecks: ${report.totalChecks}`);
    console.log(`  categoryCounts: ${JSON.stringify(report.categoryCounts)}`);
    const expectedTotal = 13 * 10; // 13 stages x (1 path + 4 arena + 5 difficulty)
    console.log(`  Expected totalChecks: ${expectedTotal} (13 stages x 10 checks)`);
    console.log(`  Total matches: ${report.totalChecks === expectedTotal ? 'PASS' : 'FAIL'}`);

    // =========================================
    // C-25: Path validation regression — all 13 stages have pathResult
    // =========================================
    console.log('\n--- C-25: Path validation regression ---');
    for (const stage of report.stages) {
        const hasPR = stage.pathResult === 'PASS' || stage.pathResult === 'FAIL';
        console.log(`  ${stage.stageId}: pathResult=${hasPR ? stage.pathResult : 'MISSING'}`);
    }

    // =========================================
    // C-27: FPS check
    // =========================================
    console.log('\n--- C-27: FPS check ---');
    // Navigate to a stage and check fps
    try {
        const fps = await page.evaluate(() => {
            return window.__gameDebug?.fps || 'N/A';
        });
        console.log(`  FPS: ${fps}`);
    } catch (e) {
        console.log(`  FPS check error: ${e.message}`);
    }

    // =========================================
    // Print full report JSON for analysis
    // =========================================
    console.log('\n--- Full Report JSON (abbreviated) ---');
    console.log(JSON.stringify({
        stageCount: report.stageCount,
        passCount: report.passCount,
        failCount: report.failCount,
        totalChecks: report.totalChecks,
        categoryCounts: report.categoryCounts,
        stages: report.stages.map(s => ({
            stageId: s.stageId,
            pathResult: s.pathResult,
            arenaEnclosure: s.arenaResult?.enclosure?.result,
            arenaMinWidth: s.arenaResult?.minWidth?.result,
            arenaPlatforms: s.arenaResult?.platforms?.result,
            arenaEntry: s.arenaResult?.entry?.result,
            vulnWindow: s.difficultyResult?.vulnerabilityWindow?.result,
            bossHP: s.difficultyResult?.bossHP?.result,
            enemyDensity: s.difficultyResult?.enemyDensity?.result,
            hazardPct: s.difficultyResult?.hazardPercentage?.result,
            minPlatWidth: s.difficultyResult?.minPlatformWidth?.result,
        }))
    }, null, 2));

    await browser.close();
    console.log('\n=== Tests Complete ===');
}

runTests().catch(e => {
    console.error('Test runner failed:', e);
    process.exit(1);
});
