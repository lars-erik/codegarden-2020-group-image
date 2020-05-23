import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { RoughnessMipmapper } from 'three/examples/jsm/utils/RoughnessMipmapper';
import { TextureLoader } from 'three';

var container, controls;
var camera, scene, renderer;

const textures = {
    "Dok-01": { "src": "Dok5000-01.jpg" },
    "Dok-02": { "src": "Dok5000-Door-R.jpg" },
    "Dok-03": { "src": "Dok5000-Door-L.jpg" },
    "Dok-04": { "src": "Dok5000-02.jpg" },
    "Dok-05": { "src": "Dok5000-02.jpg" },
    "FAF": { "src": "Dok5000bg.png" },
    "FrontWall": { "src": "BlackWall.jpg" },
    "Grass": { "src": "Grass.jpg" },
    "Lars": { "src": "Lars.png" },
    "Marc": { "src": "Marc.png" },
    "RearWall": { "src": "BlackWall.jpg" },
    "Store-01": { "src": "Storage-01.jpg" },
    "Store-02": { "src": "Storage-01.jpg" },
    "Store-03": { "src": "Storage-01.jpg" },
    "Store-04": { "src": "Storage-01.jpg" },
    "Store-05": { "src": "Storage-01.jpg" },
    "StoreBack": { "src": "Right-Back.png" }
}

function loadTextures(loader) {
    let promises = Object.keys(textures).map(key => {
        let promise = new Promise((res, rej) => {
            loader.load('./static/' + textures[key].src, tex => {
                textures[key].texture = tex;
                res();
            }, () => rej());
        });
        promise.texKey = key;
        return promise;
    });
    return Promise.all(promises).then(() => {
        console.log(textures);
    });
}

init();
render();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 200 );
    camera.position.set( 30, 15, 0 );

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

            render();

            // model

            // use of RoughnessMipmapper is optional
            var roughnessMipmapper = new RoughnessMipmapper( renderer );

            var loader = new GLTFLoader().setPath( './static/' );
            loader.load( 'garden.glb', function ( gltf ) {

                // gltf.scene.traverse( function ( child ) {

                //     console.log(child.name);

                //     if ( child.isMesh ) {
                //         // TODO: Need this?
                //         roughnessMipmapper.generateMipmaps( child.material );

                //     }

                // } );

                scene.add( gltf.scene );

                console.log(gltf.scene);

                roughnessMipmapper.dispose();

                loadTextures(new TextureLoader())
                    .then(() => {
                        gltf.scene.traverse( function ( child ) {

                            if ( child.isMesh ) {
        
                                let mat = new THREE.MeshBasicMaterial();
                                mat.map = textures[child.name].texture;
                                mat.needsUpdate = true;
                                child.material = mat;
        
                            }
        
                        } );

                        render();

                    });


            } );

        } );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    var pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.minDistance = 5;
    controls.maxDistance = 50;

    let marcPos = scene.children[0].getObjectByName('Marc').position;

    controls.target.set( 50, 100, 0 );
    controls.update();

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}

//

function render() {

    renderer.render( scene, camera );

}