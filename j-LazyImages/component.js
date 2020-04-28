COMPONENT('lazyimages', 'type:position', function(self, config) {

	var is = null;
	var regtest = /[?.\/]/;
	var scrollcontainer;

	self.readonly();

	self.customscrollbar = function() {
		var area = self.closest('.ui-scrollbar-area');
		if (area.length) {
			is = true;
			area.on('scroll', self.refresh);
			scrollcontainer = area;
			setTimeout(self.refresh, 1000);
		} else
			setTimeout(self.customscrollbar, 500);
	};

	self.make = function() {
		if (config.customscrollbar) {
			self.customscrollbar();
		} else {
			is = true;
			scrollcontainer = $(W);
			scrollcontainer.on('scroll', self.refresh);
			setTimeout(self.refresh, 1000);
		}
	};

	self.refresh = function() {
		setTimeout2(self.id, self.prepare, 200);
	};

	self.released = self.refresh;
	self.setter = self.refresh;

	self.prepare = function() {
		var scroll = config.customscrollbar ? scrollcontainer[0].scrollTop : scrollcontainer.scrollTop();
		var beg = scroll;
		var end = beg + WH;
		var off = 50;
		var arr = self.dom.querySelectorAll('img[data-src]');
		for (var i = 0; i < arr.length; i++) {
			var t = arr[i];
			if (!t.$lazyload) {
				var src = t.getAttribute('data-src');
				if (src && regtest.test(src)) {

					var el = $(t);

					if (config.offsetter)
						el = el.closest(config.offsetter);

					var top = (is ? 0 : scroll) + (config.type === 'position' ? el.position() : el.offset()).top;

					if (config.customscrollbar)
						top += scroll;

					if ((top + off) >= beg && (top - off) <= end) {
						t.setAttribute('src', src);
						t.$lazyload = true;
						t.removeAttribute('data-src');
					}
				}
			}
		}
	};
});