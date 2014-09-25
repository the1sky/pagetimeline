/**
 * Created by nant on 2014/7/12.
 */
exports.version = '0.1';

exports.module = function(pagetimeline, callback){
	var results = {};
	var excludeRecordType = {
		Program:'',
		BeginFrame:'',
		DrawFrame:'',
		ActivateLayerTree:'',
		UpdateLayerTree:'',
		RequestMainThreadFrame:''
	};
	pagetimeline.log( 'timeline ...' );
	var browser = pagetimeline.model.browser;
	var timeout = pagetimeline.getParam('timeout');

	browser.startTimeline(0,function(err,res){});

	browser.onTimelineRecorded(function(res){
		var record = res.record;
		getChildren( record, results );
	});

	browser.onLoadEventFired(function(res){
		setTimeout(function(){
			//console.log( results['recalculateStyle'] );
            pagetimeline.finishModule();
		},timeout);
	});

	function getChildren(record,results){
		if( record.children && record.children.length ){
			var len = record.children.length;
			for( var i =0; i < len;i++){
				getChildren( record.children[i], results );
			}
		}else{
			if( record.type in excludeRecordType ){
				return;
			}
			if( !results['all'] ){
				results['all'] = [];
			}
			if( !results['paint'] ){
				results['paint'] = [];
			}
			if( !results['resize'] ){
				results['resize'] = [];
			}
			if( !results['decode'] ){
				results['decode'] = [];
			}
			if( !results['recalculateStyle'] ){
				results['recalculateStyle'] = [];
			}

			if( !results['layout'] ){
				results['layout'] = [];
			}

			if( record.type == 'Paint'){
				results['paint'].push( record );
			}

			if( record.type == 'ResizeImage'){
				results['resize'].push( record );
			}

			if( record.type == 'DecodeImage'){
				results['decode'].push( record );
			}

			if( record.type == 'RecalculateStyles'){
				results['recalculateStyle'].push( record );
			}

			if( record.type == 'Layout'){
				results['layout'].push( record );
			}

			results['all'].push( record );
		}
	}

	callback( false, {message:'add timeline module done!'} );
}

