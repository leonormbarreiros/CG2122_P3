/* Clock -> ensure animations display at constant speed */
var clock = new THREE.Clock(true);
var dt = clock.getDelta();
var speed = 100;
var timeTarget = 0;

/* Auxiliaries -> cameras, scene and renderer */
var camera1, camera2;
var camera, scene, renderer;

/* Objects */
var plane_mat_lambert  , plane_mat_phong  , plane_mat_basic  ;  
var podium1_mat_lambert, podium1_mat_phong, podium1_mat_basic;
var podium2_mat_lambert, podium2_mat_phong, podium2_mat_basic;
var step1_mat_lambert  , step1_mat_phong  , step1_mat_basic  ;
var step2_mat_lambert  , step2_mat_phong  , step2_mat_basic  ;
var step3_mat_lambert  , step3_mat_phong  , step3_mat_basic  ;
var sphere_mat_lambert, sphere_mat_phong, sphere_mat_basic;
var cone_mat_lambert, cone_mat_phong, cone_mat_basic;

var spotlightShape1, spotlightShape2, spotlightShape3;
var directionalLight, spotlight1, spotlight2, spotlight3;

/* Auxiliaries -> for creating meshes */
var mesh, geometry, material;

/* Auxiliaries -> scale of objects (in regard to A4) and rotation angle */
var scale = 5, angle = 0.01;

/* Booleans for helping with event management */
var is_camera1 = true , is_camera2  = false; // switch of cameras
var is_rot1    = false, is_rot1_pos = false; // rotation of "step1" obj
var is_rot2    = false, is_rot2_pos = false; // rotation of "step2" obj
var is_rot3    = false, is_rot3_pos = false; // rotation of "step3" obj
var is_gouraud = false;  // type of shading: Gouraud (Lambert material)
var is_paused  = false; // indicates if the scene is paused
var is_refresh = false; // indicates if we need to refresh the scene
var dActive, zActive, xActive, cActive;

/* Texture -> origami paper */
const texture = new THREE.TextureLoader().load('textures/texture.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(0.05,0.05);

/* Pause screen */
var pause;

/* Auxiliaries for window size */
var prev_width, prev_height;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Init fucntion that defines the renderer and calls the auxiliary functions 
 * to create the scene and the cameras.
 */
function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    //VR
    renderer.xr.enabled = true;
    document.body.appendChild( VRButton.createButton( renderer ) );
    
    document.body.appendChild(renderer.domElement);
   
    createScene();
    createCamera();
    createPauseScreen();
    camera = camera1;
    
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
}

/**
 * Set up the Scene 
 */
 function createScene() {
    'use strict';
    
    scene = new THREE.Scene();
    var helper = new THREE.AxesHelper(100);
    helper.translateY( .1);

    scene.add(helper);

    //add directional light
    directionalLight = new THREE.DirectionalLight('white', 1.2);
    directionalLight.position.set(200,200,200);
    directionalLight.rotation.x = Math.PI / 4;
    scene.add(directionalLight);

    createPlane();
    createPodium();

    createStep1(-100,200,0);
    createStep2(0, 215, 0);
    createStep3(80,150,0);

    //SpotLight( color : Integer, intensity : Float, distance : Float, angle : Radians, penumbra : Float, decay : Float )
    spotlight1 = new THREE.SpotLight('white', 60, 230, Math.PI/3, 0.2, 1.2);
    spotlight1.position.set(-100, 270, 0)
    spotlight1.target.position.set(-100, 100, 0);
    scene.add(spotlight1);
    scene.add(spotlight1.target);
    spotlightShape1 = new THREE.Group();
    createSpotlight1(spotlightShape1, -100, 270, 0);
    scene.add(spotlightShape1);

    spotlight2 = new THREE.SpotLight('white', 60, 230, Math.PI/3, 0.2, 1.2);
    spotlight2.position.set(0, 270, 0);
    spotlight2.target.position.set(0, 100, 0);
    scene.add(spotlight2);
    scene.add(spotlight2.target);
    spotlightShape2 = new THREE.Group();
    createSpotlight2(spotlightShape2, 0, 270, 0);
    scene.add(spotlightShape2);

    spotlight3 = new THREE.SpotLight('white', 60, 230, Math.PI/3, 0.2, 1.2);
    spotlight3.position.set(100, 270, 0);
    spotlight3.target.position.set(0, 100, 100);
    scene.add(spotlight3);
    scene.add(spotlight3.target);
    spotlightShape3 = new THREE.Group();
    createSpotlight3(spotlightShape3, 100, 270, 0);
    scene.add(spotlightShape3);
}   

