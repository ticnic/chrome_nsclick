var inputInit = function(){
	var inputStr = localStorage.getItem('tongji_options');
	if (inputStr){
		var inputArr = inputStr.split("|");
		$('#inputWidth0').val(inputArr[0]);
		$('#inputWidth1').val(inputArr[1]);
		$('#inputWidth2').val(inputArr[2]);
	}
}
inputInit();

$('#inputSave').click(function(){
	var inputStr = $('#inputWidth0').val() + "|" + $('#inputWidth1').val() + "|" + $('#inputWidth2').val();
	localStorage.setItem('tongji_options',inputStr);
});

