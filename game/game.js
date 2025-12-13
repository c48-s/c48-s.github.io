// --- Global State ---
const GAME_STATE = { INIT: 0, RUNNING: 1, FINISHED: 2 };
let currentState = GAME_STATE.INIT;
let selectedCarIndex = 0;
let keys = {};

// --- Three.js Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow maps for realism
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
document.body.appendChild(renderer.domElement);

// --- Game Constants & Assets ---
const MAX_SPEED = 20;
const CAR_DEFS = [
    { name: "The Racer (Red)", color: 0xff0000, maxSpeed: MAX_SPEED, acceleration: 0.5, turnSpeed: 0.05 },
    { name: "The Cruiser (Blue)", color: 0x0000ff, maxSpeed: MAX_SPEED * 0.9, acceleration: 0.45, turnSpeed: 0.04 },
    { name: "The Green Beast", color: 0x00ff00, maxSpeed: MAX_SPEED * 0.8, acceleration: 0.4, turnSpeed: 0.06 }
];

let cars = []; // Array to hold car objects (mesh + state)

// Camera Offsets (for easy switching)
const CAMERA_OFFSETS = [
    { name: 'Third Person', pos: new THREE.Vector3(0, 5, -15), look: new THREE.Vector3(0, 3, 0) }, // Behind and Above
    { name: 'Hood View', pos: new THREE.Vector3(0, 1.5, 5), look: new THREE.Vector3(0, 1.5, 10) }, // First Person
    { name: 'Top Down', pos: new THREE.Vector3(0, 50, 0), look: new THREE.Vector3(0, 0, 0) }      // Overhead
];
let currentCameraIndex = 0;

// Track Waypoints (Much more complex, includes elevation for 3D realism)
const TRACK_WAYPOINTS_3D = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(150, 0, 0),
    new THREE.Vector3(200, 5, -50), // Hill up
    new THREE.Vector3(150, 10, -100),
    new THREE.Vector3(0, 10, -150),
    new THREE.Vector3(-100, 8, -100), // Turn while going down slightly
    new THREE.Vector3(-150, 0, -50),
    new THREE.Vector3(-100, -5, 0), // Dip/bridge
    new THREE.Vector3(-50, 0, 50),
    new THREE.Vector3(0, 0, 0)
];
const trackCurve = new THREE.CatmullRomCurve3(TRACK_WAYPOINTS_3D, true, 'centripetal');


// --- Asset Loading (Textures) ---
const textureLoader = new THREE.TextureLoader();

function createTrackMaterial() {
    const asphaltTexture = textureLoader.load('https://threejs.org/examples/textures/hardwood_diffuse.jpg');
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(50, 50); // Repeat the texture many times for tiling

    return new THREE.MeshPhongMaterial({
        map: asphaltTexture,
        side: THREE.DoubleSide
    });
}

function create3DTrack() {
    const trackWidth = 8;
    const tubeGeometry = new THREE.TubeGeometry(trackCurve, 200, trackWidth, 16, true);
    const trackMaterial = createTrackMaterial();
    
    const trackMesh = new THREE.Mesh(tubeGeometry, trackMaterial);
    trackMesh.receiveShadow = true; // Track receives shadows
    scene.add(trackMesh);

    // Add a huge ground plane
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x44aa44, side: THREE.DoubleSide });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.5; // Slightly below track
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
}


function setupLighting() {
    // Ambient Light (soft background light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Directional Light (Simulates the Sun, casts shadows)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(200, 300, 100);
    sunLight.castShadow = true;

    // Shadow properties for realistic shadows
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 700;
    sunLight.shadow.camera.left = -300;
    sunLight.shadow.camera.right = 300;
    sunLight.shadow.camera.top = 300;
    sunLight.shadow.camera.bottom = -300;

    scene.add(sunLight);
}


/**
 * Creates a car mesh (box) and initializes its state.
 */
function createCar(definition, isAI, startIndex) {
    const carGeometry = new THREE.BoxGeometry(2, 1.5, 4); // Smaller, more realistic dimensions
    const carMaterial = new THREE.MeshPhongMaterial({ color: definition.color });
    const carMesh = new THREE.Mesh(carGeometry, carMaterial);
    
    carMesh.castShadow = true; // Car casts shadows
    carMesh.position.y = 0.75; // Half of height

    // Find starting position on the track
    const startPos = trackCurve.getPointAt(startIndex / TRACK_WAYPOINTS_3D.length);
    carMesh.position.copy(startPos);

    return {
        mesh: carMesh,
        speed: 0,
        maxSpeed: definition.maxSpeed,
        acceleration: definition.acceleration,
        turnSpeed: definition.turnSpeed,
        angle: 0,
        isAI: isAI,
        currentWaypoint: startIndex,
        laps: 0,
        lastWaypointDistance: Infinity // For lap tracking
    };
}


// --- Game Menu and State Control ---

