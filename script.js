/* =========================
   CYBERFALL GAME
========================= */

const fruit = document.getElementById("fruit");
const scoreDisplay = document.getElementById("score");
const missesDisplay = document.getElementById("misses");
const livesDisplay = document.getElementById("lives");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");
const gameArea = document.getElementById("game-area");
const scopeView = document.getElementById("scope-view");
const crosshair = document.getElementById("crosshair");
const jumpscareAlien = document.getElementById("jumpscare-alien");
const windows = document.querySelectorAll(".building-windows span");

const progressFill = document.getElementById("progress-fill");
const progressPercent = document.getElementById("progress-percent");
const progressPanel = document.getElementById("progress-panel");
const finishingBoost = document.getElementById("finishing-boost");
const rainLayer = document.getElementById("rain-layer");

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const hitSound = new AudioContextClass();
const scareSound = new AudioContextClass();

const targetScore = 150;
const sensorRadius = 30;
const autoShootCooldown = 300;
const glowingWindows = [0, 3, 4, 6, 9, 10];

let score = 0;
let misses = 0;
let lives = 4;
let gameRunning = true;
let levelPassed = false;
let currentLevel = 1;

let lastAutoShot = 0;
let lastHitTime = 0;

let level2TimeLeft = 60;
let level2Timer = null;
let rainTimers = [];
let rainAudio = null;

let extraAlien = null;
let aliens = [fruit];

let targetMouseX = 400;
let targetMouseY = 250;
let crosshairX = 400;
let crosshairY = 250;

/* =========================
   AUDIO
========================= */

function resumeAudio() {
    if (hitSound.state === "suspended") {
        hitSound.resume();
    }

    if (scareSound.state === "suspended") {
        scareSound.resume();
    }
}



function playHitSound() {
    resumeAudio();

    const now = hitSound.currentTime;

    // Main laser: a bright descending energy zap.
    const laser = hitSound.createOscillator();
    const laserGain = hitSound.createGain();

    laser.type = "sawtooth";
    laser.frequency.setValueAtTime(1250, now);
    laser.frequency.exponentialRampToValueAtTime(150, now + 0.24);

    laserGain.gain.setValueAtTime(0.16, now);
    laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    laser.connect(laserGain);
    laserGain.connect(hitSound.destination);

    laser.start(now);
    laser.stop(now + 0.24);

    // Low energy pulse underneath the laser.
    const pulse = hitSound.createOscillator();
    const pulseGain = hitSound.createGain();

    pulse.type = "sine";
    pulse.frequency.setValueAtTime(500, now);
    pulse.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    pulseGain.gain.setValueAtTime(0.18, now);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    pulse.connect(pulseGain);
    pulseGain.connect(hitSound.destination);

    pulse.start(now);
    pulse.stop(now + 0.18);
}



function playScareSound() {
    resumeAudio();

    const now = scareSound.currentTime;

    const rumble = scareSound.createOscillator();
    const rumbleGain = scareSound.createGain();

    rumble.type = "sine";
    rumble.frequency.setValueAtTime(45, now);
    rumble.frequency.exponentialRampToValueAtTime(25, now + 1);

    rumbleGain.gain.setValueAtTime(0.5, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 1);

    rumble.connect(rumbleGain);
    rumbleGain.connect(scareSound.destination);

    rumble.start(now);
    rumble.stop(now + 1);

    const scream = scareSound.createOscillator();
    const screamGain = scareSound.createGain();

    scream.type = "sawtooth";
    scream.frequency.setValueAtTime(150, now);
    scream.frequency.exponentialRampToValueAtTime(1500, now + 0.65);

    screamGain.gain.setValueAtTime(0.01, now);
    screamGain.gain.linearRampToValueAtTime(0.35, now + 0.35);
    screamGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    scream.connect(screamGain);
    screamGain.connect(scareSound.destination);

    scream.start(now);
    scream.stop(now + 1);
}

/* =========================
   HUD AND PROGRESS
========================= */

