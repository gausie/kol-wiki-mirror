<?php
class TheKoLWiki {
  static function onParserInit( Parser $parser ) {
    $parser->setHook( 'devtracker', array( __CLASS__, 'devtrackerRender' ) );
    return true;
  }

  static function devtrackerRender( $input, array $args, Parser $parser, PPFrame $frame ) {
    return '<!-- devtracker would go here, but the RSS has been empty for years -->';
  }
}