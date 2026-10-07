/* =========================
   DOM ELEMENTS
========================= */

const fruit = document.getElementById("fruit");

const scoreDisplay =
    document.getElementById("score");

const missesDisplay =
    document.getElementById("misses");

const livesDisplay =
    document.getElementById("lives");

const gameOverScreen =
    document.getElementById("game-over");

const restartButton =
    document.getElementById("restart-button");

const gameArea =
    document.getElementById("game-area");

const crosshair =
    document.getElementById("crosshair");

const bomb =
    document.getElementById("bomb");

const jumpscareAlien =
    document.getElementById("jumpscare-alien");


/* =========================
   SOUND
========================= */

const fruits = ["👽"];

const hitSound =
    new AudioContext();

const scareSound =
    new AudioContext();


/* =========================
   CREEPY JUMPSCARE SOUND
========================= */

function playScareSound() {

    if (scareSound.state === "suspended") {
        scareSound.resume();
    }

    const now =
        scareSound.currentTime;


    /* DEEP RUMBLE */

    const rumble =
        scareSound.createOscillator();

    const rumbleGain =
        scareSound.createGain();

    rumble.type =
        "sine";

    rumble.frequency.setValueAtTime(
        45,
        now
    );

    rumble.frequency.exponentialRampToValueAtTime(
        25,
        now + 1
    );

    rumbleGain.gain.setValueAtTime(
        0.5,
        now
    );

    rumbleGain.gain.exponentialRampToValueAtTime(
        0.01,
        now + 1
    );

    rumble.connect(
        rumbleGain
    );

    rumbleGain.connect(
        scareSound.destination
    );

    rumble.start(now);

    rumble.stop(
        now + 1
    );


    /* HIGH SCREAM */

    const scream =
        scareSound.createOscillator();

    const screamGain =
        scareSound.createGain();

    scream.type =
        "sawtooth";

    scream.frequency.setValueAtTime(
        150,
        now
    );

    scream.frequency.exponentialRampToValueAtTime(
        1500,
        now + 0.65
    );

    screamGain.gain.setValueAtTime(
        0.01,
        now
    );

    screamGain.gain.linearRampToValueAtTime(
        0.35,
        now + 0.35
    );

    screamGain.gain.exponentialRampToValueAtTime(
        0.01,
        now + 0.9
    );

    scream.connect(
        screamGain
    );

    screamGain.connect(
        scareSound.destination
    );

    scream.start(now);

    scream.stop(
        now + 1
    );
}


/* =========================
   GAME VARIABLES
========================= */

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


/* =========================
   RESET ALIEN
========================= */

function resetFruit() {

    fruit.textContent =
        fruits[
            Math.floor(
                Math.random() *
                fruits.length
            )
        ];

    fruit.style.left =
        Math.floor(
            Math.random() * 396
        ) + "px";

    fruit.style.top =
        "0px";

    fruit.style.display =
        "block";


    fruitsSpawned++;


    if (
        fruitsSpawned % 50 === 1
    ) {
        bombsSpawnedThisCycle = 0;
    }


    if (
        bombsSpawnedThisCycle < 2
    ) {

        resetBomb(true);

    } else if (
        Math.random() < bombChance
    ) {

        resetBomb(true);

    } else {

        bomb.style.display =
            "none";
    }
}


/* =========================
   RESET BOMB
========================= */

function resetBomb(
    shouldSpawn = false
) {

    bomb.style.display =
        "none";


    if (shouldSpawn) {

        bomb.style.left =
            Math.floor(
                Math.random() * 750
            ) + "px";

        bomb.style.top =
            "0px";

        bomb.style.display =
            "block";

        bombsSpawnedThisCycle++;
    }
}


/* =========================
   LEVEL PASSED
========================= */

function showLevelPassed() {

    if (levelPassed) return;

    levelPassed = true;

    gameRunning = false;


    const message =
        document.createElement("div");

    message.id =
        "level-passed";


    const heading =
        document.createElement("h2");

    heading.textContent =
        "🎉 LEVEL 1 PASSED! 🎉";


    const replayButton =
        document.createElement("button");

    replayButton.textContent =
        "Replay Level 1";


    const nextButton =
        document.createElement("button");

    nextButton.textContent =
        "Next Level ➜";


    message.appendChild(
        heading
    );

    message.appendChild(
        replayButton
    );

    message.appendChild(
        nextButton
    );


    gameArea.appendChild(
        message
    );


    replayButton.addEventListener(
        "click",
        restartLevel1
    );

    nextButton.addEventListener(
        "click",
        showLevel2Briefing
    );
}


/* =========================
   GAME OVER / JUMPSCARE
========================= */

