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
var params = require('commander');

params
	.version('0.0.1')
	.option('-u,--url [value]','target url' )
	.option('-p,--port [value]','remote debugging port')
	.option('--config [value]','JSON-formatted config file')
	.option('--viewport [value]','window viewport width and height, like "1920x768"' )
	.option('--proxy [value]','specifies the proxy server to use (e.g. --proxy=192.168.1.42:8080)')
	.option('--modules [value]','specify module')
	.option('--skip-modules [value]','skip selected modules [moduleOne],[moduleTwo],...')
	.option('--timeout [value]','time after open the url')
	.option('--user-agent [value]','provide a custom user agent')
	.option('--verbose [value]','write debug messages to console')
	.option('--silent [value]','dont\'t write anything to the console')
	.option('--format [value]', 'output format')
	.option('--browser [value]','chrome,firefox')
	.parse(process.argv);

//指定端口或自动获取可用端口
if( params.port ){
	run(params);
}else{
	async.series([getAvailablePort],function(err,result){
		if( !err ){
			var port = result[0];
			params.port = port;
			run( params );
		}
	})
}

/**
 * 运行
 *
 * @param execArgv
 */
function run(params){
	bs = new browserScript(params);
	browserScript( params );
	async.series([openBrowser, async.apply(analyzePerformance,params ), closeBrowser],function(err,result){
		process.exit();
	})
}

/**
 * 打开浏览器
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
 * 分析性能
 *
 * @param params
 * @param callback
 */
function analyzePerformance(params,callback){
	var pagetimelineAnalysis = require('./../core/pagetimeline.js')
	new pagetimelineAnalysis( params,function(err,result){
		callback(err,result);
	} );
}

/**
 * 关闭浏览器
 *
 * @param callback
 */
function closeBrowser(callback){
	bs.closeBrowser(function(err,result){
		callback(err, result);
	});
}

/**
 * 获取可用端口
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
