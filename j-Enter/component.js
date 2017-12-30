COMPONENT('enter', 'validate:true', function(self, config) {
	self.readonly();
	self.make = function() {
		self.event('keydown', 'input', function(e) {
			if (e.which === 13 && (!config.validate || MAIN.can(self.path)))
				EXEC(config.exec, self);
		});
	};
});