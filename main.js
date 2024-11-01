import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
// import { OBB } from 'three/addons/math/OBB.js';

let mixer;
let racer;
let animationsMap = {};
let currentAnimationAction;
let speed = 0.3;
const cars = [];
// let racerOBB, objOBB;

const move = {
    isMoving : false,
    isPicking : false,
    up : false,
    down : false,
    left : false,
    right : false
}

const shutterSound = new Audio('audio/shutter.mp3');

const itemMission = {
    ball : false,
    glass : false,
    pants : false
}

const spots = [
    { name: "glass", position: new THREE.Vector3(0, 1, 2), radius: 10 },
    { name: "ball", position: new THREE.Vector3(20, -0.3, -15), radius: 10 },
    { name: "pants", position: new THREE.Vector3(-50, 1, -15), radius: 10 }
];


let objects = [];
let selectedObject = null;
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0,-1,0);
const racerPosition = new THREE.Vector3();

// 렌더러, 씬, 카메라 설정
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setClearColor(0xabcdef); // 밝은 하늘색으로 설정

document.body.appendChild(renderer.domElement);

// 조명 추가
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
scene.add(directionalLight);


// 텍스처 로더
const textureLoader = new THREE.TextureLoader();
const waterTexture = textureLoader.load('img/water.jpg');
const sandTexture = textureLoader.load('img/sand.jpg');
const roadTexture = textureLoader.load('img/road.png');


// 평면 지오메트리 생성
const planeGeometry = new THREE.PlaneGeometry(200, 90);
const waterMaterial = new THREE.MeshBasicMaterial({ map: waterTexture });
const sandMaterial = new THREE.MeshBasicMaterial({ map: sandTexture });
const roadMaterial = new THREE.MeshBasicMaterial({ map: roadTexture });


// plane 생성
const waterPlane = new THREE.Mesh(planeGeometry, waterMaterial);
waterPlane.rotateX(-Math.PI / 2);
waterPlane.position.set(0, 0, -90);
waterPlane.name = "waterPlane";
scene.add(waterPlane);

const sandPlane = new THREE.Mesh(planeGeometry, sandMaterial);
sandPlane.rotation.x = -Math.PI / 2;
sandPlane.name = "sandPlane";
scene.add(sandPlane);

const roadPlane = new THREE.Mesh(planeGeometry, roadMaterial);
roadPlane.rotation.x = -Math.PI / 2; // 바닥에 평면을 놓기 위해 회전
roadPlane.position.set(0, 0, 90);
roadPlane.name = "roadPlane";
scene.add(roadPlane);


// 카메라 위치 설정
camera.position.set(0, 100, 200);
camera.lookAt(0, 0, 0);


// racer model 생성
function setupRacerAnimation(gltf) {
    // const racer = gltf.scene;
    mixer = new THREE.AnimationMixer(racer);
    const gltfAnimations = gltf.animations;

    gltfAnimations.forEach(animationClip => {
        const name = animationClip.name;
        console.log(name);

        const animationAction = mixer.clipAction(animationClip);
        animationsMap[name] = animationAction;
    })

    currentAnimationAction = animationsMap["Racer_stand"];
    currentAnimationAction.play();
}

const gltfloader = new GLTFLoader();

gltfloader.load( './data/racer.glb', function ( gltf ) {
    racer = gltf.scene;
    racer.scale.set(0.05,0.05,0.05);
    racer.rotateY(Math.PI);
    racer.position.set(0,4.5,134);
    racer.userData = {
        planePosition : "",
    }
    scene.add( racer );

    setupRacerAnimation(gltf);
}, undefined, function ( error ) {
    console.error( error );
});

function checkCollision() {
    if(racer) {
        const racerBox = new THREE.Box3().setFromObject(racer);
        racerBox.min.z -= 2;
        racerBox.max.z -= 12;
        
        objects.forEach(obj => {
            let objBox = new THREE.Box3().setFromObject(obj);
            if(racerBox.intersectsBox(objBox)) {
                racer.position.set(0,4.5,134);
            }
        });

    }
}

document.addEventListener('keydown', onkeydown);
document.addEventListener('keyup', onkeyup);

function setupRacerMovingShape(isMoving) {
    move.isMoving = isMoving;
    if (currentAnimationAction) {
        currentAnimationAction.stop();
    }

    if(racer.userData.planePosition === "waterPlane") {
        currentAnimationAction = animationsMap[isMoving ? "Racer_swim":"Racer_swim_stand"];
        racer.position.setY( isMoving ? 1 : -2);
    }
    else {
        
        currentAnimationAction = animationsMap[isMoving ? "Racer_run" : "Racer_stand"];
    }
    currentAnimationAction.play();
}

