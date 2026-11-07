/* Motor dos bonecos animados e mapa muscular (baseado no app do Henrique, com poses de perna e abdômen). */
const g1=n=>Math.round(n*10)/10;
const gPol=(p,a,l)=>{const r=a*Math.PI/180;return[p[0]+l*Math.cos(r),p[1]+l*Math.sin(r)];};
const gLerp=(a,b,t)=>a+(b-a)*t;
const gLp=(p,q,t)=>[gLerp(p[0],q[0],t),gLerp(p[1],q[1],t)];
const gLa=(a,b,t)=>{const d=((b-a)%360+540)%360-180;return a+d*t;};
const gP=p=>`${g1(p[0])},${g1(p[1])}`;
const gS=(a,b,w,c)=>`<line class="${c}" x1="${g1(a[0])}" y1="${g1(a[1])}" x2="${g1(b[0])}" y2="${g1(b[1])}" stroke-width="${w}" stroke-linecap="round"/>`;
const gC=(p,r,c)=>`<circle class="${c}" cx="${g1(p[0])}" cy="${g1(p[1])}" r="${r}"/>`;
/* equipamentos */
const LN=(x1,y1,x2,y2,c='eqt')=>`<line class="${c}" x1="${g1(x1)}" y1="${g1(y1)}" x2="${g1(x2)}" y2="${g1(y2)}"/>`;
const RC=(x,y,w,h,o=1)=>`<rect class="eq" x="${g1(x)}" y="${g1(y)}" width="${w}" height="${h}" rx="2" opacity="${o}"/>`;
const BANCO=(x1,x2,y)=>RC(x1,y,x2-x1,6)+LN(x1+6,y+6,x1+6,94)+LN(x2-6,y+6,x2-6,94);
const ANILHA=(p,dy=0,r=7)=>`<circle class="eq" cx="${g1(p[0])}" cy="${g1(p[1]+dy)}" r="${r}"/><circle class="hole" cx="${g1(p[0])}" cy="${g1(p[1]+dy)}" r="1.8"/>`;
const HALT_H=(p,dy=0)=>{const x=p[0],y=p[1]+dy;return LN(x-6,y,x+6,y)+RC(x-9,y-4.5,4,9)+RC(x+5,y-4.5,4,9);};
const HALT_V=(p,dy=0)=>{const x=p[0],y=p[1]+dy;return LN(x,y-6,x,y+6)+RC(x-4.5,y-9,9,4)+RC(x-4.5,y+5,9,4);};
const CABO=(x,y,p)=>LN(x,y,p[0],p[1],'cab');
const TORRE=x=>LN(x,4,x,94,'tw');
const POLIA=(x,y)=>`<circle class="eq" cx="${x}" cy="${y}" r="3.2"/>`;
const CORDA=p=>LN(p[0],p[1],p[0]-4,p[1]+7)+LN(p[0],p[1],p[0]+4,p[1]+7);
const BARRINHA=p=>LN(p[0]-7,p[1],p[0]+7,p[1],'bar');
const ROLO=(p,dx=0,dy=0)=>`<circle class="eq" cx="${g1(p[0]+dx)}" cy="${g1(p[1]+dy)}" r="3.6"/>`;

/* posições-base (ângulos em graus: 0 = direita, 90 = para baixo) */
const B_EMPE={hp:[50,54],t:-90,n:-90,l1:[92,88],l2:[86,94]};
const B_FRENTE={hp:[60,54],t:-90,n:-90,l1:[96,90],l2:[84,90]};
const B_DEITADO={hp:[70,62],t:180,n:180,l1:[32,78]};
const B_INCL={hp:[66,64],t:-125,n:-118,l1:[30,88]};
const o=(base,extra)=>({...base,...extra});
const SENTADO_F={hd:[60,22],sh:[60,34],hp:[60,62],k1:[50,70],f1:[50,93],k2:[70,70],f2:[70,93]};
const sf=extra=>({j:{...SENTADO_F,...extra}});

