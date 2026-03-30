import { chromium } from 'playwright';

const URL = 'http://localhost:8080';
const results = [];
let totalPass = 0;
let totalFail = 0;

function record(testId, criterion, passed, detail = '') {
  const status = passed ? 'PASS' : 'FAIL';
  if (passed) totalPass++; else totalFail++;
  results.push({ testId, criterion, status, detail });
  console.log(`  [${status}] ${criterion}${detail ? ' -- ' + detail : ''}`);
}

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

  // Navigate and wait for load
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
  // Give game a moment to initialize
  await page.waitForTimeout(2000);

  // ═══════════════════════════════════════════
  // TEST C-01: Game loads without errors
  // ═══════════════════════════════════════════
  console.log('\n=== C-01: Game loads without errors ===');

  const canvasVisible = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return c !== null && c.offsetWidth > 0 && c.offsetHeight > 0;
  });
  record('C-01', 'Canvas is visible', canvasVisible);

  // Filter out non-critical errors (some browsers emit benign warnings)
  const criticalErrors = consoleErrors.filter(e =>
    !e.includes('favicon') && !e.includes('DevTools') && !e.includes('net::ERR')
  );
  record('C-01', 'No critical console errors during load', criticalErrors.length === 0,
    criticalErrors.length > 0 ? `Errors: ${criticalErrors.join('; ')}` : '');

  const hasTitleOrMenu = await page.evaluate(() => {
    // Check if game state or menu is showing
    return typeof window.Game !== 'undefined' || typeof window.Menu !== 'undefined';
  });
  record('C-01', 'Game/Menu objects exist (title screen)', hasTitleOrMenu);

  // ═══════════════════════════════════════════
  // TEST C-27: All 17 globals defined
  // ═══════════════════════════════════════════
  console.log('\n=== C-27: All 17 globals defined ===');

  const globals = ['Game', 'GameState', 'Renderer', 'Input', 'Level', 'Physics',
    'Camera', 'Player', 'Particles', 'Enemies', 'Transition', 'HUD', 'Menu',
    'SaveSystem', 'Collectibles', 'WorldMap', 'AudioManager'];

  const globalResults = await page.evaluate((names) => {
    return names.map(name => ({
      name,
      defined: typeof window[name] !== 'undefined' && window[name] !== null
    }));
  }, globals);

  let allGlobalsDefined = true;
  const missingGlobals = [];
  for (const g of globalResults) {
    if (!g.defined) { allGlobalsDefined = false; missingGlobals.push(g.name); }
  }
  record('C-27', 'All 17 globals defined', allGlobalsDefined,
    allGlobalsDefined ? 'All present' : `Missing: ${missingGlobals.join(', ')}`);

  // ═══════════════════════════════════════════
  // TEST C-02: All 13 stages loadable
  // ═══════════════════════════════════════════
  console.log('\n=== C-02: All 13 stages loadable ===');

  const stageIds = ['1-1','1-2','1-3','2-1','2-2','2-3','3-1','3-2','3-3','4-1','4-2','4-3','5-1'];

  const stageLoadResults = await page.evaluate((ids) => {
    const results = [];
    for (const id of ids) {
      try {
        if (window.GameState) window.GameState.currentStageId = id;
        if (window.Level && window.Level.loadStage) {
          window.Level.loadStage(id);
        } else if (window.Level && window.Level.load) {
          window.Level.load(id);
        }
        results.push({
          id,
          loaded: window.Level.width > 0 && window.Level.height > 0,
          width: window.Level.width,
          height: window.Level.height
        });
      } catch (e) {
        results.push({ id, loaded: false, error: e.message });
      }
    }
    return results;
  }, stageIds);

  let allStagesLoaded = true;
  for (const s of stageLoadResults) {
    if (!s.loaded) {
      allStagesLoaded = false;
      record('C-02', `Stage ${s.id} loadable`, false, s.error || `w=${s.width} h=${s.height}`);
    }
  }
  if (allStagesLoaded) {
    record('C-02', 'All 13 stages loadable (width>0 && height>0)', true,
      stageLoadResults.map(s => `${s.id}:${s.width}x${s.height}`).join(', '));
  } else {
    const passing = stageLoadResults.filter(s => s.loaded);
    record('C-02', `${passing.length}/13 stages loaded successfully`, false);
  }

  // ═══════════════════════════════════════════
  // TEST C-03: Spawn/exit points
  // ═══════════════════════════════════════════
  console.log('\n=== C-03: Spawn/exit points ===');

  const spawnExitResults = await page.evaluate((ids) => {
    const results = [];
    for (const id of ids) {
      try {
        if (window.GameState) window.GameState.currentStageId = id;
        if (window.Level.loadStage) window.Level.loadStage(id);
        else if (window.Level.load) window.Level.load(id);

        results.push({
          id,
          spawnX: window.Level.spawnX,
          spawnY: window.Level.spawnY,
          exitX: window.Level.exitX,
          exitY: window.Level.exitY,
          hasSpawn: window.Level.spawnX > 0 && window.Level.spawnY > 0,
          hasExit: window.Level.exitX > 0 && window.Level.exitY > 0
        });
      } catch (e) {
        results.push({ id, hasSpawn: false, hasExit: false, error: e.message });
      }
    }
    return results;
  }, stageIds);

  let allSpawns = true, allExits = true;
  const failedSpawns = [], failedExits = [];
  for (const s of spawnExitResults) {
    if (!s.hasSpawn) { allSpawns = false; failedSpawns.push(`${s.id}(${s.spawnX},${s.spawnY})`); }
    if (!s.hasExit) { allExits = false; failedExits.push(`${s.id}(${s.exitX},${s.exitY})`); }
  }
  record('C-03', 'All stages have spawn points (spawnX>0, spawnY>0)', allSpawns,
    allSpawns ? '' : `Failed: ${failedSpawns.join(', ')}`);
  record('C-03', 'All stages have exit points (exitX>0, exitY>0)', allExits,
    allExits ? '' : `Failed: ${failedExits.join(', ')}`);

  // ═══════════════════════════════════════════
  // TEST C-04: Boss data
  // ═══════════════════════════════════════════
  console.log('\n=== C-04: Boss data ===');

  const bossDataResults = await page.evaluate((ids) => {
    const results = [];
    for (const id of ids) {
      try {
        if (window.GameState) window.GameState.currentStageId = id;
        if (window.Level.loadStage) window.Level.loadStage(id);
        else if (window.Level.load) window.Level.load(id);

        const bd = window.Level.bossData;
        results.push({
          id,
          hasBossData: bd !== null && bd !== undefined,
          type: bd ? bd.type : null,
          typeIsString: bd ? typeof bd.type === 'string' : false,
          spawnX: bd ? bd.spawnX : 0,
          spawnY: bd ? bd.spawnY : 0,
          hasSpawn: bd ? (bd.spawnX > 0 && bd.spawnY > 0) : false,
          arenaX: window.Level.bossArenaX,
          hasArena: window.Level.bossArenaX > 0
        });
      } catch (e) {
        results.push({ id, hasBossData: false, error: e.message });
      }
    }
    return results;
  }, stageIds);

  let allBoss = true;
  const bossFailures = [];
  for (const b of bossDataResults) {
    const issues = [];
    if (!b.hasBossData) issues.push('no bossData');
    if (!b.typeIsString) issues.push(`type not string: ${b.type}`);
    if (!b.hasSpawn) issues.push(`spawn(${b.spawnX},${b.spawnY})`);
    if (!b.hasArena) issues.push(`arenaX=${b.arenaX}`);
    if (issues.length > 0) {
      allBoss = false;
      bossFailures.push(`${b.id}: ${issues.join(', ')}`);
    }
  }
  record('C-04', 'All stages have valid boss data', allBoss,
    allBoss ? bossDataResults.map(b => `${b.id}:${b.type}`).join(', ') : `Failures: ${bossFailures.join('; ')}`);

  // ═══════════════════════════════════════════
  // TEST C-05: Coin positions
  // ═══════════════════════════════════════════
  console.log('\n=== C-05: Coin positions ===');

  const coinResults = await page.evaluate((ids) => {
    const results = [];
    for (const id of ids) {
      try {
        if (window.GameState) window.GameState.currentStageId = id;
        if (window.Level.loadStage) window.Level.loadStage(id);
        else if (window.Level.load) window.Level.load(id);

        const coins = window.Level.coinPositions;
        const isArray = Array.isArray(coins);
        const len = isArray ? coins.length : 0;

        // Check WorldMap.STAGES for totalCoins
        let expectedCoins = null;
        if (window.WorldMap && window.WorldMap.STAGES) {
          const stageInfo = window.WorldMap.STAGES.find(s => s.id === id);
          if (stageInfo) expectedCoins = stageInfo.totalCoins;
        }

        results.push({
          id, isArray, length: len, expectedCoins,
          matches: expectedCoins !== null ? len === expectedCoins : null
        });
      } catch (e) {
        results.push({ id, isArray: false, length: 0, error: e.message });
      }
    }
    return results;
  }, stageIds);

  let allCoinsPresent = true;
  const coinFailures = [];
  for (const c of coinResults) {
    if (!c.isArray || c.length === 0) {
      allCoinsPresent = false;
      coinFailures.push(`${c.id}: array=${c.isArray}, len=${c.length}`);
    }
  }
  record('C-05', 'All stages have coin positions (array.length > 0)', allCoinsPresent,
    allCoinsPresent ? coinResults.map(c => `${c.id}:${c.length}`).join(', ') : `Failures: ${coinFailures.join('; ')}`);

  // Check WorldMap totalCoins match
  const coinMatchResults = coinResults.filter(c => c.expectedCoins !== null);
  if (coinMatchResults.length > 0) {
    const allMatch = coinMatchResults.every(c => c.matches);
    const mismatches = coinMatchResults.filter(c => !c.matches);
    record('C-05', 'Coin counts match WorldMap.STAGES.totalCoins', allMatch,
      allMatch ? '' : `Mismatches: ${mismatches.map(c => `${c.id}: got ${c.length}, expected ${c.expectedCoins}`).join('; ')}`);
  }

  // ═══════════════════════════════════════════
  // TEST C-06: Enemy spawns
  // ═══════════════════════════════════════════
  console.log('\n=== C-06: Enemy spawns ===');

  const enemyResults = await page.evaluate((ids) => {
    const results = [];
    for (const id of ids) {
      try {
        if (window.GameState) window.GameState.currentStageId = id;
        if (window.Level.loadStage) window.Level.loadStage(id);
        else if (window.Level.load) window.Level.load(id);

        const enemies = window.Level.enemySpawns;
        const isArray = Array.isArray(enemies);
        const len = isArray ? enemies.length : 0;
        results.push({ id, isArray, length: len });
      } catch (e) {
        results.push({ id, isArray: false, length: 0, error: e.message });
      }
    }
    return results;
  }, stageIds);

  let allEnemies = true;
  const enemyFailures = [];
  for (const e of enemyResults) {
    if (!e.isArray || e.length === 0) {
      allEnemies = false;
      enemyFailures.push(`${e.id}: array=${e.isArray}, len=${e.length}`);
    }
  }
  record('C-06', 'All stages have enemy spawns (array.length > 0)', allEnemies,
    allEnemies ? enemyResults.map(e => `${e.id}:${e.length}`).join(', ') : `Failures: ${enemyFailures.join('; ')}`);

  // ═══════════════════════════════════════════
  // TEST C-07: World map unlock progression
  // ═══════════════════════════════════════════
  console.log('\n=== C-07: World map unlock progression ===');

  const unlockTest = await page.evaluate(() => {
    try {
      // Clear and init
      window.SaveSystem.clearSave();
      window.WorldMap.init();

      const nodes = window.WorldMap.nodes || window.WorldMap.stageNodes || [];
      const firstUnlocked = nodes.length > 0 ? nodes[0].unlocked : undefined;
      const secondLocked = nodes.length > 1 ? nodes[1].unlocked : undefined;

      // Complete stage 1-1
      window.SaveSystem.recordStageCompletion('1-1', 30, 10);
      window.WorldMap.init();

      const nodesAfter = window.WorldMap.nodes || window.WorldMap.stageNodes || [];
      const secondUnlockedAfter = nodesAfter.length > 1 ? nodesAfter[1].unlocked : undefined;

      return {
        nodesCount: nodes.length,
        firstUnlocked,
        secondLocked,
        secondUnlockedAfter
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  if (unlockTest.error) {
    record('C-07', 'World map unlock progression', false, `Error: ${unlockTest.error}`);
  } else {
    record('C-07', 'First node unlocked by default', unlockTest.firstUnlocked === true,
      `firstUnlocked=${unlockTest.firstUnlocked}`);
    record('C-07', 'Second node locked initially', unlockTest.secondLocked === false,
      `secondLocked=${unlockTest.secondLocked}`);
    record('C-07', 'Second node unlocked after completing 1-1', unlockTest.secondUnlockedAfter === true,
      `secondUnlockedAfter=${unlockTest.secondUnlockedAfter}`);
  }

  // ═══════════════════════════════════════════
  // TEST C-10: Save system round-trip
  // ═══════════════════════════════════════════
  console.log('\n=== C-10: Save system round-trip ===');

  const saveRoundTrip = await page.evaluate(() => {
    try {
      window.SaveSystem.clearSave();
      window.SaveSystem.recordStageCompletion('1-1', 45.5, 12);
      window.SaveSystem.recordStageCompletion('1-2', 60.2, 18);
      const data = window.SaveSystem.load();

      return {
        data,
        hasCompletedStages: Array.isArray(data.completedStages),
        has11: data.completedStages ? data.completedStages.includes('1-1') : false,
        has12: data.completedStages ? data.completedStages.includes('1-2') : false,
        hasBestTimes: typeof data.bestTimes === 'object',
        bestTime11: data.bestTimes ? data.bestTimes['1-1'] : undefined,
        bestTime12: data.bestTimes ? data.bestTimes['1-2'] : undefined,
        hasCoinRecords: typeof data.coinRecords === 'object',
        coinRecord11: data.coinRecords ? data.coinRecords['1-1'] : undefined,
        coinRecord12: data.coinRecords ? data.coinRecords['1-2'] : undefined
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  if (saveRoundTrip.error) {
    record('C-10', 'Save system round-trip', false, `Error: ${saveRoundTrip.error}`);
  } else {
    record('C-10', 'completedStages is array', saveRoundTrip.hasCompletedStages);
    record('C-10', 'completedStages includes 1-1', saveRoundTrip.has11);
    record('C-10', 'completedStages includes 1-2', saveRoundTrip.has12);
    record('C-10', 'bestTimes is object', saveRoundTrip.hasBestTimes);
    record('C-10', 'bestTimes[1-1] = 45.5', saveRoundTrip.bestTime11 === 45.5,
      `got ${saveRoundTrip.bestTime11}`);
    record('C-10', 'bestTimes[1-2] = 60.2', saveRoundTrip.bestTime12 === 60.2,
      `got ${saveRoundTrip.bestTime12}`);
    record('C-10', 'coinRecords is object', saveRoundTrip.hasCoinRecords);
    record('C-10', 'coinRecords[1-1] = 12', saveRoundTrip.coinRecord11 === 12,
      `got ${saveRoundTrip.coinRecord11}`);
    record('C-10', 'coinRecords[1-2] = 18', saveRoundTrip.coinRecord12 === 18,
      `got ${saveRoundTrip.coinRecord12}`);
  }

  // ═══════════════════════════════════════════
  // TEST C-11: Best records persistence
  // ═══════════════════════════════════════════
  console.log('\n=== C-11: Best records persistence ===');

  const bestRecords = await page.evaluate(() => {
    try {
      window.SaveSystem.clearSave();

      // First completion: time=30, coins=15
      window.SaveSystem.recordStageCompletion('1-1', 30, 15);

      // Worse time (50), fewer coins (10) -- should NOT overwrite
      window.SaveSystem.recordStageCompletion('1-1', 50, 10);
      let data = window.SaveSystem.load();
      const afterWorse = {
        bestTime: data.bestTimes['1-1'],
        coinRecord: data.coinRecords['1-1']
      };

      // Better time (25), more coins (20) -- should overwrite
      window.SaveSystem.recordStageCompletion('1-1', 25, 20);
      data = window.SaveSystem.load();
      const afterBetter = {
        bestTime: data.bestTimes['1-1'],
        coinRecord: data.coinRecords['1-1']
      };

      return { afterWorse, afterBetter };
    } catch (e) {
      return { error: e.message };
    }
  });

  if (bestRecords.error) {
    record('C-11', 'Best records persistence', false, `Error: ${bestRecords.error}`);
  } else {
    record('C-11', 'Worse time does not overwrite (bestTime stays 30)',
      bestRecords.afterWorse.bestTime === 30,
      `got ${bestRecords.afterWorse.bestTime}`);
    record('C-11', 'Worse coins do not overwrite (coinRecord stays 15)',
      bestRecords.afterWorse.coinRecord === 15,
      `got ${bestRecords.afterWorse.coinRecord}`);
    record('C-11', 'Better time overwrites (bestTime becomes 25)',
      bestRecords.afterBetter.bestTime === 25,
      `got ${bestRecords.afterBetter.bestTime}`);
    record('C-11', 'More coins overwrites (coinRecord becomes 20)',
      bestRecords.afterBetter.coinRecord === 20,
      `got ${bestRecords.afterBetter.coinRecord}`);
  }

  // ═══════════════════════════════════════════
  // TEST C-12: Clear save
  // ═══════════════════════════════════════════
  console.log('\n=== C-12: Clear save ===');

  const clearSave = await page.evaluate(() => {
    try {
      window.SaveSystem.recordStageCompletion('1-1', 30, 10);
      window.SaveSystem.clearSave();
      const data = window.SaveSystem.load();

      return {
        completedStagesLen: data.completedStages ? data.completedStages.length : -1,
        bestTimesLen: data.bestTimes ? Object.keys(data.bestTimes).length : -1,
        coinRecordsLen: data.coinRecords ? Object.keys(data.coinRecords).length : -1
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  if (clearSave.error) {
    record('C-12', 'Clear save', false, `Error: ${clearSave.error}`);
  } else {
    record('C-12', 'completedStages empty after clear', clearSave.completedStagesLen === 0,
      `length=${clearSave.completedStagesLen}`);
    record('C-12', 'bestTimes empty after clear', clearSave.bestTimesLen === 0,
      `length=${clearSave.bestTimesLen}`);
    record('C-12', 'coinRecords empty after clear', clearSave.coinRecordsLen === 0,
      `length=${clearSave.coinRecordsLen}`);
  }

  // ═══════════════════════════════════════════
  // TEST C-24: AudioManager methods exist
  // ═══════════════════════════════════════════
  console.log('\n=== C-24: AudioManager methods exist ===');

  const audioMethods = ['playJump', 'playLand', 'playAttack', 'playHurt', 'playCoinCollect',
    'playStageClear', 'playGameOver', 'startAmbient', 'stopAmbient', 'startBossMusic', 'stopBossMusic'];

  const audioResults = await page.evaluate((methods) => {
    if (!window.AudioManager) return { exists: false };
    return {
      exists: true,
      methods: methods.map(m => ({
        name: m,
        exists: typeof window.AudioManager[m] === 'function'
      }))
    };
  }, audioMethods);

  if (!audioResults.exists) {
    record('C-24', 'AudioManager exists', false);
  } else {
    let allAudioMethods = true;
    const missingAudio = [];
    for (const m of audioResults.methods) {
      if (!m.exists) { allAudioMethods = false; missingAudio.push(m.name); }
    }
    record('C-24', 'All 11 AudioManager methods exist', allAudioMethods,
      allAudioMethods ? audioMethods.join(', ') : `Missing: ${missingAudio.join(', ')}`);
  }

  // ═══════════════════════════════════════════
  // TEST C-20: Boss maxHealth values
  // ═══════════════════════════════════════════
  console.log('\n=== C-20: Boss maxHealth values ===');

  const expectedBossHealth = {
    '1-1': { name: 'Elder Shroomba', hp: 5 },
    '1-2': { name: 'Vine Mother', hp: 6 },
    '1-3': { name: 'Stag King', hp: 7 },
    '2-1': { name: 'Sand Wyrm', hp: 6 },
    '2-2': { name: 'Pharaoh Specter', hp: 8 },
    '2-3': { name: 'Hydra Cactus', hp: 12 },
    '3-1': { name: 'Frost Bear', hp: 7 },
    '3-2': { name: 'Crystal Witch', hp: 25 },
    '3-3': { name: 'Yeti Monarch', hp: 9 },
    '4-1': { name: 'Lava Serpent', hp: 7 },
    '4-2': { name: 'Iron Warden', hp: 7 },
    '4-3': { name: 'Dragon', hp: 11 },
    '5-1': { name: 'Architect', hp: 19 }
  };

  const bossHealthResults = await page.evaluate(({ ids, expectedMap }) => {
    const results = [];
    for (const id of ids) {
      try {
        if (window.GameState) window.GameState.currentStageId = id;
        if (window.Level.loadStage) window.Level.loadStage(id);
        else if (window.Level.load) window.Level.load(id);

        const bd = window.Level.bossData;
        if (!bd) {
          results.push({ id, error: 'no bossData' });
          continue;
        }

        // Try to spawn boss and check maxHealth
        let maxHealth = null;
        let bossType = bd.type;

        // Try spawning via Enemies
        if (window.Enemies) {
          // Reset enemies
          if (window.Enemies.init) window.Enemies.init();
          // spawnBoss takes (type, x, y) as separate arguments
          if (window.Enemies.spawnBoss) {
            window.Enemies.spawnBoss(bd.type, bd.spawnX, bd.spawnY);
          } else if (window.Enemies.createBoss) {
            window.Enemies.createBoss(bd.type, bd.spawnX, bd.spawnY);
          }

          const boss = window.Enemies.boss;
          if (boss) {
            maxHealth = boss.maxHealth || boss.maxHp || boss.health || boss.hp;
          }
        }

        results.push({
          id,
          bossType,
          maxHealth,
          expected: expectedMap[id].hp,
          expectedName: expectedMap[id].name,
          matches: maxHealth === expectedMap[id].hp
        });
      } catch (e) {
        results.push({ id, error: e.message });
      }
    }
    return results;
  }, { ids: stageIds, expectedMap: expectedBossHealth });

  let allBossHP = true;
  for (const b of bossHealthResults) {
    if (b.error) {
      record('C-20', `Boss ${b.id} maxHealth`, false, `Error: ${b.error}`);
      allBossHP = false;
    } else if (!b.matches) {
      record('C-20', `Boss ${b.id} (${b.expectedName}) maxHealth=${b.expected}`, false,
        `got ${b.maxHealth}, type=${b.bossType}`);
      allBossHP = false;
    }
  }
  if (allBossHP) {
    record('C-20', 'All 13 boss maxHealth values correct', true,
      bossHealthResults.map(b => `${b.id}:${b.maxHealth}`).join(', '));
  }

  // ═══════════════════════════════════════════
  // TEST C-21: Boss spawn without errors
  // ═══════════════════════════════════════════
  console.log('\n=== C-21: Boss spawn without errors ===');

  const bossSpawnResults = await page.evaluate((ids) => {
    const results = [];
    for (const id of ids) {
      try {
        if (window.GameState) window.GameState.currentStageId = id;
        if (window.Level.loadStage) window.Level.loadStage(id);
        else if (window.Level.load) window.Level.load(id);

        const bd = window.Level.bossData;
        if (!bd) {
          results.push({ id, spawned: false, error: 'no bossData' });
          continue;
        }

        if (window.Enemies) {
          if (window.Enemies.init) window.Enemies.init();
          // spawnBoss takes (type, x, y) as separate arguments
          if (window.Enemies.spawnBoss) window.Enemies.spawnBoss(bd.type, bd.spawnX, bd.spawnY);
          else if (window.Enemies.createBoss) window.Enemies.createBoss(bd.type, bd.spawnX, bd.spawnY);

          const boss = window.Enemies.boss;
          results.push({
            id,
            bossType: bd.type,
            spawned: boss !== null && boss !== undefined
          });
        } else {
          results.push({ id, spawned: false, error: 'no Enemies module' });
        }
      } catch (e) {
        results.push({ id, spawned: false, error: e.message });
      }
    }
    return results;
  }, stageIds);

  let allBossSpawned = true;
  const spawnFailures = [];
  for (const b of bossSpawnResults) {
    if (!b.spawned) {
      allBossSpawned = false;
      spawnFailures.push(`${b.id}: ${b.error || 'boss is null'}`);
    }
  }
  record('C-21', 'All 13 bosses spawn without errors', allBossSpawned,
    allBossSpawned ? bossSpawnResults.map(b => `${b.id}:${b.bossType}`).join(', ') : `Failures: ${spawnFailures.join('; ')}`);

  // ═══════════════════════════════════════════
  // TEST C-17: FPS on title screen
  // ═══════════════════════════════════════════
  console.log('\n=== C-17: FPS on title screen ===');

  // Reload page for clean title screen
  const page2 = await context.newPage();
  await page2.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page2.waitForTimeout(5000); // Wait 5 seconds for FPS data

  const fpsResult = await page2.evaluate(() => {
    try {
      const debug = window.__gameDebug;
      if (!debug) return { error: 'no __gameDebug' };

      let fps = debug.fps;
      if (fps === undefined && debug.frameTimes && debug.frameTimes.length > 0) {
        const avgFrameTime = debug.frameTimes.reduce((a, b) => a + b, 0) / debug.frameTimes.length;
        fps = 1000 / avgFrameTime;
      }

      return {
        fps: fps,
        frameTimes: debug.frameTimes ? debug.frameTimes.length : 0,
        hasDebug: true
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  if (fpsResult.error) {
    record('C-17', 'FPS measurable on title screen', false, `Error: ${fpsResult.error}`);
  } else {
    const fps = fpsResult.fps;
    record('C-17', 'FPS data available', fps !== undefined && fps !== null,
      `fps=${fps}, frameTimes=${fpsResult.frameTimes}`);
    if (fps !== undefined && fps !== null) {
      record('C-17', 'FPS >= 30 on title screen', fps >= 30, `fps=${Math.round(fps * 10) / 10}`);
      record('C-17', 'FPS >= 55 on title screen (ideal)', fps >= 55, `fps=${Math.round(fps * 10) / 10}`);
    }
  }

  await page2.close();

  // ═══════════════════════════════════════════
  // FINAL CLEANUP
  // ═══════════════════════════════════════════

  // Clean up save data
  await page.evaluate(() => {
    if (window.SaveSystem && window.SaveSystem.clearSave) window.SaveSystem.clearSave();
  });

  await browser.close();

  // ═══════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  // Group by test ID
  const grouped = {};
  for (const r of results) {
    if (!grouped[r.testId]) grouped[r.testId] = [];
    grouped[r.testId].push(r);
  }

  for (const [testId, items] of Object.entries(grouped)) {
    const allPass = items.every(i => i.status === 'PASS');
    console.log(`\n${testId}: ${allPass ? 'PASS' : 'FAIL'}`);
    for (const item of items) {
      console.log(`  [${item.status}] ${item.criterion}${item.detail ? ' -- ' + item.detail : ''}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${totalPass} PASS, ${totalFail} FAIL out of ${totalPass + totalFail} checks`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