function updateHUD() {
    // The score display no longer says "out of 100".
    scoreDisplay.textContent = `Score: ${score}`;

    if (currentLevel === 2) {
        missesDisplay.textContent =
            `Time: ${level2TimeLeft}s | Misses: ${misses}`;
    } else {
        missesDisplay.textContent = `Misses: ${misses}`;
    }

    livesDisplay.textContent = "Lives: " + "❤️".repeat(lives);

    const levelTarget = currentLevel === 1 ? 100 : 150;
    const percentage = Math.min(100, (score / levelTarget) * 100);

    progressFill.style.width = percentage + "%";
    progressPercent.textContent = Math.round(percentage) + "%";

    if (score >= 80 && score < targetScore) {
        progressPanel.classList.add("final-boost");
        finishingBoost.classList.add("active");

        finishingBoost.textContent =
            score >= 90
                ? "⚡ CRITICAL — ALMOST THERE!"
                : "⚡ FINAL STRETCH";
    }

    if (score >= targetScore) {
        progressPanel.classList.add("complete");
        finishingBoost.textContent = "✓ MISSION COMPLETE";
        finishingBoost.classList.remove("active");
    }
}

function resetProgress() {
    progressFill.style.width = "0%";
    progressPercent.textContent = "0%";

    progressPanel.classList.remove("final-boost", "complete");

    finishingBoost.classList.remove("active");
    finishingBoost.textContent = "⚡ FINAL STRETCH";
}

/* =========================
   ALIEN MANAGEMENT
========================= */


function resetAlien(alien) {
    alien.textContent = "👽";

    // Keep the alien in a safe vertical lane inside the circular scope.
    alien.style.left = (150 + Math.floor(Math.random() * 120)) + "px";
    alien.style.top = "25px";
    alien.style.display = "block";

    alien.classList.remove("fruit-hit");
}


function resetFruit() {
    resetAlien(fruit);
}

/* =========================
   VISUAL EFFECTS
========================= */

function createBloodEffect(x, y) {
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement("div");

        particle.className = "blood-particle";
        particle.style.left = x + "px";
        particle.style.top = y + "px";

        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50;

        particle.style.setProperty(
            "--move-x",
            Math.cos(angle) * distance + "px"
        );

        particle.style.setProperty(
            "--move-y",
            Math.sin(angle) * distance + "px"
        );

        gameArea.appendChild(particle);

        setTimeout(() => particle.remove(), 400);
    }
}

function showPoints(x, y) {
    const points = document.createElement("div");

    points.className = "points-popup";
    points.textContent = "+1";
    points.style.left = x + "px";
    points.style.top = y + "px";

    gameArea.appendChild(points);

    setTimeout(() => points.remove(), 500);
}

/* =========================
   SCORING
========================= */

function scoreHit(alien) {
    if (!gameRunning || alien.style.display === "none") {
        return;
    }

    const now = performance.now();

    if (now - lastHitTime < 120) {
        return;
    }

    lastHitTime = now;

    const gameRect = gameArea.getBoundingClientRect();
    const rect = alien.getBoundingClientRect();

    const x = rect.left - gameRect.left + rect.width / 2;
    const y = rect.top - gameRect.top + rect.height / 2;

    alien.classList.add("fruit-hit");

    createBloodEffect(x, y);
    showPoints(x, y);
    playHitSound();

    const levelTarget = currentLevel === 1 ? 100 : 150;
    score = Math.min(levelTarget, score + 1);

    updateHUD();

    if (currentLevel === 1 && score >= 100) {
        showLevelPassed();
        return;
    }
    if (currentLevel === 2 && score >= 150) {
        finishLevel2();
        return;
    }

    setTimeout(() => {
        if (gameRunning) {
            resetAlien(alien);
        }
    }, 180);
}

/* =========================
   LEVEL 1 COMPLETION
========================= */

function showLevelPassed() {
    if (levelPassed) return;

    levelPassed = true;
    gameRunning = false;

    aliens.forEach(alien => {
        alien.style.display = "none";
    });

    const panel = document.createElement("div");
    panel.id = "level-passed";

    panel.innerHTML = `
        <h2>🎉 LEVEL 1 PASSED! 🎉</h2>
        <p>Mission complete.</p>
        <button id="replay-level1">Replay Level 1</button>
        <button id="next-level">Next Level ➜</button>
    `;

    gameArea.appendChild(panel);

    document
        .getElementById("replay-level1")
        .addEventListener("click", restartLevel1);

    document
        .getElementById("next-level")
        .addEventListener("click", showLevel2Briefing);
}

