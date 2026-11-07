/* Biblioteca de exercícios. g = grupo, p = músculos principais, sec = auxiliares,
   t = 'c' composto ou 'i' isolado, eq = equipamentos, nv = dificuldade (1 a 3), r = articulações que exigem cuidado. */
const GRUPOS={
 peito:{n:'Peito',fam:'push',tam:'G',m:['peito']},
 costas:{n:'Costas',fam:'pull',tam:'G',m:['dorsal','romboides','lombar']},
 ombros:{n:'Ombros',fam:'push',tam:'M',m:['deltAnt','deltLat','deltPost']},
 biceps:{n:'Bíceps',fam:'pull',tam:'P',m:['biceps']},
 triceps:{n:'Tríceps',fam:'push',tam:'P',m:['triceps']},
 trapezio:{n:'Trapézio',fam:'pull',tam:'P',m:['trapezio']},
 antebraco:{n:'Antebraço',fam:'pull',tam:'P',m:['antebraco']},
 quadriceps:{n:'Quadríceps',fam:'legs',tam:'G',m:['quadriceps']},
 posteriores:{n:'Posterior de coxa',fam:'legs',tam:'G',m:['posteriores']},
 gluteos:{n:'Glúteos',fam:'legs',tam:'G',m:['gluteos']},
 panturrilha:{n:'Panturrilha',fam:'legs',tam:'P',m:['panturrilha']},
 abdomen:{n:'Abdômen',fam:'core',tam:'P',m:['abdomen']}
};
const GRUPO_IDS=Object.keys(GRUPOS);
const MUSC_GRUPO={};GRUPO_IDS.forEach(g=>GRUPOS[g].m.forEach(m=>MUSC_GRUPO[m]=g));
const SECOES=[['Peito',['peito']],['Costas',['costas']],['Ombros',['ombros']],['Braços',['biceps','triceps','antebraco']],['Trapézio',['trapezio']],['Pernas',['quadriceps','posteriores','gluteos','panturrilha']],['Abdômen',['abdomen']]];
const EQ_NOME={barra:'Barra',halter:'Halteres',maquina:'Máquina',polia:'Polia',corpo:'Peso do corpo',banco:'Banco',barrafixa:'Barra fixa',paralela:'Paralelas'};
const LESOES={ombro:'Ombro',joelho:'Joelho',lombar:'Lombar (coluna)',punho:'Punho',cotovelo:'Cotovelo'};

