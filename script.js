
/* =========================
   DOM ELEMENTS
========================= */

const fruit = document.getElementById("fruit");
const scoreDisplay = document.getElementById("score");
const missesDisplay = document.getElementById("misses");
const livesDisplay = document.getElementById("lives");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");
const gameArea = document.getElementById("game-area");
const crosshair = document.getElementById("crosshair");
const jumpscareAlien = document.getElementById("jumpscare-alien");
const windows = document.querySelectorAll(".building-windows span");

/* =========================
   SOUND
========================= */

const fruits = ["👽"];
const hitSound = new AudioContext();
const scareSound = new AudioContext();

/* =========================
   GAME VARIABLES
========================= */

let score = 0;
let misses = 0;
let lives = 4;
let gameRunning = true;
let levelPassed = false;

const targetScore = 100;
const sensorRadius = 30;
const autoShootRadius = 8;
let lastAutoShot = 0;
const autoShootCooldown = 300;
const glowingWindows = [0, 3, 4, 6, 9, 10];

/* =========================
   JUMPSCARE SOUND
========================= */

function playScareSound() {
    if (scareSound.state === "suspended") {
        scareSound.resume();
    }

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
   ALIEN RESET
========================= */

function resetFruit() {
    fruit.textContent = fruits[Math.floor(Math.random() * fruits.length)];
    fruit.style.left = Math.floor(Math.random() * 396) + "px";
    fruit.style.top = "0px";
    fruit.style.display = "block";
    fruit.classList.remove("fruit-hit");
}

/* =========================
   SCORE UPDATE
========================= */

function addScore(points = 1) {
    score += points;
    scoreDisplay.textContent = "Score: " + score;

    if (score >= targetScore) {
        showLevelPassed();
    }
}

/* =========================
   LEVEL COMPLETED
========================= */

function showLevelPassed() {
    if (levelPassed) return;

    levelPassed = true;
    gameRunning = false;

    const message = document.createElement("div");
    message.id = "level-passed";

    const heading = document.createElement("h2");
    heading.textContent = "🎉 LEVEL 1 PASSED! 🎉";

    const replayButton = document.createElement("button");
    replayButton.textContent = "Replay Level 1";

    const nextButton = document.createElement("button");
    nextButton.textContent = "Next Level ➜";

    message.append(heading, replayButton, nextButton);
    gameArea.appendChild(message);

    replayButton.addEventListener("click", restartLevel1);
    nextButton.addEventListener("click", showLevel2Briefing);
}

/* =========================
   GAME OVER
========================= */

function endGame() {
    if (!gameRunning) return;

    gameRunning = false;

    fruit.style.display = "none";
    crosshair.style.display = "none";
    jumpscareAlien.style.display = "block";

    jumpscareAlien.style.animation = "none";
    void jumpscareAlien.offsetWidth;
    jumpscareAlien.style.animation = "alienJumpscare 0.8s ease-in forwards";

    playScareSound();

    setTimeout(() => {
        gameOverScreen.style.display = "flex";
    }, 800);
}

/* =========================
   RESTART LEVEL 1
========================= */

function restartLevel1() {
    score = 0;
    misses = 0;
    lives = 4;
    gameRunning = true;
    levelPassed = false;

    scoreDisplay.textContent = "Score: 0";
    missesDisplay.textContent = "Misses: 0";
    livesDisplay.textContent = "Lives: " + "❤️".repeat(lives);

    fruit.classList.remove("fruit-hit");
    fruit.style.display = "block";
    crosshair.style.display = "block";

    jumpscareAlien.style.display = "none";
    jumpscareAlien.style.animation = "none";

    windows.forEach((windowElement) => {
        windowElement.classList.remove("window-destroyed");
    });

    const oldMessage = document.getElementById("level-passed");
    if (oldMessage) oldMessage.remove();

    gameOverScreen.style.display = "none";

    resetFruit();
}

/* =========================
   LEVEL 2 BRIEFING
========================= */

function showLevel2Briefing() {
    const message = document.getElementById("level-passed");
    if (!message) return;

    message.innerHTML = `
        <h2>⚔️ LEVEL 2</h2>
        <p>Two aliens will fall at the same time!</p>
        <p>⏱️ Catch enough aliens before time runs out.</p>
        <p>❤️ You start with 3 hearts.</p>
        <p>🏆 Beat the special record to earn an extra heart.</p>
        <p>⚔️ Complete Level 2 in time to unlock Double Blade.</p>
        <p><em>Are you ready?</em></p>
        <button id="back-button">Back</button>
        <button id="start-level2-button">Start Level 2 ➜</button>
    `;

    document.getElementById("back-button").addEventListener("click", () => {
        message.remove();
        levelPassed = false;
        showLevelPassed();
    });

    document.getElementById("start-level2-button").addEventListener("click", () => {
        message.innerHTML = `
            <h2>Level 2 is next!</h2>
            <p>We'll add the timer and two-alien gameplay next.</p>
            <button id="back-to-level1">Back to Level 1</button>
        `;

        document.getElementById("back-to-level1")
            .addEventListener("click", restartLevel1);
    });
}

/* =========================
   BLOOD EFFECT
========================= */

function createBloodEffect(x, y) {
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement("div");
        particle.classList.add("blood-particle");

        particle.style.left = x + "px";
        particle.style.top = y + "px";

        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50;

        particle.style.setProperty("--move-x", Math.cos(angle) * distance + "px");
        particle.style.setProperty("--move-y", Math.sin(angle) * distance + "px");

        gameArea.appendChild(particle);
        setTimeout(() => particle.remove(), 400);
    }
}

/* =========================
   HIT SOUND
========================= */

