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
var path = require( 'path' );
var browserScriptModule = require( './libs/browserScript.js' );
var adbScriptModule = require( './libs/adbScript.js' );
var pagetimelineModule = require( './core/pagetimeline.js' );

function getDefaultUserAgent(){
	var VERSION = require( './package' ).version;
	var os = require( 'os' );
	return "pagetimeline/" + VERSION + "(" + os.platform() + " " + os.arch() + ")";
}

var pagetimeline = function(params){
	this.bs = null;
	this.as = null;
	this.pagetimelineIns = null;

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
	params.timeout = (params['timeout'] > 0 && parseInt( params['timeout'], 10 )) || 2000;
	params.modules = (typeof params['modules'] === 'string') ? params['modules'].split( ',' ) : [];
	params.skipModules = (typeof params.skipModules === 'string') ? params.skipModules.split( ',' ) : [];
	params.userAgent = params.userAgent || getDefaultUserAgent();
	params.diskCache = params.diskCache == 'true' ? 'true' : 'false';
	params.homedir = path.resolve( __dirname, './' );
	params.silent = params.silent || ( params.silent != undefined );
	params.reload = params.reload || ( params.reload != undefined );

	if( params.harDir ){
		params.harDir = path.resolve( params.harDir );
	}else{
		params.skipModules.push( 'har' );
	}

	if( params.resultDir ){
		params.resultDir = path.resolve( params.resultDir );
	}

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
		if( !this.bs ) this.bs = new browserScriptModule( this.params );
		if( !this.as ) this.as = new adbScriptModule( this.params );
		if( !this.pagetimelineIns ) this.pagetimelineIns = new pagetimelineModule( this.params );

		this.pagetimelineIns.on('report',function(res){
			if( self.params.silent ){
				self.emit('report',res );
			}
		});

		this.pagetimelineIns.on('error',function(res){
			self.emit('error',res);
		});

		if( !this.isMobile && this.params.server == 'localhost' ){
			async.series( [
				async.apply( this.openBrowser, this.bs ),
				async.apply( this.analyzePerformance, this.pagetimelineIns, this.params ),
				async.apply( this.closeBrowser, this.bs )
			], function(err, res){
				if( err ) {
					self.emit('error', res);
				}
				self.closeBrowser( self.bs, function(err, result){} );
				setTimeout( function(){
					self.emit('end', res);
				}, 100 );
			} );
		}else{
			if( this.isMobile ){
				async.series( [
					async.apply( this.enableMobileDebugging, this.as ),
					async.apply( this.analyzePerformance, this.pagetimelineIns, this.params )
				], function(err, res){
					if( err ) {
						self.emit('error', res);
					}
					setTimeout( function(){
						self.emit('end', res);
					}, 100 );
				} )
			}else{
				self.analyzePerformance( this.params, function(err, res){
					if( err ) {
						self.emit('error', res);
					}
					setTimeout( function(){
						self.emit('end', res);
					}, 100 );
				} );
			}
		}
	},
	openBrowser:function(bs, callback){
		bs.openBrowser( function(err, result){
			callback( err, result );
		} );
	},
	analyzePerformance:function(pagetimeline, params, callback){
		pagetimeline.run( 1, function(err, result){
			if( !params.reload ){
				callback( err, result );
			}else{
				pagetimeline.run( 2, function(err, result){
					callback( err, result );
				} );
			}
		} );
	},
	closeBrowser:function(bs, callback){
		bs.closeBrowser( function(err, result){
			callback( err, result );
		} );
	},

	enableMobileDebugging:function(as, callback){
		as.enableDebugging( callback );
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
