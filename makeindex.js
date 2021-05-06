const fs = require('fs');
const jsdom = require('jsdom');

var xmlDoc;
fs.readdir('./',function(err,files) {
    if(err)
        return console.log(err);
    const flist = [];
    files.forEach(function(f) {
        if(/^[^_].+\.xml$/.test(f))
            flist.push(f);
    });
    readfiles(flist);
});

const getMeasure = function(el) {
    if(!el) return '';
    const q = el.getAttribute('quantity');
    if(q) return q;
    const min = el.getAttribute('min');
    const max = el.getAttribute('max');
    if(min || max) return `${min}-${max}`;
    return '';
};

const getDate = function(el) {
    if(!el) return ['','0'];
    const w = el.getAttribute('when');
    if(w) return [w,w];
    const notB = el.getAttribute('notBefore');
    const notA = el.getAttribute('notAfter');
    if(notB || notA)
        return [[notB,notA].join('—'),(notB || notA)]; 
    else return ['','0'];
};

const getTitles = function(nlist) {
    const titles = [...nlist].map(el => el.textContent);
    return titles.join(', ');
};

/*
const textWalk = function(el) {
    const walker = xmlDoc.createTreeWalker(el,4);
    const txtlist = [];
    while(walker.nextNode()) txtlist.push(walker.currentNode.data);
    console.log(txtlist.join(''));
    return txtlist.join('');
};
*/

const getMaterial = function(el) {
    if(!el) return;
    const m = el.getAttribute('material');
    if(!m) return;
    const materials = new Map([['palm-leaf','palm leaf'],['palm-leaf talipot','palm leaf (talipot)'],['palm-leaf palmyra','palm leaf (palmyra)'],['paper','paper'],['paper handmade','paper (handmade)'],['paper industrial','paper (industrial)'],['paper laid', 'paper (laid)'],['birch-bark','birch bark']]);
    return materials.get(m);
};

const getExtent = function(xmlDoc) {
    const folios = xmlDoc.querySelector('measure[unit="folio"]');
    if(folios) {
        const num = folios.getAttribute('quantity');
        const unit = num > 1 ? ' ff.' : ' f.';
        return [num*2, num + unit];
    }
    const pages = xmlDoc.querySelector('measure[unit="page"]');
    if(pages) {
        const num = pages.getAttribute('quantity');
        const unit = num > 1 ? ' pp.' : 'p.';
        return [num, num + unit];
    }
    return '';
};

const getCote = function(xmlDoc) {
    const txt = xmlDoc.querySelector('idno[type="shelfmark"]').textContent || '';
    const sort = txt.replace(/\d+/g,((match) => {
        return match.padStart(4,'0');
    }));
    return {text: txt, sort: sort};
};

const readfiles = function(arr) {
    const template = new jsdom.JSDOM(fs.readFileSync('index-template.html',{encoding:'utf8'})).window.document;
    const tab = arr.map((f) => 
    {
        const str = fs.readFileSync(f,{encoding:'utf-8'});
        const dom = new jsdom.JSDOM('');
        const parser = new dom.window.DOMParser();
        const xmlDoc = parser.parseFromString(str,'text/xml');
        const cote = getCote(xmlDoc);
        return {
            filename: f,
            cote: cote,
            title: xmlDoc.querySelector('titleStmt > title').textContent,
            //title: getTitles(xmlDoc.querySelectorAll('msItem > title')),
            material: getMaterial(xmlDoc.querySelector('supportDesc')),
            extent: getExtent(xmlDoc),
            width: getMeasure(xmlDoc.querySelector('dimensions[type="leaf"] width')),
            height: getMeasure(xmlDoc.querySelector('dimensions[type="leaf"] height')),
            date: getDate(xmlDoc.querySelector('origDate')),
        };
    });
    tab.sort((a,b) => {
        if(a.sort < b.sort) return -1;
        else return 1;
    });
    const table = template.querySelector('#index').firstElementChild;
    var tstr = '<thead><tr id="head"><th class="sorttable_sorted">Shelfmark<span id="sorttable_sortfwdind">&nbsp;&#x25BE;</span></th><th>Title</th><th>Material</th><th>Extent</th><th>Width (mm)</th><th>Height (mm)</th><th>Date</th></tr></thead>';
    for(const t of tab) {
        const trstr = `<tr><th sorttable_customkey="${t.cote.sort}"><a href="${t.filename}">${t.cote.text}</th><td>${t.title}</td><td>${t.material}</td><td sorttable_customkey="${t.extent[0]}">${t.extent[1]}</td><td>${t.width}</td><td>${t.height}</td><td sorttable_customkey="${t.date[1]}">${t.date[0]}</td></tr>`;
        tstr = tstr + trstr;
    }
    table.innerHTML = tstr;
    fs.writeFile('index.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
};
