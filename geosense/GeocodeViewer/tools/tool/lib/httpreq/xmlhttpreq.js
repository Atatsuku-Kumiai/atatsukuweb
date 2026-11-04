//
// XML HTTP Request 
// HTTP通信を使って,非同期で、WEBリソースを取得する。
//
// url  : 取得するリソースのURL
// postData : 'POST'するデータ。'GET'の場合は""を指定。
// callbackFunc : 通信が終了した場合に呼び出す関数
//               callbackFunc( status, body, header ); 
//                         status      ：実行結果( -1:タイムアウト その他：HTTPステータス )
//                         body        ：HTTP本文
//                         header      ：HTTPヘッダ
// (timeoutMilliSec) : タイムアウトまでの時間（ミリ秒で指定）
// (user) : ユーザ名
// (password): パスワード
// 
// ()書きの引数は,必要ない場合は指定しないか""を指定。
//
// 注：urlまたはpostdataは、encodeURI(),encodeURIComponent()などにより、URLエンコードしておく。
//
// 戻り値＝　０：正常終了（アクセス結果はcallbackFunc()を通じて取得する。）
//         負数：エラーコード
//     
function xmlHttpRequest( url, postData, callbackFunc, timeoutMilliSec, user, password )
{
	var xmlhttp = false;
	var httpObj,method,syncFlag;
	var timerId;
	var timeout = false;

	// XMLHttpRequestオブジェクトの作成
	if ( window.XMLHttpRequest ){ // Firefox 用
		httpObj = new XMLHttpRequest();
	}
	else if ( window.ActiveXObject ){	// IE用
		try{
			httpObj = new ActiveXObject( "Msxml2.XMLHTTP" );
		} 
		catch(e){
			try {
				httpObj = new ActiveXObject( "Microsoft.XMLHTTP" );
			}
			catch(e){
				return -1;
			}
		}
	}
	else return -2;
	
	if ( postData ) method = 'POST';
	else method = 'GET';
	httpObj.open( method, url, true, user, password );	

	if ( timeoutMilliSec ){
	  	timerId = setTimeout( onTimeout, timeoutMilliSec );
	}

	// 状態が遷移した時の処理. open()の後に定義（for IE)
	httpObj.onreadystatechange = function()
	{
		switch( httpObj.readyState ){
			case 0: // uninitialized
			case 1: // loading
			case 2: // loaded
			case 3: // interactive
				break;

			case 4: // complete
				clearTimeout( timerId );
				if ( ! timeout )
					callbackFunc( httpObj.status, httpObj.responseText, httpObj.getAllResponseHeaders() );	
				break;
		}
	}

	if ( method == 'POST' ) httpObj.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	httpObj.setRequestHeader( "If-Modified-Since", "Sat, 01 Jan 2000 00:00:00 GMT" ); // IEキャッシュ対策

	httpObj.send( postData );

	function onTimeout() 
	{
		timeout = true;
		httpObj.abort();
		callbackFunc( -1, "", "" );
	}

	return 0;
}
