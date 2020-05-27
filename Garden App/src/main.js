import * as THREE from 'three';

import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { TextureLoader } from 'three';
import peeps from "./peeps";

import { createBubble } from "./bubbles";

var container, orbitControls, walkControls, fpsControls;
var camera, scene, renderer;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var isLocked = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var clock = new THREE.Clock();

const easelWood = { 
    "src": "Seamless-Wood-Texture-4.jpg", 
    "prep": (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 1);
    }
};

const quotes = [
    ["High five,", "you rock!"],
    ["Really nice to", "meet you!"],
    ["Your latest work", "was really", "awesome!"],
    ["So nice to", "finally meet!"],
    ["Wow, it's you!"],
    ["Thanks for", "being here!"],
]

const textures = {
    "Dok-01": { "src": "Dok5000-01.jpg" },
    "Dok-02": { "src": "Dok5000-Door-R.jpg" },
    "Dok-03": { "src": "Dok5000-Door-L.jpg" },
    "Dok-04": { "src": "Dok5000-02.jpg" },
    "Dok-05": { "src": "Dok5000-02.jpg" },
    "Dok-06": { "src": "Dok5000-02.jpg" },
    "Dok-Door-TopLeft": { "src": "Dok5000-Door-TopLeft.png" },
    "Dok-Door-TopRight": { "src": "Dok5000-Door-TopRight.png" },
    "FAF": { "src": "FAF.png" },
    "FrontWall": { "src": "BlackWall.jpg" },
    "Grass": {
        "src": "Grass.jpg", "prep": (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(20, 20);
        }
    },
    "RearWall": { "src": "BlackWall.jpg" },
    "Store-01": { "src": "Storage-01.jpg" },
    "Store-02": { "src": "Storage-01.jpg" },
    "Store-03": { "src": "Storage-01.jpg" },
    "Store-04": { "src": "Storage-01.jpg" },
    "Store-05": { "src": "Storage-01.jpg" },
    "Store-06": { "src": "Storage-01.jpg" },
    "StoreBack": { "src": "Right-Back.png" },
    "StoreRoof": {
        "src": "Storage-02.jpg", "prep": (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(1, 1);
        }
    },
    "Ole-Erling": { "src": "ole-erling.png" },
    "SkyHeroes": { "src": "skyheroes.png" },

    "EaselBackLeg": easelWood,
    "EaselLeftLeg": easelWood,
    "EaselRightLeg": easelWood,
    "EaselUpper": easelWood,
    "EaselCanvasSupport": easelWood,
    "EaselCanvasPlaceholder": easelWood,
    "Picture": { "src": "codegarden2020.jpg" },

    "Heads-Rasmus": { "src": "Heads-Rasmus.png" },
    "Heads-Shannon": { "src": "Heads-Shannon.png" },
    "Heads-Paul": { "src": "Heads-Paul.png" },
    "Heads-Adam": { "src": "Heads-Adam.png" },
    "Heads-Andrew": { "src": "Heads-Andrew.png" },
    "Heads-Nathan": { "src": "Heads-Nathan.png" },
    "Heads-Michael": { "src": "Heads-Michael.png" },
    "Heads-Skttl": { "src": "Heads-Skttl.png" },


}

function loadTextures(loader) {
    let promises = Object.keys(textures).map(key => {
        let promise = new Promise((res, rej) => {
            loader.load('./static/' + textures[key].src, tex => {
                tex.flipY = false;
                if (textures[key].prep) {
                    textures[key].prep(tex);
                }
                textures[key].texture = tex;
                res();
            }, null, () => {
                console.log(key + " failed");
                rej()
            });
        });
        promise.texKey = key;
        return promise;
    });
    return Promise.all(promises).then(() => {
        console.log(textures);
    });
}

function loadPeeps(loader) {
    let promises = Object.keys(peeps).map(key => {
        let promise = new Promise((res, rej) => {
            loader.load('./static/peeps/' + key + '.png', tex => {
                tex.flipY = true;
                peeps[key].texture = tex;
                res();
            }, null, () => {
                console.log(key + " failed");
                rej()
            });
        });
        promise.texKey = key;
        return promise;
    });
    return Promise.all(promises).then(() => {
        console.log(peeps);
    });
}

function createPanel(scale) {
    let center = scale / 2,
        geo = new THREE.PlaneGeometry(scale, scale),
        mat = new THREE.MeshBasicMaterial();
    return new THREE.Mesh(geo, mat);
}

const loadTexts = [
    "Bringing down the sky",
    "Virtualizing DOK5000",
    "Flying in people"
];
let loadTextIndex = 0;
function nextLoadText() {
    document.getElementById("loadText").innerText = loadTexts[loadTextIndex++];
}

init();

