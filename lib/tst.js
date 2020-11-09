'use strict';

(function() {
    const _state = {
        curlang : 'en',
        savedtext : new Map(),
        manifest: null,
    };

    const init = function() {
        const button = document.getElementById('transbutton');
        button.addEventListener('click',transClick);

        if(!document.body.lang) document.body.lang = 'en';

        const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_ALL);
        var curnode = walker.currentNode;
        while(curnode) {
            if(curnode.nodeType === Node.ELEMENT_NODE) {
                if(!curnode.lang) curnode.lang = curnode.parentNode.lang;
            }
            else if(curnode.nodeType === Node.TEXT_NODE) {
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
        const hyphenated = window['Hypher']['languages']['sa'].hyphenateText(txtnode.data);
        _state.savedtext.set(txtnode,hyphenated);
        return hyphenated;
    };

    const transClick = function(e) {
        if(_state.curlang === 'tam') {
            const tamnodes = document.querySelectorAll('[lang="tam"]');
            for(const t of tamnodes) t.classList.remove('tamil');
            textWalk(revertScript);
            e.target.innerHTML = 'A';
            e.target.classList.remove('tamil');
            _state.curlang = 'en';
        }
        else {
            const tamnodes = document.querySelectorAll('[lang="tam"]');
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
            if(curnode.parentNode.lang === 'tam') {
                const result = func(curnode);
                if(result) curnode.data = result;
            }
            curnode = walker.nextNode();
        }
    };
    
    const toTamil = function(txtnode) {
        return to.tamil(txtnode.data);
    };

    const revertScript = function(txtnode) {
        return _state.savedtext.get(txtnode);
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
            const f = from || 'devanagari';
            return Sanscript.t(text,f,'iast',{skip_sgml: true});
        },
        
        tamil: function(text,placeholder) {
            /*const pl = placeholder || '';
            const txt = to.smush(text,pl);
            return Sanscript.t(txt,'iast','tamil');*/
            return Sanscript.t(text.toLowerCase(),'iast','tamil');
        },
    };
     
    window.addEventListener('load',init);
}());
