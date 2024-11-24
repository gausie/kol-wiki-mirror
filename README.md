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
    * Go to maintenance folder and run `./run importDump --report --username-prefix="" --no-updates <path to dump *-history.xml>
    * I got just under 9 revisions per second, which as of the current size of the wiki (see https://kol.coldfront.net/thekolwiki/index.php/Special:Statistics) takes almost 24 full hours to import

