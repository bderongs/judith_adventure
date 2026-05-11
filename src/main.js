import {
    Engine,
    Scene,
    Vector3,
    Vector2,
    UniversalCamera,
    HemisphericLight,
    DirectionalLight,
    MeshBuilder,
    StandardMaterial,
    Color3,
    HavokPlugin,
    PhysicsAggregate,
    PhysicsShapeType,
    SceneLoader,
    Ray,
    Texture,
    Animation
} from "@babylonjs/core";
import { WaterMaterial } from "@babylonjs/materials";
import "@babylonjs/loaders"; // Indispensable pour charger les .obj
import HavokPhysics from "@babylonjs/havok";
import PartySocket from "partysocket";

// ============================================================
//  WORLD CONFIGURATIONS
// ============================================================

const WORLDS = {
    forest: {
        id: "forest",
        label: "🌲 Forêt",
        // Bright clear sky, like Preview_1 & Preview_2
        skyColor: new Color3(0.55, 0.85, 0.98),
        groundColor: new Color3(0.42, 0.58, 0.28),   // olive-green tint over texture
        lightGroundColor: new Color3(0.25, 0.38, 0.18),
        lightColor: new Color3(1.0, 0.98, 0.92),      // soft natural daylight
        dirLightIntensity: 1.2,
        groundTexture: "/assets/Stylized Nature MegaKit[Standard]/glTF/Rocks_Diffuse.png",
        groundTextureScale: 14,  // tile repetitions — gives mossy-earth feel
        hasWater: true,
        models: [
            // Trees — full variety from preview
            "CommonTree_1.gltf",
            "CommonTree_2.gltf",
            "CommonTree_3.gltf",
            "Pine_1.gltf",
            "Pine_2.gltf",
            "Pine_3.gltf",
            "TwistedTree_1.gltf",
            "TwistedTree_2.gltf",
            // Rocks
            "Rock_Medium_1.gltf",
            "Rock_Medium_2.gltf",
            "Rock_Medium_3.gltf",
            // Ground cover
            "Grass_Common_Tall.gltf",
            "Grass_Common_Short.gltf",
            "Grass_Wispy_Short.gltf",
            // Flowers & plants
            "Flower_3_Group.gltf",
            "Flower_4_Group.gltf",
            "Fern_1.gltf",
            "Clover_1.gltf",
            "Clover_2.gltf",
            "Plant_1.gltf",
            // Mushrooms
            "Mushroom_Common.gltf",
            "Mushroom_Laetiporus.gltf",
            // Bushes
            "Bush_Common.gltf",
            "Bush_Common_Flowers.gltf",
            // Path rocks for scattered surface detail
            "Pebble_Round_1.gltf",
            "Pebble_Round_2.gltf"
        ],
        spawns: [
            // Dense mixed forest — lots of tree variety, like Preview_2
            { keys: ["CommonTree_1.gltf", "CommonTree_2.gltf", "CommonTree_3.gltf", "Pine_1.gltf", "Pine_2.gltf", "Pine_3.gltf", "TwistedTree_1.gltf", "TwistedTree_2.gltf"], count: 220, scale: [0.8, 1.8], collisions: true },
            // Boulders — grey-green rocks from preview
            { keys: ["Rock_Medium_1.gltf", "Rock_Medium_2.gltf", "Rock_Medium_3.gltf"], count: 50, scale: [0.5, 2.0], collisions: true },
            // Lush grass carpet
            { keys: ["Grass_Common_Tall.gltf", "Grass_Common_Short.gltf", "Grass_Wispy_Short.gltf"], count: 500, scale: [0.5, 1.2], collisions: false },
            // Flowers — the pink/red blooms from preview
            { keys: ["Flower_3_Group.gltf", "Flower_4_Group.gltf"], count: 120, scale: [0.5, 1.0], collisions: false },
            // Ferns & clovers — the ground-level green plants
            { keys: ["Fern_1.gltf", "Clover_1.gltf", "Clover_2.gltf", "Plant_1.gltf"], count: 200, scale: [0.4, 1.0], collisions: false },
            // Mushrooms — scattered in shady spots, like preview
            { keys: ["Mushroom_Common.gltf", "Mushroom_Laetiporus.gltf"], count: 80, scale: [0.3, 0.9], collisions: false },
            // Bushes — medium-sized shrubs from preview
            { keys: ["Bush_Common.gltf", "Bush_Common_Flowers.gltf"], count: 60, scale: [0.6, 1.2], collisions: false },
            // Pebbles — the scattered grey stones on the forest floor
            { keys: ["Pebble_Round_1.gltf", "Pebble_Round_2.gltf"], count: 150, scale: [0.3, 1.0], collisions: false }
        ]
    },
    desert: {
        id: "desert",
        label: "🏜️ Désert",
        // Warm hazy sky, like the preview (blue with a touch of warmth)
        skyColor: new Color3(0.72, 0.88, 0.97),
        groundColor: new Color3(0.93, 0.78, 0.45),   // sand tint (blended with texture)
        lightGroundColor: new Color3(0.55, 0.4, 0.18),
        lightColor: new Color3(1.0, 0.92, 0.75),       // warm golden sun
        dirLightIntensity: 1.6,
        groundTexture: "/assets/Stylized Nature MegaKit[Standard]/glTF/Rocks_Desert_Diffuse.png",
        groundTextureScale: 12,   // tile repetitions across the 150-unit ground
        hasWater: false,
        // desert-specific texture override for rock models (swap to desert diffuse)
        rockDesertTexture: "/assets/Stylized Nature MegaKit[Standard]/glTF/Rocks_Desert_Diffuse.png",
        models: [
            "DeadTree_1.gltf",
            "DeadTree_2.gltf",
            "DeadTree_3.gltf",
            "Rock_Medium_1.gltf",
            "Rock_Medium_2.gltf",
            "Rock_Medium_3.gltf",
            "Pebble_Round_1.gltf",
            "Pebble_Round_3.gltf",
            "Grass_Wispy_Tall.gltf",
            "Grass_Wispy_Short.gltf",
            "Flower_4_Group.gltf",
            "Plant_1_Big.gltf",
            "RockPath_Round_Wide.gltf",
            "RockPath_Round_Thin.gltf"
        ],
        spawns: [
            // Dead trees — sparse, like the preview
            { keys: ["DeadTree_1.gltf", "DeadTree_2.gltf", "DeadTree_3.gltf"], count: 50, scale: [0.8, 1.8], collisions: true },
            // Large boulders — dominant feature of desert landscape
            { keys: ["Rock_Medium_1.gltf", "Rock_Medium_2.gltf", "Rock_Medium_3.gltf"], count: 90, scale: [0.5, 2.5], collisions: true },
            // Pebbles scattered on the ground
            { keys: ["Pebble_Round_1.gltf", "Pebble_Round_3.gltf"], count: 300, scale: [0.3, 1.2], collisions: false },
            // Dry wispy grass — the yellow-orange tufts from the preview
            { keys: ["Grass_Wispy_Tall.gltf", "Grass_Wispy_Short.gltf"], count: 350, scale: [0.5, 1.3], collisions: false },
            // Red/orange flower clusters — accent color from preview
            { keys: ["Flower_4_Group.gltf"], count: 60, scale: [0.6, 1.2], collisions: false },
            // Green succulents — the leafy plants near oasis areas in preview
            { keys: ["Plant_1_Big.gltf"], count: 40, scale: [0.5, 1.0], collisions: false },
            // Flat rock path pieces scattered as surface detail
            { keys: ["RockPath_Round_Wide.gltf", "RockPath_Round_Thin.gltf"], count: 80, scale: [0.4, 1.5], collisions: false }
        ]
    }
};

