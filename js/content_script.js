/*
function getWindow(w){
	var div = w.document.createElement('div');
	div.setAttribute('onclick', 'return window;');
	var unsafeWindow = div.onclick();
	return unsafeWindow;
}
*/
function insertJs(w, page, data){
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
	if (page == "log" && data){
		script.innerHTML = "if(window.pt){"
		+"$('#chrome-extend-proxy').attr('data-proxy', '"+JSON.stringify(data)+"')"
		+"}else{"
		+"document.getElementById('chrome-extend-proxy').setAttribute('data-proxy', 0);"
		+"};"
		+"var chrome_lv_parseStat = function(stats){"
			+"if(stats.length == 0) return;"
			+"setTimeout(function(){"
				+"var stat = stats.splice(0,1)[0];"
				+"pt.addStat(stat.type,stat,false,false,true);"
				+"chrome_lv_parseStat(stats);"
			+"},0);"
		+"};";
		w.document.getElementById('chrome-extend-proxy').innerHTML = '<a id="chrome-extend-proxy-trigger" onclick="if (pt.checkData()){chrome_lv_parseStat(JSON.parse(this.parentNode.getAttribute(\'data-proxy\')));this.title=\'true\';alert(\'已成功添加，请检查\');}else{alert(\'请选择数据源\')}"></a>';
	} else if (page == "adoc"){
		script.innerHTML = "var chromeData = {adocActionPath:window.adocActionPath,TRANSMIT_OK_FLAG:window.TRANSMIT_OK_FLAG};"
		+"$('#chrome-extend-proxy').attr('data-proxy', JSON.stringify(chromeData))";
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
function encodeHTML(str){
	str = String(str).replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
	return str;
}
var NSLOG = {
	//初始化标记
	hasInit: false,
	//nslog区域显示标记
	hasShow: false,
	//显示nslog区域
	showNslogArea: function(isShow){
		this.init();
		if (!isShow){
			this.clearNslogArea();
			return;
		}
		if (this.hasShow){
			return;
		}
		$(".nslog").add(".nslog-area").each(function(i,item){
			if (item.offsetWidth == 0 || $(item).parents('#J-home-progeress').length>0) {
				return;
			}
			var dataStr = $(item).attr('data-nslog');
			if (!dataStr){ return; }
			dataStr = dataStr.replace(/'([^']*)'/g, '"$1"');
			var data;
			try{
				data = $.parseJSON(dataStr);
			}catch(e){
				console.log('Nslog Error: '+dataStr);
			}
			if (data && data.type) {
				$(item).addClass('chrome-expand-nslog-area-outline');
				var pos = $(item).offset();
				var $ele = $('<div class="chrome-expand-nslog-place"></div>');
				$ele.appendTo('#chrome-expand-nslogContainer').offset(pos).text(data.type).attr('data-nslog',dataStr);
			}
		});
		this.hasShow = true;
	},
	clearNslogArea: function(){
		$('#chrome-expand-nslogContainer').empty();
		$('.chrome-expand-nslog-area-outline').removeClass('chrome-expand-nslog-area-outline');
		this.hasShow = false;
	},
	//显示nslog请求
	showNslogRequestList: function(params,isHide) {
		this.init();
		if (!isHide) {
			$('#chrome-expand-nslogRequestList').hide();
			return;
		}
		$('#chrome-expand-nslogRequestList').show();
		if (!params) {
			return;
		}
		params = JSON.parse(params);
		var data = {};
		for (var key in params){
			if (key != 'pid' && key != 'url' && key != 'x' && key != 'y' && key != 't'){
				data[key] = params[key];
			}
		}
		var time = new Date(params.t*1);
		var hour = time.getHours();
		hour = hour<10 ? '0'+hour : hour;
		var minute = time.getMinutes();
		minute = minute<10 ? '0'+minute : minute;
		var second = time.getSeconds();
		second = second<10 ? '0'+second : second;
		time = hour + ':' + minute + ':' + second;
		var html = '<li title="'+params.url+'"><time><span class="chrome-expand-addLog" data-nslog="'+encodeHTML(JSON.stringify(data))+'">+</span>'+time+'发起了请求</time><em>'+JSON.stringify(data)+'</em></li>';
		$('#chrome-expand-nslogRequestList ul').append(html);
	},
	//添加统计项
	addNslog: function(params){
		var str = '如果统计列表没有选择数据源，会导致失败!!!\n\n以下信息将注入当前统计列表，请仔细检查!!!\n';
		$.each(params, function(i,item){
			var print = {};
			print.id = item.id;
			print.name = item.name;
			$.extend(print, JSON.parse(item.data));
			str += JSON.stringify(print);
			str += '\n';
		});
		if(confirm(str)){
		var w;
		//alert(JSON.stringify(params));
		var output = [];
		$.each(params, function(i,item){
			var obj = {
				type:"",
				vars:{},
				params:{},
				conditions:[['','','']],
				commonConditions:0,
				comments:''
			};
			obj.type = "Count";
			obj.vars = {
				Count: [item.id,item.name,"0"]
			};
			obj.conditions = [];
			var param = JSON.parse(item.data);
			var haspid = false;
			$.each(param, function(j,jtem){
				var arr = [];
				arr[0] = "_UrlFields."+j;
				arr[1] = "===";
				arr[2] = jtem+"";
				obj.conditions.push(arr);
				if (j == "pid"){
					haspid = true;
				}
			});
			//如果没有pid则补上
			if (!haspid){
				var pid_arr = [];
				pid_arr[0] = "_UrlFields.pid";
				pid_arr[1] = "===";
				pid_arr[2] = "308";
				obj.conditions.push(pid_arr);
			}
			output.push(obj);
		});
		if (window.frames['right']){
			w = window.frames['right'];
		} else {
			w = window;
		}
		insertJs(w, 'log', output);
		var proxy = getWindow(w);
		if (proxy != 0){
			var evt = w.document.createEvent("MouseEvents");
			evt.initEvent("click", true, true);
			w.document.getElementById('chrome-extend-proxy-trigger').dispatchEvent(evt);
			if (w.document.getElementById('chrome-extend-proxy-trigger').title == 'true'){
				chrome.extension.sendMessage({type:'addComplete'});
				chrome.extension.sendMessage({type:'clear'});
			}
			/*
			if (w.pt.checkData()){
				w.pt.parseStat(output);
				alert('已成功添加，请检查');
			} else {
				alert('请选择数据源');
			}
			*/
		} else {
			alert('请在log平台使用此功能');
		}
		}
	},
	//初始化
	init: function(){
		if (this.hasInit){
			return false;
		}
		$('body').append('<div id="chrome-expand-nslogContainer"></div>');
		var $add = $('<span id="chrome-expand-addLog">+</span>');
		$add[0].onclick = function(){
			var dataStr = $add.parent().attr('data-nslog');
			if (window.confirm('将添加此统计到列表，请确认\n'+dataStr)){
				chrome.extension.sendMessage({type:'add',data:dataStr});
			}
		}
		$('#chrome-expand-nslogContainer .chrome-expand-nslog-place').live('mouseenter', function(e){
			var dataStr = $(this).attr('data-nslog');
			$(this).text(dataStr.slice(1,-1));
			$(this).prepend($add);
		});
		$('#chrome-expand-nslogContainer .chrome-expand-nslog-place').live('mouseleave', function(e){
			var dataStr = $(this).attr('data-nslog');
			var data = JSON.parse(dataStr);
			$(this).text(data.type);
		});
		$('body').append('<div id="chrome-expand-nslogRequestList"><header>防侧漏NSLOG请求监听器</header><ul></ul><button type="button" class="chrome-expand-btn-clear">清空</button><button type="button" class="chrome-expand-btn-close">收起</button></div>');
		$('#chrome-expand-nslogRequestList').draggable({
			handle:'header'
		});
		$('#chrome-expand-nslogRequestList .chrome-expand-btn-close').toggle(function(){
			$('#chrome-expand-nslogRequestList').addClass('close');
			$(this).text('展开');
		},function () {
			$('#chrome-expand-nslogRequestList').removeClass('close')
			$(this).text('收起');
		});
		//清空
		$('#chrome-expand-nslogRequestList .chrome-expand-btn-clear').click(function(){
			$('#chrome-expand-nslogRequestList ul').empty();
		});
		$('#chrome-expand-nslogRequestList .chrome-expand-addLog').live('click', function(e){
			var dataStr = $(this).attr('data-nslog');
			if (window.confirm('将添加此统计到列表，请确认\n'+dataStr)){
				chrome.extension.sendMessage({type:'add',data:dataStr});
			}
		});
		this.hasInit = true;
	}
}

chrome.extension.onMessage.addListener(function(req){
	if (req.type == 'adoc'){
		insertJs(window, 'adoc');
		var unsafeWindow = getWindow(window);
		/*
		if (!unsafeWindow.ADOC){
			return;
		}
		*/
		var params = {
			act: "submit", 
			content: JSON.stringify(req.stat),
			message: 'nslog edit',
			path: '/rule/json/'+req.name+'.json',
			t: Math.random()
		}
		$.post(unsafeWindow.adocActionPath, params, function(t){
				var data = eval(t);
				if(typeof data == "string") { //提交失败
					$('#submit').text(data);
				}
				if(typeof data == "object") { //提交成功返回一个数组
					if(data.length == 0 || data[1] == unsafeWindow.TRANSMIT_OK_FLAG) {
						$('#submit').text('更新成功');
					}
				}
		});
	}
});

//页面加载完毕
chrome.extension.sendMessage({type:'loaded'});

//var unsafe = getWindow(window);
//console.log($('#chrome-extend-proxy').attr('data-proxy'));