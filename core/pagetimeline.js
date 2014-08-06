/**
 * Created by nant on 2014/7/9.
 */
// exit codes
var EXIT_SUCCESS = 0,
	EXIT_TIMED_OUT = 252,
	EXIT_CONFIG_FAILED = 253,
	EXIT_LOAD_FAILED = 254,
	EXIT_ERROR = 255

var VERSION = require('../package').version;

var pagetimeline = function(params){
	var path = require('path');

	this.params = params;

	this.homedir =  path.resolve(__dirname + './../' );

	this.model = {};

	this.url = this.params.url;
	this.model.url = this.url;

	this.format = params.format;

	this.viewport = params.viewport;

	this.verboseMode = params.verbose === true;

	this.silentMode = params.silent === true;

	this.timeout = params.timeout;;

	this.coreModules = [];
	this.pageModule = null;
	this.modules = params.modules;
	this.skipModules = params.skipModules;

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

	// queue of jobs that needs to be done before report can be generated
	var Queue = require('../libs/simple-queue');
	this.reportQueue = new Queue();

	// set up results wrapper
	var Results = require('./results');
	this.results = new Results();

	this.results.setGenerator('pagetimeline v' + VERSION);
	this.results.setUrl(this.url);
	this.results.setAsserts(this.params.asserts);

	// allow asserts to be provided via command-line options (#128)
	Object.keys(this.params).forEach(function(param) {
		var value = parseFloat(this.params[param]),
			name;
		if (!isNaN(value) && param.indexOf('assert-') === 0) {
			name = param.substr(7);

			if (name.length > 0) {
				this.results.setAssert(name, value);
			}
		}
	}, this);
}

pagetimeline.prototype = {
	// simple version of jQuery.proxy
	proxy: function(fn, scope) {
		scope = scope || this;
		return function () {
			return fn.apply(scope, arguments);
		};
	},

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

			// reports
			reportQueuePush: this.reportQueue.push.bind(this.reportQueue),

			// metrics
			setMetric: this.setMetric.bind(this),
			setMetricEvaluate: this.setMetricEvaluate.bind(this),
			setMetricFromScope: this.setMetricFromScope.bind(this),
			setMarkerMetric: this.setMarkerMetric.bind(this),
			getFromScope: this.getFromScope.bind(this),
			incrMetric: this.incrMetric.bind(this),
			getMetric: this.getMetric.bind(this),

			// offenders
			addOffender: this.addOffender.bind(this),

			// debug
			addNotice: this.addNotice.bind(this),
			log: this.log.bind(this),
			echo: this.echo.bind(this)

			// utils
			//runScript: this.runScript.bind(this)
		};
	},
	run:function(callback){
		this.addCoreModules();
		this.addModules();
		var self = this;
		var async = require('async');
		async.series(self.coreModules,function(err,res){
			if( !err ){
				async.parallel( self.modules,function(err,res){
					if( !err ){
						self.pageModule(self.getPublicWrapper(),function(err,res){
							if( !err ){
								self.report();
								callback(false,{message:'all done!'});
							}else{
								callback(true,{message:'run openPage fail!',detail:res});
							}
						})
					}else{
						callback(true,{message:'run module fail!',detail:res});
					}
				});
			}else{
				callback(true,{message:'run core module fail!',detail:res});
			}
		});


		//timeout and exit
		var timeout = 10000 + this.timeout * 2;
		setTimeout( function(){
			var msg = 'onload event not fired in ' +  timeout + 'ms.';
			self.log( msg );
			callback( true, {message:msg} );
		}, timeout );
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

		var fs = require('fs');
		var path = require('path');
		var modulesDir = path.resolve( module.dirname + '/../modules');
		var ls = fs.readdirSync(modulesDir) || [];
		var modules = [];

		ls.forEach(function(entry) {
			if (fs.lstatSync(modulesDir + '/' + entry + '/' + entry + '.js' ).isFile) {
				modules.push(entry);
			}
		});
		return modules;
	},
	addModules:function(){
		this.log('add all modules...');
		var modules = (this.modules.length > 0) ? this.modules : this.listModules();
		var pkgs = [];
		var async = require('async');

		modules.forEach(function(name) {
			if (this.skipModules.indexOf(name) > -1) {
				this.log('Module ' + name + ' skipped!');
				return;
			}
			var pkg;
			try {
				pkg = require('./../modules/' + name + '/' + name);
			}
			catch (e) {
				this.log('Unable to load module "' + name + '"!');
				return;
			}
			if (pkg.skip) {
				this.log('Module ' + name + ' skipped!');
				return;
			}
			pkgs.push( async.apply( pkg.module, this.getPublicWrapper() ) );
		}, this);
		this.modules = pkgs;
	},
	initCookies:function(){
		"use strict";
	},
	// require CommonJS module from lib/modules
	require: function(module) {
		return require('../libs/modules/' + module);
	},
	// called when all HTTP requests are completed
	report: function() {
		var time = Date.now() - this.start;
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

		this.log('Done!');
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

	setMetricEvaluate: function(name, fn) {
		this.setMetric(name, this.page.evaluate(fn));
	},

	setMarkerMetric: function(name) {
		var now = Date.now(),
			value = now - this.responseEndTime;

		if (typeof this.responseEndTime === 'undefined') {
			throw 'setMarkerMetric() called before responseEnd event!';
		}

		this.results.setMetric(name, value);
		return value;
	},

	// set metric from browser's scope that was set there using using window.__phantomas.set()
	setMetricFromScope: function(name, key) {
		key = key || name;

		// @ee https://github.com/ariya/phantomjs/wiki/API-Reference-WebPage#evaluatefunction-arg1-arg2--object
		this.setMetric(name, this.page.evaluate(function(key) {
			return window.__phantomas.get(key) || 0;
		}, key));
	},

	// get a value set using window.__phantomas browser scope
	getFromScope: function(key) {
		return this.page.evaluate(function(key) {
			return window.__phantomas.get(key);
		}, key);
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

	// console.log wrapper obeying --silent mode
	echo: function(msg) {
		this.logger.echo(msg);
	}
}

module.dirname = __dirname;
module.exports = pagetimeline;
