// ----------------------- WebGL Detection ------------------------
// Use WebGL Render instead of Canvas Render because of performance
if(!Detector.webgl)
    Detector.addGetWebGLMessage();

// ---------------------- GLOBAL CONSTANTS ------------------------
var PI2 = Math.PI * 2,
windowHalfX = window.innerWidth / 2,
windowHalfY = window.innerHeight / 2,

current_aspect_ratio = window.innerWidth / window.innerHeight,
canvas_width = 940,
canvas_height = 940 / current_aspect_ratio,

SEPARATION = 200,
AMOUNTX = 10,
AMOUNTY = 10,

INTERSECTED;


// -------------------------- VORONOI -----------------------------
var sites = [ [191,175], [677,92], [469,117], [649,105], [388,92], [294,296], [729,160], [715,133], [506,343], [266,63], [403,341], [684,25], [87,384], [11,433], [82,290], [204,407], [718,456], [577,545], [743,227], [720,468], [260,117], [797,97], [567,301], [750,430], [85,126], [448,424], [63,307], [157,165], [511,269], [32,281], [63,23], [129,239], [552,321], [550,164], [373,166], [361,562], [70,273], [757,514], [97,9], [188,520], [350,462], [700,227], [756,480], [671,568], [469,360], [256,253], [724,96], [669,440], [394,128], [96,30], [341,196], [84,258], [499,372], [624,293], [792,556], [514,449], [766,310], [178,180], [649,4], [225,552], [294,245], [700,572], [793,91], [439,143], [618,276], [585,119], [379,555], [688,568], [320,208], [161,194], [269,343], [350,525], [516,311], [716,504], [511,286], [339,6], [487,557], [279,152], [330,148], [783,283], [546,482], [681,166], [482,425], [109,456], [303,95], [517,382], [449,122], [761,545], [339,387], [756,453], [609,25], [769,197], [589,366], [450,332], [563,151], [391,156], [575,270], [518,73], [36,543], [680,150] ];

function recompute(sites){
    return Voronoi.main(sites);
}

var voronoi_context = recompute(sites);

// ---------------------- THREE.JS CONTEXT ------------------------
var mouseX = 0, mouseY = 0;
var mouse = { x: 0, y: 0 };

var container;
var camera, scene, renderer, particleMaterial, cameraTarget;
var projector, plane, cube;
var mouse2D, mouse3D, ray, rollOveredFace, isShiftDown = false,
theta = 45, isCtrlDown = false;

var rollOverMesh, rollOverMaterial, 
voxelPosition = new THREE.Vector3(), tmpVec = new THREE.Vector3();
var radius = 600, theta = 0;

var cubeGeo, cubeMaterial;
var i, intersector;
var gui, voxelConfig = {
    orthographicProjection: false
};

// -------------------------- PARTICLES ---------------------------
var programFill = function(context) {
    context.beginPath();
    context.arc(0, 0, 1, 0, PI2, true);
    context.closePath();
    context.fill();
};

var programStroke = function(context) {
    context.lineWidth = 0.05;
    context.beginPath();
    context.arc(0, 0, 1, 0, PI2, true);
    context.closePath();
    context.stroke();
};