// ============================================================
//  UTILITIES
// ============================================================
let currentSeed = 12345;
function seededRandom() {
    currentSeed = (currentSeed * 16807) % 2147483647;
    return (currentSeed - 1) / 2147483646;
}

function resetSeed(worldId) {
    // Use worldId to create a unique but consistent seed per world
    let seed = 0;
    for (let i = 0; i < worldId.length; i++) {
        seed += worldId.charCodeAt(i);
    }
    currentSeed = seed || 12345;
}

// ============================================================
//  CURRENT WORLD (read from URL param, default = forest)
// ============================================================
const urlParams = new URLSearchParams(window.location.search);
let currentWorldId = urlParams.get("world") || "forest";
if (!WORLDS[currentWorldId]) currentWorldId = "forest";

// ============================================================
//  WORLD SWITCHER UI
// ============================================================
function buildWorldMenu() {
    const menu = document.getElementById("world-menu");
    if (!menu) return;
    menu.innerHTML = "";

    Object.values(WORLDS).forEach(world => {
        const btn = document.createElement("button");
        btn.textContent = world.label;
        btn.className = "world-btn" + (world.id === currentWorldId ? " active" : "");
        btn.dataset.worldId = world.id;
        btn.addEventListener("click", () => {
            if (world.id === currentWorldId) return;
            // Switch world: update URL and reload
            const newParams = new URLSearchParams(window.location.search);
            newParams.set("world", world.id);
            window.location.search = newParams.toString();
        });
        menu.appendChild(btn);
    });
}

