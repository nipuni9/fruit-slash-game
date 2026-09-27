const fruit = document.getElementById("fruit"); // Find the fruit element
const scoreDisplay = document.getElementById("score"); // Find the score element
const missesDisplay = document.getElementById("misses"); // Find the misses element
const livesDisplay = document.getElementById("lives"); // Find the lives element
const gameOverScreen = document.getElementById("game-over"); // Find the Game Over screen
const restartButton = document.getElementById("restart-button"); // Find the Restart button
const gameArea = document.getElementById("game-area");
const blade = document.getElementById("blade");

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

    fruit.style.display = "none"; // Hide the fruit after it is clicked

    score = score + 1; // Increase the score by 1
    scoreDisplay.textContent = "Score: " + score; // Update the score display

    fruit.style.display = "block"; // Show the fruit again
    resetFruit(); // Give the fruit a new random position

});


restartButton.addEventListener("click", () => {

    lives = 4; // Reset lives
    misses = 0; // Reset misses
    score = 0; // Reset score
    gameRunning = true; // Start the game again

    livesDisplay.textContent = "Lives: ❤️❤️❤️❤️"; // Reset lives display
    missesDisplay.textContent = "Misses: 0"; // Reset misses display
    scoreDisplay.textContent = "Score: 0"; // Reset score display

    gameOverScreen.style.display = "none"; // Hide Game Over screen

    resetFruit(); // Put the fruit in a new position

});

gameArea.addEventListener("click", (event) => {
    if (!gameRunning) {
        return;
    }

    const rect = gameArea.getBoundingClientRect();

    blade.style.left = (event.clientX - rect.left) + "px";
    blade.style.top = (event.clientY - rect.top) + "px";

    blade.style.display = "block";
});

gameArea.addEventListener("mousemove", (event) => {
    const rect = gameArea.getBoundingClientRect();

    blade.style.left = (event.clientX - rect.left) + "px";
    blade.style.top = (event.clientY - rect.top) + "px";
});