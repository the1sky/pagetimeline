/**
 * Created by nant on 2014/7/12.
 */
exports.run = function(pagetimeline, callback){
	var enableRuntime = function(pagetimeline, callback){
		var browser = pagetimeline.core.browser;
		browser.send( 'Runtime.enable', {}, function(err, response){
			callback( err, response );
		} );
	};
	enableRuntime( pagetimeline, callback );
}

exports.name = 'runtime';
exports.after = 'connectserver';
exports.output = null;