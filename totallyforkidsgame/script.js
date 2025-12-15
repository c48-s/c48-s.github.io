// Select elements from the DOM
const scoreDisplay = document.querySelector('.score');
const gameArea = document.querySelector('.gameArea');
const car = document.querySelector('.car');
const startBtn = document.getElementById('startBtn');

// Game variables
let gamePlaying = false;
let score = 0;
let keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, a: false, d: false };

// Event listeners
startBtn.addEventListener('click', startGame);
document.addEventListener('keydown', pressOn);
document.addEventListener('keyup', pressOff);

function pressOn(e) {
    e.preventDefault();
    if (e.key in keys) {
        keys[e.key] = true;
    }
    // Also support A/D keys
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
}

function pressOff(e) {
    e.preventDefault();
    if (e.key in keys) {
        keys[e.key] = false;
    }
    // Also support A/D keys
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
}

// Function to check collision
function isCollide(a, b) {
    // Get bounds of the two elements
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    
    // Check if bounds overlap
    return !(
        (aRect.bottom < bRect.top) ||
        (aRect.top > bRect.bottom) ||
        (aRect.right < bRect.left) ||
        (aRect.left > bRect.right)
    );
}

// Function to move the road lines
function moveLines() {
    let lines = document.querySelectorAll('.line');
    lines.forEach(function(item) {
        if (item.y >= 500) {
            item.y -= 550;
        }
        item.y += 5; // Speed of the road movement
        item.style.top = item.y + "px";
    });
}

// Function to move enemy cars
function moveEnemy(carElem) {
    let enemies = document.querySelectorAll('.enemy');
    enemies.forEach(function(item) {
        if (isCollide(carElem, item)) {
            endGame();
        }

        if (item.y >= 500) {
            item.y = -100;
            item.style.left = Math.floor(Math.random() * 250) + "px"; // Random horizontal position
        }
        item.y += 6; // Speed of enemy movement
        item.style.top = item.y + "px";
    });
}

// Main game loop
function gamePlay() {
    if (gamePlaying) {
        moveLines();
        moveEnemy(car);

        let road = gameArea.getBoundingClientRect();
        
        // Move car horizontally based on key presses
        if ((keys.ArrowLeft || keys.a) && car.offsetLeft > 0) {
            car.style.left = (car.offsetLeft - 5) + "px";
        }
        if ((keys.ArrowRight || keys.d) && car.offsetLeft < (road.width - car.offsetWidth)) {
            car.style.left = (car.offsetLeft + 5) + "px";
        }

        score++;
        scoreDisplay.innerText = "Score: " + score;
        
        // Request the next animation frame
        requestAnimationFrame(gamePlay);
    }
}

// Function to start the game
function startGame() {
    gameArea.innerHTML = ''; // Clear previous elements
    startBtn.style.display = 'none';
    car.style.left = '125px'; // Reset car position
    gamePlaying = true;
    score = 0;

    // Create road lines
    for (let i = 0; i < 5; i++) {
        let line = document.createElement('div');
        line.setAttribute('class', 'line');
        line.y = (i * 120);
        line.style.top = line.y + "px";
        gameArea.appendChild(line);
    }

    // Create enemy cars
    for (let i = 0; i < 3; i++) {
        let enemy = document.createElement('div');
        enemy.setAttribute('class', 'enemy');
        enemy.y = ((i + 1) * 350) * -1; // Start enemies off-screen
        enemy.style.top = enemy.y + "px";
        enemy.style.left = Math.floor(Math.random() * 250) + "px";
        gameArea.appendChild(enemy);
    }

    // Append car and score display back to the game area after clearing it
    gameArea.appendChild(scoreDisplay);
    gameArea.appendChild(car);

    requestAnimationFrame(gamePlay);
}

// Function to end the game
function endGame() {
    gamePlaying = false;
    startBtn.style.display = 'block';
    startBtn.innerText = "Game Over. Your final score was " + score + ". Click to restart.";
}