/* =========================
   LEVEL 2 BRIEFING
========================= */

function showLevel2Briefing() {
    const panel = document.getElementById("level-passed");

    if (!panel) return;

    panel.innerHTML = `
        <h2>⚔️ LEVEL 2</h2>
        <p>Reach 100 points while keeping 3 hearts to unlock a special weapon.</p>
        <p><em>Ready to continue?</em></p>
        <button id="back-to-level1-menu">Back</button>
        <button id="start-level2">Start Level 2 ➜</button>
    `;

    document
        .getElementById("back-to-level1-menu")
        .addEventListener("click", () => {
            panel.remove();
            levelPassed = false;
            showLevelPassed();
        });

    document
        .getElementById("start-level2")
        .addEventListener("click", startLevel2);
}

/* =========================
   START LEVEL 2
========================= */

function startLevel2() {
    const panel = document.getElementById("level-passed");

    if (panel) panel.remove();

    clearLevel2Timers();

    currentLevel = 2;
    score = 0;
    misses = 0;
    lives = 3;
    level2TimeLeft = 60;

    gameRunning = true;
    levelPassed = false;
    lastHitTime = 0;

    resetProgress();
    updateHUD();

    gameOverScreen.style.display = "none";
    jumpscareAlien.style.display = "none";
    crosshair.style.display = "block";

    windows.forEach(windowElement => {
        windowElement.classList.remove("window-destroyed");
    });

    fruit.style.fontSize = "20px";
    resetAlien(fruit);

    aliens = [fruit];

    if (extraAlien) {
        extraAlien.remove();
    }

    extraAlien = document.createElement("div");
    extraAlien.id = "level2-alien";
    extraAlien.textContent = "👽";

    Object.assign(extraAlien.style, {
        position: "absolute",
        top: "0px",
        left: "280px",
        zIndex: "11",
        fontSize: "20px",
        lineHeight: "1",
        pointerEvents: "none",
        filter: "drop-shadow(0 0 4px rgba(0,255,120,.6))"
    });

    scopeView.appendChild(extraAlien);

    resetAlien(extraAlien);

    aliens.push(extraAlien);

    startLevel2Timer();
    scheduleRain();
}

/* =========================
   LEVEL 2 TIMER
========================= */

