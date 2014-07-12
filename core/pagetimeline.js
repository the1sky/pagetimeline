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

var pagetimeline = function(params,callback){
	// handle JSON config file provided via --config
	var path = require('path');

	// parse script CLI parameters
	this.params = params;

	this.homedir =  path.resolve(__dirname + './../' );

	this.core = {};

	this.url = this.params.url;

	this.format = params.format;

	this.viewport = params.viewport;

	this.verboseMode = params.verbose === true;

	this.silentMode = params.silent === true;

	this.timeout = params.timeout;;

	this.modules = params.modules;

	this.skipModules = params['skip-modules'];


	// setup cookies handling
	this.initCookies();

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

	// report version and installation directory
	if (typeof module.dirname !== 'undefined') {
		this.dir = module.dirname.replace(/core$/, '');
		this.log('pagetimeline v' + VERSION + ' installed in ' + this.dir);
	}

	// report config file being used
	if (params.config) {
		this.log('Using JSON config file: ' + params.config);
	}
	else if (params.config === false) {
		this.log('Failed parsing JSON config file');
		this.tearDown(EXIT_CONFIG_FAILED);
		return;
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

	this.start = +new Date();
	var self = this;
	this.runCoreModuleAsync(function(err,result){
		if( !err ){
			self.runModuleAsync(function(err, result){
				self.report();
				callback( err, result );
			})
		}else{
			callback( err, result );
		}
	})
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
			core:this.core,
			browser:this.browser,
			startTime:this.startTime,
			requests:this.requests,
			timelineRecords:this.timelineRecords,
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
	runCoreModuleAsync:function(callback){
		this.log('run core module...');
		var getModulePath = this.getModulePath;
		var moduleConnectServer = require( getModulePath('connectserver'));
		var moduleNetwork = require( getModulePath('network'));
		var moduleRuntime = require( getModulePath('runtime'));
		var moduleTimeline = require( getModulePath('timeline'));
		var modulePage = require( getModulePath('page'));
		var async = require('async');
		async.auto({
			connectserver:async.apply( moduleConnectServer.run, this.getPublicWrapper() ),
			network:['connectserver',async.apply( moduleNetwork.run, this.getPublicWrapper() )],
			runtime:['connectserver',async.apply( moduleRuntime.run, this.getPublicWrapper() )],
			timeline:['connectserver',async.apply( moduleTimeline.run, this.getPublicWrapper())],
			page:['network','runtime','timeline',async.apply( modulePage.run, this.getPublicWrapper())]
		},function(err,result){
			callback(err,result);
		})
	},
	runCoreModuleAsyncBak:function(callback){
		this.log('run core module...');
		var getModulePath = this.getModulePath;
		var moduleReady = require( getModulePath('readyrun'));
		var async = require('async');
		async.series([async.apply( moduleReady.module,this.getPublicWrapper() )],function(err,result){
			callback(err,result);
		})
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
	runModuleAsync:function(callback){
		this.log('run all modules...');
		var modules = (this.modules.length > 0) ? this.modules : this.listModules();
		var async = require('async');
		var pkgs = [];
		modules.forEach(function(name) {
			if (this.skipModules.indexOf(name) > -1) {
				this.log('Module ' + moduleName + ' skipped!');
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
			pkgs.push(async.apply( pkg.module, this.getPublicWrapper() ) );
		}, this);

		async.parallel( pkgs,function(err,result){
			callback(err,result);
		})
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
		this.emit('report');

		var time = Date.now() - this.start;
		this.log('pagetimeline run for <%s> completed in %d ms', this.url, time);

		this.results.setUrl(this.url);
		this.emit('results', this.results);

		// count all metrics
		var metricsCount = this.results.getMetricsNames().length;

		this.log('Formatting results (' + this.format + ') with ' + metricsCount+ ' metric(s)...');

		// render results
		var Formatter = require('./formatter'),
			renderer = new Formatter(this.results, this.format);

		this.echo(renderer.render());

		// handle timeouts (issue #129)
		if (this.timeout) {
			this.log('Timed out!');
			this.tearDown(EXIT_TIMED_OUT);
			return;
		}

		// asserts handling
		var failedAsserts = this.results.getFailedAsserts(),
			failedAssertsCnt = failedAsserts.length;

		if (failedAssertsCnt > 0) {
			this.log('Failed on %d assert(s) on the following metric(s): %s!', failedAssertsCnt, failedAsserts.join(', '));

			// exit code should equal number of failed assertions
			this.tearDown(failedAssertsCnt);
			return;
		}

		this.log('Done!');
		this.tearDown();
	},
	tearDown: function(exitCode) {
		exitCode = exitCode || EXIT_SUCCESS;

		if (exitCode > 0) {
			this.log('Exiting with code #' + exitCode + '!');
		}
		//process.exit()
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