// ---------------------- CANVAS INIT ------------------------------
function init() {

    // Get HTML5 Canvas container
    container = document.getElementById('voronoi_container');

    // Build Canvas Camera
    camera = new THREE.CombinedCamera( 
        window.innerWidth,           // width
        window.innerHeight,          // height
        45,                     // fov
        1,                      // near
        10000,                  // far
        -2000,                  // orthonear
        10000                   // orthofar
    );
	camera.position.y = 800;

    // Build Canvas Scene
    scene = new THREE.Scene();
	scene.add( camera );

    // Build camera target
    cameraTarget = new THREE.Vector3(0, 0, 0); // x,y,z

    // Rollover helpers
    rollOverGeo = new THREE.CubeGeometry(50, 50, 50);
    rollOverMaterial = new THREE.MeshBasicMaterial( { 
        color: 0xff0000, 
        opacity: 0.5, 
        transparent: true 
    } );
	rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
	scene.add( rollOverMesh );

	// Cubes
	cubeGeo = new THREE.CubeGeometry( 50, 50, 50 );
	cubeMaterial = new THREE.MeshLambertMaterial( { 
        color: 0x00ff80, 
        ambient: 0x00ff80, 
        shading: THREE.FlatShading, 
        map: THREE.ImageUtils.loadTexture( "../textures/square-outline-textured.png" ) } );
	cubeMaterial.color.setHSV( 0.1, 0.7, 1.0 );
	cubeMaterial.ambient = cubeMaterial.color;

    // // Prepare material for particles and add particles into current scene
    // particleMaterial = new THREE.ParticleCanvasMaterial( { 
    //     color: Math.random() * 0x808080 + 0x808080, 
    //     program: programStroke 
    // } );
    // for ( var i = 0; i < 100; i ++ ) {
	// 	var particle = new THREE.Particle(particleMaterial);
	// 	particle.position.x = Math.random() * 800 - 400;
	// 	particle.position.y = Math.random() * 800 - 400;
	// 	particle.position.z = Math.random() * 800 - 400;
	// 	particle.scale.x = particle.scale.y = Math.random() * 10 + 10;

	// 	scene.add( particle );
	// }

    // Build new projector for picking
    projector = new THREE.Projector();


    // Build grid plane
    plane = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000, 20, 20 ), 
                            new THREE.MeshBasicMaterial( { 
                                color: 0x808080, 
                                wireframe: false } ) );
	plane.rotation.x = - 90 * Math.PI / 180;
	scene.add( plane );

	mouse2D = new THREE.Vector3( 0, 10000, 0.5 );

    // Build light
    var ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    scene.add(directionalLight);

    // Build renderer
	renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	// TODO: Build lines

    // Build event listener to listen to the specific events
	document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener('mousedown', onDocumentMouseDown, false);
	document.addEventListener('keydown', onDocumentKeyDown, false);
	document.addEventListener('keyup', onDocumentKeyUp, false);

    // Build GUI
    gui = new DAT.GUI();
    gui.add(voxelConfig, 'orthographicProjection').onChange(function(){
        if ( voxelConfig.orthographicProjection ) {
			camera.toOrthographic();
			camera.position.x = 1000;
            camera.position.y = 707.106;
            camera.position.z = 1000;
			theta = 90;
		} else {
			camera.toPerspective();
			camera.position.y = 800;
		}
    });
    gui.close();

    // DEPRECATED:
    // document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	// document.addEventListener( 'touchmove', onDocumentTouchMove, false );
    // document.addEventListener('mousedown', onDocumentMouseDown, false);
}
// ---------------------- GETTERS & SETTERS -----------------------
function getRealIntersector( intersects ) {
	for( i = 0; i < intersects.length; i++ ) {
		intersector = intersects[ i ];
		if ( intersector.object != rollOverMesh )
			return intersector;
	}
	return null;
}

function setVoxelPosition( intersector ) {
	tmpVec.copy( intersector.face.normal );
	voxelPosition.add( intersector.point, intersector.object.matrixRotationWorld.multiplyVector3( tmpVec ) );

	voxelPosition.x = Math.floor( voxelPosition.x / 50 ) * 50 + 25;
	voxelPosition.y = Math.floor( voxelPosition.y / 50 ) * 50 + 25;
	voxelPosition.z = Math.floor( voxelPosition.z / 50 ) * 50 + 25;

}
// ------------------------- EVENTS -------------------------------
function onDocumentMouseMove(event) {
    // Reset to default status
    event.preventDefault();

    mouse2D.x = (event.clientX / window.innerWidth) * 2 -1;
    mouse2D.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // DEPRECATED:
	// mouseX = event.clientX - windowHalfX;
	// mouseY = event.clientY - windowHalfY;
}
function onDocumentMouseDown( event ) {
	event.preventDefault();
	var intersects = ray.intersectObjects( scene.children );
	if ( intersects.length > 0 ) {
		intersector = getRealIntersector( intersects );
		// delete cube
		if ( isCtrlDown ) {
			if ( intersector.object != plane ) {
				scene.remove( intersector.object );
			}
			// create cube
		} else {
			intersector = getRealIntersector( intersects );
			setVoxelPosition( intersector );
			var voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
			voxel.position.copy( voxelPosition );
			voxel.matrixAutoUpdate = false;
			voxel.updateMatrix();
			scene.add( voxel );
		}
	}
}
function onDocumentKeyDown( event ) {

	switch( event.keyCode ) {

	case 16: isShiftDown = true; break;
	case 17: isCtrlDown = true; break;

	}

}

