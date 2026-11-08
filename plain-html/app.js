/* ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
// SCI One: plain browser JavaScript. No imports, frameworks, or package installation.
(function(){
"use strict";
// UI state and browser DOM helpers; all application code runs locally.
function saved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
const appState = {
  page:'home', cap:'Supplier Intelligence', tray:'', preview:'', q:'', local:'',
  type:'All Types', availability:'All Availability', ba:'All BAs', limit:8,
  info:null, doc:null, mobile:false, life:true, functional:true,
  favorites:saved('sci-favorites',[1,5]), compact:saved('sci-compact',false),
  selectedSupplier:'Honeywell'
};
if(!Array.isArray(appState.favorites))appState.favorites=[1,5];
let demoState = null;
let activeDemo = document.documentElement.dataset.sciDemoId || new URLSearchParams(location.search).get('demo');
let pending = false;
function update(state, key, value) {
  const next = typeof value==='function' ? value(state[key]) : value;
  if(Object.is(state[key], next))return;
  state[key] = next;
  if(state===appState && (key==='favorites'||key==='compact')) {
    try { localStorage.setItem('sci-'+key, JSON.stringify(next)); } catch {}
  }
  if(!pending) { pending=true; queueMicrotask(()=>{pending=false;render();}); }
}
const svgTags = new Set('svg defs linearGradient stop path circle rect line polyline polygon ellipse g title text'.split(' '));
function fragment(props) {
  const node=document.createDocumentFragment();
  append(node,props.children);
  return node;
}
function append(node, children) {
  for(const child of children.flat(Infinity)) {
    if(child===null||child===undefined||typeof child==='boolean')continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}
function el(tag, props, ...children) {
  props=props||{};
  if(typeof tag==='function')return tag({...props,children});
  const svg=svgTags.has(tag);
  const node=svg?document.createElementNS('http://www.w3.org/2000/svg',tag):document.createElement(tag);
  for(const [name,value] of Object.entries(props)) {
    if(name==='key'||name==='children'||value===null||value===undefined)continue;
    if(name.startsWith('on')&&typeof value==='function') {
      let event=name.slice(2).toLowerCase();
      if(event==='change'&&tag==='input'&&props.type!=='checkbox')event='input';
      node.addEventListener(event,value);
    } else if(name==='style'&&typeof value==='object') {
      Object.assign(node.style,value);
    } else if(name==='className')node.setAttribute('class',value);
    else if(!svg&&(name==='value'||name==='checked')) { /* apply after children */ }
    else if(svg)node.setAttribute(name.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()).replace('view-box','viewBox').replace('preserve-aspect-ratio','preserveAspectRatio'),value);
    else if(typeof value==='boolean') { if(value)node.setAttribute(name,''); }
    else node.setAttribute(name,value);
  }
  append(node,children);
  if(!svg&&'value'in props)node.value=props.value;
  if(!svg&&'checked'in props)node.checked=props.checked;
  return node;
}
function drawIcon(data, props={}) {
  const [tag, attributes, children]=data;
  const p={...attributes,...props,'aria-hidden':'true'};
  if(props.size)p.width=p.height=props.size;
  delete p.size;
  if(props.strokeWidth) {p['stroke-width']=props.strokeWidth;delete p.strokeWidth;}
  return el(tag,p,...(children||[]).map(c=>drawIcon(c)));
}
function launchTool(tool) {
  // Copy this document into the new tab, including its embedded CSS and JS.
  // This avoids navigating to a file:// URL with a query string, which some
  // managed browsers leave blank. No extra HTML file or network request is needed
  // when this is the standalone edition.
  let popup;
  try {
    popup=window.open('', '_blank');
    if(popup) {
      const page=document.documentElement.cloneNode(true);
      page.dataset.sciDemoId=String(tool.id);
      page.querySelector('#root').replaceChildren();
      const base=page.querySelector('base')||document.createElement('base');
      base.href=document.baseURI;
      page.querySelector('head').prepend(base);
      popup.document.open();
      popup.document.write('<!doctype html>'+page.outerHTML);
      popup.document.close();
      popup.opener=null;
      popup.focus();
      return;
    }
  } catch {
    try { popup?.close(); } catch {}
  }
  // If a new tab is blocked, the dashboard remains available in this tab.
  activeDemo=String(tool.id);
  demoState=null;
  render();
}
function closeTool() {
  if(document.documentElement.dataset.sciDemoId)window.close();
  activeDemo=null;
  demoState=null;
  render();
}
function render() {
  const root=document.getElementById('root');
  const active=document.activeElement;
  const controls=[...root.querySelectorAll('input,select,button,a')];
  const focusIndex=controls.indexOf(active);
  const label=active?.getAttribute('aria-label');
  let selection=null;
  if(active instanceof HTMLInputElement && active.type!=='checkbox')selection=[active.selectionStart,active.selectionEnd];
  root.replaceChildren(App());
  const nextControls=[...root.querySelectorAll('input,select,button,a')];
  const target=label?nextControls.find(n=>n.getAttribute('aria-label')===label):nextControls[focusIndex];
  if(target&&focusIndex>=0) {
    target.focus({preventScroll:true});
    if(selection&&target instanceof HTMLInputElement)target.setSelectionRange(...selection);
  }
}
window.addEventListener('keydown',e=>{
  if(e.key==='Escape')for(const [key,value] of Object.entries({info:null,doc:null,tray:'',preview:'',q:'',mobile:false}))update(appState,key,value);
});
document.addEventListener('click',e=>{
  if(appState.info!==null&&!e.target.closest('.tool-popover,.info-btn'))update(appState,'info',null);
  if(appState.tray&&!e.target.closest('.tray-overlay,.sidebar')) {update(appState,'tray','');update(appState,'preview','');}
});

