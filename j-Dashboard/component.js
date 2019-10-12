COMPONENT('dashboard', 'delay:200;axisX:12;axisY:144;padding:10', function(self, config) {

	var cls = 'ui-' + self.name;
	var cls2 = '.' + cls;
	var cache = {};
	var data = [];
	var services = [];
	var events = {};
	var skip = false;
	var drag = {};
	var movable = {};
	var serviceid;
	var pixel;

	self.make = function() {
		self.aclass(cls);
		$(W).on('resize', events.resize);
		self.on('resize', events.resize);
		$(document).on('mousedown touchstart', cls2 + '-title,' + cls2 + '-resize-button', events.ondown).on('dragstart', '[draggable]', drag.handler).on('touchstart', '[draggable]', drag.handler);

		self.event('mousedown touchstart', cls2 + '-control', function(e) {

			e.preventDefault();
			e.stopPropagation();

			var el = $(this);
			var name = el.attrd('name');
			var id = el.closest(cls2 + '-item').attrd('id');
			var tmp = cache[id];
			if (name === 'settings')
				tmp.meta.settings && tmp.meta.settings.call(tmp, tmp.element);
			else if (name === 'remove')
				self.wdestroy(id, true);
		});

		self.event('dragenter dragover dragexit drop dragleave', function(e) {
			switch (e.type) {
				case 'drop':
					drag.drop(e);
					break;
			}
			e.preventDefault();
		});

		serviceid = setInterval(events.service, 5000);
	};

	drag.touchmove = function(e) {
		var evt = e.touches[0];
		drag.lastX = evt.pageX;
		drag.lastY = evt.pageY;
	};

	drag.touchend = function(e) {

		e.target = document.elementFromPoint(drag.lastX, drag.lastY);
		drag.unbind();

		if (e.target !== self.dom) {
			var parent = e.target.parentNode;
			var is = false;
			while (true) {

				if (parent === self.dom) {
					is = true;
					e.target = parent;
					break;
				}

				parent = parent.parentNode;
				if (!parent || parent.tagName === 'BODY' || parent.tagName === 'HTML')
					break;
			}
			if (!is)
				return;
		}

		if (e.target) {
			var pos = self.op.position();
			e.pageX = drag.lastX;
			e.pageY = drag.lastY;
			e.offsetX = e.pageX - pos.left;
			e.offsetY = e.pageY - pos.top;
			drag.drop(e);
		}
	};

	drag.bind = function() {
		$(document).on('touchmove', drag.touchmove);
		$(document).on('touchend', drag.touchend);
	};

	drag.unbind = function() {
		$(document).off('touchmove', drag.touchmove);
		$(document).off('touchend', drag.touchend);
	};

	drag.handler = function(e) {
		drag.el = $(e.target);
		e.touches && drag.bind();
		var dt = e.originalEvent.dataTransfer;
		dt && dt.setData('text', '1');
	};

	drag.drop = function(e) {
		var meta = {};
		meta.pageX = e.pageX;
		meta.pageY = e.pageY;
		meta.offsetX = e.offsetX;
		meta.offsetY = e.offsetY;
		meta.el = drag.el;
		meta.target = $(e.target);
		meta.x = (meta.offsetX / pixel) >> 0;
		meta.y = (meta.offsetY / pixel) >> 0;
		meta.d = WIDTH();
		config.ondrop && EXEC(config.ondrop, meta, self);
	};

	events.service = function() {
		for (var i = 0; i < services.length; i++) {
			var tmp = services[i];
			if (tmp.$service)
				tmp.$service++;
			else
				tmp.$service = 1;
			tmp.meta.service && tmp.meta.service.call(tmp, tmp.$service);
		}
	};

	events.resize = function() {
		self.resize2();
	};

	events.bind = function(is) {

		if (events.is === is)
			return;

		var en = 'dragenter dragover dragexit drop dragleave dragstart';
		var el = $(document);
		if (is) {
			el.on(en, events.ondrag);
			el.on('mouseup touchend', events.onup);
			el.on('mousemove touchmove', events.onmove);
		} else {
			el.off(en, events.drag);
			el.off('mouseup touchend', events.onup);
			el.off('mousemove touchmove', events.onmove);
		}

		events.is = is;
	};

	events.ondown = function(e) {

		var el = $(this);
		movable.type = el.hclass(cls + '-title') ? 1 : 2;
		el = el.closest(cls2 + '-item');
		movable.id = el.attrd('id');

		var tmp = cache[movable.id];

		if (movable.type === 2) {
			if (!tmp.meta.actions.resize)
				return;
		} else {
			if (!tmp.meta.actions.move)
				return;
		}

		movable.istouch = e.type === 'touchstart';

		if (movable.istouch) {
			e = e.touches[0];
		} else {
			e.stopPropagation();
			e.preventDefault();
		}

		movable.is = true;
		movable.el = el;
		movable.ticks = Date.now();
		movable.pageX = e.pageX;
		movable.pageY = e.pageY;
		movable.changed = false;
		movable.x = movable.type === 1 ? tmp.offset.x : tmp.offset.width;
		movable.y = movable.type === 1 ? tmp.offset.y : tmp.offset.height;
		events.bind(true);
		el.aclass(cls + '-selected');
	};

	events.onup = function() {
		movable.el.rclass(cls + '-selected');
		movable.is = false;
		events.bind();
		self.resize_container();
		movable.changed && self.modified();
	};

	events.onmove = function(e) {

		if (!movable.is)
			return;

		if (movable.istouch)
			e = e.touches[0];

		var obj = cache[movable.id];
		var diffX = e.pageX - movable.pageX;
		var diffY = e.pageY - movable.pageY;

		movable.changed = true;

		diffX = diffX / pixel >> 0;
		diffY = diffY / pixel >> 0;

		// RESIZE
		if (movable.type === 2) {

			diffX = movable.x + diffX;
			diffY = movable.y + diffY;

			if (diffX <= 0)
				diffX = 1;

			if (diffY <= 0)
				diffY = 1;

			var tmp = diffX + obj.offset.x;
			if (tmp >= config.axisX) {
				tmp = tmp - (tmp - config.axisX) - obj.offset.x;
				diffX = tmp;
			}

			tmp = diffY + obj.offset.y;
			if (tmp >= config.axisY) {
				tmp = tmp - (tmp - config.axisY) - obj.offset.y;
				diffY = tmp;
			}

			obj.offset.width = diffX;
			obj.offset.height = diffY;

			self.woffset(movable.id);
			return;
		}

		diffX = movable.x + diffX;
		diffY = movable.y + diffY;

		if (diffX < 0)
			diffX = 0;

		if (diffY < 0)
			diffY = 0;

		var maxX = diffX + obj.offset.width;
		var maxY = diffY + obj.offset.height;

		if (maxX > config.axisX)
			diffX = config.axisX - obj.offset.width;

		if (maxY > config.axisY)
			diffY = config.axisY - obj.offset.height;

		obj.offset.x = diffX;
		obj.offset.y = diffY;

		self.woffset(movable.id);
	};

	self.destroy = function() {
		$(document).off('dragstart', '[draggable]', drag.handler);
		$(document).off('touchstart', '[draggable]', drag.handler);
		$(document).off('mousedown touchstart', cls2 + '-title,' + cls2 + '-resize-button', events.down);
		$(W).off('resize', events.resize);
		events.bind();
		clearInterval(serviceid);
	};

	self.resize_container = function() {
		var keys = Object.keys(cache);
		var max = 0;
		for (var i = 0; i < keys.length; i++) {
			var item = cache[keys[i]];
			var y = (+item.element.css('top').replace('px', '')) + (+item.element.css('height').replace('px', ''));
			max = Math.max(y, max);
		}
		self.css('height', max + 20);
	};

	self.resize_pixel = function() {
		var width = self.element.width() - (config.padding * 2);
		pixel = (width / config.axisX).floor(3);
	};

	self.resize = function() {
		self.resize_pixel();
		var keys = Object.keys(cache);
		for (var i = 0; i < keys.length; i++)
			self.woffset(keys[i]);
		self.resize_container();
	};

	self.resize2 = function() {
		setTimeout2(self.ID + 'resize', self.resize, 500);
	};

	self.wsize = function(d, offset) {

		var tmp = offset[d];
		if (!tmp) {
			if (d === 'xs')
				d = 'sm';
			tmp = offset[d];
			if (!tmp) {
				d = 'md';
				tmp = offset[d];
				if (!tmp) {
					d = 'lg';
					tmp = offset[d];
				}
			}
		}

		if (!tmp)
			tmp = { x: 0, y: 0, width: 3, height: 3 };

		return tmp;
	};

	self.modified = function() {
		skip = true;
		self.change(true);
		self.update(true);
	};

	self.wdestroy = function(id, bind) {
		var obj = cache[id];
		if (obj) {
			var el = obj.element;
			obj.meta.destroy && obj.meta.destroy.call(obj, el);
			el.find('*').off();
			el.off();
			el.remove();
			var index;
			if (bind) {
				var model = self.get();
				index = model.indexOf(obj.meta);
				if (index !== -1) {
					model.splice(index, 1);
					self.modified();
				}
			}
			index = services.indexOf(obj);
			if (index !== -1)
				services.splice(index, 1);
			index = data.indexOf(obj);
			if (index !== -1)
				data.splice(index, 1);
		}
	};

	var resizewidget = function(obj) {
		obj.meta.resize.call(obj, obj.element);
	};

	self.woffset = function(id, init) {
		var d = WIDTH();
		var obj = cache[id];
		var tmp = self.wsize(d, obj.meta.offset);
		obj.offset = tmp;
		var x = tmp.x * pixel + config.padding;
		var y = tmp.y * pixel + config.padding;
		var w = tmp.width * pixel;
		var h = tmp.height * pixel;

		obj.element.css({ left: x, top: y, width: w, height: h });

		var figure = obj.element.find('figure');
		var title = obj.element.find(cls2 + '-title').height() || 0;
		var prevw = obj.width;
		var prevh = obj.height;

		obj.height = h - title - config.padding * 2;
		obj.width = figure.width();
		figure.css({ height: obj.height });

		if (obj.meta.resize) {
			if (init)
				obj.meta.resize.call(obj, obj.element);
			else if (prevw !== obj.width && prevh !== obj.height)
				setTimeout2(self.ID + 'resizeitem', resizewidget, 200, null, obj);
		}
	};

	self.send = function(type, body) {
		for (var i = 0; i < data.length; i++)
			data[i].meta.data(type, body);
	};

	self.wupd = function(id) {
		var obj = cache[id];
		var meta = obj.meta;
		var el = obj.element;
		el.tclass(cls + '-header', meta.header !== false);
		el.tclass(cls + '-canremove', meta.actions.remove !== false);
		el.tclass(cls + '-canresize', meta.actions.resize !== false);
		el.tclass(cls + '-cansettings', meta.actions.settings !== false);
		self.woffset(id);
	};

	var winit = function(el) {
		el.rclass('invisible');
	};

	self.wadd = function(obj) {

		if (!obj.html)
			obj.html = '&nbsp;';

		var classname = [cls + '-item'];

		if (obj.actions.resize !== false)
			classname.push(cls + '-canresize');

		if (obj.actions.remove !== false)
			classname.push(cls + '-canremove');

		if (obj.actions.settings !== false)
			classname.push(cls + '-cansettings');

		if (obj.header !== false)
			classname.push(cls + '-header');

		var el = $(('<div class="{1} invisible" data-id="{2}"><div class="{0}-body" style="margin:{5}px"><div class="{0}-title">{4}</div><figure>{3}</figure><span class="{0}-resize-button"></span></div></div>').format(cls, classname.join(' '), obj.id, obj.html, '<span class="fa fa-trash-o ui-dashboard-control" data-name="remove"></span><span class="fa fa-cog ui-dashboard-control" data-name="settings"></span>' + obj.title, config.padding));
		self.dom.appendChild(el[0]);
		var tmp = cache[obj.id] = {};
		tmp.element = el;
		tmp.meta = obj;
		tmp.main = self;
		self.woffset(obj.id, true);
		tmp.meta.make && tmp.meta.make.call(tmp, el);
		el[0].$dashboard = tmp;
		obj.html.COMPILABLE() && COMPILE();
		tmp.meta.service && services.push(tmp);
		tmp.meta.data && data.push(tmp);
		setTimeout(winit, config.delay, el);
	};

	self.setter = function(value) {

		if (skip) {
			skip = false;
			return;
		}

		if (!value)
			value = EMPTYARRAY;

		self.resize_pixel();
		services = [];

		var keys = Object.keys(cache);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (!value.findItem('id', key)) {
				self.wdestroy(key);
				delete cache[key];
			}
		}

		for (var i = 0; i < value.length; i++) {
			var obj = value[i];
			if (cache[obj.id]) {
				if (cache[obj.id].meta === obj) {
					self.wupd(obj.id);
					obj.meta.services && services.push(obj);
					obj.meta.data && data.push(obj);
					continue;
				} else
					self.wdestroy(obj.id);
			}
			self.wadd(obj);
		}

		self.resize_container();
	};

});