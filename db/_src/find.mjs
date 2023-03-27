import fs from 'fs';
import jsdom from 'jsdom';
import xmlserializer from 'xmlserializer';
import SaxonJS from 'saxon-js';
import { make, util } from './utils.mjs';

const xsltSheet = fs.readFileSync('tei-to-html-snippet.sef.json',{encoding:'utf-8'});
const xsltSheetFull = fs.readFileSync('tei-to-html.sef.json',{encoding:'utf-8'});

const XSLTransform = (doc,xslsheet) => {
    const processed = SaxonJS.transform({
        stylesheetText: xsltSheet,
        sourceText: doc,
        destination: 'serialized'},'sync');
    const res = processed.principalResult || '';
    return res;
    //const txt = transliterate(res);
    //const clean = make.html(`<html>${txt}</html>`).documentElement.textContent.trim();
};

const langize = (doc,el) => {
    const walker = doc.createTreeWalker(el,4294967295);
    let curlang = el.getAttribute('xml:lang');
    let curnode = walker.nextNode();
    while(curnode) {
        if(curnode.nodeType === 1) {
            const nodelang = curnode.getAttribute('xml:lang');
            if(!nodelang) curnode.setAttribute('xml:lang',curlang);
            else curlang = nodelang;
        }
        curnode = walker.nextNode();
    }
};

const trimNobreak = (el) => {
    for(const b of el.querySelectorAll('[break = "no"]')) {
        const prev = b.previousSibling;
        if(prev && prev.nodeType === 3)
            prev.data = prev.data.trimEnd();
    }
};

const xmlToHtml = (xmlDoc,el) => {
    const clone = el.cloneNode(true);
    trimNobreak(clone);
    if(!el.hasAttribute('xml:lang')) {
        const lang = el.closest('[xml:lang]')?.getAttribute('xml:lang') || 'en';
        clone.setAttribute('xml:lang',lang);
    }
    langize(xmlDoc,clone);
    const txt = xmlserializer.serializeToString(clone);
    return XSLTransform(txt, xsltSheet);
};

