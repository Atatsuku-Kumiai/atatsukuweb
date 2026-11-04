<html>
<head>
<script type="text/javascript" src="datumconv2.js"></script>
<script type="text/javascript">

function calc( datum )
{
	var text;
	for (i=-90; i<=90; i += 5){
		for ( j= -180; j<=180; j += 5){
			lat = i;
			lon = j;
			h = 10.3;

			xyz = geoLatLon2XYZ( datum, lat, lon, h );
			latlon= geoXYZ2LatLon( datum, xyz.x, xyz.y, xyz.z );

			text += lat + " " + lon + " " + h + " >> " + latlon.lat + " " + latlon.lon + " " + latlon.height + "\n";
		}
		text += "\n\n";
	}
	var ele = document.getElementById("text");
	ele.value = text;
}

function calc2( datum )
{
	var text;
	for (i=-90; i<=90; i += 5){
		for ( j= -180; j<=180; j += 5){
			lat = i;
			lon = j;
			h = 10.3;

			xyz = geoLatLon2XYZ( datum, lat, lon, h );

			text += lat + " " + lon + " " + h + " >> " + xyz.x + " " + xyz.y + " " + xyz.z + "\n";
		}
		text += "\n\n";
	}
	var ele = document.getElementById("text");
	ele.value = text;
}
function world2tokyo()
{

	var text;
	for (i=30; i<=50; i += 1){
		for ( j= 120; j<=160; j += 1){
			lat = i;
			lon = j;
			h = 0;
			//h = 1.2345678;

			latlon= geoDatumWorld2Tokyo( 1, lat, lon, h);

			text += lat + " " + lon + " " + h + " >> " + latlon.lat + " " + latlon.lon + " " + latlon.height + "\n";
		}
		text += "\n\n";
	}
	var ele = document.getElementById("text");
	ele.value = text;
}


function world2world()
{
	var text;
	for (i=-90; i<=90; i += 5){
		for ( j= -180; j<=180; j += 5){
			lat = i;
			lon = j;
			h = 0;

			var latlon= geoDatumWorld2Tokyo( 1, lat, lon, h);
			//var latlon= geoDatumTokyo2World( 1, latlon.lat, latlon.lon, latlon.height);
			var latlon= geoDatumTokyo2World( 1, latlon.lat, latlon.lon, 0 );

			text += lat + " " + lon + " " + h + " >> " + latlon.lat + " " + latlon.lon + " " + latlon.height + "\n";
		}
		text += "\n\n";
	}
	var ele = document.getElementById("text");
	ele.value = text;
}
</script>
</head>
<body>
<form>
<input type="button" onclick="calc(1)" value="GRS80"><br>
<input type="button" onclick="calc(2)" value="BESSEL"><br>
<input type="button" onclick="calc2(1)" value="GRS80#2"><br>
<input type="button" onclick="calc2(2)" value="BESSEL#2"><br>
<input type="button" onclick="world2tokyo()" value="wld2tky"><br>
<input type="button" onclick="world2world()" value="wld2wld"><br>
<textarea id="text" rows="60" cols="80"></textarea>
</form>
</body>
</html>