const ANIM={
 /* ---- peito, costas, ombros e braços (do app original) ---- */
 supino_barra:{v:'side',m:'lin',A:o(B_DEITADO,{a1:[80,-90]}),B:o(B_DEITADO,{a1:[-88,-90]}),b:J=>BANCO(20,92,68),f:J=>ANILHA(J.w1,-5,8)},
 supino_halter:{v:'side',m:'lin',A:o(B_DEITADO,{a1:[80,-90]}),B:o(B_DEITADO,{a1:[-88,-90]}),b:J=>BANCO(20,92,68),f:J=>HALT_H(J.w1,-3)},
 incl_halter:{v:'side',m:'lin',A:o(B_INCL,{a1:[100,-80]}),B:o(B_INCL,{a1:[-78,-84]}),b:J=>LN(60.3,68,41.5,41,'pad')+LN(58,71,84,71,'pad')+LN(62,74,62,94)+LN(80,74,80,94),f:J=>HALT_H(J.w1,-3)},
 incl_barra:{v:'side',m:'lin',A:o(B_INCL,{a1:[100,-80]}),B:o(B_INCL,{a1:[-78,-84]}),b:J=>LN(60.3,68,41.5,41,'pad')+LN(58,71,84,71,'pad')+LN(62,74,62,94)+LN(80,74,80,94),f:J=>ANILHA(J.w1,-5,8)},
 crossover:{v:'front',A:o(B_FRENTE,{a1:[168,165],a2:[12,15]}),B:o(B_FRENTE,{a1:[122,38],a2:[58,142]}),b:J=>TORRE(8)+TORRE(112)+POLIA(11,10)+POLIA(109,10)+CABO(11,10,J.w1)+CABO(109,10,J.w2),f:J=>''},
 flexao:{v:'side',A:{j:{hd:[21,60],sh:[33,64],hp:[59,75],e1:[33,79],w1:[33,93],k1:[78,84],f1:[96,93]}},B:{j:{hd:[18,80],sh:[30,83],hp:[57,88],e1:[42,85],w1:[33,93],k1:[77,91],f1:[96,93]}},b:J=>'',f:J=>''},
 testa:{v:'side',A:o(B_DEITADO,{a1:[-95,-90]}),B:o(B_DEITADO,{a1:[-95,205]}),b:J=>BANCO(20,92,68),f:J=>ANILHA(J.w1,0,5.5)},
 corda:{v:'side',A:o(B_EMPE,{t:-85,n:-80,a1:[95,-30]}),B:o(B_EMPE,{t:-85,n:-80,a1:[95,80]}),b:J=>TORRE(96)+POLIA(92,8)+CABO(92,8,J.w1),f:J=>CORDA(J.w1)},
 polia_barra:{v:'side',A:o(B_EMPE,{t:-85,n:-80,a1:[95,-30]}),B:o(B_EMPE,{t:-85,n:-80,a1:[95,80]}),b:J=>TORRE(96)+POLIA(92,8)+CABO(92,8,J.w1),f:J=>BARRINHA(J.w1)},
 mergulho_banco:{v:'side',A:{j:{hd:[38,14],sh:[36,26],hp:[39,54],e1:[34,40],w1:[32,54],k1:[60,62],f1:[83,93]}},B:{j:{hd:[40,36],sh:[39,48],hp:[42,76],e1:[25,42],w1:[32,54],k1:[62,82],f1:[83,93]}},b:J=>RC(6,54,28,6)+LN(12,60,12,94)+LN(28,60,28,94),f:J=>''},
 barra_fixa:{v:'front',A:{j:{hd:[60,22],sh:[60,34],hp:[60,62],e1:[46,21],w1:[44,9],e2:[74,21],w2:[76,9],k1:[56,78],f1:[57,90],k2:[64,78],f2:[63,90]}},B:{j:{hd:[60,6],sh:[60,18],hp:[60,46],e1:[40,26],w1:[44,9],e2:[80,26],w2:[76,9],k1:[56,62],f1:[57,74],k2:[64,62],f2:[63,74]}},b:J=>LN(12,8,108,8,'pad'),f:J=>''},
 remada_curvada:{v:'side',A:{hp:[52,56],t:-40,n:-30,l1:[70,100],l2:[76,96],a1:[92,92]},B:{hp:[52,56],t:-40,n:-30,l1:[70,100],l2:[76,96],a1:[160,80]},b:J=>'',f:J=>ANILHA(J.w1,3,8)},
 remada_unilateral:{v:'side',A:{j:{hd:[44,55],sh:[56,53],hp:[84,52],e2:[50,63],w2:[57,72],k2:[86,72],f2:[104,72],k1:[90,73],f1:[92,94],e1:[57,68],w1:[58,82]}},B:{j:{hd:[44,55],sh:[56,53],hp:[84,52],e2:[50,63],w2:[57,72],k2:[86,72],f2:[104,72],k1:[90,73],f1:[92,94],e1:[74,40],w1:[70,58]}},b:J=>RC(40,74,68,6)+LN(46,80,46,94)+LN(102,80,102,94),f:J=>HALT_H(J.w1,2)},
 pulldown_ext:{v:'side',A:{hp:[48,56],t:-75,n:-70,l1:[95,82],a1:[-40,-40]},B:{hp:[48,56],t:-75,n:-70,l1:[95,82],a1:[75,75]},b:J=>TORRE(98)+POLIA(94,8)+CABO(94,8,J.w1),f:J=>BARRINHA(J.w1)},
 remada_baixa:{v:'side',A:{hp:[32,68],t:-78,n:-76,l1:[-15,12],a1:[2,4]},B:{hp:[32,68],t:-96,n:-92,l1:[-15,12],a1:[150,8]},b:J=>RC(12,72,36,6)+LN(30,78,30,94)+RC(73,52,5,42)+TORRE(106)+POLIA(102,60)+CABO(102,60,J.w1),f:J=>LN(J.w1[0],J.w1[1]-4,J.w1[0],J.w1[1]+4,'bar')},
 rosca_barra:{v:'side',A:o(B_EMPE,{a1:[90,95]}),B:o(B_EMPE,{a1:[90,-70]}),b:J=>'',f:J=>ANILHA(J.w1,0,7)},
 rosca_martelo:{v:'side',A:o(B_EMPE,{a1:[90,95],a2:[92,94]}),B:o(B_EMPE,{a1:[90,-70],a2:[92,94]}),b:J=>HALT_V(J.w2),f:J=>HALT_V(J.w1)},
 rosca_scott:{v:'side',A:{hp:[38,72],t:-80,n:-80,l1:[0,90],a1:[45,60]},B:{hp:[38,72],t:-80,n:-80,l1:[0,90],a1:[45,-80]},b:J=>RC(22,74,28,6)+LN(36,80,36,94)+LN(44,52,60,69,'pad')+LN(60,69,60,94),f:J=>ANILHA(J.w1,0,5.5)},
 desenvolvimento:{v:'front',A:sf({e1:[37,38],w1:[37,24],e2:[83,38],w2:[83,24]}),B:sf({e1:[44,21],w1:[46,7],e2:[76,21],w2:[74,7]}),b:J=>RC(52,30,16,32,.5)+RC(38,62,44,5)+LN(60,67,60,94),f:J=>HALT_H(J.w1,-2)+HALT_H(J.w2,-2)},
 elev_lateral:{v:'front',A:o(B_FRENTE,{a1:[97,95],a2:[83,85]}),B:o(B_FRENTE,{a1:[172,176],a2:[8,4]}),b:J=>'',f:J=>HALT_V(J.w1)+HALT_V(J.w2)},
 elev_frontal:{v:'side',A:o(B_EMPE,{a1:[90,92]}),B:o(B_EMPE,{a1:[-2,0]}),b:J=>'',f:J=>ANILHA(J.w1,0,4.5)},
 crucifixo_inverso:{v:'front',hdo:true,A:{hp:[60,56],t:-90,tl:16,hd:[60,45],l1:[115,75],l2:[65,105],a1:[95,95],a2:[85,85]},B:{hp:[60,56],t:-90,tl:16,hd:[60,45],l1:[115,75],l2:[65,105],a1:[175,178],a2:[5,2]},b:J=>'',f:J=>HALT_V(J.w1)+HALT_V(J.w2)},
 remada_alta:{v:'front',A:o(B_FRENTE,{a1:[80,95],a2:[100,85]}),B:o(B_FRENTE,{a1:[200,20],a2:[-20,160]}),b:J=>'',f:J=>{const a=[J.w1[0]-12,J.w1[1]],b=[J.w2[0]+12,J.w2[1]];return LN(a[0],a[1],b[0],b[1],'bar')+RC(a[0]-4,a[1]-6,4,12)+RC(b[0],b[1]-6,4,12);}},
 encolhimento:{v:'front',m:'lin',A:o(B_FRENTE,{a1:[94,92],a2:[86,88]}),B:o(B_FRENTE,{tl:33,a1:[94,92],a2:[86,88]}),b:J=>'',f:J=>HALT_V(J.w1,3)+HALT_V(J.w2,3)},
 puxada:{v:'front',A:sf({hd:[60,24],sh:[60,36],hp:[60,64],e1:[44,21],w1:[36,7],e2:[76,21],w2:[84,7]}),B:sf({hd:[60,24],sh:[60,36],hp:[60,64],e1:[38,48],w1:[34,33],e2:[82,48],w2:[86,33]}),b:J=>RC(42,70,36,5)+CABO(60,0,gLp(J.w1,J.w2,.5)),f:J=>RC(40,63,40,4)+LN(J.w1[0]-10,J.w1[1],J.w2[0]+10,J.w2[1],'bar')},
 paralelas:{v:'front',A:{j:{hd:[60,18],sh:[60,30],hp:[60,58],e1:[46,41],w1:[42,50],e2:[74,41],w2:[78,50],k1:[56,72],f1:[61,82],k2:[64,72],f2:[68,81]}},B:{j:{hd:[60,32],sh:[60,44],hp:[60,72],e1:[37,40],w1:[42,50],e2:[83,40],w2:[78,50],k1:[56,84],f1:[61,92],k2:[64,84],f2:[68,91]}},b:J=>LN(30,50,46,50,'bar')+LN(74,50,90,50,'bar')+LN(36,50,36,94)+LN(84,50,84,94),f:J=>''},
 pullover:{v:'side',A:{hp:[68,70],t:194,n:182,l1:[5,85],a1:[-88,-88]},B:{hp:[68,70],t:194,n:182,l1:[5,85],a1:[178,180]},b:J=>RC(30,70,24,6)+LN(36,76,36,94)+LN(48,76,48,94),f:J=>HALT_V(J.w1)},
 face_pull:{v:'side',A:o(B_EMPE,{a1:[-15,-10]}),B:o(B_EMPE,{a1:[200,-5]}),b:J=>TORRE(102)+POLIA(98,16)+CABO(98,16,J.w1),f:J=>CORDA(J.w1)},
 frances:{v:'side',A:{hp:[48,74],t:-90,n:-85,l1:[0,90],a1:[-80,-85]},B:{hp:[48,74],t:-90,n:-85,l1:[0,90],a1:[-80,120]},b:J=>RC(34,76,30,6)+LN(49,82,49,94),f:J=>HALT_V(J.w1)},

 /* ---- novos: peito, costas, ombros e braços ---- */
 voador:{v:'front',A:sf({e1:[36,38],w1:[24,30],e2:[84,38],w2:[96,30]}),B:sf({e1:[44,46],w1:[56,40],e2:[76,46],w2:[64,40]}),b:J=>RC(52,30,16,32,.5)+RC(38,62,44,5)+LN(60,67,60,94),f:J=>LN(J.w1[0],J.w1[1]-5,J.w1[0],J.w1[1]+5,'bar')+LN(J.w2[0],J.w2[1]-5,J.w2[0],J.w2[1]+5,'bar')},
 voador_inv:{v:'front',A:sf({e1:[44,46],w1:[56,40],e2:[76,46],w2:[64,40]}),B:sf({e1:[36,38],w1:[24,30],e2:[84,38],w2:[96,30]}),b:J=>RC(52,30,16,32,.5)+RC(38,62,44,5)+LN(60,67,60,94),f:J=>LN(J.w1[0],J.w1[1]-5,J.w1[0],J.w1[1]+5,'bar')+LN(J.w2[0],J.w2[1]-5,J.w2[0],J.w2[1]+5,'bar')},
 supino_sentado:{v:'side',A:{hp:[44,70],t:-94,n:-90,l1:[5,88],l2:[2,92],a1:[150,-10]},B:{hp:[44,70],t:-94,n:-90,l1:[5,88],l2:[2,92],a1:[0,0]},b:J=>LN(37,72,33,34,'pad')+RC(28,72,30,5)+LN(42,77,42,94)+TORRE(96),f:J=>LN(J.w1[0],J.w1[1]-5,J.w1[0],J.w1[1]+5,'bar')},
 remada_invertida:{v:'side',A:{j:{hd:[22,77],sh:[34,80],hp:[61,86],k1:[80,90],f1:[99,94],e1:[35,66],w1:[36,52]}},B:{j:{hd:[33,51],sh:[43,58],hp:[67,73],k1:[83,84],f1:[99,94],e1:[30,64],w1:[36,52]}},b:J=>LN(36,52,36,94,'tw')+gC([36,52],2.6,'eq'),f:J=>''},
 coice:{v:'side',A:{hp:[52,56],t:-40,n:-30,l1:[70,100],l2:[76,96],a1:[175,90]},B:{hp:[52,56],t:-40,n:-30,l1:[70,100],l2:[76,96],a1:[175,175]},b:J=>'',f:J=>HALT_V(J.w1)},
 rosca_punho:{v:'side',A:{j:{hd:[52,35],sh:[53,47],hp:[46,74],k1:[66,74],f1:[66,94],e1:[52,64],w1:[67,70]}},B:{j:{hd:[52,35],sh:[53,47],hp:[46,74],k1:[66,74],f1:[66,94],e1:[52,64],w1:[66,62]}},b:J=>RC(32,76,22,5)+LN(42,81,42,94),f:J=>ANILHA(J.w1,0,4)},

 /* ---- pernas e glúteos ---- */
 agachamento:{v:'side',A:{j:{hd:[60,14],sh:[59,26],hp:[58,54],k1:[59,74],f1:[60,94],k2:[57,74],f2:[58,94],e1:[45,34],w1:[55,27]}},B:{j:{hd:[67,37],sh:[60,47],hp:[44,70],k1:[63,75],f1:[60,94],k2:[61,76],f2:[58,94],e1:[46,54],w1:[54,45]}},b:J=>'',f:J=>ANILHA(J.w1,0,8)},
 goblet:{v:'side',A:{j:{hd:[60,14],sh:[59,26],hp:[58,54],k1:[59,74],f1:[60,94],k2:[57,74],f2:[58,94],e1:[62,40],w1:[69,29]}},B:{j:{hd:[67,37],sh:[60,47],hp:[44,70],k1:[63,75],f1:[60,94],k2:[61,76],f2:[58,94],e1:[69,58],w1:[74,47]}},b:J=>'',f:J=>HALT_V(J.w1)},
 agacha_livre:{v:'side',A:{j:{hd:[60,14],sh:[59,26],hp:[58,54],k1:[59,74],f1:[60,94],k2:[57,74],f2:[58,94],e1:[74,28],w1:[88,29]}},B:{j:{hd:[67,37],sh:[60,47],hp:[44,70],k1:[63,75],f1:[60,94],k2:[61,76],f2:[58,94],e1:[75,46],w1:[89,46]}},b:J=>'',f:J=>''},
 leg_press:{v:'side',A:{hp:[40,74],t:-145,n:-140,l1:[-70,10],l2:[-66,14],a1:[60,10]},B:{hp:[40,74],t:-145,n:-140,l1:[-35,-35],l2:[-33,-33],a1:[60,10]},b:J=>LN(52,92,114,30,'tw')+LN(9,51,34,78,'pad')+LN(34,80,48,80,'pad')+LN(40,82,40,94),f:J=>{const c=[J.f1[0]+2.1,J.f1[1]-2.1];return LN(c[0]-6,c[1]-6,c[0]+6,c[1]+6,'pad');}},
 extensora:{v:'side',A:{hp:[48,66],t:-98,n:-95,l1:[0,85],l2:[2,88],a1:[80,50]},B:{hp:[48,66],t:-98,n:-95,l1:[0,-12],l2:[2,-8],a1:[80,50]},b:J=>RC(30,68,40,5)+LN(39,66,43,36,'pad')+LN(50,73,50,94),f:J=>ROLO(J.f1,0,-3)},
 flexora_sentada:{v:'side',A:{hp:[48,66],t:-98,n:-95,l1:[0,-8],l2:[2,-5],a1:[80,50]},B:{hp:[48,66],t:-98,n:-95,l1:[0,112],l2:[2,115],a1:[80,50]},b:J=>RC(30,68,40,5)+LN(39,66,43,36,'pad')+LN(50,73,50,94),f:J=>ROLO(J.f1,0,3)},
 flexora:{v:'side',A:{hp:[50,64],t:0,n:-15,l1:[180,180],l2:[178,178],a1:[80,10]},B:{hp:[50,64],t:0,n:-15,l1:[180,-80],l2:[178,-84],a1:[80,10]},b:J=>RC(18,70,72,5)+LN(28,75,28,94)+LN(80,75,80,94),f:J=>ROLO(J.f1,0,-3)},
 stiff:{v:'side',A:{hp:[55,54],t:-90,n:-88,l1:[92,88],l2:[88,92],a1:[88,92]},B:{hp:[38,57],t:-25,n:-12,l1:[56,75],l2:[54,77],a1:[90,90]},b:J=>'',f:J=>ANILHA(J.w1,0,7)},
 terra:{v:'side',A:{hp:[46,66],t:-25,n:-20,l1:[25,95],l2:[22,97],a1:[90,90]},B:{hp:[62,54],t:-90,n:-90,l1:[90,90],l2:[88,92],a1:[90,90]},b:J=>'',f:J=>ANILHA(J.w1,0,8)},
 afundo:{v:'side',A:{j:{hd:[52,20],sh:[52,32],hp:[52,60],k1:[62,77],f1:[72,94],k2:[41,77],f2:[31,94],t2:[37,94],e1:[53,47],w1:[53,61]}},B:{j:{hd:[52,34],sh:[52,46],hp:[52,74],k1:[72,74],f1:[72,94],k2:[50,92],f2:[31,94],t2:[37,94],e1:[53,61],w1:[53,75]}},b:J=>'',f:J=>HALT_V(J.w1)},
 bulgaro:{v:'side',A:{j:{hd:[54,20],sh:[54,32],hp:[54,60],k1:[64,77],f1:[72,94],k2:[44,78],f2:[30,80],t2:[24,80],e1:[55,47],w1:[55,61]}},B:{j:{hd:[54,34],sh:[54,46],hp:[54,74],k1:[73,74],f1:[72,94],k2:[44,88],f2:[30,80],t2:[24,80],e1:[55,61],w1:[55,75]}},b:J=>RC(8,80,30,6)+LN(14,86,14,94)+LN(32,86,32,94),f:J=>HALT_V(J.w1)},
 hip_thrust:{v:'side',A:{j:{hd:[27,57],sh:[38,62],hp:[56,82],k1:[74,72],f1:[82,94],e1:[48,72],w1:[60,76]}},B:{j:{hd:[27,58],sh:[38,62],hp:[64,66],k1:[82,74],f1:[82,94],e1:[51,70],w1:[64,62]}},b:J=>RC(12,64,28,6)+LN(18,70,18,94)+LN(34,70,34,94),f:J=>ANILHA([J.hp[0],J.hp[1]-7],0,7)},
 ponte:{v:'side',A:{j:{hd:[18,88],sh:[30,88],hp:[56,90],k1:[70,72],f1:[76,94],e1:[44,92],w1:[58,93]}},B:{j:{hd:[18,88],sh:[30,88],hp:[56,78],k1:[74,74],f1:[76,94],e1:[44,92],w1:[58,93]}},b:J=>'',f:J=>''},
 abducao:{v:'front',A:sf({k1:[54,72],f1:[52,93],k2:[66,72],f2:[68,93],e1:[46,46],w1:[44,60],e2:[74,46],w2:[76,60]}),B:sf({k1:[42,70],f1:[40,92],k2:[78,70],f2:[80,92],e1:[46,46],w1:[44,60],e2:[74,46],w2:[76,60]}),b:J=>RC(52,30,16,32,.5)+RC(38,62,44,5),f:J=>RC(J.k1[0]-8,J.k1[1]-5,4,10)+RC(J.k2[0]+4,J.k2[1]-5,4,10)},
 sumo:{v:'front',A:{j:{hd:[60,14],sh:[60,26],hp:[60,54],k1:[46,73],f1:[40,93],k2:[74,73],f2:[80,93],e1:[52,40],w1:[57,53],e2:[68,40],w2:[63,53]}},B:{j:{hd:[60,30],sh:[60,42],hp:[60,70],k1:[40,72],f1:[40,93],k2:[80,72],f2:[80,93],e1:[51,57],w1:[57,69],e2:[69,57],w2:[63,69]}},b:J=>'',f:J=>HALT_V(gLp(J.w1,J.w2,.5),5)},
 gluteo_4apoios:{v:'side',A:{j:{hd:[29,64],sh:[40,68],hp:[66,72],e1:[41,81],w1:[41,94],k2:[67,92],f2:[86,93],k1:[68,91],f1:[86,92]}},B:{j:{hd:[29,64],sh:[40,68],hp:[66,72],e1:[41,81],w1:[41,94],k2:[67,92],f2:[86,93],k1:[84,62],f1:[104,60]}},b:J=>'',f:J=>''},
 panturrilha:{v:'side',A:{j:{hd:[57,13],sh:[57,25],hp:[57,53],k1:[57,73],f1:[57,93],t1:[63,91],k2:[56,73],f2:[56,93],t2:[62,91],e1:[58,40],w1:[58,54]}},B:{j:{hd:[59,6],sh:[59,18],hp:[59,46],k1:[59,66],f1:[59,86],t1:[64,91],k2:[58,66],f2:[58,86],t2:[63,91],e1:[60,33],w1:[60,47]}},b:J=>RC(58,91,26,3.5)+RC(54,94.5,34,0.1),f:J=>HALT_V(J.w1)},
 panturrilha_sentada:{v:'side',A:{j:{hd:[44,26],sh:[45,38],hp:[46,66],k1:[66,66],f1:[66,88],t1:[72,90],e1:[52,52],w1:[64,60]}},B:{j:{hd:[44,21],sh:[45,33],hp:[46,61],k1:[66,61],f1:[67,83],t1:[72,90],e1:[52,47],w1:[64,55]}},b:J=>RC(28,68,30,5)+LN(38,73,38,94)+RC(70,90,16,4),f:J=>RC(J.k1[0]-6,J.k1[1]-7,14,4)},

 cadeirinha:{v:'side',A:{j:{hd:[41,34],sh:[40,46],hp:[42,74],k1:[62,74],f1:[63,94],k2:[61,75],f2:[61,94],e1:[52,54],w1:[65,54]}},B:{j:{hd:[41,33.4],sh:[40,45.6],hp:[42,74],k1:[62,74],f1:[63,94],k2:[61,75],f2:[61,94],e1:[52,53.6],w1:[65,53.6]}},b:J=>LN(34,6,34,94,'tw'),f:J=>''},

 /* ---- abdômen e lombar ---- */
 superman:{v:'side',A:{j:{hd:[96,84],sh:[84,86],hp:[56,86],e1:[98,90],w1:[111,90],k1:[36,88],f1:[16,90]}},B:{j:{hd:[95,75],sh:[83,80],hp:[56,86],e1:[97,75],w1:[110,70],k1:[36,84],f1:[17,79]}},b:J=>'',f:J=>''},
 crunch:{v:'side',A:{hp:[56,88],t:180,n:180,l1:[-50,78],a1:[10,5]},B:{hp:[56,88],t:-145,n:-150,l1:[-50,78],a1:[-20,-15]},b:J=>'',f:J=>''},
 prancha:{v:'side',A:{j:{hd:[18,76],sh:[30,79],hp:[57,84.5],k1:[77,88.6],f1:[96.6,92.6],e1:[30,93],w1:[44,93]}},B:{j:{hd:[18,75],sh:[30,78.5],hp:[57,83],k1:[77,88],f1:[96.6,92.6],e1:[30,93],w1:[44,93]}},b:J=>'',f:J=>''},
 elev_pernas:{v:'side',A:{hp:[50,88],t:180,n:180,l1:[2,0],a1:[5,0]},B:{hp:[50,88],t:180,n:180,l1:[-82,-82],a1:[5,0]},b:J=>'',f:J=>''},
 elev_pernas_barra:{v:'side',chao:false,A:{j:{hd:[61,18],sh:[60,30],hp:[60,58],e1:[62,16],w1:[62,2],k1:[60,78],f1:[59,97]}},B:{j:{hd:[61,18],sh:[60,30],hp:[58,58],e1:[62,16],w1:[62,2],k1:[78,54],f1:[78,74]}},b:J=>LN(36,2,96,2,'pad'),f:J=>''},
 hiperextensao:{v:'side',A:{hp:[56,48],t:80,n:85,l1:[160,160],a1:[230,50]},B:{hp:[56,48],t:-10,n:-5,l1:[160,160],a1:[140,-40]},b:J=>LN(48,56,28,94,'tw')+LN(10,72,20,64,'pad'),f:J=>gC([J.hp[0],J.hp[1]+5],4.2,'eq')}
};

