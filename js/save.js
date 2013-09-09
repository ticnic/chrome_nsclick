/*
var getWindow = function(w){
	var div = w.document.createElement('div');
	div.setAttribute('onclick', 'return window;');
	var unsafeWindow = div.onclick();
	return unsafeWindow;
}
*/
function insertJs(w, page){
	var div;
	if (w.document.getElementById('chrome-extend-proxy')){
		div = w.document.getElementById('chrome-extend-proxy');
	} else {
		div = w.document.createElement('div');
		div.id = "chrome-extend-proxy";
		w.document.body.appendChild(div);
	}
	var script = document.createElement('script');
	script.type = 'text/javascript';
	if (page == "log"){
		script.innerHTML = "var chromeData={};"
		+"if(window.pt){"
		+"chromeData.json = window.pt.getJSONData();"
		+"chromeData.title = $('.log-area-header>div').eq(0).text().substring(15);"
		+"$('#chrome-extend-proxy').attr('data-proxy', JSON.stringify(chromeData));"
		+"}else{"
		+"document.getElementById('chrome-extend-proxy').setAttribute('data-proxy', 0);"
		+"}";
	}
	w.document.body.appendChild(script);
	return div;
}
function getWindow(w){
	var proxy = w.document.getElementById('chrome-extend-proxy').getAttribute('data-proxy');
	if (proxy != 0){
		proxy = JSON.parse(proxy);
	}
	return proxy;
}
var unsafeWindowProxy, w;
if (window.frames['right']){
	w= window.frames['right'];
} else {
	w = window;
}
insertJs(w, 'log');
unsafeWindowProxy = getWindow(w);
if (unsafeWindowProxy != 0){
	if (confirm('确定要为此统计列表更新文档么？')){
		var w1 = {
			type: 'save',
			name: w.document.getElementById('sid').value,
			data: unsafeWindowProxy.json,
			title: unsafeWindowProxy.title
		}
		//console.log(w1);
		chrome.extension.sendMessage(w1);
	}
} else {
	alert('请在log平台使用此功能');
}