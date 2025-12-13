// --- 1. Initialization ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set initial camera position
camera.position.set(0, 10, 50); // Start the camera behind and above the car

// Add light sources
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 50, 30);
scene.add(directionalLight);


// --- 2. Track Modeling (The Complex Part) ---

// The track is now a 3D spline/curve, defining the centerline in 3D space.
// This is an array of THREE.Vector3 points.
const TRACK_WAYPOINTS_3D = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(100, 0, 0),
    new THREE.Vector3(100, 0, -100),
    new THREE.Vector3(0, 0, -100),
    new THREE.Vector3(0, 0, 0)
    // To make it complex, add points that change the Y-axis (hills/dips)
    // e.g., new THREE.Vector3(50, 10, -50),
];

// Three.js curve object for smooth track generation
const trackCurve = new THREE.CatmullRomCurve3(TRACK_WAYPOINTS_3D, true); // 'true' makes it a closed loop

/**
 * Function to generate the visual track mesh (requires more complex code)
 */
function create3DTrack() {
    const tubeGeometry = new THREE.TubeGeometry(trackCurve, 200, 5, 8, true); // 200 segments, 5 radius (width), 8 sides
    const tubeMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 }); // Grey asphalt
    const trackMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(trackMesh);
    // 
}
create3DTrack();


// --- 3. Car Object Setup (Mesh) ---
const carGeometry = new THREE.BoxGeometry(4, 2, 8); // Simple box car (width, height, length)
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const playerCarMesh = new THREE.Mesh(carGeometry, playerMaterial);
playerCarMesh.position.y = 1; // Sit on the ground (half of height)
scene.add(playerCarMesh);

// Updated Car Data Structure (for Physics/Logic)
const cars = [
    { mesh: playerCarMesh, speed: 0, maxSpeed: 20, acceleration: 0.5, turnSpeed: 0.05, angle: 0, AI: false },
    // ** Add two more AI opponents **
    { mesh: new THREE.Mesh(carGeometry, new THREE.MeshPhongMaterial({ color: 0x0000ff })), speed: 5, maxSpeed: 18, acceleration: 0.3, turnSpeed: 0.04, angle: 0, AI: true, currentWaypoint: 1 },
    { mesh: new THREE.Mesh(carGeometry, new THREE.MeshPhongMaterial({ color: 0x00ff00 })), speed: 4, maxSpeed: 16, acceleration: 0.25, turnSpeed: 0.03, angle: 0, AI: true, currentWaypoint: 2 }
];

// Add AI cars to the scene
cars.filter(c => c.AI).forEach(c => scene.add(c.mesh));


// --- 4. Input and Physics (Modified) ---

const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function updatePhysics(car) {
    // 1. Handle Player Input
    if (!car.AI) {
        let speedChange = 0;
        let angleChange = 0;

        if (keys['ArrowUp']) {
            speedChange = car.acceleration;
        } else if (keys['ArrowDown']) {
            speedChange = -car.acceleration / 2;
        } else {
            // Friction/Deceleration
            if (car.speed > 0) car.speed = Math.max(0, car.speed - 0.2);
            if (car.speed < 0) car.speed = Math.min(0, car.speed + 0.2);
        }

        car.speed = Math.max(-10, Math.min(car.maxSpeed, car.speed + speedChange));

        if (car.speed !== 0) {
            if (keys['ArrowLeft']) angleChange = car.turnSpeed;
            if (keys['ArrowRight']) angleChange = -car.turnSpeed;
        }
        car.angle += angleChange;
    } 
    // 2. Handle AI Logic (Needs to use the 3D trackCurve for guidance)
    else {
        // *** This is where the 3D AI logic goes ***
        // A simple implementation: AI moves along the track curve using interpolation.
        
        // Find the next point on the curve the AI should target
        const distanceOnCurve = (car.currentWaypoint / trackCurve.points.length);
        const targetPoint = trackCurve.getPointAt(distanceOnCurve);
        
        // Simple 'Look At' steering for the AI
        car.mesh.lookAt(targetPoint);
        car.speed = car.maxSpeed; // Simple constant speed for AI

        // Advance the waypoint index (very simplified lap logic)
        if (car.mesh.position.distanceTo(targetPoint) < 10) {
             car.currentWaypoint = (car.currentWaypoint + 1) % trackCurve.points.length;
        }
    }
    
    // 3. Update 3D Position and Rotation
    const velocityX = car.speed * Math.sin(car.angle);
    const velocityZ = car.speed * Math.cos(car.angle);

    car.mesh.position.x += velocityX;
    car.mesh.position.z += velocityZ;

    // Update mesh rotation based on the internal car.angle (for player)
    car.mesh.rotation.y = car.angle;
}


// --- 5. The Render Loop ---

function animate() {
    requestAnimationFrame(animate);

    for (const car of cars) {
        updatePhysics(car);
    }
    
    // Move the camera to follow the player car
    const player = cars[0];
    const offset = new THREE.Vector3(
        -10 * Math.sin(player.angle), 
        5, 
        -10 * Math.cos(player.angle)
    );
    
    // Set camera position relative to the player car's rotation
    camera.position.copy(player.mesh.position).add(offset);
    camera.lookAt(player.mesh.position);

    renderer.render(scene, camera);

    document.getElementById('stats').innerText = `Speed: ${cars[0].speed.toFixed(1)} / 20 | AI Opponents: 2`;
}

animate();
