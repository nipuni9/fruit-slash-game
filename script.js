/* =========================================
   CYBERFALL - COMPLETE GAME SCRIPT
========================================= */

const fruit = document.getElementById("fruit");
const scoreDisplay = document.getElementById("score");
const missesDisplay = document.getElementById("misses");
const livesDisplay = document.getElementById("lives");
const gameOverScreen = document.getElementById("game-over");
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
const levelIndicator = document.getElementById("level-indicator");
const weaponIndicator = document.getElementById("weapon-indicator");

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audio = AudioContextClass ? new AudioContextClass() : null;

let score = 0;
let misses = 0;
let lives = 4;
let currentLevel = 1;
let gameRunning = true;
let levelPassed = false;

let aliens = [fruit];
let extraAlien = null;

let mouseX = 400;
let mouseY = 250;

let lastHitTime = 0;
let levelTimer = null;
let levelTimeLeft = 60;
let alienInterval = null;

let rainTimers = [];
let shadowTimers = [];
let shadowElements = [];
let shadowSpawnCount = 0;

let doubleBladeUnlocked = false;
let doubleBladeUses = 0; // Updated to allow 3 uses

/* =========================================
   SOUND EFFECTS
========================================= */
function playTone(startFrequency, endFrequency, duration, type = "sawtooth") {
    if (!audio) return;
    if (audio.state === "suspended") audio.resume();
    
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), audio.currentTime + duration);
    
    gain.gain.setValueAtTime(0.15, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    
    oscillator.connect(gain);
    gain.connect(audio.destination);
    
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
}

function playHitSound() { playTone(1200, 120, 0.22); }
function playScareSound() { 
    playTone(70, 35, 0.9, "sine");
    setTimeout(() => playTone(180, 1300, 0.7), 100);
}
function playWaveSound() { playTone(400, 50, 0.5, "square"); }

/* =========================================
   HUD & LOGIC
========================================= */
function getTargetScore() {
    if (currentLevel === 1) return 100;
    if (currentLevel === 2) return 101;
    return 111; // Level 3 kill requirement
}

function updateHUD() {
    scoreDisplay.textContent = `Score: ${score}`;
    
    if (currentLevel === 3) {
        missesDisplay.textContent = `Kills needed: ${getTargetScore() - score}`;
        livesDisplay.textContent = "Lives: ∞"; // Infinite lives in L3
    } else {
        missesDisplay.textContent = currentLevel === 1 ? `Misses: ${misses}` : `Time: ${levelTimeLeft}s | Misses: ${misses}`;
        livesDisplay.textContent = "Lives: " + "❤️".repeat(Math.max(0, lives));
    }
    
    const target = getTargetScore();
    const percentage = Math.min(100, (score / target) * 100);
    
    progressFill.style.width = percentage + "%";
    progressPercent.textContent = Math.round(percentage) + "%";
    
    if (levelIndicator) {
        const names = ["", "LEVEL 1 // NIGHT WATCH", "LEVEL 2 // STORM PROTOCOL", "LEVEL 3 // SHADOW PROTOCOL"];
        levelIndicator.textContent = names[currentLevel];
    }
    
    if (weaponIndicator) {
        if (!doubleBladeUnlocked) {
            weaponIndicator.textContent = "DOUBLE BLADE: LOCKED";
            weaponIndicator.classList.remove("weapon-ready");
        } else if (doubleBladeUses <= 0) {
            weaponIndicator.textContent = "DOUBLE BLADE: EMPTY";
            weaponIndicator.classList.remove("weapon-ready");
        } else {
            weaponIndicator.textContent = `SPACE: DOUBLE BLADE (${doubleBladeUses})`;
            weaponIndicator.classList.add("weapon-ready");
        }
    }
    
    if (score >= target * 0.8 && score < target) {
        progressPanel.classList.add("final-boost");
        finishingBoost.classList.add("active");
        finishingBoost.textContent = (score >= 90 && currentLevel === 1) ? "⚡ CRITICAL — ALMOST THERE!" : "⚡ FINAL STRETCH";
    } else {
        finishingBoost.classList.remove("active");
        progressPanel.classList.remove("final-boost");
    }
    
    if (score >= target) {
        progressPanel.classList.add("complete");
        finishingBoost.textContent = "✓ MISSION COMPLETE";
    }
}

function resetProgress() {
    progressFill.style.width = "0%";
    progressPercent.textContent = "0%";
    progressPanel.classList.remove("final-boost", "complete");
    finishingBoost.classList.remove("active");
    finishingBoost.textContent = "⚡ FINAL STRETCH";
}

