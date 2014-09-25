/**
 *
 * Created by nant on 2014/7/12.
 */

exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	pagetimeline.log( 'connect to server ...' );

	var server = pagetimeline.getParam( 'server' );
	var port = pagetimeline.getParam( 'port' );
	var browserType = pagetimeline.getParam( 'browser' );
	var runstep = pagetimeline.model.runstep;
	var maxstep = pagetimeline.model.maxstep;

	if( runstep <= maxstep ){
		var browser = pagetimeline.model.browser;
		browser && browser.closeConnection(function(){});
	}

	var browserProxyModule = require( './../../browserProxy.js' );
	var browser = new browserProxyModule( server, port, browserType );

	browser.init( function(res){
		if( !res ){
			callback( true, {'message':'connect to browser fail!'} );
		}else{
			pagetimeline.model['browser'] = browser;
			pagetimeline.model.startTime = +new Date();

			callback( false, {message:'connect to server success!'} );
            pagetimeline.finishModule();
		}
	} );

	browser.on( 'error', function(res){
		pagetimeline.emit( 'error', res );
	} );
}