const getPlacement = (el) => {
    const milestone = util.milestone(el) || 
        el.closest('desc')?.querySelector('locus') ||
        el.querySelector('locus, milestone, pb'); // if el is <desc>
    const placement = util.placement(el) || 
        el.closest('desc')?.getAttribute('subtype')?.replace(/\s/g,', ').replaceAll('-',' ') ||
        util.line(el) ||
        '';
    const text = el.closest('text');
    const desc = el.closest('desc');
    const synch = text ? text.getAttribute('synch')?.replace(/#/g,'') :
                desc ? desc.getAttribute('synch')?.replace(/#/g,'') :
                (el.closest('msItem')?.getAttribute('synch')?.replace(/#/g,'') || '');
    return [
        /*synch:*/ synch, 
        /*milestone:*/ milestone?.textContent || '', 
        /*facs:*/ milestone?.getAttribute('facs') || '', 
        /*placement:*/ placement
    ];
};

const processParatext = (xmlDoc,el) => {
        /*
        var synch, inner, milestone, placement;
        if(el.nodeName === 'seg') {
            milestone = util.milestone(el) || 
                el.closest('desc')?.querySelector('locus');
            placement = util.placement(el) || 
                el.closest('desc')?.getAttribute('subtype')?.replaceAll('-',' ') ||
                util.line(el) ||
                '';
            const text = el.closest('text');
            const desc = el.closest('desc');
            synch = text ? text.getAttribute('synch')?.replace(/#/g,'') :
                        desc ? desc.getAttribute('synch')?.replace(/#/g,'') :
                            '';
            inner = el;
        }
        else {
            const subtype = el.getAttribute('subtype') || '';
            milestone = el.querySelector('locus, milestone, pb');
            placement = subtype.replace(/\s/g,', ').replaceAll('-',' ');
            synch = el.getAttribute('synch')?.replace(/#/g,'') || 
                    el.closest('msItem')?.getAttribute('synch')?.replace(/#/g,'');
            inner = el.querySelector('q,quote') || el;
        }
        return [
            xmlToHtml(xmlDoc,inner), 
            synch, 
            milestone?.textContent || '', 
            milestone?.getAttribute('facs') || '', 
            placement
        ];
        */
        const inner = el.nodeName === 'seg' ? el : (el.querySelector('q,quote') || el);
        return [xmlToHtml(xmlDoc,inner),...getPlacement(el)];
};

const find = {

    fulltext: (xmlTxt) => {
        const res = XSLTransform(xmlTxt, xsltSheetFull);
        return make.html(res).documentElement.textContent.trim().replace(/\s+/g,' ');
    },

    paratexts: (xmlDoc,name) => [...xmlDoc.querySelectorAll(`seg[function~="${name}"], desc[type~="${name}"]`)].map(el => processParatext(xmlDoc,el)),

    colophons: (xmlDoc) => {
        const colophons = [...xmlDoc.querySelectorAll('colophon, seg[function~="colophon"]')];
        const cs1 = [...xmlDoc.querySelectorAll('desc[type~="copy-statement"]')];
        const cs2 = [...xmlDoc.querySelectorAll('seg[function~="copy-statement"]')].filter( 
            el => !el.closest('colophon, seg[function~="colophon"]')
        );
        return colophons.concat(cs1, cs2).map(el => {
            return processParatext(xmlDoc,el);
        });
    },
    /*
    cote: (xmlDoc) => {
        const txt = xmlDoc.querySelector('idno[type="shelfmark"]').textContent || '';
        const sort = txt.replace(/\d+/g,((match) => {
            return match.padStart(4,'0');
        }));
        return {text: txt, sort: sort};
    },
    */
    cote: (xmlDoc) => {
        return xmlDoc.querySelector('idno[type="shelfmark"]').textContent || '';
    },

    altcotes: (xmlDoc) => {
        const par = xmlDoc.querySelector('idno[type="alternate"]');
        if(!par) return [];
        return par.querySelectorAll('idno');
    },

    collectors: (xmlDoc) => {
        const els = [...xmlDoc.querySelectorAll('persName[role~="collector"]')];
        return new Set(els.map(e =>  {
            const key = e.hasAttribute('key') ? e.getAttribute('key') : e.textContent;
            const canonicalname = util.personlookup(key);
            return canonicalname || key;
        }));
    },

    material: (xmlDoc) => {
        const el = xmlDoc.querySelector('supportDesc');
        if(!el) return;
        const m = el.getAttribute('material');
        if(!m) return;
        const materials = new Map([['palm-leaf','palm leaf'],['palm-leaf talipot','palm leaf (talipot)'],['palm-leaf palmyra','palm leaf (palmyra)'],['paper','paper'],['paper handmade','paper (handmade)'],['paper industrial','paper (industrial)'],['paper laid', 'paper (laid)'],['birch-bark','birch bark'],['copper','copper'],['sancipat','sancipat']]);
        return materials.get(m);
    },

    extent: (xmlDoc) => {
        const folios = xmlDoc.querySelector('measure[unit="folio"]');
        if(folios) {
            const num = folios.getAttribute('quantity');
            const unit = num > 1 ? ' ff.' : ' f.';
            return num + unit;
        }
        const pages = xmlDoc.querySelector('measure[unit="page"]');
        if(pages) {
            const num = pages.getAttribute('quantity');
            const unit = num > 1 ? ' pp.' : ' p.';
            return num + unit;
        }
        const plates = xmlDoc.querySelector('measure[unit="plate"]');
        if(plates) {
            const num = plates.getAttribute('quantity');
            const unit = num > 1 ? ' plates' : ' plate';
            return num + unit;
        }
        return '';
    },
    
    dimension: (xmlDoc,type,dim) => {
        const el = xmlDoc.querySelector(`dimensions[type="${type}"] > ${dim}`);
        if(!el) return '';
        const q = el.getAttribute('quantity');
        if(q) return q;
        const min = el.getAttribute('min') || '';
        const max = el.getAttribute('max') || '';
        if(min || max) return `${min}–${max}`;
        return '';
    },

    date: (xmlDoc) => {
        const el = xmlDoc.querySelector('origDate');
        if(!el) return '';
        const w = el.getAttribute('when');
        if(w) return w;
        const notB = el.getAttribute('notBefore');
        const notA = el.getAttribute('notAfter');
        if(notB || notA)
            return [notB,notA].join('–'); 
        else return '';
    },

    images: (xmlDoc) => {
        const el = xmlDoc.querySelector('facsimile > graphic');
        if(!el) return '';
        const url = el.getAttribute('url');
        const dom = new jsdom.JSDOM('<!DOCTYPE html>');
        const a = dom.window.document.createElement('a');
        a.href = url;
        a.appendChild(dom.window.document.createTextNode(a.hostname));
        return a.innerHTML;
    },

    images_url: (xmlDoc) => {
        const el = xmlDoc.querySelector('facsimile > graphic');
        if(!el) return [];
        const url = el.getAttribute('url');
        const dom = new jsdom.JSDOM('<!DOCTYPE html>');
        const a = dom.window.document.createElement('a');
        a.href = url;
        a.appendChild(dom.window.document.createTextNode(a.hostname));
        return [url,a.innerHTML];
    },

    repo: (xmlDoc) => {
        const names = new Map([
            ['Bibliothèque nationale de France. Département des Manuscrits','BnF'],
            ['Bibliothèque nationale de France. Département des Manuscrits.','BnF'],
            ['Biblioteca Apostolica Vaticana','Vatican'],
            ['Bibliothèque nationale et universitaire de Strasbourg','Bnu Strasbourg'],
            ['Staats- und UniversitätsBibliothek Hamburg Carl von Ossietzky','Hamburg Stabi'],
            ['Bodleian Library, University of Oxford','Oxford'],
            ['Cambridge University Library','Cambridge'],
            ['Bibliothèque universitaire des langues et civilisations','BULAC'],
            ['Shri Lal Bahadur Shastri National Sanskrit University','SLBSNS'],
            ['Private collection','private']
        ]);
        const repo = xmlDoc.querySelector('repository > orgName').textContent.replace(/\s+/g,' ');
        return names.get(repo); 
    },
    
    languages: (xmlDoc) => {
        const isocodes = new Map([
            ['ara','Arabic'],
            ['bod','Tibetan'],
            ['eng','English'],
            ['fra','French'],
            ['deu','German'],
            ['hin','Hindi'],
            ['lat','Latin'],
            ['mal','Malayalam'],
            ['mar','Marathi'],
            ['pli','Pali'],
            ['por','Portuguese'],
            ['pra','Prakrit'],
            ['san','Sanskrit'],
            ['sin','Sinhalese'],
            ['tam','Tamil'],
            ['tel','Telugu']
        ]);
        const langs = [...xmlDoc.querySelectorAll('textLang')].reduce((acc,cur) => {
            const main = cur.getAttribute('mainLang') || '';
            const other = cur.getAttribute('otherLangs') || '';
            const codes = [ ...main.split(' '), ...other.split(' ') ];
            for(const code of codes) acc.add(code);
            return acc;
        },new Set());

        return [...langs].filter(e=>e).map(code => isocodes.get(code)).sort().join(', ');
    },
    tbcs: (xmlDoc) => xmlDoc.querySelectorAll('seg[function="TBC"]'),

    title: (xmlDoc) => {
        //return xmlDoc.querySelector('titleStmt').querySelector('title').textContent.replace(/&/g,'&#38;').trim()
        const title = xmlDoc.querySelector('titleStmt').querySelector('title');
        return xmlToHtml(xmlDoc,title);
    },
    
    grend: (xmlDoc,rend) => {
        const els = xmlDoc.querySelectorAll(`g[rend="${rend}"]`);
        const getContext = (el) => {
            const range = xmlDoc.createRange();
            const prevspace = util.prevSpace(el,{ignore:['note'],par:['desc','text','q','quote']});
            if(prevspace) range.setStart(prevspace.node,prevspace.offset);
            else range.setStartBefore(el);

            const nextspace = util.nextSpace(el,{ignore:['note'],par:['desc','text','q','quote']});
            if(nextspace) range.setEnd(nextspace.node,nextspace.offset);
            else range.setEndAfter(el);
            
            const startcontainer = range.startContainer.nodeType === 1 ?
                    range.startContainer : range.startContainer.parentNode;

            const lang = startcontainer.getAttribute('xml:lang') ||
                startcontainer.closest('[xml:lang]')?.getAttribute('xml:lang') ||
                'en';

            const container = xmlDoc.createElementNS('http://www.tei-c.org/ns/1.0','seg');
            container.setAttribute('xml:lang',lang);
            container.setAttribute('class','gaiji-context');
            
            const gaijicontainer = xmlDoc.createElementNS('http://www.tei-c.org/ns/1.0','span');
            gaijicontainer.setAttribute('class','gaiji-selected');
            // a little risky to change xmlDoc; use clone?
            el.replaceWith(gaijicontainer);
            gaijicontainer.appendChild(el);

            container.append(range.cloneContents());
            
            // remember to undo change to xmlDoc
            gaijicontainer.replaceWith(el);

            langize(xmlDoc,container);
            return xmlToHtml(xmlDoc,container);
        };
        return [...els].map(el => {
            const context = getContext(el);
            return [ el.textContent, context, ...getPlacement(el)];
        });
    },
    
    persnames: (xmlDoc) => {
        return [...xmlDoc.querySelectorAll('persName')]
            .filter(el => !el.closest('editionStmt') && !el.closest('editor') && !el.closest('bibl') && !el.closest('change'))
            .map(el => {
                return {
                    name: el.hasAttribute('key') ? el.getAttribute('key') : el.textContent,//el.innerHTML, 
                    role: el.getAttribute('role') || ''
                };
            });
    },

    authors: (xmlDoc) => {
        return [...xmlDoc.querySelectorAll('author')]
            .filter(el => !el.closest('bibl'))
            .map(el => {return {name: el.innerHTML, role: 'author'};});
    },

    scribes: (xmlDoc) => {
        const els = [...xmlDoc.querySelectorAll('handNote[scribeRef]')];
        const scribes = new Map([
            ['#ArielTitleScribe','Ariel\'s title scribe'],
            ['#EdouardAriel','Édouard Ariel'],
            ['#PhEDucler','Philippe Étienne Ducler'],
            ['#DuclerScribe','Ducler\'s scribe'],
            ['#UmraosinghShergil','Umraosingh Sher-Gil']
        ]);
        return els.map(el => scribes.get(el.getAttribute('scribeRef')))
            .filter(el => el !== undefined)
            .map(el => {return {name: el, role: 'scribe'};});
    },
    memoizedpersons: () => {
        const cache = new Map();

        return (xmlDoc) => {
            //const peeps = [...find.scribes(xmlDoc),...find.persnames(xmlDoc),...find.authors(xmlDoc)];
            const peeps = [...find.scribes(xmlDoc),...find.persnames(xmlDoc)];

            const peepReducer = function(prevs, cur) {
                if(cache.has(cur.name))
                    cur.name = cache.get(cur.name);
                else {
                    const canonicalname = util.personlookup(cur.name);
                    if(canonicalname) {
                        cache.set(cur.name,canonicalname);
                        cur.name = canonicalname;
                    }
                    else cache.set(cur.name,cur.name);
                }

                for(const prev of prevs) {
                    if(cur.name === prev.name && cur.role === prev.role)
                        return prevs;
                }

                return [...prevs,cur];
            };

            return peeps.reduce(peepReducer,[]);
        };
    },
};

export { find };
