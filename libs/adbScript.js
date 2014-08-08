/**
 * Created by nant on 2014/7/20.
 */
var os = require( 'os' );
var path = require( 'path' );

var adb = function(params){
	this.params = params;
	this.dirname = path.resolve( __dirname, './../adb' );
	this.path = path.resolve( this.dirname, 'adb.exe' );
}

adb.prototype = {
	enableDebugging:function(callback){
		var self = this;
		self.killServer( function(err, res){
			self.startServer( function(err, res){
				if( !err ){
					self.getDevices( function(err, res){
						if( !err ){
							self.enablePortForwarding( function(err, res){
								if( !err ){
									callback(false,{message:'enable port forwarding suc!'});
								}else{
									callback(true,{message:err.message});
								}
							} )
						}else{
							callback( true, {message:err.message});
						}
					} )
				}else{
					callback(false,{message:err.message});
				}
			} )
		} )
	},
	killServer:function(callback){
		var exec = require( 'child_process' ).exec;
		exec( this.path + ' kill-server', function(err, stdout, stderr){
			callback( err, stdout );
		} )
	},
	startServer:function(callback){
		var exec = require( 'child_process' ).exec;
		exec( this.path + ' start-server', function(err, stdout, stderr){
			callback( err, stdout );
		} )
	},
	getDevices:function(callback){
		var exec = require( 'child_process' ).exec;
		exec( this.path + ' devices', function(err, stdout, stderr){
			callback( err, stdout );
		} )
	},
	enablePortForwarding:function(callback){
		var exec = require( 'child_process' ).exec;
		exec( this.path + ' forward tcp:' + this.params['port'] + ' localabstract:chrome_devtools_remote', function(err, stdout, stderr){
			callback( err, stdout );
		} )
	}
}

module.exports = adb;
