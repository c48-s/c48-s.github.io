// --- Game Constants & Assets (UPDATED) ---

const MAX_SPEED = 55;

// ADDED the pink car and adjusted the default colors/speeds
const CAR_DEFS = [
    { name: "The Racer (Red)", color: 0xff0000, maxSpeed: MAX_SPEED, acceleration: 0.5, turnSpeed: 0.05 },
    { name: "The Cruiser (Blue)", color: 0x0000ff, maxSpeed: MAX_SPEED * 0.9, acceleration: 0.45, turnSpeed: 0.04 },
    { name: "The Green Beast", color: 0x00ff00, maxSpeed: MAX_SPEED * 0.8, acceleration: 0.4, turnSpeed: 0.06 },
    // ** NEW PINK CAR ADDED **
    { name: "The Pink Aurora", color: 0xff69b4, maxSpeed: MAX_SPEED * 38, acceleration: 1.55, turnSpeed: 1.045 }
];

let cars = []; 
// ... (All other global variables remain the same) ...


// --- Game Menu and State Control (UPDATED) ---

function populateMenu() {
    const menuDiv = document.getElementById('carSelection');
    menuDiv.innerHTML = '';
    
    CAR_DEFS.forEach((def, index) => {
        const div = document.createElement('div');
        div.className = 'car-option';
        div.textContent = def.name;
        // Use the hexadecimal string representation of the color for the background
        div.style.backgroundColor = `#${def.color.toString(16).padStart(6, '0')}`;
        div.style.color = (def.color === 0xff69b4) ? 'black' : 'white'; // Black text on pink car for visibility
        div.onclick = () => {
            selectedCarIndex = index;
            document.querySelectorAll('.car-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
        };
        menuDiv.appendChild(div);
        if (index === 0) div.classList.add('selected'); // Default selection
    });
}

function startGame() {
    if (currentState === GAME_STATE.RUNNING) return;

    // 1. Clear previous cars from the scene
    cars.forEach(c => scene.remove(c.mesh));
    cars = [];

    // 2. Initialize Player Car based on 'selectedCarIndex'
    const playerDef = CAR_DEFS[selectedCarIndex];
    cars.push(createCar(playerDef, false, 0)); // Start at waypoint 0 (Player)

    // 3. Initialize AI Opponents (using ALL other definitions, excluding the player's choice)
    let aiStartIndex = 1;
    CAR_DEFS.forEach((def, index) => {
        if (index !== selectedCarIndex) { // Only add if it's NOT the player's selected car
            const newCar = createCar(def, true, aiStartIndex * 2); // Stagger start positions more widely
            cars.push(newCar);
            aiStartIndex++;
        }
    });

    // 4. Add all new cars to the scene
    cars.forEach(c => scene.add(c.mesh));

    // 5. Hide menu, show UI, and set state
    document.getElementById('menu').style.display = 'none';
    document.getElementById('stats').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
    currentState = GAME_STATE.RUNNING;
    
    // Reset camera to default view
    currentCameraIndex = 0;
    // Position the camera to start behind the player car
    const playerCar = cars.find(c => !c.isAI);
    if (playerCar) {
        camera.position.set(playerCar.mesh.position.x, playerCar.mesh.position.y + 10, playerCar.mesh.position.z + 50);
        camera.lookAt(playerCar.mesh.position);
    }
}

// ... (Rest of the file, including init() at the bottom, remains the same) ...
    animate();
}

init();