/**
 * Creates three cameras in three different positions
 */
function createCamera() {
    'use strict';
    camera1 = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera1.position.set(0, 400, 400);
    camera1.lookAt(scene.position);

    prev_width = window.innerWidth;
	prev_height = window.innerHeight;

    camera2 = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 10000);
    camera2.position.set(0, 25 + 25/2, 500);
    camera2.lookAt(scene.position);
}

/* [=====================================================================] */
/* [===            Ciclo update-display e seus auxiliares             ===] */
/* [=====================================================================] */

/**
 * Implements the update/display cycle.
 */
function animate() {
    'use strict';

    update(); // update the scene
    render(); // display the new scene
    requestAnimationFrame(animate);
}

/**
 * Updates every object according to the inherent physics.
 * For example, processes colision detection and implements the 
 * according behaviors. Also allows to switch between cameras and
 * translate the rocket.
 */
function update() {
    
    // 1. set appropriate camera
    if (is_camera1) {
        camera = camera1;
    }
    if (is_camera2) {
        camera = camera2;
    }
    if(dActive){
        directionalLight.visible = !directionalLight.visible;
        dActive = false;
    }
    if(zActive){
        spotlight1.visible = !spotlight1.visible;
        zActive = false;
    }
    if(xActive){
        spotlight2.visible = !spotlight2.visible;
        xActive = false;
    }
    if(cActive){
        spotlight3.visible = !spotlight3.visible;
        cActive = false;
    }

    //3. change materials
    if (!is_paused) {
        if (is_gouraud) {
            plane.material   = plane_mat_lambert;
            podium1.material = podium1_mat_lambert;
            podium2.material = podium2_mat_lambert;
            step1.material   = step1_mat_lambert;
            step2.material   = step2_mat_lambert;
            step3.material   = step3_mat_lambert;
            cone1.material   = cone_mat_lambert;
            cone2.material   = cone_mat_lambert;
            cone3.material   = cone_mat_lambert;
            sphere1.material   = sphere_mat_lambert;
            sphere2.material   = sphere_mat_lambert;
            sphere3.material   = sphere_mat_lambert;
        }
        else {
            plane.material   = plane_mat_phong;
            podium1.material = podium1_mat_phong;
            podium2.material = podium2_mat_phong;
            step1.material   = step1_mat_phong;
            step2.material   = step2_mat_phong;
            step3.material   = step3_mat_phong;
            cone1.material   = cone_mat_phong;
            cone2.material   = cone_mat_phong;
            cone3.material   = cone_mat_phong;
            sphere1.material   = sphere_mat_phong;
            sphere2.material   = sphere_mat_phong;
            sphere3.material   = sphere_mat_phong;
        }
    }
    else {
        plane.material   = plane_mat_basic;
        podium1.material = podium1_mat_basic;
        podium2.material = podium2_mat_basic;
        step1.material   = step1_mat_basic;
        step2.material   = step2_mat_basic;
        step3.material   = step3_mat_basic;
        cone1.material   = cone_mat_basic;
        cone2.material   = cone_mat_basic;
        cone3.material   = cone_mat_basic;
        sphere1.material   = sphere_mat_basic;
        sphere2.material   = sphere_mat_basic;
        sphere3.material   = sphere_mat_basic;
    }

    if (is_paused) {
        pause.visible = true;
        if (is_camera1) {
            pause.rotation.x = - Math.PI / 4;
            pause.position.set(0, 20, 200);
        }
        if (is_camera2) {
            pause.position.set(0, 20, 400);
        }

        if (is_refresh) {
            pause.visible = false;
            is_paused = false;
            /* reset cameras */
            camera = camera1;
            is_camera1 = true;
            is_camera2 = false;
            is_refresh = false;
            /* reset lights */
            dActive = false;
            xActive = false;
            cActive = false;
            zActive = false;
            directionalLight.visible = true;
            spotlight1.visible = true;
            spotlight2.visible = true;
            spotlight3.visible = true;
            /* reset rotation */
            step1.rotation.y = 0;
            step2.rotation.y = 0;
            step3.rotation.y = 0;
            /* reset phong material to all */
            plane.material   = plane_mat_phong;
            podium1.material = podium1_mat_phong;
            podium2.material = podium2_mat_phong;
            step1.material   = step1_mat_phong;
            step2.material   = step2_mat_phong;
            step3.material   = step3_mat_phong;
            cone1.material   = cone_mat_phong;
            cone2.material   = cone_mat_phong;
            cone3.material   = cone_mat_phong;
            sphere1.material   = sphere_mat_phong;
            sphere2.material   = sphere_mat_phong;
            sphere3.material   = sphere_mat_phong;
            /* reset variables */
            is_gouraud = false;
        }
    }
    else {
        pause.visible = false;

        dt = clock.getDelta();
        if (is_rot1) {
            if (is_rot1_pos) {
                step1.rotateY(+angle * speed * dt);
            }
            else {
                step1.rotateY(-angle * speed * dt);
            }
        }
        if (is_rot2) {
            if (is_rot2_pos) {
                step2.rotateY(+angle * speed * dt);
            }
            else {
                step2.rotateY(-angle * speed * dt);
            }
        }
        if (is_rot3) {
            if (is_rot3_pos) {
                step3.rotateY(+angle * speed * dt);
            }
            else {
                step3.rotateY(-angle * speed * dt);
            }
        }
    }
}

