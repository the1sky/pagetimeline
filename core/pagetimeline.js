/**
 * Created by nant on 2014/7/9.
 */

var EXIT_SUCCESS = 0;
var VERSION = require('../package').version;

var pagetimeline = function(params){
	var path = require('path');
	this.params = params;

	this.homedir =  params.homedir;
	this.resultDir = params.resultDir;

	this.format = params.format;
	this.url = params.url;
	this.viewport = params.viewport;
	this.verboseMode = params.verbose === true;
	this.silentMode = params.silent === true;
	this.timeout = params.timeout;
	this.modules = params.modules;
	this.skipModules = params.skipModules;
	this.specialModules = params.specialModules;

	this.model = {};
	this.model.url = this.url;
	this.model.originalUrl = this.url;
	this.model.maxstep = this.params.reloadCount;
	this.model.afteronload = false;
	this.model.domreadyTimeout = 20000 + this.timeout * 2;
	this.model.uid = params.uid;

	this.programTimeout = this.model.domreadyTimeout * 2;

	this.coreModules = [];
	this.pageModule = null;

	// setup the stuff
	this.emitter = new (this.require('events').EventEmitter)();
	this.emitter.setMaxListeners(200);

	this.util = this.require('util');

	// setup logger
	var Logger = require('./logger'),
		logFile = params.log || '';
	this.logger = new Logger(logFile, {
		beVerbose: this.verboseMode,
		beSilent: this.silentMode
	});

	//log pagetimeline homedir
	this.log('pagetimeline v' + VERSION + ' installed in ' + this.homedir);

	// report config file being used
	if (params.config) {
		this.log('Using JSON config file: ' + params.config);
	}else if (params.config === false) {
		this.log('Failed parsing JSON config file');
	}

	// set up results wrapper
	var Results = require('./results');
	this.results = new Results();
	this.results.setGenerator('pagetimeline v' + VERSION);
	this.results.setUrl(this.url);
	this.results.setAsserts(this.params.asserts);

	// allow asserts to be provided via command-line options (#128)
	Object.keys(this.params).forEach(function(param) {
		var value = parseFloat(this.params[param]);
		if (!isNaN(value) && param.indexOf('assert-') === 0) {
			var name = param.substr(7);
			if (name.length > 0) {
				this.results.setAssert(name, value);
			}
		}
	}, this);
}

