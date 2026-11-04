//*******************************************************************
//                       測地系変換ライブラリ
//                              V 0.5
//                                        copyright: Geosense Inc.
//*******************************************************************
//
// このプログラムはライセンスフリーですので、商用かどうかは問わず、
// 自由にお使い下さい。また、改変,再配布も自由です。
// 但し、このプログラムの使用により発生した損害に関しては一切責任を
// 負いませんのでご了承下さい。
// なお、上記のcopyrightの行は消さないで下さい。改変した場合は改
// 変者の名前を追加して下さい。
//-------------------------------------------------------------------
//
//
//-------------------------------------------------------------------
//
// 参考文献：このプログラムは下記の文献を参考にしました。
//           「世界測地系と座標変換」 飛田幹男著　日本測量協会発行
//
//-------------------------------------------------------------------





//*******************************************************************
//                             定数
//------------------------------------------------------------------
//

var BESSEL = { 	a: 6377397.155,
				b: 6356078.96283244,
				f: 1 / 299.152813,
				e: 0.0816968311952638,
				e2: 0.00667437222734743
			};


var GRS80 = { 	a: 6378137,
				b: 6356752.31414036,
				f: 1 / 298.257222101,
				e: 0.0818191910428158,
				e2: 0.00669438002290079
			};

var PAR3_ITRF94_TOKYO97 = {
				t1: 146.414,
				t2: -507.337,
				t3: -680.507
			};

var ITRF94 = 1;
var TOKYO97 = 2;

var DEG2RAD = 0.01745329251994;
var RAD2DEG = 57.295779513082;


//*******************************************************************
//
// 世界測地系の緯度経度を日本測地系に変換する。
//
// 機能：世界測地系（ITRF94-GRS80)での緯度経度を旧日本測地系の緯度経度
//       に変換する。
//
// 引数：
//   (in)
//		convMode: 変換方法
//                  1: 全国を同じパラメータで行う(地形の歪を考慮しない）。
//                        結果はTokyo97-BESSEL
//                  2: 地域毎のパラメータで行う。（未実装）
//                        結果はTokyo-BESSEL
//		lat: 	緯度（度単位）
//		lon:  	経度（度単位）
//		height:	楕円体高（m)
//
// 戻り値 :  変換後の緯度経度(オブジェクト)
//		.lat: 	 緯度（度単位）
//		.lon:  	 経度（度単位）
//		.height: 楕円体高（m)
//      .err:    エラーコード(0:正常終了　負数:エラー）
//
//------------------------------------------------------------------
//
function geoDatumWorld2Tokyo( convMode, lat, lon, height )
{
	var xyz,xyz2
	var latlon = new Object();
	
	xyz = geoLatLon2XYZ( ITRF94, lat, lon, height )
	
	x = xyz.x + PAR3_ITRF94_TOKYO97.t1;
	y = xyz.y + PAR3_ITRF94_TOKYO97.t2;
	z = xyz.z + PAR3_ITRF94_TOKYO97.t3;

	latlon = geoXYZ2LatLon( TOKYO97, x, y, z )

	if ( convMode != 1 ) latlon.err = -1;
	else latlon.err = 0;

	return latlon;
}


//*******************************************************************
//
// 日本測地系の緯度経度を世界測地系に変換する。
//
// 機能：旧日本測地系での緯度経度を世界測地系（ITRF94-GRS80)の緯度経度
//       に変換する。
//
// 引数：
//   (in)
//		convMode: 変換方法
//                  1: 全国を同じパラメータで行う(地形の歪を考慮しない）。
//                        元の座標はTokyo97-BESSEL
//                  2: 地域毎のパラメータで行う。（未実装）
//                        元の座標はTokyo-BESSEL
//		lat: 	緯度（度単位）
//		lon:  	経度（度単位）
//		height:	楕円体高（m)
//
// 戻り値 :  変換後の緯度経度(オブジェクト)
//		.lat: 	 緯度（度単位）
//		.lon:  	 経度（度単位）
//		.height: 楕円体高（m)
//      .err:    エラーコード(0:正常終了　負数:エラー）
//
//------------------------------------------------------------------
//
function geoDatumTokyo2World( convMode, lat, lon, height )
{
	var xyz,xyz2
	var latlon = new Object();
	
	xyz = geoLatLon2XYZ( TOKYO97, lat, lon, height )
	
	x = xyz.x - PAR3_ITRF94_TOKYO97.t1;
	y = xyz.y - PAR3_ITRF94_TOKYO97.t2;
	z = xyz.z - PAR3_ITRF94_TOKYO97.t3;

	latlon = geoXYZ2LatLon( ITRF94, x, y, z )

	if ( convMode != 1 ) latlon.err = -1;
	else latlon.err = 0;

	return latlon;
}

