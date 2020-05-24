import * as THREE from 'three';

import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { TextureLoader } from 'three';

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

const textures = {
    "Dok-01": { "src": "Dok5000-01.jpg" },
    "Dok-02": { "src": "Dok5000-Door-R.jpg" },
    "Dok-03": { "src": "Dok5000-Door-L.jpg" },
    "Dok-04": { "src": "Dok5000-02.jpg" },
    "Dok-05": { "src": "Dok5000-02.jpg" },
    "Dok-06": { "src": "Dok5000-02.jpg" },
    "FAF": { "src": "Dok5000bg.png" },
    "FrontWall": { "src": "BlackWall.jpg" },
    "Grass": { "src": "Grass.jpg", "prep": (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(20, 20);
    } },
    "RearWall": { "src": "BlackWall.jpg" },
    "Store-01": { "src": "Storage-01.jpg" },
    "Store-02": { "src": "Storage-01.jpg" },
    "Store-03": { "src": "Storage-01.jpg" },
    "Store-04": { "src": "Storage-01.jpg" },
    "Store-05": { "src": "Storage-01.jpg" },
    "Store-06": { "src": "Storage-01.jpg" },
    "StoreBack": { "src": "Right-Back.png" },


    "alan": { "src": "peeps/alan.png" },
    "dang": { "src": "peeps/dang.png" },
    "genc": { "src": "peeps/genc.png" },
    "giraffe-01": { "src": "peeps/giraffe-01.png" },
    "jason-and-mark": { "src": "peeps/jason-and-mark.png" },
    "lars": { "src": "peeps/lars.png" },
    "lee": { "src": "peeps/lee.png" },
    "marc": { "src": "peeps/marc.png" },
    "matt-b": { "src": "peeps/matt-b.png" },
    "owain": { "src": "peeps/owain.png" },
    "per": { "src": "peeps/per.png" },
    "rabbit-01": { "src": "peeps/rabbit-01.png" },
    "rabbit-02": { "src": "peeps/rabbit-01.png" },
    "ravi": { "src": "peeps/ravi.png" },

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

init();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 200 );
    camera.position.set( 0, 3.2, 5 );

    scene = new THREE.Scene();

    new RGBELoader()
        .setDataType( THREE.UnsignedByteType )
        .setPath( './static/' )
        .load( 'driving_school_2k.hdr', function ( texture ) {

            var envMap = pmremGenerator.fromEquirectangular( texture ).texture;

            scene.background = envMap;
            scene.environment = envMap;

            texture.dispose();
            pmremGenerator.dispose();

            // model

            var loader = new GLTFLoader().setPath( './static/' );
            loader.load( 'garden.glb', function ( gltf ) {

                scene.add( gltf.scene );
                console.log(gltf.scene);

                loadTextures(new TextureLoader())
                    .then(() => {
                        gltf.scene.traverse( function ( child ) {

                            if ( child.isMesh && textures[child.name] ) {
        
                                let mat = new THREE.MeshBasicMaterial();
                                mat.map = textures[child.name].texture;
                                mat.side = THREE.DoubleSide;
                                mat.needsUpdate = true;

                                if (textures[child.name].src.indexOf(".png") > -1) {
                                    mat.transparent = true;
                                }

                                child.material = mat;
        
                            }
        
                        } );

                        animate();

                    });
            } );

        } );

    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

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
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;

        }

    };

    var onKeyUp = function ( event ) {

        switch ( event.keyCode ) {

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

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    var pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    walkControls = new PointerLockControls( camera, document.body );
    scene.add(walkControls.getObject());

    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'click', toggleLock, false );
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

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}

function figureMovement() {
    
    if ( walkControls.isLocked === true ) {

        var delta = clock.getDelta();
        var drag = 40;

        velocity.x -= velocity.x * drag * delta;
        velocity.z -= velocity.z * drag * delta;

        // velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); // this ensures consistent movements in all directions

        if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

        // if ( onObject === true ) {

        //     velocity.y = Math.max( 0, velocity.y );
        //     canJump = true;

        // }

        walkControls.moveRight( - velocity.x * delta );
        walkControls.moveForward( - velocity.z * delta );

        // controls.getObject().position.y += ( velocity.y * delta ); // new behavior

        // if ( controls.getObject().position.y < 10 ) {

        //     velocity.y = 0;
        //     controls.getObject().position.y = 10;

        //     canJump = true;

        // }

        // prevTime = time;

    }
}

function animate() {
    figureMovement();
    render();
    requestAnimationFrame(animate);
}

function render() {

    renderer.render( scene, camera );

}