const fs = require('fs');
const jsdom = require('jsdom');

fs.readdir('./',function(err,files) {
    if(err)
        return console.log(err);
    const flist = [];
    files.forEach(function(f) {
        if(/\.xml$/.test(f))
            flist.push(f);
    });
    readfiles(flist);
});

const getMeasure = function(el) {
    if(!el) return;
    const q = el.getAttribute('quantity');
    if(q) return q;
    const min = el.getAttribute('min');
    const max = el.getAttribute('max');
    return `${min}-${max}`;
};

const getMaterial = function(el) {
    if(!el) return;
    const m = el.getAttribute('material');
    if(!m) return;
    const materials = new Map([['palm-leaf','palm leaf'],['paper','paper'],['birch-bark','birch bark']]);
    return materials.get(m);
};

const readfiles = function(arr) {
    const template = new jsdom.JSDOM(fs.readFileSync('index-template.html',{encoding:'utf8'})).window.document;
    const tab = arr.map((f) => 
    {
        const str = fs.readFileSync(f,{encoding:'utf-8'});
        const xmlDoc = new jsdom.JSDOM(str).window.document;
        const cote = xmlDoc.querySelector('idno[type="cote"]').textContent;
        const sortno = parseInt(cote.replace(/\D+/g,''));
        return {
            sort: sortno,
            filename: f,
            cote: cote,
            title: xmlDoc.querySelector('msItem title').textContent,
            material: getMaterial(xmlDoc.querySelector('supportDesc')),
            folios: xmlDoc.querySelector('measure[unit="folio"]').getAttribute('quantity'),
            width: getMeasure(xmlDoc.querySelector('dimensions[type="leaf"] width')),
            height: getMeasure(xmlDoc.querySelector('dimensions[type="leaf"] height')),
        };
    });
    tab.sort((a,b) => {
        if(a.sort < b.sort) return -1;
        else return 1;
    });
    const table = template.querySelector('#index').firstElementChild;
    var tstr = '<thead><tr><th class="sorttable_sorted">Shelfmark<span id="sorttable_sortfwdind">&nbsp;&#x25BE;</span></th><th>Title</th><th>Material</th><th>Extent (folios)</th><th>Width (mm)</th><th>Height (mm)</th></tr></thead>';
    for(const t of tab) {
        const trstr = `<tr><th sorttable_customkey="${t.sort}"><a href="${t.filename}">${t.cote}</th><td>${t.title}</td><td>${t.material}</td><td>${t.folios}</td><td>${t.width}</td><td>${t.height}</td></tr>`;
        tstr = tstr + trstr;
    }
    table.innerHTML = tstr;
    fs.writeFile('index.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
};
