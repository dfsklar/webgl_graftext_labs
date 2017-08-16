/**
 * @author David F. Sklar of Tumblr
 *
 * Based on the THREJS-based trackball by:
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin 	/ http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga 	/ http://lantiga.github.io
 */


/**
 * Sets the length of a vec3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to clamp
 * @param {number} s length
 * @returns {vec3} out
 */
window.vec3extension = {
    setLength: function(out, a, s)
    {
        return vec3.scale(out, vec3.normalize(out, a), s);
    }
};




window.TrackballControls = function ( camera, domElement ) {

  /* 
     camera must have:  position, up 
   */

	var _this = this;
	var STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

	this.camera = camera;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.screen = { left: 0, top: 0, width: 0, height: 0 };

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals

	this.target = vec3.create();

	var EPS = 0.000001;

	var lastPosition = vec3.create();

	var _state = STATE.NONE,
	    _prevState = STATE.NONE,

	    _eye = vec3.create(),

	    _movePrev = vec2.create(),
	    _moveCurr = vec2.create(),

	    _lastAxis = vec3.create(),
	    _lastAngle = 0,

	    _zoomStart = vec2.create(),
	    _zoomEnd = vec2.create(),

	    _touchZoomDistanceStart = 0,
	    _touchZoomDistanceEnd = 0,

	    _panStart = vec2.create(),
	    _panEnd = vec2.create();

	// for reset
	this.target0 = vec3.clone(this.target);
	this.position0 = vec3.clone(this.camera.position);
	this.up0 = vec3.clone(this.camera.up);

	// events
	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };



	// methods

	this.handleResize = function () {
		if ( this.domElement === document ) {
			this.screen.left = 0;
			this.screen.top = 0;
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;
		} else {
			var box = this.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = this.domElement.ownerDocument.documentElement;
			this.screen.left = box.left + window.pageXOffset - d.clientLeft;
			this.screen.top = box.top + window.pageYOffset - d.clientTop;
			this.screen.width = box.width;
			this.screen.height = box.height;
		}
	};


    this.dispatchEvent = function(event) {
        this.handleEvent(event);
    };



	this.handleEvent = function ( event ) {
		if ( typeof this[ event.type ] == 'function' ) {
			this[ event.type ]( event );
		}
	};




	var getMouseOnScreen = ( function () {
		var vector = vec2.create();
		return function getMouseOnScreen( pageX, pageY ) {
			vec2.set(vector,
				     ( pageX - _this.screen.left ) / _this.screen.width,
				     ( pageY - _this.screen.top ) / _this.screen.height
			        );
			return vector;
		};
	}() );





	var getMouseOnCircle = ( function () {
		var vector = vec2.create();
		return function getMouseOnCircle( pageX, pageY ) {
			vec2.set(vector,
				     ( ( pageX - _this.screen.width * 0.5 - _this.screen.left ) / ( _this.screen.width * 0.5 ) ),
				     ( ( _this.screen.height + 2 * ( _this.screen.top - pageY ) ) / _this.screen.width ) // screen.width intentional
			        );
			return vector;
		};
	}() );




	this.rotateCamera = ( function() {

		var axis = vec3.create(),
			quaternion = quat.create(),
			eyeDirection = vec3.create(),
			cameraUpDirection = vec3.create(),
			cameraSidewaysDirection = vec3.create(),
			moveDirection = vec3.create(),
			angle;


		return function rotateCamera() {

			vec3.set(moveDirection,    _moveCurr[0] - _movePrev[0], _moveCurr[1] - _movePrev[1], 0 );
			angle = vec3.length(moveDirection);

			if ( angle ) {

				vec3.subtract(_eye,  _this.camera.position, _this.target);

				vec3.normalize(eyeDirection,   _eye);
				vec3.normalize(cameraUpDirection,    _this.camera.up);
                var cross = vec3.create();
                vec3.cross(cross,   cameraUpDirection, eyeDirection);
                vec3.normalize(cameraSidewaysDirection,   cross);

				window.vec3extension.setLength(cameraUpDirection,  cameraUpDirection, ( _moveCurr[1] - _movePrev[1] ));
				window.vec3extension.setLength(cameraSidewaysDirection,   cameraSidewaysDirection, ( _moveCurr[0] - _movePrev[0] ));

				vec3.add(moveDirection,    cameraUpDirection, cameraSidewaysDirection);

				vec3.normalize(axis,  vec3.cross(axis,    moveDirection, _eye ));

				angle *= _this.rotateSpeed;
				quat.setAxisAngle(quaternion,    axis, angle);

				vec3.transformQuat(_eye,   _eye, quaternion);
				vec3.transformQuat(_this.camera.up,   _this.camera.up, quaternion);

				vec3.copy(_lastAxis,  axis);
				_lastAngle = angle;

			} else if ( ! _this.staticMoving && _lastAngle ) {

				_lastAngle *= Math.sqrt( 1.0 - _this.dynamicDampingFactor );
				vec3.subtract(_eye,  _this.camera.position, _this.target );
				quat.setAxisAngle(quaternion,   _lastAxis, _lastAngle );
				vec3.transformQuat(_eye,    _eye, quaternion );
				vec3.transformQuat(_this.camera.up,   _this.camera.up, quaternion);

			}

			vec2.copy(_movePrev,  _moveCurr);

		};

	}() );





	this.zoomCamera = function () {
		var factor;
		if ( _state === STATE.TOUCH_ZOOM_PAN ) {
			factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			vec3.scale(_eye,   _eye, factor );
		} else {
			factor = 1.0 + ( _zoomEnd[1] - _zoomStart[1] ) * _this.zoomSpeed;
			if ( factor !== 1.0 && factor > 0.0 ) {
				vec3.scale(_eye,   _eye, factor );
			}
			if ( _this.staticMoving ) {
				vec3.copy(_zoomStart,   _zoomEnd );
			} else {
				_zoomStart[1] += ( _zoomEnd[1] - _zoomStart[1] ) * this.dynamicDampingFactor;
			}
		}
	};




	this.panCamera = ( function() {

		var mouseChange = vec2.create(),
			cameraUp = vec3.create(),
			pan = vec3.create();

		return function panCamera() {
            return; // !!!!!!!
			mouseChange.copy( _panEnd ).sub( _panStart );

			if ( mouseChange.lengthSq() ) {

				mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

				pan.copy( _eye ).cross( _this.camera.up ).setLength( mouseChange[0] );
				pan.add( cameraUp.copy( _this.camera.up ).setLength( mouseChange[1] ) );

				_this.camera.position.add( pan );
				_this.target.add( pan );

				if ( _this.staticMoving ) {

					_panStart.copy( _panEnd );

				} else {

					_panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

				}

			}

		};

	}() );




	this.checkDistances = function () {
		if ( ! _this.noZoom || ! _this.noPan ) {
			if ( vec3.squaredLength(_eye) > _this.maxDistance * _this.maxDistance ) {
				vec3.add(_this.camera.position,    _this.target, window.vec3extension.setLength(_eye,  _this.maxDistance));
				vec2.copy(_zoomStart, _zoomEnd );
			}
			if ( vec3.squaredLength(_eye) < _this.minDistance * _this.minDistance ) {
				vec3.add(_this.camera.position,    _this.target, window.vec3extension.setLength(_eye, _this.minDistance));
				vec2.copy(_zoomStart, _zoomEnd );
			}
		}
	};




	this.update = function () {

		vec3.subtract(_eye, _this.camera.position, _this.target );

		if ( ! _this.noRotate ) {
			_this.rotateCamera();
		}

		if ( ! _this.noZoom ) {
			_this.zoomCamera();
		}

		if ( ! _this.noPan ) {
			_this.panCamera();
		}

		vec3.add(_this.camera.position,   _this.target, _eye );
		_this.checkDistances();

		// NO EQUIV?:    _this.camera.lookAt( _this.target );

		if ( vec3.squaredDistance(lastPosition, _this.camera.position) > EPS ) {
			_this.dispatchEvent( changeEvent );
			vec3.copy(lastPosition,   _this.camera.position );
		}

	};





	this.reset = function () {
		_state = STATE.NONE;
		_prevState = STATE.NONE;

		vec3.copy(_this.target, _this.target0 );
		vec3.copy(_this.camera.position, _this.position0 );
		vec3.copy(_this.camera.up,  _this.up0 );

		vec3.subtract(_eye,  _this.camera.position, _this.target );

		// NO EQUIV?   _this.camera.lookAt( _this.target );
		_this.dispatchEvent( changeEvent );
		lastPosition.copy( _this.camera.position );
	};




	// listeners

	function keydown( event ) {
		if ( _this.enabled === false ) return;
		window.removeEventListener( 'keydown', keydown );
		_prevState = _state;

		if ( _state !== STATE.NONE ) {
			return;

		} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && ! _this.noRotate ) {
			_state = STATE.ROTATE;
		} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && ! _this.noZoom ) {
			_state = STATE.ZOOM;
		} else if ( event.keyCode === _this.keys[ STATE.PAN ] && ! _this.noPan ) {
			_state = STATE.PAN;
		}
	}




	function keyup( event ) {
		if ( _this.enabled === false ) return;
		_state = _prevState;
		window.addEventListener( 'keydown', keydown, false );
	}



	function mousedown( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.NONE ) {
			_state = event.button;
		}

		if ( _state === STATE.ROTATE && ! _this.noRotate ) {
			vec2.copy(_moveCurr, getMouseOnCircle( event.pageX, event.pageY ) );
			vec2.copy(_movePrev, _moveCurr );

		} else if ( _state === STATE.ZOOM && ! _this.noZoom ) {
			vec2.copy(_zoomStart, getMouseOnScreen( event.pageX, event.pageY ) );
			vec2.copy(_zoomEnd, _zoomStart );

		} else if ( _state === STATE.PAN && ! _this.noPan ) {
			vec2.copy(_panStart,  getMouseOnScreen( event.pageX, event.pageY ) );
			vec2.copy(_panEnd, _panStart );
		}

		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

		_this.dispatchEvent( startEvent );
	}





	function mousemove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.ROTATE && ! _this.noRotate ) {
			vec2.copy(_movePrev,  _moveCurr );
			vec2.copy(_moveCurr,  getMouseOnCircle( event.pageX, event.pageY ) );
		} else if ( _state === STATE.ZOOM && ! _this.noZoom ) {
			vec2.copy(_zoomEnd,  getMouseOnScreen( event.pageX, event.pageY ) );
		} else if ( _state === STATE.PAN && ! _this.noPan ) {
			vec2.copy(_panEnd,  getMouseOnScreen( event.pageX, event.pageY ) );
		}
	}


    
	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		_state = STATE.NONE;

		document.removeEventListener( 'mousemove', mousemove );
		document.removeEventListener( 'mouseup', mouseup );
		_this.dispatchEvent( endEvent );

	}



	function mousewheel( event ) {
		if ( _this.enabled === false ) return;
		event.preventDefault();
		event.stopPropagation();
		switch ( event.deltaMode ) {
        case 2:
            // Zoom in pages
            _zoomStart[1] -= event.deltaY * 0.025;
            break;

		case 1:
            // Zoom in lines
			_zoomStart[1] -= event.deltaY * 0.01;
			break;

		default:
			// undefined, 0, assume pixels
			_zoomStart[1] -= event.deltaY * 0.00025;
			break;
		}

		_this.dispatchEvent( startEvent );
		_this.dispatchEvent( endEvent );
	}




	function touchstart( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

		case 1:
			_state = STATE.TOUCH_ROTATE;
			_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
			_movePrev.copy( _moveCurr );
			break;

		default: // 2 or more
			_state = STATE.TOUCH_ZOOM_PAN;
			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

			var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
			var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
			_panStart.copy( getMouseOnScreen( x, y ) );
			_panEnd.copy( _panStart );
			break;

		}

		_this.dispatchEvent( startEvent );
	}



	function touchmove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

		case 1:
			_movePrev.copy( _moveCurr );
			_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
			break;

		default: // 2 or more
			var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
			var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
			_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

			var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
			var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
			_panEnd.copy( getMouseOnScreen( x, y ) );
			break;

		}
	}




	function touchend( event ) {
		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {
		case 0:
			_state = STATE.NONE;
			break;
		case 1:
			_state = STATE.TOUCH_ROTATE;
			_moveCurr.copy( getMouseOnCircle( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
			_movePrev.copy( _moveCurr );
			break;

		}
		_this.dispatchEvent( endEvent );
	}




	function contextmenu( event ) {
		if ( _this.enabled === false ) return;
		event.preventDefault();
	}





	this.dispose = function() {
		this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
		this.domElement.removeEventListener( 'mousedown', mousedown, false );
		this.domElement.removeEventListener( 'wheel', mousewheel, false );

		this.domElement.removeEventListener( 'touchstart', touchstart, false );
		this.domElement.removeEventListener( 'touchend', touchend, false );
		this.domElement.removeEventListener( 'touchmove', touchmove, false );

		document.removeEventListener( 'mousemove', mousemove, false );
		document.removeEventListener( 'mouseup', mouseup, false );

		window.removeEventListener( 'keydown', keydown, false );
		window.removeEventListener( 'keyup', keyup, false );
	};

    
	this.domElement.addEventListener( 'contextmenu', contextmenu, false );
	this.domElement.addEventListener( 'mousedown', mousedown, false );
	this.domElement.addEventListener( 'wheel', mousewheel, false );

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', keydown, false );
	window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

	// force an update at start
	this.update();

};
