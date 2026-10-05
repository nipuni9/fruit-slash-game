
const fruit = document.getElementById("fruit");
const scoreDisplay = document.getElementById("score");
const missesDisplay = document.getElementById("misses");
const livesDisplay = document.getElementById("lives");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");
const gameArea = document.getElementById("game-area");
const crosshair = document.getElementById("crosshair");
const bomb = document.getElementById("bomb");
const newFruit = document.createElement("div");

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

function resetFruit() {
    fruit.textContent = fruits[Math.floor(Math.random() * fruits.length)];
    fruit.style.left = Math.floor(Math.random() * 750) + "px";
    fruit.style.top = "0px";

    fruitsSpawned++;

    // Guarantee at least two bomb spawns per 50 fruits.
    // The first two eligible spawns in each 50-fruit cycle are guaranteed.
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
    if (oldMessage) oldMessage.remove();

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

resetFruit();

setInterval(() => {
    if (!gameRunning) return;

    // Move the bomb. Missing it has no penalty.
    if (bomb.style.display !== "none") {
        bomb.style.top = parseInt(bomb.style.top) + 4 + "px";

        if (parseInt(bomb.style.top) >= 450) {
            bomb.style.display = "none";
        }
    }

    // Move the fruit downward.
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

fruit.addEventListener("click", () => {
    if (!gameRunning) return;

    fruit.classList.add("fruit-hit");

    score++;
    scoreDisplay.textContent = "Score: " + score;
    if (score % 10 === 0) {
    fruitSpeed += 1;
    }

    const points = document.createElement("div");
    points.textContent = "+1";
    points.classList.add("points-popup");
    points.style.left = fruit.style.left;
    points.style.top = fruit.style.top;
    gameArea.appendChild(points);

    setTimeout(() => points.remove(), 500);

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
  
gameArea.addEventListener("mousemove", (event) => {
    const rect = gameArea.getBoundingClientRect();

    crosshair.style.left = (event.clientX - rect.left) + "px";
    crosshair.style.top = (event.clientY - rect.top) + "px";
});