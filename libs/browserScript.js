/**
 * Created by nant on 2014/7/7.
 */

var os = require( 'os' );
var path = require( 'path' );
var fs = require( 'fs' );
var crypto = require( 'crypto' );
var which = require( 'which' );

var browserScript = function(params){
	this.dirname = __dirname;
	this.homedir = path.resolve( this.dirname, './../' );
	this.runScript = '';
	this.closeScript = '';
	this.installScript = '';
	this.installXvfbScript = '';
	this.closeAllXvfbScript = '';
	this.findXvfbAuthDirNameScript = '';
	this.user_agent = params ? params.userAgent : "";
	this.browser = params ? params.browser : "chrome";
	this.browserLoc = params ? params.browserPath : "";
	this.port = params ? params.port : 9222;
	this.user_data_dir = '';
	this.execArgv = [];
	this.closeArgv = [];
	this.xvfbAuthDirName = '';

	this.viewport_width = 0;
	this.viewport_height = 0;
	if( params && params.viewport ){
		var wh = params.viewport.split( 'x' );
		this.viewport_width = wh[0];
		this.viewport_height = wh[1];
	}

	//default chrome
	if( !this.browser )  this.browser = 'chrome';

	//find browser path in environment
	if( this.browserLoc == 'env' ){
		this.browserLoc = which.sync( this.browser );
	}

	//check browser available
	this.browserLoc = fs.existsSync( this.browserLoc ) ? this.browserLoc : '';

	if( os.platform() == 'win32' ){
		if( this.browser == 'chrome' ){
			this.runScript = 'runChrome.bat';
			this.closeScript = 'closeChrome.bat';
			if( !this.browserLoc ){
				this.browserLoc = path.resolve( __dirname + './../browsers/windows/chrome/ChromiumPortable.exe' );
			}
		}else if( this.browser == 'firefox' ){
			this.runScript = 'runChrome.bat';
			this.closeScript = 'closeChrome.bat';
			if( !this.browserLoc ){
				this.browserLoc = path.resolve( __dirname + './../browsers/windows/firefox/FirefoxPortable.exe' );
			}
		}
	}else{
		if( this.browser == 'chrome' ){
			this.runScript = path.resolve( this.dirname, './runChrome.sh' );
			this.closeScript = path.resolve( this.dirname, './closeChrome.sh' );
			this.browserLoc = '';
			this.installScript = path.resolve( this.dirname, './installChrome.sh' );
			this.installXvfbScript = path.resolve( this.dirname, './installXvfb.sh' );
			this.findXvfbAuthDirNameScript = path.resolve( this.dirname, './findCurXvfbAuthDirName.sh' );
			this.closeAllXvfbScript = path.resolve( this.dirname, './killXvfb.sh' );
			/*
			 var userDataDir = path.resolve( this.homedir, './user-data-dir');
			 if( !fs.existsSync( userDataDir ) ){
			 fs.mkdirSync( userDataDir );
			 }
			 var content = Math.random().toString();
			 var md5 = crypto.createHash('md5');
			 md5.update(content);
			 this.user_data_dir = path.resolve( userDataDir, './' + md5.digest('hex') );
			 if( !fs.existsSync( this.user_data_dir ) ){
			 fs.mkdirSync( this.user_data_dir );
			 }*/
		}
	}

	this.execArgv = [this.browserLoc, this.port, this.viewport_width, this.viewport_height, this.user_agent];
	this.closeArgv = [this.port];
}


browserScript.prototype = {
	openBrowser:function(callback){
		var execFile = require( 'child_process' ).execFile;
		var self = this;
		var subProc = execFile( this.runScript, this.execArgv, {cwd:this.dirname}, function(err, stdout, stderr){
			if( err || stderr ){
				callback( true, {message:err || stderr} );
			}
		} );
		//subProc.stdout.pipe( process.stdout );

		if( self.findXvfbAuthDirNameScript ){
			var cp = execFile( self.findXvfbAuthDirNameScript, {cwd:self.dirname}, function(err, stdout, stderr){
				if( err || stderr ) return;

				self.xvfbAuthDirName = stdout.substr( 0, stdout.length - 1 );
				self.closeArgv.push( self.xvfbAuthDirName );
			} );
			//cp.stdout.pipe( process.stdout );
		}
		setTimeout( function(){
			callback( false, {message:'open browser done!'} );
		}, 100 );
	}, closeBrowser:function(callback){
		var execFile = require( 'child_process' ).execFile;
		var subProc = execFile( this.closeScript, this.closeArgv, {cwd:this.dirname}, function(err, stdout, stderr){
			if( err || stderr ){
				callback( true, {message:err || stderr} );
			}
		} );
		//subProc.stdout.pipe( process.stdout );

		if( fs.existsSync( this.user_data_dir ) ){
			var exec = require( 'child_process' ).exec;
			exec( 'rm -rf ' + this.user_data_dir, {cwd:this.dirname}, function(err, stdout, stderr){
			} );
		}
		setTimeout( function(){
			callback( false, {message:'close browser done'} );
		}, 100 );
	}, installBrowser:function(callback){
		var execFile = require( 'child_process' ).execFile;
		var subProc = execFile( this.installScript, {cwd:this.dirname}, function(err, stdout, stderr){
			callback( err, stderr );
		} );
		subProc.stdout.pipe( process.stdout );
	}, installXvfb:function(callback){
		var execFile = require( 'child_process' ).execFile;
		var subProc = execFile( this.installXvfbScript, {cwd:this.dirname}, function(err, stdout, stderr){
			callback( err, stderr );
		} );
		subProc.stdout.pipe( process.stdout );
	}, closeAllXvfb:function(callback){
		if( os.platform() == 'win32' ){
			callback( false, {message:'close nothing!'} );
		}else{
			var execFile = require( 'child_process' ).execFile;
			var subProc = execFile( this.closeAllXvfbScript, {cwd:this.dirname}, function(err, stdout, stderr){
			} );
			//subProc.stdout.pipe( process.stdout );
			setTimeout( function(){
				callback( false, {message:'kill xvfb done!'} );
			}, 100 );
		}
	}
}

module.exports = browserScript;


