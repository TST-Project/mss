(function() {
    'use strict';
    const state = {
        multiselect: [],
        cmirror: [],
        filename: 'new.xml',
        xmlDoc: null,
        xStyle: null,
        xSheet: 'tei-to-html.xml',
        template: 'tst-template.xml',
        toplevel: 'teiHeader',
    };

    const lf = window.localforage ? window.localforage : null;
    const vanillaSelectBox = window.vanillaSelectBox ? window.vanillaSelectBox : null;
    const FileSaver = window.FileSaver ? window.FileSaver : null;
    const CodeMirror = window.CodeMirror ? window.CodeMirror : null;

    const init = function() {
        lf.length().then(n => {if(n>0) autosaved.fill();});
        document.getElementById('file').addEventListener('change',file.select,false);
        document.getElementById('newfile').addEventListener('click',file.startnew);
        document.body.addEventListener('click',events.bodyClick);
        state.xStyle = file.syncLoad(state.xSheet);
    };
    
    const events = {
        bodyClick: function(e) {
            switch(e.target.id) {
            case 'updateheader':
                e.preventDefault();
                editor.update();
                return;
            case 'cancelheader':
                e.preventDefault();
                editor.destroy();
                return;
            case 'editbutton':
                e.preventDefault();
                editor.init();
                return;
            case 'saveas':
                e.preventDefault();
                file.saveAs();
                return;
            default:
                break;
            }
            
            if(e.target.classList.contains('plusbutton')) {
                editor.addMultiItem(e.target);
            }
            else if(e.target.classList.contains('multi-kill')) {
                editor.killMultiItem(e.target);
            }
        },
    };

    const file = {
        parse: function(func,e) {
            state.xmlDoc = xml.parseString(e.target.result);
            func(state.xmlDoc);
        },
        render: function(xstr) {
            document.getElementById('headereditor').style.display = 'none';
            const result = xml.XSLTransform(state.xStyle,xstr);
            const body = document.querySelector('#headerviewer');
            dom.clearEl(body);
            body.appendChild(result.querySelector('.record-fat'));
            body.style.display = 'inherit';
        },
        saveAs: function() {
            const s = new XMLSerializer();
            const serialized = s.serializeToString(state.xmlDoc);
            const file = new Blob([serialized], {type: 'text/xml;charset=utf-8'});
            const fileURL = state.filename; 
            FileSaver(file,fileURL);
        },

        select: function(e) {
            document.getElementById('openform').style.display = 'none';
            const f = e.target.files[0];
            state.filename = f.name;
            const reader = new FileReader();
            reader.onload = file.parse.bind(null,editor.init);
            reader.readAsText(f);
        },
        startnew: function() {
            document.getElementById('openform').style.display = 'none';
            state.filename = 'new.xml';
            state.xmlDoc = file.syncLoad(state.template);
            //file.render(state.xmlDoc);
            editor.init();
        },
        syncLoad: function(fname) {
            const xhr = new XMLHttpRequest();
            xhr.open('GET',fname,false);
            xhr.send(null);
            return xhr.responseXML;
        },
    };
    
    const editor = {
        addMultiItem: function(button) {
            const par = button.parentNode;
            const ret = button.myItem.cloneNode(true);
            par.insertBefore(ret,button);
            for(const m of ret.querySelectorAll('.multiselect'))
                editor.makeMultiselect(m);
            for(const t of ret.querySelectorAll('textarea'))
                state.cmirror.push(editor.codeMirrorInit(t));
            return ret;
        },
        destroy: function() {
            file.render(state.xmlDoc);
        },
        fillFormField: function(field,toplevel) {
            const selector = field.dataset.select || field.dataset.multiSelect;
            const xmlEl = selector ?
                toplevel.querySelector(selector) :
                toplevel;
            const attr = field.dataset.attr || field.dataset.multiAttr;
            const prefix = field.dataset.prefix;

            if(!xmlEl) return;

            if(!attr) {
                field.value = document.importNode(xmlEl,true).innerHTML.trim();
                return;
            }

            // is attribute
            const vv = xmlEl.getAttribute(attr) || '';
            const value = vv.trim();

            if(field.multiple) {
                const vsplit = value.split(' ');                
                const vmap = prefix ?
                    vsplit.map(s => s.replace(new RegExp('^'+prefix),'')) :
                    vsplit;
                const opts = field.querySelectorAll('option');
                for(const opt of opts) {
                    if(vmap.includes(opt.value))
                        opt.selected = true;
                }
            }
            else {
                field.value = prefix ? 
                    value.replace(new RegExp('^'+prefix),'') :
                    value;
            }
        },
        killMultiItem: function(button) {
            const multiItem = button.closest('.multi-item');
            if(window.confirm('Do you want to delete this item?'))
                multiItem.remove();
        },
        
        makeKillButton: function() {
            const killbutton = dom.makeEl('button');
            killbutton.type = 'button';
            killbutton.classList.add('multi-kill');
            killbutton.appendChild(document.createTextNode('X'));
            return killbutton;
        },

        makeMultiselect: function(el) {
            el.id = 'box' + Math.random().toString(36).substr(2,9);
            const mbox = new vanillaSelectBox(`#${el.id}`,{placeHolder: 'Choose...',disableSelectAll: true});
            mbox.setValue(
                [...el.querySelectorAll('option')].filter(o => o.selected).map(o => o.value)
            );
            state.multiselect.push(mbox);
        },

        init: function() {

            document.getElementById('headerviewer').style.display = 'none';
            
            const heditor = document.getElementById('headereditor');
            heditor.style.display = 'flex';
            
            const fields = heditor.querySelectorAll('[data-select]');
            const toplevel = state.xmlDoc.querySelector(state.toplevel);
            
            for(const field of fields) {
                if(field.classList.contains('multiple')) {
                    
                    if(!field.hasOwnProperty('myItem')) {
                        field.myItem = field.removeChild(field.querySelector('.multi-item'));
                        const killbutton = editor.makeKillButton();
                        field.myItem.insertBefore(killbutton,field.myItem.firstChild);
                    }
                    while(field.firstChild) field.firstChild.remove();

                    const els = state.xmlDoc.querySelectorAll(field.dataset.select);
                    for(const el of els) {
                        const newitem = field.myItem.cloneNode(true);
                        const subfields = newitem.querySelectorAll('input,textarea,select');
                        for(const subfield of subfields) 
                            editor.fillFormField(subfield,el);
                        field.appendChild(newitem);
                    }
                    field.appendChild(dom.makePlusButton(field.myItem));
                }
                else editor.fillFormField(field,toplevel);
            }

            for(const m of heditor.querySelectorAll('.multiselect'))
                editor.makeMultiselect(m);
            
            for(const t of heditor.querySelectorAll('textarea'))
                state.cmirror.push(editor.codeMirrorInit(t));
            heditor.querySelector('#hd_publish_date').value = new Date().getFullYear();
        },

        checkInvalid: function(heditor) {
            const allfields = heditor.querySelectorAll('input,select,textarea');
            for(const field of allfields) {
                if(!field.validity.valid) {
                    return field;
                }
            }
        },
        codeMirrorInit: function(textarea) {
            const getSchema = function() {
                const layout = ['pb','lb','space']; // no divs anymore
                const emendations = ['add','del','subst'];
                const difficult = ['unclear','damage'];
                const descriptive = ['term','note','persName','orgName'];
                const tags = {
                    '!top': [...layout, ...emendations, ...difficult, ...descriptive],
                    '!attrs': {
                    },

                    // Text division & Page layout
                    pb: {
                        attrs: {
                            n: null,
                            facs: null,
                            '/': null,
                        }
                    },
                    lb: {
                        attrs: {
                            n: null,
                            '/': null,
                        }
                    },
                    space: {
                        attrs: {
                            quantity: null,
                            rend: ['overline','dash'],
                            '/': null,
                        }
                    },

                    // Text emendations

                    add: {
                        attrs: {
                            rend: ['caret','above','below'],
                            place: ['above','below','left','right','top','bottom','margin'],
                        },
                        children: [...emendations, ...difficult],
                    },
                    del: {
                        attrs: {
                            rend: ['overstrike','understrike','strikethrough','scribble'],
                        },
                        children: [...emendations, ...difficult],
                    },
                    subst: {
                        attrs: {
                            type: ['transpose'],
                        },
                        children: ['add','del'],
                    },

                    // Difficult or missing text
                    unclear: {
                        attrs: {
                            reason: ['blemish','rubbed','messy'],
                        }
                    },
                    damage: {
                        attrs: {
                            reason: ['torn','hole'],
                            quantity: null,
                        },
                    },

                    // descriptive
                    term: {
                        attrs: {
                            'xml:lang': ['tam','tam-Taml','eng','fra','por','pal','san'],
                        },
                    },
                    note: {
                        attrs: {
                            'xml:lang': ['tam','tam-Taml','eng','fra','por','pal','san'],
                        },
                    },
                    persName: {
                        attrs: {
                            'xml:id': [],
                        },
                    },
                    orgName: {
                        attrs: {
                            'xml:id': [],
                        },
                    },
                };
                return tags;
            };

            const completeAfter = function(cm, pred) {
                //var cur = cm.getCursor();
                if (!pred || pred()) setTimeout(function() {
                    if (!cm.state.completionActive)
                        cm.showHint({completeSingle: false});
                }, 100);
                return CodeMirror.Pass;
            };

            const completeIfAfterLt = function(cm) {
                return completeAfter(cm, function() {
                    var cur = cm.getCursor();
                    return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) == '<';
                });
            };

            const completeIfInTag = function(cm) {
                return completeAfter(cm, function() {
                    var tok = cm.getTokenAt(cm.getCursor());
                    if (tok.type === 'string' && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length == 1)) return false;
                    var inner = CodeMirror.innerMode(cm.getMode(), tok.state).state;
                    return inner.tagName;
                });
            };

            const cm = CodeMirror.fromTextArea(textarea, {
                mode: 'xml',
                lineNumbers: false,
                extraKeys: {
                    '\'<\'': completeAfter,
                    '\'/\'': completeIfAfterLt,
                    '\' \'': completeIfInTag,
                    '\'=\'': completeIfInTag,
                    'Ctrl-Space': 'autocomplete'
                },
                hintOptions: {schemaInfo: getSchema()},
                lint: true,
                gutters: ['CodeMirror-lint-markers'],
                lineWrapping: true,
            });
            return cm;
        },
        
        update: function() {
            const heditor = document.getElementById('headereditor');
            const invalid = editor.checkInvalid(heditor);
            if(invalid) {
                invalid.scrollIntoView({behavior: 'smooth', block: 'center'});
                alert(`Missing ${invalid.name}`);
                return;
            }
            const test = heditor.querySelector('.CodeMirror-lint-marker-error');
            if(test) {
                test.scrollIntoView({behavior: 'smooth', block: 'center'});
                alert('XML error');
                return;
            }
            
            while(state.multiselect.length > 0) state.multiselect.pop().destroy();
            while(state.cmirror.length > 0) state.cmirror.pop().toTextArea();

            const fields = heditor.querySelectorAll('[data-select]');
            const toplevel = state.xmlDoc.querySelector(state.toplevel);
            for(const field of fields) {
                if(field.classList.contains('multiple')) {
                    xml.clearAllEls(field.dataset.select,toplevel);
                    const items = field.querySelectorAll('.multi-item');
                    for(const item of items) {
                        const newXml = xml.makeElDeep(field.dataset.select,toplevel,true);
                        const subfields = item.querySelectorAll('input,textarea,select');
                        for(const subfield of subfields) 
                            editor.updateXMLField(subfield,newXml);
                    }
                }
                else editor.updateXMLField(field,toplevel);
            }

            editor.postProcess(toplevel);
            file.render(state.xmlDoc);
        },
        postProcess: function(toplevel) {
            //update editionStmt
            const par = toplevel || state.xmlDoc;
            const editionStmt = par.querySelector('fileDesc > editionStmt > p');
            const persName = editionStmt.removeChild(editionStmt.querySelector('persName'));
            const orgName = editionStmt.removeChild(editionStmt.querySelector('orgName'));
            while(editionStmt.firstChild) editionStmt.firstChild.remove();
            editionStmt.appendChild(state.xmlDoc.createTextNode('Record edited by '));
            editionStmt.appendChild(persName);
            editionStmt.appendChild(state.xmlDoc.createTextNode(' '));
            editionStmt.appendChild(orgName);
            editionStmt.appendChild(state.xmlDoc.createTextNode('.'));
        },
        updateXMLField: function(field,toplevel) {
            let value = field.type === 'text' ? 
                field.value.trim() : 
                field.value;
            const selector = field.dataset.select || field.dataset.multiSelect;
            let xmlEl = selector ?
                toplevel.querySelector(selector) :
                toplevel;
            const attr = field.dataset.attr || field.dataset.multiAttr;
            const prefix = field.dataset.prefix;

            const valtrim = value.trim();
            if(!valtrim) {
                if(!xmlEl) return;
                else {
                    if(attr)
                        xmlEl.setAttribute(attr,'');
                    else
                        xmlEl.innerHTML = '';
                    return;
                }
            }
            if(!xmlEl) xmlEl = xml.makeElDeep(selector,toplevel);
            if(field.multiple) {
                const selected = [];
                for(const opt of field.querySelectorAll('option'))
                    if(opt.selected) selected.push(opt.value);
                value = selected.join(' ');
            }

            if(prefix) 
                value = prefix + value;
            if(attr)
                xmlEl.setAttribute(attr,value);
            else
                xmlEl.innerHTML = value;
        
            //editor.reorder();

            return true;
        },
    };

    const xml = {
        parseString: function(str) {
            const parser = new DOMParser();
            const newd = parser.parseFromString(str,'text/xml');
            if(newd.documentElement.nodeName === 'parsererror')
                alert('XML errors');
            else
                return newd;
        },

        XSLTransform: function(xslsheet,doc) {
            const xproc = new XSLTProcessor();
            xproc.importStylesheet(xslsheet);
            return xproc.transformToDocument(doc);
        },
    
        clearEl: function(path,toplevel) {
            const par = toplevel || state.xmlDoc;
            const el = par.querySelector(path);
            if(el) el.remove();
        },
        clearAllEls: function(path,toplevel) {
            const els = toplevel.querySelectorAll(path);
            for(const el of els)
                el.remove();
        },
        makeElDeep: function(path,toplevel,duplicate) {
            const top = state.xmlDoc.documentElement;
            const ns = top.namespaceURI;
            const children = path.split(/\s*>\s*/g).filter(x => x);
            const last = duplicate ?
                children.pop() :
                null;

            const makeNewChild = function(path,par) {
                const childsplit = path.split('[');
                const new_child = state.xmlDoc.createElementNS(ns,childsplit[0]);
                par.appendChild(new_child);
                if(childsplit.length > 1) { // add attribute
                    const attrsplit = childsplit[1].split('=');
                    const attr = attrsplit[0];
                    const val = attrsplit[1].replace(/[\]''""]/g,'');
                    new_child.setAttribute(attr,val);
                }
                return new_child;
            };
            
            let par_el = toplevel;
            for(const child of children) {
                const child_el = par_el.querySelector(child);
                if(!child_el) {
                    par_el = makeNewChild(child,par_el);
                }
                else par_el = child_el;
            }
            return duplicate ?
                makeNewChild(last,par_el) :
                par_el;
        },
    };

    const autosaved = {
        fill: function() {
            const box = document.getElementById('autosavebox');
            box.style.display = 'flex';
            lf.keys().then(ks => {
                for(const k of ks) {
                    const newel = dom.makeEl('div');
                    newel.classList.add('autosaved');
                    newel.appendChild(document.createTextNode(k));
                    newel.dataset.storageKey = k;
                    const trashasset = document.querySelector('#assets #trash');
                    const trash = dom.makeEl('span');
                    trash.classsList.add('trash');
                    trash.appendChild(trashasset.cloneNode(true));
                    trash.height = 20;
                    newel.appendChild(trash);
                    newel.addEventListener('click',autosaved.load.bind(null,k));
                    trash.addEventListener('click',autosaved.remove.bind(null,k));
                    box.appendChild(newel);
                }
            });
        },

        load: function(k,e) {
            if(e.target.tagName === 'SVG')
                return;
            lf.getItem(k).then(i => {
                file.parse({target: {result: i}});
            });
        },

        remove: function(k) {
            lf.removeItem(k);
            document.querySelector(`#autosavebox .autosaved[data-storage-key='${k}']`).remove();
        },
    }; // end autosaved
    
    const dom = {
        clearEl: function(el) {
            while(el.firstChild)
                el.removeChild(el.firstChild);
        },
        makeEl: function(name,doc) {
            const d = doc ? doc : document;
            return d.createElement(name);
        },
        makePlusButton: function(el) {
            const button = dom.makeEl('div');
            const emptyel = el.cloneNode(true);
            for(const i of emptyel.querySelectorAll('input,textarea')) {
                i.value = '';
            }
            for(const o of emptyel.querySelectorAll('option')) {
                o.selected = false;
            }

            button.classList.add('plusbutton');
            button.appendChild(document.createTextNode('+'));
            button.title = 'Add new section';
            button.myItem = emptyel;
            return button;
        },
    };
    
    window.addEventListener('load',init);
}());