/**
 * Generates the image displayed on the screen
 */
function render() {
    'use strict';
    renderer.autoClear = false;
    renderer.clear();
    renderer.render(scene, camera);
    if (is_paused){
        renderer.clearDepth();
    }

    renderer.setAnimationLoop(animate); 
} 

/**
  * Resize the camera when the window is resized
  */ 
 function onResize() {
    'use strict';

    renderer.setSize(window.innerWidth, window.innerHeight);
    var aspect = window.innerWidth / window.innerHeight;

    if (window.innerHeight > 0 && window.innerWidth > 0) {
        camera1.aspect = aspect;
        camera1.updateProjectionMatrix();
    }

    prev_width = window.innerWidth;
	prev_height = window.innerHeight;

    if (window.innerWidth / window.innerHeight > 2) {
        camera2.left  = -window.innerWidth   / (window.innerHeight / prev_height);
	    camera2.right  = window.innerWidth   / (window.innerHeight / prev_height);
	    camera2.top    = -window.innerHeight / (window.innerHeight / prev_height);
	    camera2.bottom = window.innerHeight  / (window.innerHeight / prev_height);
	    camera2.updateProjectionMatrix();
	} else {
		camera2.left  = -window.innerWidth   / (window.innerHeight / prev_width);
	    camera2.right  = window.innerWidth   / (window.innerHeight / prev_width);
	    camera2.top    = -window.innerHeight / (window.innerHeight / prev_width);
	    camera2.bottom = window.innerHeight  / (window.innerHeight / prev_width);
	    camera2.updateProjectionMatrix();
	}
}

/**
 * Handle onKeyDown events
 * 
 * @param {*} e - event that activate this function
 */
