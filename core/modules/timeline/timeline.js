/**
 * Created by nant on 2014/7/12.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	var records = [];
	pagetimeline.log( 'timeline ...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam('timeout');
	var _ = require('underscore');

	browser.startTimeline(0,function(err,res){});

	browser.onTimelineRecorded(function(res){
		var record = res.record;
		//console.log(JSON.stringify(record));
		getChildren( record, records, 'ResourceSendRequest' );
		if( record.children && record.children.length ){
			var children = record.children;
			_.forEach(children,function(value,key){
			})
		}
	});

	browser.onLoadEventFired(function(res){
		"use strict";
		setTimeout(function(){
			//console.log(records)
		},timeout);
	});

	function getChildren(record,arr, type){
		var childInfo = {};

		childInfo['type'] = record.type;

		if( record.startTime ){
			childInfo['startTime'] = record.startTime;
		}
		if( record.endTime ){
			childInfo['endTime'] = record.endTime;
		}
		if( record.data ){
			childInfo['data'] = record.data;
		}

		if( type ){
			if( record.type ==type ){
				arr.push( childInfo );
			}
		}else{
			arr.push( childInfo );
		}

		if( record.children && record.children.length ){
			var len = record.children.length;
			for( var i =0; i < len;i++){
				getChildren( record.children[i], arr, type );
			}
		}
	}

	callback( false, {message:'add timeline module done!'} );
}

