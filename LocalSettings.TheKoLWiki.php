<?php
# CUSTOM SETTINGS FOR TheKoLWiki

#############
# Theme Config
#############
$wgDefaultSkin = 'minerva';

$wgMinervaTalkAtTop['base'] = true;
$wgMinervaAdvancedMainMenu['base'] = true;
$wgMinervaPersonalMenu['base'] = true;
// $wgMinervaHistoryInPageActions['base'] = true;
// $wgMinervaOverflowInPageActions['base'] = true;
$wgMinervaShowCategories['base'] = true;


#############
# Extensions
#############
wfLoadExtension( 'ParserFunctions' );
// git clone https://gerrit.wikimedia.org/r/mediawiki/extensions/PhpTags
// These are not enabled by WMF due to inefficiency. Consider disabling some day!
$wgPFEnableStringFunctions = true;

wfLoadExtension( 'PhpTags' );
// git clone https://gerrit.wikimedia.org/r/mediawiki/extensions/PhpTagsFunctions
wfLoadExtension( 'PhpTagsFunctions' );

// git clone https://gerrit.wikimedia.org/r/mediawiki/extensions/MobileFrontend - 2e67487
wfLoadExtension( 'MobileFrontend' );
require_once( "$IP/extensions/TheKoLWikiExt/thekolwiki.php" );

#############
# Namespaces
#############
define("NS_DATA", 3000);
$wgExtraNamespaces[NS_DATA] = "Data";

define("NS_DATA_TALK", 3001);
$wgExtraNamespaces[NS_DATA_TALK] = "Data_talk";
