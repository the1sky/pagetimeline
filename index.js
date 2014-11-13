/**
 *
 * process:
 * 1、receive params
 * 2、start browser with remote-debugging-protocol
 * 3、analyze performance
 * 4、close browser and exit
 *
 * Created by nant on 2014/8/18.
 */

var async = require( 'async' );
var fs = require( 'fs' );
var os = require( 'os' );
var path = require( 'path' );
var _ = require( 'underscore' );
var crypto = require( 'crypto' );
var browserScriptModule = require( './libs/browserScript.js' );
var adbScriptModule = require( './libs/adbScript.js' );
var pagetimelineModule = require( './core/pagetimeline.js' );
var siteArchiveModule = require( './core/sitearchive' );

function getDefaultUserAgent(){
	var VERSION = require( './package' ).version;
	return "pagetimeline/" + VERSION + "(" + os.platform() + " " + os.arch() + ")";
}

var pagetimeline = function(params){
	this.bs = null;
	this.as = null;
	this.pagetimelineIns = null;
	this.runstep = 1;

	//default setting
	if( params.config ){
		var jsonConfig;
		try{
			jsonConfig = JSON.parse( fs.readFileSync( params.config ) ) || {};
		}catch( ex ){
			jsonConfig = {};
			params.config = false;
		}
		Object.keys( jsonConfig ).forEach( function(key){
			if( typeof params[key] === 'undefined' ){
				params[key] = jsonConfig[key];
			}
		} );
	}

	this.isMobile = ( params.mobile == 'android' || params.mobile == 'iphone' );
	params.server = this.isMobile ? 'localhost' : params.server;
	params.server = params.server ? params.server : 'localhost';
	params.viewport = params.viewport || '1280x1024';
	params.format = params.format || 'plain';
	params.browser = params.browser || 'chrome';
	params.timeout = (params['timeout'] > 0 && parseInt( params['timeout'], 10 )) || 5000;
	params.modules = (typeof params['modules'] === 'string') ? params['modules'].split( ',' ) : [];
	params.skipModules = (typeof params.skipModules === 'string') ? params.skipModules.split( ',' ) : [];
	params.specialModules = (typeof params.specialModules === 'string') ? params.specialModules.split( ',' ) : [];
	params.userAgent = params.userAgent || getDefaultUserAgent();
	params.diskCache = params.diskCache == 'true' ? 'true' : 'false';
	params.homedir = path.resolve( __dirname, './' );
	params.silent = params.silent || ( params.silent != undefined );
	params.remoteBrowser = params.remoteBrowser || ( params.remoteBrowser != undefined );
	params.reloadCount = params.reload ? ( parseInt( params.reloadCount ) || 2 ) : 1;
	params.disableUpload = params.disableUpload === true;

	if( params.harDir ){
		params.harDir = path.resolve( params.harDir );
	}

	if( params.resultDir ){
		params.resultDir = path.resolve( params.resultDir );
	}

	this.uid = this.getMd5( params.url );
	params.uid = this.uid;

	this.params = params;

	// setup the stuff
	this.emitter = new (require( 'events' ).EventEmitter)();
	this.emitter.setMaxListeners( 200 );

	return this;
}

pagetimeline.prototype = {
	emit:function(){
		this.emitter.emit.apply( this.emitter, arguments );
	},

	on:function(ev, fn){
		this.emitter.on( ev, fn );
	},

	once:function(ev, fn){
		this.emitter.once( ev, fn );
	},

	changeUrl:function(url){
		this.params.url = url;
		this.uid = this.getMd5( url );
		this.params.uid = this.uid;
	},

	getMd5:function(url){
		var md5 = crypto.createHash( 'md5' );
		md5.update( url + (+new Date()) );
		return md5.digest( 'hex' );
	},

	start:function(){
		var self = this;
		if( self.params.port ){
			self.run();
		}else{
			self.getAvailablePort( function(err, res){
				if( !err ){
					self.params.port = res;
					self.run();
				}
			} );
		}
	},

	run:function(){
		var self = this;
		this.bs = new browserScriptModule( this.params );
		this.as = new adbScriptModule( this.params );
		this.pagetimelineIns = new pagetimelineModule( this.params );
		this.pagetimelineIns.on( 'report', function(res){

			var result = JSON.parse( res );
			var platform = os.platform();
			result['runstep'] = self.runstep;
			result['uid'] = self.uid;

			var win32Platform = self.params.isMobile ? self.params.mobile : platform;
			result['platform'] = platform == 'win32' ? win32Platform : platform;

			var mobileBrowser = self.params.mobile == 'android' ? 'android chrome' : 'safari';
			result['browser'] = self.params.isMobile ? mobileBrowser : self.params.browser;

			result['timestamp'] = _.now();

			result = JSON.stringify( result );

			//upload to sitearchive
			if( !self.params.disableUpload ){
				if( !self.sitearchive ){
					self.sitearchive = new siteArchiveModule();
				}
				self.sitearchive.upload( result, function(res){
					self.pagetimelineIns.log( res );
				} );
			}

			if( self.params.silent ){
				self.emit( 'report', result )
			}
		} );

		this.pagetimelineIns.on( 'error', function(res){
			self.emit( 'error', res );
		} );

		if( !this.isMobile && !this.params.remoteBrowser ){
			async.series( [
				async.apply( this.closeAllXvfb, this ), async.apply( this.openBrowser, this ), async.apply( this.analyzePerformance, this ), async.apply( this.closeBrowser, this )
			], function(err, res){
				if( err ){
					self.closeBrowser( self, function(closeBrowserErr, closeBrowserRes){
						setTimeout( function(){
							self.emit( 'error', res );
						}, 100 );
					} );
				}else{
					setTimeout( function(){
						self.emit( 'end', res );
					}, 100 );
				}
			} );
		}else if( this.isMobile ){
			async.series( [
				async.apply( this.enableMobileDebugging, this ), async.apply( this.analyzePerformance, this )
			], function(err, res){
				setTimeout( function(){
					if( err ){
						self.emit( 'error', res );
					}else{
						self.emit( 'end', res );
					}
				}, 100 );
			} )
		}else if( this.params.remoteBrowser ){
			self.analyzePerformance( this, function(err, res){
				if( err ){
					self.emit( 'error', res );
				}else{
					self.emit( 'end', res );
				}
			} );
		}
	},

	openBrowser:function(self, callback){
		self.bs.openBrowser( function(err, res){
			callback( err, res );
		} );
	},

	analyzePerformance:function(self, callback){
		self.runIns( self, 1, self.params.reloadCount, callback );
	},

	runIns:function(self, step, maxStep, callback){
		self.runstep = step;
		self.pagetimelineIns.run( step, function(err, res){
			if( step < maxStep ){
				step++;
				self.runIns( self, step, maxStep, callback );
			}else{
				callback( err, res );
			}
		} );
	},

	closeBrowser:function(self, callback){
		self.bs.closeBrowser( function(err, res){
			callback( err, res );
		} );
	},

	closeAllXvfb:function(self, callback){
		self.bs.closeAllXvfb( function(err, res){
			callback( err, res );
		} )
	},

	enableMobileDebugging:function(self, callback){
		self.as.enableDebugging( callback );
	},

	getAvailablePort:function(callback){
		var portfinder = require( 'portfinder' );
		portfinder.getPort( function(err, port){
			err ? port = 9222 : port;
			callback( err, port );
		} );
	}
};

module.exports = pagetimeline;