function onKeyDown(e) {
    'use strict';

    switch (e.keyCode) {
    case 49: //1
        is_camera1 = true;
        is_camera2 = false;
        break;
    case 50:  //2
        is_camera1 = false;
        is_camera2 = true;
        break;
    case 68: // d
        dActive = true;
        break;
    case 90: // z
        zActive = true;
        break;
    case 88: // x
        xActive = true;
        break;
    case 67: // c
        cActive = true;
        break;
    case 81: //Q
    case 113: //q
        is_rot1 = true;
        is_rot1_pos = false;
        break;
    case 87: //W
    case 119: //w
        is_rot1 = true;
        is_rot1_pos = true;
        break;
    case 69: //E
    case 101: //e
        is_rot2 = true;
        is_rot2_pos = false;
        break;
    case 82: //R
    case 114: //r
        is_rot2 = true;
        is_rot2_pos = true;
        is_refresh = true;
        break;
    case 84: //T
    case 116: //t
        is_rot3 = true;
        is_rot3_pos = false;
        break;
    case 89: //Y
    case 121: //y
        is_rot3 = true;
        is_rot3_pos = true;
        break;
    case 65: //A
    case 97: //a
        is_gouraud = !is_gouraud;
        //is_change = true;
        break;
    case 83: //S
    case 115: //s
        //is_change = true;
        is_paused = !is_paused;
    }
}

/**
 * Handle onKeyUp events
 * 
 * @param {*} e - event that activate this function
 */
function onKeyUp(e) {
    'use strict';
    switch (e.keyCode) {
    case 81: //Q
    case 113: //q
    case 87: //W
    case 119: //w
        is_rot1 = false;
        break;
    case 69: //E
    case 101: //e
    case 82: //R
    case 114: //r
        is_rot2 = false;
        break;
    case 84: //T
    case 116: //t
    case 89: //Y
    case 121: //y
        is_rot3 = false;
        break;
    }
}

/* [=====================================================================] */
/* [===              Chao plano e palanque com 2 degraus              ===] */
/* [=====================================================================] */

/**
 * Cria o chao plano
 */
function createPlane(){
    var planeGeo = new THREE.PlaneGeometry(800,400);

    plane_mat_lambert = new THREE.MeshLambertMaterial({ color: 'palegreen', side: THREE.DoubleSide });
    plane_mat_phong   = new THREE.MeshPhongMaterial(  { color: 'palegreen', side: THREE.DoubleSide });
    plane_mat_basic   = new THREE.MeshBasicMaterial(  { color: 'palegreen', side: THREE.DoubleSide });

    plane = new THREE.Mesh(planeGeo, plane_mat_phong);

    plane.rotation.x = Math.PI / 2;
    plane.position.set(0,0,0);

    scene.add( plane );
}

/**
 * Cria o palanque retilineo com 2 degraus
 */
function createPodium(){
    var podium1Geo = new THREE.BoxGeometry(500, 350, 25);

    podium1_mat_lambert = new THREE.MeshLambertMaterial({ color: 'lightseagreen' });
    podium1_mat_phong   = new THREE.MeshPhongMaterial(  { color: 'lightseagreen' });
    podium1_mat_basic   = new THREE.MeshBasicMaterial(  { color: 'lightseagreen' });

    podium1 = new THREE.Mesh(podium1Geo, podium1_mat_phong);
    podium1.rotation.x = Math.PI / 2;
    podium1.position.set(0,25/2,0);

    var podium2Geo = new THREE.BoxGeometry(400, 300, 25);
    
    podium2_mat_lambert = new THREE.MeshLambertMaterial({ color: 'mediumturquoise' });
    podium2_mat_phong   = new THREE.MeshPhongMaterial(  { color: 'mediumturquoise' });
    podium2_mat_basic   = new THREE.MeshBasicMaterial(  { color: 'mediumturquoise' });

    podium2 = new THREE.Mesh(podium2Geo, podium2_mat_phong);
    podium2.rotation.x = Math.PI / 2;
    podium2.position.set(0,25/2+25,0);

    scene.add( podium1 );
    scene.add( podium2 );
}

/* [=====================================================================] */
/* [===                        Fases do origami                       ===] */
/* [=====================================================================] */


