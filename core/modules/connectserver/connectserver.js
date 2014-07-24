/**
 *
 * Created by nant on 2014/7/12.
 */

exports.version = '0.1';

exports.run = function(pagetimeline, callback){
	pagetimeline.log( 'connect to server ...' );
	var server = pagetimeline.getParam( 'server' );
	var port = pagetimeline.getParam( 'port' );
	var browserType = pagetimeline.getParam( 'browser' );

	var browserProxyModule = require('./../../browserProxy.js');
	var browser = new browserProxyModule(server, port,browserType );
	browser.init(function(res){
		if( !res ){
			callback( true, {'message':'connect to browser fail!'} );
		}else{
			setTimeout(function(callback){
				pagetimeline.model['browser'] = browser;
				pagetimeline.model.startTime = +new Date();
				callback( false, {message:'connect to server success!'} );
			},100, callback)
		}
	});
}

exports.name = 'connectserver';
