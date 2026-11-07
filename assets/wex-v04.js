/* WEX MolForge Pro v0.4 beta · selector de tema (claro / oscuro / cristal) */
(function(){
var T=[["claro","Claro",'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'],
["oscuro","Oscuro",'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>'],
["cristal","Cristal líquido",'<path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3Z"/><path d="M9.5 14a2.6 2.6 0 0 0 2 2.4"/>']];
var root=document.documentElement,reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function cur(){return root.getAttribute("data-wex-theme")||"oscuro"}
function mark(){var b=document.querySelectorAll("#wex-theme button");for(var i=0;i<b.length;i++)b[i].setAttribute("aria-checked",String(b[i].dataset.t===cur()))}
function set(t,x,y){
 var go=function(){root.setAttribute("data-wex-theme",t);try{localStorage.setItem("wex-theme",t)}catch(e){}mark()};
 if(t===cur())return;
 if(!document.startViewTransition||reduce){go();return}
 var tr=document.startViewTransition(go);
 tr.ready.then(function(){var r=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  root.animate({clipPath:["circle(0px at "+x+"px "+y+"px)","circle("+r+"px at "+x+"px "+y+"px)"]},{duration:650,easing:"cubic-bezier(.4,0,.2,1)",pseudoElement:"::view-transition-new(root)"})}).catch(function(){})}
function build(){
 if(document.getElementById("wex-theme"))return;
 var d=document.createElement("div");d.id="wex-theme";d.setAttribute("role","radiogroup");d.setAttribute("aria-label","Tema visual");
 T.forEach(function(t){var b=document.createElement("button");b.type="button";b.dataset.t=t[0];b.setAttribute("role","radio");b.title=t[1];b.setAttribute("aria-label",t[1]);
  b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+t[2]+"</svg>";
  b.addEventListener("click",function(e){var r=b.getBoundingClientRect();set(t[0],e.clientX||r.left+r.width/2,e.clientY||r.top+r.height/2)});d.appendChild(b)});
 document.body.appendChild(d);mark()}
addEventListener("load",function(){setTimeout(build,700)});
})();
