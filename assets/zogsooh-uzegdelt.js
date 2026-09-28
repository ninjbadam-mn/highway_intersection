(function(){
  const $=id=>document.getElementById(id);
  const NORM_A={20:20,30:35,40:50,50:65,60:85,70:105,80:130,90:160,100:185,110:220,120:250,130:285};
  const NORM_S={30:45,40:55,50:75,60:85,80:150,100:200,120:250,150:300};
  const up5=x=>Math.ceil(x/5-1e-9)*5;
  const f1=x=>x.toFixed(1);
  const num=(id,d)=>{const v=parseFloat($(id).value);return isFinite(v)?v:d;};

  function aashto(V,G,t,a){
    const dr=0.278*V*t;
    const den=a/9.81+G;
    if(den<=0) return null;
    const db=(Math.abs(G)<1e-12)?0.039*V*V/a:V*V/(254*den);
    return {dr,db,total:dr+db,den};
  }
  function snip(V,i,t,K,phi,l0){
    const den=phi+i;
    if(den<=0) return null;
    const s1=V*t/3.6, s2=K*V*V/(254*den);
    return {s1,s2,l0,total:s1+s2+l0,den};
  }

  function p(){
    const phiSel=$('phiSel').value;
    return {
      V:num('V',60), ip:num('i',0), ta:num('ta',2.5), a:num('a',3.4),
      ts:num('ts',1), K:num('K',1.2),
      phi: phiSel==='custom'?num('phi',0.3):parseFloat(phiSel),
      l0:num('l0',10)
    };
  }

  function seg(cls,left,width,label){
    const d=document.createElement('div');
    d.className='seg '+cls;d.style.left=left+'%';d.style.width=width+'%';
    if(width>9) d.textContent=label;
    d.title=label;
    return d;
  }

  let lastReport='';

  function render(){
    const P=p(); const G=P.ip/100;
    const chip=$('gchip');
    if(P.ip<0){chip.textContent='уруу';chip.className='chip down';}
    else if(P.ip>0){chip.textContent='өгсүүр';chip.className='chip up';}
    else {chip.textContent='хэвтээ';chip.className='chip';}

    const A=aashto(P.V,G,P.ta,P.a);
    const S=snip(P.V,G,P.ts,P.K,P.phi,P.l0);
    const sign=G<0?'−':'+';
    const absG=Math.abs(G).toFixed(3);

    // AASHTO card
    if(A){
      $('A_design').textContent=up5(A.total);
      $('A_exact').textContent='Тооцоолсон: '+f1(A.total)+' м';
      const brakeF=(Math.abs(G)<1e-12)
        ? '0.039·'+P.V+'²/'+P.a
        : P.V+'²/[254·('+P.a+'/9.81 '+sign+' '+absG+')]';
      $('A_break').innerHTML=
        '<div class="bline"><span class="lbl">Хариу үйлдлийн зам, d<sub>r</sub></span><span class="val">'+f1(A.dr)+' м</span><span class="f">0.278·'+P.V+'·'+P.ta+'</span></div>'+
        '<div class="bline"><span class="lbl">Тоормослох зам, d<sub>b</sub></span><span class="val">'+f1(A.db)+' м</span><span class="f">'+brakeF+'</span></div>';
    } else {
      $('A_design').textContent='—';$('A_exact').textContent='';
      $('A_break').innerHTML='<div class="err">a/9.81 + G ≤ 0 болж байна. Уруугийн налуу хэт их эсвэл удаашралт хэт бага байна; утгуудаа шалгана уу.</div>';
    }
    // SNiP card
    if(S){
      $('S_design').textContent=up5(S.total);
      $('S_exact').textContent='Тооцоолсон: '+f1(S.total)+' м';
      $('S_break').innerHTML=
        '<div class="bline"><span class="lbl">Хариу үйлдлийн зам, S₁</span><span class="val">'+f1(S.s1)+' м</span><span class="f">'+P.V+'·'+P.ts+'/3.6</span></div>'+
        '<div class="bline"><span class="lbl">Тоормослох зам, S₂</span><span class="val">'+f1(S.s2)+' м</span><span class="f">'+P.K+'·'+P.V+'²/[254·('+P.phi+' '+sign+' '+absG+')]</span></div>'+
        '<div class="bline"><span class="lbl">Аюулгүйн зай, l₀</span><span class="val">'+f1(S.l0)+' м</span></div>';
    } else {
      $('S_design').textContent='—';$('S_exact').textContent='';
      $('S_break').innerHTML='<div class="err">φ + i ≤ 0 болж байна. Энэ налуу дээр тухайн хучилттай машин зогсох боломжгүй; φ эсвэл i-г шалгана уу.</div>';
    }

    // Tracks
    const max=Math.max(A?A.total:0,S?S.total:0,1)*1.04;
    const tA=$('trackA'), tS=$('trackS'); tA.innerHTML='';tS.innerHTML='';
    if(A){
      const w1=A.dr/max*100,w2=A.db/max*100;
      tA.append(seg('r',0,w1,f1(A.dr)+' м'),seg('b',w1,w2,f1(A.db)+' м'));
      const s=document.createElement('div');s.className='stop';s.style.left='calc('+(w1+w2)+'% - 2px)';tA.append(s);
    }
    if(S){
      const w1=S.s1/max*100,w2=S.s2/max*100,w3=S.l0/max*100;
      tS.append(seg('r',0,w1,f1(S.s1)+' м'),seg('b',w1,w2,f1(S.s2)+' м'),seg('l0',w1+w2,w3,f1(S.l0)+' м'));
      const s=document.createElement('div');s.className='stop';s.style.left='calc('+(w1+w2+w3)+'% - 2px)';tS.append(s);
    }

    // Table
    const speeds=[20,30,40,50,60,70,80,90,100,110,120,130,150];
    const rows=speeds.map(v=>{
      const a0=aashto(v,0,P.ta,P.a), s0=snip(v,0,P.ts,P.K,P.phi,P.l0);
      const aC=a0?up5(a0.total):null, sC=s0?up5(s0.total):null;
      const aN=NORM_A[v], sN=NORM_S[v];
      const cell=(c,n)=>{
        if(c===null) return '<td class="na">—</td>';
        const low=n&&c<n*0.9;
        return '<td'+(low?' class="diff-hi"':'')+'>'+c+'</td>';
      };
      const norm=n=>n?'<td>'+n+'</td>':'<td class="na">—</td>';
      return '<tr'+(v===P.V?' class="cur"':'')+'><td>'+v+'</td>'+cell(aC,aN)+norm(aN)+cell(sC,sN)+norm(sN)+'</tr>';
    });
    $('tbody').innerHTML=rows.join('');

    // Report
    const L=[];
    L.push('ЗОГСООХ ҮЗЭГДЭЛТИЙН ЗАЙ');
    L.push('V = '+P.V+' км/ц, i = '+P.ip+' %');
    L.push('');
    if(A){
      L.push('AASHTO (2018): t = '+P.ta+' с, a = '+P.a+' м/с²');
      L.push('  d_r = 0.278·'+P.V+'·'+P.ta+' = '+f1(A.dr)+' м');
      L.push('  d_b = '+f1(A.db)+' м');
      L.push('  SSD = '+f1(A.total)+' м → дизайн '+up5(A.total)+' м');
    } else L.push('AASHTO: a/9.81 + G ≤ 0, тооцоо боломжгүй');
    L.push('');
    if(S){
      L.push('СНиП 2.05.02-85: t = '+P.ts+' с, Kэ = '+P.K+', φ = '+P.phi+', l₀ = '+P.l0+' м');
      L.push('  S₁ = '+f1(S.s1)+' м, S₂ = '+f1(S.s2)+' м, l₀ = '+f1(S.l0)+' м');
      L.push('  S = '+f1(S.total)+' м → дизайн '+up5(S.total)+' м');
    } else L.push('СНиП: φ + i ≤ 0, тооцоо боломжгүй');
    lastReport=L.join('\n');
  }

  // Sync V inputs
  $('V').addEventListener('input',()=>{$('Vr').value=$('V').value;render();});
  $('Vr').addEventListener('input',()=>{$('V').value=$('Vr').value;render();});
  $('phiSel').addEventListener('change',()=>{
    const c=$('phiSel').value==='custom';$('phi').hidden=!c;render();
  });
  $('form').addEventListener('input',render);
  $('form').addEventListener('submit',e=>e.preventDefault());

  $('copy').addEventListener('click',()=>{
    const t=$('toast');
    try{
      navigator.clipboard.writeText(lastReport).then(()=>{t.textContent='Хуулагдлаа';$('fallback').hidden=true;setTimeout(()=>t.textContent='',2000);})
      .catch(fb);
    }catch(e){fb();}
    function fb(){const ta=$('fallback');ta.value=lastReport;ta.hidden=false;ta.focus();ta.select();t.textContent='Текстийг сонгосон, Ctrl+C дарж хуулна уу';}
  });

  render();
})();
