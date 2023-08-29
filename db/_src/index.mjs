import fs from 'fs';
import path from 'path';
import sqlite3 from 'better-sqlite3';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { make } from './utils.mjs';
import { find } from './find.mjs';

const dir = '../../';

const argv = yargs(hideBin(process.argv))
    .option('list', {
        alias: 'l',
        description: 'List of changed files',
        type: 'string'
    })
    .option('verbose', {
        alias: 'v',
        description: 'Verbose mode',
        type: 'count'
    })
    .help().alias('help','h').argv;

const data = {};
data.mss = (xmlDoc,base) => {
    const altcotes = {other: []};
    for(const alt of find.altcotes(xmlDoc)) {
        const txt = alt.textContent;
        if(txt.startsWith('Ancien fonds')) altcotes['Ancien fonds'] = txt;
        else if(txt.startsWith('Ariel')) altcotes.Ariel = txt;
        else if(txt.match(/^\w\/\d+$/)) altcotes['w/d'] = txt;
        else if(txt.startsWith('Burnouf')) altcotes.Burnouf = txt;
        else if(txt.startsWith('Cordier')) altcotes.Cordier = txt;
        else if(txt.startsWith('Ducler')) altcotes.Ducler = txt;
        else if(txt.startsWith('Haas')) altcotes.Haas = txt;
        else if(txt.startsWith('Reydellet')) altcotes.Reydellet = txt;
        else if(txt.startsWith('Vinson')) altcotes.Vinson = txt;
        else altcotes.other.push(txt);
    }
    //const images = find.images_url(xmlDoc);
    return new Map([
        ['filename', base],
        ['shelfmark', find.cote(xmlDoc)],
        ['old_shelfmarks', altcotes],
        ['repository', find.repo(xmlDoc)],
        ['title', find.title(xmlDoc)],
        ['languages', find.languages(xmlDoc)],
        ['material', find.material(xmlDoc)],
        ['form', find.form(xmlDoc)],
        ['stringholes', find.stringholes(xmlDoc)],
        ['extent', find.extent(xmlDoc)],
        ['width', find.dimension(xmlDoc,'leaf','width')],
        ['height', find.dimension(xmlDoc,'leaf','height')],
        ['date', find.date(xmlDoc)],
        ['images', find.images(xmlDoc)]
        //images_url: images[0],
        //images_domain: images[1],
    ]);
};


const paratextnames = ['colophon','blessing','header','invocation','ownership-statement','satellite-stanza','table-of-contents','title','TBC'];

data.paratexts = (xmlDoc) => {
    /*
    const ret = new Map([
        ['colophon', find.colophons(xmlDoc)]
    ]);
    */
    const ret = new Map();
    for(const name of paratextnames) ret.set(name,find.paratexts(xmlDoc,name));
    return  ret;
};