/**
 * Cria a etapa 1 do origami.
 * Os parametros x, y, z definem as coordenadas de um dos seus pontos
 * As coordenadas dos restantes sao expressas em funcao dos iniciais 
 */
function createStep1(x, y, z){
    let vertices = new Float32Array([
        0,0,0,   14.35, -14.35, 0.1,    0, -29.7, 0, //ABC (front)
        0,0,0,   14.35, -14.35, 0.1,    0, -29.7, 0, //ABC (back)
        0,0,0,  -14.35, -14.35, 0.1,    0, -29.7, 0,  //ADC (front)
        0,0,0,  -14.35, -14.35, 0.1,    0, -29.7, 0  //ADC (back)
    ]);
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute( "position", new THREE.BufferAttribute(vertices, 3) );
    geometry.setAttribute( "uv", new THREE.BufferAttribute(vertices, 3) );
    geometry.computeVertexNormals();

    geometry.addGroup(0, 3, 0);
    geometry.addGroup(3, 3, 1);
    geometry.addGroup(6, 3, 2);
    geometry.addGroup(9, 3, 3);

    step1_mat_lambert = [
        new THREE.MeshLambertMaterial({ color: 'white'              , side: THREE.BackSide  }),
        new THREE.MeshLambertMaterial({ color: 'white', map: texture, side: THREE.FrontSide }),
        new THREE.MeshLambertMaterial({ color: 'white'              , side: THREE.FrontSide }),
        new THREE.MeshLambertMaterial({ color: 'white', map: texture, side: THREE.BackSide  }),
    ];

    step1_mat_phong = [
        new THREE.MeshPhongMaterial({ color: 'white'              , side: THREE.BackSide  }),
        new THREE.MeshPhongMaterial({ color: 'white', map: texture, side: THREE.FrontSide }),
        new THREE.MeshPhongMaterial({ color: 'white'              , side: THREE.FrontSide }),
        new THREE.MeshPhongMaterial({ color: 'white', map: texture, side: THREE.BackSide  }),
    ];

    step1_mat_basic = [
        new THREE.MeshBasicMaterial({ color: 'white'              , side: THREE.BackSide  }),
        new THREE.MeshBasicMaterial({ color: 'white', map: texture, side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ color: 'white'              , side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ color: 'white', map: texture, side: THREE.BackSide  }),
    ];

    step1 = new THREE.Mesh(geometry, step1_mat_phong);

    step1.scale.set(scale, scale, scale);
    step1.position.set(x, y, z);
    scene.add(step1);
}

/**
 * Cria a etapa 2 do origami.
 * Os parametros x, y, z definem as coordenadas de um dos seus pontos
 * As coordenadas dos restantes sao expressas em funcao dos iniciais 
 */
