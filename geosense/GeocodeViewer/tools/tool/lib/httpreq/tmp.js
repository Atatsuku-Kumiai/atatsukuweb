//
// XML HTTP Request 
// HTTP通信を使って,非同期で、WEBリソースを取得する。
//
// url  : 取得するリソースのURL
// postData : 'POST'するデータ。'GET'の場合は""を指定。
// callbackFunc : 通信が終了した場合に呼び出す関数
//                  callbackFunc( body, header ); bodyにHTTPの本文, headerにHTTPのヘッダーが
//                                                返される。
//                                                タイムアウトの場合はbodyに"timeout"が返る。
// (timeOutMilliSec) : タイムアウトまでの時間（ミリ秒で指定）
// (user) : ユーザ名
// (password): パスワード
// 
// ()書きの引数は,必要ない場合は指定しないか""を指定。
//
// 戻り値＝　０：正常終了（アクセス結果はcallbackFunc()を通じて取得する。）
//         負数：エラーコード
//     

var gTimerId;
function xmlHttpRequest( url, postData, callbackFunc, timeOutMilliSec, user, password )
{
	var xmlhttp = false;

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

	// 状態が遷移した時の処理. open()の後に定義（for IE)
	httpObj.onreadystatechange = function()
	{
		switch( httpObj.readyState ){
			case 0:
			case 1:
			case 2:
			case 3:
				break;

			case 4:	// 受信完了
				clearTimeout( gTimerId );
				callbackFunc( httpObj.responseText, httpObj.getAllResponseHeaders() );	
				break;
		}
	}

	if ( method == 'POST' ) httpObj.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	httpObj.send( postData );


	if ( timeOutMilliSec ){
  //	gTimerId = setTimeout( onTimeOut, timeOutMilliSec );

	}

	function onTimeOut() 
	{
		callbackFunc( "timeout", "" );
	}

	return 0;
}