function onDocumentKeyUp( event ) {

	switch( event.keyCode ) {

	case 16: isShiftDown = false; break;
	case 17: isCtrlDown = false; break;

	}
}
// ---------------- ANIMATATION & RENDER DEFINITION ---------------
function animate() {

	requestAnimationFrame( animate );

	render();

}

function render() {

    // Rotate camera
    if(isShiftDown)
        theta += mouse2D.x * 3;

    ray = projector.pickingRay( mouse2D.clone(), camera );

	var intersects = ray.intersectObjects( scene.children );

	if ( intersects.length > 0 ) {

		intersector = getRealIntersector( intersects );
		if ( intersector ) {

			setVoxelPosition( intersector );
			rollOverMesh.position = voxelPosition;

		}

	}

	camera.position.x = 1400 * Math.sin( theta * Math.PI / 360 );
	camera.position.z = 1400 * Math.cos( theta * Math.PI / 360 );

	camera.lookAt( cameraTarget );

	renderer.render( scene, camera );

	// camera.position.x = radius * Math.sin(theta * Math.PI / 360);
	// camera.position.y = radius * Math.sin(theta * Math.PI / 360);
	// camera.position.z = radius * Math.cos(theta * Math.PI / 360);
	// camera.lookAt(scene.position);

    // // Find intersections
    // camera.updateMatrixWorld();

    // var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
	// projector.unprojectVector( vector, camera );

	// var ray = new THREE.Ray(camera.position, 
    //                         vector.subSelf(camera.position).normalize());

	// var intersects = ray.intersectObjects( scene.children );

	// if ( intersects.length > 0 ) {
	// 	if ( INTERSECTED != intersects[ 0 ].object ) {
	// 		if ( INTERSECTED ) 
    //             INTERSECTED.material.program = programStroke;
	// 		INTERSECTED = intersects[ 0 ].object;
	// 		INTERSECTED.material.program = programFill;
	// 	}
	// } else {
    //     if ( INTERSECTED ) 
    //         INTERSECTED.material.program = programStroke;
	// 	INTERSECTED = null;
    // }
    // renderer.render( scene, camera );
    // DEPRECATED:
	// camera.position.x += ( mouseX - camera.position.x ) * .05;
	// camera.position.y += ( - mouseY + 200 - camera.position.y ) * .05;
	// camera.lookAt( scene.position );

	// renderer.render( scene, camera );
}

// function onDocumentTouchStart( event ) {

// 	if ( event.touches.length > 1 ) {

// 		event.preventDefault();

// 		mouseX = event.touches[ 0 ].pageX - windowHalfX;
// 		mouseY = event.touches[ 0 ].pageY - windowHalfY;

// 	}

// }

// function onDocumentTouchMove( event ) {

// 	if ( event.touches.length == 1 ) {

// 		event.preventDefault();

// 		mouseX = event.touches[ 0 ].pageX - windowHalfX;
// 		mouseY = event.touches[ 0 ].pageY - windowHalfY;

// 	}

// }

// function onDocumentMouseDown(event) {

//     var particle = new THREE.Particle(particleMaterial);
//     particle.position.x = event.clientX;
//     particle.position.y = event.clientY;
//     particle.position.z = Math.random() * 2 - 1;
//     particle.position.normalize();
//     scene.add(particle);
// }

//





// ---------------------------- RUN -------------------------------
init();
animate();