function playHitSound() {
    if (hitSound.state === "suspended") {
        hitSound.resume();
    }

    const oscillator = hitSound.createOscillator();
    const gainNode = hitSound.createGain();

    oscillator.frequency.value = 600;
    gainNode.gain.value = 0.1;

    oscillator.connect(gainNode);
    gainNode.connect(hitSound.destination);

    oscillator.start();
    oscillator.stop(hitSound.currentTime + 0.1);
}

/* =========================
   FLOATING POINTS
========================= */

function showPoints(x, y) {
    const points = document.createElement("div");
    points.textContent = "+1";
    points.classList.add("points-popup");
    points.style.left = x + "px";
    points.style.top = y + "px";

    gameArea.appendChild(points);
    setTimeout(() => points.remove(), 500);
}

/* =========================
   INITIALIZE GAME
========================= */

resetFruit();

/* =========================
   ALIEN MOVEMENT
========================= */

setInterval(() => {
    if (!gameRunning) return;

    const speed = 4 + Math.floor(score / 20);
    fruit.style.top = ((parseFloat(fruit.style.top) || 0) + speed) + "px";

    if ((parseFloat(fruit.style.top) || 0) >= 450) {
        misses++;
        missesDisplay.textContent = "Misses: " + misses;

        lives = Math.max(0, lives - 1);
        livesDisplay.textContent = "Lives: " + "❤️".repeat(lives);

        if (lives <= 0) {
            endGame();
        } else {
            resetFruit();
        }
    }
}, 50);

/* =========================
   SMOOTH RETICLE
========================= */

let targetMouseX = 400;
let targetMouseY = 250;
let crosshairX = 400;
let crosshairY = 250;

gameArea.addEventListener("mousemove", (event) => {
    const rect = gameArea.getBoundingClientRect();

    targetMouseX = event.clientX - rect.left;
    targetMouseY = event.clientY - rect.top;
});

function smoothCrosshair() {
    const centerX = 400;
    const centerY = 250;
    const scopeRadius = 210;
    const reticleRadius = 35;
    const sensitivity = 0.45;

    const dx = targetMouseX - centerX;
    const dy = targetMouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = scopeRadius - reticleRadius;

    let limitedX = targetMouseX;
    let limitedY = targetMouseY;

    if (distance > maxDistance && distance > 0) {
        limitedX = centerX + (dx / distance) * maxDistance;
        limitedY = centerY + (dy / distance) * maxDistance;
    }

    crosshairX += (limitedX - crosshairX) * sensitivity;
    crosshairY += (limitedY - crosshairY) * sensitivity;

    crosshair.style.left = crosshairX + "px";
    crosshair.style.top = crosshairY + "px";

    requestAnimationFrame(smoothCrosshair);
}

smoothCrosshair();


/* =========================
   AUTOMATIC SNIPER
========================= */

function autoShoot() {
    if (!gameRunning || fruit.style.display === "none") {
        requestAnimationFrame(autoShoot);
        return;
    }

    const alienRect = fruit.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();

    const alienX = alienRect.left - gameRect.left + alienRect.width / 2;
    const alienY = alienRect.top - gameRect.top + alienRect.height / 2;

    const reticleRadius = 35;
    const alienRadius = alienRect.width / 2;

    const dx = crosshairX - alienX;
    const dy = crosshairY - alienY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const hitRadius = reticleRadius + alienRadius;  

    const now = performance.now();

    if (
        distance <= hitRadius &&
        now - lastAutoShot >= autoShootCooldown
    ) {
        lastAutoShot = now;

        fruit.classList.add("fruit-hit");

        createBloodEffect(alienX, alienY);
        playHitSound();
        showPoints(alienX, alienY);
        addScore(1);

        if (gameRunning) {
            setTimeout(() => {
                if (gameRunning) resetFruit();
            }, 200);
        }
    }

    requestAnimationFrame(autoShoot);
}

autoShoot();


/* =========================
   SHOOTING ALIENS
========================= */

gameArea.addEventListener("click", (event) => {
    if (!gameRunning) return;
    if (event.target.closest("#level-passed")) return;

    const rect = gameArea.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const alienRect = fruit.getBoundingClientRect();
    const alienX = alienRect.left - rect.left + alienRect.width / 2;
    const alienY = alienRect.top - rect.top + alienRect.height / 2;

    if (fruit.style.display === "none") return;

    const dx = mouseX - alienX;
    const dy = mouseY - alienY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= sensorRadius) {
        fruit.classList.add("fruit-hit");

        createBloodEffect(alienX, alienY);
        playHitSound();
        showPoints(alienX, alienY);
        addScore(1);

        if (!gameRunning) return;

        setTimeout(() => {
            if (gameRunning) resetFruit();
        }, 200);
    } else {
        misses++;
        missesDisplay.textContent = "Misses: " + misses;
    }
});

/* =========================
   SHOOTABLE WINDOWS
========================= */

windows.forEach((windowElement, index) => {
    if (!glowingWindows.includes(index)) return;

    windowElement.addEventListener("click", (event) => {
        if (!gameRunning) return;

        if (windowElement.classList.contains("window-destroyed")) {
            return;
        }

        event.stopPropagation();
        windowElement.classList.add("window-destroyed");

        const rect = windowElement.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect();

        const hitX = rect.left - gameRect.left + rect.width / 2;
        const hitY = rect.top - gameRect.top + rect.height / 2;

        createBloodEffect(hitX, hitY);
        playHitSound();
        showPoints(hitX, hitY);
        addScore(1);
    });
});

/* =========================
   RESTART BUTTON
========================= */

restartButton.addEventListener("click", restartLevel1);
