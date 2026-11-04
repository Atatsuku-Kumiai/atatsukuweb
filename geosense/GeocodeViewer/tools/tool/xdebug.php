function xdebug( $message )
{
	$fp = fopen( "/tmp/phpdebug.txt", "a+" );
	fwrite( $fp, $message."\r\n" );
	fclose( $fp );
}

