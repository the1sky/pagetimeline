/**
 * see at: https://developers.google.com/web-toolkit/speedtracer/data-dump-format
 *
 * Created by nant on 11/10/2014.
 */

var _ = require( 'underscore' );

var TimelineParser = function(){
	this.startTime = 0;
	this.parsers = {
		network:{
			parser:this.NetworkParser,
			recordType:{
				ParseHTML:1,
				ResourceFinish:1,
				ResourceReceivedData:1,
				ResourceReceiveResponse:1,
				ResourceSendRequest:1
			}
		},
		script:{
			parser:this.ScriptParser,
			recordType:{
				EvaluateScript:1,
				AnimationFrameFired:1,
				CancelAnimationFrame:1,
				RequestAnimationFrame:1,
				GCEvent:1,
				EventDispatch:1,
				FunctionCall:1,
				TimerInstall:1,
				TimerFire:1,
				TimerRemove:1,
				XHRLoad:1,
				XHRReadyStateChange:1
			}
		},
		render:{
			parser:this.RenderParser,
			recordType:{
				InvalidateLayout:1,
				Layout:1,
				RecalculateStyles:1,
				ScrollLayer:1,
				UpdateLayerTree:1
			}
		},
		paint:{
			parser:this.PaintParser,
			recordType:{
				CompositeLayers:1,
				DecodeImage:1,
				ResizeImage:1,
				Paint:1,
				MarkFirstPaint:1
			}
		}
	};
	this.result = {
		network:{
			parseHTMLs:[],
			requests:[],
			time:0
		},
		script:{
			time:0
		},
		render:{
			time:0
		},
		paint:{
			time:0
		},
		other:[],
		firstPaintTime:0
	};
}

/**
 *
 * @param record
 * @param type  all | network | js | dom | paint
 */
TimelineParser.prototype.parse = function(record, type){
	var self = this;
	var parser;
	switch( record.type ){
		case "Program":
			_.forEach( record.children, function(childRecord, childIndex){
				parser = self.getParser( childRecord, type );
				if( parser ){
					parser.call( self, childRecord, type );
				}
			} );
			break;
		default :
			parser = self.getParser( record, type );
			if( parser ){
				parser.call( self, record, type );
			}
			break;
	}
}

TimelineParser.prototype.getResult = function(){
	return this.result;
}

TimelineParser.prototype.allSupportedType = function(){
	var allRecordTypes = {};
	for( var parserType in this.parsers ){
		var parserConfig = this.parsers[parserType];
		var types = parserConfig.recordType;
		for( var type in types ){
			allRecordTypes[type] = 1;
		}
	}
	return allRecordTypes;
}

TimelineParser.prototype.getParser = function(record, type){
	if( type == 'all' ){
		for( var parserType in this.parsers ){
			var parserConfig = this.parsers[parserType];
			if( parserConfig.recordType[record.type] ){
				return parserConfig.parser;
			}
		}
	}else{
		if( this.parsers[type] && this.parsers[type].recordType[record.type] ){
			return this.parsers[type]['parser'];
		}
	}
	return null;
}

TimelineParser.prototype.NetworkParser = function(record, type){
	var self = this;
	if( type == 'network' || type == 'all' ){
		var children = record.children;
		if( children && children.length > 0 ){
			_.forEach( children, function(record, index){
				self.parse( record, type );
			} )
		}else{
			var data = record.data;
			var startTime = record.startTime;
			switch( record.type ){
				case "ResourceSendRequest":
					var requestId = data.requestId;
					this.startTime = startTime;
					var frameId = record.frameId;
					var url = data['url'];
					var requestMethod = data['requestMethod'];

					this.result['network']['requests'][requestId] = {
						frameId:frameId,
						startTime:startTime,
						endTime:startTime,
						url:url,
						requestMethod:requestMethod,
						encodedDataLength:0,
						didFail:false,
						networkTime:0,
						statusCode:200,
						mimeType:""
					}
					break;
				case "ResourceReceivedData":
					if( !this.startTime ) return;
					var requestId = data.requestId;
					if( this.result['network']['requests'][requestId] ){
						var encodedDataLength = data.encodedDataLength;
						this.result['network']['requests'][requestId].encodedDataLength += encodedDataLength;
					}
					break;
				case "ResourceReceiveResponse":
					if( !this.startTime ) return;
					var requestId = data.requestId;
					if( this.result['network']['requests'][requestId] ){
						var statusCode = data.statusCode;
						var mimeType = data.mimeType;
						this.result['network']['requests'][requestId].statusCode = statusCode;
						this.result['network']['requests'][requestId].mimeType = mimeType;
					}
					break;
				case "ResourceFinish":
					if( !this.startTime ) return;
					var requestId = data.requestId;
					if( this.result['network']['requests'][requestId] ){
						var didFail = data.didFail;
						var networkTime = data.networkTime;
						this.result['network']['requests'][requestId].didFail = didFail;
						this.result['network']['requests'][requestId].networkTime = networkTime;
						this.result['network']['requests'][requestId].endTime = startTime;

						var durationStart = this.result['network']['requests'][requestId].startTime;
						var durationEnd = this.result['network']['requests'][requestId].endTime;
						var duration = durationEnd - durationStart;
						if( duration > 0 ){
							this.result['network'].time += duration;
						}

					}
					break;
				case "ParseHTML":
					if( !this.startTime ) return;
					var endTime = record.endTime;
					var selfTime = endTime - startTime;
					var startLine = data.startLine;
					var endLine = data.endLine;
					var frameId = record.frameId;
					var stackTrace = record.stackTrace;
					if( !this.result['network']['parseHTMLs'] ){
						this.result['network']['parseHTMLs'] = [];
					}
					if( selfTime > 0 ){
						this.result['network'].time += selfTime;
					}
					this.result['network']['parseHTMLs'].push( {
						startTime:startTime,
						endTime:endTime,
						selfTime:selfTime,
						startLine:startLine,
						endLine:endLine,
						frameId:frameId,
						stackTrace:stackTrace
					} );
			}
		}
	}
	return {
		record:record,
		type:type
	}
};

