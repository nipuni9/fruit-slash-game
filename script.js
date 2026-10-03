
const fruit = document.getElementById("fruit");
const scoreDisplay = document.getElementById("score");
const missesDisplay = document.getElementById("misses");
const livesDisplay = document.getElementById("lives");
const gameOverScreen = document.getElementById("game-over");
const restartButton = document.getElementById("restart-button");
const gameArea = document.getElementById("game-area");
const bomb = document.getElementById("bomb");

const fruits = ["🍎", "🍊", "🍌", "🍉", "🍓"];
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
    message.textContent = "🎉 LEVEL 1 PASSED! 🎉";
    gameArea.appendChild(message);
}

function endGame() {
    gameRunning = false;
    gameOverScreen.style.display = "block";
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
    const speed = 5 + Math.floor(score / 10);
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

restartButton.addEventListener("click", () => {
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
    livesDisplay.textContent = "Lives: ❤️❤️❤️❤️";

    fruit.classList.remove("fruit-hit");
    fruit.style.display = "block";
    bomb.style.display = "none";

    const oldMessage = document.getElementById("level-passed");
    if (oldMessage) oldMessage.remove();

    gameOverScreen.style.display = "none";

    resetFruit();
});