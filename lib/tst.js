'use strict';

(function() {
    const _state = {
        curlang : 'eng',
        savedtext : new Map(),
        manifest: null,
    };
    
    const Mirador = window.Mirador ? window.Mirador : null;
    const Sanscript = window.Sanscript ? window.Sanscript : null;

    const init = function() {
        const button = document.getElementById('transbutton');
        button.addEventListener('click',transClick);

        if(!document.body.lang) document.body.lang = 'eng';

        const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_ALL);
        var curnode = walker.currentNode;
        while(curnode) {
            if(curnode.nodeType === Node.ELEMENT_NODE) {
                if(!curnode.lang) curnode.lang = curnode.parentNode.lang;
            }
            else if(curnode.nodeType === Node.TEXT_NODE) {
                const curlang = curnode.parentNode.lang;
                if(curlang === 'tam' || curlang === 'tam-Taml')
                    curnode.data = cacheText(curnode);
            }
            curnode = walker.nextNode();
        }

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

        document.body.addEventListener('click',docClick);
    };
    
    const docClick = function(e) {
        const locel = e.target.closest('[data-loc]');
        if(locel) {
            jumpTo(locel.dataset.loc);
        }
    };

    const jumpTo = function(n) {
        const manif = _state.mirador.store.getState().manifests[_state.manifest].json;
        // n-1 because f1 is image 0
        const act = Mirador.actions.setCanvas('win1',manif.sequences[0].canvases[n-1]['@id']);
        _state.mirador.store.dispatch(act);
    };

    const cacheText = function(txtnode) {
        const lang = txtnode.parentNode.lang;
        const hyphenlang = lang === 'tam-Taml' ? 'ta' : 'sa';
        const hyphenated = window['Hypher']['languages'][hyphenlang].hyphenateText(txtnode.data);
        _state.savedtext.set(txtnode,hyphenated);
        if(lang === 'tam-Taml')
            return to.iast(hyphenated);
        else return hyphenated;
    };

    const transClick = function(e) {
        if(_state.curlang === 'tam') {
            const tamnodes = document.querySelectorAll('[lang="tam"],[lang="tam-Taml"]');
            for(const t of tamnodes) t.classList.remove('tamil');
            textWalk(toRoman);
            e.target.innerHTML = 'A';
            e.target.classList.remove('tamil');
            _state.curlang = 'eng';
        }
        else {
            const tamnodes = document.querySelectorAll('[lang="tam"],[lang="tam-Taml"]');
            for(const t of tamnodes) t.classList.add('tamil');
            textWalk(toTamil);
            e.target.innerHTML = 'அ';
            e.target.classList.add('tamil');
            _state.curlang = 'tam';
        }
    };
    
    const textWalk = function(func) {
        const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        var curnode = walker.currentNode;
        while(curnode) {
            if(curnode.parentNode.lang === 'tam' || curnode.parentNode.lang === 'tam-Taml') {
                const result = func(curnode);
                if(result) curnode.data = result;
            }
            curnode = walker.nextNode();
        }
    };
    
    const toTamil = function(txtnode) {
        if(txtnode.parentNode.lang === 'tam')
            return to.tamil(txtnode.data);
        else
            return _state.savedtext.get(txtnode);
    };

    const toRoman = function(txtnode) {
        if(txtnode.parentNode.lang === 'tam')
            return _state.savedtext.get(txtnode);
        else if(txtnode.parentNode.lang === 'tam-Taml')
            return to.iast(txtnode.data);
    };

    const to = {

        smush: function(text,placeholder) {
            text = text.toLowerCase();
        
            // remove space between a word that ends in a consonant and a word that begins with a vowel
            text = text.replace(/([ḍdrmvynhs]) ([aāiīuūṛeoêô])/g, '$1$2'+placeholder);
        
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
            return Sanscript.t(text,f,'iast').replace(/^⁰|([^\d⁰])⁰/g,'$1¹⁰');
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

            const smushed = text.replace(/([kṅcñṭṇtnpmyrlvḻḷṟṉ])\s+([aāiīuūeēoō])/g, '$1$2').toLowerCase();
            const rgex = new RegExp(`([${grc.join('')}])([${[...grv.keys()].join('')}])`,'g');
            const pretext = Sanscript.t(smushed,'iast','tamil');
            return pretext.replace(rgex, function(m,p1,p2) {
                return p1+grv.get(p2); 
            });
        },
    };
     
    window.addEventListener('load',init);
}());
