import fs from 'fs';
import xpath from 'xpath';
import jsdom from 'jsdom';

const make = {
    xml: (str) => {
        const dom = new jsdom.JSDOM('');
        const parser = new dom.window.DOMParser();
        return parser.parseFromString(str,'text/xml');
    },
    html: (str) => {
        return (new jsdom.JSDOM(str)).window.document;
    },
    header: (arr) => {
        const cells = arr.map(str => `<th>${str}</th>`).join('');
        return `<thead><tr id="head">${cells}</tr></thead>`;
    },
};

const persDoc = make.xml( fs.readFileSync('authority-files/authority/authority/persons_base.xml',{encoding:'utf-8'}) );

const util = {
    /*
    innertext: el => {
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
            synch = text ? text.getAttribute('synch') :
                        desc ? desc.getAttribute('synch') :
                            '';
            inner = el.innerHTML;
        }
        else {
            const subtype = el.getAttribute('subtype') || '';
            milestone = el.querySelector('locus, milestone, pb');
            placement = subtype.replace(/\s/g,', ').replaceAll('-',' ');
            synch = el.getAttribute('synch') || el.closest('msItem')?.getAttribute('synch');
            inner = el.querySelector('q,quote')?.innerHTML || el.innerHTML;
        }
        return {inner: inner, synch: synch, milestone: milestone?.textContent || '', facs: milestone?.getAttribute('facs') || '', placement: placement};
    },
    */
    milestone: (el) => {

        const getUnit = (el) => {
            const m = el.ownerDocument.querySelector('extent > measure');
            if(m) return m.getAttribute('unit');
            return '';
        };
        
        const forwardWalk = (start) => {
            const nextEl = (e) => e.firstChild || e.nextSibling || e.parentNode.nextSibling;
            var p = nextEl(start);
            while(p) {
                if(p.nodeType === 3 && p.textContent.trim() !== '') return false; 
                if(p.previousSibling === start) return false; // probably don't need this
                if(p.nodeName === 'pb' || p.nodeName === 'cb' ||
                    (p.nodeName === 'milestone' && check.isFolio(p.getAttribute('unit')) )
                ) {
                    const content = (p.getAttribute('unit') || getUnit(p) || '') + ' ' + 
                                    (p.getAttribute('n') || '');
                    return {textContent: content, getAttribute: () => p.getAttribute('facs')};
                }
                p = nextEl(p);
            }
            return false;

        };
        
        const found = forwardWalk(el);
        if(found) return found;
        
        const parEls = ['text','desc','colophon','rubric'];
        var p = util.prevEl(el, {par: parEls});
        while(p) {
            if(!p) return false;
            //if(['text','desc','colophon','rubric'].includes(p.nodeName)) return false;
            if(p.nodeName === 'pb' ||  p.nodeName === 'cb' ||
                (p.nodeName === 'milestone' && check.isFolio(p.getAttribute('unit')) )
            ) {
                const content = (p.getAttribute('unit') || getUnit(p) || '') + ' ' + 
                                (p.getAttribute('n') || '');
                return {textContent: content, getAttribute: () => p.getAttribute('facs')};
            }
            p = util.prevEl(p, {par: parEls});
        }
    },

    line: (el) => {
        var p = util.prevEl(el);
        while(p) {
            if(!p) return false;
            if(p.nodeName === 'text' || p.nodeName === 'desc') return false;
            if(p.nodeName === 'lb')
                return `line ${p.getAttribute('n')}`;
            p = util.prevEl(p);
        }
    },

    placement: (el) => {
        const pp = el.firstChild;
        if(pp && pp.nodeType === 1 && pp.nodeName === 'milestone') {
            const attr = pp.getAttribute('unit');
            if(check.isNotMain(attr))
                return attr + ' ' + (pp.getAttribute('n') || '');
        }

        var p = util.prevEl(el);
        while(p) {
            if(!p) return '';
            if(p.nodeName === 'text' || p.nodeName === 'desc') return '';
            if(p.nodeName === 'milestone') {
                if(!check.isNotMain(p.getAttribute('unit')) ) return ''; 
                const u = (p.getAttribute('unit') || '').replace(/-/g,' ');
                return u + ' ' + (p.getAttribute('n') || '');
            }
            p = util.prevEl(p);
        }
    },

    prevEl: (e,options)  => {
        const ignore = options?.ignore || [];
        const parEls = options?.par || ['text','desc'];

        const closestSib = (el) => {
            let prevEl = el.previousElementSibling;
            if(prevEl && !ignore.includes(prevEl.nodeName)) {
                while(prevEl.lastElementChild)
                    prevEl = prevEl.lastElementChild;
                return prevEl;
            }
            return false;
        };
        const prevSib = closestSib(e);
        if(prevSib) return prevSib;
        
        let par = e.parentNode;
        while(par && !parEls.includes(par.nodeName)) {
            const parSib = closestSib(par);
            if(parSib) return parSib;
            /*
            let parPrevEl = par.previousElementSibling;
            if(parPrevEl) {
                while(parPrevEl.lastElementChild)
                    parPrevEl = parPrevEl.lastElementChild;
                return parPrevEl;
            }
            */
            par = par.parentNode;
        }
        return false;
    },
    
    prevTextNode: (e,options)  => {
        const ignore = options?.ignore || [];
        const parEls = options?.par || ['text','desc'];

        const closestSib = (el) => {
            let prevEl = el.previousSibling;

            while(prevEl) {
                if(prevEl.nodeType === 3) return prevEl;
                if(prevEl.nodeType !== 1 ||
                   prevEl.childNodes.length === 0 ||
                   ignore.includes(prevEl.nodeName))
                    prevEl = prevEl.previousSibling;
                else prevEl = prevEl.lastChild;
            }
            return false;
        };

        const prevSib = closestSib(e);
        if(prevSib) return prevSib;
        
        let par = e.parentNode;
        while(par && !parEls.includes(par.nodeName)) {
            const parSib = closestSib(par);
            if(parSib) return parSib;
            par = par.parentNode;
        }
        return false;
    },
    
    prevSpace: (el,options) => {
       
        let prevTextNode = util.prevTextNode(el,options);
        while(prevTextNode) {
            let normaltext = prevTextNode.textContent.replace(/\s/g,' ');
            if(prevTextNode.nextSibling?.getAttribute('break') === 'no') {
                while(normaltext.at(-1) === ' ') {
                 normaltext = normaltext.slice(0,-1);
                }
            }
            const space = normaltext.lastIndexOf(' ');
            if(space !== -1)
                return {node: prevTextNode, offset: space};
            prevTextNode = util.prevTextNode(prevTextNode,options);
        }
        return false;
    },
    
    nextTextNode: (e,options)  => {
        const ignore = options?.ignore || [];
        const parEls = options?.par || ['text','desc'];

        const closestSib = (el) => {
            let nextEl = el.nextSibling;

            while(nextEl) {
                if(nextEl.nodeType === 3) return nextEl;
                if(nextEl.nodeType !== 1 || 
                   nextEl.childNodes.length === 0 ||
                   ignore.includes(nextEl.nodeName))
                    nextEl = nextEl.nextSibling;
                else nextEl = nextEl.firstChild;
            }
            return false;
        };

        const nextSib = closestSib(e);
        if(nextSib) return nextSib;
        
        let par = e.parentNode;
        while(par && !parEls.includes(par.nodeName)) {
            const parSib = closestSib(par);
            if(parSib) return parSib;
            par = par.parentNode;
        }
        return false;
    },

    nextSpace: (el,options) => {
        let nextTextNode = util.nextTextNode(el,options);
        while(nextTextNode) {
            let normaltext = nextTextNode.textContent.replace(/\s/g,' ');
            let addendum = 0;
            if(nextTextNode.previousSibling?.getAttribute('break') === 'no') {
                while(normaltext.at(0) === ' ') {
                 normaltext = normaltext.slice(1);
                 addendum++;
                }
            }
            const space = normaltext.indexOf(' ');
            if(space !== -1)
                return {node: nextTextNode, offset: space+addendum};
            nextTextNode = util.nextTextNode(nextTextNode,options);
        }
        return false;
    },

    personlookup: (str) => {

        const getStandard = (el) => el.closest('person').querySelector('persName[type="standard"]').textContent;

        const split = str.split(':',2);
        if(split.length > 1) {
            const result = xpath.select(`//*[local-name(.)="idno" and @type="${split[0]}" and text()="${split[1]}"]`,persDoc,true);
            if(result) return getStandard(result);
            else return false;
        }

        const result = xpath.select(`//*[local-name(.)="persName" and text()="${str}"]`,persDoc,true);
        if(result) return getStandard(result);
        else return false;
    },
    functions(el) {
        const func = el.getAttribute('function') || '';
        const type = el.getAttribute('type') || '';
        return new Set( func.split(' ').concat(type.split(' ')) );
    },
};

const check = {
    isFolio: (str) => str === 'folio' || str === 'page' || str === 'plate',
    isNotMain: (str) => !check.isFolio(str) && str !== 'main-text-area',
};

export { util, make, check };