function populateMenu() {
    const menuDiv = document.getElementById('carSelection');
    menuDiv.innerHTML = '';
    
    CAR_DEFS.forEach((def, index) => {
        const div = document.createElement('div');
        div.className = 'car-option';
        div.textContent = def.name;
        div.style.backgroundColor = `#${def.color.toString(16).padStart(6, '0')}`;
        div.style.color = 'white';
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

    // 1. Clear previous cars
    cars.forEach(c => scene.remove(c.mesh));
    cars = [];

    // 2. Initialize Player Car
    const playerDef = CAR_DEFS[selectedCarIndex];
    cars.push(createCar(playerDef, false, 0)); // Start at waypoint 0

    // 3. Initialize AI Opponents (using the other two definitions)
    const availableAI = CAR_DEFS.filter((_, i) => i !== selectedCarIndex);
    availableAI.forEach((def, i) => {
        const newCar = createCar(def, true, i + 1); // Stagger start positions
        cars.push(newCar);
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
    camera.position.set(0, 10, 50);
}


// --- Car Physics and AI ---

function updateInput(car) {
    let speedChange = 0;
    let angleChange = 0;

    if (keys['ArrowUp'] || keys['KeyW']) {
        speedChange = car.acceleration;
    } else if (keys['ArrowDown'] || keys['KeyS']) {
        speedChange = -car.acceleration / 2;
    } else {
        // Friction/Deceleration
        if (car.speed > 0) car.speed = Math.max(0, car.speed - 0.2);
        if (car.speed < 0) car.speed = Math.min(0, car.speed + 0.2);
    }

    car.speed = Math.max(-10, Math.min(car.maxSpeed, car.speed + speedChange));

    if (car.speed !== 0) {
        if (keys['ArrowLeft'] || keys['KeyA']) angleChange = car.turnSpeed;
        if (keys['ArrowRight'] || keys['KeyD']) angleChange = -car.turnSpeed;
    }
    car.angle += angleChange;
}

function updateAI(car) {
    const waypointIndex = car.currentWaypoint % TRACK_WAYPOINTS_3D.length;
    const targetPoint = TRACK_WAYPOINTS_3D[waypointIndex];
    
    const dx = targetPoint.x - car.mesh.position.x;
    const dz = targetPoint.z - car.mesh.position.z;
    const dist = Math.hypot(dx, dz);

    // Target Angle (yaw rotation in 3D is on the Y-axis)
    let targetAngle = Math.atan2(dx, dz);
    let angleDifference = targetAngle - car.angle;

    // Normalize angle difference for shortest path
    if (angleDifference > Math.PI) angleDifference -= 2 * Math.PI;
    if (angleDifference < -Math.PI) angleDifference += 2 * Math.PI;

    // Apply turning
    if (Math.abs(angleDifference) > 0.05) {
        car.angle += Math.sign(angleDifference) * car.turnSpeed * (dist > 50 ? 1 : 0.5); // Turn slower when close
    }
    
    // Apply speed based on distance and max speed
    let targetSpeed = car.maxSpeed;
    if (dist < 40) targetSpeed = car.maxSpeed * 0.5; // Slow down for corners

    if (car.speed < targetSpeed) car.speed += car.acceleration / 2;
    if (car.speed > targetSpeed) car.speed -= car.acceleration / 2;

    // Advance Waypoint
    if (dist < 15) {
        car.currentWaypoint++;
    }
}

function updateCarMovement(car) {
    // Movement based on speed and angle
    const velocityX = car.speed * Math.sin(car.angle);
    const velocityZ = car.speed * Math.cos(car.angle);
    
    car.mesh.position.x += velocityX;
    car.mesh.position.z += velocityZ;

    // Apply rotation to mesh
    car.mesh.rotation.y = car.angle;

    // Simple vertical (Y-axis) adjustment for terrain (very basic)
    car.mesh.position.y = 0.75; // Keep car roughly on the ground plane
}

function updateLapCounting(car) {
    // Lap counting uses the total number of waypoints passed.
    const waypointCount = TRACK_WAYPOINTS_3D.length;
    car.laps = Math.floor(car.currentWaypoint / waypointCount);
    
    if (car.laps >= 3 && car.isAI) { // AI Win condition
        currentState = GAME_STATE.FINISHED;
        alert(`${car.mesh.material.color.getStyle().toUpperCase()} Car Wins!`);
    }

    if (car.laps >= 3 && !car.isAI) { // Player Win condition
        currentState = GAME_STATE.FINISHED;
        alert(`Player Wins! Finished 3 Laps!`);
    }
}


// --- Camera & UI ---

function switchCamera() {
    currentCameraIndex = (currentCameraIndex + 1) % CAMERA_OFFSETS.length;
}

function updateCamera(player) {
    const offset = CAMERA_OFFSETS[currentCameraIndex];
    const carPos = player.mesh.position;
    
    const worldOffset = offset.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), player.angle);
    camera.position.copy(carPos).add(worldOffset);
    
    // Calculate the point the camera should look at (relative to the car)
    const lookAtPoint = carPos.clone().add(offset.look.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), player.angle));
    
    camera.lookAt(lookAtPoint);
}

function updateUI(player) {
    document.getElementById('speedDisplay').textContent = (player.speed * 3.6).toFixed(1); // Convert units/frame to roughly km/h
    document.getElementById('lapDisplay').textContent = `${player.laps}/3`;
}


// --- Game Loop ---

function animate() {
    requestAnimationFrame(animate);

    if (currentState === GAME_STATE.RUNNING) {
        const playerCar = cars.find(c => !c.isAI);
        
        cars.forEach(car => {
            if (car.isAI) {
                updateAI(car);
            } else {
                updateInput(car);
            }
            updateCarMovement(car);
            updateLapCounting(car);
        });
        
        updateCamera(playerCar);
        updateUI(playerCar);
    }
    
    renderer.render(scene, camera);
}


// --- Initialization ---

function init() {
    setupLighting();
    create3DTrack();
    populateMenu();
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Input Handlers
    window.addEventListener('keydown', (e) => { keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    
    animate();
}

init();
