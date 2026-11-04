// ガウスクリューゲル投影による緯度経度と平面座標の変換を行う。
//
// 現在、第３項がコメントアウトしてある。１度以上広域で使う場合はコメントをはずす

var PI= 3.1415926535897932;
var DEG2RAD = 0.0174532925199433;
var RAD2DEG = 57.2957795130823;

var BESSEL_R = 6377397.155;
var BESSEL_F = 299.152813;
var GRS80_R = 6378137;
var GRS80_F = 298.257222101;

var mR = GRS80_R;
var mF = GRS80_F;
var mE2,mE4,mE6,mE8;
var mA,mB,mC,mD,mE;
var mR1_E2;
var mLat0,mLon0;
var mM0;
var mMer0;

// ガウスクリューゲル投影のためのパラメータを設定する。
//  (in) 
//    lat0    : 投影中心の緯度（度単位） 
//    lon0    :           経度
//    m0      : 線拡大率
//	  radius  : 準拠楕円体の長半径(m)   （GRS80の場合は0,BESSELの場合は１を指定）
//    f       : 　　　　　　扁平率の逆数（         〃          ）

function gkrugerSetParams( lat0, lon0, m0, radius, f )
{
	if ( radius < 100 ) {
		switch( radius ){
			case 0: mR = GRS80_R; mF = GRS80_F; break;
			case 1: mR = BESSEL_R; mF = BESSEL_F; break;
			default: mR = GRS80_R; mF = GRS80_F; break;
		}
	}
	else {
		mR = radius;
		mF = f;
	}

	mE2 = ( 2 - 1/mF ) / mF;
	mE4 = mE2 * mE2;
	mE6 = mE2 * mE4;
	mE8 = mE2 * mE6;
	
	mA = 1 + (3 * mE2 / 4) + (45 * mE4 / 64) + (175 * mE6 / 256 ) + (11025 * mE8 / 16384 );
	mB = (3 * mE2 / 4) + (15 * mE4 / 16) + (525 * mE6 / 512 ) + (2205 * mE8 / 2048 );
	mC = (15 * mE4 / 64) + (105 * mE6 / 256) + (2205 * mE8 / 4096);
	mD = (35 * mE6 / 512) + (315 * mE8 / 2048);
	mE = 315 * mE8 / 16384;
	mR1_E2 = mR * (1 - mE2);
	
	mLat0 = lat0 * DEG2RAD;
	mLon0 = lon0 * DEG2RAD;
	mM0 = m0;
	
	mMer0 = meridian(mLat0);
	
	return 0;
}


// 赤道からの子午線弧長を求める
//
//  (in) 
//	  lat : 緯度（radian）
//
//  戻り値＝ 子午線弧長（m）

function meridian( lat )
{
	var s;
	
	s = mR1_E2 * ( mA * lat -  mB * Math.sin(2 * lat) / 2  + mC * Math.sin(4 * lat) / 4
						- mD * Math.sin(6 * lat) / 6 + mE * Math.sin(8 * lat) / 8 );
	
	return s;
}

// ガウスクリューゲル投影により、緯度経度を平面座標に変換する。
//
//  (in)
//		lat		： 求める点の緯度（度）    
//		lon		： 　　　　　経度
//
//  戻り値＝　XY座標
//		xy.x		: X座標（ｍ）
//		xy.y		: Y座標（ｍ）

function gkrugerLatLon2XY( lat, lon, x, y )
{
	var t,c,s,t2,t4,c2,c4,clon,clon2,clon4,eta2,eta4,N,mer,yy,xx;
	
	lat *= DEG2RAD;
	lon *= DEG2RAD;
	
	lon -= mLon0;
	
	t = Math.tan(lat);
	c = Math.cos(lat);
	s = Math.sin(lat);
	
	t2 = t * t;
	t4 = t2 * t2;
	c2 = c * c;
	c4 = c2 * c2;
	clon = Math.cos(lat) * lon;
	clon2 = clon * clon;
	clon4 = clon2 * clon2;
	
	eta2 = mE2 * c2 / (1 - mE2);
	eta4 = eta2 * eta2;
	N = mR / Math.sqrt(1 - mE2 * s * s); 
	
	mer = meridian(lat) - mMer0;
	yy = mer + N * t * clon2 * ( 0.5 
				+ (5 - t2 + 9 * eta2 + 4 * eta4) * clon2 / 24
				+ (61 - 58 * t2 + t4 + 270 * eta2 - 330 * t2 * eta2 ) * clon4 / 720
		//for higher precision  + (1385 - 3111 * t2 + 543 * t4 - t4 * t2) * clon4 * clon2 / 40320
				);
	
	xx = N * clon * ( 1 
				+ (1 - t2 + eta2) * clon2 / 6
				+ (5 - 18 * t2 + t4 + 14 * eta2 - 58 * t2 * eta2 ) * clon4 / 120
		//for higher precision  + (61 - 479 * t2 + 179 * t4 - t4 * t2) * clon4 * clon2 / 5040
				);
	
	var xy = new Object();
	xy.x = xx * mM0;
	xy.y = yy * mM0;
	
	return xy;
}


//  ガウスクリューゲル投影により、平面座標を緯度経度に変換する。
//
//  (in)
//	x       ： 求める点のX座標（ｍ）
//	y       ： 　　　　　Y
//
//  戻り値＝　緯度経度が格納されたオブジェクト
//	latlon.lat     ： 緯度（度）
//	latlon.lon     ： 経度（度）


function gkrugerXY2LatLon( x, y )
{
	var footLat,diffMer,yMer,t,c,s,t2,t4,c2,c4,s2,eta2,eta4,N,N2,N4,x2,x4,lat1,lon1;

	x /= mM0;
	y /= mM0;
	
	// footpoint latitudeを求める
	footLat = mLat0;
	yMer = y + mMer0;
	while(1){
		diffMer = yMer - meridian( footLat );
		if ( diffMer > 0 ){
			if ( diffMer  < 0.001 ) break;	// 1mm
		}
		else if ( -diffMer  < 0.001 ) break;
		footLat += diffMer / mR1_E2;
	}

	//
	t = Math.tan(footLat);
	c = Math.cos(footLat);
	s = Math.sin(footLat);
	
	t2 = t * t;
	t4 = t2 * t2;
	c2 = c * c;
	c4 = c2 * c2;
	s2 = s * s;
	eta2 = mE2 * c2 / (1 - mE2);
	eta4 = eta2 * eta2;
	N = mR / Math.sqrt(1 - mE2 * s2); 
	N2 = N * N;
	N4 = N2 * N2;
	x2 = x * x;
	x4 = x2 * x2;
	
	lat1 = footLat + t * x2 / N2 * ( 
					(-1 - eta2) / 2
					+ (5 + 3 * t2 + 6 * eta2 - 6 * t2 * eta2 - 3 * eta4 - 9 * t2 * eta4 ) * x2 / 24 / N2
					+ (-61 - 90 * t2 - 45 * t4 - 107 * eta2 + 162 * t2 * eta2 + 45 * t4 * eta2 ) * x4 / 720 / N4 // 第３項
					);
	
	lon1 = x / ( N * c ) * ( 
					1 
					+ (-1 - 2 * t2 -eta2) * x2 / ( 6 * N2 )
					+ (5 + 28 *t2 + 24 * t4 + 6 * eta2 + 8 * t2 * eta2) * x4 / ( 120 * N4 ) // 第３項
					);
	var latlon = new Object();
	latlon.lat = lat1 * RAD2DEG;
	latlon.lon = (lon1 + mLon0) * RAD2DEG;

	return latlon;
}