// ============================================================
//  PLAYER HEALTH
// ============================================================
let playerHP = 5;
const maxHP = 5;

function updateHealthUI() {
    const healthDiv = document.getElementById("health-ui");
    if (!healthDiv) return;

    let hearts = "";
    for (let i = 0; i < maxHP; i++) {
        hearts += i < playerHP ? "❤️ " : "🖤 ";
    }
    healthDiv.innerHTML = hearts;
}

function playerTakeDamage(amount) {
    if (playerHP <= 0) return;

    playerHP -= amount;
    if (playerHP < 0) playerHP = 0;
    updateHealthUI();

    const canvas = document.getElementById("renderCanvas");
    canvas.style.transition = "box-shadow 0.1s";
    canvas.style.boxShadow = "inset 0 0 100px red";
    setTimeout(() => { canvas.style.boxShadow = "none"; }, 200);

    if (playerHP === 0) {
        console.log("Game Over !");
        setTimeout(() => location.reload(), 1500);
    }
}

// ============================================================
//  CHEST SYSTEM
// ============================================================
const activeChests = [];

const CHEST_MESSAGES = [
    // Jokes 😄
    { emoji: "😂", text: "Pourquoi les plongeurs plongent-ils toujours en arrière ?\nParce que sinon ils tomberaient dans le bateau !" },
    { emoji: "🤣", text: "Qu'est-ce qu'un canif ?\nUn petit fien !" },
    { emoji: "😄", text: "Qu'est-ce qu'un crocodile qui surveille des grains ?\nUn garde-riz !" },
    { emoji: "🤔", text: "Qu'est-ce qu'un chat tombé dans un pot de peinture le jour de Noël ?\nUn chat-peint de Noël !" },
    { emoji: "😎", text: "Pourquoi les fantômes sont-ils de si mauvais menteurs ?\nParce qu'on voit à travers eux !" },
    { emoji: "🧐", text: "Un homme entre dans une bibliothèque et demande s'ils ont des livres sur la paranoïa.\nLa bibliothécaire chuchote : 'Ils sont juste derrière vous !'" },
    { emoji: "🌵", text: "Le coffre était vide.\nQuelqu'un est passé avant toi... mystérieux." },
    { emoji: "💤", text: "Ce coffre contenait... rien.\nBien joué pour avoir quand même essayé." },
    // Weapons & items 🎁
    { emoji: "⚔️", text: "Tu as trouvé une Épée Dorée !\n(+1 en style, +0 en humilité)" },
    { emoji: "🪓", text: "Tu as trouvé une Double Hache !\nImpressionnant... et encombrant." },
    { emoji: "🏹", text: "Tu as trouvé un Arc en Or !\nMais tu n'as pas de flèches... dommage." },
    { emoji: "🗡️", text: "Tu as trouvé une Dague Mystérieuse !\nElle murmure ton nom à voix basse..." },
    { emoji: "🔨", text: "Tu as trouvé un Marteau de Guerre !\nC'est lourd, très lourd. Tu arrives quand même à le soulever." },
    { emoji: "💎", text: "Tu as trouvé un Cristal Magique !\nIl brille de mille feux et sent la vanille." },
    { emoji: "📜", text: "Tu as trouvé un Parchemin Ancien !\nIl est écrit : 'Le trésor est dans l'autre coffre.'" },
    { emoji: "👑", text: "Tu as trouvé une Couronne !\nElle te va vraiment bien, on te l'assure." },
];

let chestHintVisible = false;