function endGame() {

    gameRunning = false;


    /* Hide normal gameplay */

    fruit.style.display =
        "none";

    bomb.style.display =
        "none";

    crosshair.style.display =
        "none";


    /* Show jumpscare */

    jumpscareAlien.style.display =
        "block";


    /* Restart animation */

    jumpscareAlien.style.animation =
        "none";

    void jumpscareAlien.offsetWidth;


    /* Extremely fast */

    jumpscareAlien.style.animation =
        "alienJumpscare 0.8s ease-in forwards";


    /* Play creepy sound */

    playScareSound();


    /* Show Game Over */

    setTimeout(() => {

        gameOverScreen.style.display =
            "flex";

    }, 800);
}


/* =========================
   RESTART LEVEL 1
========================= */

function restartLevel1() {

    score = 0;

    misses = 0;

    lives = 4;

    fruitSpeed = 5;

    gameRunning = true;

    levelPassed = false;

    fruitsSpawned = 0;

    bombsSpawnedThisCycle = 0;


    scoreDisplay.textContent =
        "Score: 0";

    missesDisplay.textContent =
        "Misses: 0";

    livesDisplay.textContent =
        "Lives: " +
        "❤️".repeat(lives);


    /* Restore normal alien */

    fruit.classList.remove(
        "fruit-hit"
    );

    fruit.style.display =
        "block";


    /* Restore bomb */

    bomb.style.display =
        "none";


    /* Restore crosshair */

    crosshair.style.display =
        "block";


    /* Hide jumpscare */

    jumpscareAlien.style.display =
        "none";

    jumpscareAlien.style.animation =
        "none";


    /* Remove old level message */

    const oldMessage =
        document.getElementById(
            "level-passed"
        );

    if (oldMessage) {
        oldMessage.remove();
    }


    /* Hide Game Over */

    gameOverScreen.style.display =
        "none";


    /* Start new round */

    resetFruit();
}


/* =========================
   LEVEL 2 BRIEFING
========================= */

function showLevel2Briefing() {

    const message =
        document.getElementById(
            "level-passed"
        );


    message.innerHTML = `

        <h2>⚔️ LEVEL 2</h2>

        <p>
            Two fruits will fall
            at the same time!
        </p>

        <p>
            ⏱️ Catch enough fruits
            before time runs out.
        </p>

        <p>
            ❤️ You start with 3 hearts.
        </p>

        <p>
            🏆 Beat the special record
            to earn an extra heart.
        </p>

        <p>
            ⚔️ Complete Level 2 in time
            to unlock Double Blade.
        </p>

        <p>
            <em>Are you ready?</em>
        </p>

        <button id="back-button">
            Back
        </button>

        <button id="start-level2-button">
            Start Level 2 ➜
        </button>

    `;


    document
        .getElementById("back-button")
        .addEventListener(
            "click",
            () => {

                message.remove();

                showLevelPassed();
            }
        );


    document
        .getElementById(
            "start-level2-button"
        )
        .addEventListener(
            "click",
            () => {

                message.innerHTML = `

                    <h2>
                        Level 2 is next!
                    </h2>

                    <p>
                        The briefing is ready.
                        We'll add the timer
                        and two-fruit gameplay next.
                    </p>

                    <button id="back-to-level1">
                        Back to Level 1
                    </button>

                `;


                document
                    .getElementById(
                        "back-to-level1"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            message.remove();

                            restartLevel1();

                        }
                    );
            }
        );
}


/* =========================
   BLOOD EFFECT
========================= */

function createBloodEffect(
    x,
    y
) {

    for (
        let i = 0;
        i < 15;
        i++
    ) {

        const particle =
            document.createElement(
                "div"
            );


        particle.classList.add(
            "blood-particle"
        );


        particle.style.left =
            x + "px";

        particle.style.top =
            y + "px";


        const angle =
            Math.random() *
            Math.PI *
            2;


        const distance =
            30 +
            Math.random() *
            50;


        const moveX =
            Math.cos(angle) *
            distance;


        const moveY =
            Math.sin(angle) *
            distance;


        particle.style.setProperty(
            "--move-x",
            moveX + "px"
        );

        particle.style.setProperty(
            "--move-y",
            moveY + "px"
        );


        gameArea.appendChild(
            particle
        );


        setTimeout(
            () => particle.remove(),
            400
        );
    }
}


/* =========================
   INITIAL ALIEN
========================= */

resetFruit();


/* =========================
   ALIEN + BOMB MOVEMENT
========================= */

