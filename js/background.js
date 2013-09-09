var BG = {
	notification: {
		nslogElm: false,
		nslogRequest: false
	},
	nslogdata: {
	}
}

//添加数据
function addData(str){
	var obj = BG.nslogdata;
	var flag = true;
	for (var i in obj){
		if (obj[i].data === str){
			flag = false;
			break;
		}
	}
	var json = JSON.parse(str);
	var id_default = "";
	if (json && json["pos"]){
		id_default += "lv_"+json["pos"].replace(/\-/g,"_");
	}
	if (flag){
		var key = new Date()*1;
		BG.nslogdata[key] = {
			id: id_default,
			name: '',
			data: str
		}
	}
}

//url转json
function urlToJson(url) {
	var args = url.substring(url.indexOf('?') + 1);
	var result = {};
	var argsArr = args.split('&');
	for (var i = 0; i < argsArr.length; i++) {
		var kv = argsArr[i].split('=');
		if (kv.length == 2) {
			result[kv[0]] = decodeURIComponent(kv[1]);
		}
	};
	return result;
}

//nslog监控初始化
function nslogInit(param){
	if (!param || param == 'nslog'){
		chrome.tabs.executeScript(null, {code: "try{NSLOG.showNslogArea(" + BG.notification.nslogElm + ")}catch(e){}"});
		//chrome.tabs.executeScript(null, {code: "NSLOG.showNslogArea(" + BG.notification.nslogElm + ")"});
	}
	if (!param || param == 'request'){
		chrome.tabs.executeScript(null, {code: "try{NSLOG.showNslogRequestList(false," + BG.notification.nslogRequest + ")}catch(e){}"});
	}
}

//监控页面请求
chrome.webRequest.onBeforeRequest.addListener(function(details) {
	var args = urlToJson(details.url);
	if (args.pid == 308) {
		var notifi = BG.notification;
		chrome.tabs.executeScript(null, {code: "try{NSLOG.showNslogRequestList('" + JSON.stringify(args) + "',"+notifi.nslogRequest+")}catch(e){}"});
	}
	return {
		cancel: false
	};
}, { urls: ["*://nsclick.baidu.com/v.gif*"]});

//监控插件消息
chrome.extension.onMessage.addListener(function(req){
	if (req.type == 'save'){
		var w1 = req.data.stats, w2 = {type: 'adoc', name: req.name, title: req.title, stat: []};
		var w0 = req.data.commonConditions;
		for (var i=0,len1=w1.length; i<len1; i++){
			(function(){
				var type = w1[i].type;
				if (type == "Uniq"){
					type = "UniqCount";
				} else if (type == "Top"){
					type = "TopList";
				}
				var count = w1[i].vars[type];
				var obj = {};
				obj.key = count[0];
				obj.name = count[1];
				obj.stat = {};
				var common = w1[i].commonConditions;
				if (common*1 > 0){
					var stats_ex = w0[common-1].conditions;
					w1[i].conditions = w1[i].conditions.concat(stats_ex);
				}
				var con = w1[i].conditions;
				for (var j=0,len2=con.length; j<len2; j++){
					var key = con[j][0].substring(11);
					obj.stat[key] = con[j][2];
					if (key == 'type'){
						obj.type = con[j][2];
					}
				}
				obj.title = w2.title;
				w2.stat.push(obj);
			})();
		}
		chrome.tabs.create({
			url:'http://fe.baidu.com/doc/lv/rule/log/log_success.text'
		}, function(tab){
			setTimeout(function(){
				chrome.tabs.sendMessage(tab.id, w2, function(response){});
			}, 3000);
		});
	} else if (req.type == 'nslog'){
		BG.notification.nslogElm = req.status;
		nslogInit('nslog');
	} else if (req.type == 'request'){
		BG.notification.nslogRequest = req.status;
		nslogInit('request');
	} else if (req.type == 'loaded'){
		nslogInit();
	} else if (req.type == 'add'){
		addData(req.data);
	} else if (req.type == 'replace'){
		BG.nslogdata = req.data;
	} else if (req.type == 'clear'){
		BG.nslogdata = {};
	} else if (req.type == 'del'){
		delete BG.nslogdata[req.key];
	}
});

//监控页面切换
chrome.tabs.onActivated.addListener(function(activeInfo){
	chrome.tabs.get(activeInfo.tabId, function(Tab){
		if (/^http\:\/\/([\w-]+\.)+baidu\.com/.test(Tab.url)){
			nslogInit();
		}
	});
});