const tables = {};
tables.create = (db,ftsdb) => {
    // don't need IF NOT EXISTS here
    db.prepare('CREATE TABLE ' +
        'mss (' +
        'filename TEXT NOT NULL PRIMARY KEY, ' +
        'shelfmark TEXT NOT NULL, ' +
        'old_shelfmarks TEXT NOT NULL, ' +
        'repository TEXT NOT NULL, '+
        'title TEXT NOT NULL, ' +
        'languages TEXT, ' +
        'material TEXT, ' +
        'form TEXT, ' +
        'stringholes INTEGER, ' +
        'extent TEXT, ' +
        'width REAL, ' +
        'height REAL, ' +
        'date TEXT, ' +
        'images TEXT ' +
        ')').run();
    db.prepare('CREATE UNIQUE INDEX idx_mss_filename ON mss (filename)').run();
    db.prepare('CREATE INDEX idx_mss_repository ON mss (repository)').run();
    /*
    db.prepare('CREATE TABLE '+
        'paratexts_colophon (' +
        'filename TEXT REFERENCES mss(filename) ON UPDATE CASCADE ON DELETE CASCADE, '+
        'text TEXT NOT NULL, ' +
        'synch TEXT, '+ 
        'milestone TEXT, '+ 
        'facs TEXT, '+ 
        'placement TEXT'+
        ')').run();
    db.prepare('CREATE INDEX idx_colophon_filename ON paratexts_colophon (filename)').run();
    */
    for(const name of paratextnames) {
        db.prepare('CREATE TABLE '+
            `[paratexts_${name}] (` +
            'filename TEXT REFERENCES mss(filename) ON UPDATE CASCADE ON DELETE CASCADE, '+
            'text TEXT NOT NULL, ' +
            'synch TEXT, '+ 
            'milestone TEXT, '+ 
            'facs TEXT, '+ 
            'placement TEXT'+
            ')').run();
        db.prepare(`CREATE INDEX [idx_${name}_filename] ON [paratexts_${name}] (filename)`).run();
    }
    db.prepare('CREATE TABLE collections (' +
        'filename TEXT REFERENCES mss(filename) ON UPDATE CASCADE ON DELETE CASCADE, '+
        'collection TEXT NOT NULL' +
        ')').run();
    db.prepare('CREATE INDEX idx_collections_filename ON collections (filename)').run();
    db.prepare('CREATE INDEX idx_collections_collection ON collections (collection)').run();

    db.prepare('CREATE TABLE persons (' +
        'filename TEXT REFERENCES mss(filename) ON UPDATE CASCADE ON DELETE CASCADE, '+
        'persname TEXT NOT NULL, ' +
        'role TEXT NOT NULL'+
        ')').run();
    db.prepare('CREATE INDEX idx_persons_filename ON persons (filename)').run();
    db.prepare('CREATE INDEX idx_persons_persname ON persons (persname)').run();
    db.prepare('CREATE INDEX idx_persons_role ON persons (role)').run();

    db.prepare('CREATE TABLE [g_below-base] (' +
        'filename TEXT REFERENCES mss(filename) ON UPDATE CASCADE ON DELETE CASCADE, '+
        'text TEXT NOT NULL, ' +
        'context TEXT NOT NULL, '+
        'synch TEXT, '+ 
        'milestone TEXT, '+ 
        'facs TEXT, '+ 
        'placement TEXT'+
        ')').run();
    db.prepare('CREATE INDEX [idx_g_below-base_filename] ON [g_below-base] (filename)').run();
    db.prepare('CREATE INDEX [idx_g_below-base_text] ON [g_below-base] (text)').run();
    db.prepare('CREATE TABLE [g_post-base] (' +
        'filename TEXT REFERENCES mss(filename) ON UPDATE CASCADE ON DELETE CASCADE, '+
        'text TEXT NOT NULL, ' +
        'context TEXT NOT NULL, '+
        'synch TEXT, '+ 
        'milestone TEXT, '+ 
        'facs TEXT, '+ 
        'placement TEXT'+
        ')').run();
    db.prepare('CREATE INDEX [idx_g_post-base_filename] ON [g_post-base] (filename)').run();
    db.prepare('CREATE INDEX [idx_g_post-base_text] ON [g_post-base] (text)').run();

    ftsdb.prepare('CREATE VIRTUAL TABLE fulltext USING fts5(filename, shelfmark, title, text, tokenize="trigram")').run();
};
tables.drop = (db,ftsdb) => {
    //db.prepare('DROP TABLE IF EXISTS paratexts_colophon').run();
    for(const name of paratextnames)
        db.prepare(`DROP TABLE IF EXISTS [paratexts_${name}]`).run();
    db.prepare('DROP TABLE IF EXISTS [g_below-base]').run();
    db.prepare('DROP TABLE IF EXISTS [g_post-base]').run();
    db.prepare('DROP TABLE IF EXISTS collections').run();
    db.prepare('DROP TABLE IF EXISTS persons').run();
    db.prepare('DROP TABLE IF EXISTS mss').run();

    ftsdb.prepare('DROP TABLE IF EXISTS fulltext').run();
};

const personfinder = find.memoizedpersons();

