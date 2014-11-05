// Canvas Infographic
(function() {
	// shim layer with setTimeout fallback
	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(callback) {
				window.setTimeout(callback, 1000 / 60);
			};
	})();

	var U = {
		extend: function(destination, source) {
			var source = source || {};
			for (var property in source) {
				if (source[property] && source[property].constructor && source[property].constructor === Object) {
					destination[property] = destination[property] || {};
					arguments.callee(destination[property], source[property]);
				} else {
					destination[property] = source[property];
				}
			}
			return destination;
		},
		idCounter: 0,
		each: function(list, handler, min, max) {
			var min = min || 0,
				max = max || list.length;
			for (var i = min; i < max; i++) {
				handler(list[i], i);
			};
		}
	};
	U.animationCurves = (function() {

		// Math
		var quad = function(p, e) {
				var exp = e || 2;
				return Math.pow(p, exp)
			},
			bow = function(p, e) {
				var exp = e || 1.5;
				return Math.pow(p, 2) * ((exp + 1) * p - exp);
			},
			elastic = function(p, e) {
				var exp = e || 1.5;
				return Math.pow(2, 10 * (p - 1)) * Math.cos(20 * Math.PI * exp / 3 * p);
			},
			inverse = function(delta, p, e) {
				return 1 - delta(1 - p, e);
			},
			inOut = function(delta, p, e) {
				if (p < .5) {
					return delta(2 * p, e) / 2;
				} else {
					return (2 - delta(2 * (1 - p), e)) / 2;
				}
			},

			// Formulas
			linear = function(p) {
				return p;
			},
			ease = function(p) {
				return inOut(quad, p, 2);
			},
			easeIn = function(p) {
				return quad(p, 2.3);
			},
			easeOut = function(p) {
				return inverse(quad, p, 2.3);
			},
			bounce = function(p, elast) {
				var elasticity = 4 / (elast || 1),
					resolution = 9,
					d = 1 - Math.pow(1 - p, elasticity) * Math.abs(Math.cos((p) * Math.PI * resolution * Math.pow(p, 1 / elasticity)));
				if (isNaN(d)) {
					d = p;
				}
				return d;
			};

		return {
			linear: linear,
			ease: ease,
			easeIn: easeIn,
			easeOut: easeOut,
			bounce: bounce
		};
	})();

	var shapes = {
		// Compound Shapes		
		Rectangle: function(c, custom) {
			var o = U.extend({
				x: 0,
				y: 0,
				width: 100,
				height: 50,
				borderRadius: 0
			}, custom);

			var b = o.borderRadius;

			c.beginPath();
			if (b == 0) {
				c.rect(o.x, o.y, o.width, o.height);
			} else {
				c.moveTo(o.x + b, o.y);
				c.lineTo(o.x + o.width - b, o.y);
				c.quadraticCurveTo(o.x + o.width, o.y, o.x + o.width, o.y + b);
				c.lineTo(o.x + o.width, o.y + o.height - b);
				c.quadraticCurveTo(o.x + o.width, o.y + o.height, o.x + o.width - b, o.y + o.height);
				c.lineTo(o.x + b, o.y + o.height);
				c.quadraticCurveTo(o.x, o.y + o.height, o.x, o.y + o.height - b);
				c.lineTo(o.x, o.y + b);
				c.quadraticCurveTo(o.x, o.y, o.x + b, o.y);
			}
			c.closePath();
			c.fill();
			c.stroke();
		},
		Circle: function(c, custom) {
			var o = U.extend({
				x: 0,
				y: 0,
				radius: 20
			}, custom);
			c.beginPath();
			c.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
			c.closePath();
			c.fill();
			c.stroke();
		},
		Line: function(c, custom) {
			var o = U.extend({
				x: 0,
				y: 0,
				x1: 50,
				y1: 80,
			}, custom);

			c.beginPath();
			c.moveTo(o.x, o.y);
			c.lineTo(o.x1, o.y1);
			c.closePath();
			c.fill();
			c.stroke();
		},
		Text: function(c, custom) {
			var o = U.extend({
				text: 'Text sdfdsf sfd df sdf dsf sdffsdfsd asd',
				x: 0,
				y: 0,
				width: 200,
				lineHeight: c.lineHeight || 20
			}, custom);

			var words = o.text.split(' '),
				line = '',
				x = (c.textAlign == 'center') ? (o.x + o.width / 2) : ((c.textAlign == 'right') ? (o.x + o.width) : o.x);
			y = o.y;

			for (var i = 0; i < words.length; i++) {
				var testLine = line + words[i] + ' ',
					w = c.measureText(testLine).width;

				if (w > o.width && i > 0) {
					c.fillText(line, x, y);
					line = words[i] + ' ';
					y += o.lineHeight;
				} else {
					line = testLine;
				}
			}
			c.fillText(line, x, y);
		}
	}

	var sprite = function(options) {
		return this.init(options);
	};

	sprite.prototype = {
		type: 'sprite',
		init: function(options) {
			this.config = U.extend({
				id: 'sprite-' + U.idCounter++,
				draw: function() {},
				x: 0,
				y: 0,
				scale: 1,
				rotation: 0
			}, options);

			this.x = this.config.x;
			this.y = this.config.y;
			this.scale = this.config.scale;
			this.rotation = this.config.rotation;

			this.infog = null;
			this.parent = null;
			this.childs = [];
			this.length = 0;

			return this;
		},
		animate: function(props, duration, callback, curve) {
			var self = this,
				curve = curve || U.animationCurves['ease'],
				cb = callback || function() {},
				start = new Date,
				initStatus = {};

			for (var a in props) {
				initStatus[a] = self[a];
			};

			var timer = setInterval(function() {
				var progress = (new Date - start) / duration;
				if (progress > 1) {
					progress = 1;
				}

				var delta = curve(progress);

				for (var a in props) {
					self[a] = initStatus[a] + delta * (props[a] - initStatus[a]);
				}

				if (progress == 1) {
					cb.apply(self);
					clearInterval(timer);
				}
			}, 1000 / 30);
			return this;
		},
		render: function() {
			if (this.infog !== null) {
				this.infog.c.translate(this.x, this.y);
				this.infog.c.scale(this.scale, this.scale);
				this.infog.c.rotate(this.rotation);

				this.config.draw.apply(this, [this.infog.c]);
				U.each(this.childs, function(elem) {
					elem.render();
				});

				this.infog.c.rotate(-this.rotation);
				this.infog.c.scale(1 / this.scale, 1 / this.scale);
				this.infog.c.translate(-this.x, -this.y);
			}
			return this;
		},
		draw: function(handler) {
			this.config.draw = handler;
			return this;
		},
		append: function(spr) {
			if (spr.type === 'sprite') {
				var yet = false;
				U.each(this.childs, function(elem) {
					if (elem.config.id === spr.config.id) {
						yet = true;
					}
				});
				if (!yet) {
					// Detach spr first from all
					spr.remove();

					// append
					spr.infog = this.infog;
					spr.parent = this;
					this.childs.push(spr);
					this.length++;
				}
			}
			return this;
		},
		detach: function(spr) {
			var index = -1;
			U.each(this.childs, function(elem, i) {
				if (elem.config.id === spr.config.id) {
					index = i;
				}
			});
			if (index >= 0) {
				spr.infog = null;
				spr.parent = null;
				this.childs.splice(index, 1);
				this.length--;
			}
			return this;
		},
		appendTo: function(sprOrInfog) {
			sprOrInfog.append(this);
			return this;
		},
		remove: function() {
			if (this.parent !== null) {
				this.parent.detach(this);
			}
			return this;
		}
	};



	var infog = function(options) {
		return this.init(options);
	};

	infog.prototype = {
		type: 'infog',
		init: function(options) {
			this.config = U.extend({
				id: ''
			}, options);

			this.canvas = document.getElementById(this.config.id);
			this.c = this.canvas.getContext('2d');

			this.childs = [];
			this.length = 0;

			// LOOP
			var self = this,
				loop = function() {
					requestAnimFrame(loop);
					self.render();
				};
			loop();

			return this;
		},
		width: function() {
			return this.canvas.width;
		},
		height: function() {
			return this.canvas.height;
		},
		append: function(spr) {
			var yet = false;
			U.each(this.childs, function(elem) {
				if (elem.config.id === spr.config.id) {
					yet = true;
				}
			});
			if (!yet) {
				// Detach spr first from all
				spr.remove();

				// append
				spr.infog = this;
				spr.parent = this;
				this.childs.push(spr);
				this.length++;
			}

			return this;
		},
		detach: function(spr) {
			var index = -1;
			U.each(this.childs, function(elem, i) {
				if (elem.config.id === spr.config.id) {
					index = i;
				}
			});
			if (index >= 0) {
				spr.infog = null;
				spr.parent = null;
				this.childs.splice(index, 1);
				this.length--;
			}
			return this;
		},
		render: function() {
			this.c.setTransform(1, 0, 0, 1, 0, 0);
			this.c.clearRect(0, 0, this.width(), this.height());
			U.each(this.childs, function(elem) {
				elem.render();
			});
			return this;
		}
	};



	var Infographic = function(options) {
		return new infog(options);
	};
	Infographic.Shape = shapes;

	Infographic.Sprite = function(options) {
		return new sprite(options);
	};



	window.Infographic = window.IG = Infographic;
})();