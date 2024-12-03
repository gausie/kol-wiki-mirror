import {execa} from "execa";
import {format} from "date-fns";
import {basename} from "node:path";

type RecentChange = {
  type: "edit" | "new" | "log";
  ns: number;
  title: string;
  pageid: number;
  timestamp: string;
  user: string;
  userid: string;
  oldlen: number;
  newlen: number;
  minor?: string;
  revid: number;
  comment: string;
};

type RecentChanges = {
  query: {
    recentchanges: RecentChange[];
  }
}

type ExistingPage = {
  pageid: number,
  ns: number,
  title: string,
  revisions: {
    revid: number,
    parentid: number,
  }[]
};

async function getChanges(): Promise<RecentChanges> {
  const response = await fetch("https://kol.coldfront.net/thekolwiki/api.php?action=query&list=recentchanges&rcprop=title|ids|sizes|timestamp|user|userid|comment&rclimit=100&format=json");
  return await response.json();
}

async function getMirrorChanges(): Promise<RecentChanges> {
  const response = await fetch("https://kol.ar.gy/api.php?action=query&list=recentchanges&rcprop=title|ids|sizes|timestamp|user|userid&rcnamespace=0|1&rclimit=100&format=json");
  return await response.json();
}

function compareChanges(a: RecentChange, b: RecentChange) {
  if (a.timestamp !== b.timestamp) return false;
  if (a.title !== b.title) return false;
  if (a.user !== b.user) return false;
  if (a.oldlen !== b.oldlen) return false;
  if (a.newlen !== b.newlen) return false;
  return true;
}

async function findPageInfo(c: RecentChange): Promise<ExistingPage> {
  const response = await fetch(`https://kol.ar.gy/api.php?action=query&titles=${c.title}&prop=revisions&format=json`);
  const result = await response.json();
  return Object.values(result.query.pages as ExistingPage[]).filter((p) => p.ns === c.ns)[0]; 
}

async function exportRevision(c: RecentChange) {
  const response = await fetch(`https://kol.coldfront.net/thekolwiki/api.php?action=query&format=json&export=1&revids=${c.revid}`);
  const result = await response.json() as { query: { export: { "*": string } }};
  let exported = result.query.export["*"];

  const existingPage = await findPageInfo(c);

  if (existingPage) {
    exported = exported.replace(`<id>${c.pageid}</id>`, `<id>${existingPage.pageid}</id>`);
  }

  if (c.ns > 99) exported = exported.replace(`<ns>${c.ns}</ns>`,`<ns>${c.ns + 2900}</ns>`);

  return exported;
}

async function getImageUrl(filePage: string) {
  const response = await fetch(`https://kol.coldfront.net/thekolwiki/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${filePage}`);
  const result = await response.json() as { query: { pages: { [pageid: number]: { pageid: number, imageinfo: { 0: { url: string }}}}} };

  const pages = result.query.pages;
  if (!pages) throw new Error(`Could not discover url for file in ${filePage}`);

  const url = Object.values(pages)[0]?.imageinfo[0]?.url;
  if (!url) throw new Error(`Could not discover url for file in ${filePage}`);

  return url;
}

async function applyChanges(changes: RecentChange[]) {
  for (let i = changes.length; i > 0; i--) {
    const c = changes[i - 1];

    if (c.type === "log" && c.title.startsWith("File:")) {
      const url = (await getImageUrl(c.title)).replace(/^https/, "http");
      const filename = basename(url);
      await execa`docker exec -i kol-wiki-mediawiki-1 curl ${url} -o /var/dumps/imageImport/${filename}`;
      const res = await execa`docker exec -i kol-wiki-mediawiki-1 /var/www/html/maintenance/run importImages ${[
        "/var/dumps/imageImport",
        "--comment",
        c.comment.replace("\"", "\\\""),
        "--timestamp",
        c.timestamp,
      ]}`;
      await execa`docker exec -i kol-wiki-mediawiki-1 rm /var/dumps/imageImport/${filename}`;
      await execa({ input: c.title })`docker exec -i kol-wiki-mediawiki-1 /var/www/html/maintenance/run purgeList`
      console.log(`${c.type} ${c.title}: ${res.stdout.split("\n")[2]}`);
    } else {
      const xml = await exportRevision(c);
      const res = await execa({ input: xml })`docker exec -i kol-wiki-mediawiki-1 /var/www/html/maintenance/run importDump`;
      console.log(`${c.type} ${c.title}: ${res.stdout.split("\n")[0]}`);
    }
  }

  const from = format(new Date(changes[changes.length - 1].timestamp).getTime() - 1000, "yyyyMMddHHmmss");
  const to = format(new Date(changes[0].timestamp).getTime() + 1000, "yyyyMMddHHmmss");

  await execa`docker exec kol-wiki-mediawiki-1 /var/www/html/maintenance/run rebuildrecentchanges --from=${from} --to=${to}`;
  await execa`docker exec kol-wiki-mediawiki-1 /var/www/html/maintenance/run initSiteStats`;
}

async function main() {
  const mirrorChanges = await getMirrorChanges();
  const latestMirrored = mirrorChanges.query.recentchanges[0];

  const changes = await getChanges();

  const indexOfLatestMirrored = changes.query.recentchanges.findIndex((c) => compareChanges(c, latestMirrored));

  const unmirrored = changes.query.recentchanges.slice(0, indexOfLatestMirrored);

  await applyChanges(unmirrored);
}

main();