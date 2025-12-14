// script.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a ground
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = Math.PI / 2; // Rotate the ground to be horizontal
scene.add(ground);

// Create some buildings (simple cubes)
function createBuilding(x, z) {
    const buildingGeometry = new THREE.BoxGeometry(2, 5, 2);
    const buildingMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, 2.5, z);
    scene.add(building);
}

// Add some buildings
createBuilding(-10, -10);
createBuilding(10, -10);
createBuilding(-10, 10);
createBuilding(10, 10);

// Set camera position
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Orbit controls for camera
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    renderer.render(scene, camera);
}

animate();
