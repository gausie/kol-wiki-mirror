<?php
$wgAutoloadClasses['TheKoLWiki'] = $IP . '/extensions/TheKoLWikiExt/thekolwiki_body.php';
$wgHooks['ParserFirstCallInit'][] = 'TheKoLWiki::onParserInit';