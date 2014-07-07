/**
 * Created by nant on 2014/7/4.
 */
var execFile = require('child_process').execFile;
var chromeScript = require('./libs/chromeScript.js');
var portfinder = require('portfinder');
var performance = require('./modules/performance.js');
var execArgv = [];
var stdin = process.stdin;
var stdout = process.stdout;
var stderr = process.stderr;

var program = require('commander');

program
	.version('0.0.1')
	.option('-u,--url [value]','target url' )
	.option('-p,--port [value]','remote debugging port')
	.parse(process.argv);

//运行chrome,固定位置，固定端口
if( program.port ){
	execArgv.push( program.port );
	openBrowser();
	startPerformance();
}else{
	portfinder.getPort(function(err,port){
		err ? port=9222 : port;
		program.port = port;
		execArgv.push( port );
		openBrowser();
		startPerformance()
	});
}

/**
 * 打开浏览器
 */
function openBrowser(){
	execFile( chromeScript.scriptName.run, execArgv,{cwd:'./libs'},function(error, stdout, stderr) {});
}

/**
 * 进行性能分析
 */
function startPerformance(){
	performance.work( program );
}

closeBrowser();

//关闭chrome
function closeBrowser(){
	var closeChromeId = setInterval( closeChrome, 100 );
	function closeChrome(){
		if( performance.done ){
			execFile( chromeScript.scriptName.close, {cwd:'./libs'}, function(error, stdout, stderr){
			} );
			clearInterval( closeChromeId );
		}
	}
}