function startLevel2Timer() {
    clearInterval(level2Timer);

    level2Timer = setInterval(() => {
        if (!gameRunning || currentLevel !== 2) return;

        level2TimeLeft--;

        updateHUD();

        if (level2TimeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

/* =========================
   LEVEL 2 COMPLETION
========================= */

function finishLevel2() {
    if (levelPassed) return;

    levelPassed = true;
    gameRunning = false;

    clearLevel2Timers();

    aliens.forEach(alien => {
        alien.style.display = "none";
    });

    const weaponUnlocked = score >= 150 && lives >= 3;

    const panel = document.createElement("div");
    panel.id = "level-passed";

    if (weaponUnlocked) {
        panel.innerHTML = `
            <h2>⚔️ LEVEL 2 CLEARED!</h2>
            <p>🏆 SPECIAL WEAPON UNLOCKED!</p>
            <p>You scored 100 and kept at least 3 hearts.</p>
            <button id="retry-level2">Play Again</button>
            <button id="return-level1">Level 1</button>
        `;
    } else {
        panel.innerHTML = `
            <h2>LEVEL 2 CLEARED</h2>
            <p>The special weapon requires 150 points and at least 3 hearts at the finish.</p>
            <button id="retry-level2">Try Again</button>
            <button id="return-level1">Level 1</button>

        `;
    }

    gameArea.appendChild(panel);

    document
        .getElementById("retry-level2")
        .addEventListener("click", startLevel2);

    document
        .getElementById("return-level1")
        .addEventListener("click", restartLevel1);
}

/* =========================
   GAME OVER
========================= */

function endGame() {
    if (!gameRunning) return;

    gameRunning = false;

    clearLevel2Timers();

    aliens.forEach(alien => {
        alien.style.display = "none";
    });

    crosshair.style.display = "none";
    jumpscareAlien.style.display = "block";

    jumpscareAlien.style.animation = "none";
    void jumpscareAlien.offsetWidth;

    jumpscareAlien.style.animation =
        "alienJumpscare 0.8s ease-in forwards";

    playScareSound();

    setTimeout(() => {
        if (!gameRunning) {
            gameOverScreen.style.display = "flex";
        }
    }, 800);
}

function loseLife() {
    misses++;
    lives = Math.max(0, lives - 1);

    updateHUD();

    if (lives <= 0) {
        endGame();
    }
}

/* =========================
   LEVEL 2 RAIN
========================= */

function clearLevel2Timers() {
    clearInterval(level2Timer);
    level2Timer = null;

    rainTimers.forEach(timer => clearTimeout(timer));
    rainTimers = [];

    rainLayer.classList.remove("active");
    rainLayer.innerHTML = "";

    stopRainSound();
}

function playRainSound() {
    resumeAudio();
    stopRainSound();

    const length = hitSound.sampleRate * 2;
    const buffer = hitSound.createBuffer(
        1,
        length,
        hitSound.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const source = hitSound.createBufferSource();
    const filter = hitSound.createBiquadFilter();
    const gain = hitSound.createGain();

    filter.type = "lowpass";
    filter.frequency.value = 900;
    gain.gain.value = 0.12;

    source.buffer = buffer;
    source.loop = true;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(hitSound.destination);

    source.start();

    rainAudio = source;
}

function stopRainSound() {
    if (rainAudio) {
        try {
            rainAudio.stop();
        } catch (_) {
            // The sound may already have stopped.
        }

        rainAudio = null;
    }
}

function startRain(durationSeconds) {
    if (!gameRunning || currentLevel !== 2) return;

    rainLayer.innerHTML = "";
    rainLayer.classList.add("active");

    for (let i = 0; i < 100; i++) {
        const drop = document.createElement("span");

        drop.className = "rain-drop";
        drop.style.left = Math.random() * 100 + "%";

        drop.style.setProperty(
            "--rain-duration",
            (0.45 + Math.random() * 0.55) + "s"
        );

        drop.style.animationDelay = Math.random() * 1.5 + "s";

        rainLayer.appendChild(drop);
    }

    playRainSound();

    rainTimers.push(setTimeout(() => {
        rainLayer.classList.remove("active");
        rainLayer.innerHTML = "";
        stopRainSound();
    }, durationSeconds * 1000));
}

function scheduleRain() {
    // One or two rain bursts per round.
    const bursts = Math.random() < 0.5 ? 1 : 2;

    for (let i = 0; i < bursts; i++) {
        const delay = i === 0
            ? 7000 + Math.random() * 12000
            : 20000 + Math.random() * 25000;

        const duration = 5 + Math.floor(Math.random() * 11);

        rainTimers.push(setTimeout(() => {
            startRain(duration);
        }, delay));
    }
}

/* =========================
   RESTART LEVEL 1
========================= */

function restartLevel1() {
    clearLevel2Timers();

    const oldPanel = document.getElementById("level-passed");

    if (oldPanel) oldPanel.remove();

    if (extraAlien) {
        extraAlien.remove();
        extraAlien = null;
    }

    aliens = [fruit];

    currentLevel = 1;
    score = 0;
    misses = 0;
    lives = 4;

    gameRunning = true;
    levelPassed = false;
    lastHitTime = 0;

    fruit.style.fontSize = "16px";
    fruit.style.display = "block";

    crosshair.style.display = "block";
    jumpscareAlien.style.display = "none";
    jumpscareAlien.style.animation = "none";

    gameOverScreen.style.display = "none";

    windows.forEach(windowElement => {
        windowElement.classList.remove("window-destroyed");
    });

    resetProgress();
    updateHUD();
    resetFruit();
}

/* =========================
   SMOOTH RETICLE
========================= */

gameArea.addEventListener("mousemove", event => {
    const rect = gameArea.getBoundingClientRect();

    targetMouseX = event.clientX - rect.left;
    targetMouseY = event.clientY - rect.top;
});

function smoothCrosshair() {
    const centerX = gameArea.clientWidth / 2;
    const centerY = gameArea.clientHeight / 2;
    const maxDistance = 175;

    const dx = targetMouseX - centerX;
    const dy = targetMouseY - centerY;
    const distance = Math.hypot(dx, dy);

    let x = targetMouseX;
    let y = targetMouseY;

    if (distance > maxDistance && distance > 0) {
        x = centerX + (dx / distance) * maxDistance;
        y = centerY + (dy / distance) * maxDistance;
    }

    crosshairX += (x - crosshairX) * 0.45;
    crosshairY += (y - crosshairY) * 0.45;

    crosshair.style.left = crosshairX + "px";
    crosshair.style.top = crosshairY + "px";

    requestAnimationFrame(smoothCrosshair);
}

/* =========================
   AUTOMATIC SNIPER
========================= */

function checkAutoHits() {
    if (gameRunning) {
        const now = performance.now();

        if (now - lastAutoShot >= autoShootCooldown) {
            for (const alien of aliens) {
                if (!alien || alien.style.display === "none") continue;

                const rect = alien.getBoundingClientRect();
                const area = gameArea.getBoundingClientRect();

                const alienX =
                    rect.left - area.left + rect.width / 2;

                const alienY =
                    rect.top - area.top + rect.height / 2;

                const distance = Math.hypot(
                    crosshairX - alienX,
                    crosshairY - alienY
                );

                if (distance <= 35 + rect.width / 2) {
                    lastAutoShot = now;
                    scoreHit(alien);
                    break;
                }
            }
        }
    }

    requestAnimationFrame(checkAutoHits);
}

/* =========================
   ALIEN MOVEMENT
========================= */

setInterval(() => {
    if (!gameRunning) return;

    for (const alien of aliens) {
        if (!alien || alien.style.display === "none") continue;

        const speed = currentLevel === 2
            ? 7 + Math.floor(score / 25)
            : Math.min(11, 5 + Math.floor(score / 15));

        alien.style.top =
            ((parseFloat(alien.style.top) || 0) + speed) + "px";

        if ((parseFloat(alien.style.top) || 0) >= scopeView.clientHeight - 30) {
            loseLife();

            if (gameRunning) {
                resetAlien(alien);
            }
        }
    }
}, 50);

/* =========================
   MANUAL SHOOTING
========================= */

gameArea.addEventListener("click", event => {
    if (!gameRunning) return;

    if (event.target.closest("#level-passed")) return;
    if (event.target.closest("#game-over")) return;

    for (const alien of aliens) {
        if (!alien || alien.style.display === "none") continue;

        const rect = alien.getBoundingClientRect();

        const distance = Math.hypot(
            event.clientX - (rect.left + rect.width / 2),
            event.clientY - (rect.top + rect.height / 2)
        );

        if (distance <= sensorRadius) {
            scoreHit(alien);
            return;
        }
    }

    if (currentLevel === 1) {
        windows.forEach((windowElement, index) => {
            if (!glowingWindows.includes(index)) return;

            if (windowElement.classList.contains("window-destroyed")) {
                return;
            }

            const rect = windowElement.getBoundingClientRect();

            const clicked =
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom;

            if (!clicked || !gameRunning) return;

            windowElement.classList.add("window-destroyed");

            const area = gameArea.getBoundingClientRect();

            const x = rect.left - area.left + rect.width / 2;
            const y = rect.top - area.top + rect.height / 2;

            createBloodEffect(x, y);
            showPoints(x, y);
            playHitSound();

            score = Math.min(targetScore, score + 1);
            updateHUD();

            if (score >= targetScore) {
                showLevelPassed();
            }
        });
    }
});

/* =========================
   RESTART BUTTON
========================= */

restartButton.addEventListener("click", restartLevel1);

/* =========================
   INITIALIZE
========================= */

resetFruit();
updateHUD();
smoothCrosshair();
checkAutoHits();