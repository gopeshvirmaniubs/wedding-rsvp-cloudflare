const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const clean=(v,n=500)=>String(v??"").trim().slice(0,n);
function normalizePhone(v){let digits=String(v||"").replace(/\D/g,"");if(digits.length===10)digits="91"+digits;return digits;}
function admin(req,env){const supplied=req.headers.get("X-Admin-Password")||"";return !!env.RSVP_ADMIN_PASSWORD && supplied.length>0 && supplied===env.RSVP_ADMIN_PASSWORD;}
export default {
 async fetch(req,env){
  const url=new URL(req.url),path=url.pathname;
  if(path==="/api/rsvp"&&req.method==="POST"){
   try{
    const b=await req.json(),name=clean(b.name,100),phone=normalizePhone(b.phone);
    if(!name)return json({error:"Please enter your name."},400);
    if(phone.length<7||phone.length>15)return json({error:"Please enter a valid mobile number, including country code if needed."},400);
    const sender=clean(b.sender||"General link",80),side=clean(b.side||"Not specified",40),max=Math.max(1,Math.min(7,Number.parseInt(b.max_people,10)||7));
    let vibe=clean(b.party_vibe,30);if(!["family","better_half","potential","solo"].includes(vibe))vibe="solo";
    let plus=Math.max(0,Math.min(max-1,Number.parseInt(b.plus_ones,10)||0));if(vibe==="better_half")plus=Math.min(1,max-1);if(vibe==="solo"||vibe==="potential")plus=0;
    const dec4=b.dec4?1:0,dec5=b.dec5?1:0,companions=clean(b.companions,400),notes=clean(b.notes,500),now=new Date().toISOString();
    await env.DB.prepare(`INSERT INTO guests(name,phone,side,invited_by,dec4,dec5,plus_ones,party_vibe,companions,notes,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name,side=excluded.side,invited_by=excluded.invited_by,dec4=excluded.dec4,dec5=excluded.dec5,plus_ones=excluded.plus_ones,party_vibe=excluded.party_vibe,companions=excluded.companions,notes=excluded.notes,updated_at=excluded.updated_at`)
    .bind(name,phone,side,sender,dec4,dec5,plus,vibe,companions,notes,now,now).run();
    return json({ok:true});
   }catch(e){return json({error:"We could not save your RSVP. Please try again."},500)}
  }
  if(path.startsWith("/api/admin/")){
   if(!admin(req,env))return json({error:"Incorrect admin password or session expired."},401);
   if(path==="/api/admin/guests"&&req.method==="GET"){
    const result=await env.DB.prepare("SELECT * FROM guests ORDER BY updated_at DESC").all(),guests=result.results||[];
    const totals=await env.DB.prepare(`SELECT COUNT(*) guests,COALESCE(SUM(dec4),0) d4,COALESCE(SUM(dec5),0) d5,COALESCE(SUM(CASE WHEN dec4=1 THEN 1+plus_ones ELSE 0 END),0) d4_people,COALESCE(SUM(CASE WHEN dec5=1 THEN 1+plus_ones ELSE 0 END),0) d5_people FROM guests`).first();
    return json({guests,totals});
   }
   if(path==="/api/admin/export.csv"&&req.method==="GET"){
    const result=await env.DB.prepare("SELECT name,phone,side,invited_by,dec4,dec5,plus_ones,party_vibe,companions,notes,created_at,updated_at FROM guests ORDER BY name").all();
    const fields=["name","phone","side","invited_by","dec4","dec5","plus_ones","party_vibe","companions","notes","created_at","updated_at"];
    const csv=[["Name","Mobile","Side","Invited by","Dec 4 attending","Dec 5 attending","Additional guests","Party vibe","Companions","Notes","Created at","Updated at"],...(result.results||[]).map(r=>fields.map(k=>r[k]))].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=wedding_rsvps.csv","Cache-Control":"no-store"}});
   }
   return json({error:"Not found"},404);
  }
  return env.ASSETS.fetch(req);
 }
};