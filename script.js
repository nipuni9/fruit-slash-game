const fruit = document.getElementById("fruit");
const scoreDisplay = document.getElementById("score");
const missesDisplay = document.getElementById("misses");
const livesDisplay = document.getElementById("lives");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");
const gameArea = document.getElementById("game-area");
const crosshair = document.getElementById("crosshair");
const bomb = document.getElementById("bomb");

const fruits = ["👽"];
const hitSound = new AudioContext();

let score = 0;
let misses = 0;
let lives = 4;
let fruitSpeed = 5;
let gameRunning = true;
let levelPassed = false;
let fruitsSpawned = 0;
let bombsSpawnedThisCycle = 0;

const targetScore = 100;
const bombChance = 0.10;
const sensorRadius = 30;


function resetFruit() {
    fruit.textContent = fruits[Math.floor(Math.random() * fruits.length)];
    fruit.style.left = Math.floor(Math.random() * 396) + "px";
    fruit.style.top = "0px";
    fruit.style.display = "block";

    fruitsSpawned++;

    if (fruitsSpawned % 50 === 1) {
        bombsSpawnedThisCycle = 0;
    }

    if (bombsSpawnedThisCycle < 2) {
        resetBomb(true);
    } else if (Math.random() < bombChance) {
        resetBomb(true);
    } else {
        bomb.style.display = "none";
    }
}


function resetBomb(shouldSpawn = false) {
    bomb.style.display = "none";

    if (shouldSpawn) {
        bomb.style.left = Math.floor(Math.random() * 750) + "px";
        bomb.style.top = "0px";
        bomb.style.display = "block";
        bombsSpawnedThisCycle++;
    }
}


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


function endGame() {
    gameRunning = false;
    gameOverScreen.style.display = "block";
}


function restartLevel1() {
    score = 0;
    misses = 0;
    lives = 4;
    fruitSpeed = 5;
    gameRunning = true;
    levelPassed = false;
    fruitsSpawned = 0;
    bombsSpawnedThisCycle = 0;

    scoreDisplay.textContent = "Score: 0";
    missesDisplay.textContent = "Misses: 0";
    livesDisplay.textContent = "Lives: " + "❤️".repeat(lives);

    fruit.classList.remove("fruit-hit");
    fruit.style.display = "block";

    bomb.style.display = "none";

    const oldMessage = document.getElementById("level-passed");

    if (oldMessage) {
        oldMessage.remove();
    }

    gameOverScreen.style.display = "none";

    resetFruit();
}


function showLevel2Briefing() {
    const message = document.getElementById("level-passed");

    message.innerHTML = `
        <h2>⚔️ LEVEL 2</h2>
        <p>Two fruits will fall at the same time!</p>
        <p>⏱️ Catch enough fruits before time runs out.</p>
        <p>❤️ You start with 3 hearts.</p>
        <p>🏆 Beat the special record to earn an extra heart.</p>
        <p>⚔️ Complete Level 2 in time to unlock Double Blade.</p>
        <p><em>Are you ready?</em></p>
        <button id="back-button">Back</button>
        <button id="start-level2-button">Start Level 2 ➜</button>
    `;

    document.getElementById("back-button").addEventListener("click", () => {
        message.remove();
        showLevelPassed();
    });

    document.getElementById("start-level2-button").addEventListener("click", () => {
        message.innerHTML = `
            <h2>Level 2 is next!</h2>
            <p>The briefing is ready. We'll add the timer and two-fruit gameplay next.</p>
            <button id="back-to-level1">Back to Level 1</button>
        `;

        document.getElementById("back-to-level1").addEventListener("click", () => {
            message.remove();
            restartLevel1();
        });
    });
}


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


resetFruit();


setInterval(() => {
    if (!gameRunning) return;

    if (bomb.style.display !== "none") {
        bomb.style.top = parseInt(bomb.style.top) + 4 + "px";

        if (parseInt(bomb.style.top) >= 450) {
            bomb.style.display = "none";
        }
    }

    const speed = 4 + Math.floor(score / 20);

    fruit.style.top = parseInt(fruit.style.top) + speed + "px";

    if (parseInt(fruit.style.top) >= 450) {
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


// 🎯 Reticle movement
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
    crosshairX += (targetMouseX - crosshairX) * 0.40;
    crosshairY += (targetMouseY - crosshairY) * 0.40;

    crosshair.style.left = crosshairX + "px";
    crosshair.style.top = crosshairY + "px";

    requestAnimationFrame(smoothCrosshair);
}

smoothCrosshair();


// 🔫 Shooting / sensor system
gameArea.addEventListener("click", (event) => {
    if (!gameRunning) return;

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


    if (distance <= sensorRadius) {

        // HIT
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


        const points = document.createElement("div");

        points.textContent = "+1";
        points.classList.add("points-popup");

        points.style.left = alienX + "px";
        points.style.top = alienY + "px";

        gameArea.appendChild(points);

        setTimeout(() => {
            points.remove();
        }, 500);


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

        // MISS
        misses++;

        missesDisplay.textContent = "Misses: " + misses;
    }
});


bomb.addEventListener("click", () => {
    if (!gameRunning || bomb.style.display === "none") return;

    gameRunning = false;
    bomb.style.display = "none";

    gameArea.classList.add("game-shake");

    setTimeout(() => {
        gameArea.classList.remove("game-shake");
        endGame();
    }, 300);
});


restartButton.addEventListener("click", restartLevel1);