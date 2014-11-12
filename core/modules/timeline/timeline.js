/**
 * Created by nant on 2014/7/12.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	callback( false, {message:'add timeline module done!'} );

	pagetimeline.log( 'timeline ...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam( 'timeout' );
	var TimelineParser = require( './../../TimelineParser' );
	var timelienParser = new TimelineParser();

	browser.startTimeline( 0, function(err, res){
	} );

	browser.onTimelineRecorded( function(res){
		var record = res.record;
		timelienParser.parse( record, 'all' );
	} );

	browser.onLoadEventFired( function(res){
		setTimeout( function(){
			var res = timelienParser.getResult();
			pagetimeline.setMetric( 'timeline_network_time', res.network.time );
			pagetimeline.setMetric( 'timeline_script_time', res.script.time );
			pagetimeline.setMetric( 'timeline_render_time', res.render.time );
			pagetimeline.setMetric( 'timeline_paint_time', res.paint.time );
			pagetimeline.setMetric( 'timeline_first_paint_time', res.firstPaintTime );
		}, timeout );
	} );
}

