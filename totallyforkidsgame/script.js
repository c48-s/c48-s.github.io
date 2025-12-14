// --- Game Configuration ---
const PLAYER_SPEED = 5;
const CAR_SPEED = 8; // Cars should be faster!
const container = document.getElementById('game-container');
const player = document.getElementById('player');
const car = document.getElementById('car');

// --- Game State Variables ---
let playerX = 400;
let playerY = 300;
let carX = 450;
let carY = 250;
let isInCar = false; // NEW: Tracks if the player is driving

// Set initial positions
player.style.left = playerX + 'px';
player.style.top = playerY + 'px';
car.style.left = carX + 'px';
car.style.top = carY + 'px';

// Object to track which keys are currently pressed
const keys = {};

// --- Event Listeners for Input ---

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    // Check for the 'E' key (Interaction key)
    if (key === 'e') {
        handleInteraction();
    }
    
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        keys[key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys[key]) {
        keys[key] = false;
    }
});

// --- Collision and Interaction Logic ---

function isColliding(element1, element2) {
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();

    // Check for collision based on the element's screen position
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

function handleInteraction() {
    if (isInCar) {
        // Exit the car
        isInCar = false;
        player.style.display = 'block'; // Make player visible
        
        // Place the player slightly beside the car (e.g., to the right)
        playerX = carX + car.clientWidth + 5; 
        playerY = carY + car.clientHeight / 2;
        console.log("Exited the car! Walk away, Franklin.");
        
        // Reset the car's appearance
        car.style.backgroundColor = '#ff3333';
        
    } else if (isColliding(player, car)) {
        // Enter the car
        isInCar = true;
        player.style.display = 'none'; // Hide the player inside the car
        console.log("Entered the car! Vroom Vroom.");
        
        // Change car color to show it's "active"
        car.style.backgroundColor = '#00ff00';
    }
}


// --- Game Loop (The Engine) ---

function updateGame() {
    let newX = isInCar ? carX : playerX;
    let newY = isInCar ? carY : playerY;
    const currentSpeed = isInCar ? CAR_SPEED : PLAYER_SPEED;
    const movableElement = isInCar ? car : player;
    
    // Determine the size of the element being moved for boundary checks
    const elementSize = movableElement.clientWidth; 

    // --- Movement Calculation ---
    if (keys['w'] || keys['arrowup']) {
        newY -= currentSpeed;
    }
    if (keys['s'] || keys['arrowdown']) {
        newY += currentSpeed;
    }
    if (keys['a'] || keys['arrowleft']) {
        newX -= currentSpeed;
    }
    if (keys['d'] || keys['arrowright']) {
        newX += currentSpeed;
    }
    
    // --- Boundary Checking (Keep element within the container) ---
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (newX < 0) newX = 0;
    if (newX > containerWidth - elementSize) newX = containerWidth - elementSize;
    if (newY < 0) newY = 0;
    if (newY > containerHeight - elementSize) newY = containerHeight - elementSize;
    
    
    // --- Update Positions ---
    if (isInCar) {
        carX = newX;
        carY = newY;
        car.style.left = carX + 'px';
        car.style.top = carY + 'px';
        
    } else {
        playerX = newX;
        playerY = newY;
        player.style.left = playerX + 'px';
        player.style.top = playerY + 'px';
        
        // Visual indicator when player is near the car (pre-interaction)
        if (isColliding(player, car)) {
            car.style.border = '2px solid yellow'; // Highlight car when nearby
        } else {
            car.style.border = '2px solid #000';
        }
    }

    // Request the next frame for smooth animation
    requestAnimationFrame(updateGame);
}

// Start the game loop
requestAnimationFrame(updateGame);