pagetimeline.prototype = {
	// emit given event
	emit: function(/* eventName, arg1, arg2, ... */) {
		this.log('Event ' + arguments[0] + ' emitted');
		this.emitter.emit.apply(this.emitter, arguments);
	},

	// bind to a given event
	on: function(ev, fn) {
		this.emitter.on(ev, fn);
	},

	once: function(ev, fn) {
		this.emitter.once(ev, fn);
	},
	getPublicWrapper: function() {
		return {
			url: this.params.url,
			homedir:this.homedir,
			model:this.model,
			getParam: (function(key) {
				return this.params[key];
			}).bind(this),

			// events
			on: this.on.bind(this),
			once: this.once.bind(this),
			emit: this.emit.bind(this),

			// metrics
			setMetric: this.setMetric.bind(this),
			incrMetric: this.incrMetric.bind(this),
			getMetric: this.getMetric.bind(this),

			// offenders
			addOffender: this.addOffender.bind(this),

			// debug
			addNotice: this.addNotice.bind(this),
			log: this.log.bind(this),
			echo: this.echo.bind(this)
		};
	},
	run:function(runstep,callback){
		this.model.runstep = runstep;
		this.callback = callback;
		var self = this;
		var async = require('async');

		self.timeoutId = setTimeout( function(){
			clearTimeout( self.timeoutId );
			self.emit( 'timeout',{code:2,msg:'program timeout:' + self.programTimeout } );
		}, self.programTimeout );

		if( runstep == 1 ){
			this.log('start first time analysis...');
			this.addCoreModules();
			this.addModules();
		}else{
			this.clearAllMetrics();
			this.log('start second time analysis...');
		}

		async.series(self.coreModules,function(err,res){
			if( err ){
				callback(true,{message:'run core module fail!',detail:res});
				self.clearTimeout();
				return;
			}
			async.parallel( self.modules,function(err,res){
				if( err ){
					callback(true,{message:'run module fail!',detail:res});
					self.clearTimeout();
					return;
				}
				self.pageModule(self.getPublicWrapper(),function(err,res){
					self.clearTimeout();
					if( err ){
						callback(true,{message:'run openPage fail!',detail:res});
					}else{
						self.report();
						callback(false,{message:'all done!'});
					}
					return;
				})
			});
		});
	},

	clearTimeout:function(){
		clearTimeout( this.timeoutId );
	},

	addCoreModules:function(){
		this.log('add core module...');
		var getModulePath = this.getModulePath;
		var async = require('async');
		this.coreModules.push( async.apply( require( getModulePath('connectserver') ).module, this.getPublicWrapper() ) );
		this.coreModules.push( async.apply( require( getModulePath('enable') ).module, this.getPublicWrapper() ) );
		this.coreModules.push( async.apply( require( getModulePath('timeline') ).module, this.getPublicWrapper() ) );
		this.pageModule = require( getModulePath('page') ).module;
	},
	getModulePath:function(name){
		return './modules/' + name + '/' + name;
	},
	listModules: function() {
		this.log('Getting the list of all modules...');

		var modules = [];
		var self = this;
		var fs = require('fs');
		var path = require('path');
		var modulesDir = path.resolve( this.homedir,'./modules/base');
		var ls = fs.readdirSync(modulesDir) || [];
		ls.forEach(function(entry) {
			if (self.skipModules.indexOf(entry) > -1) {
				self.log('Module ' + entry + ' skipped!');
				return;
			}
			if (fs.lstatSync(modulesDir + '/' + entry + '/' + entry + '.js' ).isFile) {
				modules.push(path.resolve( modulesDir, entry , entry ) );
			}
		});
		var specialModulesDir = path.resolve( this.homedir, './modules/special' );
		this.specialModules.forEach(function(entry){
			modules.push(path.resolve( specialModulesDir, entry , entry ) );
		});
		return modules;
	},
	addModules:function(){
		this.log('add all modules...');
		var modules = [];
		var path = require('path');
		if( this.modules.length > 0 ){
			var modulesDir = path.resolve( this.homedir, './modules/base' );
			this.modules.forEach(function(entry){
				modules.push(path.resolve( modulesDir, entry , entry ) );
			});
		}else{
			modules = this.listModules();
		}
		var pkgs = [];
		var async = require('async');

		modules.forEach(function(modulePath) {
			var pkg;
			try {
				pkg = require(modulePath);
			}
			catch (e) {
				this.log('Unable to load module "' + modulePath + '"!');
				return;
			}
			if (pkg.skip) {
				this.log('Module ' + modulePath + ' skipped!');
				return;
			}
			pkgs.push( async.apply( pkg.module, this.getPublicWrapper() ) );
		}, this);
		this.modules = pkgs;
	},
	// require CommonJS module from lib/modules
	require: function(module) {
		return require('../libs/modules/' + module);
	},
	// called when all HTTP requests are completed
	report: function() {
		var time = Date.now() - this.model.startTime;
		this.log('pagetimeline run for <%s> completed in %d ms', this.url, time);

		this.results.setUrl(this.url);

		// count all metrics
		var metricsCount = this.results.getMetricsNames().length;

		this.log('Formatting results (' + this.format + ') with ' + metricsCount+ ' metric(s)...');

		// render results
		var Formatter = require('./formatter'),
			renderer = new Formatter(this.results, this.format);

		var renderResult = renderer.render();
		this.echo(renderResult);

		// asserts handling
		var failedAsserts = this.results.getFailedAsserts(),
			failedAssertsCnt = failedAsserts.length;

		if (failedAssertsCnt > 0) {
			this.log('Failed on %d assert(s) on the following metric(s): %s!', failedAssertsCnt, failedAsserts.join(', '));
			this.tearDown(failedAssertsCnt);
			return;
		}

		this.saveResult();

		this.log('Done!');
	},
	saveResult:function(){
		if( this.results ){
			var Formatter = require( './formatter' );
			var renderer = new Formatter( this.results, 'json' );
			var renderResult = renderer.render();
			this.emit( 'report',renderResult );
			if( this.resultDir ){
				var fs = require( 'fs' );
				var path = require( 'path' );
				var timestamp = +new Date();
				var fileName = path.resolve( this.resultDir, encodeURIComponent( this.url ) + '-' + timestamp + '.json' );
				if( !fs.existsSync( this.resultDir ) ){
					fs.mkdirSync( this.resultDir );
				}
				fs.writeFileSync( fileName, renderResult );
			}
		}
	},
	tearDown: function(exitCode) {
		exitCode = exitCode || EXIT_SUCCESS;
		if (exitCode > 0) {
			this.log('Exiting with code #' + exitCode + '!');
		}
		this.callback( true, {message:exitCode});
	},
	// metrics reporting
	setMetric: function(name, value) {
		value = typeof value === 'string' ? value : (value || 0); // set to zero if undefined / null is provided
		this.results.setMetric(name, value);
	},

	// increements given metric by given number (default is one)
	incrMetric: function(name, incr /* =1 */) {
		var currVal = this.getMetric(name) || 0;

		this.setMetric(name, currVal + (incr || 1));
	},

	getMetric: function(name) {
		return this.results.getMetric(name);
	},

	addOffender: function(metricName, msg) {
		this.results.addOffender(metricName, msg);
	},

	// adds a notice that will be emitted after results
	// supports phantomas.addNotice('foo: <%s>', url);
	addNotice: function() {
		this.results.addNotice(this.util.format.apply(this, arguments));
	},

	// add log message
	// will be printed out only when --verbose
	// supports phantomas.log('foo: <%s>', url);
	log: function() {
		this.logger.log(this.util.format.apply(this, arguments));
	},

	clearAllMetrics:function(){
		this.results.clear();
	},

	// console.log wrapper obeying --silent mode
	echo: function(msg) {
		this.logger.echo(msg);
	}
}

pagetimeline.version = VERSION;
module.exports = pagetimeline;