TimelineParser.prototype.ScriptParser = function(record, type){
	var self = this;
	if( type == 'script' || type == 'all' ){
		var children = record.children;
		if( children && children.length > 0 ){
			_.forEach( children, function(record, index){
				self.parse( record, type );
			} )
		}else{
			if( !this.startTime ) return;
			var startTime = record.startTime;
			var data = record.data;
			switch( record.type ){
				case "EvaluateScript":
					var endTime = record.endTime;
					var selfTime = endTime - startTime;
					var frameId = record.frameId;
					var url = data.url;
					var lineNumber = data.lineNumber;

					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['script']['time'] += selfTime;
					}
					this.result['script'][record.type].push( {
						startTime:startTime,
						endTime:endTime,
						selfTime:selfTime,
						frameId:frameId,
						url:url,
						lineNumber:lineNumber
					} );
					break;
				case "AnimationFrameFired":
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					this.result.other.push( record.type );
					break;
				case "CancelAnimationFrame":
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					this.result.other.push( record.type );
					break;
				case "RequestAnimationFrame":
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					this.result.other.push( record.type );
					break;
				case "GCEvent":
					var endTime = record.endTime;
					var selfTime = endTime - startTime;
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['script']['time'] += selfTime;
					}
					this.result['script'][record.type].push( {
						startTime:record.startTime,
						endTime:endTime,
						selfTime:selfTime,
						useHeapSizeDelta:data['usedHeapSizeDelta']
					} );
					break;
				case "EventDispatch":
					var eventType = data.type;
					var endTime = record.endTime;
					var selfTime = endTime - startTime;
					var frameId = record.frameId;
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['script']['time'] += selfTime;
					}
					this.result['script'][record.type].push( {
						event:eventType,
						startTime:startTime,
						endTime:endTime,
						selfTime:selfTime,
						frameId:frameId
					} );
					break;
				case "FunctionCall":
					var endTime = record.endTime;
					var selfTime = endTime - startTime;
					var frameId = record.frameId;
					var scriptId = data.scriptId;
					var scriptName = data.scriptName;
					var scriptLine = data.scriptLine;
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['script']['time'] += selfTime;
					}
					this.result['script'][record.type].push( {
						startTime:startTime,
						endTime:endTime,
						selfTime:selfTime,
						frameId:frameId,
						scriptId:scriptId,
						scriptName:scriptName,
						scriptLine:scriptLine
					} );
					break;
				case "TimerInstall":
					var frameId = record.frameId;
					var timerId = data.timerId;
					var timeout = data.timeout;
					var singleShot = data.singleShot;
					var stackTrace = record.stackTrace;
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					this.result['script'][record.type].push( {
						startTime:startTime,
						frameId:frameId,
						timerId:timerId,
						timeout:timeout,
						singleShot:singleShot,
						stackTrace:stackTrace
					} );
					break;
				case "TimerFire":
					var endTime = record.endTime;
					var selfTime = endTime - startTime;
					var frameId = record.frameId;
					var timerId = data.timerId;
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['script']['time'] += selfTime;
					}
					this.result['script'][record.type].push( {
						startTime:startTime,
						endTime:endTime,
						selfTime:selfTime,
						frameId:frameId,
						timerId:timerId
					} );
					break;
				case "TimerRemove":
					var frameId = record.frameId;
					var timerId = data.timerId;
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					this.result['script'][record.type].push( {
						startTime:startTime,
						frameId:frameId,
						timerId:timerId
					} );
					break;
				case "XHRLoad":
					var endTime = record.endTime;
					var selfTime = endTime - startTime;
					var url = data.url;
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['script']['time'] += selfTime;
					}
					this.result['script'][record.type].push( {
						startTime:startTime,
						endTime:endTime,
						selfTime:selfTime,
						url:url,
						frameId:record.frameId
					} );
					break;
				case "XHRReadyStateChange":
					if( !this.result['script'][record.type] ){
						this.result['script'][record.type] = [];
					}
					this.result.other.push( record.type );
					break;
			}
		}
	}
};


