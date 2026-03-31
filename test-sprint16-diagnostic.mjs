// Diagnostic: Find narrow platforms in failing stages using the browser validator
import { chromium } from 'playwright';

const URL = 'http://localhost:8080';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // For each failing stage, find narrow platforms
  const failingStages = [
    { id: '1-1', minWidth: 3 },
    { id: '1-3', minWidth: 3 },
    { id: '2-1', minWidth: 2 },
    { id: '2-2', minWidth: 2 },
  ];

  for (const { id, minWidth } of failingStages) {
    console.log(`\n=== Stage ${id} (min width ${minWidth}) ===`);

    const narrowPlatforms = await page.evaluate(({ stageId, requiredMin }) => {
      // Load stage
      Level.loadStage(stageId);
      const tiles = Level.tiles;
      const w = Level.width;
      const h = Level.height;

      // Use the actual game constants (from constants.js)
      // TILE_SOLID=1, TILE_ONE_WAY=2, TILE_ICE=14
      const isStandable = (t) => t === TILE_SOLID || t === TILE_ONE_WAY || t === TILE_ICE;
      const isPassable = (t) => PlayabilityValidator.isPassable(t);

      const narrow = [];

      for (let r = 0; r < h; r++) {
        let runStart = -1;
        let runLength = 0;

        for (let c = 0; c < w; c++) {
          const tile = tiles[r][c];
          const abovePassable = r > 0 ? isPassable(tiles[r-1][c]) : true;

          if (isStandable(tile) && abovePassable) {
            if (runLength === 0) runStart = c;
            runLength++;
          } else {
            if (runLength > 0 && runLength < requiredMin) {
              // Get tile types in this run and above
              const tileTypes = [];
              const aboveTypes = [];
              for (let cc = runStart; cc < runStart + runLength; cc++) {
                tileTypes.push(tiles[r][cc]);
                aboveTypes.push(r > 0 ? tiles[r-1][cc] : -1);
              }
              // Also get adjacent tiles for context
              const beforeTile = runStart > 0 ? tiles[r][runStart-1] : -1;
              const afterTile = (runStart + runLength < w) ? tiles[r][runStart + runLength] : -1;
              const beforeAbove = (runStart > 0 && r > 0) ? tiles[r-1][runStart-1] : -1;
              const afterAbove = (runStart + runLength < w && r > 0) ? tiles[r-1][runStart + runLength] : -1;

              narrow.push({
                row: r,
                startCol: runStart,
                endCol: runStart + runLength - 1,
                length: runLength,
                tileTypes,
                aboveTypes,
                beforeTile,
                afterTile,
                beforeAbove,
                afterAbove
              });
            }
            runLength = 0;
          }
        }
        if (runLength > 0 && runLength < requiredMin) {
          const tileTypes = [];
          for (let cc = runStart; cc < runStart + runLength; cc++) {
            tileTypes.push(tiles[r][cc]);
          }
          narrow.push({ row: r, startCol: runStart, endCol: runStart + runLength - 1, length: runLength, tileTypes });
        }
      }

      return narrow;
    }, { stageId: id, requiredMin: minWidth });

    if (narrowPlatforms.length === 0) {
      console.log('  No narrow platforms found (should not happen if FAIL)');
    } else {
      console.log(`  Found ${narrowPlatforms.length} narrow platform(s):`);
      for (const np of narrowPlatforms) {
        const tileNames = np.tileTypes.map(t => {
          if (t === 2) return 'SOLID';
          if (t === 3) return 'ONE_WAY';
          if (t === 11) return 'ICE';
          return `T${t}`;
        });
        const aboveNames = (np.aboveTypes || []).map(t => {
          if (t === 0) return 'EMPTY';
          if (t === 2) return 'SOLID';
          if (t === 3) return 'ONE_WAY';
          if (t === 6) return 'BOUNCE';
          if (t === 7) return 'HAZARD';
          if (t === 8) return 'BREAKABLE';
          if (t === 9) return 'CRUMBLE';
          if (t === 11) return 'ICE';
          if (t === 15) return 'GATE';
          return `T${t}`;
        });
        console.log(`  row=${np.row}, cols=${np.startCol}-${np.endCol}, len=${np.length}, tiles=[${tileNames}], above=[${aboveNames}], before=${np.beforeTile}, after=${np.afterTile}, beforeAbove=${np.beforeAbove}, afterAbove=${np.afterAbove}`);
      }
    }
  }

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
