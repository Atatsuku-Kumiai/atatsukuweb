// 度単位のデータをmmの単位で丸める。

function roundDegree( degree )
{
	return parseInt( (degree * 1E8 + 0.5)  ) / 1E8;
}


// 度単位のデータを度分秒表示にする。
//
// degree    : 度単位のデータ。0または正の値。
// separator : 度分秒を区切る文字の並び
//             度の後に１文字目の文字、分の後に２文字目の文字，秒の後に３文字目の文字(あれば）を挿入する。
//             ""を指定すると、°′″ を指定したものとする。
//             "none" を指定するとdddmmss.sss の形式の文字列を返す。
//
// 戻り値　　：度分秒の文字列。
//
function Degree2Dms( degree, separator )
{
	var str = "";
	var deg = parseInt( degree );
	var min = parseInt( (degree - deg) * 60 );
	var sec = ( degree - deg - min / 60 ) * 3600;
	sec =  parseInt( (sec * 1E3 + 0.5)  ) / 1E3;		// 1msの桁で丸める。
	if ( sec == 60 ) {
		sec = 0;
		min++;
		if ( min == 60 ) {
			min = 0;
			deg++;
		}
	}
	
	if ( separator.indexOf("none") == 0 ){
		var dms = deg * 10000 + min * 100 + sec;
		return String( dms );
	}

	if ( ! separator )  separator = "°′″";
	var len = separator.length;
	if ( len == 1 ) separator = separator + separator ;

	str = deg + separator.charAt(0) + min + separator.charAt(1) + sec;
	if ( len == 3 ) str += separator.charAt(2);

	return str;
}

// 度単位のデータを度分表示にする。
//
// degree    : 度単位のデータ。0または正の値。
//
// 戻り値　　：度分の文字列(dddmm.mmmmmmm)。
//
function Degree2Dm( degree )
{
	var deg = parseInt( degree );
	var minutes = (degree - deg) * 60;
	var min = parseInt( minutes );
	var minf = Math.round( (minutes - min) * 1E5 ) ;	// 1msの桁で丸める。
	
	var str = String( deg * 100 + min ) + "." + String( minf ); 

	return str;
}
