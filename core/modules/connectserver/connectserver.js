/**
 *
 * Created by nant on 2014/7/12.
 */

exports.run = function(pagetimeline, callback){
	var Chrome = require( 'chrome-remote-interface' );
	var server = pagetimeline.getParam( 'server' );
	var port = pagetimeline.getParam( 'port' );

	Chrome( {host:server, port:port}, function(browser){
		if( !browser ){
			callback( true, {'message':'connect to browser fail!'} );
		}else{
			pagetimeline.core['browser'] = browser;
			exports.output = browser;
			callback( false, {message:'connect to server success!'} );
		}
	} );
}

exports.name = 'connectserver';
exports.after = '';
exports.output = null;
