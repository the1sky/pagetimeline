/**
 * Created by nant on 2014/7/12.
 */
exports.run = function(pagetimeline, callback){
	pagetimeline.core.records = [];

	var startTimeline = function(pagetimeline, callback){
		var browser = pagetimeline.core.browser;
		browser.send( 'Timeline.start', {}, function(err, response){
			callback( err, response );
		} );
	};

	var addTimelineEventListener = function(pagetimeline, callback){
		var browser = pagetimeline.core.browser;
		browser.on( 'Timeline.eventRecorded', function(record){
			exports.output = null;
			pagetimeline.core.records.push( record.record );
		} );
		callback( false, {message:'add eventRecorded event listener'} );
	};

	var async = require( 'async' );
	async.series([
		async.apply( startTimeline, pagetimeline ),
		async.apply( addTimelineEventListener, pagetimeline )
	],function(err,result){
		callback( err, result);
	});
}

exports.name = 'timeline';
exports.after = 'connectserver';
exports.output = null;