function onkeydown(event) {
    if(event.key === 'ArrowUp') {
        if (!move.isMoving) {  // 움직이고 있지 않을 때만 애니메이션을 시작합니다.
            setupRacerMovingShape(true);
            move.up = true;
        }
    }
    else if(event.key === 'ArrowRight') { // 오른쪽 화살표 키
        if (!move.isMoving) {  // 움직이고 있지 않을 때만 애니메이션을 시작합니다.
            setupRacerMovingShape(true);
            move.right = true;
        }
    }
    else if(event.key === 'ArrowDown') { // 오른쪽 화살표 키
        if (!move.isMoving) {  // 움직이고 있지 않을 때만 애니메이션을 시작합니다.
            setupRacerMovingShape(true);
            move.down = true;
        }
    }
    else if(event.key === 'ArrowLeft') { // 오른쪽 화살표 키
        if (!move.isMoving) {  // 움직이고 있지 않을 때만 애니메이션을 시작합니다.
            setupRacerMovingShape(true);
            move.left = true;
        }
    }
    else if(event.key === ' ') {
        let racerPosition = new THREE.Vector3();
        racer.getWorldPosition(racerPosition);

        const isWithinItemSpot = spots.some(spot => {
            const distance = racerPosition.distanceTo(spot.position);
            
            if(distance <= spot.radius) {
                itemMission[spot.name] = true;
                updateItemState(spot.name);
                console.log(itemMission);
                return true;
            }
            else {
                return false;
            }
           
        });

        if(isWithinItemSpot) {
            shutterSound.play();
        }
    }
}



function onkeyup(event) {
    if(event.key === 'ArrowUp') {
        setupRacerMovingShape(false);
        move.up = false;
    }
    else if(event.key === 'ArrowRight') {
        setupRacerMovingShape(false);
        move.right = false;
    }
    else if(event.key === 'ArrowDown') {
        setupRacerMovingShape(false);
        move.down = false;
    }
    else if(event.key === 'ArrowLeft') {
        setupRacerMovingShape(false);
        move.left = false;
    }
    else if(event.key === ' ') {
        move.isPicking = false;
    }
}

function checkRacerPosition() {
    if(racer){
        racer.getWorldPosition(racerPosition);
        raycaster.set(racerPosition, downVector);
        const intersects = raycaster.intersectObjects([sandPlane, roadPlane, waterPlane]);

        const previousRacerPosition = racer.userData.planePosition;

        if(intersects.length > 0) {
            if(previousRacerPosition !== intersects[0].object.name) {
                move.isMoving = false;
            }
            if(intersects[0].object.name === "waterPlane"){
                racer.userData.planePosition = "waterPlane";
            }
            else if(intersects[0].object.name === "roadPlane"){
                racer.userData.planePosition = "roadPlane";
            }
            else if(intersects[0].object.name === "sandPlane"){
                racer.userData.planePosition = "sandPlane";
            }
            else {
                racer.userData.planePosition = "";
            }
        }
    }
    else {
        // racer.userData.planePosition = "";
    }
}

function updateItemState(itemName) {
    console.log(itemName);
    const text = document.getElementById(itemName); // Directly use itemName
    console.log(text);
    if (!text) {
        console.error('No element found for ID:', itemName);
        return; // Exit the function if no element is found
    }
    switch (itemName) {
        case 'ball':
            text.textContent = '🏀 O';
            break;
        case 'glass':
            text.textContent = '🥽 O';
            break;
        case 'pants':
            text.textContent = '👖 O';
            break;
        default:
            console.warn('Unhandled item:', itemName);
            break;
    }
}


const fbxloader = new FBXLoader();

const carModelConfigs = [
    { file: 'models/car1.fbx', position: [85, 0, 57], scale: 0.06, rotation: [Math.PI*3/2, 0, Math.PI/2], isLtR: false, speed: 1.2 },
    { file: 'models/car2.fbx', position: [80, 0, 83], scale: 0.023, rotation: [0, Math.PI*3/2, 0], isLtR: false, speed: 0.7 },
    { file: 'models/car1.fbx', position: [-80, 0, 102], scale: 0.06, rotation: [Math.PI*3/2, 0, Math.PI*3/2], isLtR: true, speed: 0.8 },
    { file: 'models/car2.fbx', position: [-80, 0, 120], scale: 0.023, rotation: [0, Math.PI/2, 0], isLtR: true, speed: 1.0 },
    // Add more configurations here
];

