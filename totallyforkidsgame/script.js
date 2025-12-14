// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set camera position (Top-down/slightly angled view for GTA feel)
camera.position.set(0, 15, 10);
camera.lookAt(0, 0, 0);

// --- Game Constants ---
const PLAYER_SPEED = 0.1;
const NPC_COUNT = 10;
const INITIAL_AMMO = 10;

// --- Game State ---
let keys = {};
let ammo = INITIAL_AMMO;
const npcs = [];

// --- Game Objects ---

// 1. Player (A simple blue box)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00bcd4 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 0.5;
scene.add(player);

// 2. Ground (A simple large plane)
const groundGeometry = new THREE.PlaneGeometry(50, 50);
// Use a basic material for a "road" color
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x555555, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = Math.PI / 2; // Lay it flat
scene.add(ground);

// 3. Lighting (Crucial for 3D visibility)
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// --- NPC Logic ---

class NPC {
    constructor() {
        // NPC is a simple red box
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0xff3333 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(
            (Math.random() - 0.5) * 40,
            0.5,
            (Math.random() - 0.5) * 40
        );
        scene.add(this.mesh);
        
        // Simple random movement vector
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            0,
            (Math.random() - 0.5) * 0.02
        );
    }
    
    update() {
        this.mesh.position.add(this.velocity);
        
        // Keep NPCs within the 40x40 area and make them turn around
        if (Math.abs(this.mesh.position.x) > 20 || Math.abs(this.mesh.position.z) > 20) {
            this.velocity.negate();
        }
        
        // Check if hit by a projectile (simple distance check)
        const projectiles = scene.children.filter(c => c.name === 'projectile');
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            if (this.mesh.position.distanceTo(projectile.position) < 1.5) {
                // Remove NPC and projectile on hit
                scene.remove(this.mesh);
                scene.remove(projectile);
                npcs.splice(npcs.indexOf(this), 1);
                console.log("NPC Eliminated!");
            }
        }
    }
}

// Instantiate NPCs
for (let i = 0; i < NPC_COUNT; i++) {
    npcs.push(new NPC());
}

// --- Weapon Logic ---

function updateAmmoUI() {
    document.getElementById('ammo-count').innerText = `${ammo} / ∞`;
}

function fireWeapon() {
    if (ammo <= 0) {
        console.log("Click! Out of ammo!");
        return;
    }

    ammo--;
    updateAmmoUI();

    // 1. Create the projectile (Simple yellow sphere)
    const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.name = 'projectile';
    
    // Start position is near the player
    projectile.position.copy(player.position);
    
    // 2. Set projectile velocity (Always forward relative to the camera/player view)
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction); // Get the direction the camera is looking
    
    // If using a fixed top-down camera, we can use player rotation for direction
    // For simplicity with our fixed camera, let's shoot in the Z direction (forward in the initial scene)
    
    projectile.velocity = direction.multiplyScalar(0.5); 
    
    scene.add(projectile);
    
    // Remove projectile after a certain time to prevent scene clutter
    setTimeout(() => {
        scene.remove(projectile);
    }, 2000);
}

// --- Event Listeners ---

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Listener for firing the gun (Spacebar)
document.addEventListener('keypress', (e) => {
    if (e.key === ' ' && !keys[' ']) { // Check for spacebar press
        fireWeapon();
    }
});


// --- Game Loop ---

function animate() {
    requestAnimationFrame(animate);

    // 1. Player Movement
    if (keys['w']) player.position.z -= PLAYER_SPEED;
    if (keys['s']) player.position.z += PLAYER_SPEED;
    if (keys['a']) player.position.x -= PLAYER_SPEED;
    if (keys['d']) player.position.x += PLAYER_SPEED;

    // Keep player on the ground plane
    player.position.y = 0.5; 
    
    // 2. Camera Tracking (Keep camera focused on the player)
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 10;
    camera.position.y = 15;
    camera.lookAt(player.position);

    // 3. NPC Movement and Collision
    npcs.forEach(npc => npc.update());

    // 4. Projectile Movement
    scene.children.filter(c => c.name === 'projectile').forEach(projectile => {
        // Move the projectile along its stored velocity vector
        projectile.position.add(projectile.velocity);
    });

    // 5. Render the scene
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game loop
animate();
updateAmmoUI(); // Initial UI load
