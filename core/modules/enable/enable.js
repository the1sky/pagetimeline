/**
 *
 * Created by nant on 2014/7/18.
 */

exports.module = function(pagetimeline, callback){
	pagetimeline.log( 'enable browser function ...' );
	var browser = pagetimeline.model.browser;
	var async = require('async');
	async.parallel([
		browser.Page.enable,
		browser.Runtime.enable,
		browser.Timeline.enable,
		browser.Network.enable,
		browser.Console.enable
	],function(err,res){
		if( !err ){
			callback( false, {'message':'enable page succ!'} );
		}else{
			callback( true, {message:'enable page fail!'} );
		}
        pagetimeline.finishModule();
	})
}

exports.name = 'enable';
