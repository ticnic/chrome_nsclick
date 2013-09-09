function encodeHTML(str){
	str = String(str).replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
	return str;
}
function checkInput(elem){
	var flag = true;
	$(elem).find('input:text').each(function(i,item){
		if ($.trim($(item).val()) == ''){
			$(item).addClass('nslog-list-log-err');
			flag = false;
		} else {
			$(item).removeClass('nslog-list-log-err');
		}
	});
	return flag;
}
function getData(){
	var dataNew = {};
	$('#nslog-list-log-table tbody tr').each(function(i,item){
		var key = $(item).attr('id').substring(5);
		var inputs = $(item).find('input');
		dataNew[key] = {
			id: inputs.eq(0).val(),
			name: inputs.eq(1).val(),
			data: inputs.eq(2).val()
		}
	});
	return dataNew;
}
var inputWidthArr = ["80","80","180"];
if (localStorage.getItem('tongji_options') != null){
	inputWidthArr = localStorage.getItem('tongji_options').split("|");
}
var inputWidth0 = inputWidthArr[0] < 80 ? "80px" : inputWidthArr[0]+"px";
var inputWidth1 = inputWidthArr[1] < 80 ? "80px" : inputWidthArr[1]+"px";
var inputWidth2 = inputWidthArr[2] <180 ? "180px" : inputWidthArr[2]+"px";
$('#save').click(function(){
	chrome.tabs.executeScript(null, {file: "js/save.js"});
});
$('#add').click(function(){
	var time = new Date()*1;
	var html = '<tr id="data_'+time+'">'
			+'<td><input class="nslog-list-log-input" type="text" style="width:'+inputWidth0+'" /></td>'
			+'<td><input class="nslog-list-log-input" type="text" style="width:'+inputWidth1+'" /></td>'
			+'<td><input type="text" class="nslog-list-input" style="width:'+inputWidth2+'" /></td>'
			+'<td><span class="nslog-list-log-del">X</span></td>'
		+'</tr>';
	$('#nslog-list-log-table tbody').append(html);
	$('#nslog-list-log').show();
});
$('#clear').click(function(){
	$('#nslog-list-log').hide().find('tbody').empty();
	chrome.extension.sendMessage({type:'clear'});
});
$('#nslog').click(function(){
	var status = $(this).attr('status');
	status = status == 'false' ? false : true;
	chrome.extension.sendMessage({type:'nslog',status:status});
	var statusNew = !!status ? false : true;
	var textNew = !!statusNew ? '开启nslog页面监控' : '关闭nslog页面监控';
	$(this).text(textNew).attr('status',statusNew);
});
$('#request').click(function(){
	var status = $(this).attr('status');
	status = status == 'false' ? false : true;
	chrome.extension.sendMessage({type:'request',status:status});
	var statusNew = !!status ? false : true;
	var textNew = !!statusNew ? '开启nslog请求监控' : '关闭nslog请求监控';
	$(this).text(textNew).attr('status',statusNew);
});
$('#nslog-list-log-save').click(function(){
	var dataNew = getData();
	chrome.extension.sendMessage({type:'replace',data:dataNew});
});
$('#nslog-list-log-table input:text').live('blur',function(){
	var dataNew = getData();
	chrome.extension.sendMessage({type:'replace',data:dataNew});
});
$('#nslog-list-log-submit').click(function(){
	if (checkInput($('#nslog-list-log-table')[0]) == false){
		return;
	}
	var data = getData();
	chrome.extension.sendMessage({type:'replace',data:data});
	chrome.tabs.executeScript(null, {code: "NSLOG.addNslog(" + JSON.stringify(data) + ")"});
});
$('#nslog-list-log-table .nslog-list-log-del').live('click', function(){
	var $parent = $(this).parents('tr');
	var key = $parent.eq(0).attr('id').substring(5);
	$parent.eq(0).remove();
	chrome.extension.sendMessage({type:'del',key:key});
	if ($('#nslog-list-log-table tbody tr').length == 0){
		$('#nslog-list-log').hide();
	}
});
function popupInit(){
	var bgpg = chrome.extension.getBackgroundPage();
	var notifi = bgpg.BG.notification;
	if (notifi.nslogElm) {
		$('#nslog').text('关闭nslog页面监控').attr('status', false);
	}
	//toggleNslog(notifi.nslogElm);
	if (notifi.nslogRequest) {
		$('#request').text('关闭nslog请求监控').attr('status', false);
	}
	//toggleNslog(notifi.nslogRequest);
}
function listRender(){
	var bgpg = chrome.extension.getBackgroundPage();
	var data = bgpg.BG.nslogdata;
	if ($.isEmptyObject(data)){
		return false;
	}
	var html = '';
	$.each(data, function(i,item){
		html += '<tr id="data_'+i+'">'
			+'<td><input class="nslog-list-log-input" type="text" value="'+encodeHTML(item.id)+'" style="width:'+inputWidth0+'" /></td>'
			+'<td><input class="nslog-list-log-input" type="text" value="'+encodeHTML(item.name)+'" style="width:'+inputWidth1+'" /></td>'
			+'<td><input type="text" class="nslog-list-input" value="'+encodeHTML(item.data)+'" style="width:'+inputWidth2+'" /></td>'
			+'<td><span class="nslog-list-log-del">X</span></td>'
		+'</tr>';
	});
	$('#nslog-list-log-table tbody').html(html);
	$('#nslog-list-log').show();
}
popupInit();
listRender();

chrome.extension.onMessage.addListener(function(req){
	if (req.type == 'addComplete'){
		$('#nslog-list-log').hide().find('tbody').empty();
		//chrome.extension.sendMessage({type:'clear'});
	}
});