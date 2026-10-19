/* Device accessibility preferences follow the portal's local JSON pattern.
   They are separate from assessed learning, account identities and cloud revisions. */
(() => {
 'use strict';
 const key='inneru-accessibility-v1';
 const clean=value=>({language:value?.language==='ar'?'ar':'en',guided:value?.guided===true});
 let value;try{value=clean(JSON.parse(localStorage.getItem(key)));}catch{value=clean();}
 function apply(next,persist=true){value=clean(next);let unavailable=false;if(persist){try{localStorage.setItem(key,JSON.stringify(value));}catch{unavailable=true;}}document.documentElement.lang=value.language;document.documentElement.dir=value.language==='ar'?'rtl':'ltr';document.dispatchEvent(new CustomEvent('inneru-preferences-change',{detail:{...value}}));if(unavailable)document.dispatchEvent(new Event('inneru-preference-storage-unavailable'));}
 window.InneruPreferences={get:()=>({...value}),set:patch=>apply({...value,...patch})};
 window.addEventListener('storage',event=>{if(event.key===key){try{apply(JSON.parse(event.newValue),false);}catch{}}});
 apply(value,false);
})();
