// ============================================================
// worldmap.js — World Map: top-down navigable stage selection
// Design spec: 4 world clusters (Forest, Desert, Tundra, Volcano)
// + 1 Citadel node = 13 nodes total
// Nodes: 28px diameter, connected by paths (solid=unlocked, dashed=locked)
// Colors: Warm Slate paths, Muted Gold selected, Steel Blue locked,
//         Moss Green completed
// Info panel: 260x160, bottom-right, Deep Charcoal bg, Muted Gold border
// ============================================================

const WorldMap = {
    // All stage nodes
    nodes: [],
    // Path connections
    paths: [],
    // Currently selected node index
    selectedNode: 0,
    // Animation timer
    animTimer: 0,
    // Background stars for atmosphere
    _bgStars: [],
    // First visit flag
    _isFirstVisit: false,

    // Stage definitions: id, name, world, difficulty, totalCoins
    STAGES: [
        // World 1 — Forest
        { id: '1-1', name: 'Canopy Trail',      world: 0, difficulty: 1, totalCoins: 15 },
        { id: '1-2', name: 'Hollow Depths',      world: 0, difficulty: 2, totalCoins: 20 },
        { id: '1-3', name: 'Treetop Gauntlet',   world: 0, difficulty: 2, totalCoins: 25 },
        // World 2 — Desert
        { id: '2-1', name: 'Dune Sea',           world: 1, difficulty: 1, totalCoins: 18 },
        { id: '2-2', name: 'Buried Temple',      world: 1, difficulty: 2, totalCoins: 22 },
        { id: '2-3', name: 'Oasis Mirage',       world: 1, difficulty: 3, totalCoins: 28 },
        // World 3 — Tundra
        { id: '3-1', name: 'Frozen Lake',        world: 2, difficulty: 2, totalCoins: 20 },
        { id: '3-2', name: 'Crystal Caverns',    world: 2, difficulty: 2, totalCoins: 24 },
        { id: '3-3', name: 'Avalanche Peak',     world: 2, difficulty: 3, totalCoins: 30 },
        // World 4 — Volcano
        { id: '4-1', name: 'Lava Fields',        world: 3, difficulty: 2, totalCoins: 22 },
        { id: '4-2', name: 'Forge of Chains',    world: 3, difficulty: 3, totalCoins: 26 },
        { id: '4-3', name: 'Caldera',            world: 3, difficulty: 3, totalCoins: 32 },
        // Citadel
        { id: '5-1', name: 'The Citadel',        world: 4, difficulty: 3, totalCoins: 40 }
    ],

    // World palette colors (for background wash and node coloring)
    WORLD_COLORS: [
        // Forest
        { primary: '#2D5A27', secondary: '#4A8C3F', bg: '#1A3A15', highlight: '#C8E6A0', name: 'Whispering Forest' },
        // Desert
        { primary: '#C4943A', secondary: '#8B6B2E', bg: '#3A2A1A', highlight: '#E8D4A0', name: 'Scorching Desert' },
        // Tundra
        { primary: '#6B9CB8', secondary: '#A8D4E6', bg: '#2A4A5A', highlight: '#C8FFE8', name: 'Frozen Tundra' },
        // Volcano
        { primary: '#8B2A1A', secondary: '#FF6A2A', bg: '#2A1A1A', highlight: '#FFD43A', name: 'Molten Volcano' },
        // Citadel
        { primary: '#C4A35A', secondary: '#E8DCC8', bg: '#1A1A2E', highlight: '#FFD700', name: 'The Citadel' }
    ],

    /**
     * Initialize the world map with node positions and paths.
     */
    init() {
        this.animTimer = 0;
        this._buildNodes();
        this._buildPaths();
        this._buildBackground();
        this._applyUnlockState();

        // Check for first visit (no save data, first time on map)
        const saveData = SaveSystem.load();
        this._isFirstVisit = saveData.completedStages.length === 0;

        // Select the first unlocked incomplete node, or the last unlocked
        this._selectBestNode();
    },

    /**
     * Build node positions arranged in 4 world clusters + Citadel.
     */
    _buildNodes() {
        this.nodes = [];

        // Layout positions for 4 clusters (3 nodes each) + 1 citadel
        // Arranged left-to-right across the canvas with vertical variation
        const layouts = [
            // World 1 — Forest (left area)
            { x: 120, y: 300 },
            { x: 190, y: 220 },
            { x: 260, y: 280 },
            // World 2 — Desert (center-left)
            { x: 350, y: 340 },
            { x: 420, y: 260 },
            { x: 490, y: 310 },
            // World 3 — Tundra (center-right)
            { x: 580, y: 220 },
            { x: 650, y: 300 },
            { x: 720, y: 240 },
            // World 4 — Volcano (right area)
            { x: 770, y: 350 },
            { x: 820, y: 270 },
            { x: 870, y: 330 },
            // Citadel (far right, special position)
            { x: 910, y: 180 }
        ];

        for (let i = 0; i < this.STAGES.length; i++) {
            const stage = this.STAGES[i];
            const pos = layouts[i];
            this.nodes.push({
                x: pos.x,
                y: pos.y,
                stageIndex: i,
                stageId: stage.id,
                name: stage.name,
                world: stage.world,
                difficulty: stage.difficulty,
                totalCoins: stage.totalCoins,
                unlocked: false,
                completed: false,
                radius: 14  // 28px diameter
            });
        }
    },

    /**
     * Build path connections between nodes.
     * Each node connects to its sequential neighbor.
     */
    _buildPaths() {
        this.paths = [];
        for (let i = 0; i < this.nodes.length - 1; i++) {
            this.paths.push({
                from: i,
                to: i + 1
            });
        }
    },

    /**
     * Build decorative background elements.
     */
    _buildBackground() {
        this._bgStars = [];
        for (let i = 0; i < 120; i++) {
            this._bgStars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: 0.5 + Math.random() * 1.5,
                brightness: 0.15 + Math.random() * 0.35,
                twinkleSpeed: 1 + Math.random() * 3
            });
        }
    },

    /**
     * Apply unlock/completion state from save data.
     */
    _applyUnlockState() {
        const saveData = SaveSystem.load();

        // First node is always unlocked
        this.nodes[0].unlocked = true;

        // Mark completed stages and unlock next
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            if (saveData.completedStages.includes(node.stageId)) {
                node.completed = true;
                node.unlocked = true;
                // Unlock next node
                if (i + 1 < this.nodes.length) {
                    this.nodes[i + 1].unlocked = true;
                }
            }
        }
    },

    /**
     * Select the best node for the player to start on.
     */
    _selectBestNode() {
        // Find the first unlocked, uncompleted node
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].unlocked && !this.nodes[i].completed) {
                this.selectedNode = i;
                return;
            }
        }
        // All completed — select last node
        this.selectedNode = this.nodes.length - 1;
    },

    /**
     * Unlock all stages (debug).
     */
    unlockAllStages() {
        for (const node of this.nodes) {
            node.unlocked = true;
        }
    },

    /**
     * Complete a stage and unlock the next one.
     */
    completeStage(stageId, time, coins) {
        // Save the completion
        SaveSystem.recordStageCompletion(stageId, time, coins);

        // Update node states
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].stageId === stageId) {
                this.nodes[i].completed = true;
                // Unlock next
                if (i + 1 < this.nodes.length) {
                    this.nodes[i + 1].unlocked = true;
                }
                break;
            }
        }
    },

    /**
     * Get the currently selected node.
     */
    getSelectedNode() {
        return this.nodes[this.selectedNode];
    },

    /**
     * Get stage info for the selected node.
     */
    getSelectedStageInfo() {
        const node = this.nodes[this.selectedNode];
        return this.STAGES[node.stageIndex];
    },

    // =============================================
    // UPDATE
    // =============================================

    update() {
        this.animTimer += 1 / 60;

        if (GameState.transitioning) return;

        // Navigation with arrow keys
        if (Input.isJustPressed('ArrowRight') || Input.isJustPressed('ArrowDown')) {
            this._navigateNext();
        }
        if (Input.isJustPressed('ArrowLeft') || Input.isJustPressed('ArrowUp')) {
            this._navigatePrev();
        }

        // Enter to start stage
        if (Input.isJustPressed('Enter')) {
            const node = this.nodes[this.selectedNode];
            if (node.unlocked) {
                this._startStage(node);
            }
        }

        // Escape to return to title
        if (Input.isJustPressed('Escape')) {
            GameState.transitionTo(GameState.TITLE, () => {
                GameState.setupTitle();
            });
        }
    },

    _navigateNext() {
        // Find next unlocked node
        for (let i = this.selectedNode + 1; i < this.nodes.length; i++) {
            if (this.nodes[i].unlocked) {
                this.selectedNode = i;
                return;
            }
        }
        // No unlocked node forward — stay put
    },

    _navigatePrev() {
        // Find previous unlocked node
        for (let i = this.selectedNode - 1; i >= 0; i--) {
            if (this.nodes[i].unlocked) {
                this.selectedNode = i;
                return;
            }
        }
        // No unlocked node backward — stay put
    },

    _startStage(node) {
        GameState.currentStageId = node.stageId;
        GameState.stageName = node.name;
        GameState.transitionTo(GameState.STAGE, () => {
            GameState.setupStage();
        });
    },

    // =============================================
    // RENDER
    // =============================================

    render(ctx) {
        // Background
        this._renderBackground(ctx);

        // World cluster backgrounds (subtle wash)
        this._renderWorldAreas(ctx);

        // Paths between nodes
        this._renderPaths(ctx);

        // Nodes
        this._renderNodes(ctx);

        // Info panel
        this._renderInfoPanel(ctx);

        // First visit guidance
        if (this._isFirstVisit) {
            this._renderFirstVisitGuide(ctx);
        }

        // World name labels
        this._renderWorldLabels(ctx);
    },

    _renderBackground(ctx) {
        // Dark textured background — not a plain solid color
        // Gradient from deep dark blue to slightly lighter
        const grad = ctx.createRadialGradient(
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50,
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
        );
        grad.addColorStop(0, '#16162E');
        grad.addColorStop(0.5, '#111128');
        grad.addColorStop(1, '#0A0A1A');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Grid pattern for depth
        ctx.strokeStyle = 'rgba(45, 45, 68, 0.15)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < CANVAS_WIDTH; x += 48) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += 48) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        // Twinkling stars
        for (const star of this._bgStars) {
            const alpha = star.brightness * (0.5 + 0.5 * Math.sin(this.animTimer * star.twinkleSpeed + star.x));
            ctx.fillStyle = COLORS.softCream;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },

    _renderWorldAreas(ctx) {
        // Draw subtle colored regions behind each world cluster
        const worldBounds = [
            { cx: 190, cy: 265, r: 110 }, // Forest
            { cx: 420, cy: 305, r: 110 }, // Desert
            { cx: 650, cy: 255, r: 110 }, // Tundra
            { cx: 820, cy: 315, r: 100 }, // Volcano
            { cx: 910, cy: 180, r: 60 }   // Citadel
        ];

        for (let w = 0; w < worldBounds.length; w++) {
            const area = worldBounds[w];
            const colors = this.WORLD_COLORS[w];
            const grad = ctx.createRadialGradient(area.cx, area.cy, 0, area.cx, area.cy, area.r);
            grad.addColorStop(0, this._hexToRGBA(colors.bg, 0.4));
            grad.addColorStop(0.7, this._hexToRGBA(colors.bg, 0.15));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(area.cx - area.r, area.cy - area.r, area.r * 2, area.r * 2);
        }
    },

    _renderPaths(ctx) {
        for (const path of this.paths) {
            const fromNode = this.nodes[path.from];
            const toNode = this.nodes[path.to];

            // Determine if path is unlocked (both nodes accessible)
            const pathUnlocked = fromNode.unlocked && toNode.unlocked;

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);

            ctx.strokeStyle = COLORS.warmSlate;
            ctx.lineWidth = 3;

            if (pathUnlocked) {
                // Solid line for unlocked paths
                ctx.setLineDash([]);
            } else {
                // Dashed line for locked paths
                ctx.setLineDash([8, 6]);
            }

            ctx.stroke();
            ctx.setLineDash([]);
        }
    },

    _renderNodes(ctx) {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const isSelected = i === this.selectedNode;
            const worldColor = this.WORLD_COLORS[node.world];

            if (isSelected) {
                // Pulsing glow for selected node — 1.5Hz oscillation
                const pulsePhase = Math.sin(this.animTimer * Math.PI * 3);
                const pulseSize = 6 + pulsePhase * 5;
                const pulseAlpha = 0.3 + 0.2 * pulsePhase;

                // Outer glow ring
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + pulseSize + 4, 0, Math.PI * 2);
                ctx.fillStyle = this._hexToRGBA(COLORS.mutedGold, pulseAlpha * 0.4);
                ctx.fill();

                // Inner glow
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + pulseSize, 0, Math.PI * 2);
                ctx.fillStyle = this._hexToRGBA(COLORS.mutedGold, pulseAlpha);
                ctx.fill();
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

            if (node.completed) {
                // Completed: filled with world color
                ctx.fillStyle = worldColor.primary;
                ctx.fill();
                ctx.strokeStyle = worldColor.highlight;
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (node.unlocked) {
                // Unlocked but not completed
                ctx.fillStyle = worldColor.primary;
                ctx.fill();
                if (isSelected) {
                    ctx.strokeStyle = COLORS.mutedGold;
                    ctx.lineWidth = 2.5;
                } else {
                    ctx.strokeStyle = worldColor.secondary;
                    ctx.lineWidth = 1.5;
                }
                ctx.stroke();
            } else {
                // Locked: Steel Blue at reduced opacity
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = COLORS.steelBlue;
                ctx.fill();
                ctx.strokeStyle = COLORS.steelBlue;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            // Completed checkmark (Moss Green)
            if (node.completed) {
                this._drawCheckmark(ctx, node.x, node.y, 7);
            }

            // Stage number label
            ctx.save();
            const labelColor = node.unlocked ? COLORS.softCream : COLORS.steelBlue;
            const labelAlpha = node.unlocked ? 1.0 : 0.5;
            ctx.globalAlpha = labelAlpha;
            this._drawTextWithOutline(ctx, node.stageId,
                node.x, node.y + node.radius + 14,
                '12px sans-serif',
                labelColor, COLORS.deepCharcoal, 'center');
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
    },

    _drawCheckmark(ctx, cx, cy, size) {
        ctx.save();
        ctx.strokeStyle = COLORS.mossGreen;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.5, cy);
        ctx.lineTo(cx - size * 0.1, cy + size * 0.4);
        ctx.lineTo(cx + size * 0.5, cy - size * 0.4);
        ctx.stroke();
        ctx.restore();
    },

    _renderInfoPanel(ctx) {
        const node = this.nodes[this.selectedNode];
        const stage = this.STAGES[node.stageIndex];
        const saveData = SaveSystem.load();

        // Panel position: bottom-right, 32px inset
        const panelW = 260;
        const panelH = 160;
        const panelX = CANVAS_WIDTH - 32 - panelW;
        const panelY = CANVAS_HEIGHT - 32 - panelH;

        // Background with opacity
        ctx.fillStyle = 'rgba(26, 26, 46, 0.6)';
        ctx.beginPath();
        this._roundRectPath(ctx, panelX, panelY, panelW, panelH, 6);
        ctx.fill();

        // Muted Gold border (2px)
        ctx.strokeStyle = COLORS.mutedGold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        this._roundRectPath(ctx, panelX, panelY, panelW, panelH, 6);
        ctx.stroke();

        if (!node.unlocked) {
            // LOCKED panel
            this._drawTextWithOutline(ctx, stage.name,
                panelX + panelW / 2, panelY + 30,
                'bold 18px sans-serif',
                COLORS.softCream, COLORS.deepCharcoal, 'center');

            this._drawTextWithOutline(ctx, 'LOCKED',
                panelX + panelW / 2, panelY + 70,
                'bold 22px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'center');

            // Find previous stage name
            const prevIdx = node.stageIndex - 1;
            if (prevIdx >= 0) {
                const prevName = this.STAGES[prevIdx].name;
                this._drawTextWithOutline(ctx, 'Complete ' + prevName,
                    panelX + panelW / 2, panelY + 100,
                    '14px sans-serif',
                    COLORS.steelBlue, COLORS.deepCharcoal, 'center');
                this._drawTextWithOutline(ctx, 'to unlock',
                    panelX + panelW / 2, panelY + 118,
                    '14px sans-serif',
                    COLORS.steelBlue, COLORS.deepCharcoal, 'center');
            }
        } else {
            // UNLOCKED panel — show stats
            // Stage name
            this._drawTextWithOutline(ctx, stage.name,
                panelX + panelW / 2, panelY + 28,
                'bold 18px sans-serif',
                COLORS.softCream, COLORS.deepCharcoal, 'center');

            // Separator line
            ctx.strokeStyle = COLORS.warmSlate;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(panelX + 16, panelY + 40);
            ctx.lineTo(panelX + panelW - 16, panelY + 40);
            ctx.stroke();

            // Best time
            const bestTime = saveData.bestTimes[stage.id];
            let timeStr = '---';
            if (bestTime !== undefined && bestTime !== null) {
                const mins = Math.floor(bestTime / 60);
                const secs = Math.floor(bestTime % 60);
                timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
            }
            this._drawTextWithOutline(ctx, 'Best Time',
                panelX + 20, panelY + 66,
                '14px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'left');
            this._drawTextWithOutline(ctx, timeStr,
                panelX + panelW - 20, panelY + 66,
                'bold 16px "Courier New", monospace',
                COLORS.softCream, COLORS.deepCharcoal, 'right');

            // Coins
            const coinRecord = saveData.coinRecords[stage.id];
            let coinStr = '???';
            if (coinRecord !== undefined && coinRecord !== null) {
                coinStr = coinRecord + ' / ' + stage.totalCoins;
            }
            this._drawTextWithOutline(ctx, 'Coins',
                panelX + 20, panelY + 92,
                '14px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'left');
            this._drawTextWithOutline(ctx, coinStr,
                panelX + panelW - 20, panelY + 92,
                'bold 16px "Courier New", monospace',
                COLORS.mutedGold, COLORS.deepCharcoal, 'right');

            // Difficulty stars
            this._drawTextWithOutline(ctx, 'Difficulty',
                panelX + 20, panelY + 118,
                '14px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'left');
            this._renderDifficultyStars(ctx, panelX + panelW - 20, panelY + 110, stage.difficulty);

            // World name
            const worldName = this.WORLD_COLORS[stage.world].name;
            ctx.globalAlpha = 0.6;
            this._drawTextWithOutline(ctx, worldName,
                panelX + panelW / 2, panelY + panelH - 12,
                '12px sans-serif',
                this.WORLD_COLORS[stage.world].highlight, COLORS.deepCharcoal, 'center');
            ctx.globalAlpha = 1.0;
        }
    },

    _renderDifficultyStars(ctx, rightX, y, difficulty) {
        const starSize = 7;
        const gap = 4;
        const totalWidth = 3 * starSize * 2 + 2 * gap;
        let sx = rightX - totalWidth;

        for (let i = 0; i < 3; i++) {
            const filled = i < difficulty;
            this._drawStar(ctx, sx + starSize, y + starSize, starSize, filled);
            sx += starSize * 2 + gap;
        }
    },

    _drawStar(ctx, cx, cy, size, filled) {
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const r = i === 0 ? size : size;
            const x = cx + Math.cos(angle) * size;
            const y = cy + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            // Inner point
            const innerAngle = angle + Math.PI * 2 / 10;
            const ix = cx + Math.cos(innerAngle) * size * 0.4;
            const iy = cy + Math.sin(innerAngle) * size * 0.4;
            ctx.lineTo(ix, iy);
        }
        ctx.closePath();

        if (filled) {
            ctx.fillStyle = COLORS.mutedGold;
            ctx.fill();
        }
        ctx.strokeStyle = filled ? COLORS.mutedGold : COLORS.steelBlue;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    },

    _renderFirstVisitGuide(ctx) {
        const node = this.nodes[0];

        // Animated arrow pointing to first node
        const arrowOffset = Math.sin(this.animTimer * 4) * 8;

        // Arrow above the node
        ctx.save();
        ctx.fillStyle = COLORS.mutedGold;
        ctx.globalAlpha = 0.8 + 0.2 * Math.sin(this.animTimer * 3);

        const ax = node.x;
        const ay = node.y - node.radius - 28 + arrowOffset;

        // Triangle arrow pointing down
        ctx.beginPath();
        ctx.moveTo(ax - 10, ay - 16);
        ctx.lineTo(ax + 10, ay - 16);
        ctx.lineTo(ax, ay);
        ctx.closePath();
        ctx.fill();

        // Arrow shaft
        ctx.fillRect(ax - 3, ay - 28, 6, 14);

        // Guidance text — larger and more visible
        this._drawTextWithOutline(ctx, 'Begin your journey',
            ax, ay - 38,
            'bold 16px sans-serif',
            COLORS.mutedGold, COLORS.deepCharcoal, 'center');
        ctx.restore();
    },

    _renderWorldLabels(ctx) {
        // World name labels positioned above each cluster
        const labels = [
            { name: 'Whispering Forest', x: 190, y: 165, color: this.WORLD_COLORS[0].highlight },
            { name: 'Scorching Desert', x: 420, y: 200, color: this.WORLD_COLORS[1].highlight },
            { name: 'Frozen Tundra', x: 650, y: 165, color: this.WORLD_COLORS[2].highlight },
            { name: 'Molten Volcano', x: 820, y: 210, color: this.WORLD_COLORS[3].highlight }
        ];

        for (const label of labels) {
            ctx.globalAlpha = 0.5;
            this._drawTextWithOutline(ctx, label.name,
                label.x, label.y,
                '12px sans-serif',
                label.color, COLORS.deepCharcoal, 'center');
        }
        ctx.globalAlpha = 1.0;
    },

    // =============================================
    // UTILITY
    // =============================================

    _hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    },

    _drawTextWithOutline(ctx, text, x, y, font, fillColor, strokeColor, align) {
        ctx.font = font;
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);
        ctx.textAlign = 'left';
    },

    _roundRectPath(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }
};
