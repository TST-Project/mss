const fs = require('fs');
const jsdom = require('jsdom');

//var xmlDoc;
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
    const min = el.getAttribute('min') || '';
    const max = el.getAttribute('max') || '';
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
/*
const getTitles = function(nlist) {
    const titles = [...nlist].map(el => el.textContent);
    return titles.join(', ');
};
*/
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
    const materials = new Map([['palm-leaf','palm leaf'],['palm-leaf talipot','palm leaf (talipot)'],['palm-leaf palmyra','palm leaf (palmyra)'],['paper','paper'],['paper handmade','paper (handmade)'],['paper industrial','paper (industrial)'],['paper laid', 'paper (laid)'],['birch-bark','birch bark'],['copper','copper'],['sancipat','sancipat']]);
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
        const unit = num > 1 ? ' pp.' : ' p.';
        return [num, num + unit];
    }
    const plates = xmlDoc.querySelector('measure[unit="plate"]');
    if(plates) {
        const num = plates.getAttribute('quantity');
        const unit = num > 1 ? ' plates' : ' plate';
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

const getImages = (el) => {
    if(!el) return '';
    const url = el.getAttribute('url');
    const dom = new jsdom.JSDOM('<!DOCTYPE html>');
    const a = dom.window.document.createElement('a');
    a.href = url;
    a.appendChild(dom.window.document.createTextNode(a.hostname));
    return a.innerHTML;
};

const getRepo = (xmlDoc) => {

    const names = new Map([
        ['Bibliothèque nationale de France. Département des Manuscrits','BnF'],
        ['Bibliothèque nationale de France. Département des Manuscrits.','BnF'],
        ['Staats- und UniversitätsBibliothek Hamburg Carl von Ossietzky','Hamburg Stabi'],
        ['Bodleian Library, University of Oxford','Oxford'],
        ['Cambridge University Library','Cambridge'],
        ['Bibliothèque universitaire des langues et civilisations','BULAC'],
        ['Private collection','private']
    ]);
    const repo = xmlDoc.querySelector('repository > orgName').textContent.replace(/\s+/g,' ');
    return names.get(repo); 
};

const isMSPart = (str) => {
    const dot = /\d\.\d/.test(str);
    const letter = /\d[a-z]$/.test(str);
    if(dot && letter) return ' class="subsubpart"';
    if(dot || letter) return ' class="subpart"';
    else return '';
};

const readfiles = function(arr) {
    const template = new jsdom.JSDOM(fs.readFileSync('index-template.html',{encoding:'utf8'})).window.document;
    const tab = arr.map((f) => 
    {
        const str = fs.readFileSync(f,{encoding:'utf-8'});
        const dom = new jsdom.JSDOM('');
        const parser = new dom.window.DOMParser();
        const xmlDoc = parser.parseFromString(str,'text/xml');
        if(!xmlDoc.querySelector('TEI')) console.log('error: ' + f);
        return {
            filename: f,
            repo: getRepo(xmlDoc),
            cote: getCote(xmlDoc),
            title: xmlDoc.querySelector('titleStmt > title').textContent,
            //title: getTitles(xmlDoc.querySelectorAll('msItem > title')),
            material: getMaterial(xmlDoc.querySelector('supportDesc')),
            extent: getExtent(xmlDoc),
            width: getMeasure(xmlDoc.querySelector('dimensions[type="leaf"] width')),
            height: getMeasure(xmlDoc.querySelector('dimensions[type="leaf"] height')),
            date: getDate(xmlDoc.querySelector('origDate')),
            images: getImages(xmlDoc.querySelector('facsimile > graphic')),
        };
    });
    tab.sort((a,b) => {
        if(a.sort < b.sort) return -1;
        else return 1;
    });
    const table = template.querySelector('#index').firstElementChild;
    var tstr = '<thead><tr id="head"><th class="sorttable_alphanum sorttable_sorted">Shelfmark<span id="sorttable_sortfwdind">&nbsp;&#x25BE;</span></th><th>Repository</th><th>Title</th><th>Material</th><th>Extent</th><th>Width (mm)</th><th>Height (mm)</th><th>Date</th><th>Images</th></tr></thead>';
    for(const t of tab) {
        const trstr = 
`
<tr>
  <th sorttable_customkey="${t.cote.sort}"${isMSPart(t.cote.text)}><a href="${t.filename}">${t.cote.text}</th>
  <td>${t.repo}</td>
  <td>${t.title}</td>
  <td>${t.material}</td>
  <td sorttable_customkey="${t.extent[0]}">${t.extent[1]}</td>
  <td sorttable_customkey="${t.width.replace(/^-|-$/,'')}">${t.width}</td>
  <td sorttable_customkey="${t.height.replace(/^-|-$/,'')}">${t.height}</td>
  <td sorttable_customkey="${t.date[1]}">${t.date[0]}</td>
  <td class="smallcaps">${t.images}</td>
</tr>`;
        tstr = tstr + trstr;
    }
    table.innerHTML = tstr;
    fs.writeFile('index.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
};
