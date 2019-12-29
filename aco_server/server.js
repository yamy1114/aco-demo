/*
 *　大域変数達
 *
 */

n = 10;
k = 3;

nodes = []; // ノードの座標　２次元ベクトルの配列
links = []; // リンクのリスト　
link_w =[]; //  リンク間の重み
link_d = [];

phero = []; //フェロモン

alpha =1;	//
beta = 0.5;

ant_n = 200;
ant_path = [];
step = 0;
frequency = 100;

shortest_pass = [];

p= 0.01;
q =10;

cont =true;
/*
 * debug
*/
 loop = 30;

/*
 *関数群
 *
 */

function shuffle(array) {
  var n = array.length, t, i;

  while (n) {
    i = Math.floor(Math.random() * n--);
    t = array[n];
    array[n] = array[i];
    array[i] = t;
  }

  return array;
}


function make_glaph(){
	// nodes の作成
	nodes = new Array();
	for(var i = 0; i < n; i++) { 
  		nodes[i] = new Array();
  		for(var j = 0; j < 2; j++) {
  			nodes[i][j] = Math.random();
		}
	}
	
	var nck = new Array();
	for(var i = 0; i < n-1; i++) { 
		nck[i] = i;
	}
	// 有向辺の作成
	
	links = new Array();
	for(var i = 0; i < n; i++) { 
  		nck = shuffle(nck);
  		for(var j = 0; j < k; j++) {
  			var t = nck[j];
  			if(t == i){
  				t=n-1;
  			}
  			links[i*k+j]=[i,t];
  		}
	}
	
	//距離の算出と行列化
		//初期化
	link_w = new Array();
	link_d = new Array();
	for(var i = 0; i < n; i++) {
		link_w[i] = new Array();
		link_d[i] = new Array();
  		for(var j = 0; j < n; j++) {
  		 	link_w[i][j] = 0;
  		 	link_d[i][j] = 0;
  		}
	}
		//リンクがある部分の重みを更新
	for(var i=0;i<n*k;i++){
		var x = (nodes[links[i][0]][0]-nodes[links[i][1]][0]);
		var y = (nodes[links[i][0]][1]-nodes[links[i][1]][1]);
		link_w[links[i][0]][links[i][1]] = 1/Math.sqrt(x*x+y*y); //デバッグ用　小数点が消えてる
		link_d[links[i][0]][links[i][1]] = Math.sqrt(x*x+y*y); //デバッグ用　小数点が消えてる
		
	}
}

function cul_aco(){
	// aij を計算
	//pij を計算
	
	aij = new Array();
	for(var i=0;i<n;i++){
		aij[i] = new Array();
		aij[i][n] = 0;
		for(var j=0;j<n;j++){
			if(link_w[i][j]!=0){
			aij[i][j] = Math.pow(phero[i][j],alpha) * Math.pow(link_w[i][j],beta);
			}else{
				aij[i][j] = 0;
			}
		}
	}
	

/*
	ループ１　あり　0~ ant_n
		ループ２　0~n
			経路を最後まで求める
			ループ３
				pij を計算　
				全部０になったらアリの死亡
				最後帰れるか計算
				帰れなくても死亡
			アリの次の行先を決定する

	フェロモンをセット　で１ループ終了
*/
	ant_path = new Array();
	for(var a = 0;a<ant_n;a++){
		ant_path[a] = new Array();
		ant_path[a][0] = 0; //始点はノード０
		
		var passing = new Array(); //passing 通ったら０にする⇒計算が簡単に！
		passing[0] =0;
		for(var i=1;i<n;i++){
			passing[i] = 1;
		}
		
		corrent_position = 0;
		
		for(var num_path=1;num_path<n;num_path++){
			var pij = new Array()
			var sump =0;
			for(var j=0;j<n;j++){
				sump += passing[j]*aij[corrent_position][j];
			}
			if(sump==0){
				ant_path[a][0] = -3;
				break;
			}
			var rand = Math.random();
			for(var j=1;j<n;j++){

				rand -=passing[j]*aij[corrent_position][j]/sump;
				if(rand<0){
					corrent_position = j;
					passing[j] =0;
					ant_path[a][num_path]= j;
					break;
				}
			}
			
			if(rand>0){//アリの死亡
				ant_path[a][0] = -2;
				break;
			}
		}
		if(link_w[corrent_position][0]==0){//最後の点から帰れない　アリの死亡
			ant_path[a][0] = -1;
		}
	}

	
	//経路長の計算
	var path_length = new Array();
	var min_length = 100;
	var min_a = 1;
	for(var a = 0; a<ant_n;a++){
		path_length[a]=0;
		if(ant_path[a][0]==0){ //アリが死んでいない（-1　死亡）
			for(var i = 0;i<n-1;i++){
				path_length[a] += link_d[ant_path[a][i]][ant_path[a][i+1]];
			}
			path_length[a] += link_d[ant_path[a][n-1]][0];
			if(min_length > path_length[a]){
				min_length = path_length[a];
				min_a = a;
			}
		}
	}	
	//フェロモン行列の更新
		//蒸発
	for(var i=0;i<n;i++){
		for(var j=0;j<n;j++){
			phero[i][j]*=p;
		}
	}
		//アリが残す奴
	for(var a = 0; a<ant_n;a++){
		if(ant_path[a][0]==0){// たどり着いた奴だけ撒ける
			for(var i = 0;i<n-1;i++){
				phero[ant_path[a][i]][ant_path[a][i+1]] += q/(path_length[a]);
			}
			phero[ant_path[a][i]][0]+= q/(path_length[a]);
		}
	}
	var pherodebug = new Array();
	for(var i=0;i<n;i++){
		pherodebug[i] = new Array();
		for(var j=0;j<n;j++){
			pherodebug[i][j] = Math.floor(phero[i][j]);
		}
	}
	

	
	//最短経路の保存
	shortest_pass[step] = min_length;
	step++;
}