function createStep2(x, y, z){
    let vertices = new Float32Array([
        /* WHITE */
            /* FRONT */
        0, -7, 0,    Math.sqrt(98/4), -Math.sqrt(98/4), 0.1,     Math.sqrt(98/4) - 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7), //CBF
        0,  0, 0,   0, -7, 0,   -Math.sqrt(98/4), -Math.sqrt(98/4), 0.1, // ACD 
        0, -7, 0,   -Math.sqrt(98/4), -Math.sqrt(98/4), 0.1,    -Math.sqrt(98/4) + 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7), //CDE
        0, -7, 0,    0, -Math.sqrt(98/4) - 3.73312, 0,          -Math.sqrt(98/4) + 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7), //CHE
            /* BACK */
        0, -7, 0,   -Math.sqrt(98/4), -Math.sqrt(98/4), 0.1,    -Math.sqrt(98/4) + 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7), //CDE
        0,  0, 0,   0, -7, 0,    Math.sqrt(98/4), -Math.sqrt(98/4), 0.1, // ACB 
        0, -7, 0,    Math.sqrt(98/4), -Math.sqrt(98/4), 0.1,     Math.sqrt(98/4) - 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7), //CBF
        0, -7, 0,    0, -Math.sqrt(98/4) - 3.73312, 0,           Math.sqrt(98/4) - 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7), //CHF
        /* PATTERN */
            /* FRONT */
        0,  0, 0,   0, -7, 0,    Math.sqrt(98/4), -Math.sqrt(98/4), 0.1, // ACB 
        0, -7, 0,   0, -29.7, 0,     Math.sqrt(98/4) - 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7),  // CGF
        0, -Math.sqrt(98/4) - 3.73312, 0,    Math.sqrt(98/4) - 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7),     0, -29.7, 0,  //HFG
            /* BACK */
        0,  0, 0,   0, -7, 0,   -Math.sqrt(98/4), -Math.sqrt(98/4), 0.1, // ACD 
        0, -7, 0,   0, -29.7, 0,    -Math.sqrt(98/4) + 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7), //CGE
        0, -Math.sqrt(98/4) - 3.73312, 0,   -Math.sqrt(98/4) + 0.7098, -Math.sqrt(98/4) - 3.73312, 0.38 / (3.8 + 22.7),     0, -29.7, 0  //HEG
    ]);
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute( "position", new THREE.BufferAttribute(vertices, 3) );
    geometry.setAttribute( "uv", new THREE.BufferAttribute(vertices, 3) );
    geometry.computeVertexNormals();

    geometry.addGroup( 0, 12, 0);
    geometry.addGroup(12, 12, 1);
    geometry.addGroup(24,  9, 2);
    geometry.addGroup(33,  9, 3);

    step2_mat_lambert = [
        new THREE.MeshLambertMaterial({ color: 'white'              , side: THREE.FrontSide }),
        new THREE.MeshLambertMaterial({ color: 'white'              , side: THREE.BackSide  }),
        new THREE.MeshLambertMaterial({ color: 'white', map: texture, side: THREE.FrontSide }),
        new THREE.MeshLambertMaterial({ color: 'white', map: texture, side: THREE.BackSide  }),

    ];
    step2_mat_phong = [
        new THREE.MeshPhongMaterial({ color: 'white'              , side: THREE.FrontSide }),
        new THREE.MeshPhongMaterial({ color: 'white'              , side: THREE.BackSide  }),
        new THREE.MeshPhongMaterial({ color: 'white', map: texture, side: THREE.FrontSide }),
        new THREE.MeshPhongMaterial({ color: 'white', map: texture, side: THREE.BackSide  }),
    ];
    step2_mat_basic = [
        new THREE.MeshBasicMaterial({ color: 'white'              , side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ color: 'white'              , side: THREE.BackSide  }),
        new THREE.MeshBasicMaterial({ color: 'white', map: texture, side: THREE.FrontSide }),
        new THREE.MeshBasicMaterial({ color: 'white', map: texture, side: THREE.BackSide  }),

    ];

    step2 = new THREE.Mesh(geometry, step2_mat_phong);

    step2.scale.set(scale, scale, scale);
    step2.position.set(x, y, z);
    scene.add(step2);
}

/**
 * Cria a etapa 1 do origami.
 * Os parametros x, y, z definem as coordenadas de um dos seus pontos
 * As coordenadas dos restantes sao expressas em funcao dos iniciais 
 */
