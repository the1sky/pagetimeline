/**
 * Created by nant on 10/22/2014.
 */
console.log("panel.js");

setInterval(function(){
	chrome.extension.sendMessage({msg:'capture_window'});
},10);