const X=(n,pose,g,p,sec,t,eq,nv,r,dica,x={})=>({n,pose,g,p,sec,t,eq,nv,r,dica,...x});
const BW={bw:true};
const EXS={
 /* Peito */
 supino_reto:X('Supino reto com barra','supino_barra','peito',['peito'],['triceps','deltAnt'],'c',['barra','banco'],2,['ombro'],'Desce a barra até tocar de leve no meio do peito, com as escápulas presas no banco e os pés firmes no chão.'),
 supino_halter:X('Supino reto com halteres','supino_halter','peito',['peito'],['triceps','deltAnt'],'c',['halter','banco'],1,[],'Os halteres permitem descer mais que a barra. Aproveita esse alongamento e sobe juntando levemente.'),
 incl_halter:X('Supino inclinado com halteres','incl_halter','peito',['peito'],['deltAnt','triceps'],'c',['halter','banco'],1,[],'Banco entre 30° e 40°. Desce os halteres até a linha do peito e sobe juntando levemente.'),
 incl_barra:X('Supino inclinado com barra','incl_barra','peito',['peito'],['deltAnt','triceps'],'c',['barra','banco'],2,['ombro'],'Desce a barra na parte de cima do peito, logo abaixo da clavícula.'),
 supino_maquina:X('Supino na máquina','supino_sentado','peito',['peito'],['triceps','deltAnt'],'c',['maquina'],1,[],'Ajuste o banco para a pegada ficar na altura do meio do peito. Empurra sem travar o cotovelo e volta devagar.'),
 crossover:X('Crucifixo no cross-over','crossover','peito',['peito'],['deltAnt'],'i',['polia'],1,[],'Cotovelos levemente dobrados e travados. Segura 1 segundo apertando o peito quando as mãos se encontram.'),
 voador:X('Voador (peck deck)','voador','peito',['peito'],['deltAnt'],'i',['maquina'],1,[],'Cotovelos levemente dobrados. Junta as mãos na frente do peito e volta devagar até sentir alongar.'),
 crucifixo_halter:X('Crucifixo com halteres','supino_halter','peito',['peito'],['deltAnt'],'i',['halter','banco'],1,['ombro'],'Braços quase retos. Abre até sentir o peito alongar, sem passar muito da linha do corpo.'),
 flexao:X('Flexão de braço','flexao','peito',['peito','triceps'],['deltAnt'],'c',['corpo'],1,['punho'],'Corpo reto como uma tábua, peito quase encostando no chão.',BW),
 flexao_inclinada:X('Flexão inclinada (mãos no banco)','flexao','peito',['peito','triceps'],['deltAnt'],'c',['corpo'],1,['punho'],'Mãos num banco, sofá ou mesa firme deixam a flexão mais leve. Ótima para começar.',BW),
 paralelas:X('Paralelas','paralelas','peito',['peito','triceps'],['deltAnt'],'c',['paralela'],3,['ombro'],'Inclina o tronco um pouco à frente para pegar mais peito. Desce até o ombro ficar na altura do cotovelo.',BW),

 /* Costas */
 barra_fixa:X('Barra fixa','barra_fixa','costas',['dorsal'],['biceps','romboides'],'c',['barrafixa'],3,[],'Pegada um pouco mais aberta que os ombros. Sobe até o queixo passar a barra e desce controlando.',BW),
 puxada:X('Puxada frontal','puxada','costas',['dorsal'],['biceps','romboides'],'c',['polia'],1,[],'Puxa a barra até o alto do peito, inclinando o tronco só um pouco para trás.'),
 puxada_neutra:X('Puxada com triângulo','puxada','costas',['dorsal'],['biceps','romboides'],'c',['polia'],1,[],'Pegada neutra, palmas viradas uma para a outra. Leva o triângulo até o alto do peito.'),
 remada_curvada:X('Remada curvada com barra','remada_curvada','costas',['dorsal','romboides'],['deltPost','biceps','lombar'],'c',['barra'],2,['lombar'],'Tronco inclinado uns 45°, coluna neutra. Puxa a barra em direção ao umbigo levando os cotovelos para trás.'),
 remada_cavalinho:X('Remada cavalinho','remada_curvada','costas',['dorsal','romboides'],['deltPost','biceps'],'c',['barra'],2,['lombar'],'Peito para fora e coluna neutra. Puxa até as anilhas quase encostarem no peito.'),
 remada_unilateral:X('Remada unilateral com halter','remada_unilateral','costas',['dorsal'],['romboides','biceps'],'c',['halter','banco'],1,[],'Joelho e mão apoiados no banco. Puxa o halter em direção ao quadril, como se fosse ligar um motor de popa.',{lado:'cada lado'}),
 remada_baixa:X('Remada baixa no triângulo','remada_baixa','costas',['romboides','dorsal'],['biceps','deltPost'],'c',['polia'],1,[],'Peito aberto, puxa até a barriga e junta as escápulas. Não balança o tronco.'),
 remada_maquina:X('Remada na máquina','remada_baixa','costas',['romboides','dorsal'],['biceps','deltPost'],'c',['maquina'],1,[],'Com o peito apoiado a lombar descansa. Puxa levando os cotovelos para trás e segura 1 segundo.'),
 pulldown_ext:X('Pulldown com braço estendido','pulldown_ext','costas',['dorsal'],['triceps'],'i',['polia'],2,[],'Braços quase retos o tempo todo. Leva a barra da altura da cabeça até a coxa usando as costas.'),
 pullover:X('Pullover com halter','pullover','costas',['dorsal','peito'],['triceps'],'i',['halter','banco'],2,['ombro'],'Deitado atravessado no banco, leva o halter para trás da cabeça com os braços quase retos e volta.'),
 remada_invertida:X('Remada invertida (barra baixa ou mesa)','remada_invertida','costas',['dorsal','romboides'],['biceps','deltPost'],'c',['corpo'],1,[],'Corpo reto, puxa o peito até a barra. Em casa dá para fazer embaixo de uma mesa bem firme.',BW),
 remada_uni_mochila:X('Remada unilateral com mochila','remada_unilateral','costas',['dorsal'],['romboides','biceps'],'c',['corpo'],1,[],'Mão e joelho apoiados numa cadeira firme. Puxa a mochila em direção ao quadril.',{lado:'cada lado'}),
 remada_mochila:X('Remada curvada com mochila','remada_curvada','costas',['dorsal','romboides'],['biceps','deltPost'],'c',['corpo'],1,['lombar'],'Enche uma mochila com livros ou garrafas. Tronco inclinado, coluna reta, puxa em direção ao umbigo.'),
 superman:X('Superman no chão','superman','costas',['lombar'],['gluteos','deltPost'],'i',['corpo'],1,[],'Deitado de bruços, sobe braços e pernas juntos e segura 2 segundos. Fortalece a lombar sem carga.',BW),
 hiperextensao:X('Extensão lombar no banco romano','hiperextensao','costas',['lombar'],['gluteos','posteriores'],'i',['maquina'],1,[],'Sobe até o corpo ficar reto, sem jogar a cabeça para trás. Movimento controlado.'),

 /* Ombros */
 desenvolvimento:X('Desenvolvimento com halteres sentado','desenvolvimento','ombros',['deltAnt','deltLat'],['triceps','trapezio'],'c',['halter','banco'],1,[],'Começa com os halteres na altura das orelhas e empurra para cima sem bater um no outro.'),
 desenvolvimento_barra:X('Desenvolvimento militar com barra','desenvolvimento','ombros',['deltAnt','deltLat'],['triceps','trapezio'],'c',['barra'],2,['ombro','lombar'],'A barra sai da altura do queixo e sobe em linha reta, sem arquear a lombar.'),
 desenvolvimento_maquina:X('Desenvolvimento na máquina','desenvolvimento','ombros',['deltAnt','deltLat'],['triceps'],'c',['maquina'],1,[],'Pegada na altura das orelhas. Empurra até quase esticar e desce devagar.'),
 arnold:X('Desenvolvimento Arnold','desenvolvimento','ombros',['deltAnt','deltLat'],['triceps'],'c',['halter','banco'],2,['ombro'],'Começa com as palmas viradas para você e vai girando enquanto sobe.'),
 elev_lateral:X('Elevação lateral','elev_lateral','ombros',['deltLat'],['trapezio'],'i',['halter'],1,[],'Sobe até a altura dos ombros, cotovelo um pouco à frente da mão. Carga leve e controle.'),
 elev_lateral_polia:X('Elevação lateral na polia','elev_lateral','ombros',['deltLat'],['trapezio'],'i',['polia'],2,[],'Cabo passando pela frente do corpo. Sobe até a linha do ombro e desce devagar.',{lado:'cada lado'}),
 elev_lateral_garrafa:X('Elevação lateral com garrafas','elev_lateral','ombros',['deltLat'],['trapezio'],'i',['corpo'],1,[],'Garrafas de água ou galões pequenos nas mãos. Sobe até a linha do ombro, devagar.'),
 elev_frontal:X('Elevação frontal com halteres','elev_frontal','ombros',['deltAnt'],['peito'],'i',['halter'],1,[],'Sobe até a linha dos olhos e desce devagar. Nada de balanço.'),
 crucifixo_inverso:X('Crucifixo inverso com halteres','crucifixo_inverso','ombros',['deltPost'],['romboides','trapezio'],'i',['halter'],1,[],'Tronco inclinado quase paralelo ao chão. Abre os braços para os lados como asas, com carga leve.'),
 voador_inverso:X('Voador inverso','voador_inv','ombros',['deltPost'],['romboides','trapezio'],'i',['maquina'],1,[],'De frente para o encosto, abre os braços para trás e junta as escápulas no final.'),
 face_pull:X('Face pull na polia','face_pull','ombros',['deltPost'],['romboides','trapezio'],'i',['polia'],1,[],'Corda na altura do rosto. Puxa abrindo as mãos para os lados das orelhas. Protege o ombro.'),
 remada_alta:X('Remada alta com barra','remada_alta','ombros',['deltLat','trapezio'],['biceps'],'c',['barra'],2,['ombro'],'Pegada na largura dos ombros ou mais aberta. Sobe só até a linha do peito para poupar o ombro.'),
 flexao_pike:X('Flexão pike (ombros)','flexao','ombros',['deltAnt'],['triceps','deltLat'],'c',['corpo'],2,['punho','ombro'],'Quadril bem alto, o corpo forma um V invertido. Desce a cabeça em direção ao chão entre as mãos.',BW),

 /* Trapézio */
 encolhimento:X('Encolhimento com halteres','encolhimento','trapezio',['trapezio'],['antebraco'],'i',['halter'],1,[],'Sobe os ombros em direção às orelhas, segura 1 segundo e desce. Não gira os ombros.'),
 encolhimento_mochila:X('Encolhimento com mochila','encolhimento','trapezio',['trapezio'],['antebraco'],'i',['corpo'],1,[],'Segure uma mochila pesada em cada mão ou uma só com as duas. Sobe os ombros e segura 1 segundo.'),
 encolhimento_barra:X('Encolhimento com barra','encolhimento','trapezio',['trapezio'],['antebraco'],'i',['barra'],1,[],'Barra na frente das coxas. Sobe os ombros reto para cima e segura 1 segundo.'),

 /* Bíceps */
 rosca_direta:X('Rosca direta com barra','rosca_barra','biceps',['biceps'],['antebraco'],'i',['barra'],1,['punho'],'Cotovelos parados ao lado do corpo. Desce em 2 segundos, sem jogar o quadril. Pode ser barra reta ou W.'),
 rosca_martelo:X('Rosca martelo','rosca_martelo','biceps',['biceps','antebraco'],[],'i',['halter'],1,[],'Pegada neutra, palmas viradas uma para a outra. Engrossa o braço por fora.'),
 rosca_alternada:X('Rosca alternada com halteres','rosca_martelo','biceps',['biceps'],['antebraco'],'i',['halter'],1,[],'Alterna os braços girando a palma para cima durante a subida. Controla a descida.',{lado:'cada braço'}),
 rosca_scott:X('Rosca Scott','rosca_scott','biceps',['biceps'],['antebraco'],'i',['maquina'],1,['cotovelo'],'Braço todo apoiado no banco. Desce quase até esticar, mas sem soltar o peso embaixo.'),
 rosca_polia:X('Rosca na polia','rosca_barra','biceps',['biceps'],['antebraco'],'i',['polia'],1,[],'A polia mantém tensão o tempo todo. Cotovelos colados no corpo.'),
 rosca_concentrada:X('Rosca concentrada','rosca_scott','biceps',['biceps'],[],'i',['halter','banco'],1,[],'Sentado, cotovelo apoiado na parte de dentro da coxa. Sobe girando o punho e aperta no alto.',{lado:'cada braço'}),
 rosca_inclinada:X('Rosca no banco inclinado','rosca_martelo','biceps',['biceps'],['antebraco'],'i',['halter','banco'],2,['ombro'],'Encostado no banco inclinado, braços pendurados para trás. Alonga muito o bíceps.'),
 barra_supinada:X('Barra fixa supinada','barra_fixa','biceps',['biceps','dorsal'],['romboides'],'c',['barrafixa'],3,[],'Palmas viradas para você, mãos na largura dos ombros. Sobe até o queixo passar a barra.',BW),
 rosca_mochila:X('Rosca com mochila ou galão','rosca_barra','biceps',['biceps'],['antebraco'],'i',['corpo'],1,[],'Use uma mochila com peso ou um galão de água. Cotovelos colados no corpo e descida lenta.'),

 /* Tríceps */
 testa:X('Tríceps testa com barra W','testa','triceps',['triceps'],[],'i',['barra','banco'],2,['cotovelo'],'Só o antebraço se mexe. Cotovelos apontando para o teto, sem abrir para os lados.'),
 corda:X('Tríceps na polia com corda','corda','triceps',['triceps'],['antebraco'],'i',['polia'],1,[],'Cotovelos colados no corpo. No final, abre a corda para fora e segura meio segundo.'),
 polia_barra:X('Tríceps na polia com barra','polia_barra','triceps',['triceps'],['antebraco'],'i',['polia'],1,[],'Cotovelos colados no corpo, estende até travar o braço.'),
 frances:X('Tríceps francês com halter','frances','triceps',['triceps'],[],'i',['halter','banco'],1,['cotovelo','ombro'],'Sentado, segura o halter com as duas mãos atrás da cabeça. Cotovelos apontando para cima.'),
 mergulho_banco:X('Mergulho no banco ou cadeira','mergulho_banco','triceps',['triceps'],['peito','deltAnt'],'c',['corpo'],1,['ombro'],'Mãos num banco ou cadeira firme. Desce até o cotovelo formar 90°. Com as pernas esticadas fica mais difícil.',BW),
 flexao_diamante:X('Flexão diamante','flexao','triceps',['triceps'],['peito','deltAnt'],'c',['corpo'],2,['punho'],'Mãos juntas formando um losango com polegares e indicadores, embaixo do peito.',BW),
 supino_fechado:X('Supino com pegada fechada','supino_barra','triceps',['triceps'],['peito','deltAnt'],'c',['barra','banco'],2,['punho'],'Mãos na largura dos ombros e cotovelos perto do corpo na descida.'),
 coice:X('Tríceps coice com halter','coice','triceps',['triceps'],[],'i',['halter'],1,[],'Tronco inclinado, braço colado ao corpo. Estica o cotovelo para trás e segura 1 segundo.',{lado:'cada braço'}),

 /* Antebraço */
 rosca_punho:X('Rosca de punho','rosca_punho','antebraco',['antebraco'],[],'i',['halter'],1,['punho'],'Antebraço apoiado na coxa, só o punho se mexe. Amplitude completa e sem pressa.'),
 rosca_inversa:X('Rosca inversa','rosca_barra','antebraco',['antebraco','biceps'],[],'i',['barra'],1,['punho'],'Palmas viradas para baixo. Sobe como uma rosca direta, com carga mais leve.'),
 farmer:X('Caminhada do fazendeiro','encolhimento','antebraco',['antebraco'],['trapezio','abdomen'],'c',['halter'],1,[],'Segura halteres pesados e caminha com o tronco firme e os ombros para trás.',{seg:true}),

 /* Quadríceps */
 agachamento:X('Agachamento livre com barra','agachamento','quadriceps',['quadriceps'],['gluteos','posteriores','lombar'],'c',['barra'],2,['joelho','lombar'],'Barra apoiada no trapézio, pés na largura dos ombros. Desce com o peito aberto até a coxa ficar paralela ao chão.'),
 agachamento_goblet:X('Agachamento goblet','goblet','quadriceps',['quadriceps'],['gluteos','abdomen'],'c',['halter'],1,[],'Segura o halter em pé na frente do peito. Desce entre as pernas, com os joelhos seguindo a direção dos pés.'),
 agachamento_corpo:X('Agachamento livre (peso do corpo)','agacha_livre','quadriceps',['quadriceps'],['gluteos'],'c',['corpo'],1,[],'Braços à frente para equilibrar. Senta para trás como numa cadeira e sobe empurrando o chão.',BW),
 agachamento_smith:X('Agachamento no Smith','agachamento','quadriceps',['quadriceps'],['gluteos','posteriores'],'c',['maquina'],1,['joelho'],'Pés um pouco à frente da barra. A guia dá segurança para focar na descida controlada.'),
 leg_press:X('Leg press 45°','leg_press','quadriceps',['quadriceps'],['gluteos','posteriores'],'c',['maquina'],1,[],'Pés na largura dos ombros. Desce até o joelho formar uns 90° sem tirar a lombar do encosto.'),
 hack:X('Agachamento hack','agachamento','quadriceps',['quadriceps'],['gluteos'],'c',['maquina'],2,['joelho'],'Costas apoiadas e pés no meio da plataforma. Desce fundo e sobe sem travar os joelhos.'),
 extensora:X('Cadeira extensora','extensora','quadriceps',['quadriceps'],[],'i',['maquina'],1,['joelho'],'Estica as pernas até quase travar e segura 1 segundo no alto. Desce devagar.'),
 afundo:X('Afundo com halteres','afundo','quadriceps',['quadriceps','gluteos'],['posteriores'],'c',['halter'],1,['joelho'],'Passo largo, tronco reto. Desce até o joelho de trás quase tocar o chão.',{lado:'cada perna'}),
 afundo_corpo:X('Afundo (peso do corpo)','afundo','quadriceps',['quadriceps','gluteos'],['posteriores'],'c',['corpo'],1,['joelho'],'Passo largo e tronco reto. Desce até o joelho de trás quase tocar o chão.',{lado:'cada perna',bw:true}),
 cadeirinha:X('Cadeirinha na parede (isometria)','cadeirinha','quadriceps',['quadriceps'],['gluteos'],'i',['corpo'],1,[],'Costas apoiadas na parede, joelhos dobrados até onde não doer. Segura parado. Isometria costuma ser bem tolerada pelo joelho.',{bw:true,seg:true}),
 bulgaro:X('Agachamento búlgaro','bulgaro','quadriceps',['quadriceps','gluteos'],['posteriores'],'c',['halter','banco'],2,['joelho'],'Pé de trás apoiado no banco. Desce na vertical com o peso na perna da frente.',{lado:'cada perna'}),

 /* Posterior de coxa */
 mesa_flexora:X('Mesa flexora','flexora','posteriores',['posteriores'],['panturrilha'],'i',['maquina'],1,[],'Quadril colado no banco. Puxa o rolo até perto do glúteo e desce devagar.'),
 cadeira_flexora:X('Cadeira flexora','flexora_sentada','posteriores',['posteriores'],[],'i',['maquina'],1,[],'Trava a coxa no apoio e puxa as pernas para baixo e para trás. Controla a volta.'),
 stiff:X('Stiff com barra','stiff','posteriores',['posteriores','gluteos'],['lombar'],'c',['barra'],2,['lombar'],'Joelhos levemente dobrados e coluna reta. Leva o quadril para trás e desce a barra rente às pernas.'),
 stiff_halter:X('Stiff com halteres','stiff','posteriores',['posteriores','gluteos'],['lombar'],'c',['halter'],1,[],'Coluna reta e quadril indo para trás. Desce até sentir alongar atrás da coxa.'),
 terra:X('Levantamento terra','terra','posteriores',['posteriores','gluteos','lombar'],['quadriceps','trapezio','antebraco','dorsal'],'c',['barra'],3,['lombar'],'Barra rente à canela, coluna neutra e peito aberto. Empurra o chão e estende quadril e joelhos juntos.'),
 stiff_unilateral:X('Stiff unilateral (peso do corpo)','stiff','posteriores',['posteriores','gluteos'],['lombar'],'c',['corpo'],2,[],'Em uma perna só, inclina o tronco à frente e leva a outra perna para trás. Trabalha o equilíbrio.',{lado:'cada perna',bw:true}),

 /* Glúteos */
 hip_thrust:X('Elevação pélvica com barra','hip_thrust','gluteos',['gluteos'],['posteriores'],'c',['barra','banco'],1,[],'Costas apoiadas no banco, barra no quadril. Sobe até o corpo ficar reto e aperta o glúteo 1 segundo.'),
 hip_halter:X('Elevação pélvica com halter','hip_thrust','gluteos',['gluteos'],['posteriores'],'c',['halter','banco'],1,[],'Halter apoiado no quadril. Sobe até o corpo ficar reto e aperta o glúteo no alto.'),
 ponte:X('Ponte de glúteo no chão','ponte','gluteos',['gluteos'],['posteriores'],'i',['corpo'],1,[],'Deitado, pés perto do glúteo. Sobe o quadril apertando o glúteo e desce sem encostar.',BW),
 abducao:X('Cadeira abdutora','abducao','gluteos',['gluteos'],[],'i',['maquina'],1,[],'Tronco levemente inclinado à frente pega mais glúteo. Abre e volta controlando.'),
 gluteo_4apoios:X('Coice de glúteo (4 apoios)','gluteo_4apoios','gluteos',['gluteos'],['posteriores'],'i',['corpo'],1,[],'Em 4 apoios, empurra o calcanhar para cima sem arquear a lombar.',{lado:'cada perna',bw:true}),
 gluteo_polia:X('Glúteo na polia','gluteo_4apoios','gluteos',['gluteos'],['posteriores'],'i',['polia'],1,[],'Tornozeleira na polia baixa. Leva a perna para trás sem girar o quadril.',{lado:'cada perna'}),
 sumo:X('Agachamento sumô com halter','sumo','gluteos',['gluteos','quadriceps'],['posteriores'],'c',['halter'],1,['joelho'],'Pés bem afastados e pontas para fora. Desce com o tronco reto segurando o halter entre as pernas.'),

 /* Panturrilha */
 panturrilha_pe:X('Panturrilha em pé na máquina','panturrilha','panturrilha',['panturrilha'],[],'i',['maquina'],1,[],'Desce o calcanhar até alongar bem e sobe na ponta dos pés. Segura 1 segundo no alto.'),
 panturrilha_halter:X('Panturrilha em pé com halter','panturrilha','panturrilha',['panturrilha'],[],'i',['halter'],1,[],'Ponta do pé num degrau, segurando o halter. Amplitude total e subida firme.'),
 panturrilha_corpo:X('Panturrilha no degrau','panturrilha','panturrilha',['panturrilha'],[],'i',['corpo'],1,[],'Ponta dos pés num degrau, apoiando a mão na parede. Desce devagar e sobe até o máximo.',BW),
 panturrilha_sentado:X('Panturrilha sentado','panturrilha_sentada','panturrilha',['panturrilha'],[],'i',['maquina'],1,[],'Joelhos dobrados trabalham a parte mais funda da panturrilha. Movimento lento.'),

 /* Abdômen */
 abdominal:X('Abdominal supra (crunch)','crunch','abdomen',['abdomen'],[],'i',['corpo'],1,[],'Sobe só até as escápulas saírem do chão, soltando o ar. Não puxa o pescoço.',BW),
 abdominal_maquina:X('Abdominal na máquina','crunch','abdomen',['abdomen'],[],'i',['maquina'],1,[],'Enrola o tronco para frente usando o abdômen, não os braços. Volta devagar.'),
 bicicleta:X('Abdominal bicicleta','crunch','abdomen',['abdomen'],[],'i',['corpo'],1,[],'Leva o cotovelo em direção ao joelho oposto, alternando sem pressa.',{bw:true,lado:'cada lado'}),
 prancha:X('Prancha','prancha','abdomen',['abdomen'],['lombar','deltAnt'],'i',['corpo'],1,[],'Cotovelos embaixo dos ombros, corpo reto do pescoço ao calcanhar. Aperta o abdômen e o glúteo.',{bw:true,seg:true}),
 prancha_lateral:X('Prancha lateral','prancha','abdomen',['abdomen'],['gluteos'],'i',['corpo'],1,[],'Apoiado em um antebraço, quadril alto e corpo reto.',{bw:true,seg:true,lado:'cada lado'}),
 elev_pernas:X('Elevação de pernas deitado','elev_pernas','abdomen',['abdomen'],[],'i',['corpo'],1,['lombar'],'Lombar colada no chão. Sobe as pernas juntas e desce devagar sem encostar.',BW),
 elev_pernas_barra:X('Elevação de joelhos na barra','elev_pernas_barra','abdomen',['abdomen'],['antebraco'],'i',['barrafixa'],2,[],'Pendurado na barra, sobe os joelhos até a altura do quadril sem balançar.',BW)
};
const EX_IDS=Object.keys(EXS);

/* alternativas: mesmo grupo e mesmos músculos principais, ordenadas por semelhança */
function alternativas(id,filtro){
  const e=EXS[id];
  return EX_IDS.filter(x=>x!==id&&EXS[x].g===e.g&&(!filtro||filtro(EXS[x],x))).map(x=>{const a=EXS[x];
    let s=a.p.filter(m=>e.p.includes(m)).length*3+(a.t===e.t?2:0)+(a.pose===e.pose?1:0);return{x,s};})
    .sort((a,b)=>b.s-a.s||EXS[a.x].n.localeCompare(EXS[b.x].n)).map(o=>o.x);
}
