/**
 * Created by nant on 2014/7/20.
 */
var os = require( 'os' );
var path = require( 'path' );

var adb = function(params){
	this.params = params;
	this.dirname = __dirname;
}

adb.prototype = {
	enableDebugging:function(callback){
		var self = this;
		self.killServer( function(err, res){
			self.startServer( function(err, res){
				if( !err ){
					self.enablePortForwarding( function(err, res){
						callback( err, res );
					} )
				}else{
					callback( err, res );
				}
			} )
		} )
	},
	killServer:function(callback){
		var exec = require( 'child_process' ).exec;
		exec( 'adb kill-server', function(err, stdout, stderr){
			callback( err, stdout );
		} )
	},
	startServer:function(callback){
		var exec = require( 'child_process' ).exec;
		exec( 'adb devices', function(err, stdout, stderr){
			callback( err, stdout );
		} )
	},
	enablePortForwarding:function(callback){
		var exec = require( 'child_process' ).exec;
		exec( 'adb forward tcp:' + this.params['port'] + ' localabstract:chrome_devtools_remote', function(err, stdout, stderr){
			callback( err, stdout );
		} )
	}
}

module.exports = adb;