function set_parameter(){
	
	step =0;
	
	shortest_pass = new Array();
	
	//　フェロモン行列の初期化
	phero = new Array();
	for(var i=0;i<n;i++){
		phero[i] = new Array();
		for(var j=0;j<n;j++){
			phero[i][j] = 1;
		}
	}
	
	ant_path = new Array(); // -1 で初期化
	for(var i=0;i<ant_n;i++){
		ant_path[i] = new Array();
		for(var j=0;j<n;j++){
			ant_path[i][j] = -1;
		}
	}
	
	
}


function xn(x,nn){
	var z = x;
	for(var i=0;i<nn-1;i++){
		z *=x;
	}
	if(nn == 0){
		return 1;
	}
	return z;
}

function glaph_info(){
	var str;
	var bstr="{\"x\":" + nodes[0][0] + ",\"y\":" + nodes[0][1] + "}";
	for(var i = 1;i<n;i++){
		bstr += ",{\"x\":" + nodes[i][0] + ",\"y\":" + nodes[i][1] + "}";
	}

	
	
	b2str = "{\"from\":" + links[0][0] + ",\"to\":" + links[0][1] + "}";
	for(var i = 1;i<n*k;i++){
		b2str += ",{\"from\":" + links[i][0] + ",\"to\":" + links[i][1] + "}";
	}
	b2str = "\"edge\":[" + b2str + "]";
	
	str= '{"pointer":[' + bstr + '],' + b2str + '}';
	return str ;
}

function reset_data(){
	return "reset_done";
}


function update_info(){
	var to = links[0][0];
	var en = links[0][1];
	var bstr ="{\"path\":{\"from\":" + to +  ",\"to\":" + en + "},\"value\":" + phero[to][en] + "}";
		
	for(i=1;i<n*k;i++){
		to = links[i][0];
		en = links[i][1];
		bstr+=",{\"path\":{\"from\":" + to +  ",\"to\":" + en + "},\"value\":" + phero[to][en] + "}";
	}
	bstr = "\"pheromones\":[" + bstr + "]";
	bstr += ",\"shortest_path\":" + shortest_pass[step - 1];
	return "{" + bstr + ", \"step\": " + step + "}";
}





/************************************************************************************************


メイン関数　みたいな奴！！！！！！！！！！！！


*************************************************************************************************/




// 受付ポートの指定
var PORT = 3000;

// おまじない 
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('../aco_client'));

// クライアントとの接続成功時の処理
io.sockets.on('connection', function(socket){
	// 接続成功時にメッセージを送る	
	socket.emit('greeting', 'websocket connect success');
/*
	// 以下にクライアントからのメッセージを受信した際の動作を定義していく
	socket.on('calc_request', function(data){
		var a = Number(data.split('&')[0]);
		var b = Number(data.split('&')[1]);
		console.log('a=' + a + ' b=' + b);
		// a+b を送り返す
		socket.emit('calc_result', a+b);
	});
*/
	socket.on('generate_graph',function(data){
		
		set_parameter();
		cont = false;
		
		var obj = JSON.parse(data);
		n = obj.N;
		k = obj.k;
		make_glaph();
		socket.emit("graph_info",glaph_info());
	});
	socket.on('start',function(data){
		
		function aco_Loop(){
			if(cont==true){
	    		cul_aco();
    			socket.emit("update_info",update_info());
    			setTimeout(function(){aco_Loop()}, frequency);
  			}
		}
		
		var obj = JSON.parse(data);
		alpha = obj.alpha;
		beta = obj.beta;
		ant_n = obj.ant_n;
		p = obj.p;
		q = obj.q;
		frequency = obj.frequency * 10;	

		set_parameter();

		cont = true;
		aco_Loop();
		
	});
	
	socket.on('stop',function(data){
		cont = false;
		
	});
	
	
	socket.on('restart',function(data){
		function aco_Loop(){
			if(cont==true){
	    		cul_aco();
    			socket.emit("update_info",update_info());
    			setTimeout(function(){aco_Loop()}, frequency);
  			}
		}
		cont = true;
		aco_Loop();
		
	});
	
	socket.on('reset',function(data){
		cont = false;
		socket.emit("reset_done","");
	});

});

// サーバの起動
http.listen(PORT, function(){
	console.log('server listen on port ' + PORT);
});
