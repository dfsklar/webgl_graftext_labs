var arg = new Object;
var pair = location.search.substring(1).split('&');
for(var i = 0; pair[i] ; i++) {
    var kv = pair[i].split('=');
    arg[kv[0]] = kv[1];
}





var canvas = document.getElementById("world");
var glBoostContext = new GLBoost.GLBoostMiddleContext(canvas);
var expression = null;
var geometry = null;

GLBoost.VALUE_TARGET_WEBGL_VERSION = arg.webglver ? parseInt(arg.webglver) : 1;




function loadVertexData(filename) {
    var data = new Float32Array(0);
    var request = new XMLHttpRequest();
    request.open('GET', filename, false);
    request.send(); //"false" above, will block

    if (request.status != 200) {
        alert("can not load file " + filename);

    }else{
        var floatVals = request.responseText.split('\n');
        var numFloats = parseInt(floatVals[0]);
        if(numFloats % (3+2+3) != 0) return data;
        data = new Float32Array(numFloats);
        for(var k = 0; k < numFloats; k++) {
            data[k] = floatVals[k+1];
        }
    }
    return data;
}


function loadTeapotGeometry() {
    var vdata = loadVertexData('resources/teapot.txt');
    var teapotGeometry = glBoostContext.createGeometry();
    var positions = [];
    var texcoords = [];
    var colors = [];
    var normals = [];

    var scaleFactor = 33;
    
    var vertexColor = new GLBoost.Vector4(1, 1, 1, 1);

    var i = 0;
    while (i < vdata.length) {
        // I'm transposing Y and Z to reorient the teapot.
        var position = new GLBoost.Vector3(vdata[i]*scaleFactor, vdata[i+2]*scaleFactor, vdata[i+1]*scaleFactor);
        positions.push(position);
        texcoords.push(new GLBoost.Vector2(vdata[i+3], vdata[i+4]));
        colors.push(vertexColor);
        // Reminder: I'm transposing Y and Z to reorient the teapot.
        normals.push(new GLBoost.Vector3(vdata[i+5], vdata[i+7], vdata[i+6]));
        i += 3+2+3;
    }

    teapotGeometry.setVerticesData({
        position: positions,
        color: colors,
        texcoord: texcoords,
        normal: normals
    }, null);

    return teapotGeometry;
}

var teapotGeom = loadTeapotGeometry();





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

var renderer = glBoostContext.createRenderer({
    // the clearColor attribute sets the background color
    clearColor: {red: 0.0, green: 0.0, blue: 0.0, alpha: 1}
});

var currentMajorModel = null;
var material = null;

var scene = glBoostContext.createScene();


var shader = new GLBoost.PhongShader(glBoostContext);
shader.power = 43;

respondToChangeInModelSelection();


$("#model-selector").selectmenu({change: respondToChangeInModelSelection});

function respondToChangeInModelSelection(event, ui) {
    material = null;
    updateMaterial();
    regenerateScene();
}

function updateMaterial() {

    if (!material)
	material = glBoostContext.createClassicMaterial();
    
    // AMBIENT
    var colorInTextRepr = ($('#colorSelectorAmbient div').css('backgroundColor'));
    var colorAsArray = parseCSSColor(colorInTextRepr);
    var efficiency = parseFloat($("#slider-ka-value").html());
    shader.efficiencyAmbient = efficiency;
    var efficiency = parseFloat($("#slider-kd-value").html());
    shader.efficiencyDiffuse = efficiency;
    var efficiency = parseFloat($("#slider-ks-value").html());
    shader.efficiencySpecular = efficiency;
    material.ambientColor = new GLBoost.Vector4(colorAsArray[0],
						colorAsArray[1],
						colorAsArray[2], 1.0);

    var colorInTextRepr = ($('#colorSelectorSpecular div').css('backgroundColor'));
    var colorAsArray = parseCSSColor(colorInTextRepr);
    material.specularColor = new GLBoost.Vector4(colorAsArray[0], colorAsArray[1], colorAsArray[2], 1.0);

    var selectedModel = $("#model-selector")[0].value;
    $('.conditional').css('display', 'none');
    switch (selectedModel) {
    case 'moon':
        var texture = glBoostContext.createTexture('resources/moon.gif');
        material.setTexture(texture);
	$('.conditional.explanation').css('display', 'block');
        break;
    default:
	$('.conditional.colorSelector').css('display', 'block');
        var colorInTextRepr = ($('#colorSelectorDiffuse div').css('backgroundColor'));
        var colorAsArray = parseCSSColor(colorInTextRepr);
        material.diffuseColor = new GLBoost.Vector4(colorAsArray[0], colorAsArray[1], colorAsArray[2], 1.0);
    }

    material.shaderInstance = shader;
}




function regenerateScene() {

    geometry = glBoostContext.createSphere(
		/*radius*/20,
		/* width segments */24,
		/* height segments */24,
		/* vertex color (not required, ignored if texture loaded?  */ null);

    geometry = teapotGeom;
    

    if (currentMajorModel) {
        scene.removeAll();  //Child(currentMajorModel);
        currentMajorModel = null;
    }

    var sphere = glBoostContext.createMesh(geometry, material);
    scene.addChild(sphere);
    currentMajorModel = sphere;

    var directionalLight = glBoostContext.createDirectionalLight(
        // color of the light:
        new GLBoost.Vector3(0, 0, 1),
        // direction of the light (x=-1 means light is at our right, pointing towards the left)
        new GLBoost.Vector3(-1, -1, -1));
    // scene.addChild( directionalLight );

    var directionalLight_3 = glBoostContext.createDirectionalLight(
        // color of the light:
        new GLBoost.Vector3(1, 1,1),
        // direction of the light (x=-1 means light is at our right, pointing towards the left)
        new GLBoost.Vector3(1, -1, -1));
    scene.addChild( directionalLight_3 );

    scene.addChild(camera);

    expression = glBoostContext.createExpressionAndRenderPasses(1);
    expression.renderPasses[0].scene = scene;
    expression.prepareToRender();
}



