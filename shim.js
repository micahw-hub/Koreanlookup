(function(){
  const LS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
  async function ask(prompt){
    let k=LS.get("kl_key");
    if(!k){k=window.prompt("Paste your Anthropic API key. It is stored only on this device.");if(!k)throw {code:"error"};LS.set("kl_key",k.trim())}
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":LS.get("kl_key"),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-5-5",max_tokens:2000,messages:[{role:"user",content:prompt}]})});
    if(r.status===401){try{localStorage.removeItem("kl_key")}catch(e){}throw {code:"error"}}
    if(r.status===429)throw {code:"rate_limited"};
    if(!r.ok)throw {code:"error"};
    const d=await r.json();return (d.content||[]).map(c=>c.text||"").join("");
  }
  const sample={json:async p=>{const t=await ask(p);const a=t.indexOf("{"),b=t.lastIndexOf("}");return JSON.parse(t.slice(a,b+1))}};
  const load=()=>{try{return JSON.parse(LS.get("kl_hist")||"{}")}catch(e){return{}}};
  const save=o=>LS.set("kl_hist",JSON.stringify(o));
  const db={collection:()=>({
    orderBy:()=>({limit:n=>({get:async()=>({docs:Object.entries(load()).sort((a,b)=>b[1].ts-a[1].ts).slice(0,n).map(([id,d])=>({id,data:()=>d}))})})}),
    doc:id=>({set:async d=>{const o=load();o[id]=d;save(o)},delete:async()=>{const o=load();delete o[id];save(o)}})
  })};
  const caps={sample,db,user:{id:async()=>"device"}};
  window.claude={use:async n=>caps[n]||null};
  if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
})();
