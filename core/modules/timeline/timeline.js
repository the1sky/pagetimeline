/**
 * Created by nant on 2014/7/12.
 */
exports.version = '0.1';

exports.run = function(pagetimeline, callback){
	pagetimeline.log( 'timeline ...' );
	var browser = pagetimeline.model.browser;
	browser.startTimeline(0,function(err,res){});
	browser.onTimelineRecorded(function(res){
		"use strict";

	});
	browser.Timeline.eventRecorded( function(res){
	} );

	callback( false, {message:'add timeline module done!'} );
}

exports.name = 'timeline';
