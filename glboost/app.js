var arg = new Object;
var pair = location.search.substring(1).split('&');
for(var i = 0; pair[i] ; i++) {
    var kv = pair[i].split('=');
    arg[kv[0]] = kv[1];
}

GLBoost.VALUE_TARGET_WEBGL_VERSION = arg.webglver ? parseInt(arg.webglver) : 1;

// Canvas 2
var canvas_2 = document.getElementById("world_2");
var glBoostContext_2 = new GLBoost.GLBoostMiddleContext(canvas_2);

var renderer_2 = glBoostContext_2.createRenderer({
    clearColor: {red: 0.0, green: 0.0, blue: 0.0, alpha: 1}
});

var scene_2 = glBoostContext_2.createScene();

var material_2 = glBoostContext_2.createClassicMaterial();
var texture_2 = glBoostContext_2.createTexture('resources/texture.png');
material_2.setTexture(texture_2);

var shader_2 = new GLBoost.PhongShader(glBoostContext_2);
material_2.shaderInstance = shader_2;
var geometry_2 = glBoostContext_2.createSphere(20, 24, 24, null);

var sphere = glBoostContext_2.createMesh(geometry_2, material_2);
scene_2.addChild(sphere);

var directionalLight_2 = glBoostContext_2.createDirectionalLight(new GLBoost.Vector3(1, 1, 1), new GLBoost.Vector3(-1, -1, -1));
scene_2.addChild( directionalLight_2 );


var camera = glBoostContext_2.createPerspectiveCamera({
    eye: new GLBoost.Vector3(0.0, 0.0, 60.0),
    center: new GLBoost.Vector3(0.0, 0.0, 0.0),
    up: new GLBoost.Vector3(0.0, 1.0, 0.0)
}, {
    fovy: 45.0,
    aspect: 1.0,
    zNear: 0.1,
    zFar: 1000.0
});

scene_2.addChild(camera);

var expression_2 = glBoostContext_2.createExpressionAndRenderPasses(1);
expression_2.renderPasses[0].scene = scene_2;
expression_2.prepareToRender();


var glBoostMonitor = GLBoost.GLBoostMonitor.getInstance();
glBoostMonitor.printGLBoostObjects();
glBoostMonitor.printWebGLResources();
glBoostMonitor.printHierarchy();

var framenumber = 0;  
var render = function() {

    renderer_2.clearCanvas();
    renderer_2.draw(expression_2);

    framenumber += 1;
    sphere.rotate = (new GLBoost.Vector3(0, framenumber, 0));
    
    // Each frame we rotate the camera:
    //var rotateMatrixY = GLBoost.Matrix33.rotateY(-0.3);
    // var rotatedVector = rotateMatrixY.multiplyVector(camera.eye);
    // This is only rotating the camera:
    //  camera.eye = rotatedVector;

    requestAnimationFrame(render);
};

render();
