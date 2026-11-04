<?php
// YahooMapsのジオコーダにより、住所を緯度経度に変換する。
//
// 引数：GET変数 'address' : 検索したい住所文字列 
// 戻り値：　XML形式の検索結果
//
// 結果はXML形式で返される。フォーマットはYahooMapsの開発サイト参照。
// ピンポイントでマッチングできない時は複数の地点の緯度経度が返される。
// 

$address = $_GET['address'];

mb_regex_encoding( "UTF-8" );
$replace = "\.\.|[][&$*\|^?<>!/]";
//$address = mb_ereg_replace( $replace, "", $address );
if (preg_match('/\.\.|[&$*|^?<>!\/]/u', $address)) {
    http_response_code(400);
    exit('error: 住所文字列では使用されない文字が含まれています。');
}

//$gYahooLocalSearchUrl = "http://api.map.yahoo.co.jp/LocalSearchService/V1/LocalSearch";
$gYahooYolpUrl = "https://map.yahooapis.jp/geocode/V1/geoCoder";
$config = require dirname(__DIR__) . '/config.local.php';
$gYahooID = $config['Yahoo_ID'];

$url = $gYahooYolpUrl . "?" . http_build_query([
    "appid" => $gYahooID,
    "query" => $address,
], "", "&", PHP_QUERY_RFC3986);

$res = httpRequest($url, "", "");

if ($res === false) {
    error_log("Yahoo API connection failed.");
    http_response_code(502);
    exit;
}

error_log("Yahoo API response status: " . $res['header']);
error_log("Yahoo API response body: " . substr($res['body'], 0, 300));
error_log('Yahoo_ID configured: ' . (!empty($gYahooID) ? 'yes' : 'no'));

//$gYahooID = "maptools";
//$url = $gYahooYolpUrl . "?appid=" . $gYahooID . "&query=" . urlencode( $address );

$res = httpRequest( $url, "", "" );

error_log("Yahoo API HTTP response: " . $res['header']);
error_log("Yahoo API body: " . substr($res['body'], 0, 500));

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: If-Modified-Since');
echo $res['body'];
return;


// HTTPでサーバにアクセスする。
//
// $url : サーバのURLおよびサーチパス。認証はサポートしていない。
// $header : 追加ヘッダー。$bodyが""でないときは”Content-Type: text/xml"などContent-Typeを指定。
//           その他"User-Agent: " などを指定。
// $body   : POSTの本文。GETの場合は""を指定。
//
// 戻り値：サーバから返されたデータ（ヘッダーとボディ）。接続できなかった場合はfalseを返す。
//

function httpRequest($url, $header, $body)
{
    $ch = curl_init($url);

    if ($ch === false) {
        return false;
    }

    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ];

    if ($header !== "") {
        $headers = preg_split('/\r\n|\n|\r/', trim($header));
        $options[CURLOPT_HTTPHEADER] = $headers;
    }

    if ($body !== "") {
        $options[CURLOPT_POST] = true;
        $options[CURLOPT_POSTFIELDS] = $body;
    } else {
        $options[CURLOPT_HTTPGET] = true;
    }

    curl_setopt_array($ch, $options);

    $responseBody = curl_exec($ch);

    if ($responseBody === false) {
        error_log("Yahoo API cURL error: " . curl_error($ch));
        curl_close($ch);
        return false;
    }

    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    return [
        'header' => 'HTTP ' . $status,
        'body' => $responseBody,
        'status' => $status,
    ];
}



function xdebug( $message )
{
	$fp = fopen( "/tmp/phpdebug.txt", "a+" );
	fwrite( $fp, $message."\r\n" );
	fclose( $fp );
}

?>
