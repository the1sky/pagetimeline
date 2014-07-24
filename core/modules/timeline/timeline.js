/**
 * Created by nant on 2014/7/12.
 */
exports.version = '0.1';

exports.run = function(pagetimeline, callback){
	pagetimeline.log( 'timeline ...' );
	var browser = pagetimeline.model.browser;
	browser.Timeline.start( {}, function(err, res){
	} )

	browser.Timeline.eventRecorded( function(res){
	} );

	var async = require( 'async' );

	callback( false, {message:'add timeline module done!'} );
}

exports.name = 'timeline';