function init() {

    nextLoadText();

    container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 200);
    camera.position.set(-11.5, 3.2, 29.8);

    window.peeps = peeps;
    window.scene = scene = new THREE.Scene();

    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('./static/')
        .load('driving_school_2k.hdr', function (texture) {

            nextLoadText();

            var envMap = pmremGenerator.fromEquirectangular(texture).texture;

            scene.background = envMap;
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();

            // model

            var loader = new GLTFLoader().setPath('./static/');
            loader.load('garden.glb', function (gltf) {

                nextLoadText();

                scene.add(gltf.scene);
                console.log(gltf.scene);

                var textureLoader = new TextureLoader();

                var envTextures = loadTextures(textureLoader);
                var peepTextures = loadPeeps(textureLoader);

                Promise.all([envTextures, peepTextures])
                    .then(() => {
                        gltf.scene.traverse(function (child) {

                            if (child.isMesh && textures[child.name]) {

                                let mat = new THREE.MeshBasicMaterial();
                                mat.map = textures[child.name].texture;
                                mat.side = THREE.DoubleSide;
                                mat.needsUpdate = true;

                                if (textures[child.name].src.indexOf(".png") > -1) {
                                    mat.transparent = true;
                                }

                                child.material = mat;

                            }

                        });

                        Object.keys(peeps).forEach(key => {

                            var peep = peeps[key];
                            if (peep.pos) {
                                let scale = 4 * (peep.scale || 1),
                                    peepMesh = createPanel(scale),
                                    mat = peepMesh.material;

                                mat.map = peeps[key].texture;
                                mat.side = THREE.DoubleSide;
                                mat.needsUpdate = true;
                                mat.transparent = true;

                                peepMesh.position.x = peep.pos.x;
                                peepMesh.position.z = peep.pos.z;
                                peepMesh.position.y = scale / 2;
                                peepMesh.rotation.y = peep.rot;

                                peepMesh.name = key;
                                peepMesh.isPeep = true;
                                peepMesh.peep = peep;

                                if (!peep.fixed) {
                                    peepMesh.lookAt(camera.position.x, 2, camera.position.z);
                                }
                                scene.add(peepMesh);
                            }

                        });

                        camera.lookAt(scene.getObjectByName("umbracoffee-with-niels").position);

                        document.getElementById("loader").style.display = "none";
                        
                        animate();

                    });
            });

        });


    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    walkControls = new PointerLockControls(camera, document.body);
    scene.add(walkControls.getObject());

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('click', toggleLock, false);
}

function toggleLock() {
    if (isLocked) {
        walkControls.unlock();
    } else {
        walkControls.lock();
    }
    isLocked = !isLocked;
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();

}

function onKeyDown(event) {

    switch (event.keyCode) {

        case 38: // up
        case 87: // w
            moveForward = true;
            break;

        case 37: // left
        case 65: // a
            moveLeft = true;
            break;

        case 40: // down
        case 83: // s
            moveBackward = true;
            break;

        case 39: // right
        case 68: // d
            moveRight = true;
            break;

        case 32: // space
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;

    }

};

function onKeyUp(event) {

    switch (event.keyCode) {

        case 38: // up
        case 87: // w
            moveForward = false;
            break;

        case 37: // left
        case 65: // a
            moveLeft = false;
            break;

        case 40: // down
        case 83: // s
            moveBackward = false;
            break;

        case 39: // right
        case 68: // d
            moveRight = false;
            break;

    }

};

function figureMovement() {

    if (walkControls.isLocked === true) {

        var delta = clock.getDelta();
        var drag = 40;

        velocity.x -= velocity.x * drag * delta;
        velocity.z -= velocity.z * drag * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        walkControls.moveRight(- velocity.x * delta);
        walkControls.moveForward(- velocity.z * delta);

        let obj = walkControls.getObject();
        let xPos = obj.position.x;
        let zPos = obj.position.z;

        if (xPos < -19 || xPos > 19 || zPos < -19 || zPos > 36) {
            obj.position.x = xPos = Math.min(18.9, Math.max(-18.9, xPos));
            obj.position.z = zPos = Math.min(35.9, Math.max(-18.9, zPos));
        }

        Object.keys(peeps).forEach(key => {
            let peepMesh = scene.getObjectByName(key);
            if (peepMesh && !peeps[key].fixed) {
                peepMesh.lookAt(camera.position.x, 2 * (peepMesh.peep.scale || 1), camera.position.z);
            }
        });

        document.getElementById("output").innerText =
            parseInt(obj.position.x * 100) + ", " +
            parseInt(obj.position.z * 100) + ", " +
            parseInt(obj.position.y * 100);


        scene.traverse(peep => {
            if (!peep.isPeep || peep.peep.fixed) {
                return;
            }

            if (!peep.isTalking && peep.position.distanceTo(obj.position) < 5) {
                let chance = Math.random();
                if (chance < .008) {
                    peep.isTalking = true;
                    peep.startedTalking = new Date();
                    console.log(peep.name + " started talking " + peep.startedTalking);
                    let quoteNo = Math.floor(Math.random() * quotes.length);
                    let quote = quotes[quoteNo];
                    let texture = new THREE.CanvasTexture(createBubble.apply(null, quote));
                    let panel = createPanel(1.5);
                    panel.position.x = 1.5;
                    panel.position.z = .1;
                    panel.position.y = 2.25 / (peep.peep.scale || 1);
                    panel.material.map = texture;
                    panel.material.needsUpdate = true;
                    panel.material.transparent = true;
                    peep.add(panel);
                }
            } else if (peep.isTalking) {
                if (new Date() - peep.startedTalking > 5000) {
                    peep.isTalking = false;
                    console.log(peep.name + " stopped talking " + new Date());
                    peep.remove(peep.children[0]);
                }
            }
        });

    }
}

function animate() {
    figureMovement();
    render();
    requestAnimationFrame(animate);
}

function render() {

    renderer.render(scene, camera);

}