function loseLife(amount = 1) {
    if (!gameRunning || currentLevel === 3) return; // No lives lost in Level 3
    lives -= amount;
    misses++;
    updateHUD();
    if (lives <= 0) endGame("normal");
}

/* =========================================
   ALIEN MOVEMENT
========================================= */
function resetAlien(alien) {
    alien.textContent = "👽";
    alien.style.left = (80 + Math.random() * 250) + "px";
    alien.style.top = "15px";
    alien.style.display = "block";
    alien.classList.remove("fruit-hit");
}

function createExtraAlien(id, leftPosition) {
    const alien = document.createElement("div");
    alien.id = id;
    alien.textContent = "👽";
    Object.assign(alien.style, {
        position: "absolute", top: "15px", left: leftPosition + "px",
        zIndex: "11", fontSize: "20px", lineHeight: "1",
        pointerEvents: "none", filter: "drop-shadow(0 0 5px rgba(0,255,255,.7))"
    });
    scopeView.appendChild(alien);
    resetAlien(alien);
    return alien;
}

function startAlienMovement() {
    clearInterval(alienInterval);
    alienInterval = setInterval(() => {
        if (!gameRunning) return;
        
        let speed = 5;
        if (currentLevel === 1) speed = Math.min(11, 5 + Math.floor(score / 15));
        else if (currentLevel === 2) speed = Math.min(15, 9 + Math.floor(score / 20));
        else speed = Math.min(18, 12 + Math.floor(score / 20)); // Even faster in L3
        
        aliens.forEach(alien => {
            if (!alien || alien.style.display === "none") return;
            const top = parseFloat(alien.style.top) || 0;
            alien.style.top = (top + speed) + "px";
            
            if (top >= scopeView.clientHeight - 30) {
                if (currentLevel !== 3) {
                    loseLife(1); // Only lose hearts in L1 and L2
                }
                if (gameRunning) resetAlien(alien);
            }
        });
        
        // Auto-shoot check for stationary mouse while aliens fall
        checkAutoShoot();
        
    }, 50);
}

/* =========================================
   VISUAL EFFECTS
========================================= */
function createBloodEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement("div");
        particle.className = "blood-particle";
        particle.style.left = x + "px";
        particle.style.top = y + "px";
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 45;
        particle.style.setProperty("--move-x", Math.cos(angle) * distance + "px");
        particle.style.setProperty("--move-y", Math.sin(angle) * distance + "px");
        gameArea.appendChild(particle);
        setTimeout(() => particle.remove(), 500);
    }
}

function showPoints(x, y, amount = 1) {
    const popup = document.createElement("div");
    popup.className = "points-popup";
    popup.textContent = `+${amount}`;
    popup.style.left = x + "px";
    popup.style.top = y + "px";
    gameArea.appendChild(popup);
    setTimeout(() => popup.remove(), 600);
}

/* =========================================
   SHOOTING
========================================= */
function scoreHit(alien) {
    if (!gameRunning || !alien || alien.style.display === "none") return;
    
    const now = performance.now();
    if (now - lastHitTime < 100) return;
    lastHitTime = now;
    
    const areaRect = gameArea.getBoundingClientRect();
    const rect = alien.getBoundingClientRect();
    const x = rect.left - areaRect.left + rect.width / 2;
    const y = rect.top - areaRect.top + rect.height / 2;
    
    createBloodEffect(x, y);
    showPoints(x, y);
    playHitSound();
    
    alien.style.display = "none";
    score = Math.min(getTargetScore(), score + 1);
    updateHUD();
    
    if (score >= getTargetScore()) {
        if (currentLevel === 1) showLevel1Complete();
        else if (currentLevel === 2) finishLevel2();
        else finishLevel3();
        return;
    }
    
    setTimeout(() => { if (gameRunning) resetAlien(alien); }, 180);
}

/* =========================================
   RAIN & WATER EFFECTS
========================================= */
function clearAllTimers() {
    clearInterval(levelTimer);
    clearInterval(alienInterval);
    rainTimers.forEach(t => clearTimeout(t));
    shadowTimers.forEach(t => clearTimeout(t));
    rainTimers = [];
    shadowTimers = [];
    shadowElements.forEach(s => s.remove());
    shadowElements = [];
    if (rainLayer) {
        rainLayer.classList.remove("active");
        rainLayer.innerHTML = "";
    }
    scopeView.querySelectorAll(".scope-water-drop").forEach(drop => drop.remove());
}

