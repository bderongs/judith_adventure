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

// --- Santé du Joueur ---
let playerHP = 5;
const maxHP = 5;

function updateHealthUI() {
    const healthDiv = document.getElementById("health-ui");
    if (!healthDiv) return;
    
    let hearts = "";
    for (let i = 0; i < maxHP; i++) {
        if (i < playerHP) {
            hearts += "❤️ ";
        } else {
            hearts += "🖤 ";
        }
    }
    healthDiv.innerHTML = hearts;
}

function playerTakeDamage(amount) {
    if (playerHP <= 0) return; // Déjà mort
    
    playerHP -= amount;
    if (playerHP < 0) playerHP = 0;
    updateHealthUI();
    
    // Effet visuel simple (Bordure rouge)
    const canvas = document.getElementById("renderCanvas");
    canvas.style.transition = "box-shadow 0.1s";
    canvas.style.boxShadow = "inset 0 0 100px red";
    setTimeout(() => {
        canvas.style.boxShadow = "none";
    }, 200);

    if (playerHP === 0) {
        console.log("Game Over !");
        // Recharger la page après un court délai pour l'instant
        setTimeout(() => location.reload(), 1500);
    }
}

// --- Base de l'IA et Entités ---
const activeEnemies = [];

class Enemy {
    constructor(visualRoot, collider, hp = 3) {
        this.visualRoot = visualRoot;
        this.collider = collider;
        this.hp = hp;
        this.lastAttackTime = 0;
        
        // Lier le collider à cette instance pour le raycast
        this.collider.metadata = { type: "enemy", instance: this };
        activeEnemies.push(this);
    }

    takeDamage(amount) {
        this.hp -= amount;
        console.log(`Ennemi touché ! HP restants: ${this.hp}`);
        if (this.hp <= 0) {
            this.die();
        }
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
        
        // Calculer la distance (sur le plan X/Z)
        const dx = this.collider.position.x - camera.position.x;
        const dz = this.collider.position.z - camera.position.z;
        const distSq = dx*dx + dz*dz;
        
        if (distSq < 9) { // 3 mètres de distance au carré
            const now = performance.now();
            if (now - this.lastAttackTime > 1500) { // Cooldown de 1.5s
                this.lastAttackTime = now;
                this.attack(scene);
            }
        }
    }

    attack(scene) {
        console.log("Le Blob attaque !");
        
        // Animation de saut basique
        const jumpAnim = new Animation("jump", "position.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [
            { frame: 0, value: 0 },
            { frame: 10, value: 1.5 }, // Monte
            { frame: 20, value: 0 }  // Redescend
        ];
        jumpAnim.setKeys(keys);
        this.visualRoot.animations = [jumpAnim];
        
        scene.beginAnimation(this.visualRoot, 0, 20, false, 1.5, () => {
            // Appliquer les dégâts à la fin du saut
            playerTakeDamage(1);
        });
    }
}

// Setup
const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true);