function showChestMessage(emoji, text) {
    const popup = document.getElementById("chest-popup");
    const emojiEl = document.getElementById("chest-popup-emoji");
    const textEl = document.getElementById("chest-popup-text");
    if (!popup || !emojiEl || !textEl) return;

    emojiEl.textContent = emoji;
    textEl.innerHTML = text.replace(/\n/g, "<br>");
    popup.classList.remove("hidden", "fade-out");
    popup.classList.add("fade-in");

    clearTimeout(popup._hideTimer);
    popup._hideTimer = setTimeout(() => {
        popup.classList.add("fade-out");
        popup.classList.remove("fade-in");
        setTimeout(() => popup.classList.add("hidden"), 600);
    }, 4000);
}

function setChestHint(visible) {
    if (chestHintVisible === visible) return;
    chestHintVisible = visible;
    const hint = document.getElementById("chest-hint");
    if (!hint) return;
    if (visible) {
        hint.classList.remove("hidden");
    } else {
        hint.classList.add("hidden");
    }
}

class Chest {
    constructor(closedRoot, openRoot, collider) {
        this.closedRoot = closedRoot;
        this.openRoot = openRoot;
        this.collider = collider;
        this.opened = false;
        this.collider.metadata = { type: "chest", instance: this };
        activeChests.push(this);
    }

    open() {
        if (this.opened) return;
        this.opened = true;

        // Hide closed hierarchy
        this.closedRoot.setEnabled(false);
        this.closedRoot.getChildMeshes(false).forEach(m => m.setEnabled(false));

        // Show open hierarchy
        this.openRoot.setEnabled(true);
        this.openRoot.getChildMeshes(false).forEach(m => { m.setEnabled(true); m.isVisible = true; });

        // Pick a random message
        const msg = CHEST_MESSAGES[Math.floor(Math.random() * CHEST_MESSAGES.length)];
        showChestMessage(msg.emoji, msg.text);
    }

    distanceTo(pos) {
        const dx = this.collider.position.x - pos.x;
        const dz = this.collider.position.z - pos.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
}

// ============================================================
//  ENEMY AI
// ============================================================
const activeEnemies = [];

class Enemy {
    constructor(visualRoot, collider, hp = 3) {
        this.visualRoot = visualRoot;
        this.collider = collider;
        this.hp = hp;
        this.lastAttackTime = 0;
        this.collider.metadata = { type: "enemy", instance: this };
        activeEnemies.push(this);
    }

    takeDamage(amount) {
        this.hp -= amount;
        console.log(`Ennemi touché ! HP restants: ${this.hp}`);
        if (this.hp <= 0) this.die();
    }

    die() {
        console.log("Ennemi vaincu !");
        const idx = activeEnemies.indexOf(this);
        if (idx > -1) activeEnemies.splice(idx, 1);
        this.visualRoot.dispose();
        this.collider.dispose();
    }

    update(camera, scene) {
        if (this.hp <= 0) return;
        const dx = this.collider.position.x - camera.position.x;
        const dz = this.collider.position.z - camera.position.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < 9) {
            const now = performance.now();
            if (now - this.lastAttackTime > 1500) {
                this.lastAttackTime = now;
                this.attack(scene);
            }
        }
    }

    attack(scene) {
        console.log("Le Blob attaque !");
        const jumpAnim = new Animation("jump", "position.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        jumpAnim.setKeys([
            { frame: 0, value: 0 },
            { frame: 10, value: 1.5 },
            { frame: 20, value: 0 }
        ]);
        this.visualRoot.animations = [jumpAnim];
        scene.beginAnimation(this.visualRoot, 0, 20, false, 1.5, () => {
            playerTakeDamage(1);
        });
    }
}

// ============================================================
//  SCENE SETUP
// ============================================================
const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true);

