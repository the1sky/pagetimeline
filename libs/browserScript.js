/**
 * Created by nant on 2014/7/7.
 */

var os_utils = require('os-utils');
var path = require('path');

var browserScript = function(params){
	this.dirname = __dirname;
	this.runScript = '';;
	this.closeScript = '';
	this.browserLoc = '';
	this.browser = params.browser;
	this.port = params.port;
	this.execArgv = [];

	if( !this.browser )  this.browser = 'chrome';

	if( os_utils.platform() == 'win32'){
		if( this.browser == 'chrome' ){
			this.runScript = 'runChrome.bat';
			this.closeScript = 'closeChrome.bat';
			this.browserLoc = path.resolve( __dirname + './../browsers/windows/ChromiumPortable/ChromiumPortable.exe' );
		}else if( this.browser == 'firefox'){
			this.runScript = 'runChrome.bat';
			this.closeScript = 'closeChrome.bat';
			this.browserLoc = path.resolve( __dirname + './../browsers/windows/FirefoxPortable/FirefoxPortable.exe' );
		}

		this.execArgv = [this.browserLoc, this.port];

	}else{
		var cp = require('child_process');
		if( this.browser == 'chrome' ){
			this.runScript = path.resolve(this.dirname + '/runChrome.sh');
			this.closeScript = path.resolve(this.dirname + '/closeChrome.sh');
			this.browserLoc = '';
		}
	}

	this.execArgv = [this.browserLoc, this.port];
}


browserScript.prototype = {
	openBrowser:function(callback){
		var execFile = require('child_process').execFile;
		var cp=execFile( this.runScript, this.execArgv,{cwd:this.dirname},function(err, stdout, stderr) {
			/*
			 if( !err && !stderr ) {
			 callback(false, {message: 'open browser done'});
			 }else{
			 callback(true, {message:err || stderr });
			 }
			 */
		});
		setTimeout(function(cp,callback){
			callback(false,'');
		},1000,cp,callback)
	},
	closeBrowser:function(callback){
		var execFile = require('child_process').execFile;
		execFile( this.closeScript,{cwd:this.dirname},function(err, stdout, stderr) {
			callback(err, stdout);
		});
		callback(false,{message:'close browser done'});
	}
}

module.exports = browserScript;


