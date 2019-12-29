// キャンバス本体
var ctx;

// サーバに接続
var socket = io.connect();

// グラフデータ
var graphData;
// 更新情報
var updateData;

var antNum;
var parameterQ;
var parameterN;
var maxHeight;
var speed;

var WIDTH = 1000;
var HEIGHT = 1000;

// チャート本体
var smoothie;
var line;

// サーバとの接続成功時の動作
socket.on('connect', function(){
	socket.on('greeting', function(data){
		console.log(data);
		var N = Number($('#form-N').val());
		var k = Number($('#form-k').val());
		var data = {"N": N, "k": k};
		socket.emit('generate_graph', JSON.stringify(data));
	});

	/* メッセージ受信時の動作 */

	// グラフ情報の受信
	socket.on('graph_info', function(data){
		console.log('receive graph info');
		graphData = $.parseJSON(data);
		drawGraph();
	});

	// 更新情報の受信時の動作
	socket.on('update_info', function(data){
		console.log('receive update info');
		updateData = $.parseJSON(data);
		updateGraph();
		updateTimeChart();
	})
});

// DOM要素の読み込み完了後処理
$(window).on('load', function(){
	// グラフキャンパスの準備
	var canvas = document.getElementById('canvas-area');
	if(canvas.getContext){
		ctx = canvas.getContext('2d');
	}
});

// グラフ生成ボタン
$('#btn-generate-graph').on('click', function(){
	var N = Number($('#form-N').val());
	var k = Number($('#form-k').val());

	if(k >= N){
		$('#message-graph').text('隣接ノード数はノード数より小さくしてください')
		return;
	}
	$('#message-graph').text('');

	var data = {"N": N, "k": k};
	socket.emit('generate_graph', JSON.stringify(data));

	$('#btn-control').children().text('start');

	parameterN = N;
});

// スタート/ストップ/リスタートボタン
$('#btn-control').on('click', function(){
	var btnState = $(this).text();
	if(btnState == 'start'){
		console.log('start');
		var alpha = Number($('#form-alpha').val());
		var beta = Number($('#form-beta').val());
		var ant_n = Number($('#form-ant-n').val());
		var p = Number($('#form-p').val());
		var q = Number($('#form-q').val());
		var frequency = Number($('#form-frequency').val());
		var data = {"alpha": alpha, "beta": beta, "ant_n": ant_n, "p": p, "q": q, "frequency": frequency};
		antNum = ant_n;
		parameterQ = q;
		maxHeight = Number($('#form-max-height').val());
		speed = Number($('#form-speed').val());
		prepareTimeChart();
		socket.emit('start', JSON.stringify(data));

		$(this).children().text('stop');
	}else if(btnState == 'stop'){
		console.log('stop');
		socket.emit('stop', '');

		$(this).children().text('restart');
	}else if(btnState == 'restart'){
		console.log('restart');
		socket.emit('restart', '');

		$(this).children().text('stop');
	}
});

// リセットボタン
$('#btn-reset').on('click', function(){
	console.log('reset');
	socket.emit('reset', '');

	$('#btn-control').children().text('start');
})

// グラフ生成後のグラフ描画
function drawGraph(){
	clearCanvas();
	drawEdges();
	drawNodes();
};

// グラフの更新
function updateGraph(){
	clearCanvas();
	updateEdges();
	drawNodes();
}

//キャンバスクリア
function clearCanvas(){
	ctx.fillStyle = 'rgb(245, 245, 245)';
	ctx.fillRect(0, 0, WIDTH, HEIGHT);
};

//ノードの描画
function drawNodes(){
	var p = graphData["pointer"];
	var length = p.length;
	for(var i=0; i<length; i++){
		var x = p[i]["x"];
		var y = p[i]["y"];
		ctx.beginPath();
		if(i == 0){
			ctx.fillStyle = 'rgb(200, 100, 100)';		
		}else{
			ctx.fillStyle = 'rgb(150, 200, 200)';
		}
		ctx.arc(locate(x), locate(y), 20, 0, Math.PI * 2.0, true);
		ctx.fill();
	}	
};

//エッジの描画
function drawEdges(){
	var p = graphData["pointer"];
	var e = graphData["edge"];
	var length = e.length;
	for(var i=0; i<length; i++){
		var x1 = p[e[i]["from"]]["x"];
		var y1 = p[e[i]["from"]]["y"];
		var x2 = p[e[i]["to"]]["x"];
		var y2 = p[e[i]["to"]]["y"];
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
		ctx.moveTo(locate(x1), locate(y1));
		ctx.lineTo(locate(x2), locate(y2));
		ctx.closePath();
		ctx.stroke();
	}
};

//フェロモン情報に基づいたエッジの描画
function updateEdges(){
	var p = graphData["pointer"];
	var ph = updateData["pheromones"];
	var length = ph.length;
	for(var i=0; i<length; i++){
		var x1 = p[ph[i]["path"]["from"]]["x"];
		var y1 = p[ph[i]["path"]["from"]]["y"];
		var x2 = p[ph[i]["path"]["to"]]["x"];
		var y2 = p[ph[i]["path"]["to"]]["y"];
		var value = ph[i]["value"];
		ctx.beginPath();
		ctx.lineWidth = value / antNum / parameterQ * 40  + 1;
		ctx.strokeStyle = 'rgba(0, 0, 0, ' + (value / antNum / parameterQ * 2 + 0.5) + ')';
		ctx.moveTo(locate(x1), locate(y1));
		ctx.lineTo(locate(x2), locate(y2));
		ctx.closePath();
		ctx.stroke();
	};
};

function locate(a){
	return a * 900 + 50;
};

// タイムチャートの準備
function prepareTimeChart(){
	// もとのチャートエリアを削除
	$('#chart-area').remove();
	// 新しいタイムチャートエリアのcanvasをはめこんで，横幅と縦幅を指定
	$('#chart-frame').prepend('<canvas id="chart-area" width="100" height="100" style="width:100%"></canvas>');
	var w = $('#chart-area').parent().width();
	$('#chart-area').attr('width', w);
	$('#chart-area').attr('height', w * 3 / 4);

	smoothie = new SmoothieChart({
		millisPerPixel: Math.max(40 - speed, 1),
		minValue: 0,
		maxValue: maxHeight,
		grid: {strokeStyle: 'rgb(200, 200, 200)', fillStyle: 'rgb(245, 245, 245)', verticalSections: 6},
		labels: {fillStyle: 'rgb(100, 100, 100)', fontSize: 20}
	});
	smoothie.streamTo($('#chart-area').get(0), 100);
	line = new TimeSeries();
	smoothie.addTimeSeries(line, {strokeStyle: 'rgb(50, 50, 50)', lineWidth: 10});
};

// タイムチャートの更新
function updateTimeChart(){
	var now = new Date().getTime();
	try{
		line.append(now, updateData["shortest_path"])
		$('#shortest-path').text(updateData["shortest_path"].toFixed(3));;
		$('#step').text(updateData["step"]);
	}catch(e){
	}
};
