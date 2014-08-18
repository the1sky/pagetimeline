#!/usr/bin/env node
/**
 * Created by nant on 2014/7/4.
 */

var params = require('commander');
var pagetimeline = require("./../index");

params
	.version( require('./../package').version )
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
	.option('--result-dir [value]', 'performance analyze result file directory, e.g. --har-dir=./')
	.option('--reload', 'reload the page, only once, e.g. --reload')
	.parse(process.argv);

var pt = new pagetimeline( params );
pt.start();
pt.on('report',function(res){
	process.stdout.write(res);
});
pt.on('error',function(res){
	process.stderr.write(res);
	process.exit( 1 );
});
pt.on('end', function(res){
	process.exit( 0 );
});