const readfiles = (db,ftsdb,flist,del = false) => {
    for(const f of flist) {

        const base = path.parse(f).base;
        
        if(del) {
            const exists = db.prepare('SELECT EXISTS(SELECT 1 FROM mss WHERE filename = ?)').get(base);
            if(Object.values(exists)[0] === 1)
                db.prepare(`DELETE FROM mss WHERE filename = '${base}'`).run();

            const ftsexists = ftsdb.prepare('SELECT EXISTS(SELECT 1 FROM fulltext WHERE filename = ?)').get(base);
            if(Object.values(ftsexists)[0] === 1)
                ftsdb.prepare(`DELETE FROM fulltext WHERE filename = '${base}'`).run();
        }
        
        if(!fs.existsSync(f)) {
            console.log(`${base} deleted.`);
            continue;
        }
        
        const xmlTxt = fs.readFileSync(f,{encoding:'utf-8'});
        const xmlDoc = make.xml( xmlTxt );
        const mssData = data.mss(xmlDoc,base);
        const values = Array.from(mssData).map(([key,val]) => {
            if(key === 'old_shelfmarks') return JSON.stringify(val);
            return val;
        });
        db.prepare(`INSERT INTO mss VALUES (${'?,'.repeat(values.length-1)+'?'})`)
          .run(values);
       
        const paratextData = data.paratexts(xmlDoc);
        for(const [key, vals] of paratextData)
            for(const val of vals)
                db.prepare(`INSERT INTO [paratexts_${key}] VALUES (?,?,?,?,?,?)`)
                  .run(base,val);
        /*
        const collectors = find.collectors(xmlDoc);
        for(const collector of collectors) {
            db.prepare(`INSERT INTO collections VALUES (?,?)`)
              .run(base,collector);
        }
        */

        if(mssData.get('old_shelfmarks').hasOwnProperty('Ancien fonds')) {
            db.prepare(`INSERT INTO collections VALUES (?,?)`)
              .run(base,'Ancien fonds');
        }
        
        const persons = personfinder(xmlDoc);
        for(const person of persons) {
            db.prepare(`INSERT INTO persons VALUES (?,?,?)`)
              .run(base,person.name,person.role);
        }
    
        const belowbaseligatures = find.grend(xmlDoc,'below-base');
        for(const ligature of belowbaseligatures) {
            db.prepare(`INSERT INTO [g_below-base] VALUES (?,?,?,?,?,?,?)`)
              .run(base,...ligature);
        }
        const postbaseligatures = find.grend(xmlDoc,'post-base');
        for(const ligature of postbaseligatures) {
            db.prepare(`INSERT INTO [g_post-base] VALUES (?,?,?,?,?,?,?)`)
              .run(base,...ligature);
        }
            
        ftsdb.prepare('INSERT INTO fulltext VALUES (?,?,?,?)')
              .run(base,mssData.get('shelfmark'),mssData.get('title'),find.fulltext(xmlTxt));

        if(argv.verbose) console.log(`${base} updated.`);

    }
};

const dbops = {
    open: () => {
        const db = new sqlite3('../meta.db');
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');

        const ftsdb = new sqlite3('../fts.db');
        ftsdb.pragma('journal_mode = WAL');
        ftsdb.pragma('foreign_keys = ON');
        return [db,ftsdb];
    },

    close:(db, ftsdb) => {
        ftsdb.prepare('INSERT INTO fulltext(fulltext) VALUES (\'optimize\')').run();
        ftsdb.prepare('VACUUM').run();
        ftsdb.close();

        db.prepare('VACUUM').run();
        db.close();
    }
};

const main = () => {

    if(argv.list) {
        const list = fs.readFileSync(argv.list,{encoding:'utf-8'});
        const flist = list.split('\n').filter(line => line.endsWith('.xml'));

        if(flist.length === 0) return;

        const [db, ftsdb] = dbops.open();
        readfiles(db,ftsdb,flist.map(line => `${dir}${line}`),true);
        dbops.close(db, ftsdb);
    }

    else {
        const [db, ftsdb] = dbops.open();
        tables.drop(db,ftsdb);
        tables.create(db,ftsdb);
        let files;
        try {
            files = fs.readdirSync(dir);
        } catch (err) {
            console.log(err);
        }
        const flist = [];
        files.forEach((f) => {
            if(/^[^_].+\.xml$/.test(f))
                flist.push(dir+f);
        });
        readfiles(db,ftsdb,flist);
        dbops.close(db, ftsdb);
    }
};

main();