const createScene = async function () {
    const scene = new Scene(engine);
    // Couleur du ciel (bleu clair)
    scene.clearColor = new Color3(0.5, 0.8, 0.9);

    // Activation de la physique (Havok)
    const havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, havokInstance);
    scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);

    // Activation des collisions simples
    scene.collisionsEnabled = true;
    // On augmente un peu la gravité de la caméra pour qu'elle retombe plus vite
    scene.gravity = new Vector3(0, -0.6, 0);

    // Camera FPS (UniversalCamera) - On commence à Y=1 (hauteur de la caméra au sol)
    const camera = new UniversalCamera("fpsCamera", new Vector3(0, 1, 0), scene);
    camera.setTarget(new Vector3(0, 2, -10));
    camera.attachControl(canvas, true);

    // Contrôles ZQSD (Clavier AZERTY / QWERTY)
    camera.keysUp.push(90, 87); // Z, W
    camera.keysDown.push(83);   // S
    camera.keysLeft.push(81, 65); // Q, A
    camera.keysRight.push(68);  // D
    
    // Collisions de la caméra
    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new Vector3(0.5, 1, 0.5);
    camera.minZ = 0.45;
    camera.speed = 0.4;
    camera.angularSensibility = 4000;

    // Lumière
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 1.5; // Plus intense
    light.groundColor = new Color3(0.3, 0.4, 0.3);

    // Lumière du soleil
    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
    dirLight.position = new Vector3(20, 40, 20);
    dirLight.intensity = 1.0;

    // Sol
    const mapSize = 150;
    const ground = MeshBuilder.CreateGround("ground", { width: mapSize, height: mapSize }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.3, 0.5, 0.2); // Vert forêt sombre
    ground.material = groundMat;
    
    ground.checkCollisions = true;
    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);

    // --- Eau (WaterMaterial) ---
    const waterMaterial = new WaterMaterial("waterMat", scene, new Vector2(512, 512));
    waterMaterial.backFaceCulling = true;
    waterMaterial.bumpTexture = new Texture("https://playground.babylonjs.com/textures/waterbump.png", scene);
    waterMaterial.windForce = -5;
    waterMaterial.waveHeight = 0.2;
    waterMaterial.bumpHeight = 0.1;
    waterMaterial.waterColor = new Color3(0.1, 0.5, 0.7);
    waterMaterial.colorBlendFactor = 0.3;
    waterMaterial.addToRenderList(ground);
    
    // Créer quelques zones d'eau
    for (let i = 0; i < 4; i++) {
        const waterMesh = MeshBuilder.CreateGround(`water${i}`, { width: 30, height: 30 }, scene);
        // On place l'eau très légèrement au dessus du sol pour éviter le z-fighting
        waterMesh.position = new Vector3((Math.random() - 0.5) * 80, 0.05, (Math.random() - 0.5) * 80);
        waterMesh.material = waterMaterial;
    }

    // --- Chargement des Assets de la forêt ---
    const assetsPath = "/assets/Stylized Nature MegaKit[Standard]/glTF/";
    
    const modelsToLoad = [
        "CommonTree_1.gltf",
        "Pine_1.gltf",
        "TwistedTree_1.gltf",
        "Rock_Medium_1.gltf",
        "Rock_Medium_2.gltf",
        "Grass_Common_Tall.gltf"
    ];

    const loadedModels = {};

    for (const modelName of modelsToLoad) {
        // ImportMeshAsync renvoie un tableau de meshes
        const result = await SceneLoader.ImportMeshAsync("", assetsPath, modelName, scene);
        const rootMesh = result.meshes[0];
        
        // On cache les meshes originaux car ils servent de base pour les instances
        result.meshes.forEach(m => {
            m.isVisible = false;
        });
        
        loadedModels[modelName] = rootMesh;
    }

    // --- Chargement des Ennemis ---
    const monsterPath = "/assets/Ultimate Monsters/Blob/glTF/";
    const monstersToLoad = ["GreenBlob.gltf", "PinkBlob.gltf"];
    const loadedMonsters = {};

    for (const modelName of monstersToLoad) {
        const result = await SceneLoader.ImportMeshAsync("", monsterPath, modelName, scene);
        const rootMesh = result.meshes[0];
        result.meshes.forEach(m => { m.isVisible = false; });
        loadedMonsters[modelName] = rootMesh;
    }

    // --- Chargement de l'Arme ---
    const weaponPath = "/assets/Ultimate RPG Items Pack - Aug 2019/OBJ/";
    const weaponResult = await SceneLoader.ImportMeshAsync("", weaponPath, "Sword.obj", scene);
    const sword = weaponResult.meshes[0];
    
    // Attacher l'arme à la caméra
    sword.setParent(camera);
    sword.rotationQuaternion = null; // Important pour animer la propriété .rotation
    
    // Position (X: droite, Y: bas, Z: avant)
    sword.position = new Vector3(0.6, -0.5, 1.5);
    // Rotation pour pointer vers l'avant et la tenir droite
    sword.rotation = new Vector3(Math.PI / 6, Math.PI, 0); 
    // Le modèle de base a déjà une taille correcte, l'échelle 0.02 était trop petite
    sword.scaling = new Vector3(1, 1, 1);

    // --- Génération de la Forêt ---
    const numTrees = 200;
    const numRocks = 40;
    const numGrass = 400;

    const treeTypes = ["CommonTree_1.gltf", "Pine_1.gltf", "TwistedTree_1.gltf"];
    
    // Fonction pour générer des instances aléatoirement sur la carte
    const spawnInstances = (modelKeys, count, scaleRange, addCollisions) => {
        for (let i = 0; i < count; i++) {
            const randomKey = modelKeys[Math.floor(Math.random() * modelKeys.length)];
            const rootMesh = loadedModels[randomKey];
            
            // Instanciation du modèle (beaucoup plus performant que le clonage simple)
            const instanceRoot = rootMesh.instantiateHierarchy();
            if (!instanceRoot) continue;
            
            // Position aléatoire
            const x = (Math.random() - 0.5) * (mapSize - 10);
            const z = (Math.random() - 0.5) * (mapSize - 10);
            
            const scale = scaleRange[0] + Math.random() * (scaleRange[1] - scaleRange[0]);
            
            instanceRoot.position = new Vector3(x, 0, z);
            instanceRoot.rotation = new Vector3(0, Math.random() * Math.PI * 2, 0);
            instanceRoot.scaling = new Vector3(scale, scale, scale);

            // Ajout d'un collider invisible pour les arbres et rochers
            if (addCollisions) {
                // Pour optimiser les reflets, on n'ajoute que les objets majeurs (arbres/rochers) à l'eau
                instanceRoot.getChildMeshes().forEach(m => {
                    waterMaterial.addToRenderList(m);
                });

                // Un cylindre invisible sert de collider physique et de cible pour les attaques
                const collider = MeshBuilder.CreateCylinder("collider", { 
                    height: 10 * scale, 
                    diameter: 1.5 * scale  
                }, scene);
                collider.position = new Vector3(x, 5 * scale, z);
                collider.isVisible = false; // Invisible
                collider.checkCollisions = true; // Collision caméra
                
                // Lien entre le collider (cible) et le visuel (l'arbre) pour le détruire
                collider.metadata = { type: "environment", visualRoot: instanceRoot };
                
                // Physique Havok (mass = 0 pour objets statiques)
                new PhysicsAggregate(collider, PhysicsShapeType.CYLINDER, { mass: 0 }, scene);
            }
        }
    };

    // Apparition des différents éléments (Échelle ajustée pour les modèles GLTF)
    spawnInstances(treeTypes, numTrees, [0.8, 1.5], true);
    spawnInstances(["Rock_Medium_1.gltf", "Rock_Medium_2.gltf"], numRocks, [0.5, 1.5], true);
    spawnInstances(["Grass_Common_Tall.gltf"], numGrass, [0.5, 1.0], false); // Pas de collision pour l'herbe

    // --- Apparition des Ennemis ---
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

        // Collider pour le monstre
        const collider = MeshBuilder.CreateCylinder("collider", { 
            height: 1.5 * scale, 
            diameter: 1.0 * scale  
        }, scene);
        collider.position = new Vector3(x, 0.75 * scale, z);
        collider.isVisible = false;
        collider.checkCollisions = true;
        
        new PhysicsAggregate(collider, PhysicsShapeType.CYLINDER, { mass: 0 }, scene);

        // Créer l'objet logique Enemy (3 PV)
        new Enemy(instanceRoot, collider, 3);
    }

    let isAttacking = false;

    // Fonction d'attaque (Raycast + Animation)
    const performAttack = () => {
        if (isAttacking) return;
        isAttacking = true;

        // Animation simple de l'épée (Coup vers le bas)
        const attackAnim = new Animation("swing", "rotation.x", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const keys = [
            { frame: 0, value: Math.PI / 6 },
            { frame: 10, value: Math.PI / 2 }, // L'épée s'abaisse plus lentement
            { frame: 30, value: Math.PI / 6 } // L'épée revient
        ];
        attackAnim.setKeys(keys);
        sword.animations = [attackAnim];
        
        // Jouer l'animation
        scene.beginAnimation(sword, 0, 30, false, 1.5, () => {
            isAttacking = false;
        });

        // Raycast depuis le centre de la caméra vers l'avant
        const origin = camera.globalPosition;
        const forward = camera.getDirection(new Vector3(0, 0, 1));
        const ray = new Ray(origin, forward, 8); // Portée de 8 mètres
        
        // On cherche un collider avec l'arme
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

    // Pointe Lock et Attaque (Clic Gauche)
    scene.onPointerDown = (evt) => {
        if (evt.button === 0) { // Clic gauche
            engine.enterPointerlock();
            
            // Si le pointeur est déjà bloqué (on joue), on attaque
            if (document.pointerLockElement === canvas) {
                performAttack();
            }
        }
    };

    // Gestion du clavier (Saut et Attaque)
    window.addEventListener("keydown", (evt) => {
        if (evt.code === "Space") {
            // Saut simple et rapide sans vérification du sol
            camera.cameraDirection.y = 0.8;
        }
        
        // Attaque avec la touche "Y" (y minuscule ou majuscule)
        if (evt.key.toLowerCase() === "y" && document.pointerLockElement === canvas) {
            performAttack();
        }
    });

    // Boucle principale d'IA
    scene.onBeforeRenderObservable.add(() => {
        for (const enemy of activeEnemies) {
            enemy.update(camera, scene);
        }
    });

    // Initialisation
    updateHealthUI();

    return scene;
};

createScene().then(scene => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    engine.resize();
});

// --- Tutorial Logic ---
const urlParams = new URLSearchParams(window.location.search);
const firstName = urlParams.get('first_name');

if (firstName) {
    const tutorialUI = document.getElementById('tutorial-ui');
    const tutorialName = document.getElementById('tutorial-name');
    const tutorialClose = document.getElementById('tutorial-close');

    if (tutorialUI && tutorialName && tutorialClose) {
        tutorialName.textContent = firstName;
        tutorialUI.classList.remove('hidden');

        tutorialClose.addEventListener('click', () => {
            tutorialUI.classList.add('hidden');
        });
    }
}
