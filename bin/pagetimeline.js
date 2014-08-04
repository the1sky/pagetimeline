#!/usr/bin/env node
/**
 * process:
 * 1、receive parms
 * 2、start browser with remote-debugging-protocol
 * 3、analyze performance
 * 4、close browser and exit
 *
 * Created by nant on 2014/7/4.
 */

var async = require('async');
var stdin = process.stdin;
var stdout = process.stdout;
var stderr = process.stderr;
var browserScript = require('./../libs/browserScript.js');
var bs = null;
var fs = require('fs');
var path = require('path');
var jsonConfig;
var params = require('commander');

params
	.version('0.0.1')
	.option('--url [value]','target url, e.g. --url=http://www.baidu.com' )
	.option('--server [value]', 'remote debugger server, e.g. --server=localhost | xxx ' )
	.option('--port [value]','remote debugger port, default 9222, if not setting,auto find available port, e.g. --port=9222')
	.option('--disk-cache [value]', 'disk cache, default false, e.g. --disk-cache=true')
	.option('--mobile [value]','mobile type, android or iphone, server is fixed as "localhost", e.g. --mobile=android')
	.option('--config [value]','JSON-formatted config file, e.g. --config=./config.log')
	.option('--viewport [value]','window viewport width and height, e.g. --viewport=1920x768' )
	.option('--proxy [value]','specifies the proxy server to use, e.g. --proxy=192.168.1.42:8080')
	.option('--modules [value]','specify module, e.g. --modules=firstscreen,whitescreen')
	.option('--skip-modules [value]','skip selected modules [moduleOne],[moduleTwo],.., e.g. --skip-modules=firstscreen,whitescreen.')
	.option('--timeout [value]','time after onload, default 2000, e.g. --timeout=2000')
	.option('--user-agent [value]','provide a custom user agent, e.g. --user-agent=Mozilla/5.0 (Windows NT 6.3; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0')
	.option('--verbose [value]','write debug messages to console, e.g. --verbose')
	.option('--silent [value]','dont\'t write anything to the console, e.g. --slient')
	.option('--format [value]', 'output format, plain | json | csv, default plain, e.g. --format=json')
	.option('--browser [value]','chrome,firefox, default chrome, invalid when debugging on mobile, e.g. --browser=chrome')
	.option('--har-dir [value]', 'har file directory, e.g. --har-dir=./')
	.parse(process.argv);

//default setting
if (params.config) {
	try {
		jsonConfig = JSON.parse( fs.readFileSync(params.config) ) || {};
	}
	catch(ex) {
		jsonConfig = {};
		params.config = false;
	}
	Object.keys(jsonConfig).forEach(function(key) {
		if (typeof params[key] === 'undefined') {
			params[key] = jsonConfig[key];
		}
	});
}

var isMobile = ( params.mobile == 'android' || params.mobile == 'iphone' );
params.server = isMobile ? 'localhost' : params.server;
params.server = params.server ? params.server : 'localhost';
params.viewport = params.viewport || '1280x1024';
params.format = params.format || 'plain';
params.browser = params.browser || 'chrome';
params.timeout = (params['timeout'] > 0 && parseInt(params['timeout'], 10)) || 5000;
params.modules = (typeof params['modules'] === 'string') ? params['modules'].split(',') : [];
params.skipModules = (typeof params.skipModules === 'string') ? params.skipModules.split(',') : [];
params.userAgent = params.userAgent || getDefaultUserAgent();
params.diskCache = params.diskCache == 'true' ? 'true' : 'false';

if( params.harDir ){
	params.harDir = path.resolve( params.harDir );
}else{
	params.skipModules.push('har');
}

//appointed port or auto port
if( params.port ){
	run(isMobile,params);
}else{
	async.series([getAvailablePort],function(err,res){
		if( !err ){
			var port = res[0];
			params.port = port;
			run( isMobile,params );
		}
	})
}

/**
 * run
 *
 * @param execArgv
 */
function run(isMobile,params){
	if( !isMobile && params.server == 'localhost' ){
		bs = new browserScript( params );
		async.series( [openBrowser, async.apply( analyzePerformance, params ), closeBrowser], function(err, res){
			if( err ) console.log(res);
			closeBrowser( function(err, result){} );
			setTimeout(function(){
				process.exit();
			},100);
;
		} );
	}else{
		if( isMobile ){
			async.series([async.apply( enableMobileDebugging, params ), async.apply( analyzePerformance, params )],function(err,res){
				if( err ) console.log(res);
				setTimeout(function(){
					process.exit();
				},100);
			})
		}else{
			analyzePerformance( params, function(err,res){
				if( err ) console.log(res);
				setTimeout(function(){
					process.exit();
				},100);
			});
		}
	}
}

/**
 * open browser
 *
 * @param execArgv
 * @param callback
 */
function openBrowser(callback){
	bs.openBrowser(function(err,result){
		callback(err, result);
	});
}

/**
 * analyze performance
 *
 * @param params
 * @param callback
 */
function analyzePerformance(params,callback){
	var pagetimeline = require('./../core/pagetimeline.js');
	var pagetimelineIns = new pagetimeline( params );
	pagetimelineIns.run(function(err,result){
		callback(err,result);
	});
}

/**
 * close browser
 *
 * @param callback
 */
function closeBrowser(callback){
	bs.closeBrowser(function(err,result){
		callback(err, result);
	});
}

/**
 *  enalbe adb port forwarding
 *
 * @param params
 * @param callback
 */
function enableMobileDebugging(params,callback){
	var adbScript = require('./../libs/adbScript.js');
	var as = new adbScript(params);
	as.enableDebugging( callback );
}

/**
 * get available port
 *
 * @param callback
 */
function getAvailablePort(callback){
	var portfinder = require('portfinder');
	portfinder.getPort(function(err,port){
		err ? port=9222 : port;
		callback(err,port);
	});
}

/**
 *  get default UA
 *
 * @returns {string}
 */
function getDefaultUserAgent(){
	var VERSION = require('./../package').version;
	var os = require('os');
	return "pagetimeline/" + VERSION + "(" + os.platform() + " " + os.arch() + ")";
}
