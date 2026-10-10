
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

/* =========================
   SOUND
========================= */

const fruits = ["👽"];
const hitSound = new AudioContext();
const scareSound = new AudioContext();

/* =========================
   CREEPY JUMPSCARE SOUND
========================= */

function playScareSound() {
    if (scareSound.state === "suspended") {
        scareSound.resume();
    }

    const now = scareSound.currentTime;

    // Deep rumble
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

    // High-pitched synthetic scream
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
   GAME VARIABLES
========================= */

let score = 0;
let misses = 0;
let lives = 4;
let gameRunning = true;
let levelPassed = false;
let fruitsSpawned = 0;

const targetScore = 100;
const sensorRadius = 30;

/* =========================
   RESET ALIEN
========================= */

function resetFruit() {
    fruit.textContent =
        fruits[Math.floor(Math.random() * fruits.length)];

    fruit.style.left = Math.floor(Math.random() * 396) + "px";
    fruit.style.top = "0px";
    fruit.style.display = "block";

    fruitsSpawned++;
}

/* =========================
   LEVEL 1 COMPLETED
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

    message.appendChild(heading);
    message.appendChild(replayButton);
    message.appendChild(nextButton);

    gameArea.appendChild(message);

    replayButton.addEventListener("click", restartLevel1);
    nextButton.addEventListener("click", showLevel2Briefing);
}

/* =========================
   GAME OVER / JUMPSCARE
========================= */

function endGame() {
    if (!gameRunning) return;

    gameRunning = false;

    fruit.style.display = "none";
    crosshair.style.display = "none";

    jumpscareAlien.style.display = "block";

    // Restart the jumpscare animation
    jumpscareAlien.style.animation = "none";
    void jumpscareAlien.offsetWidth;

    jumpscareAlien.style.animation =
        "alienJumpscare 0.8s ease-in forwards";

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
    fruitsSpawned = 0;

    scoreDisplay.textContent = "Score: 0";
    missesDisplay.textContent = "Misses: 0";
    livesDisplay.textContent = "Lives: " + "❤️".repeat(lives);

    fruit.classList.remove("fruit-hit");
    fruit.style.display = "block";

    crosshair.style.display = "block";

    jumpscareAlien.style.display = "none";
    jumpscareAlien.style.animation = "none";

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

        // Restore the Level 1 completion screen
        levelPassed = false;
        showLevelPassed();
    });

    document
        .getElementById("start-level2-button")
        .addEventListener("click", () => {
            message.innerHTML = `
                <h2>Level 2 is next!</h2>
                <p>
                    The briefing is ready. We'll add the timer
                    and two-alien gameplay next.
                </p>
                <button id="back-to-level1">Back to Level 1</button>
            `;

            document
                .getElementById("back-to-level1")
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

        const moveX = Math.cos(angle) * distance;
        const moveY = Math.sin(angle) * distance;

        particle.style.setProperty("--move-x", moveX + "px");
        particle.style.setProperty("--move-y", moveY + "px");

        gameArea.appendChild(particle);

        setTimeout(() => particle.remove(), 400);
    }
}

/* =========================
   INITIAL ALIEN
========================= */

resetFruit();

/* =========================
   ALIEN MOVEMENT
========================= */

setInterval(() => {
    if (!gameRunning) return;

    const speed = 4 + Math.floor(score / 20);

    fruit.style.top =
        (parseFloat(fruit.style.top) || 0) + speed + "px";

    // Alien missed
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

    const dx = targetMouseX - centerX;
    const dy = targetMouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let limitedX = targetMouseX;
    let limitedY = targetMouseY;

    if (distance > scopeRadius - reticleRadius) {
        limitedX =
            centerX + (dx / distance) * (scopeRadius - reticleRadius);

        limitedY =
            centerY + (dy / distance) * (scopeRadius - reticleRadius);
    }

    crosshairX += (limitedX - crosshairX) * 0.40;
    crosshairY += (limitedY - crosshairY) * 0.40;

    crosshair.style.left = crosshairX + "px";
    crosshair.style.top = crosshairY + "px";

    requestAnimationFrame(smoothCrosshair);
}

smoothCrosshair();

/* =========================
   SHOOTING / SENSOR
========================= */

gameArea.addEventListener("click", (event) => {
    if (!gameRunning) return;

    // Ignore clicks on the Level 1 completion screen
    if (event.target.closest("#level-passed")) return;

    const rect = gameArea.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const alienRect = fruit.getBoundingClientRect();

    const alienX =
        alienRect.left - rect.left + alienRect.width / 2;

    const alienY =
        alienRect.top - rect.top + alienRect.height / 2;

    const dx = mouseX - alienX;
    const dy = mouseY - alienY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (fruit.style.display === "none") return;

    // HIT
    if (distance <= sensorRadius) {
        fruit.classList.add("fruit-hit");

        score++;
        scoreDisplay.textContent = "Score: " + score;

        createBloodEffect(alienX, alienY);

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

        // Floating points
        const points = document.createElement("div");
        points.textContent = "+1";
        points.classList.add("points-popup");

        points.style.left = alienX + "px";
        points.style.top = alienY + "px";

        gameArea.appendChild(points);

        setTimeout(() => points.remove(), 500);

        if (score >= targetScore) {
            showLevelPassed();
            return;
        }

        setTimeout(() => {
            fruit.classList.remove("fruit-hit");

            if (gameRunning) {
                resetFruit();
            }
        }, 200);
    } else {
        // MISS: count the missed shot but do not remove a life
        misses++;
        missesDisplay.textContent = "Misses: " + misses;
    }
});

/* =========================
   RESTART BUTTON
========================= */

restartButton.addEventListener("click", restartLevel1);