//*******************************************************************
//
// 緯度経度を３次元直交座標値に変換する。
//
// 機能：同一の測地系において、地理的座標(楕円体面上の座標）を
//       ３次元直交座標に変換する。
//
// 引数：
//   (in)
//		dataum:	測地系（ 1:世界測地系(ITRF94-GRS80) 
//                       2:日本測地系（TOKYO97-BESSEL) )
//		lat: 	緯度（度単位）
//		lon:  	経度（度単位）
//		height:	楕円体高（m)
//
// 戻り値 : XYZ座標値(オブジェクト)
//          .x : X座標（m)
//          .y : Y座標（m)
//          .z : Z座標（m)
//          .err : エラーコード(0:正常終了　負数:エラー）
//
//------------------------------------------------------------------
//
function geoLatLon2XYZ( datum, lat, lon, height )
{
	var xyz = new Object();
	var a,e2,f;

	switch( datum ) {
		case ITRF94:
			a = GRS80.a;
			e2 = GRS80.e2;
			break;

		case TOKYO97:
			a = BESSEL.a;
			e2 = BESSEL.e2;
			break;

		default:
			xyz.err = -1; // 登録されていない測地系
			return xyz;
	}
			
	var B = lat * DEG2RAD;	
	var L = lon * DEG2RAD;

	var sinB = Math.sin(B);
	var cosB = Math.cos(B);
	var sinL = Math.sin(L);
	var cosL = Math.cos(L);

	var N = a / Math.sqrt( 1 - e2 * sinB * sinB );

	xyz.x = ( N + height ) * cosB * cosL;
	xyz.y = ( N + height ) * cosB * sinL;
	xyz.z = ( N * ( 1 - e2 ) + height ) * sinB;
	xyz.err = 0;

	return xyz;
}



//*******************************************************************
//
// ３次元直交座標値を緯度経度に変換する。
//
// 機能：同一の測地系において、３次元直交座標を
//       地理的座標(楕円体面上の座標）に変換する。
//
// 引数：
//   (in)
//		dataum:	測地系（ 1:世界測地系(ITRF94-GRS80) 2:日本測地系（TOKYO97-BESSEL) )
//      x : X座標（m)
//      y : Y座標（m)
//      z : Z座標（m)
//
// 戻り値 : 緯度経度(オブジェクト)
//		.lat: 	緯度（度単位）
//		.lon:  	経度（度単位）
//		.height:	楕円体高（m)
//      .err : エラーコード(0:正常終了　負数:エラー）
//
//------------------------------------------------------------------
//
function geoXYZ2LatLon( datum, x, y, z )
{
	var latlon = new Object();
	var a,e2,B,L;

	switch( datum ){
		case ITRF94:
			a = GRS80.a;
			e2 = GRS80.e2;
			f = GRS80.f;
			break;

		case TOKYO97:
			a = BESSEL.a;
			e2 = BESSEL.e2;
			f = BESSEL.f;
			break;

		default:
			latlon.err = -1; // 登録されていない測地系
			return latlon;
	}

	L = Math.atan2( y , x );

	var p = Math.sqrt( x * x + y * y );
	var r = Math.sqrt( p * p + z * z );
	
	var mu = Math.atan2( z  * ( 1 - f	+ e2 * a / r ), p );
	var sinMu = Math.sin( mu );
	var cosMu = Math.cos( mu );
	var sinMu3 = sinMu * sinMu * sinMu;
	var cosMu3 = cosMu * cosMu * cosMu;

	var b1 = z * ( 1 - f ) + e2 * a * sinMu3;
	var b2 = ( 1 - f ) * (p - e2 * a * cosMu3 );

	B = Math.atan2( b1 , b2 );

	var sinB = Math.sin( B );
	var cosB = Math.cos( B );
	var height = p * cosB + z * sinB - a * Math.sqrt( 1 - e2 * sinB * sinB ); 

	latlon.lat = B * RAD2DEG;
	latlon.lon = L * RAD2DEG;
	latlon.height = height;
	latlon.err = 0;

	return latlon;
}
