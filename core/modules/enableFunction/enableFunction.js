/**
 *
 * Created by nant on 2014/7/18.
 */

exports.run = function(pagetimeline, callback){
	var browserProxy = pagetimeline.browserProxy;
	browserProxy.enablePage(function(err,res){});
	var async = require('async');
	async.parallel([
		browserProxy.enablePage.bind(browserProxy),
		browserProxy.enableRuntime.bind(browserProxy),
		browserProxy.enableNetwork.bind(browserProxy)
	],function(err,res){
		if( !err ){
			callback( false, {'message':'enable page succ!'} );
		}else{
			callback( true, {message:'enable page fail!'} );
		}
	})
}

exports.name = 'enableFuntion';
