(function() {
    'use strict';
    const state = {
        filename: null,
        xmlDoc: null,
        xStyle: null,
        xSheet: 'tei-to-html.xml',
        template: 'tst-template.xml',
        toplevel: 'teiHeader',
    };

    const lf = window.localforage ? window.localforage : null;
    const Choices = window.Choices ? window.Choices : null;

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
                editor.update();
                return;
            case 'cancelheader':
                editor.destroy();
                return;
            default:
                break;
            }
            
            if(e.target.classList.contains('plusbutton')) {
                editor.addMultiItem(e.target);
            }
        },
    };

    const file = {
        parse: function(e) {
            state.xmlDoc = xml.parseString(e.target.result);
            file.render(state.xmlDoc);
        },
        render: function(xstr) {
            const result = xml.XSLTransform(state.xStyle,xstr);
            const body = document.querySelector('article');
            dom.clearEl(body);
            body.appendChild(result.firstElementChild);
        },
        select: function(e) {
            document.getElementById('openform').style.display = 'none';
            const f = e.target.files[0];
            state.filename = f.name;
            const reader = new FileReader();
            reader.onload = file.parse;
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
            par.insertBefore(button.myItem.cloneNode(true),button);
        },
        destroy: function() {
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
        init: function() {
            const heditor = document.getElementById('headereditor');
            heditor.style.display = 'flex';
            const fields = heditor.querySelectorAll('[data-select]');
            const toplevel = state.xmlDoc.querySelector(state.toplevel);
            for(const field of fields) {
                if(field.classList.contains('multiple')) {
                    const els = state.xmlDoc.querySelectorAll(field.dataset.select);
                    const multiItem = field.removeChild(field.querySelector('.multi-item'));
                    for(const el of els) {
                        const newitem = multiItem.cloneNode(true);
                        const subfields = newitem.querySelectorAll('input,textarea,select');
                        for(const subfield of subfields) 
                            editor.fillFormField(subfield,el);
                        field.appendChild(newitem);
                    }
                    field.appendChild(dom.makePlusButton(multiItem));
                }
                else editor.fillFormField(field,toplevel);
            }
                
            for(const m of heditor.querySelectorAll('.multiselect'))
                new Choices(m);

            heditor.querySelector('#hd_publish_date').value = new Date().getFullYear();
        },
        checkInvalid: function(heditor) {
            const allfields = heditor.querySelectorAll('input,select,textarea');
            for(const field of allfields) {
                if(!field.validity.valid) {
                    return field.name;
                }
            }
        },
        update: function() {
            const heditor = document.getElementById('headereditor');
            const invalid = editor.checkInvalid(heditor);
            if(invalid) {
                alert(`Missing ${invalid}`);
                return;
            }
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
            file.render(state.xmlDoc);
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
                for(const opt of field.querySelectorAll('option[selected]'))
                    selected.push(opt.value);
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
            const el = toplevel.querySelector(path);
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
            button.classList.add('plusbutton');
            button.appendChild(document.createTextNode('+'));
            button.title = 'Add new section';
            button.myItem = el;
            return button;
        },
    };
    
    window.addEventListener('load',init);
}());