function addWaterDrops() {
    scopeView.querySelectorAll(".scope-water-drop").forEach(drop => drop.remove());
    for (let i = 0; i < 18; i++) {
        const drop = document.createElement("span");
        drop.className = "scope-water-drop";
        drop.style.setProperty("--drop-x", Math.random() * 90 + 5 + "%");
        drop.style.setProperty("--drop-y", Math.random() * 85 + 5 + "%");
        drop.style.setProperty("--drop-size", 4 + Math.random() * 9 + "px");
        drop.style.setProperty("--slide-time", 3 + Math.random() * 4 + "s");
        drop.style.setProperty("--slide-distance", 3 + Math.random() * 10 + "px");
        scopeView.appendChild(drop);
    }
}

function scheduleRain() {
    const triggerRain = () => {
        if (!gameRunning || currentLevel !== 2) return;
        rainLayer.classList.add("active");
        
        for (let i = 0; i < 30; i++) {
            const drop = document.createElement("div");
            drop.className = "rain-drop";
            drop.style.left = Math.random() * 100 + "%";
            drop.style.setProperty("--rain-duration", (0.3 + Math.random() * 0.2) + "s");
            rainLayer.appendChild(drop);
        }
        
        addWaterDrops();
        rainTimers.push(setTimeout(() => {
            rainLayer.classList.remove("active");
            rainLayer.innerHTML = "";
            scopeView.querySelectorAll(".scope-water-drop").forEach(d => d.remove());
            rainTimers.push(setTimeout(triggerRain, 5000));
        }, 12000));
    };
    rainTimers.push(setTimeout(triggerRain, 2000));
}

/* =========================================
   LEVEL PROGRESSION (SOLO LEVELING AR HUD)
========================================= */
function removeMissionPanel() {
    const panel = document.getElementById("level-passed");
    if (panel) panel.remove();
}

function resetGameVisuals() {
    gameOverScreen.style.display = "none";
    jumpscareAlien.style.display = "none";
    jumpscareAlien.style.animation = "none";
    jumpscareAlien.textContent = "👽"; // Reset scary face
}

// Creates the clickable system notification
function showSystemWindow(htmlContent, buttonSetupCallback) {
    let panel = document.getElementById("level-passed");
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "level-passed";
        gameArea.appendChild(panel);
    }
    
    panel.className = "system-notification";
    panel.innerHTML = `
        <div class="notif-icon">✉</div>
        <div class="notif-text">SYSTEM ALERT (CLICK TO OPEN)</div>
    `;
    playTone(600, 800, 0.1, "sine");
    
    panel.onclick = () => {
        panel.onclick = null;
        panel.className = "system-expanded";
        panel.innerHTML = htmlContent;
        playTone(200, 300, 0.2, "square");
        if (buttonSetupCallback) buttonSetupCallback();
    };
}

function restartLevel1() {
    removeMissionPanel();
    clearAllTimers();
    if(extraAlien) { extraAlien.remove(); extraAlien = null; }
    if(window.l3Alien) { window.l3Alien.remove(); window.l3Alien = null; }
    
    currentLevel = 1;
    score = 0; misses = 0; lives = 4;
    gameRunning = true; levelPassed = false;
    doubleBladeUnlocked = false; doubleBladeUses = 0;
    
    aliens = [fruit];
    resetProgress();
    resetGameVisuals();
    resetAlien(fruit);
    updateHUD();
    startAlienMovement();
}

function showLevel1Complete() {
    if (levelPassed) return;
    levelPassed = true; gameRunning = false; clearAllTimers();
    
    const content = `
        <div class="mission-emblem">✦</div>
        <h2>LEVEL 1 CLEARED!</h2>
        <p class="mission-tag">MISSION COMPLETE</p>
        <p>Excellent work, sniper. You secured the first zone.</p>
        <button id="level1-replay">Replay Level 1</button>
        <button id="level2-brief" class="primary-mission">Continue to Level 2 Briefing ➜</button>
    `;
    
    showSystemWindow(content, () => {
        document.getElementById("level1-replay").addEventListener("click", restartLevel1);
        document.getElementById("level2-brief").addEventListener("click", showLevel2Briefing);
    });
}