const createScene = async function () {
    const worldCfg = WORLDS[currentWorldId];
    const scene = new Scene(engine);
    scene.clearColor = worldCfg.skyColor;

    // Physics
    const havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, havokInstance);
    scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
    scene.collisionsEnabled = true;
    scene.gravity = new Vector3(0, -0.6, 0);

    // FPS Camera
    const camera = new UniversalCamera("fpsCamera", new Vector3(0, 1, 0), scene);
    camera.setTarget(new Vector3(0, 2, -10));
    camera.attachControl(canvas, true);
    camera.keysUp.push(90, 87);    // Z, W
    camera.keysDown.push(83);      // S
    camera.keysLeft.push(81, 65);  // Q, A
    camera.keysRight.push(68);     // D
    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    camera.minZ = 0.45;
    camera.speed = 0.4;
    camera.angularSensibility = 4000;

    // Lights
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 1.5;
    light.groundColor = worldCfg.lightGroundColor;
    if (worldCfg.lightColor) light.diffuse = worldCfg.lightColor;
    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
    dirLight.position = new Vector3(20, 40, 20);
    dirLight.intensity = worldCfg.dirLightIntensity ?? 1.0;
    if (worldCfg.lightColor) dirLight.diffuse = worldCfg.lightColor;

    // Ground
    const mapSize = 150;
    const ground = MeshBuilder.CreateGround("ground", { width: mapSize, height: mapSize, subdivisions: 2 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    if (worldCfg.groundTexture) {
        // Tiled texture for desert cracked-sand look
        const gTex = new Texture(worldCfg.groundTexture, scene);
        gTex.uScale = worldCfg.groundTextureScale ?? 8;
        gTex.vScale = worldCfg.groundTextureScale ?? 8;
        groundMat.diffuseTexture = gTex;
        // Tint the texture toward the sand color
        groundMat.diffuseColor = worldCfg.groundColor;
    } else {
        groundMat.diffuseColor = worldCfg.groundColor;
    }
    ground.material = groundMat;
    ground.checkCollisions = true;
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);

    // Water (forest only)
    let waterMaterial = null;
    if (worldCfg.hasWater) {
        waterMaterial = new WaterMaterial("waterMat", scene, new Vector2(512, 512));
        waterMaterial.backFaceCulling = true;
        waterMaterial.bumpTexture = new Texture("https://playground.babylonjs.com/textures/waterbump.png", scene);
        waterMaterial.windForce = -5;
        waterMaterial.waveHeight = 0.2;
        waterMaterial.bumpHeight = 0.1;
        waterMaterial.waterColor = new Color3(0.1, 0.5, 0.7);
        waterMaterial.colorBlendFactor = 0.3;
        waterMaterial.addToRenderList(ground);

        for (let i = 0; i < 4; i++) {
            const waterMesh = MeshBuilder.CreateGround(`water${i}`, { width: 30, height: 30 }, scene);
            waterMesh.position = new Vector3((seededRandom() - 0.5) * 80, 0.05, (seededRandom() - 0.5) * 80);
            waterMesh.material = waterMaterial;
        }
    }

    // Load world models
    const assetsPath = "/assets/Stylized Nature MegaKit[Standard]/glTF/";
    const loadedModels = {};

    // Pre-create desert rock texture material if needed
    let desertRockMat = null;
    if (worldCfg.rockDesertTexture) {
        desertRockMat = new StandardMaterial("desertRockMat", scene);
        const dTex = new Texture(worldCfg.rockDesertTexture, scene);
        desertRockMat.diffuseTexture = dTex;
    }

    for (const modelName of worldCfg.models) {
        const result = await SceneLoader.ImportMeshAsync("", assetsPath, modelName, scene);
        const rootMesh = result.meshes[0];

        // Override rock materials to use desert texture
        if (desertRockMat && (modelName.startsWith("Rock_") || modelName.startsWith("Pebble_") || modelName.startsWith("RockPath_"))) {
            result.meshes.forEach(m => {
                if (m.material) m.material = desertRockMat;
            });
        }

        result.meshes.forEach(m => { m.isVisible = false; });
        loadedModels[modelName] = rootMesh;
    }

    // Spawn environment instances
    const spawnInstances = (modelKeys, count, scaleRange, addCollisions) => {
        for (let i = 0; i < count; i++) {
            const randomKey = modelKeys[Math.floor(seededRandom() * modelKeys.length)];
            const rootMesh = loadedModels[randomKey];
            const instanceRoot = rootMesh.instantiateHierarchy();
            if (!instanceRoot) continue;

            const x = (seededRandom() - 0.5) * (mapSize - 10);
            const z = (seededRandom() - 0.5) * (mapSize - 10);
            const scale = scaleRange[0] + seededRandom() * (scaleRange[1] - scaleRange[0]);

            instanceRoot.position = new Vector3(x, 0, z);
            instanceRoot.rotation = new Vector3(0, seededRandom() * Math.PI * 2, 0);
            instanceRoot.scaling = new Vector3(scale, scale, scale);

            if (addCollisions) {
                if (waterMaterial) {
                    instanceRoot.getChildMeshes().forEach(m => waterMaterial.addToRenderList(m));
                }
                const collider = MeshBuilder.CreateCylinder("collider", {
                    height: 10 * scale,
                    diameter: 1.5 * scale
                }, scene);
                collider.position = new Vector3(x, 5 * scale, z);
                collider.isVisible = false;
                collider.checkCollisions = true;
                collider.metadata = { type: "environment", visualRoot: instanceRoot };
                new PhysicsAggregate(collider, PhysicsShapeType.CYLINDER, { mass: 0 }, scene);
            }
        }
    };

    for (const spawnCfg of worldCfg.spawns) {
        spawnInstances(spawnCfg.keys, spawnCfg.count, spawnCfg.scale, spawnCfg.collisions);
    }

    // Load enemies
    const monsterPath = "/assets/Ultimate Monsters/Blob/glTF/";
    const monstersToLoad = ["GreenBlob.gltf", "PinkBlob.gltf"];
    const loadedMonsters = {};
    for (const modelName of monstersToLoad) {
        const result = await SceneLoader.ImportMeshAsync("", monsterPath, modelName, scene);
        const rootMesh = result.meshes[0];
        result.meshes.forEach(m => { m.isVisible = false; });
        loadedMonsters[modelName] = rootMesh;
    }

    // Spawn enemies
    const numEnemies = 20;
    for (let i = 0; i < numEnemies; i++) {
        const randomKey = monstersToLoad[Math.floor(seededRandom() * monstersToLoad.length)];
        const rootMesh = loadedMonsters[randomKey];
        const instanceRoot = rootMesh.instantiateHierarchy();
        if (!instanceRoot) continue;

        const x = (seededRandom() - 0.5) * (mapSize - 10);
        const z = (seededRandom() - 0.5) * (mapSize - 10);
        const scale = 1.0;

        instanceRoot.position = new Vector3(x, 0, z);
        instanceRoot.rotation = new Vector3(0, seededRandom() * Math.PI * 2, 0);
        instanceRoot.scaling = new Vector3(scale, scale, scale);

        const collider = MeshBuilder.CreateCylinder("collider", {
            height: 1.5 * scale,
            diameter: 1.0 * scale
        }, scene);
        collider.position = new Vector3(x, 0.75 * scale, z);
        collider.isVisible = false;
        collider.checkCollisions = true;
        new PhysicsAggregate(collider, PhysicsShapeType.CYLINDER, { mass: 0 }, scene);

        new Enemy(instanceRoot, collider, 3);
    }

    // Load and spawn chests
    const chestPath = "/assets/Ultimate RPG Items Pack - Aug 2019/OBJ/";
    const chestClosedResult = await SceneLoader.ImportMeshAsync("", chestPath, "Chest_Closed.obj", scene);
    const chestOpenResult = await SceneLoader.ImportMeshAsync("", chestPath, "Chest_Open.obj", scene);

    // Template roots — hide everything
    const chestTemplClosed = chestClosedResult.meshes[0];
    const chestTemplOpen = chestOpenResult.meshes[0];
    chestClosedResult.meshes.forEach(m => { m.isVisible = false; m.setEnabled(false); });
    chestOpenResult.meshes.forEach(m => { m.isVisible = false; m.setEnabled(false); });

    const numChests = 7;
    const chestScale = 1.0; // Same unit scale as the Sword.obj — correct size in world
    for (let i = 0; i < numChests; i++) {
        const x = (seededRandom() - 0.5) * (mapSize - 20);
        const z = (seededRandom() - 0.5) * (mapSize - 20);
        const rotY = seededRandom() * Math.PI * 2;

        // --- Closed chest (visible at start) ---
        const closedRoot = chestTemplClosed.instantiateHierarchy();
        if (!closedRoot) continue;
        closedRoot.position = new Vector3(x, 0, z);
        closedRoot.scaling = new Vector3(chestScale, chestScale, chestScale);
        closedRoot.rotation = new Vector3(0, rotY, 0);
        closedRoot.setEnabled(true);
        closedRoot.getChildMeshes(false).forEach(m => { m.isVisible = true; m.setEnabled(true); });

        // --- Open chest (hidden until triggered) ---
        const openRoot = chestTemplOpen.instantiateHierarchy();
        if (!openRoot) continue;
        openRoot.position = new Vector3(x, 0, z);
        openRoot.scaling = new Vector3(chestScale, chestScale, chestScale);
        openRoot.rotation = new Vector3(0, rotY, 0);
        openRoot.setEnabled(false);
        openRoot.getChildMeshes(false).forEach(m => m.setEnabled(false));

        // --- Trigger collider (sized for a ~1-unit chest) ---
        const chestCollider = MeshBuilder.CreateBox("chest_collider_" + i, { width: 1.5, height: 1.2, depth: 1.0 }, scene);
        chestCollider.position = new Vector3(x, 0.6, z);
        chestCollider.isVisible = false;
        chestCollider.checkCollisions = false;

        new Chest(closedRoot, openRoot, chestCollider);
    }

    // Load weapon
    const weaponPath = "/assets/Ultimate RPG Items Pack - Aug 2019/OBJ/";
    const weaponResult = await SceneLoader.ImportMeshAsync("", weaponPath, "Sword.obj", scene);
    const sword = weaponResult.meshes[0];
    sword.setParent(camera);
    sword.rotationQuaternion = null;
    sword.position = new Vector3(0.6, -0.5, 1.5);
    sword.rotation = new Vector3(Math.PI / 6, Math.PI, 0);
    sword.scaling = new Vector3(1, 1, 1);

    // Attack logic
    let isAttacking = false;
    const performAttack = () => {
        if (isAttacking) return;
        isAttacking = true;

        const attackAnim = new Animation("swing", "rotation.x", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        attackAnim.setKeys([
            { frame: 0, value: Math.PI / 6 },
            { frame: 10, value: Math.PI / 2 },
            { frame: 30, value: Math.PI / 6 }
        ]);
        sword.animations = [attackAnim];
        scene.beginAnimation(sword, 0, 30, false, 1.5, () => { isAttacking = false; });

        const origin = camera.globalPosition;
        const forward = camera.getDirection(new Vector3(0, 0, 1));
        const ray = new Ray(origin, forward, 8);
        const hit = scene.pickWithRay(ray, (mesh) => mesh.name === "collider" || mesh.name.startsWith("chest_collider_"));

        if (hit.hit && hit.pickedMesh && hit.pickedMesh.metadata) {
            const meta = hit.pickedMesh.metadata;
            if (meta.type === "environment") {
                console.log("Décor détruit !");
                meta.visualRoot.dispose();
                hit.pickedMesh.dispose();
            } else if (meta.type === "enemy") {
                meta.instance.takeDamage(1);
            } else if (meta.type === "chest") {
                meta.instance.open();
            }
        }
    };

    // Pointer lock + attack on left click
    scene.onPointerDown = (evt) => {
        if (evt.button === 0) {
            engine.enterPointerlock();
            if (document.pointerLockElement === canvas) {
                performAttack();
            }
        }
    };

    // Keyboard: jump + attack
    window.addEventListener("keydown", (evt) => {
        if (evt.code === "Space") {
            camera.cameraDirection.y = 0.8;
        }
        if (evt.key.toLowerCase() === "y" && document.pointerLockElement === canvas) {
            performAttack();
        }
    });

    // AI loop + chest proximity
    scene.onBeforeRenderObservable.add(() => {
        for (const enemy of activeEnemies) {
            enemy.update(camera, scene);
        }

        // Chest proximity hint
        let nearChest = false;
        for (const chest of activeChests) {
            if (!chest.opened && chest.distanceTo(camera.position) < 4) {
                nearChest = true;
                break;
            }
        }
        setChestHint(nearChest);
    });

    updateHealthUI();
    return scene;
};

// ============================================================
//  BOOTSTRAP
// ============================================================
buildWorldMenu();
resetSeed(currentWorldId);

createScene().then(scene => {
    // ============================================================
    //  MULTIPLAYER LOGIC
    // ============================================================
    const remotePlayers = new Map();
    const monsterPath = "/assets/Ultimate Monsters/Blob/glTF/";

    console.log("Initializing PartySocket for room:", currentWorldId);

    // Switch host based on where the game is running
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const partyHost = isLocal
        ? window.location.hostname + ":1999"
        : "projet-judith-multiplayer.bderongs.partykit.dev"; // <--- REPLACE 'baptiste' with your PartyKit username after deploy

    const socket = new PartySocket({
        host: partyHost,
        room: currentWorldId,
    });

    socket.addEventListener("open", () => {
        console.log("✅ PartyKit connection established! ID:", socket.id);
        const statusEl = document.getElementById("multiplayer-status");
        if (statusEl) {
            statusEl.textContent = "Multiplayer: Connected";
            statusEl.style.color = "#4ade80"; // Light green
        }
    });

    socket.addEventListener("error", (err) => {
        console.error("❌ PartyKit connection error:", err);
        const statusEl = document.getElementById("multiplayer-status");
        if (statusEl) {
            statusEl.textContent = "Multiplayer: Error";
            statusEl.style.color = "#f87171"; // Light red
        }
    });

    socket.addEventListener("message", (e) => {
        let data;
        try {
            data = JSON.parse(e.data);
        } catch (err) {
            return;
        }

        if (data.type === "update") {
            const { id, pos, rot } = data;
            if (id === socket.id) return;

            if (!remotePlayers.has(id)) {
                // Load the Ninja model
                const ninjaPath = "/assets/Ultimate Monsters/Big/glTF/";
                SceneLoader.ImportMeshAsync("", ninjaPath, "Ninja.gltf", scene).then(result => {
                    const mesh = result.meshes[0];
                    mesh.scaling = new Vector3(1, 1, 1);
                    // Initialize smoothing targets
                    mesh.metadata = {
                        targetPos: new Vector3(pos.x, pos.y, pos.z),
                        targetRot: new Vector3(rot.x, rot.y, rot.z)
                    };
                    remotePlayers.set(id, mesh);
                });
            } else {
                // Update smoothing targets
                const mesh = remotePlayers.get(id);
                if (mesh && mesh.metadata) {
                    mesh.metadata.targetPos.set(pos.x, pos.y, pos.z);
                    mesh.metadata.targetRot.set(rot.x, rot.y, rot.z);
                }
            }
        } else if (data.type === "remove") {
            console.log("Player left:", data.id);
            const mesh = remotePlayers.get(data.id);
            if (mesh) {
                mesh.dispose();
                remotePlayers.delete(data.id);
            }
        }
    });

    engine.runRenderLoop(() => {
        scene.render();

        // Update remote players smoothing
        remotePlayers.forEach((mesh) => {
            if (mesh.metadata) {
                // Smoothly interpolate position (LERP)
                mesh.position = Vector3.Lerp(mesh.position, mesh.metadata.targetPos, 0.1);
                // Smoothly interpolate rotation (simple LERP for Y axis)
                mesh.rotation.y = mesh.rotation.y + (mesh.metadata.targetRot.y - mesh.rotation.y) * 0.1;
            }
        });

        // Send local player update
        if (socket.readyState === WebSocket.OPEN && socket.id) {
            const camera = scene.activeCamera;
            if (camera) {
                // Update Coords UI
                const coordsEl = document.getElementById("coords-ui");
                if (coordsEl) {
                    coordsEl.textContent = `X: ${camera.position.x.toFixed(1)} | Y: ${camera.position.y.toFixed(1)} | Z: ${camera.position.z.toFixed(1)}`;
                }

                socket.send(JSON.stringify({
                    type: "update",
                    id: socket.id,
                    pos: { x: camera.position.x, y: 0, z: camera.position.z },
                    rot: { x: 0, y: camera.rotation.y, z: 0 }
                }));
            }
        }
    });
});

window.addEventListener("resize", () => { engine.resize(); });

// Tutorial Logic
const firstName = urlParams.get("first_name");
if (firstName) {
    const tutorialUI = document.getElementById("tutorial-ui");
    const tutorialName = document.getElementById("tutorial-name");
    const tutorialClose = document.getElementById("tutorial-close");

    if (tutorialUI && tutorialName && tutorialClose) {
        tutorialName.textContent = firstName;
        tutorialUI.classList.remove("hidden");
        tutorialClose.addEventListener("click", () => {
            tutorialUI.classList.add("hidden");
        });
    }
}
