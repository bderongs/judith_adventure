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
            waterMesh.position = new Vector3((Math.random() - 0.5) * 80, 0.05, (Math.random() - 0.5) * 80);
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
            const randomKey = modelKeys[Math.floor(Math.random() * modelKeys.length)];
            const rootMesh = loadedModels[randomKey];
            const instanceRoot = rootMesh.instantiateHierarchy();
            if (!instanceRoot) continue;

            const x = (Math.random() - 0.5) * (mapSize - 10);
            const z = (Math.random() - 0.5) * (mapSize - 10);
            const scale = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]);

            instanceRoot.position = new Vector3(x, 0, z);
            instanceRoot.rotation = new Vector3(0, Math.random() * Math.PI * 2, 0);
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
        const randomKey = monstersToLoad[Math.floor(Math.random() * monstersToLoad.length)];
        const rootMesh = loadedMonsters[randomKey];
        const instanceRoot = rootMesh.instantiateHierarchy();
        if (!instanceRoot) continue;

        const x = (Math.random() - 0.5) * (mapSize - 10);
        const z = (Math.random() - 0.5) * (mapSize - 10);
        const scale = 1.0;

        instanceRoot.position = new Vector3(x, 0, z);
        instanceRoot.rotation = new Vector3(0, Math.random() * Math.PI * 2, 0);
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
        const hit = scene.pickWithRay(ray, (mesh) => mesh.name === "collider");

        if (hit.hit && hit.pickedMesh && hit.pickedMesh.metadata) {
            const meta = hit.pickedMesh.metadata;
            if (meta.type === "environment") {
                console.log("Décor détruit !");
                meta.visualRoot.dispose();
                hit.pickedMesh.dispose();
            } else if (meta.type === "enemy") {
                meta.instance.takeDamage(1);
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

    // AI loop
    scene.onBeforeRenderObservable.add(() => {
        for (const enemy of activeEnemies) {
            enemy.update(camera, scene);
        }
    });

    updateHealthUI();
    return scene;
};

// ============================================================
//  BOOTSTRAP
// ============================================================
buildWorldMenu();

createScene().then(scene => {
    engine.runRenderLoop(() => { scene.render(); });
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