function createStep3(x, y, z){
    let vertices = new Float32Array([
        /* WHITE */
        0, 0, 0,    -2.931, -4.415, 0.1,    0.869, -4.415, 0.1, //BCD
        0, 0, 0,    -2.931, -4.415, -0.1,    0.869, -4.415, -0.1, //BC'D'
        /* PATTERN */
        -6.863, 1.376, 0,   0, 0, 0,    -2.931, -4.415, 0.1, //ABC   
        0, 0, 0,    7.844, -1.573, 0,   0.869, -4.415, 0.1, // BFD (parte de BDEF)
        0.869, -4.415, 0.1,     3.969, -4.415, 0.1,     7.844, -1.573, 0, // DEF (parte de BDEF)
        7.96243, 7.53542, 0.2,    10.5416, 7.11599, 0,    5.099, -1.023, 0.2, //HKG (parte de GEFHK)  
        10.5416, 7.11599, 0,    5.099, -1.023, 0.2,   7.844, -1.573, 0, //KGF (parte de GEFHK)  
        5.099, -1.023, 0.2,   3.969, -4.415, 0.1,     7.844, -1.573, 0, //GEF (parte de GEFHK)
        7.96243, 7.53542, 0.2,    10.4106, 8.10337, 0,    14.2399, 5.19377, 0, //HIJ
        7.96243, 7.53542, -0.2,    10.5416, 7.11599, 0,    5.099, -1.023, -0.2, //H'KG' (parte de G'E'FH'K) 
        10.5416, 7.11599, 0,    5.099, -1.023, -0.2,   7.844, -1.573, 0, //KG'F (parte de G'E'FH'K)  
        5.099, -1.023, -0.2,   3.969, -4.415, -0.1,     7.844, -1.573, 0, //G'E'F (parte de G'E'FH'K)
        7.96243, 7.53542, -0.2,    10.4106, 8.10337, 0,    14.2399, 5.19377, 0, //H'IJ
        0, 0, 0,    7.844, -1.573, 0,   0.869, -4.415, -0.1, // BFD' (parte de BD'E'F)
        0.869, -4.415, -0.1,     3.969, -4.415, -0.1,     7.844, -1.573, 0, // D'E'F (parte de BD'E'F)
        -6.863, 1.376, 0,   0, 0, 0,    -2.931, -4.415, -0.1 //ABC'

    ]);
    
    geometry = new THREE.BufferGeometry();
    geometry.setAttribute( "position", new THREE.BufferAttribute(vertices, 3) );
    geometry.setAttribute( "uv", new THREE.BufferAttribute(vertices, 3) );
    geometry.computeVertexNormals();
    
    geometry.addGroup(0,  6, 0); 
    geometry.addGroup(6, 42, 1);

    step3_mat_lambert = [
        new THREE.MeshLambertMaterial({ color: 'white'              , side: THREE.DoubleSide }),
        new THREE.MeshLambertMaterial({ color: 'white', map: texture, side: THREE.DoubleSide }),
    ];
    step3_mat_phong = [
        new THREE.MeshPhongMaterial({ color: 'white'              , side: THREE.DoubleSide }),
        new THREE.MeshPhongMaterial({ color: 'white', map: texture, side: THREE.DoubleSide }),
    ];
    step3_mat_basic = [
        new THREE.MeshBasicMaterial({ color: 'white'              , side: THREE.DoubleSide }),
        new THREE.MeshBasicMaterial({ color: 'white', map: texture, side: THREE.DoubleSide }),
    ];

    step3 = new THREE.Mesh(geometry, step3_mat_phong);

    step3.scale.set(scale, scale, scale);
    step3.position.set(x, y, z);
    scene.add(step3);
}

/* [=====================================================================] */
/* [===                            Spotlights                         ===] */
/* [=====================================================================] */


function createSpotlight1(spotlight, x,y,z){
    //ConeGeometry(radius : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
    var geomCone = new THREE.ConeGeometry(10, 20, 30);
    cone_mat_phong = new THREE.MeshPhongMaterial({
        color: 'darkorange',
        emissive: new THREE.Color(0xff331b),
        emissiveIntensity: 0.1
    })
    cone_mat_basic = new THREE.MeshBasicMaterial({color: 'darkorange', side: THREE.DoubleSide});
    cone_mat_lambert = new THREE.MeshLambertMaterial({color: 'darkorange', side: THREE.DoubleSide});

    cone1 = new THREE.Mesh(geomCone, cone_mat_phong);

    cone1.position.set(0,0,0);
    spotlight.add(cone1);


    //SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
    var geomSphere = new THREE.SphereGeometry(8, 10, 10);
    sphere_mat_phong = new THREE.MeshPhongMaterial({
        color: "white",
        emissive: new THREE.Color(0xffffff)
    })
    sphere_mat_basic = new THREE.MeshBasicMaterial({color: "white", side: THREE.DoubleSide});
    sphere_mat_lambert = new THREE.MeshLambertMaterial({color: "white", side: THREE.DoubleSide});

    sphere1 = new THREE.Mesh(geomSphere, sphere_mat_phong);

    sphere1.position.set(0,-10,0);
    spotlight.add(sphere1);

    spotlight.rotation.x = -Math.PI/6;
    spotlight.position.set(x,y,z);
}