function montar(f,v){
  if(f.j)return f.j;
  const J={hp:f.hp};J.sh=gPol(f.hp,f.t,f.tl||28);J.hd=f.hd||gPol(J.sh,f.n==null?f.t:f.n,12);
  const fr=v==='front';
  const s1=fr?[J.sh[0]-10,J.sh[1]+1]:J.sh,s2=fr?[J.sh[0]+10,J.sh[1]+1]:J.sh,h1=fr?[J.hp[0]-5,J.hp[1]]:J.hp,h2=fr?[J.hp[0]+5,J.hp[1]]:J.hp;
  if(f.a1){J.e1=gPol(s1,f.a1[0],15);J.w1=gPol(J.e1,f.a1[1],14);}
  if(f.a2){J.e2=gPol(s2,f.a2[0],15);J.w2=gPol(J.e2,f.a2[1],14);}
  if(f.l1){J.k1=gPol(h1,f.l1[0],20);J.f1=gPol(J.k1,f.l1[1],20);}
  if(f.l2){J.k2=gPol(h2,f.l2[0],20);J.f2=gPol(J.k2,f.l2[1],20);}
  return J;
}
function interpolar(an,t){
  const A=an.A,B=an.B;
  if(an.m==='lin'||A.j){const a=montar(A,an.v),b=montar(B,an.v),J={};for(const k in a)J[k]=b[k]?gLp(a[k],b[k],t):a[k];return J;}
  const f={hp:gLp(A.hp,B.hp,t),t:gLa(A.t,B.t,t),tl:gLerp(A.tl||28,B.tl||28,t)};
  if(A.n!=null)f.n=gLa(A.n,B.n==null?A.n:B.n,t);
  if(A.hd)f.hd=gLp(A.hd,B.hd||A.hd,t);
  ['a1','a2','l1','l2'].forEach(k=>{if(A[k]){const b=B[k]||A[k];f[k]=[gLa(A[k][0],b[0],t),gLa(A[k][1],b[1],t)];}});
  return montar(f,an.v);
}
const DESTAQUE={tronco:['peito','dorsal','romboides'],trap:['trapezio'],delt:['deltAnt','deltLat','deltPost'],braco:['biceps','triceps'],ante:['antebraco'],coxa:['quadriceps','posteriores'],glut:['gluteos'],canela:['panturrilha'],core:['abdomen','lombar']};
/* segmento afinando: largura wa na ponta a e wb na ponta b, com juntas arredondadas */
function membro(a,b,wa,wb,c){
  const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,ha=wa/2,hb=wb/2;
  return `<polygon class="${c}" points="${gP([a[0]+nx*ha,a[1]+ny*ha])} ${gP([b[0]+nx*hb,b[1]+ny*hb])} ${gP([b[0]-nx*hb,b[1]-ny*hb])} ${gP([a[0]-nx*ha,a[1]-ny*ha])}"/>`+gC(a,ha,c)+gC(b,hb,c);
}
/* contorno do tronco visto de lado: ombro, peito, cintura e quadril */
function troncoLado(sh,hp,c){
  const dx=hp[0]-sh[0],dy=hp[1]-sh[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  const at=(t,w)=>{const m=gLp(sh,hp,t);return[m[0]+nx*w,m[1]+ny*w];};
  const pts=[at(0,6.6),at(.28,7.6),at(.68,5.4),at(1,6),at(1,-6.2),at(.68,-5.6),at(.25,-7),at(0,-6.6)];
  return `<polygon class="${c} tf" points="${pts.map(gP).join(' ')}"/>`+gC(sh,6.4,c);
}
function sombra(J,an){
  if(an.chao===false)return '';
  const ps=['f1','f2','t1','t2','w1','w2','hp','sh','hd','k1','k2'].map(k=>J[k]).filter(p=>p&&p[1]>=86);
  if(!ps.length)return '';
  const xs=ps.map(p=>p[0]),a=Math.min(...xs)-5,b=Math.max(...xs)+5;
  return `<ellipse class="sombra" cx="${g1((a+b)/2)}" cy="94.5" rx="${g1((b-a)/2)}" ry="2.4"/>`;
}
function boneco(J,an,p){
  const tem=k=>DESTAQUE[k].some(m=>p.includes(m)),fr=an.v==='front';
  const C=(longe,quente)=>longe?(quente?'c-hots':'c-soft'):(quente?'c-hot':'c-ink');
  const braco=(s,e,w,longe)=>e?membro(s,e,7.6,5.8,C(longe,tem('braco')))+membro(e,w,5.6,4.2,C(longe,tem('ante')))+gC(w,3.2,C(longe,tem('ante'))):'';
  const perna=(h,k,f,longe,dir,pe)=>k?membro(h,k,10,7.2,C(longe,tem('coxa')))+membro(k,f,7,4.8,C(longe,tem('canela')))+gS(f,pe||[f[0]+dir*6.5,f[1]],4.6,C(longe,0)):'';
  const cabeca=()=>membro(J.sh,gLp(J.sh,J.hd,.72),5.4,5,'c-ink')+gC(J.hd,7.2,an.hdo?'c-ink hdo':'c-ink');
  let s=sombra(J,an);
  if(fr){
    const sL=[J.sh[0]-10,J.sh[1]+1],sR=[J.sh[0]+10,J.sh[1]+1],hL=[J.hp[0]-5,J.hp[1]],hR=[J.hp[0]+5,J.hp[1]];
    s+=perna(hL,J.k1,J.f1,0,-1,J.t1)+perna(hR,J.k2,J.f2,0,1,J.t2);
    const cin=gLp(J.sh,J.hp,.7);
    s+=`<polygon class="c-ink tf" points="${gP([J.sh[0]-11.5,J.sh[1]-1])} ${gP([J.sh[0]+11.5,J.sh[1]-1])} ${gP([J.sh[0]+10,J.sh[1]+6])} ${gP([cin[0]+6.4,cin[1]])} ${gP([J.hp[0]+7,J.hp[1]])} ${gP([J.hp[0]-7,J.hp[1]])} ${gP([cin[0]-6.4,cin[1]])} ${gP([J.sh[0]-10,J.sh[1]+6])}"/>`;
    if(tem('tronco')){const m=gLp(J.sh,J.hp,.55);s+=`<polygon class="c-hot tf" points="${gP([J.sh[0]-8,J.sh[1]+3])} ${gP([J.sh[0]+8,J.sh[1]+3])} ${gP([m[0]+4,m[1]])} ${gP([m[0]-4,m[1]])}"/>`;}
    if(tem('core')){const a=gLp(J.sh,J.hp,.58),b=gLp(J.sh,J.hp,.94);s+=`<polygon class="c-hot tf" points="${gP([a[0]-5,a[1]])} ${gP([a[0]+5,a[1]])} ${gP([b[0]+4,b[1]])} ${gP([b[0]-4,b[1]])}"/>`;}
    if(tem('glut'))s+=gC(hL,4.6,'c-hot')+gC(hR,4.6,'c-hot');
    if(!an.hdo)s+=cabeca();
    if(tem('trap'))s+=gS([J.sh[0]-7,J.sh[1]],[J.sh[0]-1,J.sh[1]-3],4,'c-hot')+gS([J.sh[0]+7,J.sh[1]],[J.sh[0]+1,J.sh[1]-3],4,'c-hot');
    s+=gC(sL,4.6,tem('delt')?'c-hot':'c-ink')+gC(sR,4.6,tem('delt')?'c-hot':'c-ink');
    if(an.hdo)s+=cabeca();
    s+=braco(sL,J.e1,J.w1,0)+braco(sR,J.e2,J.w2,0);
    if(tem('delt'))s+=gC(sL,4.6,'c-hot')+gC(sR,4.6,'c-hot');
  }else{
    const dir=an.dir||1;
    s+=perna(J.hp,J.k2,J.f2,1,dir,J.t2)+braco(J.sh,J.e2,J.w2,1);
    s+=troncoLado(J.sh,J.hp,'c-ink');
    if(tem('tronco'))s+=membro(gLp(J.sh,J.hp,.14),gLp(J.sh,J.hp,.5),9,7,'c-hot');
    if(tem('core'))s+=membro(gLp(J.sh,J.hp,.58),gLp(J.sh,J.hp,.9),7.2,7.6,'c-hot');
    s+=cabeca();
    if(tem('trap'))s+=gS(J.sh,gLp(J.sh,J.hd,.42),6.4,'c-hot');
    s+=perna(J.hp,J.k1,J.f1,0,dir,J.t1);
    if(tem('glut'))s+=gC(J.hp,5.8,'c-hot');
    if(tem('delt'))s+=gC(J.sh,5.4,'c-hot');
    s+=braco(J.sh,J.e1,J.w1,0);
  }
  return s;
}
const suave=x=>x*x*(3-2*x);
function curva(p){if(p<.12)return 0;if(p<.45)return suave((p-.12)/.33);if(p<.57)return 1;return 1-suave((p-.57)/.43);}
function quadro(id,ph){
  const ex=EXS[id],an=ANIM[ex.pose]||ANIM.flexao,chao=an.chao===false?'':'<line class="fl" x1="2" y1="94" x2="118" y2="94"/>';
  if(ph==null){
    const a=interpolar(an,0),b=interpolar(an,1);
    return chao+an.b(b)+`<g opacity=".28">${boneco(a,an,ex.p)}${an.f(a)}</g>`+boneco(b,an,ex.p)+an.f(b);
  }
  const J=interpolar(an,curva(ph));
  return chao+an.b(J)+boneco(J,an,ex.p)+an.f(J);
}
let animLigada=()=>!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const poseSVG=id=>`<svg class="pose" viewBox="0 0 120 100" data-ex="${id}" role="img" aria-label="Animação do exercício ${EXS[id].n}">${quadro(id,animLigada()?0:null)}</svg>`;
const visiveis=new Set();
const vigia=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)visiveis.add(e.target);else visiveis.delete(e.target);}),{rootMargin:'60px'}):null;
function observar(){visiveis.clear();if(vigia){vigia.disconnect();document.querySelectorAll('svg.pose[data-ex]').forEach(s=>vigia.observe(s));}}
let ultQuadro=0;const T0=performance.now(),CICLO=3200;
function loopAnim(agora){
  requestAnimationFrame(loopAnim);
  if(!animLigada()||document.hidden||agora-ultQuadro<33)return;
  ultQuadro=agora;
  const ph=((agora-T0)%CICLO)/CICLO;
  const alvos=vigia?visiveis:document.querySelectorAll('svg.pose[data-ex]');
  alvos.forEach(s=>{if(!s.isConnected){visiveis.delete(s);return;}s.innerHTML=quadro(s.dataset.ex,ph);});
}
requestAnimationFrame(loopAnim);

