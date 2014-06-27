/*!
 *	EasyCanvas version 1.2
 *	Ken Fyrstenberg Nilsen, (c) 2013 Abidas Software
 *	http://easyCanvasJS.com/
 *	GPL-3.0 license (http://opensource.org/licenses/GPL-3.0)
*/
'use strict';

function easyCanvas() {

	/// internals
	var me = this, w, h, el, i = 0, ctx,
	
		padL = 0, padT = 0, padR = 0, padB = 0,
	
		rad2deg		= 180 / Math.PI,
		deg2rad		= Math.PI / 180,
		
		zoomX		= 1,
		zoomY		= 1,
		rotation	= 0,
		transX		= 0,
		transY		= 0,
		ox			= 0,
		oy			= 0,
		cRect,					// current bounds
		aa			= true,		// anti-aliasing status
		record		= false,	// internal state of record
		stroke,					// current internal stroke
		tool,					// internal index of tool

		vels,					// collected velocities in a stroke to calculate moving average
		vTimer,					// timeout for velocity

		bmpLock		= false,	// bitmap lock ver 1.2
		bmp,
		bmpData,
		oldSet,					// old function when bitmap is locked
		oldGet,

		autoBuff	= null,		// buffer for autoClear ver 1.2
		oldAuto		= null,		// old coords for autoClear
		
		oldSelect,				// old rect for select ver 1.2
		selTimer,				// timer for walking ants ver 1.2
		selOffset	= 0,		// selection dash offset anim
		selSelfDraw = false,	// internal
		
		isDrop		= false,	// canvas is drop zone for images ver 1.2
		dropExt		= ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.tif', '.tiff', '.bmp'],
		dropMaxSize	= -1,
		dropMaxItems = -1,
		
		dashOffset = 0,			// dash settings. ver 1.2
		dashPattern = [0],
		
		regions		= [],		// hit regions ver 1.2
		currentRegion = null,	// set on mouse down
		
		hotkeys		= [],		// list of hotkeys ver 1.2
		
		gridX		= 0,
		gridY		= 0,
		gOffsetX	= 0,
		gOffsetY	= 0,

		fullScreenMode = false,	// ver 1.2
		oldFS,

		prefixes	= ['', 'webkit', 'moz', 'ms', 'o', 'khtml'],
		
		globalMove	= true,
		isFirstNum	= true,
		isObserving	= false,
		isMouseMove,
		tmp,

		isFF		= (typeof window.console.__mozillaConsole__ !== 'undefined'),
		isChrome	= (typeof window.chrome !== 'undefined'),

		_initCnt = 25;		// for polling onredraw at init, one = 10ms, in future observer can be used instead
	
	/**
	 *	PROPERTIES
	*/
	this.canvas				= null;

	this.onmousedown		= null;
	this.onmousemove		= null;
	this.onmouseup			= null;
	this.onredraw			= null;
	this.onmousewheel		= null;		/// ver. 1.2
	this.ondrop				= null;
	this.ondropprogress		= null;
	this.onselect			= null;
	this.onselectend		= null;
	this.onselectstart		= null;

	this.reportResize		= true;
	this.calcAngle			= false;
	this.calcDistance		= false;
	this.calcVelocity		= false;
	this.autoResize			= false;
	this.trackMove			= false;
	this.clearColor			= null;
	this.clearBeforeDraw	= true;

	this.autoClear			= false;	/// ver. 1.2
	this.selectionMode		= false;	/// ver. 1.2
	this.selectedRect		= null;		/// ver. 1.2
	this.selectClearFull	= false;	/// ver. 1.2

	this.fullScreenMode		= 0;		/// ver. 1.2 (0 = cover, 1 = zoom, 2 = none)
	this.enableRegions		= false;	/// ver. 1.2
	
	this.width;
	this.height;

	this.deltaX				= 0;
	this.deltaY				= 0;
	this.firstX				= -1;
	this.firstY				= -1;
	this.prevX				= -1;
	this.prevY				= -1;
	this.prevAngle			= -1;
	this.prevStamp			= null;
	this.count				= 0;

	this.pivotX				= 0.5;
	this.pivotY				= 0.5;
	this.panMode			= false;
	this.limitPan			= true;
	this.panCursor			= 'move';

	this.record				= false;
	this.tool				= 0;
	this.strokes			= [];
	this.strokeHeader		= null;

	this.deg2rad			= deg2rad;
	this.rad2deg			= rad2deg;

	/// PRIVATE
	this.total = 0;
	this.isDown = false;
	this.maxVel = 0;
	this.oldCursor;
	this.isCursor = false;

	/**
	 *	PARSE ARGUMENTS
	*/
	if (arguments.length > 0) {
		
		for(; tmp = arguments[i]; i++) {

			/// dimensions
			if (typeof tmp === 'number') {
				isFirstNum === true ? this.width = w = parseInt(tmp, 10) : this.height = h = parseInt(tmp, 10);
				isFirstNum = false;				
			}
			
			/// element as ID
			if (typeof tmp === 'string') {
				el = document.getElementById(tmp);
				
				if (el instanceof HTMLCanvasElement) {
					this.canvas = el;
					this.width  = this.canvas.width;
					this.height = this.canvas.height;
				}
			}
			
			/// element as canvas
			if (tmp instanceof HTMLCanvasElement) {
				this.canvas = tmp;
				this.width  = this.canvas.width;
				this.height = this.canvas.height;
			}

			/// element as a DOM element
			if (tmp instanceof HTMLElement) {
				el = tmp;
			}			
		}
	}

	/**
	 *	Methods
	*/

	/// resize canvas
	this.resize = function(w, h) {

		if (typeof w !== 'number' || typeof h !== 'number')
			return _error('Illegal numbers for width or height.', 'resize');

		try {
			this.canvas.width = parseInt(w, 10) - (padL + padR);
			this.canvas.height = parseInt(h, 10) - (padT + padB);
			this.canvas.style.marginLeft = padL + 'px';
			this.canvas.style.marginTop = padT + 'px';

			this.width = this.canvas.width;
			this.height = this.canvas.height;

			if (ctx !== undefined) {
				calcDeltas();
				setTransform();
			}

			redraw();

			/// handle auto-clear
			if (autoBuff !== null) {
				autoBuff = me.getOffScreenCanvas();
			}

		} catch(err) {
			return _error('Error when resizing instance', 'resize');
		}

		return this;
	}

	/// add padding around canvas
	this.padding = function(top, right, bottom, left) {

		if (arguments.length === 0)
			return [padT, padR, padB, padL];

		padT = top;
		padR = right;
		padB = bottom;
		padL = left;

		this.resize(this.canvas.width, this.canvas.height);	

		return this;
	}

	/// short-cut for clearing the canvas
	this.clear = function() {
		
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		
		if (this.clearColor === null) {
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		} else {
			ctx.fillStyle = this.clearColor;
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}

		ctx.restore();

		return this;
	}
	
	/// detach canvas from parent DOM element and destroy
	this.remove = function() {

		try {

			var c = this.canvas;
						
			if (typeof el !== 'undefined' && el !== null && typeof el !== 'string') {

				/// remove drop zone event listeners if any
				if (isDrop === true) {				
					this.canvas.removeEventListener('dragover', _dragOver, false);
					this.canvas.removeEventListener('drop', _drop, false);
				}

				document.removeEventListener('fullscreenchange', _fullScreenEvent, false);
				document.removeEventListener('mozfullscreenchange', _fullScreenEvent, false);
				document.removeEventListener('webkitfullscreenchange', _fullScreenEvent, false);

				/// remove default event listeners
				window.removeEventListener('resize', _resize, false);
				window.removeEventListener('mouseup', _mouseup, false); 
				this.canvas.removeEventListener(isFF ? 'DOMMouseScroll' : 'mousewheel', _mouseWheel, false);

				if (globalMove === true)
					window.removeEventListener('mousemove', _mousemove, false);
	
				c.onmousedown = null;
				c.onmousemove = null;
				c.onmouseup = null;
				c.onselectstart = null;
				c.onselect = null;
				c.onselectend = null;
				c.ondrop = null;
				c.ondropprogress = null;
				c.onmousewheel = null;
								
				if (!(el instanceof HTMLCanvasElement)) {
					el.removeChild(c);
				}
				
				ctx = this.ctx = this.context = undefined;
				this.canvas = undefined;
			}
		
		} catch(err) {
			return _error('Error removing instance', 'remove');
		}
	}

	/// set or get a CSS style
	this.style = function(name, arg) {

		if (arguments.length === 1)
			return this.canvas.style[name];

		this.canvas.style[name] = arg;

		return this;
	}

	/// attach a CSS class
	this.cssClass = function(name) {

		if (arguments.length === 0)			/// bug fixed in 1.2, === 1 --> ===0
			return this.canvas.className;

		if (name === null) name = '';

		this.canvas.className = name;

		return this;
	}

	/// download canvas as image
	this.download = function(filename, itype, arg) {

		if (typeof filename !== 'string' || filename.trim().length === 0)
			filename = 'Untitled';
			
		itype = (typeof itype === 'string') ? itype.toLowerCase() : 'png';

		if (filename.length < 5 || filename.substring(filename.length - itype.length) !== itype)
			filename += '.' + itype;

		var lnk = document.createElement('a'),
			c = this.canvas,
			e;

		lnk.download = filename;		

		if (itype === 'png') {
			lnk.href = c.toDataURL();	

		} else if (itype === 'jpg' || itype === 'jpeg') {

			(typeof arg === 'number') ? lnk.href = c.toDataURL('image/jpeg', arg) : 
										lnk.href = c.toDataURL('image/jpeg');
		}

		if (document.createEvent) {

			e = document.createEvent("MouseEvents");
			e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

			lnk.dispatchEvent(e);

		} else if (lnk.fireEvent) {

			lnk.fireEvent("onclick");
		}
		return this;
	}

	/// set clip coords
	this.clipCoords = function(clip) {

		if (typeof clip !== 'boolean')
			return !globalMove;
	
		var c = this.canvas;

		if (clip !== globalMove) return this;
		
		if (clip === true) {
			window.removeEventListener('mousemove', _mousemove, false);
			c.onmousemove = _mousemove;
		
		} else {
			c.onmousemove = null;
			window.addEventListener('mousemove', _mousemove, false);
		}

		globalMove = !clip;

		return this;	
	}

	/// set zoom
	this.zoom = function(zx, zy, px, py) {

		if (zx === undefined) return [zoomX, zoomY];

		if (typeof zy !== 'number') zy = zx;

		if (zx < 0.0001) zx = 0.0001;
		if (zy < 0.0001) zy = 0.0001;

		if (zoomX === zx && zoomY === zy)
			return this;

		if (typeof me.onbeforezoom === 'function')
			me.onbeforezoom({oldZoomX: zoomX, oldZoomY: zoomY, newZoomX: zx, newZoomY: zy, timeStamp: getStamp()});

		var ozx = zoomX, ozy = zoomY;
	
		zoomX = zx;
		zoomY = zy;

		/// future zooom at pivot points
		/*if (typeof px === 'number' && typeof py === 'number') {

		}*/
		
		setTransform();

		if (typeof me.onzoom === 'function')
			me.onzoom({oldZoomX: ozx, oldZoomY: ozy, newZoomX: zx, newZoomY: zy, timeStamp: getStamp()});

		return this;
	}	

	/// set rotate
	this.rotate = function(angle) {

		if (arguments.length === 0)
			return angle;
	
		angle = parseFloat(angle);

		if (angle === rotation) return this;

		if (typeof me.onbeforerotate === 'function')
			me.onbeforerotate({oldAngle: rotation, newAngle: angle, timeStamp: getStamp()});

		while(angle < 0) angle += 360;
		while(angle >= 360) angle -= 360;

		var oan = rotation;
		rotation = angle;
		
		setTransform();

		if (typeof me.onrotate === 'function')
			me.onrotate({oldAngle: oan, newAngle: angle, timeStamp: getStamp()});

		return this;
	}

	/// set pan v1.2
	this.pan = function(dx, dy, absolute) {

		if (arguments.length === 0)
			return [transX, transY, ox, oy];

		absolute = (typeof absolute === 'boolean') ? absolute : false;

		if (typeof me.onbeforepan === 'function')
			me.onbeforepan({oldDeltaX: transX, oldDeltaY: transY, newDeltaX: dx, newDeltaY: dy, isAbsolute: absolute, timeStamp: getStamp()});

		var otx = transX, oty = transY;

		if (absolute === true) {
			transX = dx;
			transY = dy;
		} else {
			transX += dx;
			transY += dy;
		}

		setTransform();

		if (typeof me.onpan === 'function')
			me.onpan({oldDeltaX: otx, oldDeltaY: oty, newDeltaX: transX, newDeltaY: transY, isAbsolute: absolute, timeStamp: getStamp()});

		return this;
	}

	/// reset translations
	this.reset = function() {
		
		zoomX = zoomY = 1;
		rotation = transX = transY = ox = oy = 0;
	
		setTransform();
		
		return this;
	}
	
	/// stroke line
	this.strokeLine = this.line = function(x1, y1, x2, y2, lwidth, color) {

		var l = arguments.length;
			
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		
		if (l > 4) ctx.lineWidth = lwidth;
		if (l > 5) ctx.strokeStyle = color;

		ctx.stroke();

		return this;		
	}

	/// callback onredraw
	this.update = function() {
		redraw();
	}

	/// set or get grid
	this.grid = function(gX, gY, oX, oY) {
	
		switch(arguments.length) {
		
			case 0:
				return [gridX, gridY, gOffsetX, gOffsetY];
			
			case 1:
				gY = gX;
				oX = oY = 0;
				break;
			case 2:
				oX = oY = 0;
				break;
			case 3:
				oY = oX;
				break;
			case 4:
				break;
			case Default:
				return _error('Unsupported number of arguments.', 'grid');
		}

		if (gX < 0) gX = 0;
		if (gY < 0) gY = 0;

		gridX = gX;
		gridY = gY;
		gOffsetX = oX;
		gOffsetY = oY;

		return this;
	}

	this.getGridX = function(x) {

		if (gridX === 0) return x;

		if (x < gOffsetX) x = gOffsetX;
		return (((x + gridX * 0.5 - gOffsetX) / gridX)|0) * gridX + gOffsetX;
	}
	
	this.getGridY = function(y) {

		if (gridY === 0) return y;

		if (y < gOffsetY) y = gOffsetY;
		return (((y + gridY * 0.5 - gOffsetY) / gridY)|0) * gridY + gOffsetY;
	}	
	
	/// get cell index (v1.2)
	this.getGridCell = function(x, y) {
	
		x = ((x - gOffsetX) / gridX)|0;
		y = ((y - gOffsetY) / gridY)|0;
	
		return [x, y];
	}

	/// get cell position (v1.2)
	this.getGridPosition = function(x, y) {
	
		x = parseInt(x, 10);
		y = parseInt(y, 10);
		
		if (x < 0) x = 0;
		if (y < 0) y = 0;
		
		x = x * gridX + gOffsetX;
		y = y * gridY + gOffsetY;
	
		return [x, y];
	}
	
	/// lock bitmap for faster pixel operations
	this.lock = function(state) {
	
		if (arguments.length === 0)
			return bmpLock;
		
		if (state === bmpLock)
			return this;

		bmpLock = state;
		
		try {
			if (state === true) {
			
				oldGet = this.getPixel;
				oldSet = this.setPixel;
				
				this.getPixel = getPixelFast;
				this.setPixel = setPixelFast;
	
				bmp = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
				bmpData = bmp.data;
						
			} else {
				
				this.getPixel = oldGet;
				this.setPixel = oldSet;
	
				ctx.putImageData(bmp, 0, 0);
			}

		} catch(err) {return _error(err.message || 'Security error probably due to CORS restrictions', 'lock')}
	
		return this;
	}
	
	function getPixelFast(x, y) {
		
		var p = bmp.width * y * 4 + x * 4;
		return [bmpData[p], bmpData[p + 1], bmpData[p + 2], bmpData[p + 3]];
	}

	function setPixelFast(x, y, color) {

		var p = bmp.width * y * 4 + x * 4;
		bmpData[p] = color[0];
		bmpData[p + 1] = color[1];
		bmpData[p + 2] = color[2];
		if (color.length === 4) bmpData[p + 3] = color[3];

		return this;
	}

	/// Get a single pixel
	this.getPixel = function(x, y) {
	
		try {
			var px = ctx.getImageData(x, y, 1, 1).data;
			return [px[0], px[1], px[2], px[3]];

		} catch(err) {return _error(err.message || 'Security error probably due to CORS restrictions', 'getPixel')}
	}
	
	/// Put a single pixel
	this.setPixel = function(x, y, col) {

		if (col.length === 3) col.push(255);

		var px, dt, tmpStyle;

		try {
	
			px = ctx.getImageData(x, y, 1, 1);
			dt = px.data;
			
			dt[0] = col[0];
			dt[1] = col[1];
			dt[2] = col[2];
			dt[3] = col[3];
			
			ctx.putImageData(px, x, y);
	
			return this;

		} catch(err) {
			
			tmpStyle = ctx.fillStyle;
			ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (col[3] / 255).toFixed(2) + ')';
			ctx.fillRect(x, y, 1, 1);
			ctx.fillStyle = tmpStyle;

			return _error(err.message || 'Security error probably due to CORS restrictions.', 'setPixel')
		}
	}

	/// draws an image propotionally to fit in destination rectangle
	this.drawImageProp = function(img, x, y, w, h, ofx, ofy) {

		if (typeof img === 'undefined' || img === null)
			return _error('Image argument is null or undefined', 'drawImageProp');
	
		if (arguments.length === 1) {
			x = y = 0;
			w = this.width;
			h = this.height;
			ofx = 0.5;
			ofy = 0.5;
		}

		ofx = (typeof ofx === 'number') ? ofx : 0.5;
		ofy = (typeof ofy === 'number') ? ofy : 0.5;

		if (ofx < 0) ofx = 0;
		if (ofy < 0) ofy = 0;
		if (ofx > 1) ofx = 1;
		if (ofy > 1) ofy = 1;

		var	iw = img.width,
			ih = img.height,
			r = Math.min(w / iw, h / ih),
			nw = iw * r,
			nh = ih * r,
			cx, cy, cw, ch, ar = 1;

		if (nw < w) ar = w / nw;
		if (nh < h) ar = h / nh;
		nw *= ar;
		nh *= ar;

		cw = iw * 1 / (nw / w);
		ch = ih * 1 / (nh / h);

		cx = (iw - cw) * ofx;
		cy = (ih - ch) * ofy;

		if (cx < 0) cx = 0;
		if (cy < 0) cy = 0;
		if (cw > iw) cw = iw;
		if (ch > ih) ch = ih;

		ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
		
		return this;
	}
	
	/// anti-aliasing for images
	this.antialiasing = function(state) {

		if (arguments.length === 0)
			return aa;

		aa = state;

		var isSet = false, p, i = 0, r = ';image-rendering:';

		for(;i < prefixes.length; i++) {

			p = (i === 0) ? 'imageSmoothingEnabled' : prefixes[i] + 'ImageSmoothingEnabled';

			if (ctx[p] !== undefined) {
				ctx[p] = aa;
				isSet = true;
				break;
			}
		}
			
		if (isSet === false) {
			this.canvas.style.cssText = (aa === true) ? r + '-moz-auto' + r + '-webkit-auto' + r + '-o-auto' + r + 'auto;-ms-interpolation-mode:bicubic;'
													  : r + '-moz-crisp-edges' + r + '-webkit-optimize-contrast' + r + '-o-crisp-edges' + r + 'crisp-edges;-ms-interpolation-mode:nearest-neighbor;';
		}

		return this;
	}
	
	/// get off-screen canvas (in v1.2 -> capital S in getOffScreenCanvas)
	this.getOffscreenCanvas = this.getOffScreenCanvas = function(w, h) {
		
		var c = document.createElement('canvas'),
			img,
			x;
		
		if (arguments.length === 0) {
			w = this.canvas.width;
			h = this.canvas.height;

		} else if (arguments.length === 1 && typeof w !== 'number') {
			
			if (typeof w.width === 'undefined' && typeof w.clientWidth === 'undefined')
				return _error('Invalid arguments', 'getOffScreenCanvas');
			
			img = w;
			w = img.width || img.clientWidth;
			h = img.height || img.clientHeight;
		}
		
		c.width = w;
		c.height = h;

		x = c.getContext('2d');

		if (typeof img !== 'undefined') {
			x.drawImage(img, 0, 0);
		}

		return {canvas: c,
				ctx: x,
				context: x,
				width: w,
				height: h,
				centerX: w * 0.5,
				centerY: h * 0.5
				};
	}

	/// loads an image
	this.loadImage = function(url, callback, callbackError) {

		if (typeof url !== 'string')
			return _error('An URL must be provided', 'loadImage');

		if (typeof callback !== 'function')
			return _error('A callback function for loadImage success must be provided.', 'loadImage');

		var img = document.createElement('img');
		img.onload = function(e) {
			callback({image: this, url: url, timeStamp: e.timeStamp})
		};

		if (typeof callbackError === 'function') {
			img.onerror = function(e) {
				callbackError({image: null, url: url, timeStamp: getStamp()})
			};

		} else {
			img.onerror = function(e) {
				_error('Error loading image', 'loadImage');
			};
		}

		img.src = url;

		return this;
	}

	/// load image array (ver. 1.2)
	this.loadImages = function(urls, callback, pCallback) {
	
		if (!Array.isArray(urls) || urls.length === 0)
			return _error('URL must be provided', 'loadImages');

		if (typeof callback !== 'function')
			return _error('A callback function for loadImage success must be provided.', 'loadImages');

		var	cnt			= urls.length,
			len			= cnt,
			imgArray	= new Array(cnt),
			i			= 0;
		
		if (typeof pCallback === 'function')
		pCallback({	current: 0,
							total: len,
							image: null,
							timeStamp: getStamp()
						  });
		
		for(;i < len; i++) 
			this.loadImage(urls[i], cb, cbErr);

		function cb(e, hasError) {

			/// as images can return out of order, force order this way:			
			for(var ix = 0; ix < len; ix++)
				if (e.url === urls[ix]) break;

			imgArray[ix] = (arguments.length === 1) ? e.image : null;

			cnt--;

			if (typeof pCallback === 'function')
				pCallback({	current: len - cnt,
							total: len,
							image: imgArray[ix],
							timeStamp: e.timeStamp
						  });

			if (cnt === 0)
				callback({images: imgArray, urls: urls, timeStamp: getStamp()});
		}

		function cbErr(e) {
			cb(e, 1);
		}
		
		return this;
	}

	/// get accurate velocity value based on move timeout and moving average
	this.getVelocity = function(smooth) {
	
		if (vels.length === 0) return 0;
		if (vels.length === 1) return vels[0];

		/// force an integer number or set a default
		smooth = (typeof smooth === 'number') ? parseInt(smooth, 10) : 3;

		if (smooth > vels.length) smooth = vels.count;
		
		/// moving average
		var i = 0, tri = 0, a = 0, cnt = 1, v;
		
		for(; i < smooth; i++) tri += (i + 1);
		
		i = vels.length - smooth;
		
		for(; v = vels[i]; i++) {
			a += vels[i] * cnt / tri;
			cnt++;
		}

		return a;
	}
	
	/// Render tool 0 (points) (ver. 1.2)
	this.renderTool0 = function(color, lineWidth) {
	
		ctx.beginPath();
	
		if (typeof lineWidth === 'number')
			ctx.lineWidth = lineWidth;

		if (typeof color === 'string')
			ctx.strokeStyle = color;

		var i = 0, t, stroke, len, start;
	
		for(; stroke = this.strokes[i]; i++) {

			/// check if stroke is using tool 0
			if (stroke[0] === 0) {
				
				len = stroke.length;
				
				start = (len * 0.5 === ((len * 0.5)|0)) ? start = 2 : 1;

				ctx.moveTo(stroke[start], stroke[start + 1]);

				for(t = start + 2; t < len; t += 2)
					ctx.lineTo(stroke[t], stroke[t + 1]);
			}
		}

		ctx.stroke();

		return this;	
	}

	/// get bounding rect from points (ver. 1.2)
	this.getRect = function(x1, y1, x2, y2, incl) {

		incl = (typeof incl === 'boolean') ? incl : true;

		var dx = x2 - x1,
			dy = y2 - y1;
					
		x1 = (dx < 0) ? x2 : x1;
		y1 = (dy < 0) ? y2 : y1;
		
		return (incl === true) ? [x1, y1, Math.abs(dx) + 1, Math.abs(dy) + 1]
							   : [x1, y1, Math.abs(dx), Math.abs(dy)];
	}

	/// manually start auto-clear. Ver. 1.2
	this.startAutoClear = function() {
		if (typeof autoBuff === 'undefined' || autoBuff === null)
			initAutoClear();

		return this;
	}

	/// manually update auto-clear buffer. Ver. 1.2
	this.updateAutoClear = function() {

		if (autoBuff !== null)
			autoBuff.ctx.drawImage(me.canvas, 0, 0);

		return this;
	}

	/// get canvas of auto-clear
	this.getAutoClearBuffer = function() {

		return autoBuff;
	}

	/// manually clear background. Ver. 1.2
	this.clearBackground = function(x, y, w, h) {

		if (autoBuff !== null) {

			if (x === null) return;

			if (arguments.length === 0) {
				x = y = 0;
				w = me.width;
				h = me.height;

			} else if (arguments.length === 1) {
				y = x[1];
				w = x[2];
				h = x[3];
				x = x[0];
			}

			x = parseInt(x, 10);
			y = parseInt(y, 10);
			w = parseInt(w, 10);
			h = parseInt(h, 10);

			/// compensate for anti-aliasing
			x -= 2;
			y -= 2;
			w += 5;
			h += 5;

			me.ctx.clearRect(x, y, w, h);
			
			if (x < 0) x = 0;
			if (y < 0) y = 0;
			if (x >= me.width) x = me.width - 1;
			if (y >= me.height) y = me.height - 1;

			if (w + x > me.width) w = me.width - x;
			if (h + y > me.height) h = me.height - y;
			if (w < 1) w = 1;
			if (h < 1) h = 1;
			
			try {
				me.ctx.drawImage(autoBuff.canvas,  x, y, w, h,  x, y, w, h);
			} catch (err) {return _error(err.message || 'Error occured', 'clearBackground')}
		}
		return this;
	}

	/// manually end auto-clear
	this.endAutoClear = function() {
		if (autoBuff !== null)
			autoBuff = null;
		return this;
	}

	/// set line dash (cross-browser)
	this.setDash = function(pat, offset, internal) {

		if (arguments.length === 0)
			return [dashPattern, dashOffset];

		offset = (typeof offset === 'number') ? offset : 0;

		if (typeof pat === 'number') pat = [pat, pat];
		if (pat.length < 2) pat.push(pat[0]);

		/// update internal copies
		if (arguments.length < 3) {
			dashOffset = offset;
			dashPattern = pat;
		}

		if (typeof ctx.setLineDash !== 'undefined' ) {
			me.ctx.setLineDash(pat);
			me.ctx.lineDashOffset = offset;

		} else if (typeof ctx.mozDash !== 'undefined' ) {
			me.ctx.mozDash = [5, 5]; //pat;
			me.ctx.mozDashOffset = offset;
		} //TODO check for more browser specifics
		
		return this;
	}

	/// make drop-zone for images (ver. 1.2)
	this.drop = function(status, maxSize, maxItems, ext) {
	
		if (typeof window.FileReader === 'undefined')
			return _error('Sorry, FileReader is not supported in this browser', 'drop', 1);

		if (status === true && isDrop === false) {
			this.canvas.addEventListener('dragover', _dragOver, false);
			this.canvas.addEventListener('drop', _drop, false);
			isDrop = true;
			
		} else if (status === false && isDrop === true ){
			this.canvas.removeEventListener('dragover', _dragOver, false);
			this.canvas.removeEventListener('drop', _drop, false);
			isDrop = false;
		}
		
		dropMaxSize = (typeof maxSize !== 'undefined' && maxSize !== null) ? maxSize : dropMaxSize;
		dropMaxItems = (typeof maxItems !== 'undefined' && maxItems !== null) ? maxItems : dropMaxItems;
		dropExt = (typeof ext !== 'undefined' && Array.isArray(ext)) ? ext : dropExt;
	
		return this;
	}

	this.fullScreen = function(status) {
 
		if ((document.fullscreenenabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.oFullscreenEnabled || document.msFullscreenEnabled || (document.webkitCurrentFullScreenElement !== undefined)) !== true)
			return _error('Fullscreen mode not supported in this browser', 'fullScreen', 1);
			
		if (arguments.length === 0)
			return fullScreenMode;
		
		var el = me.canvas;

		if (status === true && !el.fullscreenElement && !el.mozFullScreenElement && !el.webkitFullscreenElement && !el.oFullscreenElement && !el.msFullscreenElement) {
			el.requestFullScreen();				
			//fullScreenMode = true;
		} else {
			document.cancelFullScreen();
			//fullScreenMode = false;
		}	
	
		return this;
	}

	/// resize based on fullscreen mode
	function _goFullScreen(status) {

		if (status === true) {

			oldFS = {
				position : me.style('position'),
				x : me.style('left'),
				y : me.style('top'),
				w : me.width,
				h : me.height,
				cssW : me.style('width'),
				cssH : me.style('height')
			}

			me.style('position', 'fixed');
			me.style('left', '0');
			me.style('top', '0');

			switch(me.fullScreenMode) {

				case 0: /// cover
					me.resize(screen.width, screen.height);
					break;			

				case 1: /// zoom
					me.style('width', '100%');
					me.style('height', '100%');
					break;			
			}
			
		} else {
			if (typeof oldFS !== 'undefined') {
				me.style('position', oldFS.position);
				me.style('width', oldFS.cssW);
				me.style('height', oldFS.cssH);
				me.resize(oldFS.w, oldFS.h);
				me.style('left', oldFS.x);
				me.style('top', oldFS.y);
			}
		}
		
		if (typeof me.onfullscreen === 'function')
			me.onfullscreen({isFullscreen: status,
							 timeStamp: getStamp()
							 });
	}

	function _fullScreenEvent(e) {

		e = e || window.event;

		var fs = (document.fullScreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.oFullScreenElement || document.msFullScreenElement || document.webkitCurrentFullScreenElement);
		fullScreenMode  = (!(fs === null || fs === undefined));
		_goFullScreen(fullScreenMode);
	}

	/// hit regions ver 1.2 indexes -> 0:x, 1:y, 2: w, 3: h, 4: id, 5: pri, 6: ts, 7:cursor (internally w/h are absolutes for speed increase
	this.addRegion = function(id, x, y, w, h, pri, cursor) {

		var i = 0, ts = getStamp();
		
		if (arguments.length === 1) {
			x = id.x;
			y = id.y;
			w = id.width;
			h = id.height;
			pri = id.pri;
			id = id.id;
			ts = id.timeStamp;
			cursor = id.cursor;
		}
		
		if (typeof pri === 'undefined') pri = 0;
		if (typeof cursor !== 'string') cursor = 'default';

		/// check if region with this id already exist
		for(; i < regions.length; i++) {
			if (regions[i][4] === id) {
				return _error('A region with this ID already exist', 'addRegion');
			}
		}

		regions.push([x, y, w + x, h + y, id, pri, ts, cursor]);

		/// sort by pri, timeStamp
		regions.sort(regSort);
		
		function regSort(a, b) {
			if (a[5] === b[5]) {
				return a[6] - b[6];
			} else return a[5] - b[5];
		}
		
		return this;
	}

	this.updateRegion = function(id, x, y, w, h, pri) {
	
		if (arguments.length === 1) {
		
			me.removeRegion(id.id);
			me.addRegion(id);

		} else {
		
			me.removeRegion(id);
			
			if (typeof pri === 'undefined') pri = 0;
			me.addRegion(id, x, y, w, h, pri);
		}
		return this;
	}

	this.removeRegion = function(id) {

		for(var i = 0; i < regions.length; i++) {
			if (regions[i][4] === id) {
				regions.splice(i, 1);
				return this;
			};
		}
		return this;
	}

	this.getRegion = function(id) {

		for(var i = 0; i < regions.length; i++) {
			if (regions[i][4] === id)
				return regionToObject(regions[i]);
		}
		return null;
	}

	this.getRegions = function() {

		var i = 0, rc = [];
		
		for(; i < regions.length; i++) {
			rc.push(regionToObject(regions[i]));
		}
		return rc;
	}

	this.testRegion = function(x, y) {

		var tr = testRegion(x, y);

		if (tr !== null) {
			return regionToObject(tr);

		} else return null;

		function testRegion(x, y) {
	
			for(var i = 0, r; r = regions[i]; i++) {
				if (x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]) {
					return r;
				};
			}
			return null;
		}
	}
	
	function regionToObject(r) {
	
		return {
			x			: r[0],
			y			: r[1],
			right		: r[2],
			bottom		: r[3],
			width		: r[2] - r[0],
			height		: r[3] - r[1],
			id			: r[4],
			pri			: r[5],
			timeStamp	: r[6],
			cursor		: r[7]
		}
	}
	
	/// turn on or off text selection in browser ver 1.2
	this.textSelect = function(status) {

		var val = (status === true) ? 'text' : 'none',
			bd = document.getElementsByTagName('body')[0],
			i = 0, p;
	
		for(;i < prefixes.length; i++) {
			p = (i === 0) ? 'userSelect' : prefixes[i] + 'UserSelect';
			bd.style[p] = val;
		}

		return this;
	}
	
	/// add hotkeys ver 1.2
	this.addHotkey = function(key, isAlt, isCtrl, isShift) {

		if (me.hasHotkey(key, isAlt, isCtrl, isShift) === true)
			return _error('Hotkey already defined', 'addHotkey');

		var keyCode = _intepretKey(key);

		if (keyCode === null)
			return _error('Invalid key', 'addHotkey');

		if (typeof isShift !== 'boolean') isShift = false;
		if (typeof isCtrl !== 'boolean') isCtrl = false;
		if (typeof isAlt !== 'boolean') isAlt = false;

		hotkeys.push([key, keyCode, isAlt, isCtrl, isShift]);

		if (hotkeys.length === 1)
			window.addEventListener('keyup', _handleHotkeys, false);

		return this;
	}

	this.hasHotkey  = function(key, isAlt, isCtrl, isShift) {
	
		var keyCode = _intepretKey(key),
			i = 0, h;

		if (keyCode === null)
			return _error('Invalid key', 'addHotkey');

		if (typeof isShift !== 'boolean') isShift = false;
		if (typeof isCtrl !== 'boolean') isCtrl = false;
		if (typeof isAlt !== 'boolean') isAlt = false;

		for(; h = hotkeys[i]; i++) {
	
			if (keyCode === h[1] && isAlt === h[2] && isCtrl === h[3] && isShift === h[4])
				return true;
		}

		return false;
	}
	
	this.removeHotkey = function(key, isAlt, isCtrl, isShift) {
	
		var keyCode = _intepretKey(key),
			i = 0, h;

		if (keyCode === null)
			return _error('Invalid key', 'addHotkey');

		if (typeof isShift !== 'boolean') isShift = false;
		if (typeof isCtrl !== 'boolean') isCtrl = false;
		if (typeof isAlt !== 'boolean') isAlt = false;

		for(; h = hotkeys[i]; i++) {
	
			if (keyCode === h[1] && isAlt === h[2] && isCtrl === h[3] && isShift === h[4]) {

				hotkeys.splice(i, 1);
				
				if (hotkeys.length === 0) {
					window.removeEventListener('keyup', _handleHotkeys, false);
				}
				return this;
			}
		}

		return _error('Hotkey not found', 'removeHotkey');
	}

	this.getRegionsInArea = function(x, y, w, h) {
	
		if (arguments.length === 1) {
			y = x.y;
			w = x.width;
			h = x.height;
			x = x.x;
		}

		var i = 0, r, lst = [],
			z = x + w,
			b = y + h;
		
		z++;
		x--;
		b++;
		y--;
		
		for(;r = regions[i]; i++) {
			if ((r[0] > z || r[2] < x || r[1] > b || r[3] < y) === false)
				lst.push(regionToObject(r));
		}

		return lst;
	}

	function _intepretKey(key) {

		var keyCode = null,
			fKeys = {'f1':112, 'f2':113, 'f3':114, 'f4':115, 'f5':116, 'f6':117, 'f7':118, 'f8':119, 'f9':120, 'f10':121, 'f11':122, 'f12':123},
			navKeys = {'pgup':33, 'pageup':33, 'pgdown':34, 'pagedown':34, 'left':37, 'up':38, 'right':39, 'down':40, 'end':35, 'home':36, 'tab':9, 'enter':13},
			miscKeys = {'esc':27, 'insert':45, 'del':46, 'delete':46, 'capslock':20, 'winleft':91, 'winright':92,'numlock':144, 'scrolllock': 145, 'backspc': 8, 'backspace': 8, 'pause':19, 'break':19},
			numKeys = {' ':32, '0':48, '1':49, '2':50, '3':51, '4':52, '5':53, '6':54, '7':55, '8':56, '9':57},
			alphaKeys = {'a':65, 'b':66, 'c':67, 'd':68, 'e':69, 'f':70, 'g':71, 'h':72, 'i':73, 'j':74, 'k':75, 'l':76, 'm':77, 'n':78, 'o':79, 'p':80, 'q':81, 'r':82, 's':83, 't':84, 'u':85, 'v':86, 'w':87, 'x':88, 'y':89, 'z':90};
		
		if (typeof key === 'string') {

			if (key.length === 1) {
				if (keyCode === null && numKeys[key]) keyCode = numKeys[key];
				if (keyCode === null && alphaKeys[key]) keyCode = alphaKeys[key];
			} else {
				if (keyCode === null && fKeys[key]) keyCode = fKeys[key];
				if (keyCode === null && navKeys[key]) keyCode = navKeys[key];
				if (keyCode === null && miscKeys[key]) keyCode = miscKeys[key];
			}

		} else if (typeof key === 'number') {
			keyCode = parseInt(key, 10);
		}

		return keyCode;
	}

	function _handleHotkeys(e) {

		if (typeof me.onhotkey !== 'function')
			return;

		e = e || window.event;
		
        var keyCode = e.charCode || e.keyCode,
			i = 0, h;

		for(; h = hotkeys[i]; i++) {
			if (keyCode === h[1] && e.altKey === h[2] && e.ctrlKey === h[3] && e.shiftKey === h[4]) {
				
				if (e.preventDefault) e.preventDefault();
				e.returnValue = false;
				
				me.onhotkey({key: h[0], keyCode: h[1], isAlt: h[2], isCtrl: h[3], isShift: h[4], timeStamp: e.timeStamp});

				return false;
			}
		}
	}

	this.cancelSelection = function() {
	
		if (me.isDown === true && me.selectionMode === true) {
			endSelection(true, null);
			me.isDown = false;
			return;
		}
	}
	
	/**
	 *	INTERNALS - PRIVATE
	*/

	function _dragOver(e) {

		e = e || window.event;

		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.effectAllowed  = 'copy';
		e.dataTransfer.dropEffect = 'copy';
	}
	
	function _drop(e) {

		e = e || window.event;

		e.stopPropagation();
		e.preventDefault();

		/// nothing to receive the files
		if (typeof me.ondrop !== 'function') return false;
		
		var files = e.target.files || e.dataTransfer.files,
			file,
			fname,
			fsize,
			ftype,
			cnt = files.length,
			images = new Array(cnt),
			filenames = new Array(cnt),
			errors = [],
			readers = [],
			doProgress = true,
			i = 0, ix, pcnt = 1;

		for(; i < cnt; i++) images[i] = null;

		if (typeof me.ondropstart === 'function')
			me.ondropstart({total: files.length, timeStamp: getStamp()});

		for(i = 0; file = files[i]; i++) {
		
			fname = file.name;
			fsize = file.size;
			ftype = file.type;

			/// check extension, file size and number of items
			if (ftype.indexOf('image') === 0 && isExt(fname) === true && (dropMaxSize < 0 || fsize <= dropMaxSize) && (dropMaxItems < 0 || i < dropMaxItems) ) {
				
				readers.push(new FileReader());
				ix = readers.length - 1;
				
				readers[ix].___i = i;
				readers[ix].___p = pcnt;
				readers[ix].___fn = fname;
				
				readers[ix].onload = _reader;
				readers[ix].readAsDataURL(file);

			} else {
				errors.push({filename: fname, length: fsize, index: i, maxSize: dropMaxSize, maxItems: dropMaxItems});
				filenames[i] = fname;
				cnt--;

				_doProgress(doProgress, pcnt, files.length, null, fname);

				pcnt++;
				doProgress = false;
	
				if (cnt === 0) {
					doProgress = false;
					_dodrop(images, filenames, errors);
				}				
			}
		}

		function _reader(fe) {

			var img = document.createElement('img');
			img.onload = imageLoaded;
			img.onerror = imageError;
			img.___i = this.___i;
			img.___fn = this.___fn;
			img.src = fe.target.result;
		}

		function imageLoaded(e) {

			var ii = this.___i,
				fn = this.___fn;

			_doProgress(doProgress, pcnt, files.length, this, fn);

			pcnt++;
	
			images[ii] = this;
			filenames[ii] = fn;
			cnt--;

			if (cnt === 0) {
				doProgress = false;
				_dodrop(images, filenames, errors);
			}
		}
		
		function imageError(e) {

			_doProgress(doProgress, pcnt, files.length, null, this.___fn);

			pcnt++;

			filenames[this.___i] = this.___fn;
			cnt--;

			errors.push({filename: this.___fn, length: 0, index: this.___i, maxSize: dropMaxSize, maxItems: dropMaxItems});

			if (cnt === 0) {
				doProgress = false;
				_dodrop(images, filenames, errors);
			}
		}

		return false;
	}

	function isExt(file) {

		var ext = _getExtension(file).toLowerCase(),
			i = 0, x;

		for(; x = dropExt[i]; i++) {
			if (x.toLowerCase() === ext) return true;
		}
		return false;
	}
	
	function _getExtension(file) {
	
		var i = file.length -1;
		while(i--) {
			if (file.charAt(i) === '.') return file.substring(i);
		}
		return '';
	}

	function _doProgress(doProgress, current, total, image, filename) {

		if (doProgress === true && typeof me.ondropprogress === 'function') {

			var e = {
				current: current,
				total: total,
				image: image,
				filename: filename,
				timeStamp: getStamp()			
			}
			
			me.ondropprogress(e);
		}
	}
	
	function _dodrop(images, filenames, errors) {
		
		var e = {
			images: images,
			filenames: filenames,
			errors: errors,
			total: images.length,
			count: images.length - errors.length,
			timeStamp: getStamp()
		}
		
		me.ondrop(e);
	}

	/// call onredraw
	function redraw() {
		if (typeof me.onredraw === 'function') {

			if (me.clearBeforeDraw === true)
				me.clear();

			me.onredraw(false);
		}	
	}

	function getAngle(x1, y1, x2, y2) {

		var ang = Math.atan2(y2 - y1, x2 - x1) * rad2deg;
		if (ang < 0) ang += 360;

		return ang;
	}

	function getDist(x1, y1, x2, y2) {

		var xd = x2 - x1,
			yd = y2 - y1;

		return Math.sqrt(xd * xd + yd * yd);
	}

	function getVelocity(os, ns, d) {
		
		var diff = ns - os;

		if (diff <= 0) return 0;

		return d / diff;	
	}
	
	function calcDeltas() {
	
		var cs = getComputedStyle(me.canvas), px, py, bx, by;

		px = parseInt(cs.getPropertyValue('padding-left'), 10);
		if (isNaN(px) === true) px = 0;

		bx = parseInt(cs.getPropertyValue('border-left-width'), 10)
		if (isNaN(bx) === true) bx = 0;

		py = parseInt(cs.getPropertyValue('padding-top'), 10);
		if (isNaN(py) === true) py = 0;

		by = parseInt(cs.getPropertyValue('border-top-width'), 10)
		if (isNaN(by) === true) by = 0;

		me.deltaX = px + bx;
		me.deltaY = py + by
	}

	function calcCoords(x, y) {
		
		var cx, cy, ang, l, rx, ry;

		cRect = me.canvas.getBoundingClientRect();		

		rx = x - cRect.left - me.deltaX;
		ry = y - cRect.top - me.deltaY;

		x = rx / zoomX;
		y = ry / zoomY;

		if (gridX > 0) {
			if (x < gOffsetX) x = gOffsetX;
			x = (((x + gridX * 0.5 - gOffsetX) / gridX)|0) * gridX + gOffsetX;
		}

		if (gridY > 0) {
			if (y < gOffsetY) y = gOffsetY;
			y = (((y + gridY * 0.5 - gOffsetY) / gridY)|0) * gridY + gOffsetY;
		}

		if (rotation !== 0) {

			cx = me.width * me.pivotX / zoomX;
			cy = me.height * me.pivotY / zoomY;

			ang = (getAngle(cx, cy, x, y) - rotation) * deg2rad;
			l = getDist(cx, cy, x, y);

			x = cx + l * Math.cos(ang);
			y = cy + l * Math.sin(ang);
			
		}
		return [x - ox, y - oy, rx, ry];
	}
	
	function setTransform() {
	
		var w = me.width,
			h = me.height,
			pw = w * me.pivotX,
			ph = h * me.pivotY,
			zw, zh, dw, dh;

		me.ctx.setTransform(1, 0, 0, 1, 0, 0);
		me.ctx.translate(pw, ph);

		if (rotation !== 0)
			me.ctx.rotate(rotation * deg2rad);

		me.ctx.scale(zoomX, zoomY);

		me.ctx.translate(-pw, -ph);

		ox = ((me.width - me.width * zoomX) * me.pivotX) / zoomX;
		oy = ((me.height - me.height * zoomY) * me.pivotY) / zoomY;

		if (me.limitPan === true) {
		
			zw = w / zoomX;
			zh = h / zoomY;
			
			if (zoomX >= 1) {
				dw = w - zw + ox;
				if (transX < -dw) transX = -dw;
				if (transX > -ox) transX = -ox;

			} else {
				dw = zw - w - ox;
				if (transX < -ox) transX = -ox;
				if (transX > dw) transX = dw;
			}
			
			if (zoomY >= 1) {
				dh = h - zh + oy;
				if (transY < -dh) transY = -dh;
				if (transY > -oy) transY = -oy;

			} else {
				dh = zh - h - oy;
				if (transY < -oy) transY = -oy;
				if (transY > dh) transY = dh;
			}
		}
		
		me.ctx.translate(transX, transY);

		redraw();
	}
	
	function setCursor() {

		if (me.panMode === true) {

			if (me.isCursor === false && typeof me.panCursor === 'string') {
				me.oldCursor = me.canvas.style.cursor;
				me.canvas.style.cursor = me.panCursor;
				me.isCursor = true;
			}

		} else {

			if (me.isCursor === true) {
				me.canvas.style.cursor = me.oldCursor;
				me.isCursor = false;
			}
		}

	}
	
	function initAutoClear() {

		if (autoBuff !== null) return;
				
		try {
			autoBuff = me.getOffScreenCanvas(me.canvas);
			oldAuto = null;

		} catch(err) {
			return _error('Could not allocate buffer for autoClear.', 'initAutoClear');
		}
	}

	function endSelection(cancel, e) {

		clearInterval(selTimer);

		if (me.selectClearFull === false) {
			me.clearBackground(oldSelect);
		} else {
			me.clearBackground();
		}

		if (me.autoClear === false)	//TODO check potential bug here.. (perhaps use internal flag when selecting)
			me.endAutoClear();

		me.selectedRect = (cancel === false) ? oldSelect : null;
		
		me.setDash(0);

		if (typeof me.onselectend === 'function')
			me.onselectend({x: oldSelect[0],
							y: oldSelect[1],
							width: oldSelect[2],
							height: oldSelect[3],
							mouseX: oldSelect[0] + oldSelect[2],
							mouseY: oldSelect[1] + oldSelect[3],
							selfDraw: false,
							cancelSelection: false,
							timeStamp: getStamp(),
							originalEvent: e,
							selectionCancelled: cancel
							});
							
	}

	function _setSelectDash() {

		if (oldSelect !== null) {
			me.setDash(0, 0, true);
			me.ctx.strokeStyle = '#000';
			
			me.ctx.strokeRect(oldSelect[0] + 0.5, oldSelect[1] + 0.5, oldSelect[2], oldSelect[3]);
	
			me.setDash(5, selOffset++, true);
			me.ctx.strokeStyle = '#fff';
			me.ctx.strokeRect(oldSelect[0] + 0.5, oldSelect[1] + 0.5, oldSelect[2], oldSelect[3]);
		}
	}

	/// PRIVATE
	function getStamp() {
		return (new Date()).getTime();
	}

	/**
	 *	INIT CANVAS
	*/
	try {

		if (this.canvas === null) {

			this.canvas = document.createElement('canvas');
			this.canvas.innerHTML = 'easyCanvas';

			if (typeof this.canvas === 'undefined')
				return _error('Could not create a canvas element.', 'INIT');

			/// set width and height
			if (typeof w !== 'number' || typeof h !== 'number') {
	
				this.canvas.style.position	= 'fixed';
				this.canvas.style.left		= '0';
				this.canvas.style.top		= '0';
				
				this.resize(window.innerWidth, window.innerHeight);
				this.autoResize = true;
	
			} else {
				this.canvas.width	= this.width;
				this.canvas.height	= this.height;
			}

		} else {

			el = null;	
		}

		calcDeltas();

		/// get context
		ctx = this.ctx = this.context = this.canvas.getContext('2d');

		if (typeof ctx === 'undefined')
			return _error('Could not create a 2D canvas context.', 'INIT');

		/// handle the variations of possible 'element' types
		if (el !== null) {
		
			if (typeof el === 'undefined') {
				el = document.getElementsByTagName('body')[0];
			}
			
			if (typeof el === 'undefined')
				return _error('No element is defined (body seem unavailable)', 'INIT');

			/// attach canvas to element
			el.appendChild(this.canvas);
		}

	} catch(err) {
		return _error('Error duing initialization of instance', 'INIT');
	}

	/**
	 *	EVENTS
	*/

	window.addEventListener('resize', _resize, false);
	window.addEventListener('mouseup', _mouseup, false); 
	window.addEventListener('mousemove', _mousemove, false); 
	
	document.addEventListener('fullscreenchange', _fullScreenEvent, false);
	document.addEventListener('mozfullscreenchange', _fullScreenEvent, false);
	document.addEventListener('webkitfullscreenchange', _fullScreenEvent, false);

	this.canvas.addEventListener(isFF ? 'DOMMouseScroll' : 'mousewheel', _mouseWheel, false);

	/// handle resize of canvas and window
	function _resize(e) {

		e = e || window.event;

		if (me.reportResize === true) {

			if (me.autoResize === true) {
				me.resize(window.innerWidth, window.innerHeight);

			} else {
				redraw();
			}
		}
	}

	/// handle mouse down events
	this.canvas.onmousedown = function(e) {

		e = e || window.event;

		if (!('which' in e ? e.which === 1 : e.button === 1))
			return;

		var coords = calcCoords(e.clientX, e.clientY),
			x = coords[0],
			y = coords[1];

		/// we need these for select mode
		me.firstX		= me.prevX = x;
		me.firstY		= me.prevY = y;
		me.isDown		= true;

		/// select mode?
		if (me.selectionMode === true) {

			me.selectedRect = oldSelect = null;

			(me.autoClear === true) ? me.updateAutoClear() : initAutoClear();
			
			selOffset = 0;
			
			if (typeof me.onselectstart === 'function')
				me.onselectstart({x: x,
								  y: y,
								  mouseX: x,
								  mouseY: y,
								  timeStamp: getStamp(),
								  originalEvent: e
								  });

			selTimer = setInterval(_setSelectDash, 32);
			return;
		}

		/// pan mode?
		if (me.panMode === false) {
			x -= transX;
			y -= transY;
		}

		/// update misc
		me.prevStamp	= e.timeStamp;
		me.prevAngle	= 0;
		me.total		= 0;
		me.maxVel		= 0;
		me.count		= 1;

		vels 			= [];

		/// cache current record mode and tool
		record = me.record;
		tool = me.tool;

		if (me.autoClear === true)
			initAutoClear();
		
		if (record === true) {
			stroke = [me.tool];
			stroke.push(x);
			stroke.push(y);
		}

		if (me.enableRegions === true) {
			currentRegion = me.testRegion(x, y);
			if (currentRegion !== null && typeof me.onregiondown === 'function')
				me.onregiondown({region: currentRegion, timeStamp: e.timeStamp, x: x, y: y});
		}
		
		if (typeof me.onmousedown === 'function')
			me.onmousedown({x: x,
							y: y,
							relativeX: coords[2],
							relativeY: coords[3],
							timeStamp: e.timeStamp,
							originalEvent: e
							});

		isMouseMove = (typeof me.onmousemove === 'function');

	}

	/// handle mouse move events
	function _mousemove(e) {

		e = e || window.event;
		if (e.preventDefault) e.preventDefault();

		var mel = me,			 	//don't walk parent context
			ee, drawSel = true,
			v, a, dx, dy,
			coords, x, y, otx, oty;

		if (isObserving === false)
			setCursor();

		if (mel.isDown === true || mel.trackMove === true) {

			coords = calcCoords(e.clientX, e.clientY);
			x = coords[0];
			y = coords[1];
			dx = dy = 0;

			/// select mode?
			if (me.selectionMode === true) {

				x = parseInt(x, 10);
				y = parseInt(y, 10);
				
				if (oldSelect !== null) {

					if (selSelfDraw === true) {
						if (me.selectClearFull === false) {
							me.clearBackground(oldSelect);
						} else {
							me.clearBackground();
						}

					} else {
						if (me.selectClearFull === false) {
							me.clearBackground(oldSelect[0], oldSelect[1], oldSelect[2], 1); /// top
							me.clearBackground(oldSelect[0], oldSelect[1], 1, oldSelect[3]); /// left
							me.clearBackground(oldSelect[0] + oldSelect[2], oldSelect[1], 1, oldSelect[3]); /// right
							me.clearBackground(oldSelect[0], oldSelect[1] + oldSelect[3], oldSelect[2], 1); /// bottom
						} else {
							me.clearBackground();
						}
					}
				}

				me.prevX = x;
				me.prevY = y;
			
				oldSelect = me.getRect(parseInt(me.firstX, 10), parseInt(me.firstY, 10),
										parseInt(x, 10), parseInt(y, 10), false);
				
				if (typeof me.onselect === 'function') {

					ee = {	x: oldSelect[0],
							y: oldSelect[1],
							width: oldSelect[2],
							height: oldSelect[3],
							mouseX: x,
							mouseY: y,
							selfDraw: false,
							cancelSelection: false,
							timeStamp: getStamp(),
							originalEvent: e
							}
	
					me.onselect(ee);

					selSelfDraw = ee.selfDraw;

					if (ee.cancelSelection === true) {
						endSelection(true, e);
						me.isDown = false;
						return;
					}
				}

				if (selSelfDraw === false) {
					me.setDash(0, 0, true);	
					me.ctx.strokeStyle = '#000';
					me.ctx.strokeRect(oldSelect[0] + 0.5, oldSelect[1] + 0.5, oldSelect[2], oldSelect[3]);

					me.setDash(5, selOffset++, true);	
					me.ctx.strokeStyle = '#fff';
					me.ctx.strokeRect(oldSelect[0] + 0.5, oldSelect[1] + 0.5, oldSelect[2], oldSelect[3]);

				} else {
					clearInterval(selTimer);
				}
				
				return;
			}

			/// pan mode?
			if (mel.panMode === false) {
			
				mel.count++;
	
				ee = {	x: x - transX,
						y: y - transY,
						relativeX: coords[2],
						relativeY: coords[3],
						timeStamp: e.timeStamp,
						originalEvent: e,
						isMouseDown: mel.isDown,
						count: mel.count
						}

				if (mel.calcAngle === true) {
					a = getAngle(mel.prevX, mel.prevY, x, y);
					ee.angle = a;
					ee.relativeAngle = 180 - Math.abs(Math.abs(mel.prevAngle - a) - 180);
					ee.firstAngle = getAngle(mel.firstX, mel.firstY, x, y);
					mel.prevAngle = a
				}

				if (mel.calcDistance === true || mel.calcVelocity === true) {
					ee.distance = getDist(mel.prevX, mel.prevY, x, y);
					ee.firstDistance = getDist(mel.firstX, mel.firstY, x, y);
					ee.totalDistance = (mel.total += ee.distance);
				}
	
				if (mel.calcVelocity === true) {

					clearTimeout(vTimer);

					v = getVelocity(mel.prevStamp, ee.timeStamp, ee.distance);
					ee.velocity = v;
					if (v > mel.maxVel) mel.maxVel = v;
					vels.push(v);

					vTimer = setTimeout(function() {vels = []}, 52);
				}
	
				x -= transX;
				y -= transY;

				if (mel.autoClear === true) {

					if (mel.trackMove === true && autoBuff === null)
						initAutoClear();

					if (oldAuto !== null)
						me.clearBackground(oldAuto);

					oldAuto = mel.getRect(mel.firstX, mel.firstY, x, y, false);
				}
				
				if (record === true && mel.isDown === true && tool !== 1) {
					stroke.push(x);
					stroke.push(y);
				}

				if (isMouseMove === true || typeof me.onmousemove === 'function')
					mel.onmousemove(ee);

			} else {

				dx = x - mel.prevX;
				dy = y - mel.prevY;

				if (typeof me.onbeforepan === 'function')
					me.onbeforepan({oldDeltaX: transX,
									oldDeltaY: transY,
									newDeltaX: (transX + dx),
									newDeltaY: (transY + dy),
									isAbsolute: false, 
									timeStamp: getStamp()});

				otx = transX;
				oty = transY;
			
				transX += dx;
				transY += dy;

				setTransform();

				if (typeof me.onpan === 'function')
					me.onpan({oldDeltaX: otx, oldDeltaY: oty, newDeltaX: transX, newDeltaY: transY, isAbsolute: false, timeStamp: getStamp()});
			}
			
			mel.prevStamp = e.timeStamp;
			mel.prevX = x;
			mel.prevY = y;
			
		} else {
			
			if (mel.enableRegions === true && typeof mel.onregionover === 'function' && me.selectionMode === false) {
				
				coords = calcCoords(e.clientX, e.clientY);
				x = coords[0];
				y = coords[1];
				
				if (currentRegion !== null &&
					x >= currentRegion.x && x <= currentRegion.right &&
					y >= currentRegion.y && y <= currentRegion.bottom)
					return;
					
				currentRegion = me.testRegion(x, y);

				me.style('cursor', 'default');

				if (currentRegion !== null) {
					me.style('cursor', currentRegion.cursor);
					me.onregionover({region: currentRegion, timeStamp: e.timeStamp, x: x, y: y});
				}
			}
		}
		return false;
	}

	/// handle global mouse up events
	function _mouseup(e) {

		e = e || window.event;
		if (e.preventDefault) e.preventDefault();

		var	coords = calcCoords(e.clientX, e.clientY),
			x = coords[0],
			y = coords[1],
			tr, ee;

		if (me.isDown === true) {

			me.isDown = false;

			if (me.selectionMode === true) {
				endSelection(false, e);
				return;
			}

			ee = {
				x: x - transX,
				y: y -transY,
				count: me.count,
				relativeX: coords[2],
				relativeY: coords[3],
				timeStamp: e.timeStamp,
				originalEvent: e
			}
			
			if (me.calcAngle === true) {
				ee.lastAngle = me.prevAngle;
				ee.totalAngle = ee.firstAngle = getAngle(me.firstX, me.firstY, x, y);
			}

			if (me.calcDistance === true) {
				ee.totalDistance = me.total;
				ee.firstDistance = getDist(me.firstX, me.firstY, x, y);
			}

			if (me.calcVelocity === true) {
				clearTimeout(vTimer);
				ee.maxVelocity = me.maxVel;
			}

			if (me.panMode === false) {
				x -= transX;
				y -= transY;
			}

			if (me.autoClear === true) {
				autoBuff = null;
			}

			/// is recording?			
			if (record === true) {
				if (me.strokeHeader !== null)
					stroke.splice(1, 0, me.strokeHeader);
				me.strokes.push(stroke);
			}

			if (me.enableRegions === true && typeof me.onregion === 'function') {
				tr = me.testRegion(x, y);
				if (currentRegion !== null && tr !== null && currentRegion.id === tr.id)
					me.onregion({region: currentRegion, timeStamp: e.timeStamp, x: x, y: y});
			}

			if (typeof me.onmouseup === 'function')
				me.onmouseup(ee);
		}
	}

	function _mouseWheel(e) {

		if (typeof me.onmousewheel === 'function') {

			e = e || window.event;

			var coords = calcCoords(e.clientX, e.clientY),
				x = coords[0],
				y = coords[1];
			
			me.onmousewheel({
				x: x - transX,
				y: y - transY,
				relativeX: coords[2],
				relativeY: coords[3],	
				delta: parseInt((e.detail ? e.detail * -40 : e.wheelDelta) / 120, 10),
				timeStamp: e.timeStamp,
				originalEvent: e
			});

			if (typeof e.preventDefault === 'undefined') {
				return false;	
			} else {
				e.preventDefault()	
			}
		}

	}

	/// common error handler
	function _error(msg, src) {
		
		if (arguments.length === 3)
			alert('Error calling "' + src + '": ' + msg);

		if (typeof me.onerror === 'function') {
			var e = {};
			e.message = msg;
			e.source = src;
			e.timeStamp = getStamp();
			
			me.onerror(e);
		} else {
			throw 'Error calling "' + src + '": ' + msg;
		}
		return false;
	}

	/**
	 *	Observer to act on various property changes
	*/
	function observer(recs) {
		recs.forEach(_checkRange);	
	}

	function _checkRange(o) {
		
		switch(o.name) {
			
			case 'limitPan':			
				setTransform();
				return;

			case 'panMode':
				setCursor();
				return;
		}
	}
	
	/**
	 *	Init-poll so we can call onredraw the first time (async)
	*/	
	function _init() {
		if (me.onredraw === null) {
			_initCnt--
			if (_initCnt > 0) setTimeout(_init, 10);
		} else {
			me.clear();
			me.onredraw(false);
		}
	}
	_init();

	if (Object.observe !== undefined) {
		Object.observe(this, observer);
		isObserving = true;
	}

	/// the easyCanvas object at your service
	return this;
}

window.requestAnimationFrame = (function(){
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
	function(cb){window.setTimeout(cb, 16)};
})();

/// insane but needed..
HTMLCanvasElement.prototype.requestFullScreen = 
HTMLCanvasElement.prototype.requestFullScreen ||
HTMLCanvasElement.prototype.webkitRequestFullScreen ||
HTMLCanvasElement.prototype.webkitRequestFullscreen ||
HTMLCanvasElement.prototype.mozRequestFullScreen ||
HTMLCanvasElement.prototype.oRequestFullScreen ||
HTMLCanvasElement.prototype.msRequestFullScreen;

document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.webkitCancelFullscreen || document.mozCancelFullScreen || document.oCancelFullScreen || document.msCancelFullScreen;
