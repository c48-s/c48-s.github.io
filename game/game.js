// --- 1. Setup Canvas and Context ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedDisplay = document.getElementById('speedDisplay');

// --- 2. Game Variables ---
let keys = {}; // Object to track which keys are currently pressed
let lastTime = 0; // For calculating time difference (delta time)

// Car Object
const car = {
    x: canvas.width / 2, // Start in the middle
    y: canvas.height - 50, // Start near the bottom
    width: 20,
    height: 40,
    color: 'red',
    speed: 0,
    maxSpeed: 5,
    acceleration: 0.1,
    deceleration: 0.05,
    turnSpeed: 0.05,
    angle: Math.PI / 2, // 90 degrees (pointing up)
};

// --- 3. Input Handling ---

// Listen for key presses and releases
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --- 4. Game Logic (Update) ---

function update(deltaTime) {
    // A) Apply Acceleration/Deceleration based on input
    if (keys['ArrowUp']) {
        // Accelerate up to max speed
        car.speed = Math.min(car.maxSpeed, car.speed + car.acceleration);
    } else if (keys['ArrowDown']) {
        // Brake/Reverse
        car.speed = Math.max(-car.maxSpeed / 2, car.speed - car.acceleration);
    } else {
        // Natural deceleration (friction)
        if (car.speed > 0) {
            car.speed = Math.max(0, car.speed - car.deceleration);
        } else if (car.speed < 0) {
            car.speed = Math.min(0, car.speed + car.deceleration);
        }
    }

    // B) Apply Turning based on input (only if moving)
    if (car.speed !== 0) {
        if (keys['ArrowLeft']) {
            car.angle -= car.turnSpeed;
        }
        if (keys['ArrowRight']) {
            car.angle += car.turnSpeed;
        }
    }

    // C) Update Position based on speed and angle
    // Note: In 2D graphics, angle 0 is usually pointing right (+X axis)
    // We adjust by subtracting PI/2 so 0 is up (Y axis) for intuitive steering.
    car.x += car.speed * Math.cos(car.angle - Math.PI / 2);
    car.y += car.speed * Math.sin(car.angle - Math.PI / 2);

    // D) Keep the car within the canvas boundaries (optional, simple wall collision)
    if (car.x < 0) car.x = 0;
    if (car.x > canvas.width) car.x = canvas.width;
    if (car.y < 0) car.y = 0;
    if (car.y > canvas.height) car.y = canvas.height;
}

// --- 5. Drawing (Render) ---

function draw() {
    // 1. Clear the entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the road (Simple center path)
    ctx.fillStyle = '#AAAAAA'; // Grey
    ctx.fillRect(canvas.width / 4, 0, canvas.width / 2, canvas.height);

    // 2. Translate and Rotate the canvas context for the car
    ctx.save(); // Save the current (default) canvas state

    // Move the origin to the car's position
    ctx.translate(car.x, car.y);

    // Rotate the canvas by the car's angle
    ctx.rotate(car.angle);

    // 3. Draw the Car (centered on the new origin)
    ctx.fillStyle = car.color;
    // We draw the rectangle centered by offsetting x and y by half of width/height
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    
    // Draw a small light/indicator to show which way is "forward"
    ctx.fillStyle = 'yellow';
    ctx.fillRect(-car.width / 4, -car.height / 2, car.width / 2, 5);


    ctx.restore(); // Restore the canvas state (undo the translate/rotate)

    // 4. Update the statistics display
    speedDisplay.textContent = car.speed.toFixed(2);
}

// --- 6. The Game Loop ---

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Call update and draw functions
    update(deltaTime);
    draw();

    // Request the browser to call gameLoop again before the next redraw (typically 60 times/sec)
    requestAnimationFrame(gameLoop);
}

// Start the loop!
requestAnimationFrame(gameLoop);