setInterval(() => {

    if (!gameRunning) return;


    /* Bomb */

    if (
        bomb.style.display !==
        "none"
    ) {

        bomb.style.top =
            parseInt(
                bomb.style.top
            ) + 4 + "px";


        if (
            parseInt(
                bomb.style.top
            ) >= 450
        ) {

            bomb.style.display =
                "none";
        }
    }


    /* Alien */

    const speed =
        4 +
        Math.floor(
            score / 20
        );


    fruit.style.top =
        parseInt(
            fruit.style.top
        ) + speed + "px";


    /* Alien missed */

    if (
        parseInt(
            fruit.style.top
        ) >= 450
    ) {

        misses++;


        missesDisplay.textContent =
            "Misses: " +
            misses;


        lives =
            Math.max(
                0,
                lives - 1
            );


        livesDisplay.textContent =
            "Lives: " +
            "❤️".repeat(lives);


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


/* Mouse target */

gameArea.addEventListener(
    "mousemove",
    (event) => {

        const rect =
            gameArea.getBoundingClientRect();


        targetMouseX =
            event.clientX -
            rect.left;


        targetMouseY =
            event.clientY -
            rect.top;
    }
);


/* Smooth movement + scope boundary */

function smoothCrosshair() {

    const centerX = 400;

    const centerY = 250;


    const scopeRadius = 210;

    const reticleRadius = 35;


    const dx =
        targetMouseX -
        centerX;


    const dy =
        targetMouseY -
        centerY;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    let limitedX =
        targetMouseX;

    let limitedY =
        targetMouseY;


    if (
        distance >
        scopeRadius -
        reticleRadius
    ) {

        limitedX =
            centerX +
            (dx / distance) *
            (scopeRadius -
            reticleRadius);


        limitedY =
            centerY +
            (dy / distance) *
            (scopeRadius -
            reticleRadius);
    }


    /* 0.40 = current smoothness */

    crosshairX +=
        (limitedX - crosshairX) *
        0.40;


    crosshairY +=
        (limitedY - crosshairY) *
        0.40;


    crosshair.style.left =
        crosshairX + "px";


    crosshair.style.top =
        crosshairY + "px";


    requestAnimationFrame(
        smoothCrosshair
    );
}


smoothCrosshair();


/* =========================
   SHOOTING / SENSOR
========================= */

gameArea.addEventListener(
    "click",
    (event) => {

        if (!gameRunning) return;


        const rect =
            gameArea.getBoundingClientRect();


        const mouseX =
            event.clientX -
            rect.left;


        const mouseY =
            event.clientY -
            rect.top;


        const alienRect =
            fruit.getBoundingClientRect();


        const alienX =
            alienRect.left -
            rect.left +
            alienRect.width / 2;


        const alienY =
            alienRect.top -
            rect.top +
            alienRect.height / 2;


        const dx =
            mouseX -
            alienX;


        const dy =
            mouseY -
            alienY;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        /* HIT */

        if (
            distance <=
            sensorRadius
        ) {

            fruit.classList.add(
                "fruit-hit"
            );


            score++;


            scoreDisplay.textContent =
                "Score: " +
                score;


            /* Blood */

            createBloodEffect(
                alienX,
                alienY
            );


            /* Hit sound */

            if (
                hitSound.state ===
                "suspended"
            ) {

                hitSound.resume();
            }


            const oscillator =
                hitSound.createOscillator();


            const gainNode =
                hitSound.createGain();


            oscillator.frequency.value =
                600;


            gainNode.gain.value =
                0.1;


            oscillator.connect(
                gainNode
            );


            gainNode.connect(
                hitSound.destination
            );


            oscillator.start();


            oscillator.stop(
                hitSound.currentTime +
                0.1
            );


            /* +1 */

            const points =
                document.createElement(
                    "div"
                );


            points.textContent =
                "+1";


            points.classList.add(
                "points-popup"
            );


            points.style.left =
                alienX + "px";


            points.style.top =
                alienY + "px";


            gameArea.appendChild(
                points
            );


            setTimeout(
                () => points.remove(),
                500
            );


            /* Level complete */

            if (
                score >=
                targetScore
            ) {

                showLevelPassed();

                return;
            }


            /* Next alien */

            setTimeout(
                () => {

                    fruit.classList.remove(
                        "fruit-hit"
                    );


                    if (gameRunning) {

                        resetFruit();
                    }

                },
                200
            );


        } else {

            /* MISS */

            misses++;


            missesDisplay.textContent =
                "Misses: " +
                misses;
        }

    }
);


/* =========================
   BOMB
========================= */

bomb.addEventListener(
    "click",
    () => {

        if (
            !gameRunning ||
            bomb.style.display ===
            "none"
        ) {
            return;
        }


        gameRunning = false;

        bomb.style.display =
            "none";


        gameArea.classList.add(
            "game-shake"
        );


        setTimeout(
            () => {

                gameArea.classList.remove(
                    "game-shake"
                );

                endGame();

            },
            300
        );
    }
);


/* =========================
   RESTART BUTTON
========================= */

restartButton.addEventListener(
    "click",
    restartLevel1
);