function showLevel2Briefing() {
    const content = `
        <div class="mission-emblem">⚠</div>
        <h2>LEVEL 2: STORM PROTOCOL</h2>
        <p>Aliens move faster. Two aliens will appear. Rainstorms will temporarily affect visibility.</p>
        <p>The objective is to reach 101 points in 60 seconds. You have three hearts.</p>
        <button id="start-level2" class="primary-mission">Start Level 2 ➜</button>
    `;
    
    showSystemWindow(content, () => {
        document.getElementById("start-level2").addEventListener("click", startLevel2);
    });
}

function startLevel2() {
    removeMissionPanel(); clearAllTimers();
    currentLevel = 2; score = 0; misses = 0; lives = 3; levelTimeLeft = 60;
    gameRunning = true; levelPassed = false;
    
    resetProgress(); resetGameVisuals(); resetAlien(fruit);
    if(window.l3Alien) { window.l3Alien.remove(); window.l3Alien = null; }
    
    if(!extraAlien) extraAlien = createExtraAlien("level2-alien", 280);
    aliens = [fruit, extraAlien];
    
    updateHUD();
    startAlienMovement();
    
    levelTimer = setInterval(() => {
        if (!gameRunning) return;
        levelTimeLeft--;
        updateHUD();
        if (levelTimeLeft <= 0) endGame("normal");
    }, 1000);
    
    scheduleRain();
}

function finishLevel2() {
    if (levelPassed) return;
    levelPassed = true; gameRunning = false; clearAllTimers();
    aliens.forEach(a => { if (a) a.style.display = "none"; });
    
    doubleBladeUnlocked = true; doubleBladeUses = 3; // Give 3 charges for Level 3
    
    const content = `
        <div class="mission-emblem">⚔️</div>
        <h2>LEVEL 2 CLEARED!</h2>
        <p class="mission-tag">STORM PROTOCOL COMPLETE</p>
        <p>You held the line. The storm couldn't stop you.</p>
        <button id="level3-brief" class="primary-mission">Continue to Level 3 Briefing ➜</button>
    `;
    
    showSystemWindow(content, () => {
        document.getElementById("level3-brief").addEventListener("click", showLevel3Briefing);
    });
}

function showLevel3Briefing() {
    const content = `
        <div class="mission-emblem">💀</div>
        <h2>LEVEL 3: SHADOW PROTOCOL</h2>
        <p><strong>UNLOCKED:</strong> Press SPACE to unleash the Double Blade Wave Shot <strong>(3 Charges)</strong>!</p>
        <p>Hearts don't matter anymore. Just survive and kill <strong>111 aliens and monsters</strong>.</p>
        <p style="color:#ff1744; font-weight:bold; text-shadow:0 0 5px red;">⚠ AVOID THE BLACK BOXES (⬛). THEY ARE INSTANT-DEATH BOMBS.</p>
        <button id="start-level3" class="primary-mission">Deploy to Final Zone ➜</button>
    `;
    
    showSystemWindow(content, () => {
        document.getElementById("start-level3").addEventListener("click", startLevel3);
    });
}

function spawnBomb() {
    if (!gameRunning || currentLevel !== 3) return;
    const bomb = document.createElement("div");
    bomb.className = "black-box-bomb";
    bomb.textContent = "⬛";
    
    // Check for overlap to prevent unfair deaths
    let safeLeft = 40 + Math.random() * 320;
    for(let i=0; i<15; i++) { // Try up to 15 times to find a safe gap
        safeLeft = 40 + Math.random() * 320;
        let overlap = false;
        aliens.forEach(a => {
            if (a && a.style.display !== "none") {
                let aLeft = parseFloat(a.style.left) || 0;
                if (Math.abs(safeLeft - aLeft) < 65) overlap = true; // 65px safe buffer
            }
        });
        if (!overlap) break;
    }

    bomb.style.left = safeLeft + "px";
    bomb.style.top = "-20px";
    scopeView.appendChild(bomb);
    shadowElements.push(bomb); 
    
    // Fall logic for the bomb
    const dropSpeed = 7 + Math.random() * 4;
    const dropTimer = setInterval(() => {
        if(!gameRunning) { clearInterval(dropTimer); return; }
        const top = parseFloat(bomb.style.top) || -20;
        bomb.style.top = (top + dropSpeed) + "px";
        if(top > scopeView.clientHeight) {
            bomb.remove();
            clearInterval(dropTimer);
        }
    }, 50);
    shadowTimers.push(dropTimer);
}

