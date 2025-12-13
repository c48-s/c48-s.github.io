// --- 1. Setup Canvas and Context (Existing) ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedDisplay = document.getElementById('speedDisplay');

// --- 2. Game Variables (Modified/Added) ---

// Track definition (Outer boundary, Inner boundary, and Waypoints)
// Each point is [x, y]
const TRACK_WIDTH = 60;
const TRACK_OUTER = [
    [50, 50], [750, 50], [750, 450], [50, 450], [50, 50] // Simple square for now
];

// Let's create a slightly more complex track (U-shape)
const TRACK_POINTS = [
    [100, 100], [700, 100], [700, 400], [100, 400], [100, 100] // Simple rectangle
];

// Waypoints for AI and Lap Counting (must follow the track)
const WAYPOINTS = [
    [150, 150], // Start/Finish Line area
    [650, 150],
    [650, 350],
    [150, 350]
];

const NUM_LAPS = 3;
let playerLaps = 0;
let nextWaypointIndex = 0;
let isGameRunning = true;


// Car Objects (Player and AI)
const playerCar = {
    x: WAYPOINTS[0][0],
    y: WAYPOINTS[0][1],
    width: 20,
    height: 40,
    color: 'red',
    speed: 0,
    maxSpeed: 5,
    acceleration: 0.1,
    deceleration: 0.05,
    turnSpeed: 0.05,
    angle: Math.PI / 2, // 90 degrees (pointing up)
    lastWaypointHit: 0,
    laps: 0
};

const aiCar = {
    x: WAYPOINTS[0][0] - 50, // Start next to player
    y: WAYPOINTS[0][1],
    width: 20,
    height: 40,
    color: 'blue',
    speed: 3,
    maxSpeed: 4.5,
    turnSpeed: 0.04,
    angle: Math.PI / 2, 
    currentWaypoint: 0
};


let keys = {}; // Object to track which keys are currently pressed
let lastTime = 0; 
const distance = (p1, p2) => Math.hypot(p1.x - p2[0], p1.y - p2[1]);
// ... (Input Handling remains the same) ...

// --- 3. Input Handling (Existing) ---
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});


// --- 4. Helper Functions (New) ---

/**
 * Updates the position and angle of a car based on inputs or AI logic.
 * @param {object} car - The car object (playerCar or aiCar).
 * @param {number} angleChange - The amount to change the angle by (from input or AI).
 * @param {number} speedChange - The amount to change the speed by (from input or AI).
 */
function moveCar(car, angleChange, speedChange) {
    // A) Update Speed
    car.speed = Math.max(-car.maxSpeed / 2, Math.min(car.maxSpeed, car.speed + speedChange));
    
    // B) Apply Turning (only if moving)
    if (car.speed !== 0) {
        car.angle += angleChange;
    }

    // C) Apply Natural Deceleration (Friction) if no input
    if (speedChange === 0) {
        if (car.speed > 0) {
            car.speed = Math.max(0, car.speed - playerCar.deceleration);
        } else if (car.speed < 0) {
            car.speed = Math.min(0, car.speed + playerCar.deceleration);
        }
    }

    // D) Update Position
    car.x += car.speed * Math.cos(car.angle - Math.PI / 2);
    car.y += car.speed * Math.sin(car.angle - Math.PI / 2);
}

/**
 * Handles the AI driving logic for the aiCar.
 */