$('#colorSelectorAmbient').ColorPicker({
  onSubmit: function(hsb, hex, rgb, el) {
    $(el).val(hex);
    $(el).ColorPickerHide();
  },
  color: '#340000',
  onShow: function (colpkr) {
    $(colpkr).fadeIn(100);
    return false;
  },
  onHide: function (colpkr) {
    $(colpkr).fadeOut(100);
    return false;
  },
  onChange: function (hsb, hex, rgb) {
    var colorInTextRepr = '#' + hex;
    $('#colorSelectorAmbient div').css('backgroundColor', colorInTextRepr);
    var colorInTextRepr = ($('#colorSelectorAmbient div').css('backgroundColor'));
    var colorAsArray = parseCSSColor(colorInTextRepr);
    material.ambientColor = new GLBoost.Vector4(colorAsArray[0],
						colorAsArray[1],
						colorAsArray[2], 1.0);
    material.shaderInstance = shader;
  },
  onBeforeShow: function (colpkr) {
    $(colpkr).ColorPickerSetColor('rgb(0.2,0.0,0.0)');
  }
});


$('#slider-ka').slider({value:1, max:1, step:0.01, range:"min", slide:updateLightAmbientTerm});
function updateLightAmbientTerm(event, ui){
    $('#slider-ka-value').html(ui.value);
    var efficiency = parseFloat(ui.value);
    shader.efficiencyAmbient = efficiency;
    material.shaderInstance = shader;
}
$('#slider-kd').slider({value:1, max:1, step:0.01, range:"min", slide:updateLightDiffuseTerm});
function updateLightDiffuseTerm(event, ui){
    $('#slider-kd-value').html(ui.value);
    var efficiency = parseFloat(ui.value);
    shader.efficiencyDiffuse = efficiency;
    material.shaderInstance = shader;
}
$('#slider-ks').slider({value:1, max:1, step:0.01, range:"min", slide:updateLightSpecularTerm});
function updateLightSpecularTerm(event, ui){
    $('#slider-ks-value').html(ui.value);
    var efficiency = parseFloat(ui.value);
    shader.efficiencySpecular = efficiency;
    material.shaderInstance = shader;
}





$('#colorSelectorDiffuse').ColorPicker({
  onSubmit: function(hsb, hex, rgb, el) {
    $(el).val(hex);
    $(el).ColorPickerHide();
  },
  color: '#340000',
  onShow: function (colpkr) {
    $(colpkr).fadeIn(100);
    return false;
  },
  onHide: function (colpkr) {
    $(colpkr).fadeOut(100);
    return false;
  },
  onChange: function (hsb, hex, rgb) {
    var colorInTextRepr = '#' + hex;
    $('#colorSelectorDiffuse div').css('backgroundColor', colorInTextRepr);
    var colorInTextRepr = ($('#colorSelectorDiffuse div').css('backgroundColor'));
    var colorAsArray = parseCSSColor(colorInTextRepr);
    material.diffuseColor = new GLBoost.Vector4(colorAsArray[0],
						colorAsArray[1],
						colorAsArray[2], 1.0);
    material.shaderInstance = shader;
  },
  onBeforeShow: function (colpkr) {
    $(colpkr).ColorPickerSetColor('rgb(0.2,0.0,0.0)');
  }
});



$('#colorSelectorSpecular').ColorPicker({
  onSubmit: function(hsb, hex, rgb, el) {
    $(el).val(hex);
    $(el).ColorPickerHide();
  },
  color: '#340000',
  onShow: function (colpkr) {
    $(colpkr).fadeIn(100);
    return false;
  },
  onHide: function (colpkr) {
    $(colpkr).fadeOut(100);
    return false;
  },
  onChange: function (hsb, hex, rgb) {
    var colorInTextRepr = '#' + hex;
    $('#colorSelectorSpecular div').css('backgroundColor', colorInTextRepr);
    var colorInTextRepr = ($('#colorSelectorSpecular div').css('backgroundColor'));
    var colorAsArray = parseCSSColor(colorInTextRepr);
    material.specularColor = new GLBoost.Vector4(colorAsArray[0],
						 colorAsArray[1],
						 colorAsArray[2], 1.0);
    material.shaderInstance = shader;
  },
  onBeforeShow: function (colpkr) {
    $(colpkr).ColorPickerSetColor('rgb(0.2,0.0,0.0)');
  }
});


function updateShininess(event, ui){
    shader.power = ui.value;
    $('#slider-s-value').html(ui.value);
    material.shaderInstance = shader;
}





var glBoostMonitor = GLBoost.GLBoostMonitor.getInstance();
glBoostMonitor.printGLBoostObjects();
glBoostMonitor.printWebGLResources();
glBoostMonitor.printHierarchy();

var framenumber = 0;  
var render = function() {

    renderer.clearCanvas();
    renderer.draw(expression);

    framenumber += 1;
    currentMajorModel.rotate = (new GLBoost.Vector3(0, framenumber*0.5, 0));
    
    // Each frame we rotate the camera:
    //var rotateMatrixY = GLBoost.Matrix33.rotateY(-0.3);
    // var rotatedVector = rotateMatrixY.multiplyVector(camera.eye);
    // This is only rotating the camera:
    //  camera.eye = rotatedVector;

    requestAnimationFrame(render);
};

render();
