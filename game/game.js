// --- Global State & Setup (UNCHANGED) ---
// ... (All existing variables like GAME_STATE, scene, camera, renderer, etc.) ...
// ... (CAR_DEFS array with the Pink Pacer is confirmed here) ...

// --- Game Menu and State Control (RECONFIRMED) ---

function populateMenu() {
    const menuDiv = document.getElementById('carSelection');
    menuDiv.innerHTML = '';
    
    CAR_DEFS.forEach((def, index) => {
        const div = document.createElement('div');
        div.className = 'car-option';
        div.textContent = def.name;
        
        // Use the hexadecimal string representation of the color for the background
        const hexColor = `#${def.color.toString(16).padStart(6, '0')}`;
        div.style.backgroundColor = hexColor;
        div.style.color = (def.color === 0xff69b4) ? 'black' : 'white'; // Set text color for visibility
        
        div.onclick = () => {
            selectedCarIndex = index;
            // Remove 'selected' class from all options
            document.querySelectorAll('.car-option').forEach(el => el.classList.remove('selected'));
            // Add 'selected' class to the clicked option
            div.classList.add('selected');
        };
        menuDiv.appendChild(div);
        
        if (index === 0) div.classList.add('selected'); // Default selection
    });
}

// NOTE: This function is called via the "Start Race" button's `onclick="startGame()"` attribute in index.html.
function startGame() {
    if (currentState === GAME_STATE.RUNNING) return;

    // 1. Clear previous cars and scene objects
    cars.forEach(c => scene.remove(c.mesh));
    cars = [];

    // 2. Initialize Player Car based on 'selectedCarIndex'
    const playerDef = CAR_DEFS[selectedCarIndex];
    cars.push(createCar(playerDef, false, 0)); 

    // 3. Initialize ALL other definitions as AI Opponents
    let aiStartIndex = 1;
    CAR_DEFS.forEach((def, index) => {
        if (index !== selectedCarIndex) { // If the car is NOT the one the player chose
            const newCar = createCar(def, true, aiStartIndex * 2); 
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
    
    // Reset camera to ensure a smooth start view
    const playerCar = cars.find(c => !c.isAI);
    if (playerCar) {
        camera.position.set(playerCar.mesh.position.x, playerCar.mesh.position.y + 10, playerCar.mesh.position.z - 15);
        camera.lookAt(playerCar.mesh.position);
    }
}


// --- Initialization (CONFIRMED) ---

function init() {
    // ... (Existing setup: renderer, camera, event listeners, lighting, etc.) ...
    
    // Setup Environment (Crucial for visuals)
    createSkybox();
    setupLighting(); 
    create3DTrack();
    addForestScenery();
    addFakeBuildings();

    // SETUP MENU LOGIC BEFORE STARTING ANIMATION
    populateMenu();
    
    // Window Resize and Keyboard Listeners
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    window.addEventListener('keydown', (e) => { keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    
    // START THE ANIMATION LOOP
    animate();
}

// EXECUTE THE INITIALIZATION FUNCTION ONCE THE SCRIPT IS LOADED
init();
