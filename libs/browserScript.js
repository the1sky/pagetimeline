/**
 * Created by nant on 2014/7/7.
 */

var os_utils = require('os-utils');

var browserScript = function(params){
	this.runScript = '';;
	this.closeScript = '';
	this.browser = params.browser;
	this.port = params.port;
	this.execArgv = [];

	this.execArgv.push( this.port );

	if( !this.browser )  this.browser = 'chrome';

	if( os_utils.platform() == 'win32'){
		this.runScript = 'runChrome.bat';
		this.closeScript = 'closeChrome.bat';
	}else{
		this.runScript = 'runChrome.sh';
		this.closeScript = 'closeChrome.sh';
	}
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


