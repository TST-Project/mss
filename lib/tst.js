'use strict';

(function() {
    const _state = {
        curlang: 'en',
        availlangs: ['en'],
        langselector: '',
        otherlangs: ['ta','sa'],
        otherscripts: ['ta-Taml'],
        savedtext: new Map(),
        manifest: null,
    };
    
    const Mirador = window.Mirador ? window.Mirador : null;
    const Sanscript = window.Sanscript ? window.Sanscript : null;

    const init = function() {

        // prepare transliteration functions

        const langtags = [...document.getElementsByClassName('record_languages')];
        const langs = langtags.reduce((acc,cur) => {
            const arr = acc;
            if(cur.dataset.mainlang) arr.push(cur.dataset.mainlang);
            if(cur.dataset.otherlangs) 
                cur.dataset.otherlangs.split(' ').forEach(str => arr.push(str));
            return arr;
        },[]);
        if(langs.includes('tam')) {
            _state.availlangs.push('ta-tamil');
            _state.langselector = _state.langselector + '[lang|="ta"]';
        }
        if(langs.includes('san')) {
            const scripttags = [...document.getElementsByClassName('record_scripts')];
            const scripts = scripttags.reduce((acc,cur) => {
                cur.dataset.script.split(' ').forEach(str => acc.push(str));
                return acc;
            },[]);
            if(scripts.includes('bengali'))
                _state.availlangs.push('sa-bengali');
            if(scripts.includes('grantha'))
                _state.availlangs.push('sa-grantha');
            if(scripts.includes('telugu'))
                _state.availlangs.push('sa-telugu');
            if(scripts.includes('devanagari'))
                _state.availlangs.push('sa-devanagari');
            _state.langselector = _state.langselector + '[lang|="sa"]';
        }

        if(!document.body.lang) document.body.lang = 'en';

        const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_ALL);
        var curnode = walker.currentNode;
        while(curnode) {
            if(curnode.nodeType === Node.ELEMENT_NODE) {
                if(!curnode.lang) curnode.lang = curnode.parentNode.lang;
            }
            else if(curnode.nodeType === Node.TEXT_NODE) {
                const curlang = curnode.parentNode.lang.replace(/-\w+$/,'');
                if(_state.otherlangs.includes(curlang))
                    curnode.data = cacheText(curnode);
            }
            curnode = walker.nextNode();
        }
        
        const button = document.getElementById('transbutton');
        button.addEventListener('click',events.transClick);
        
        // load image viewer if facsimile available
        const viewer = document.getElementById('viewer');
        if(viewer) {
            _state.manifest = viewer.dataset.manifest;

            _state.mirador = Mirador.viewer({
                id: 'viewer',
                windows: [{
                    id: 'win1',
                    loadedManifest: viewer.dataset.manifest,
                }],
                window: {
                    allowClose: false,
                    allowFullscreen: false,
                    allowMaximize: false,
                    defaultSideBarPanel: 'attribution',
                    sideBarOpenByDefault: false,
                    imageToolsEnabled: true,
                    imageToolsOpen: true,
                },
                workspace: {
                    showZoomControls: true,
                    type: 'mosaic',
                },
                workspaceControlPanel: {
                    enabled: false,
                }
            });
        }
        
        // initialize events for the record text
        const recordcontainer = document.getElementById('recordcontainer');
        recordcontainer.addEventListener('click',events.docClick);
        recordcontainer.addEventListener('mouseover',events.docMouseover);
    };

    const events = {

        docClick: function(e) {
            const locel = e.target.closest('[data-loc]');
            if(locel) {
                jumpTo(locel.dataset.loc);
                return;
            }
            if(e.target.dataset.hasOwnProperty('scroll')) {
                e.preventDefault();
                const el = document.getElementById(e.target.href.split('#')[1]);
                el.scrollIntoView({behavior: 'smooth', inline:'end'});
            }
        },
        
        docMouseover: function(e) {
            var targ = e.target.closest('[data-anno]');
            while(targ && targ.hasAttribute('data-anno')) {
                toolTip.make(e,targ);
                targ = targ.parentNode;
            }

        },
    
        transClick: function(e) {
            const i = _state.availlangs.indexOf(_state.curlang);
            const nexti = _state.availlangs.length === i+1 ? 0 : i+1;
            cycleScript(e.target,_state.curlang,_state.availlangs[nexti]);
        },
    };

    const cycleScript = function(button,from,to) {
        const parselangcode = function(str) {
            const s = str.split('-');
            return {
                lang: s[0],
                script: s.length > 1 ? s[1] : ''
            };
        };

        const parsedlang = parselangcode(from);
        if(parsedlang.script) button.classList.remove(parsedlang.script);

        if(to === 'en') {
            const nodes = document.querySelectorAll(_state.langselector);
            for(const n of nodes) {
                parsedlang.script ? 
                    n.classList.remove(parsedlang.lang,parsedlang.script) :
                    n.classList.remove(parsedlang.lang);
            }
            textWalk(walkers.roman);
            button.innerHTML = 'A';
        }
        else {
            const [lang,script] = to.split('-');
            const nodes = document.querySelectorAll(`[lang|="${lang}"]`);
            for(const n of nodes) {
                n.classList.add(lang,script);
                parsedlang.script ?
                    n.classList.remove(parsedlang.lang,parsedlang.script) :
                    n.classList.remove(parsedlang.lang);
            }
            textWalk(walkers[to]);
            button.innerHTML = Sanscript.t('a','iast',script);
            button.classList.add(script);
        }
        _state.curlang = to;
    };

    const toolTip = {
        make: function(e,targ) {
            const toolText = targ.dataset.anno;
            if(!toolText) return;

            var tBox = document.getElementById('tooltip');
            const tBoxDiv = document.createElement('div');

            if(tBox) {
                for(const kid of tBox.childNodes) {
                    if(kid.myTarget === targ)
                        return;
                }
                tBoxDiv.appendChild(document.createElement('hr'));
            }
            else {
                tBox = document.createElement('div');
                tBox.id = 'tooltip';
                tBox.style.top = (e.clientY + 10) + 'px';
                tBox.style.left = e.clientX + 'px';
                tBox.style.opacity = 0;
                tBox.style.transition = 'opacity 0.2s ease-in';
                document.body.appendChild(tBox);
                tBoxDiv.myTarget = targ;
            }

            tBoxDiv.appendChild(document.createTextNode(toolText));
            tBoxDiv.myTarget = targ;
            tBox.appendChild(tBoxDiv);
            targ.addEventListener('mouseleave',toolTip.remove,{once: true});
            window.getComputedStyle(tBox).opacity;
            tBox.style.opacity = 1;
        },
        remove: function(e) {
            const tBox = document.getElementById('tooltip');
            if(tBox.children.length === 1) {
                tBox.remove();
                return;
            }

            const targ = e.target;
            for(const kid of tBox.childNodes) {
                if(kid.myTarget === targ) {
                    kid.remove();
                    break;
                }
            }
            if(tBox.children.length === 1) {
                const kid = tBox.firstChild.firstChild;
                if(kid.tagName === 'HR')
                    kid.remove();
            }
        },
    };

    const jumpTo = function(n) {
        const manif = _state.mirador.store.getState().manifests[_state.manifest].json;
        // n-1 because f1 is image 0
        const act = Mirador.actions.setCanvas('win1',manif.sequences[0].canvases[n-1]['@id']);
        _state.mirador.store.dispatch(act);
    };

    const cacheText = function(txtnode) {
        const lang = txtnode.parentNode.lang;
        const hyphenlang = lang === 'ta-Taml' ? 'ta' : 'sa';
        const hyphenated = window['Hypher']['languages'][hyphenlang].hyphenateText(txtnode.data);
        _state.savedtext.set(txtnode,hyphenated);
        if(lang === 'ta-Taml')
            return to.iast(hyphenated);
        else return hyphenated;
    };
    
    const textWalk = function(func) {
        const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        var curnode = walker.currentNode;
        while(curnode) {
            const code = curnode.parentNode.lang.replace(/-\w+$/,'');
            if(_state.otherlangs.includes(code)) {
                const result = func(curnode);
                if(result) curnode.data = result;
            }
            curnode = walker.nextNode();
        }
    };
    
    const walkers = {
        'ta-tamil': function(txtnode) {
            if(txtnode.parentNode.lang === 'ta')
                return to.tamil(txtnode.data);
            else if(txtnode.parentNode.lang === 'ta-Taml')
                return _state.savedtext.get(txtnode);
        },
        'sa-devanagari': function(txtnode) {
            if(txtnode.parentNode.lang === 'sa')
                return to.devanagari(txtnode.data);
        },
        roman: function(txtnode) {
            if(_state.otherlangs.includes(txtnode.parentNode.lang))
                return _state.savedtext.get(txtnode);
            else if(txtnode.parentNode.lang === 'ta-Taml')
                return to.iast(txtnode.data);
        },
    };

    const to = {

        smush: function(text,placeholder) {
            text = text.toLowerCase();
        
            // remove space between a word that ends in a consonant and a word that begins with a vowel
            text = text.replace(/([ḍdrmvynhs]) ([aāiīuūṛeēoōêô])/g, '$1$2'+placeholder);
        
            // remove space between a word that ends in a consonant and a word that begins with a consonant
            text = text.replace(/([kgcjñḍtdnpbmrlyvśṣsṙ]) ([kgcjṭḍtdnpbmyrlvśṣshḻ])/g, '$1'+placeholder+'$2');

            // join final o/e/ā and avagraha/anusvāra
            text = text.replace(/([oōeēā]) ([ṃ'])/g,'$1'+placeholder+'$2');

            text = text.replace(/ü/g,'\u200Cu');
            text = text.replace(/ï/g,'\u200Ci');

            text = text.replace(/_{1,2}(?=\s*)/g, function(match) {
                if(match === '__') return '\u200D';
                else if(match === '_') return '\u200C';
            });

            return text;
        },

        iast: function(text,from) {
            const f = from || 'tamil';
            return Sanscript.t(text,f,'iast')
                .replace(/^⁰|([^\d⁰])⁰/g,'$1¹⁰')
                .replace(/l̥/g,'ḷ');
        },
        
        tamil: function(text/*,placeholder*/) {
            /*const pl = placeholder || '';
            const txt = to.smush(text,pl);
            return Sanscript.t(txt,'iast','tamil');*/
            const grv = new Map([
                ['\u0B82','\u{11300}'],
                ['\u0BBE','\u{1133E}'],
                ['\u0BBF','\u{1133F}'],
                ['\u0BC0','\u{11340}'],
                ['\u0BC2','\u{11341}'],
                ['\u0BC6','\u{11342}'],
                ['\u0BC7','\u{11347}'],
                ['\u0BC8','\u{11348}'],
                ['\u0BCA','\u{1134B}'],
                ['\u0BCB','\u{1134B}'],
                ['\u0BCC','\u{1134C}'],
                ['\u0BCD','\u{1134D}'],
                ['\u0BD7','\u{11357}']
            ]);
            const grc = ['\u{11316}','\u{11317}','\u{11318}','\u{1131B}','\u{1131D}','\u{11320}','\u{11321}','\u{11322}','\u{11325}','\u{11326}','\u{11327}','\u{1132B}','\u{1132C}','\u{1132D}'];

            const smushed = text.replace(/ḷ/g,'l̥')
                .replace(/([kṅcñṭṇtnpmyrlvḻḷṟṉ])\s+([aāiīuūeēoō])/g, '$1$2').toLowerCase();
            const rgex = new RegExp(`([${grc.join('')}])([${[...grv.keys()].join('')}])`,'g');
            const pretext = Sanscript.t(smushed,'iast','tamil');
            return pretext.replace(rgex, function(m,p1,p2) {
                return p1+grv.get(p2); 
            });
        },
        
        devanagari: function(txt,placeholder) {

            const pretext = txt.replace(/ṙ/g, 'r')
                .replace(/e/g,'ē')
                .replace(/o(?![ṁḿ])/g,'ō')
                .replace(/(^|\s)_ā/g,'$1\u093D\u200D\u093E')
                .replace(/(^|\s)_r/g,'$1\u093D\u200D\u0930\u094D');

            const smushed = to.smush(pretext, (placeholder || '') );

            const text = Sanscript.t(smushed,'iast','devanagari')
                .replace(/¯/g, 'ꣻ');

            return text;
        },
    };
     
    window.addEventListener('load',init);
}());
