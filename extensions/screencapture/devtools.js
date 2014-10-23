/**
 * Created by nant on 10/22/2014.
 */
console.log( "hello from devtools" );
chrome.devtools.panels.create( "Screenshot", "coldfusion10.png", "screenshot-panel.html", function(panel){
		console.log( "screenshot panel created!" );
	} );