function loadCarModel(config) {
    fbxloader.load(config.file, (object) => {
        object.position.set(...config.position);
        object.scale.set(config.scale, config.scale, config.scale);
        object.rotation.set(...config.rotation);
        object.userData = { isLtR: config.isLtR, speed: config.speed };
        scene.add(object);
        cars.push(object); 
        objects.push(object);


    }, undefined, function (error) {
        console.error(`An error happened while loading ${config.file}:`, error);
    });
}

carModelConfigs.forEach(config => loadCarModel(config));


function carAnimation(car) {
    if(car.userData.isLtR) {
        car.position.x += car.userData.speed;

        if(car.position.x > 80) {
            car.position.x = -80;
        }
    }
    else {
        car.position.x -= car.userData.speed;

        if(car.position.x < -80) {
            car.position.x = 80;
        }
    }
}

const beachModelConfigs = [
    { file: 'models/fbxTent.fbx', position: [40, -2.8, -15], scale: 2, rotation: [0,Math.PI/2,0] },
    { file: 'models/glasses.fbx', position: [0, 1, 2], scale: 0.01, rotation: [0,Math.PI/2,0] },
    { file: 'models/fbxTent.fbx', position: [20, -2.8, -15], scale: 2, rotation: [0,Math.PI/2,0] },
    { file: 'models/ball.fbx', position: [20, -0.3, -15], scale: 0.01, rotation: [0,Math.PI/2,0] },
    { file: 'models/fbxTent.fbx', position: [-50, -2.8, -15], scale: 2, rotation: [0,Math.PI/2,0] },
    { file: 'models/pants.fbx', position: [-50, 1, -15], scale: 0.1, rotation: [Math.PI*3/2,0,0] },
    { file: 'models/tree1.fbx', position: [60, 1, 0], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree1.fbx', position: [0, 1, 0], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree1.fbx', position: [-60, 1, 0], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [80, 0, 35], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [60, 0, 35], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [40, 0, 35], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [20, 0, 35], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [0, 0, 35], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [-80, 0, 35], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [-60, 0, 35], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [-40, 0, 35], scale: 0.02, rotation: [0,0,0] },
    { file: 'models/tree2.fbx', position: [-20, 0, 35], scale: 0.02, rotation: [0,0,0] },
];

function loadBeachModel(config) {
    fbxloader.load(config.file, (object) => {
        object.position.set(...config.position);
        object.scale.set(config.scale, config.scale, config.scale);
        object.rotation.set(...config.rotation);
        scene.add(object);
    }, undefined, function (error) {
        console.error(`An error happened while loading ${config.file}:`, error);
    });
}

beachModelConfigs.forEach(config => loadBeachModel(config));


function setupCameraPosition() {
    if (racer) { 
        camera.position.x = racer.position.x;
        camera.position.y = racer.position.y + 5;
        camera.position.z = racer.position.z + 20; 

        camera.lookAt(racer.position);
    }
}

function updateRacerDirection() {
    if (move.right) {
        racer.rotation.y = Math.PI / 2;
    } else if (move.left) {
        racer.rotation.y = -Math.PI / 2; 
    } else if (move.up) {
        racer.rotation.y = 0; 
    } else if (move.down) {
        racer.rotation.y = Math.PI; 
    }
}


const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    if(move.isMoving) {
        if(move.up) {
            if(racer.position.z > -135 && (racer.position.z > -44 || itemMission.ball && itemMission.glass && itemMission.pants)) {
                racer.position.z -= speed;
            }
        }
        if(move.down) {
            if(racer.position.z < 135) {
                racer.position.z += speed;
            }
            
        }
        if(move.right) {
            if(racer.position.x < 100){
                racer.position.x += speed;
            }
        }
        if(move.left) {
            if(racer.position.x > -100){
                racer.position.x -= speed;
            }
        }

        updateRacerDirection();
    }

    cars.forEach(car => carAnimation(car));

    const delta = clock.getDelta(); // Get the delta time since last frame
    if (mixer) mixer.update(delta);

    checkRacerPosition();

    checkCollision();


    setupCameraPosition();

    renderer.render(scene, camera);
}

animate();