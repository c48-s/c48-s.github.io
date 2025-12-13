// --- Global State & Setup (UNCHANGED) ---
// ... (All existing variables like GAME_STATE, scene, camera, renderer, etc.) ...

// --- Asset Loading (Textures & Environment) ---
const textureLoader = new THREE.TextureLoader();

// New function to load background textures
function createSkybox() {
    // A simple Skydome using a texture wrapped around a sphere
    const texture = textureLoader.load('https://threejs.org/examples/textures/skyboxsun25deg.png'); 
    
    // Create a large sphere and flip the faces inward (side: THREE.BackSide)
    const skyGeometry = new THREE.SphereGeometry(1500, 32, 32); 
    const skyMaterial = new THREE.MeshBasicMaterial({ 
        map: texture, 
        side: THREE.BackSide,
        fog: false // Sky should ignore fog
    });
    const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skybox);
}

// Function to create environment materials
function createGroundMaterial() {
    // High-resolution texture for the ground/grass (replace with your own high-res forest texture)
    const grassTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grass.jpg');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(100, 100); 

    return new THREE.MeshPhongMaterial({
        map: grassTexture,
        side: THREE.DoubleSide
    });
}

// --- 3D Track & Scenery Generation ---

// Function to generate many simple tree meshes
function addForestScenery() {
    // 1. Define Tree Geometry (Simple Cone for canopy, Cylinder for trunk)
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
    const canopyGeometry = new THREE.ConeGeometry(4, 10, 8);

    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 }); // Brown
    const canopyMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 }); // Forest Green

    const NUM_TREES = 500;
    const BOUNDARY = 700; // Place trees in a large 700x700 area

    for (let i = 0; i < NUM_TREES; i++) {
        // Random position, avoiding the central track area (0,0)
        let x = (Math.random() - 0.5) * BOUNDARY;
        let z = (Math.random() - 0.5) * BOUNDARY;

        // Skip planting near the center
        if (Math.hypot(x, z) < 100) continue; 
        
        const treeGroup = new THREE.Group();

        // Trunk
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2.5; // Half of height
        trunk.castShadow = true;
        treeGroup.add(trunk);

        // Canopy
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.y = 7.5; // Position above the trunk
        canopy.castShadow = true;
        treeGroup.add(canopy);

        treeGroup.position.set(x, 0, z);
        scene.add(treeGroup);
    }
}

// Function to create fake, simple city buildings in the distance
function addFakeBuildings() {
    const NUM_BUILDINGS = 30;
    const BUILDING_COLOR = 0xaaaaaa;
    const BOUNDARY_Z = -500; // Place buildings far behind the track on one side
    
    // A simple repeating texture for the buildings (e.g., brick or window pattern)
    const buildingTexture = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
    buildingTexture.wrapS = THREE.RepeatWrapping;
    buildingTexture.wrapT = THREE.RepeatWrapping;
    
    const buildingMaterial = new THREE.MeshPhongMaterial({ map: buildingTexture });

    for (let i = 0; i < NUM_BUILDINGS; i++) {
        // Random size
        const width = 10 + Math.random() * 20;
        const depth = 10 + Math.random() * 20;
        const height = 30 + Math.random() * 100;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const mesh = new THREE.Mesh(geometry, buildingMaterial);
        
        // Random position, clustered far away
        mesh.position.x = 400 + (Math.random() * 300) * (i % 2 === 0 ? 1 : -1);
        mesh.position.z = BOUNDARY_Z - Math.random() * 200;
        mesh.position.y = height / 2; // Sit on the ground
        
        mesh.castShadow = true;
        scene.add(mesh);
    }
}


function create3DTrack() {
    // --- Road Mesh (As before, but now with a better asphalt texture) ---
    const trackWidth = 8;
    const tubeGeometry = new THREE.TubeGeometry(trackCurve, 200, trackWidth, 16, true);
    
    const asphaltTexture = textureLoader.load('https://threejs.org/examples/textures/asphalt.jpg'); // New realistic texture
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(50, 5); 
    const trackMaterial = new THREE.MeshPhongMaterial({ map: asphaltTexture });

    const trackMesh = new THREE.Mesh(tubeGeometry, trackMaterial);
    trackMesh.receiveShadow = true; 
    scene.add(trackMesh);

    // --- Ground Mesh (Forest Grass) ---
    const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
    const groundMaterial = createGroundMaterial();
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.5; 
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
}

// --- Initialization (Modified) ---

function init() {
    // ... (Existing setup: renderer, camera, event listeners) ...
    
    // 1. Set scene background to a lighter blue/grey for ambient sky color
    scene.background = new THREE.Color(0xa0c0e0); 
    scene.fog = new THREE.Fog(0xa0c0e0, 500, 1500); // Add fog for depth and realism (GTA-style distant blur)

    // 2. Add Environment
    createSkybox();
    setupLighting(); // This must be called after scene is set up
    create3DTrack();
    addForestScenery();
    addFakeBuildings(); // Add distant city elements

    // ... (Existing: populateMenu, event listeners, animate call) ...
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