function createSpotlight2(spotlight, x,y,z){
    //ConeGeometry(radius : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
    var geomCone = new THREE.ConeGeometry(10, 20, 30);
    cone_mat_phong = new THREE.MeshPhongMaterial({
        color: 'darkorange',
        emissive: new THREE.Color(0xff331b),
        emissiveIntensity: 0.1
    })
    cone_mat_basic = new THREE.MeshBasicMaterial({color: 'darkorange', side: THREE.DoubleSide});
    cone_mat_lambert = new THREE.MeshLambertMaterial({color: 'darkorange', side: THREE.DoubleSide});

    cone2 = new THREE.Mesh(geomCone, cone_mat_phong);

    cone2.position.set(0,0,0);
    spotlight.add(cone2);


    //SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
    var geomSphere = new THREE.SphereGeometry(8, 10, 10);
    sphere_mat_phong = new THREE.MeshPhongMaterial({
        color: "white",
        emissive: new THREE.Color(0xffffff)
    })
    sphere_mat_basic = new THREE.MeshBasicMaterial({color: "white", side: THREE.DoubleSide});
    sphere_mat_lambert = new THREE.MeshLambertMaterial({color: "white", side: THREE.DoubleSide});

    sphere2 = new THREE.Mesh(geomSphere, sphere_mat_phong);

    sphere2.position.set(0,-10,0);
    spotlight.add(sphere2);

    spotlight.rotation.x = -Math.PI/6;
    spotlight.position.set(x,y,z);
}

function createSpotlight3(spotlight, x,y,z){
    //ConeGeometry(radius : Float, height : Float, radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, thetaStart : Float, thetaLength : Float)
    var geomCone = new THREE.ConeGeometry(10, 20, 30);
    cone_mat_phong = new THREE.MeshPhongMaterial({
        color: 'darkorange',
        emissive: new THREE.Color(0xff331b),
        emissiveIntensity: 0.1
    })
    cone_mat_basic = new THREE.MeshBasicMaterial({color: 'darkorange', side: THREE.DoubleSide});
    cone_mat_lambert = new THREE.MeshLambertMaterial({color: 'darkorange', side: THREE.DoubleSide});

    cone3 = new THREE.Mesh(geomCone, cone_mat_phong);

    cone3.position.set(0,0,0);
    spotlight.add(cone3);


    //SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
    var geomSphere = new THREE.SphereGeometry(8, 10, 10);
    sphere_mat_phong = new THREE.MeshPhongMaterial({
        color: "white",
        emissive: new THREE.Color(0xffffff)
    })
    sphere_mat_basic = new THREE.MeshBasicMaterial({color: "white", side: THREE.DoubleSide});
    sphere_mat_lambert = new THREE.MeshLambertMaterial({color: "white", side: THREE.DoubleSide});

    sphere3 = new THREE.Mesh(geomSphere, sphere_mat_phong);

    sphere3.position.set(0,-10,0);
    spotlight.add(sphere3);

    spotlight.rotation.x = -Math.PI/6;
    spotlight.position.set(x,y,z);
}

/* [=====================================================================] */
/* [===                           Pause Screen                        ===] */
/* [=====================================================================] */

function createPauseScreen() {
	var geometry_pause = new THREE.PlaneGeometry(300*1.5, 200*1.5, 100);
	
	var texture_pause = new THREE.TextureLoader().load('textures/restart.jpeg');

    var material_pause = new THREE.MeshBasicMaterial({map: texture_pause});

    pause = new THREE.Mesh(geometry_pause, material_pause);
    pause.visible = false;
    scene.add(pause);
}