function updateAI() {
    const targetWaypoint = WAYPOINTS[aiCar.currentWaypoint];
    const dx = targetWaypoint[0] - aiCar.x;
    const dy = targetWaypoint[1] - aiCar.y;

    // 1. Calculate the required angle to face the target
    // The angle from the car's position to the waypoint
    let targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
    
    // Normalize angles to be between 0 and 2*PI
    const normalizeAngle = (angle) => (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    let currentAngle = normalizeAngle(aiCar.angle);
    targetAngle = normalizeAngle(targetAngle);

    // 2. Calculate the difference between the current angle and the target angle
    let angleDifference = targetAngle - currentAngle;
    
    // Correct angle difference to find the shortest path (e.g., instead of turning 300 degrees, turn -60)
    if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
    if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

    // 3. Determine turn direction
    let turnAmount = 0;
    if (Math.abs(angleDifference) > 0.1) { // Apply turning if difference is significant
        turnAmount = Math.sign(angleDifference) * aiCar.turnSpeed;
    }

    // 4. Determine speed/acceleration
    let speedChange = 0;
    const dist = Math.hypot(dx, dy);

    if (dist < 50) {
        // Slow down for tight turns or approaching waypoint
        speedChange = -0.1;
    } else {
        // Accelerate
        speedChange = 0.1;
    }

    // 5. Apply Movement
    moveCar(aiCar, turnAmount, speedChange);

    // 6. Check for Waypoint Hit
    if (dist < 30) { 
        aiCar.currentWaypoint = (aiCar.currentWaypoint + 1) % WAYPOINTS.length;
    }
}


/**
 * Handles player input and movement.
 */
function updatePlayer() {
    let speedChange = 0;
    let turnAmount = 0;

    if (keys['ArrowUp']) {
        speedChange = playerCar.acceleration;
    } else if (keys['ArrowDown']) {
        speedChange = -playerCar.acceleration;
    }

    if (keys['ArrowLeft']) {
        turnAmount = -playerCar.turnSpeed;
    }
    if (keys['ArrowRight']) {
        turnAmount = playerCar.turnSpeed;
    }
    
    // If no acceleration input, friction applies in moveCar
    if (!keys['ArrowUp'] && !keys['ArrowDown']) {
        speedChange = 0;
    }
    
    moveCar(playerCar, turnAmount, speedChange);
}


/**
 * Handles lap counting and waypoint detection.
 */
function updateLapCount() {
    const waypointRadius = 25; // How close car must be to hit waypoint

    // Check for the next player waypoint
    const nextWaypoint = WAYPOINTS[playerCar.lastWaypointHit];
    if (distance(playerCar, nextWaypoint) < waypointRadius) {
        
        // Check if the player crossed the finish line (first waypoint)
        if (playerCar.lastWaypointHit === WAYPOINTS.length - 1) { // Hit the last waypoint
            
            // Now, check if they are close to the first (start) waypoint
            if (distance(playerCar, WAYPOINTS[0]) < waypointRadius) {
                playerCar.laps++;
                playerCar.lastWaypointHit = 0; // Reset for the next lap
                
                if (playerCar.laps >= NUM_LAPS) {
                    isGameRunning = false;
                    alert(`🏁 Player Wins! Finished ${NUM_LAPS} laps!`);
                }
            }
            
        } else {
            // Hit an inner waypoint, move to the next one in the sequence
            playerCar.lastWaypointHit = (playerCar.lastWaypointHit + 1) % WAYPOINTS.length;
        }
    }
}

// --- 5. Game Logic (Update) ---

function update(deltaTime) {
    if (!isGameRunning) return;

    updatePlayer();
    updateAI();
    updateLapCount();

    // Check Win Condition (Simple AI win for now)
    if (aiCar.currentWaypoint === 0 && aiCar.laps >= NUM_LAPS) {
         isGameRunning = false;
         alert(`🤖 AI Wins! Finished ${NUM_LAPS} laps!`);
    }
}


// --- 6. Drawing (Render) ---

function draw() {
    // 1. Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. Draw the Track Background (Green)
    ctx.fillStyle = '#55aa55'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Draw the Road (Grey) based on the TRACK_POINTS
    ctx.beginPath();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = TRACK_WIDTH * 2; // Road width is twice the defined TRACK_WIDTH
    ctx.lineJoin = 'round'; // Makes corners smooth
    
    // Move to the first point
    ctx.moveTo(TRACK_POINTS[0][0], TRACK_POINTS[0][1]);
    
    // Draw lines to all subsequent points
    for (let i = 1; i < TRACK_POINTS.length; i++) {
        ctx.lineTo(TRACK_POINTS[i][0], TRACK_POINTS[i][1]);
    }
    ctx.stroke();

    // 4. Draw Waypoints (for debugging/visualization)
    ctx.fillStyle = 'yellow';
    WAYPOINTS.forEach(([x, y], index) => {
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.fillText(index, x - 3, y + 3);
        ctx.fillStyle = 'yellow';
    });

    // 5. Draw the Cars
    drawCar(playerCar);
    drawCar(aiCar);

    // 6. Update the statistics display
    speedDisplay.innerHTML = `
        Speed: **${playerCar.speed.toFixed(2)}** | 
        Player Laps: **${playerCar.laps}/${NUM_LAPS}** (Next WP: ${playerCar.lastWaypointHit}) |
        AI Laps: **${aiCar.laps}/${NUM_LAPS}**
    `;
}

/**
 * Draws a car at its current position and rotation.
 */
function drawCar(car) {
    // Save the current (default) canvas state
    ctx.save(); 

    // Move the origin to the car's position
    ctx.translate(car.x, car.y);

    // Rotate the canvas by the car's angle
    ctx.rotate(car.angle);

    // Draw the Car (centered on the new origin)
    ctx.fillStyle = car.color;
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    
    // Draw a small light/indicator to show which way is "forward"
    ctx.fillStyle = 'yellow';
    ctx.fillRect(-car.width / 4, -car.height / 2, car.width / 2, 5);

    // Restore the canvas state (undo the translate/rotate)
    ctx.restore(); 
}

// --- 7. The Game Loop (Existing) ---

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start the loop!
requestAnimationFrame(gameLoop);
