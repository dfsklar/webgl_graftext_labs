var arg = new Object;
var pair = location.search.substring(1).split('&');
for(var i = 0; pair[i] ; i++) {
    var kv = pair[i].split('=');
    arg[kv[0]] = kv[1];
}

GLBoost.VALUE_TARGET_WEBGL_VERSION = arg.webglver ? parseInt(arg.webglver) : 1;

var canvas = document.getElementById("world");
var glBoostContext = new GLBoost.GLBoostMiddleContext(canvas);

var renderer = glBoostContext.createRenderer({
    // the clearColor attribute sets the background color
    clearColor: {red: 0.0, green: 0.0, blue: 0.0, alpha: 1}
});

var scene = glBoostContext.createScene();

var material = glBoostContext.createClassicMaterial();

// If you don't set a texture, you get a pure white opaque thing
var texture = glBoostContext.createTexture('resources/moon.gif');
material.setTexture(texture);

var shader = new GLBoost.PhongShader(glBoostContext);
shader.power = 1;

function updateShininess(event, ui){
  shader.power = ui.value;
  $('#slider-s-value').html(ui.value);
  material.shaderInstance = shader;
}


material.shaderInstance = shader;
var geometry = glBoostContext.createSphere(
    /*radius*/20,
    /* width segments */24,
    /* height segments */24,
    /* vertex color (not required, ignored if texture loaded?  */ null);

var sphere = glBoostContext.createMesh(geometry, material);
scene.addChild(sphere);

var directionalLight = glBoostContext.createDirectionalLight(
    // color of the light:
    new GLBoost.Vector3(0, 0, 1),
    // direction of the light (x=-1 means light is at our right, pointing towards the left)
    new GLBoost.Vector3(-1, -1, -1));
scene.addChild( directionalLight );

var directionalLight_3 = glBoostContext.createDirectionalLight(
    // color of the light:
    new GLBoost.Vector3(1, 1,1),
    // direction of the light (x=-1 means light is at our right, pointing towards the left)
    new GLBoost.Vector3(1, -1, -1));
scene.addChild( directionalLight_3 );


var camera = glBoostContext.createPerspectiveCamera({
    eye: new GLBoost.Vector3(0.0, 0.0, 60.0),
    center: new GLBoost.Vector3(0.0, 0.0, 0.0),
    up: new GLBoost.Vector3(0.0, 1.0, 0.0)
}, {
    fovy: 45.0,
    aspect: 1.0,
    zNear: 0.1,
    zFar: 1000.0
});

scene.addChild(camera);

var expression = glBoostContext.createExpressionAndRenderPasses(1);
expression.renderPasses[0].scene = scene;
expression.prepareToRender();


var glBoostMonitor = GLBoost.GLBoostMonitor.getInstance();
glBoostMonitor.printGLBoostObjects();
glBoostMonitor.printWebGLResources();
glBoostMonitor.printHierarchy();

var framenumber = 0;  
var render = function() {

    renderer.clearCanvas();
    renderer.draw(expression);

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
