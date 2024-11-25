Development log
===

1. Dump the whole wiki
    * Main export done using https://github.com/WikiTeam/wikiteam/blob/master/dumpgenerator.py
    * Installed python2, pip via get-pip, then installing dependencies with `python2 -m pip`.
    * Must install `mwclient==0.10.1` as that is the last version that supported python2
    * It needed some changes to avoid SSL errors on the source wiki (fixes included in file in this repo).
    * `./dumpgenerator.py --api=https://kol.coldfront.net/thekolwiki/api.php --xml --images`
    * Ran overnight with no issues

2. Normalise
    * `sed -i 's/<username>�<\/username>/<username>½<\/username>/g' <path to dump *-history.xml>` 

3. Import to fresh MediaWiki instance
    * Possibly delete the default `Main_Page`? It basically blats all of the old revisions behind the default one because of timestamp ordering. I deleted the revision in the db. Not sure the best way to do it.
    * Go to maintenance folder and run `./run importDump --report --username-prefix="" --no-updates <path to dump *-history.xml>`
    * I got just under 9 revisions per second, which as of the current size of the wiki (see https://kol.coldfront.net/thekolwiki/index.php/Special:Statistics) takes almost 24 full hours to import. EDIT: Never mind, something is wrong about my understanding of the wiki size, I thought it had 22k pages but we are at over 80k pages imported and it is still chugging along. Also down to 7 revisions per second. EDIT 2: 91k pages roughly total on the count in the end.
    * As I watch it load, am trying to note extensions that need to be enabled. So far I have added to `LocalSettings.php`:
        * `wfLoadExtension( 'ParserFunctions' );`
        * `wfLoadExtension(' PhpTags ');` (I shelled into the container and ran `git clone https://gerrit.wikimedia.org/r/mediawiki/extensions/PhpTags` in the extensions folder. Not ideal but fine for now)
        * `wfLoadExtension( 'PhpTagsFunctions' );` (Also shelled)
    * `./run rebuildrecentchanges`
    * `./run initSiteStats --update`
    * Import images `./run importImages <pathtoimages folder>` (the dump generator creates .desc files for each image but they are not suitable for the --comment-ext flag. I think they can just be ignored)
    * Add custom namespace for `Data` (and `Data_talk`) [more info](https://www.mediawiki.org/wiki/Manual:Using_custom_namespaces#Creating_a_custom_namespace)
        * Then move all existing pages into that namespace e.g. `UPDATE page SET page_title = REPLACE(page_title, 'Data:', ''), page_namespace = 3000 WHERE page_title LIKE 'Data:%' AND page_namespace = 0;` [more info](https://www.mediawiki.org/wiki/Manual:Using_custom_namespaces#Use_a_database_query)

