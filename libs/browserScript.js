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
	}else{
		if( this.browser == 'chrome' ){
			this.runScript = 'runChrome.sh';
			this.closeScript = 'closeChrome.sh';
			//this.browserLoc = __dirname + './../browser/windows/ChromiumPortable';
		}
	}

	this.execArgv = [this.browserLoc, this.port];
}


browserScript.prototype = {
	openBrowser:function(callback){
		var execFile = require('child_process').execFile;
		execFile( this.runScript, this.execArgv,{cwd:'./libs'},function(err, stdout, stderr) {
			callback(err, stdout);
		});
		callback(false,{message:'open browser done'});
	},
	closeBrowser:function(callback){
		var execFile = require('child_process').execFile;
		execFile( this.closeScript,{cwd:'./libs'},function(err, stdout, stderr) {
			callback(err, stdout);
		});
		callback(false,{message:'close browser done'});
	}
}

module.exports = browserScript;


