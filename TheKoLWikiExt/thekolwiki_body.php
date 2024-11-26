<?php
class TheKoLWiki {
  static function onParserInit( Parser $parser ) {
    // {{#functionhooks}}
    MediaWiki\MediaWikiServices::getInstance()->getContentLanguage()->mMagicExtensions['rand'] = [ 0, 'rand'];
    $parser->setFunctionHook( 'rand', [ __CLASS__, 'randFunc' ] );

    // <customtags />
    $parser->setHook( 'devtracker', [ __CLASS__, 'devtrackerRender' ] );
    $parser->setHook( 'collection', [ __CLASS__, 'collectionRender' ] );
    $parser->setHook( 'randomlyselect', [ __CLASS__, 'randomlySelectRender' ] );

    return true;
  }

  static function randFunc( Parser $parser, $lower, $upper ) {
    return rand( $lower, $upper );
  }

  static function devtrackerRender( $input, array $args, Parser $parser, PPFrame $frame ) {
    return '<!-- devtracker would go here, but the RSS has been empty for years -->';
  }

  static function collectionRender( $input, array $args, Parser $parser, PPFrame $frame ) {
    $url = "https://museum.loathers.net/api/item/{$input}";
    $raw = file_get_contents( $url );
    $json = json_decode( $raw );
    $result = '<ul style="margin-bottom: 0px;">';
    $rank = $json->collections[0]->rank;
    $quantity = $json->collections[0]->quantity;
    $playerAccumulator = array();

    $purge = function() use (&$result, &$rank, &$quantity, &$playerAccumulator) {
      $symbol = match ($rank) { 1 => '🥇', 2 => '🥈', 3 => '🥉', default => "#{$rank}" };
      $result .= "<li>{$symbol}: " . implode( ', ', $playerAccumulator ) . " - " . number_format( $quantity ) . "</li>";
      $playerAccumulator = array();
    };

    foreach ( $json->collections as $row ) {
      if ($row->rank > $rank) {
        $purge();
        $quantity = $row->quantity;
        $rank = $row->rank;
      }

      $playerAccumulator[] = "{$row->player->name} (#{$row->player->playerid})";
    }
    $purge();
    $result .= "</ul><small>Powered by Museum 🏛️ (<a href=\"https://museum.loathers.net/item/{$input}\">see more</a>)</small>";
    return $result;
  }

  static function randomlySelectRender( $input, array $args, Parser $parser, PPFrame $frame ) {
    $options = array_flip( explode( "|", $input ) );
    $arr = [];

    ["num" => $num, "repeat" => $repeat] = array_merge( [
      "num" => 1,
      "repeat" => false,
    ], $args);

    $sound = array_rand( $options );

    for ($i = 0; $i < $num; $i++) {
      $arr[] = $sound;
      if ($repeat) {
        $sound = array_rand( $options );
      }
    }

    return implode( " ", $arr );
  }
}