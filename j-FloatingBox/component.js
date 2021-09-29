COMPONENT('floatingbox', 'zindex:10', function(self, config, cls) {

	var clsvisible = 'floatingbox-visible';
	var is = false;
	var open = [];

	var makepath = function(val, scope) {
		return val.replace(/\?/g, scope);
	};

	self.readonly();
	self.singleton();

	self.make = function() {

		var e_click = function(e) {
			if (e.target === self.dom)
				self.hide();
		};

		var e_resize = function() {
			is && self.hide(true);
		};

		self.bindedevents = false;

		self.bindevents = function() {
			if (!self.bindedevents) {
				$(document).on('click', e_click);
				$(W).on('resize', e_resize);
				self.bindedevents = true;
			}
		};

		self.unbindevents = function() {
			if (self.bindedevents) {
				self.bindedevents = false;
				$(document).off('click', e_click);
				$(W).off('resize', e_resize);
			}
		};

		var fn = function() {
			is && self.hide(true);
		};

		self.css('z-index', config.zindex);
		self.on('reflow + resize + resize2', fn);
		$(W).on('scroll', fn);
	};

	var animate = function(el) {
		el.aclass(clsvisible);
	};

	self.show = function(opt) {

		// opt.id
		// opt.element
		// opt.offsetX     --> offsetX
		// opt.offsetY     --> offsetY
		// opt.placeholder
		// opt.render
		// opt.custom
		// opt.minwidth
		// opt.maxwidth
		// opt.classname
		// opt.height
		// opt.scope;

		opt.box = $('.floatingbox[data-id="{0}"]'.format(opt.id));

		if (!opt.box.length) {
			setTimeout(self.show, 500, opt);
			return;
		}

		opt.config = (opt.box.attrd('config') || '').parseConfig();

		if (opt.config.scope)
			opt.scope = opt.config.scope;
		else if (opt.config.path)
			opt.path = opt.config.path;

		opt.initialized = 1;

		if (!opt.box[0].$processed) {
			opt.initialized = 0;
			opt.box[0].$processed = true;
			self.dom.appendChild(opt.box[0]);
			opt.box.rclass('invisible hidden');
		}

		var element = opt.element ? $(opt.element) : null;
		setTimeout(self.bindevents, 500);

		var w = opt.box.width();
		var offset = element ? element.offset() : null;
		var width = w + (opt.offsetWidth || 0);
		var options = { left: opt.x || 0, top: top.y || 0 };

		if (opt.minwidth && width < opt.minwidth) {
			width = opt.minwidth;
			options.width = width;
		} else if (opt.maxwidth && width > opt.maxwidth) {
			width = opt.maxwidth;
			options.width = width;
		}

		if (element) {
			switch (opt.align) {
				case 'center':
					options.left = Math.ceil((offset.left - width / 2) + (opt.element.innerWidth() / 2));
					break;
				case 'right':
					options.left = (offset.left - width) + opt.element.innerWidth();
					break;
				default:
					options.left = offset.left;
					break;
			}
			options.top = opt.position === 'bottom' ? ((offset.top - opt.box.height()) + element.height()) : offset.top;
		}

		if (opt.offsetX)
			options.left += opt.offsetX;

		if (opt.offsetY)
			options.top += opt.offsetY;

		var mw = width;
		var mh = opt.box.height();

		if (options.left < 0)
			options.left = 10;
		else if ((mw + options.left) > WW)
			options.left = (WW - mw) - 10;

		if (options.top < 0)
			options.top = 10;
		else if ((mh + options.top) > WH)
			options.top = (WH - mh) - 10;

		options['z-index'] = opt.config.zindex || (config.zindex + open.length + 1);
		opt.box.css(options);

		setTimeout(animate, 50, opt.box);

		if (!open.findItem('id', opt.id))
			open.push(opt);

		if (!opt.scope)
			opt.scope = opt.box.attrd('scope');

		opt.prevscope = M.scope();
		opt.scope && M.scope(opt.scope);
		self.aclass(cls + '-visible');

		opt.init && opt.init();

		if (!opt.initialized && opt.config.init)
			EXEC(makepath(opt.config.init, opt.scope), opt.box);

		opt.config.reload && EXEC(makepath(opt.config.reload, opt.scope), opt.box);
		is = true;
	};

	self.hide = function(all) {

		if (all) {
			var prevscope = '';
			for (var item of open) {
				item.box.rclass(clsvisible);
				item.hide && item.hide(item.box);
				item.config.hide && EXEC(makepath(item.config.hide, item.scope), item.box);
				if (item.prevscope)
					prevscope = item.prevscope;
			}
			open = [];
			self.rclass(cls + '-visible');
			self.unbindevents();
			prevscope && M.scope(prevscope);
			return;
		}

		var item = open.pop();
		if (item) {
			item.box.rclass(clsvisible);
			item.hide && item.hide(item.box);
			item.config.hide && EXEC(makepath(item.config.hide, item.scope), item.box);
			item.prevscope && M.scope(item.prevscope);
			if (!open.length) {
				self.rclass(cls + '-visible');
				self.unbindevents();
			}
		}
	};

});