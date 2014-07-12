/**
 * Created by nant on 2014/7/7.
 */

var os_utils = require( 'os-utils' );
var path = require( 'path' );

var browserScript = function(params){
	this.dirname = __dirname;
	this.runScript = '';
	;
	this.closeScript = '';
	this.browserLoc = '';
	this.viewport_width = 0;
	this.viewport_height = 0;
	this.browser = params.browser;
	this.port = params.port;
	this.execArgv = [];

	if( !this.browser )  this.browser = 'chrome';

	if( os_utils.platform() == 'win32' ){
		if( this.browser == 'chrome' ){
			this.runScript = 'runChrome.bat';
			this.closeScript = 'closeChrome.bat';
			this.browserLoc = path.resolve( __dirname + './../browsers/windows/ChromiumPortable/ChromiumPortable.exe' );
			if( params.viewport ){
				var wh = params.viewport.split( 'x' );
				this.viewport_width = wh[0];
				this.viewport_height = wh[1];
			}
		}else if( this.browser == 'firefox' ){
			this.runScript = 'runChrome.bat';
			this.closeScript = 'closeChrome.bat';
			this.browserLoc = path.resolve( __dirname + './../browsers/windows/FirefoxPortable/FirefoxPortable.exe' );
		}
	}else{
		//priviledge,x
		var cp = require( 'child_process' );
		cp.exec( 'chmod -R u+x ' + path.resolve( this.dirname + './../' ) );

		if( this.browser == 'chrome' ){
			this.runScript = path.resolve( this.dirname + '/runChrome.sh' );
			this.closeScript = path.resolve( this.dirname + '/closeChrome.sh' );
			this.browserLoc = '';
		}
	}

	this.execArgv = [this.browserLoc, this.port, this.viewport_width, this.viewport_height];
}


browserScript.prototype = {
	openBrowser:function(callback){
		var execFile = require( 'child_process' ).execFile;
		var cp = execFile( this.runScript, this.execArgv, {cwd:this.dirname}, function(err, stdout, stderr){
			if( err || stderr ){
				callback( true, {message:err || stderr } );
				return;
			}
		} );
		setTimeout( function(cp, callback){
			callback( false, {message:'open browser done!'} );
		}, 1000, cp, callback )
	},
	closeBrowser:function(callback){
		var execFile = require( 'child_process' ).execFile;
		execFile( this.closeScript, {cwd:this.dirname}, function(err, stdout, stderr){
			callback( err, stdout );
		} );
		callback( false, {message:'close browser done'} );
	}
}

module.exports = browserScript;