/* ================= Mapa muscular ================= */
const NOMES={peito:'Peitoral',deltAnt:'Ombro (frente)',deltLat:'Ombro (lateral)',deltPost:'Ombro (posterior)',biceps:'Bíceps',triceps:'Tríceps',antebraco:'Antebraço',trapezio:'Trapézio',dorsal:'Dorsal',romboides:'Meio das costas',lombar:'Lombar',quadriceps:'Quadríceps',posteriores:'Posterior da coxa',gluteos:'Glúteos',panturrilha:'Panturrilha',abdomen:'Abdômen'};
function mapSVG(p,s){
  const c=k=>p.includes(k)?'p':s.includes(k)?'s':'m';
  const base=ox=>`<circle class="n" cx="${30+ox}" cy="9" r="6"/><rect class="n" x="${27+ox}" y="14" width="6" height="6"/>
    <rect class="n" x="${21+ox}" y="21" width="18" height="36" rx="4"/>
    <ellipse class="n" cx="${13+ox}" cy="62" rx="2.6" ry="3"/><ellipse class="n" cx="${47+ox}" cy="62" rx="2.6" ry="3"/>
    <rect class="n" x="${22.5+ox}" y="56" width="6.6" height="44" rx="3"/><rect class="n" x="${30.9+ox}" y="56" width="6.6" height="44" rx="3"/>`;
  const frente=`${base(0)}
    <path class="${c('trapezio')}" d="M21 21 Q30 14 39 21 L35 22.5 L25 22.5 Z"/>
    <path class="${c('peito')}" d="M21 23 H29.4 V34.5 Q24 36.5 20 32 Z"/>
    <path class="${c('peito')}" d="M30.6 23 H39 L40 32 Q36 36.5 30.6 34.5 Z"/>
    <rect class="${c('abdomen')}" x="23.5" y="37" width="13" height="18" rx="3"/>
    <circle class="${c('deltAnt')}" cx="18.5" cy="25" r="5"/><circle class="${c('deltAnt')}" cx="41.5" cy="25" r="5"/>
    <ellipse class="${c('deltLat')}" cx="13.6" cy="26" rx="2.4" ry="4.6"/><ellipse class="${c('deltLat')}" cx="46.4" cy="26" rx="2.4" ry="4.6"/>
    <ellipse class="${c('biceps')}" cx="15.5" cy="37.5" rx="3.3" ry="7"/><ellipse class="${c('biceps')}" cx="44.5" cy="37.5" rx="3.3" ry="7"/>
    <ellipse class="${c('antebraco')}" cx="13.6" cy="52" rx="2.9" ry="7.2"/><ellipse class="${c('antebraco')}" cx="46.4" cy="52" rx="2.9" ry="7.2"/>
    <ellipse class="${c('quadriceps')}" cx="25.8" cy="69" rx="3.1" ry="10"/><ellipse class="${c('quadriceps')}" cx="34.2" cy="69" rx="3.1" ry="10"/>`;
  const o=64;
  const costas=`${base(o)}
    <path class="${c('trapezio')}" d="M${21+o} 21 Q${30+o} 13 ${39+o} 21 L${35+o} 30 L${30+o} 40 L${25+o} 30 Z"/>
    <path class="${c('romboides')}" d="M${26.5+o} 25 L${33.5+o} 25 L${32+o} 35 L${28+o} 35 Z"/>
    <rect class="${c('lombar')}" x="${26.5+o}" y="44" width="7" height="12" rx="2"/>
    <path class="${c('dorsal')}" d="M${21.5+o} 30 L${26+o} 31 L${29.2+o} 46 L${23+o} 53 L${20.5+o} 40 Z"/>
    <path class="${c('dorsal')}" d="M${38.5+o} 30 L${34+o} 31 L${30.8+o} 46 L${37+o} 53 L${39.5+o} 40 Z"/>
    <circle class="${c('deltPost')}" cx="${18.5+o}" cy="25" r="5"/><circle class="${c('deltPost')}" cx="${41.5+o}" cy="25" r="5"/>
    <ellipse class="${c('deltLat')}" cx="${13.6+o}" cy="26" rx="2.4" ry="4.6"/><ellipse class="${c('deltLat')}" cx="${46.4+o}" cy="26" rx="2.4" ry="4.6"/>
    <ellipse class="${c('triceps')}" cx="${15.5+o}" cy="37.5" rx="3.3" ry="7"/><ellipse class="${c('triceps')}" cx="${44.5+o}" cy="37.5" rx="3.3" ry="7"/>
    <ellipse class="${c('antebraco')}" cx="${13.6+o}" cy="52" rx="2.9" ry="7.2"/><ellipse class="${c('antebraco')}" cx="${46.4+o}" cy="52" rx="2.9" ry="7.2"/>
    <ellipse class="${c('gluteos')}" cx="${26+o}" cy="61" rx="4" ry="4.6"/><ellipse class="${c('gluteos')}" cx="${34+o}" cy="61" rx="4" ry="4.6"/>
    <ellipse class="${c('posteriores')}" cx="${25.8+o}" cy="75" rx="3" ry="7.5"/><ellipse class="${c('posteriores')}" cx="${34.2+o}" cy="75" rx="3" ry="7.5"/>
    <ellipse class="${c('panturrilha')}" cx="${25.8+o}" cy="90" rx="3" ry="6"/><ellipse class="${c('panturrilha')}" cx="${34.2+o}" cy="90" rx="3" ry="6"/>`;
  const label='Músculos: '+p.map(k=>NOMES[k]).join(', ')+(s.length?'. Ajudam: '+s.map(k=>NOMES[k]).join(', '):'');
  return `<svg class="mm" viewBox="8 0 108 102" role="img" aria-label="${label}">${frente}${costas}</svg><div class="mmcap"><span>frente</span><span>costas</span></div>`;
}