TimelineParser.prototype.RenderParser = function(record, type){
	var self = this;
	if( type == 'render' || type == 'all' ){
		var children = record.children;
		if( children && children.length > 0 ){
			_.forEach( children, function(record, index){
				self.parse( record, type );
			} );
		}else{
			if( !this.startTime ) return;
			var startTime = record.startTime;
			var data = record.data;

			switch( record.type ){
				case 'InvalidateLayout':
					if( !this.result['render'][record.type] ){
						this.result['render'][record.type] = [];
					}
					this.result['render'][record.type].push( {
						startTime:startTime,
						frameId:record.frameId,
						stackTrace:record.stackTrace
					} );
					break;
				case 'Layout':
					var selfTime = record.endTime - startTime;
					if( !this.result['render'][record.type] ){
						this.result['render'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['render']['time'] += selfTime;
					}
					this.result['render'][record.type].push( {
						startTime:startTime,
						endTime:record.endTime,
						selfTime:selfTime,
						frameId:record.frameId,
						dirtyObjects:data.dirtyObjects,
						totalObjects:data.totalObjects,
						partialLayout:data.partialLayout,
						root:data.root,
						backendNodeId:data.backendNodeId
					} );
					break;
				case "RecalculateStyles":
					var selfTime = record.endTime - startTime;
					if( !this.result['render'][record.type] ){
						this.result['render'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['render']['time'] += selfTime;
					}
					this.result['render'][record.type].push( {
						startTime:startTime,
						endTime:record.endTime,
						selfTime:selfTime,
						elementCount:data.elementCount,
						frameId:record.frameId,
						stackTrace:record.stackTrace
					} );
					break;
				case "ScrollLayer":
					var selfTime = record.endTime - startTime;
					if( !this.result['render'][record.type] ){
						this.result['render'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['render']['time'] += selfTime;
					}
					this.result['render'][record.type].push( {
						startTime:startTime,
						endTime:record.endTime,
						selfTime:selfTime,
						frameId:record.frameId,
						backendNodeId:data.backendNodeId
					} );
					break;
				case "UpdateLayerTree":
					var selfTime = record.endTime - startTime;
					if( !this.result['render'][record.type] ){
						this.result['render'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['render']['time'] += selfTime;
					}
					this.result['render'][record.type].push( {
						startTime:startTime,
						endTime:record.endTime,
						selfTime:selfTime,
						layoutTree:data.layoutTree
					} );
					break;
			}
		}
	}
}

TimelineParser.prototype.PaintParser = function(record, type){
	var self = this;
	if( type == 'paint' || type == 'all' ){
		var children = record.children;
		if( children && children.length > 0 ){
			_.forEach( children, function(record, index){
				self.parse( record, type );
			} );
		}else{
			if( !this.startTime ) return;
			var startTime = record.startTime;
			var data = record.data;
			switch( record.type ){
				case "CompositeLayers":
					var selfTime = record.endTime - startTime
					if( !this.result['paint'][record.type] ){
						this.result['paint'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['paint']['time'] += selfTime;
					}
					this.result['paint'][record.type].push( {
						startTime:startTime,
						endTime:record.endTime,
						selfTime:selfTime
					} );
					break;
				case "DecodeImage":
					var selfTime = record.endTime - startTime;
					if( !this.result['paint'][record.type] ){
						this.result['paint'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['paint']['time'] += selfTime;
					}
					this.result['paint'][record.type].push( {
						endTime:record.endTime,
						selfTime:selfTime,
						backendNodeId:data.backendNodeId,
						"imageType":data.imageType,
						"url":data.url
					} );
					break;
				case "ResizeImage":
					var selfTime = record.endTime - startTime;
					if( !this.result['paint'][record.type] ){
						this.result['paint'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['paint']['time'] += selfTime;
					}
					break;
				case "Paint":
					var selfTime = record.endTime - startTime;
					if( !this.result['paint'][record.type] ){
						this.result['paint'][record.type] = [];
					}
					if( selfTime > 0 ){
						this.result['paint']['time'] += selfTime;
					}
					var clip = data.clip;
					var clipX = clip[0];
					var clipY = clip[1];
					var clipWidth = Math.round( Math.sqrt( Math.pow( clip[0] - clip[2], 2 ) + Math.pow( clip[1] - clip[3], 2 ) ) );
					var clipHeight = Math.round( Math.sqrt( Math.pow( clip[0] - clip[6], 2 ) + Math.pow( clip[1] - clip[7], 2 ) ) );
					this.result['paint'][record.type].push( {
						startTime:startTime,
						endTime:record.endTime,
						selfTime:selfTime,
						frameId:record.frameId,
						backendNodeId:data.backendNodeId,
						layerId:data.layerId,
						x:clipX,
						y:clipY,
						width:clipWidth,
						height:clipHeight
					} );
					break;
				case "MarkFirstPaint":
					if( !this.result['paint'][record.type] ){
						this.result['paint'][record.type] = [];
					}
					this.result['paint'][record.type].push( {
						startTime:startTime
					} );
					this.result.firstPaintTime = startTime - this.startTime;
					break;
			}
		}
	}
}

module.exports = TimelineParser;