function spawnShadowCreature() {
    if (!gameRunning || shadowSpawnCount >= 2) return;
    shadowSpawnCount++;
    
    const shadow = document.createElement("div");
    shadow.className = "shadow-creature";
    shadow.textContent = "🕷️";
    scopeView.appendChild(shadow);
    shadowElements.push(shadow);
    
    const animTimer = setTimeout(() => {
        if(document.body.contains(shadow)) {
            shadow.remove(); // No penalty in L3 if missed
        }
    }, 1350);
    
    shadow.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        clearTimeout(animTimer);
        const rect = shadow.getBoundingClientRect();
        const areaRect = gameArea.getBoundingClientRect();
        createBloodEffect(rect.left - areaRect.left + rect.width/2, rect.top - areaRect.top + rect.height/2);
        showPoints(rect.left - areaRect.left + rect.width/2, rect.top - areaRect.top + rect.height/2, 5);
        score = Math.min(getTargetScore(), score + 5);
        playScareSound();
        shadow.remove();
        updateHUD();
        if(score >= getTargetScore()) finishLevel3();
    });
}

function startLevel3() {
    removeMissionPanel(); clearAllTimers();
    currentLevel = 3; score = 0; misses = 0; lives = 999; shadowSpawnCount = 0;
    gameRunning = true; levelPassed = false;
    doubleBladeUses = 3; // Reset charges at start of L3
    
    resetProgress(); resetGameVisuals(); resetAlien(fruit);
    if(!extraAlien) extraAlien = createExtraAlien("level2-alien", 280);
    
    // Add a 3rd alien for pure chaos in Level 3
    if(!window.l3Alien) window.l3Alien = createExtraAlien("level3-alien", 150);
    aliens = [fruit, extraAlien, window.l3Alien];
    
    updateHUD();
    startAlienMovement();
    
    // Schedule exactly 3 to 5 bombs randomly across the level
    let bombCount = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    for(let i = 0; i < bombCount; i++) {
        let delay = 3000 + Math.random() * 45000; // Between 3s and 48s
        shadowTimers.push(setTimeout(spawnBomb, delay));
    }
    
    // Spawn shadows at ~12s and ~34s
    shadowTimers.push(setTimeout(spawnShadowCreature, 12000));
    shadowTimers.push(setTimeout(spawnShadowCreature, 34000));
}

function finishLevel3() {
    if (levelPassed) return;
    levelPassed = true; gameRunning = false; clearAllTimers();
    
    const content = `
        <div class="mission-emblem">🏆</div>
        <h2>CYBERFALL COMPLETE!</h2>
        <p class="mission-tag">ALL THREE MISSIONS CLEARED</p>
        <p>You defended the city and survived the shadows.</p>
        <p>Final Score: ${score}</p>
        <button id="level1-restart" class="primary-mission">Restart Game</button>
    `;
    
    showSystemWindow(content, () => {
        document.getElementById("level1-restart").addEventListener("click", restartLevel1);
    });
}

function endGame(reason = "normal") {
    gameRunning = false;
    clearAllTimers();
    
    let title = "GAME OVER";
    let msg = "SNIPER CONNECTION LOST";
    let scaryFace = "👽";

    if (currentLevel === 3) {
        title = "YOU WERE MURDERED";
        msg = reason === "bomb" ? "YOU HIT A BOMB. YOUR BODY WAS VAPORIZED." : "THE MONSTERS TORE YOU APART.";
        scaryFace = "🧟"; // Horrifying creature face
    }

    // Completely rebuild the game over screen inner HTML
    gameOverScreen.innerHTML = `
        <div class="danger-symbol">☣</div>
        <div class="system-warning">⚠ SYSTEM FAILURE ⚠</div>
        <h2>${title}</h2>
        <div class="game-over-line"></div>
        <p class="game-over-message">${msg}</p>
        <div class="game-over-buttons">
            <button id="restart-button" type="button">ANOTHER CHANCE</button>
            <button id="quit-button" type="button">QUIT</button>
        </div>
    `;

    gameOverScreen.style.display = "flex";
    jumpscareAlien.textContent = scaryFace;
    jumpscareAlien.style.display = "block";
    
    // Determine which animation to run
    if (currentLevel === 3) {
        jumpscareAlien.style.animation = "creatureRun 0.7s cubic-bezier(0.1, 0.7, 0.1, 1) forwards";
    } else {
        jumpscareAlien.style.animation = "alienJumpscare 0.5s ease-out forwards";
    }
    
    playScareSound();
    
    // Bind buttons
    document.getElementById("restart-button").addEventListener("click", () => {
        if (currentLevel === 3) startLevel3();
        else restartLevel1();
    });
    
    document.getElementById("quit-button").addEventListener("click", () => {
        location.reload(); // Reload tab to quit
    });
}

