const fruit = document.getElementById("fruit"); // Find the fruit element
const scoreDisplay = document.getElementById("score"); // Find the score element
const missesDisplay = document.getElementById("misses"); // Find the misses element
const livesDisplay = document.getElementById("lives"); // Find the lives element
const gameOverScreen = document.getElementById("game-over"); // Find the Game Over screen
const restartButton = document.getElementById("restart-button"); // Find the Restart button
const gameArea = document.getElementById("game-area"); // Find the game area
const bomb = document.getElementById("bomb");

const hitSound = new AudioContext(); // Create the sound system

let score = 0; // Stores the player's current score
let misses = 0; // Stores how many fruits the player has missed
let lives = 4; // Stores how many lives the player has
let gameRunning = true; // Stores whether the game is currently running


resetFruit(); // Put the fruit at a random starting position


function resetFruit() {

    fruit.style.left = Math.floor(Math.random() * 750) + "px"; // Choose a random horizontal position
    fruit.style.top = "0px"; // Move the fruit back to the top

}


setInterval(() => {

    if (!gameRunning) {
        return; // Stop the game loop when the game is over
    }

    fruit.style.top = parseInt(fruit.style.top) + 5 + "px"; // Move the fruit downward

    if (parseInt(fruit.style.top) >= 450) {

        misses = misses + 1; // Increase the missed-fruit count
        missesDisplay.textContent = "Misses: " + misses; // Update the misses display

        lives = lives - 1; // Remove one life
        livesDisplay.textContent = "Lives: " + "❤️".repeat(lives); // Update the lives display

        if (lives <= 0) {

            gameRunning = false; // Stop the game
            gameOverScreen.style.display = "block"; // Show Game Over screen

        }

        fruit.style.top = "0px"; // Reset the fruit to the top

    }

}, 50); // Repeat every 50 milliseconds


fruit.addEventListener("click", () => {

    if (!gameRunning) {
        return; // Don't allow scoring after Game Over
    }


    // -------------------------
    // Fruit hit animation
    // -------------------------

    fruit.classList.add("fruit-hit");


    // -------------------------
    // Increase score
    // -------------------------

    score = score + 1;
    scoreDisplay.textContent = "Score: " + score;


    // -------------------------
    // Create +1 popup
    // -------------------------

    const points = document.createElement("div");

    points.textContent = "+1";

    points.classList.add("points-popup");

    points.style.left = fruit.style.left;
    points.style.top = fruit.style.top;

    gameArea.appendChild(points);


    // Remove +1 popup after animation

    setTimeout(() => {

        points.remove();

    }, 500);


    // -------------------------
    // Play hit sound
    // -------------------------

    const oscillator = hitSound.createOscillator();
    const gainNode = hitSound.createGain();

    oscillator.frequency.value = 600;

    gainNode.gain.value = 0.1;

    oscillator.connect(gainNode);
    gainNode.connect(hitSound.destination);

    oscillator.start();

    oscillator.stop(hitSound.currentTime + 0.1);


    // -------------------------
    // Reset fruit
    // -------------------------

    setTimeout(() => {

        fruit.classList.remove("fruit-hit");

        resetFruit();

    }, 200);

});


restartButton.addEventListener("click", () => {

    lives = 4;
    misses = 0;
    score = 0;
    gameRunning = true;

    // Reset the displays
    livesDisplay.textContent = "Lives: ❤️❤️❤️❤️";
    missesDisplay.textContent = "Misses: 0";
    scoreDisplay.textContent = "Score: 0";

    // Reset the fruit
    fruit.classList.remove("fruit-hit");
    fruit.style.display = "block";

    resetFruit();

    // Hide Game Over screen
    gameOverScreen.style.display = "none";

});

bomb.addEventListener("click", () => {

    gameArea.classList.add("game-shake");

    setTimeout(() => {
        gameArea.classList.remove("game-shake");
    }, 300);

});