const setPage=v=>update(appState,"page",v);
const setCap=v=>update(appState,"cap",v);
const setTray=v=>update(appState,"tray",v);
const setPreview=v=>update(appState,"preview",v);
const setQ=v=>update(appState,"q",v);
const setLocal=v=>update(appState,"local",v);
const setType=v=>update(appState,"type",v);
const setAvailability=v=>update(appState,"availability",v);
const setBa=v=>update(appState,"ba",v);
const setLimit=v=>update(appState,"limit",v);
const setInfo=v=>update(appState,"info",v);
const setDoc=v=>update(appState,"doc",v);
const setMobile=v=>update(appState,"mobile",v);
const setLife=v=>update(appState,"life",v);
const setFunctional=v=>update(appState,"functional",v);
const setFavorites=v=>update(appState,"favorites",v);
const setCompact=v=>update(appState,"compact",v);
const setSelectedSupplier=v=>update(appState,"selectedSupplier",v);
const Home = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"}],["path",{"d":"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}]]],p);
const Box = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"}],["path",{"d":"m3.3 7 8.7 5 8.7-5"}],["path",{"d":"M12 22V12"}]]],p);
const Layers = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"}],["path",{"d":"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"}],["path",{"d":"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"}]]],p);
const Star = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"}]]],p);
const Settings = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"}],["circle",{"cx":"12","cy":"12","r":"3"}]]],p);
const Search = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["circle",{"cx":"11","cy":"11","r":"8"}],["path",{"d":"m21 21-4.3-4.3"}]]],p);
const ChevronDown = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"m6 9 6 6 6-6"}]]],p);
const ChevronRight = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"m9 18 6-6-6-6"}]]],p);
const ArrowRight = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M5 12h14"}],["path",{"d":"m12 5 7 7-7 7"}]]],p);
const ExternalLink = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M15 3h6v6"}],["path",{"d":"M10 14 21 3"}],["path",{"d":"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}]]],p);
const Users = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}],["circle",{"cx":"9","cy":"7","r":"4"}],["path",{"d":"M22 21v-2a4 4 0 0 0-3-3.87"}],["path",{"d":"M16 3.13a4 4 0 0 1 0 7.75"}]]],p);
const ChartNoAxesColumnIncreasing = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["line",{"x1":"12","x2":"12","y1":"20","y2":"10"}],["line",{"x1":"18","x2":"18","y1":"20","y2":"4"}],["line",{"x1":"6","x2":"6","y1":"20","y2":"16"}]]],p);
const Globe = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"}],["path",{"d":"M2 12h20"}]]],p);
const Coins = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["circle",{"cx":"8","cy":"8","r":"6"}],["path",{"d":"M18.09 10.37A6 6 0 1 1 10.34 18"}],["path",{"d":"M7 6h1v4"}],["path",{"d":"m16.71 13.88.7.71-2.82 2.82"}]]],p);
const Clock = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["circle",{"cx":"12","cy":"12","r":"10"}],["polyline",{"points":"12 6 12 12 16 14"}]]],p);
const Handshake = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"m11 17 2 2a1 1 0 1 0 3-3"}],["path",{"d":"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"}],["path",{"d":"m21 3 1 11h-2"}],["path",{"d":"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"}],["path",{"d":"M3 4h8"}]]],p);
const Shield = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}]]],p);
const Truck = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"}],["path",{"d":"M15 18H9"}],["path",{"d":"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"}],["circle",{"cx":"17","cy":"18","r":"2"}],["circle",{"cx":"7","cy":"18","r":"2"}]]],p);
const Info = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 16v-4"}],["path",{"d":"M12 8h.01"}]]],p);
const BookOpen = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M12 7v14"}],["path",{"d":"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"}]]],p);
const Check = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M20 6 9 17l-5-5"}]]],p);
const X = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]]],p);
const Sparkles = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"}],["path",{"d":"M20 3v4"}],["path",{"d":"M22 5h-4"}],["path",{"d":"M4 17v2"}],["path",{"d":"M5 18H3"}]]],p);
const SlidersHorizontal = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["line",{"x1":"21","x2":"14","y1":"4","y2":"4"}],["line",{"x1":"10","x2":"3","y1":"4","y2":"4"}],["line",{"x1":"21","x2":"12","y1":"12","y2":"12"}],["line",{"x1":"8","x2":"3","y1":"12","y2":"12"}],["line",{"x1":"21","x2":"16","y1":"20","y2":"20"}],["line",{"x1":"12","x2":"3","y1":"20","y2":"20"}],["line",{"x1":"14","x2":"14","y1":"2","y2":"6"}],["line",{"x1":"8","x2":"8","y1":"10","y2":"14"}],["line",{"x1":"16","x2":"16","y1":"18","y2":"22"}]]],p);
const Menu = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["line",{"x1":"4","x2":"20","y1":"12","y2":"12"}],["line",{"x1":"4","x2":"20","y1":"6","y2":"6"}],["line",{"x1":"4","x2":"20","y1":"18","y2":"18"}]]],p);
const ArrowLeft = p=>drawIcon(["svg",{"xmlns":"http://www.w3.org/2000/svg","width":24,"height":24,"viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"},[["path",{"d":"m12 19-7-7 7-7"}],["path",{"d":"M19 12H5"}]]],p);
const caps = ["Lead Time", "Cost Recovery", "Supplier Intelligence", "Supplier Engagement", "Supplier Risk Analysis", "Supplier Quality + Delivery"];
const capIcons = [Clock, Coins, ChartNoAxesColumnIncreasing, Handshake, Shield, Truck];
const bas = ["Aero", "RMS", "MFC", "Space", "EO"];
const tools = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, name: `Tool Example ${i + 1}`, type: i % 2 ? "AI" : "Analytics", availability: [0, 3, 4, 7].includes(i % 8) ? "Enterprise" : "BA Specific", ba: i === 4 ? "RMS" : bas[(i + 1) % 5], icon: [ChartNoAxesColumnIncreasing, Users, Globe, Coins][i % 4], description: "Provides supplier intelligence and reporting to support research, analysis, and supply chain decision-making.", owner: ["Rob Biddle", "SCI Analytics", "Supply Chain Intelligence"][i % 3], capability: "Supplier Intelligence" }));
const searchNames = ["Supplier Performance Dashboard", "Supplier Research Assistant", "Cost & Spend Analysis"];
function Glyph({ icon: Icon = Layers, tone = "blue", small = false }) {
  return /* @__PURE__ */ el("span", { className: `glyph ${tone} ${small ? "small" : ""}` }, /* @__PURE__ */ el(Icon, { strokeWidth: 1.9 }));
}
function Tags({ tool, ba = false }) {
  return /* @__PURE__ */ el("span", { className: "tags" }, /* @__PURE__ */ el("span", { className: `tag ${tool.type === "AI" ? "purple" : "blue"}` }, tool.type), /* @__PURE__ */ el("span", { className: `tag ${tool.availability === "Enterprise" ? "green" : "gold"}` }, tool.availability), ba && /* @__PURE__ */ el("span", { className: "tag neutral" }, tool.ba));
}
function Waves() {
  return /* @__PURE__ */ el("div", { className: "waves" }, /* @__PURE__ */ el("svg", { viewBox: "0 0 1400 950", preserveAspectRatio: "none" }, /* @__PURE__ */ el("defs", null, /* @__PURE__ */ el("linearGradient", { id: "a" }, /* @__PURE__ */ el("stop", { stopColor: "#79c9ff" }), /* @__PURE__ */ el("stop", { offset: "1", stopColor: "#b39bfa" })), /* @__PURE__ */ el("linearGradient", { id: "b" }, /* @__PURE__ */ el("stop", { stopColor: "#169eff" }), /* @__PURE__ */ el("stop", { offset: "1", stopColor: "#9c7bfa" }))), /* @__PURE__ */ el("path", { d: "M0 440 Q220 245 440 450 T920 460 T1400 370 L1400 620 Q1170 720 920 610 T440 600 T0 720Z", fill: "url(#a)", opacity: ".22" }), /* @__PURE__ */ el("path", { d: "M0 510 Q220 345 440 550 T920 580 T1400 450 L1400 700 Q1170 800 920 690 T440 700 T0 810Z", fill: "url(#b)", opacity: ".34" }), /* @__PURE__ */ el("path", { d: "M0 650 Q230 500 470 690 T960 720 T1400 600 L1400 950 L0 950Z", fill: "url(#a)", opacity: ".13" })));
}
function App() {
  const { page, cap, tray, preview, q, local, type, availability, ba, limit, info, doc, mobile, life, functional, favorites, compact, selectedSupplier } = appState;
  function go(p, c) {
    setPage(p);
    if (c) setCap(c);
    setTray("");
    setPreview("");
    setQ("");
    setMobile(false);
    setInfo(null);
    setLimit(8);
    setLocal("");
    setType("All Types");
    setAvailability("All Availability");
    setBa("All BAs");
  }
  function fav(id) {
    setFavorites((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);
  }
  const launch = (t) => launchTool(t);
  const filtered = tools.filter((t) => (page !== "favorites" || favorites.includes(t.id)) && (!local || `${t.name} ${t.description} ${t.ba}`.toLowerCase().includes(local.toLowerCase())) && (type === "All Types" || type === t.type) && (availability === "All Availability" || availability === t.availability) && (ba === "All BAs" || ba === t.ba));
  const query = q.trim().toLowerCase();
  const supplierMatch = ["Honeywell", "BAE Systems", "L3Harris", "Raytheon", "Boeing"].filter((s) => s.toLowerCase().includes(query));
  const matchingTools = tools.filter((t, i) => `${t.name} ${searchNames[i % 3]} ${t.description} ${t.ba} honeywell`.toLowerCase().includes(query));
  const searchField = (home = false) => /* @__PURE__ */ el("div", { className: `search-wrap ${home ? "hero-search" : ""}` }, /* @__PURE__ */ el(Search, null), /* @__PURE__ */ el("input", { "aria-label": "Search SCI One", placeholder: home ? "Search for suppliers, solutions, and more..." : "Search tools, capabilities, and suppliers...", value: q, onChange: (e) => setQ(e.target.value), onKeyDown: (e) => {
    if (e.key === "Enter" && q.trim()) {
      setPage("search");
      setTray("");
      setPreview("");
    }
  } }), q && /* @__PURE__ */ el("button", { className: "icon-button", "aria-label": "Clear search", onClick: () => setQ("") }, /* @__PURE__ */ el(X, { size: 20 })));
  function SearchResults() {
    return /* @__PURE__ */ el("div", { className: "search-results glass" }, supplierMatch.length > 0 && /* @__PURE__ */ el(fragment, null, /* @__PURE__ */ el("h3", null, /* @__PURE__ */ el(Users, null), "Supplier"), supplierMatch.map((s) => /* @__PURE__ */ el("button", { className: "supplier-result", key: s, onClick: () => {
      setSelectedSupplier(s);
      setPage("supplier");
      setQ("");
      setTray("");
    } }, /* @__PURE__ */ el("strong", { className: "supplier-logo" }, s), /* @__PURE__ */ el("span", null, /* @__PURE__ */ el("b", null, s), /* @__PURE__ */ el("small", null, "Supplier profile, key information, and related tools")), /* @__PURE__ */ el(ChevronRight, null)))), /* @__PURE__ */ el("h3", null, /* @__PURE__ */ el(ChartNoAxesColumnIncreasing, null), "Tools & Solutions"), matchingTools.slice(0, 3).map((t, i) => /* @__PURE__ */ el("button", { className: "result-row", key: t.id, onClick: () => launch(t) }, /* @__PURE__ */ el(Glyph, { icon: t.icon, tone: t.type === "AI" ? "purple" : "blue" }), /* @__PURE__ */ el("span", { className: "result-copy" }, /* @__PURE__ */ el("b", null, query.includes("tool") ? t.name : searchNames[i]), /* @__PURE__ */ el("small", null, ["OTD, quality, and delivery performance", "Supplier research, insights, and risk summary", "Spend, price trends, and cost performance"][i], supplierMatch[0] ? ` for ${supplierMatch[0]}` : "")), /* @__PURE__ */ el(Tags, { tool: t }), /* @__PURE__ */ el(ExternalLink, { size: 21 }))), matchingTools.length === 0 && /* @__PURE__ */ el("p", { className: "empty" }, "No tools found. Try \u201CHoneywell\u201D, \u201Csupplier\u201D, or \u201CTool Example 5\u201D."), /* @__PURE__ */ el("h3", null, /* @__PURE__ */ el(Layers, null), "Capabilities"), /* @__PURE__ */ el("button", { className: "result-row", onClick: () => go("library", "Supplier Intelligence") }, /* @__PURE__ */ el(Glyph, { icon: Layers }), /* @__PURE__ */ el("span", { className: "result-copy" }, /* @__PURE__ */ el("b", null, "Supplier Intelligence"), /* @__PURE__ */ el("small", null, "Tools and solutions for supplier performance, risk, and market insights")), /* @__PURE__ */ el(ChevronRight, null)), /* @__PURE__ */ el("button", { className: "all-results", onClick: () => {
      setPage("search");
      setTray("");
    } }, "View All Results ", /* @__PURE__ */ el(ArrowRight, null)));
  }
  function ToolRow({ t }) {
    return /* @__PURE__ */ el("div", { className: "tool-row" }, /* @__PURE__ */ el(Glyph, { icon: t.icon, tone: t.icon === Coins ? "orange" : "blue", small: true }), /* @__PURE__ */ el("b", { className: "tool-name" }, t.name), /* @__PURE__ */ el("button", { className: `icon-button info-btn ${info === t.id ? "active" : ""}`, "aria-label": `Information for ${t.name}`, onClick: () => setInfo(info === t.id ? null : t.id) }, /* @__PURE__ */ el(Info, { size: 20 })), /* @__PURE__ */ el(Tags, { tool: t, ba: true }), /* @__PURE__ */ el("button", { className: `icon-button favorite ${favorites.includes(t.id) ? "saved" : ""}`, "aria-label": `${favorites.includes(t.id) ? "Remove" : "Add"} ${t.name} ${favorites.includes(t.id) ? "from" : "to"} favorites`, onClick: () => fav(t.id) }, /* @__PURE__ */ el(Star, { size: 19, fill: favorites.includes(t.id) ? "currentColor" : "none" })), /* @__PURE__ */ el("button", { className: "view-tool", onClick: () => launch(t) }, "View Tool ", /* @__PURE__ */ el(ExternalLink, { size: 15 })), info === t.id && /* @__PURE__ */ el("div", { className: "tool-popover glass" }, /* @__PURE__ */ el("button", { className: "popover-close icon-button", "aria-label": "Close tool information", onClick: () => setInfo(null) }, /* @__PURE__ */ el(X, { size: 17 })), /* @__PURE__ */ el("h3", null, t.name), /* @__PURE__ */ el("p", null, t.description), /* @__PURE__ */ el(Tags, { tool: t }), /* @__PURE__ */ el("p", { className: "owner" }, "Owner: ", t.owner, /* @__PURE__ */ el("br", null), "Business Area: ", t.ba), /* @__PURE__ */ el("button", { className: "documentation", onClick: () => {
      setDoc(t);
      setInfo(null);
    } }, /* @__PURE__ */ el(BookOpen, { size: 21 }), " View Documentation ", /* @__PURE__ */ el(ExternalLink, { size: 16 }))));
  }
  const demoId = activeDemo;
  if (demoId) return /* @__PURE__ */ el(Demo, { tool: tools.find((t) => t.id === Number(demoId)) || tools[4] });
  return /* @__PURE__ */ el("div", { className: `app ${compact ? "compact" : ""}` }, /* @__PURE__ */ el("button", { className: "mobile-toggle icon-button", "aria-label": "Toggle navigation", onClick: () => setMobile(!mobile) }, /* @__PURE__ */ el(Menu, null)), /* @__PURE__ */ el("aside", { className: `sidebar ${mobile ? "open" : ""}` }, /* @__PURE__ */ el("button", { className: "brand", onClick: () => go("home") }, "SCI One"), /* @__PURE__ */ el("button", { className: `nav-main home-nav ${page === "home" ? "selected" : ""}`, onClick: () => go("home") }, /* @__PURE__ */ el(Home, null), "Home"), /* @__PURE__ */ el("div", { className: "nav-section" }, /* @__PURE__ */ el("span", { className: "nav-label" }, "CAPABILITIES"), /* @__PURE__ */ el("button", { className: "nav-main", onClick: () => setLife(!life) }, /* @__PURE__ */ el(Box, null), "Lifecycle", /* @__PURE__ */ el(ChevronDown, { className: !life ? "rotated" : "" })), life && /* @__PURE__ */ el("div", { className: "subnav" }, ["Capture", "Pre Award / Pre PO", "Post Award / PO Closeout"].map((n) => /* @__PURE__ */ el("button", { key: n, onClick: () => go("library", n) }, n))), /* @__PURE__ */ el("button", { className: "nav-main", onClick: () => setFunctional(!functional) }, /* @__PURE__ */ el(Layers, null), "Functional", /* @__PURE__ */ el(ChevronDown, { className: !functional ? "rotated" : "" })), functional && /* @__PURE__ */ el("div", { className: "subnav" }, ["Supplier", "Compliance", "Price + Cost", "PR Management", "Business Management"].map((n) => /* @__PURE__ */ el("button", { key: n, className: n === "Supplier" && (tray || page === "library" || page === "supplier") ? "selected" : "", onClick: () => n === "Supplier" ? (setTray(tray ? "" : "Supplier"), setPreview(""), setQ("")) : go("library", n) }, n, n === "Supplier" && /* @__PURE__ */ el(ChevronRight, { size: 18 }))))), /* @__PURE__ */ el("div", { className: "nav-section utility" }, /* @__PURE__ */ el("button", { className: `nav-main ${page === "favorites" ? "selected" : ""}`, onClick: () => go("favorites") }, /* @__PURE__ */ el(Star, null), "Favorites"), /* @__PURE__ */ el("button", { className: `nav-main ${page === "all" ? "selected" : ""}`, onClick: () => go("all") }, /* @__PURE__ */ el(Layers, null), "All Solutions"), /* @__PURE__ */ el("button", { className: `nav-main ${page === "settings" ? "selected" : ""}`, onClick: () => go("settings") }, /* @__PURE__ */ el(Settings, null), "Settings")), /* @__PURE__ */ el("div", { className: "profile" }, /* @__PURE__ */ el("span", { className: "avatar" }, "JH"), /* @__PURE__ */ el("span", null, "Josh Holly"), /* @__PURE__ */ el("button", { "aria-label": "Profile settings", className: "icon-button", onClick: () => go("settings") }, /* @__PURE__ */ el(Settings, null)))), /* @__PURE__ */ el("main", { className: page === "home" ? "home-main" : "interior" }, /* @__PURE__ */ el(Waves, null), page === "home" ? /* @__PURE__ */ el("div", { className: `hero ${q || tray ? "engaged" : ""}` }, /* @__PURE__ */ el("h1", null, "Welcome to SCI One"), /* @__PURE__ */ el("p", null, "Your library of supply chain tools and solutions."), searchField(true), q && /* @__PURE__ */ el(SearchResults, null)) : /* @__PURE__ */ el("header", { className: "topbar" }, searchField()), page !== "home" && q && page !== "search" && /* @__PURE__ */ el("div", { className: "interior-results" }, /* @__PURE__ */ el(SearchResults, null)), tray && /* @__PURE__ */ el("div", { className: "tray-overlay" }, /* @__PURE__ */ el("section", { className: "cap-tray glass" }, /* @__PURE__ */ el("header", null, /* @__PURE__ */ el(Glyph, { icon: Users }), /* @__PURE__ */ el("div", null, /* @__PURE__ */ el("h2", null, "Supplier"), /* @__PURE__ */ el("p", null, "Discover tools for supplier insights, performance,", /* @__PURE__ */ el("br", null), " risk, and collaboration."))), /* @__PURE__ */ el("h3", null, "Sub-Capabilities (6)"), caps.map((n, i) => /* @__PURE__ */ el("button", { className: `cap-row ${preview === n ? "highlight" : ""}`, key: n, onMouseEnter: () => setPreview(n), onFocus: () => setPreview(n), onClick: () => setPreview(n) }, /* @__PURE__ */ el(Glyph, { icon: capIcons[i], tone: ["green", "orange", "blue", "purple", "blue", "purple"][i], small: true }), /* @__PURE__ */ el("b", null, n), /* @__PURE__ */ el(ChevronRight, null)))), preview && /* @__PURE__ */ el("section", { className: "preview-tray glass" }, /* @__PURE__ */ el("header", null, /* @__PURE__ */ el(Glyph, { icon: capIcons[caps.indexOf(preview)] }), /* @__PURE__ */ el("h2", null, preview)), /* @__PURE__ */ el("h3", null, "Top 4 Viewed Tools"), tools.slice(0, 4).map((t) => /* @__PURE__ */ el("button", { className: "preview-tool", key: t.id, onClick: () => launch(t) }, /* @__PURE__ */ el(Glyph, { icon: t.icon, small: true }), /* @__PURE__ */ el("b", null, t.name), /* @__PURE__ */ el(Tags, { tool: t }), /* @__PURE__ */ el(ExternalLink, { size: 20 }))), /* @__PURE__ */ el("button", { className: "all-tools-link", onClick: () => go("library", preview) }, /* @__PURE__ */ el(Layers, null), "All Tools", /* @__PURE__ */ el(ChevronRight, null)))), ["library", "all", "favorites"].includes(page) && /* @__PURE__ */ el("div", { className: "content" }, /* @__PURE__ */ el("div", { className: "breadcrumbs" }, /* @__PURE__ */ el("button", { onClick: () => go("all") }, "Capabilities"), /* @__PURE__ */ el(ChevronRight, null), "Functional", /* @__PURE__ */ el(ChevronRight, null), /* @__PURE__ */ el("button", { onClick: () => {
    setTray("Supplier");
    setPreview("");
  } }, "Supplier"), /* @__PURE__ */ el(ChevronRight, null), /* @__PURE__ */ el("b", null, page === "library" ? cap : page === "favorites" ? "My Favorites" : "All Solutions")), /* @__PURE__ */ el("div", { className: "page-heading" }, /* @__PURE__ */ el(Glyph, { icon: page === "favorites" ? Star : page === "all" ? Layers : ChartNoAxesColumnIncreasing }), /* @__PURE__ */ el("div", null, /* @__PURE__ */ el("h1", null, page === "library" ? cap : page === "favorites" ? "My Favorites" : "All Solutions"), /* @__PURE__ */ el("p", null, page === "favorites" ? "Your saved tools and solutions, all in one place." : page === "all" ? "Discover supply chain tools and solutions across the enterprise." : `Discover tools supporting ${cap === "Supplier Intelligence" ? "supplier research, insights, and intelligence" : cap.toLowerCase()} across the enterprise.`))), /* @__PURE__ */ el("div", { className: `library-layout ${page !== "library" ? "full" : ""}` }, page === "library" && /* @__PURE__ */ el("aside", { className: "glance glass" }, /* @__PURE__ */ el("h2", null, "At a Glance"), /* @__PURE__ */ el("p", null, "Explore tools that help teams understand supplier capabilities, performance, and opportunities."), /* @__PURE__ */ el("ul", null, ["Supplier research", "Supplier profiles", "Market intelligence", "Supplier insights"].map((s) => /* @__PURE__ */ el("li", { key: s }, /* @__PURE__ */ el("span", null, /* @__PURE__ */ el(Check, { size: 15 })), s))), /* @__PURE__ */ el("div", { className: "count-label" }, "20 solutions \xB7 Illustrative")), /* @__PURE__ */ el("section", { className: "tool-library glass" }, /* @__PURE__ */ el("div", { className: "section-title" }, /* @__PURE__ */ el("h2", null, page === "favorites" ? "Saved Tools" : "All Tools"), /* @__PURE__ */ el("span", null, page === "favorites" ? favorites.length : 20, " solutions \xB7 Illustrative")), /* @__PURE__ */ el("div", { className: "local-search" }, /* @__PURE__ */ el(Search, null), /* @__PURE__ */ el("input", { "aria-label": "Search tools in this library", value: local, onChange: (e) => {
    setLocal(e.target.value);
    setLimit(8);
  }, placeholder: `Search ${page === "library" ? cap + " tools" : "tools and solutions"}...` }), local && /* @__PURE__ */ el("button", { className: "icon-button", "aria-label": "Clear library search", onClick: () => setLocal("") }, /* @__PURE__ */ el(X, { size: 16 }))), /* @__PURE__ */ el("div", { className: "filters" }, [["Tool Type", type, setType, ["All Types", "Analytics", "AI"]], ["Availability", availability, setAvailability, ["All Availability", "BA Specific", "Enterprise"]], ["Business Area", ba, setBa, ["All BAs", ...bas]]].map(([label, value, set, opts]) => /* @__PURE__ */ el("label", { key: label }, label, /* @__PURE__ */ el("span", { className: "select-wrap" }, /* @__PURE__ */ el("select", { "aria-label": label, value, onChange: (e) => {
    set(e.target.value);
    setLimit(8);
  } }, opts.map((o) => /* @__PURE__ */ el("option", { key: o }, o))), /* @__PURE__ */ el(ChevronDown, { size: 18 }))))), /* @__PURE__ */ el("div", { className: "list-meta" }, /* @__PURE__ */ el("span", null, "Showing ", Math.min(limit, filtered.length), " of ", filtered.length, " tools"), /* @__PURE__ */ el("button", { className: "clear", onClick: () => {
    setLocal("");
    setType("All Types");
    setAvailability("All Availability");
    setBa("All BAs");
    setLimit(8);
  } }, "Clear Filters")), /* @__PURE__ */ el("div", { className: "tool-list" }, filtered.slice(0, limit).map((t) => /* @__PURE__ */ el(ToolRow, { key: t.id, t }))), filtered.length === 0 && /* @__PURE__ */ el("div", { className: "empty" }, /* @__PURE__ */ el(Search, null), /* @__PURE__ */ el("h3", null, page === "favorites" ? "No favorites match" : "No tools match your filters"), /* @__PURE__ */ el("p", null, page === "favorites" ? "Use the star beside any tool to save it here." : "Try another search or clear your filters.")), filtered.length > limit && /* @__PURE__ */ el("button", { className: "load-more", onClick: () => setLimit(limit + 8) }, "Show More Tools ", /* @__PURE__ */ el(ChevronDown, { size: 17 }))))), page === "search" && /* @__PURE__ */ el("div", { className: "content search-page" }, /* @__PURE__ */ el("h1", null, "Search Results"), /* @__PURE__ */ el("p", null, "Results for \u201C", q, "\u201D"), /* @__PURE__ */ el(SearchResults, null)), page === "supplier" && /* @__PURE__ */ el("div", { className: "content" }, /* @__PURE__ */ el("div", { className: "breadcrumbs" }, /* @__PURE__ */ el("button", { onClick: () => go("home") }, "Home"), /* @__PURE__ */ el(ChevronRight, null), "Supplier Profile"), /* @__PURE__ */ el("div", { className: "page-heading" }, /* @__PURE__ */ el(Glyph, { icon: Users }), /* @__PURE__ */ el("div", null, /* @__PURE__ */ el("h1", null, selectedSupplier), /* @__PURE__ */ el("p", null, "Supplier profile, key information, and related tools."))), /* @__PURE__ */ el("section", { className: "glass supplier-profile" }, /* @__PURE__ */ el("div", null, /* @__PURE__ */ el("h2", { className: "supplier-logo" }, selectedSupplier), /* @__PURE__ */ el("p", null, "Illustrative supplier profile"), /* @__PURE__ */ el("dl", null, /* @__PURE__ */ el("dt", null, "Supplier Name"), /* @__PURE__ */ el("dd", null, selectedSupplier === "Honeywell" ? "Honeywell International Inc." : selectedSupplier), /* @__PURE__ */ el("dt", null, "Industry"), /* @__PURE__ */ el("dd", null, "Aerospace & Industrial Technology"), /* @__PURE__ */ el("dt", null, "Business Areas"), /* @__PURE__ */ el("dd", null, "Aero \xB7 RMS \xB7 MFC \xB7 Space"))), /* @__PURE__ */ el("div", null, /* @__PURE__ */ el("h2", null, "Related Tools & Solutions"), tools.slice(0, 3).map((t, i) => /* @__PURE__ */ el("button", { className: "result-row", onClick: () => launch(t), key: t.id }, /* @__PURE__ */ el(Glyph, { icon: t.icon }), /* @__PURE__ */ el("span", { className: "result-copy" }, /* @__PURE__ */ el("b", null, searchNames[i]), /* @__PURE__ */ el("small", null, "Explore supplier information in the existing application")), /* @__PURE__ */ el(ExternalLink, null))), /* @__PURE__ */ el("button", { className: "all-tools-link", onClick: () => go("library", "Supplier Intelligence") }, "Explore Supplier Intelligence ", /* @__PURE__ */ el(ArrowRight, null))))), page === "settings" && /* @__PURE__ */ el("div", { className: "content" }, /* @__PURE__ */ el("div", { className: "page-heading" }, /* @__PURE__ */ el(Glyph, { icon: Settings }), /* @__PURE__ */ el("div", null, /* @__PURE__ */ el("h1", null, "Settings"), /* @__PURE__ */ el("p", null, "Personalize your SCI One experience."))), /* @__PURE__ */ el("section", { className: "glass settings-card" }, /* @__PURE__ */ el("h2", null, "Your Profile"), /* @__PURE__ */ el("div", { className: "settings-profile" }, /* @__PURE__ */ el("span", { className: "avatar" }, "JH"), /* @__PURE__ */ el("div", null, /* @__PURE__ */ el("b", null, "Josh Holly"), /* @__PURE__ */ el("p", null, "Supply Chain Intelligence"))), /* @__PURE__ */ el("hr", null), /* @__PURE__ */ el("h2", null, "Preferences"), /* @__PURE__ */ el("label", { className: "toggle-row" }, /* @__PURE__ */ el("span", null, /* @__PURE__ */ el("b", null, "Compact tool list"), /* @__PURE__ */ el("small", null, "Fit more solutions on your screen.")), /* @__PURE__ */ el("input", { type: "checkbox", checked: compact, onChange: (e) => setCompact(e.target.checked) })), /* @__PURE__ */ el("hr", null), /* @__PURE__ */ el("h2", null, "About SCI One"), /* @__PURE__ */ el("p", null, "SCI One 1.0 \xB7 Library First"), /* @__PURE__ */ el("p", null, "This interactive prototype uses illustrative tools and supplier information. Tool launches open a separate sample application.")))), doc && /* @__PURE__ */ el("div", { className: "modal-scrim", onClick: () => setDoc(null) }, /* @__PURE__ */ el("section", { className: "glass modal", role: "dialog", "aria-modal": "true", "aria-label": "Tool documentation", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ el("button", { className: "icon-button modal-close", "aria-label": "Close documentation", onClick: () => setDoc(null) }, /* @__PURE__ */ el(X, null)), /* @__PURE__ */ el(Glyph, { icon: BookOpen }), /* @__PURE__ */ el("h2", null, doc.name), /* @__PURE__ */ el("p", null, doc.description), /* @__PURE__ */ el(Tags, { tool: doc, ba: true }), /* @__PURE__ */ el("h3", null, "Getting Started"), /* @__PURE__ */ el("p", null, "Select View Tool to launch the existing application in a separate tab. Use the application's Business Area, Supplier, and Time Period filters to explore the illustrative data."), /* @__PURE__ */ el("h3", null, "Ownership & Support"), /* @__PURE__ */ el("p", null, doc.owner, " \xB7 ", doc.ba, /* @__PURE__ */ el("br", null), "Sample documentation for the SCI One prototype."), /* @__PURE__ */ el("button", { className: "primary", onClick: () => launch(doc) }, "View Tool ", /* @__PURE__ */ el(ExternalLink, { size: 18 })))));
}
function Demo({ tool }) {
  if (!demoState) demoState = { ba: tool.ba, supplier: "All Suppliers", period: "Last 12 Months" };
  const { ba, supplier, period } = demoState;
  const setBa2 = (v) => update(demoState, "ba", v), setSupplier = (v) => update(demoState, "supplier", v), setPeriod = (v) => update(demoState, "period", v);
  const variation = (supplier === "All Suppliers" ? 0 : 2) + (period === "Last Quarter" ? -1 : period === "Last Month" ? 1 : 0);
  return /* @__PURE__ */ el("div", { className: "demo" }, /* @__PURE__ */ el("header", null, /* @__PURE__ */ el("span", { className: "tableau-mark" }, "\u2723"), /* @__PURE__ */ el("b", null, "tableau"), /* @__PURE__ */ el("span", { className: "demo-label" }, "Illustrative external application"), /* @__PURE__ */ el("button", { className: "clear", onClick: () => closeTool() }, "Close Tool ", /* @__PURE__ */ el(X, { size: 16 }))), /* @__PURE__ */ el("main", null, /* @__PURE__ */ el("div", { className: "breadcrumbs" }, ba, /* @__PURE__ */ el(ChevronRight, null), "Supplier Analytics"), /* @__PURE__ */ el("h1", null, ba, " ", tool.name), /* @__PURE__ */ el("p", null, "Supplier Analytics \xB7 Sample data"), /* @__PURE__ */ el("div", { className: "demo-filters" }, [["Business Area", ba, setBa2, bas], ["Supplier", supplier, setSupplier, ["All Suppliers", "Honeywell", "BAE Systems", "L3Harris", "Raytheon", "Boeing"]], ["Time Period", period, setPeriod, ["Last 12 Months", "Last Quarter", "Last Month"]]].map(([l, v, s, opts]) => /* @__PURE__ */ el("label", { key: l }, l, /* @__PURE__ */ el("select", { value: v, onChange: (e) => s(e.target.value) }, opts.map((o) => /* @__PURE__ */ el("option", { key: o }, o)))))), /* @__PURE__ */ el("div", { className: "kpis" }, [[`${(94.2 + variation).toFixed(1)}%`, "On-Time Delivery"], [`${(86.5 + variation).toFixed(1)}%`, "Supplier Quality"], [supplier === "All Suppliers" ? "142" : "1", "Active Suppliers"]].map(([v, l]) => /* @__PURE__ */ el("section", { key: l }, /* @__PURE__ */ el("strong", null, v), /* @__PURE__ */ el("p", null, l), /* @__PURE__ */ el("svg", { viewBox: "0 0 90 35" }, /* @__PURE__ */ el("path", { d: "M1 30L15 18L29 27L43 13L57 19L72 8L85 2", fill: "none", stroke: "#008cff", strokeWidth: "2" }))))), /* @__PURE__ */ el("section", { className: "chart-card" }, /* @__PURE__ */ el("h3", null, "On-Time Delivery by Supplier"), /* @__PURE__ */ el("div", { className: "chart" }, /* @__PURE__ */ el("div", { className: "axis" }, "100%", /* @__PURE__ */ el("span", null, "90%"), /* @__PURE__ */ el("span", null, "80%"), /* @__PURE__ */ el("span", null, "70%"), /* @__PURE__ */ el("span", null, "60%")), /* @__PURE__ */ el("div", { className: "bars" }, ["Honeywell", "BAE Systems", "L3Harris", "Raytheon"].map((s, i) => /* @__PURE__ */ el("div", { className: "bar-column", key: s }, /* @__PURE__ */ el("div", { className: "bar", style: { height: `${[90, 82, 94, 85][i] + variation}%` }, title: `${s}: ${[97.2, 94.1, 98.5, 95.2][i]}%` }, /* @__PURE__ */ el("span", null, [97.2, 94.1, 98.5, 95.2][i], "%")), /* @__PURE__ */ el("label", null, s)))))), /* @__PURE__ */ el("p", { className: "demo-footnote" }, "Demonstration only \xB7 All metrics are illustrative. This sample opens separately to demonstrate SCI One 1.0's library-first experience.")));
}
render();

})();