/* =========================================
   CONTROLS & LISTENERS
========================================= */

// Auto-Shoot Logic for Level 2 & 3
function checkAutoShoot() {
    if (!gameRunning || currentLevel < 2) return;
    
    const crosshairRect = crosshair.getBoundingClientRect();
    
    // Regular Aliens
    aliens.forEach(alien => {
        if (!alien || alien.style.display === "none") return;
        const rect = alien.getBoundingClientRect();
        if (
            crosshairRect.right >= rect.left &&
            crosshairRect.left <= rect.right &&
            crosshairRect.bottom >= rect.top &&
            crosshairRect.top <= rect.bottom
        ) {
            scoreHit(alien);
        }
    });

    // Shadows and Bombs
    shadowElements.forEach(shadow => {
        if (document.body.contains(shadow)) {
            const rect = shadow.getBoundingClientRect();
            if (
                crosshairRect.right >= rect.left &&
                crosshairRect.left <= rect.right &&
                crosshairRect.bottom >= rect.top &&
                crosshairRect.top <= rect.bottom
            ) {
                // If it's a bomb, instantly die!
                if (shadow.classList.contains("black-box-bomb")) {
                    endGame("bomb");
                } else {
                    shadow.dispatchEvent(new Event("mousedown"));
                }
            }
        }
    });
}

gameArea.addEventListener("mousemove", (e) => {
    const rect = gameArea.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    crosshair.style.left = `${mouseX}px`;
    crosshair.style.top = `${mouseY}px`;
    
    // Check auto-shoot when mouse moves
    checkAutoShoot();
});

gameArea.addEventListener("mousedown", (e) => {
    if (!gameRunning) return;
    
    // Bounding Box Collision for forgiving hit detection
    const crosshairRect = crosshair.getBoundingClientRect();
    
    aliens.forEach(alien => {
        if (!alien || alien.style.display === "none") return;
        const rect = alien.getBoundingClientRect();
        
        if (
            crosshairRect.right >= rect.left &&
            crosshairRect.left <= rect.right &&
            crosshairRect.bottom >= rect.top &&
            crosshairRect.top <= rect.bottom
        ) {
            scoreHit(alien);
        }
    });

    shadowElements.forEach(shadow => {
        if (document.body.contains(shadow)) {
            const rect = shadow.getBoundingClientRect();
            if (
                crosshairRect.right >= rect.left &&
                crosshairRect.left <= rect.right &&
                crosshairRect.bottom >= rect.top &&
                crosshairRect.top <= rect.bottom
            ) {
                if (shadow.classList.contains("black-box-bomb")) {
                    endGame("bomb");
                } else {
                    shadow.dispatchEvent(new Event("mousedown"));
                }
            }
        }
    });
});

window.addEventListener("keydown", (e) => {
    // Double Blade Wave Shot activation (Requires Uses > 0)
    if (e.code === "Space" && gameRunning && doubleBladeUnlocked && doubleBladeUses > 0 && currentLevel === 3) {
        e.preventDefault(); // Prevent page scrolling
        doubleBladeUses--;
        
        const flash = document.createElement("div");
        flash.className = "wave-flash";
        scopeView.appendChild(flash);
        playWaveSound();
        
        setTimeout(() => flash.remove(), 500);
        
        // Destroy regular aliens - 5 points each
        aliens.forEach(a => { 
            if(a && a.style.display !== "none") {
                a.style.display = "none";
                const rect = a.getBoundingClientRect();
                const areaRect = gameArea.getBoundingClientRect();
                const x = rect.left - areaRect.left + rect.width / 2;
                const y = rect.top - areaRect.top + rect.height / 2;
                
                createBloodEffect(x, y);
                showPoints(x, y, 5);
                score = Math.min(getTargetScore(), score + 5);
                setTimeout(() => { if (gameRunning) resetAlien(a); }, 180);
            }
        });
        
        // Clear shadow creatures AND bombs silently (no points, no penalty, perfectly safe)
        shadowElements.forEach(s => {
            if(document.body.contains(s)) s.remove();
        });
        
        updateHUD();
        if(score >= getTargetScore()) finishLevel3();
    } else if (e.code === "Space") {
        e.preventDefault(); // Catch spacebar indiscriminately so they don't scroll while playing
    }
});

// Initialize Game
updateHUD();
startAlienMovement();