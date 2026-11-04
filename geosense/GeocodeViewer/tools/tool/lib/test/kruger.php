<html>
<head>
<script type="text/javascript" src="/lib/projection/gausskruger.js"></script>
<script type="text/javascript" >
	var lat0 = 35.0;
	var lon0 = 135.0;
	var m0 = 0.9999;

	var lat = 36.1234;
	var lon = 136.1234;

	var s = gkrugerSetParams( lat0, lon0, m0, 0, 0 );
	alert("s="+s);

	var xy = gkrugerLatLon2XY( lat, lon );
	alert("x="+xy.x+"  y="+xy.y);

	var latlon = gkrugerXY2LatLon( xy.x, xy.y );
	alert("lat="+latlon.lat+"lon="+latlon.lon);


</script>
</head>
<body>
</body>
</html>

