(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))L(s);new MutationObserver(s=>{for(const m of s)if(m.type==="childList")for(const y of m.addedNodes)y.tagName==="LINK"&&y.rel==="modulepreload"&&L(y)}).observe(document,{childList:!0,subtree:!0});function C(s){const m={};return s.integrity&&(m.integrity=s.integrity),s.referrerPolicy&&(m.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?m.credentials="include":s.crossOrigin==="anonymous"?m.credentials="omit":m.credentials="same-origin",m}function L(s){if(s.ep)return;s.ep=!0;const m=C(s);fetch(s.href,m)}})();const R=h=>typeof h!="string"?h:h.replace(/[&'`"<>]/g,n=>({"&":"&amp;","'":"&#x27;","`":"&#x60;",'"':"&quot;","<":"&lt;",">":"&gt;"})[n]),_={string(h){const n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";return Array(h).fill(null).map(()=>n[Math.floor(Math.random()*n.length)]).join("")},number(h,n){return Math.floor(Math.random()*(n-h)+h)}};document.addEventListener("DOMContentLoaded",()=>{var N;const h=document.querySelector("header"),n=document.forms["comments-load"];n.videoId=n.elements["video-id"],n.submitButton=n.elements["submit-button"];const C=document.querySelector("details"),L=document.querySelector(".config"),s=document.getElementById("thread"),m=document.querySelector(".watch-link a"),y=document.querySelector(".nico-ad"),q=document.getElementById("nico-ad"),p=document.getElementById("comments-list"),S=document.getElementById("comments-sync"),b=document.querySelector(".detail-pc"),B=document.title,k="/nv-comment-viewer",U=location.pathname.replace(k,"").slice(1),A=`${location.origin}${k}/`,F=()=>window.innerWidth<1024;let u=null,v=null,T=!1,P=[],M=!0,x=0;const H=()=>n.submitButton.disabled=!n.checkValidity();n.addEventListener("input",H);const K=e=>{const t={text:R(e.body).replace(/\n/g,"<br>"),nicoru:e.nicoruCount!==0?e.nicoruCount:"",time:(i=>i.getUTCDate()-1?(i.setUTCMonth(i.getUTCDate()-2),i.toLocaleString([],{timeZone:"UTC",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",fractionalSecondDigits:2})):i.getUTCHours()?i.toLocaleString([],{timeZone:"UTC",hour:"numeric",minute:"numeric",second:"numeric",fractionalSecondDigits:2}):i.toLocaleString([],{timeZone:"UTC",minute:"numeric",second:"numeric",fractionalSecondDigits:2}))(new Date(Number(e.vposMs)))};return`<li data-id="${e.id}" data-user-id="${e.userId}">
      <span class="text">${t.text}</span><span class="nicoru">${t.nicoru}</span><span class="time">${t.time}</span>
      <script type="application/json" class="raw-data">${JSON.stringify(e)}<\/script>
    </li>
    `},O=e=>{let t="";P=[],e.forEach(r=>{t+=K(r),P.push(r.vposMs)}),p.insertAdjacentHTML("beforeend",t)};let D=null;if(n.addEventListener("submit",async e=>{e.preventDefault(),n.submitButton.disabled=!0,n.submitButton.textContent="読み込み中...",p.textContent="";let t=n.videoId.value;const r=t.lastIndexOf("/")+1,i=t.includes("?")?t.indexOf("?"):void 0,a=t.slice(r,i);if(n.videoId.value=a,m.href=`https://nico.ms/${a}`,!u||u.client.watchId!==a){T&&u.client.watchId!==a&&(T=!1,y.hidden=!0);const w=new URL("watch_v3_guest",A),d=w.searchParams;d.append("id",a);const c=`${_.string(10)}_${Math.floor(Date.now()/1e3)}`;d.append("actionTrackId",c),await fetch(w,{method:"POST"}).then(async l=>{l.status!==200&&console.log("error or no content",l.status);const o=await l.json();o.meta.errorCode==="FORBIDDEN"?(console.error("Error:",o.meta.errorCode,o.data.reasonCode),alert(`エラー:${o.meta.errorCode}、理由:${o.data.reasonCode}`)):o.meta.errorCode?(console.error("Error:",o.meta.errorCode),alert("エラー:"+o.meta.errorCode)):(u=o.data,D=null)}).catch(l=>{console.error("Failed to load",l)})}if((u==null?void 0:u.client.watchId)===a){const w=u.comment.nvComment;await fetch(`${w.server}/v1/threads`,{method:"POST",headers:{"X-Client-Os-Type":"others","X-Frontend-Id":"1","X-Frontend-Version":"0"},body:JSON.stringify({params:w.params,threadKey:D||w.threadKey,additionals:{}})}).then(async d=>{if(d.status!==200&&console.log("error or no content",d.status),v=await d.json(),v.meta.errorCode==="EXPIRED_TOKEN"){const c=new URL("v1_comment_keys_thread",A);c.searchParams.append("videoId",a),await fetch(c,{}).then(async o=>(o.status!==200&&console.log("error or no content",o.status),o.json())).then(o=>{D=o.data.threadKey,n.requestSubmit()}).catch(o=>{console.error("Failed to load",o)})}else if(v.meta.errorCode)console.error("Error:",v.meta.errorCode),alert("エラー:"+v.meta.errorCode);else if(!v.data.globalComments[0].count)console.log("not comments found"),alert("コメントがありませんでした。");else{s.value="default",L.hidden=!1;const c=v.data.threads.find(l=>l.fork==="main");c.comments.sort((l,o)=>l.vposMs-o.vposMs),O(c.comments),document.title=`${u.video.title} - ${B}`,history.pushState(null,"",`${k}/${a}`)}}).catch(d=>{console.error("Failed to load",d)})}n.submitButton.disabled=!1,n.submitButton.textContent="取得"},{passive:!1}),s.addEventListener("change",()=>{p.textContent="";const e=v.data.threads.find(t=>{switch(s.value){case"default":return t.fork==="main";default:return t.fork===s.value}});e.comments.sort((t,r)=>t.vposMs-r.vposMs),O(e.comments)}),/(^sm|^nm|^so)[0-9]+/.test(U)){C.open=!1;const e=U;n.videoId.value=e,n.requestSubmit()}if(window.addEventListener("message",e=>{if(e.origin==="https://www.nicovideo.jp")switch(e.data.eventName){case"sendData":T=!0,C.open=!1,y.hidden=!1,u=e.data.data;const t=u.client.watchId;n.videoId.value=t,n.requestSubmit(),window.addEventListener("scroll",r=>{T?Math.abs(x-window.scrollTop)>=3?(M=!1,S.hidden=!1):(M=!0,S.hidden=!0):S.hidden=!0});break;case"playerMetadataChange":if(M){const r=u.video.duration,i=e.data.data.progressPercentage,a=q.checked,w=Math.floor((r+(a?10:0))*1e3*i),d=P.findIndex(l=>l>w),c=p.children[d];x=c.offsetTop-window.innerHeight+c.offsetHeight+2,window.scrollTo({top:x,behavior:"instant"})}break;default:console.log(e.data);break}}),(N=window.opener)==null||N.postMessage({eventName:"ready"},"https://www.nicovideo.jp"),document.addEventListener("visibilitychange",()=>{var e,t;switch(document.visibilityState){case"hidden":(e=window.opener)==null||e.postMessage({eventName:"bye"},"https://www.nicovideo.jp");break;case"visible":(t=window.opener)==null||t.postMessage({eventName:"returned"},"https://www.nicovideo.jp");break}}),p.addEventListener("click",e=>{const t=e.target.closest("li"),r=document.querySelector(".detail-sp"),i=document.getElementsByClassName("same-user");if(!t||t.classList.contains("detail-sp"))return;if([...i].forEach(g=>g.classList.remove("same-user")),t.nextElementSibling&&t.nextElementSibling.classList.contains("detail-sp")){b.textContent="",r.remove();return}b.textContent!==""&&(b.textContent=""),r&&r.remove();const a=F()?t.offsetTop-2-10:t.offsetTop-(window.innerHeight-h.offsetHeight-t.offsetHeight)/2,w=e.isTrusted?"smooth":"instant";window.scrollTo({top:a,behavior:w});const d=JSON.parse(t.querySelector(".raw-data").textContent),c=document.createElement("dl"),l={id:"コメントID",no:"コメント番号",vposMs:"再生時間",body:"コメント",commands:"コマンド",userId:"ユーザーID",isPremium:"プレミアム会員",score:"NGスコア",postedAt:"日時",nicoruCount:"ニコられた数",source:"ソース",isMyPost:"自分の投稿"};let o="";Object.entries(d).forEach(([g,f])=>{switch(g){case"vposMs":const I=new Date(Number(f));I.getUTCDate()-1?(I.setUTCMonth(I.getUTCDate()-2),f=I.toLocaleString([],{timeZone:"UTC",day:"numeric",hour:"numeric",minute:"numeric",second:"numeric",fractionalSecondDigits:2})):f=I.toLocaleString([],{timeZone:"UTC",hour:"numeric",minute:"numeric",second:"numeric",fractionalSecondDigits:2});break;case"commands":f=f.join(" ");break;case"postedAt":f=new Date(f).toLocaleString([],{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"});break;case"userId":!d.commands.includes("184")&&(f=`<a href="https://nico.ms/user/${d.userId}" target="_blank">${f}</a>`);break;case"isPremium":case"isMyPost":f=f?"はい":"いいえ";break}o+=`<dt>${l[g]||g}</dt>
      <dd>${f}</dd>
      `}),c.innerHTML=o;const $=[...p.children].filter(g=>g.dataset.userId===d.userId),j=`<dl>
      <dt>コメント回数</dt>
      <dd>${$.findIndex(g=>g.dataset.id===d.id)+1}回目/全${$.length}回中</dd>
    </dl>
    `;b.appendChild(c.cloneNode(!0)),b.appendChild(document.createElement("hr")),b.insertAdjacentHTML("beforeend",j);const E=document.createElement("li");E.classList.add("detail-sp"),E.appendChild(c),E.appendChild(document.createElement("hr")),E.insertAdjacentHTML("beforeend",j),t.insertAdjacentElement("afterend",E),$.forEach(g=>g.classList.add("same-user"))}),S.addEventListener("click",()=>{var e;M=!0,S.hidden=!0,(e=document.querySelector(".detail-sp"))==null||e.previousElementSibling.click()}),window.opener)document.addEventListener("keydown",e=>{var i;["ArrowUp","ArrowRight","ArrowDown","ArrowLeft"," "].some(a=>a===e.key)&&(e.preventDefault(),(i=window.opener)==null||i.postMessage({eventName:"keyDown",data:e.key},"https://www.nicovideo.jp"))});else{let e=null;p.addEventListener("focus",t=>{e=t.target},!0),p.addEventListener("keydown",t=>{switch(t.key){case"ArrowUp":t.preventDefault(),(()=>{const r=e?e.previousElementSibling??p.lastElementChild:p.firstElementChild;r.click(),r.focus()})();break;case"ArrowDown":t.preventDefault(),(()=>{var i,a;const r=((i=e==null?void 0:e.nextElementSibling)!=null&&i.classList.contains("detail-sp")?(a=e.nextElementSibling)==null?void 0:a.nextElementSibling:e==null?void 0:e.nextElementSibling)??p.firstElementChild;r.click(),r.focus()})();break;case" ":case"Enter":t.target===document.activeElement&&(t.preventDefault(),t.target.click(),t.target.focus());break}})}});