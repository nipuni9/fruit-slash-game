const fruit = document.getElementById("fruit"); // Find the HTML element whose ID is "fruit" and give me access to it.
const scoreDisplay = document.getElementById("score"); // Find the HTML element whose ID is "score"
const missesDisplay = document.getElementById("misses"); // Find the HTML element whose ID is "misses"
let score = 0; // Stores the player's current score
let misses = 0; // Stores how many fruits the player has missed

resetFruit(); // Put the fruit at a random starting position

function resetFruit() {
    fruit.style.left = Math.floor(Math.random() * 750) + "px"; // Choose a random horizontal position
    fruit.style.top = "0px"; // Move the fruit back to the top
}

setInterval(() => {
    fruit.style.top = parseInt(fruit.style.top) + 5 + "px"; // Move the fruit 5 pixels downward
    
    if (parseInt(fruit.style.top) >= 450) {
    misses = misses + 1; // Increase the missed-fruit count
    missesDisplay.textContent = "Misses: " + misses; // Update the misses shown on the page
    fruit.style.top = "0px"; // Reset the fruit to the top
    }

}, 50); // Repeat every 50 milliseconds

fruit.addEventListener("click", () => {
    fruit.style.display = "none"; // Hide the fruit after it is slashed

    score = score + 1; // Increase the score by 1
    scoreDisplay.textContent = "Score: " + score; // Update the score shown on the page

    fruit.style.display = "block"; // Show the fruit again
    resetFruit(); // Give the new fruit a random position


}); // Detect when the player clicks the fruit