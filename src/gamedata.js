// ============================================================
// gamedata.js — fonte única de verdade dos dados do jogo
// [classe, A1, A2, A3, Ini, Def, Atq, QAtq, Dano, Vida, Xp, Ouro, Madeira, Alimento, Turno]
// ============================================================
export const RACAS = {
  Humano: {
    "Lanceiro":["LdF","Cav","LdF","Inf",17,17,40,1,12,9,50,50,400,50,4],
    "Guerreiro":["LdF","LdF","Art","Mis",20,30,30,1,8,13,70,400,150,150,4],
    "Milícia":["LdF","Art","LdF","Cav",17,20,15,1,5,6,30,70,150,80,4],
    "Humano Arqueiro":["Art","LdF","Cav","Ala",15,15,30,2,4,5,62,50,420,150,4],
    "Caçador":["Art","Ala","Cav","MdG",17,14,34,1,12,8,62,125,400,100,4],
    "Cavaleiro":["Cav","LdF","Cav","Art",24,28,32,1,10,17,65,400,50,200,4],
    "Capitão":["Cav","Cav","Con","Inf",25,30,35,2,9,22,85,300,150,400,4],
    "Cruzado":["Inf","Inf","Pro","He",26,40,42,2,22,28,144,960,0,480,8],
    "Falange":["Inf","Inf","Con","LdF",25,42,32,2,16,24,132,600,360,360,8],
    "Feiticeira":["Con","Pro","Inf","Art",1,15,10,1,2,12,49,450,0,200,8],
    "Sacerdote":["Con","LdF","Art","Inf",2,13,8,1,1,16,25,300,100,100,8],
    "Zepelim":["Ala","Ala","MdG","Mis",35,18,39,2,23,19,130,400,300,600,8],
    "Templário":["Pro","Pro","Inf","He",40,56,50,4,34,45,360,2000,0,1600,12],
    "Escolhido":["Pro","LdF","Cav","Inf",34,44,40,7,18,35,260,1200,600,800,12],
    "Alteradora":["Mis","Pro","Inf","Ala",2,18,16,1,5,20,135,1200,0,600,12],
    "Bispo":["Mis","Pro","Inf","LdF",2,20,10,1,4,21,95,900,160,200,12],
    "Barco Animado":["MdG","Mis","MdG","Art",56,45,45,5,19,90,360,1100,1500,1000,12]
  },
  Ferlix: {
    "Pardus":["LdF","Art","Con",null,13,15,25,2,3,5,35,0,0,350,4],
    "Uncia":["LdF","LdF","Inf",null,15,14,28,2,6,8,70,0,0,700,4],
    "Suçuarana":["LdF","Inf","LdF",null,16,10,23,5,4,6,65,0,200,450,4],
    "Lynx":["Art","Cav","Ala","Mis",15,12,40,1,14,5,70,0,400,300,4],
    "Jubatus":["Cav","Cav","Inf",null,20,25,25,1,8,10,45,50,0,400,4],
    "Puma":["Inf","LdF","Pro","Art",22,24,30,3,22,18,105,0,0,1050,8],
    "Tigon":["Inf","Inf","Cav","Mis",25,25,32,2,26,22,114,360,180,600,8],
    "Líder Espiritual":["Con","Pro","Inf","LdF",3,12,15,1,6,10,52,500,0,200,8],
    "Roca":["Ala","MdG","Inf",null,30,20,35,1,40,25,110,250,350,500,8],
    "Léo":["Pro","Pro","He","MdG",31,35,58,2,44,35,300,1500,0,1500,12],
    "Tigre":["Pro","Inf","Pro","Mis",27,27,42,4,30,29,250,1000,300,1200,12],
    "Pantor":["Pro","Con","Mis","LdF",27,20,40,8,13,24,250,900,1200,400,12],
    "Rakshaka":["Mis","Ala","Inf",null,10,10,35,1,3,18,180,850,0,950,12],
    "Golem de Ferro":["MdG","MdG","He","Pro",55,47,45,2,36,65,290,2900,0,0,12]
  },
  Urgrosh: {
    "Orc":["LdF","LdF","Inf","Cav",21,25,25,1,14,10,70,300,100,300,4],
    "Goblin":["LdF","Art","Con","Mis",17,10,15,3,4,4,35,200,0,150,4],
    "Ogro":["LdF","Cav","LdF","Inf",21,22,25,1,17,16,70,150,250,300,4],
    "Troll Lançador":["Art","Ala","LdF","Cav",20,16,26,1,12,8,70,150,200,350,4],
    "Lobo Gigante":["Cav","Ala","Art","Mis",23,22,27,2,8,18,66,240,120,300,4],
    "Campeão":["Inf","Inf","Pro",null,27,35,40,2,21,35,120,600,100,500,8],
    "Devastador":["Inf","MdG","Cav",null,34,30,40,1,46,44,150,600,300,600,8],
    "Matador de Magos":["Inf","Con","Mis",null,24,30,32,4,12,28,120,850,0,350,8],
    "Xamã":["Con","Pro","Inf","Cav",2,12,14,1,5,15,60,400,200,200,8],
    "Asa-Delta":["Ala","LdF","Art","Inf",30,12,25,6,7,14,95,300,450,200,8],
    "Bárbaro":["Pro","Pro","He","MdG",45,40,45,3,50,68,310,800,500,1800,12],
    "Colecionador de Cabeças":["Pro","Pro","Ala","Mis",37,30,50,4,31,40,320,400,1700,1100,12],
    "Bruxo":["Mis","Pro","Inf","He",3,23,16,1,6,25,125,500,1400,600,12],
    "Catapulta":["MdG","Inf","Pro","LdF",68,40,40,1,34,55,480,1400,2000,1400,12]
  }
};

export const MERC = ["LdF","Trab",null,null,90,5,3,0,0,8,70,200,250,250,4];

export const DESCR = {
  Humano:"A raça mais versátil do mundo, que chegou às terras de Primórdio atravessando os mares.",
  Ferlix:"Outrora animais de guerra usados pelos elfos, foram libertos e evoluíram.",
  Urgrosh:"Quatro raças moribundas, agora unidas. Disciplina rígida e brutalidade no combate."
};

export const PESQ = {
  ldf:{nome:"Linha de Frente — N1",classe:"LdF",ouro:600,madeira:300,alimento:300,ticks:8,req:null,cadeia:1},
  inf:{nome:"Infantaria — N2",classe:"Inf",ouro:2500,madeira:1200,alimento:1200,ticks:24,req:"ldf",cadeia:1},
  pro:{nome:"Prodígios — N3",classe:"Pro",ouro:6000,madeira:3000,alimento:3000,ticks:48,req:"inf",cadeia:1},
  art:{nome:"Artilharia — N1",classe:"Art",ouro:600,madeira:300,alimento:300,ticks:8,req:null,cadeia:2},
  con:{nome:"Conjuradores — N2",classe:"Con",ouro:2500,madeira:1200,alimento:1200,ticks:24,req:"art",cadeia:2},
  mis:{nome:"Místicos — N3",classe:"Mis",ouro:6000,madeira:3000,alimento:3000,ticks:48,req:"con",cadeia:2},
  cav:{nome:"Cavalaria — N1",classe:"Cav",ouro:600,madeira:300,alimento:300,ticks:8,req:null,cadeia:3},
  ala:{nome:"Alados — N2",classe:"Ala",ouro:2500,madeira:1200,alimento:1200,ticks:24,req:"cav",cadeia:3},
  mdg:{nome:"Máquinas de Guerra — N3",classe:"MdG",ouro:6000,madeira:3000,alimento:3000,ticks:48,req:"ala",cadeia:3},
  esp1:{nome:"Espionagem I",classe:null,ouro:1500,madeira:500,alimento:500,ticks:16,req:null,cadeia:"e"},
  esp2:{nome:"Espionagem II",classe:null,ouro:4000,madeira:1500,alimento:1500,ticks:32,req:"esp1",cadeia:"e"},
  ctr1:{nome:"Contraespionagem I",classe:null,ouro:1500,madeira:500,alimento:500,ticks:16,req:null,cadeia:"e"},
  ctr2:{nome:"Contraespionagem II",classe:null,ouro:4000,madeira:1500,alimento:1500,ticks:32,req:"ctr1",cadeia:"e"}
};

export const NIVEIS = [[1,0],[2,500],[3,1500],[4,3500],[5,7000],[6,13000],[7,22000],[8,36000],[9,56000],[10,85000]];

// Constantes de balanceamento (ajustáveis sem tocar na lógica)
export const CONST = {
  TAXA_PRODUCAO: 60,      // recurso por trabalhador por tick
  PROTECAO_TICKS: 96,     // proteção de iniciante
  VIAGEM: 8,              // ticks de ida (= ticks de volta)
  TROPAS_INICIAIS: 6,     // trabalhadores no início
  RECURSOS_INICIAIS: { ouro: 1500, madeira: 1500, alimento: 1500 },
  PISO_TRAB_PROTEGIDO: 40,
  TETO_ROUBO_TICK: 25,
  TAXA_ROUBO_MERC: 0.2,   // 2 a cada 10 mercenários
  TERRITORIOS: 10,        // mundo do beta
  SLOTS_POR_TERRITORIO: 10,
  PESQUISA_INICIAL: "ldf" // já vem concluída
};

export const U = a => ({
  classe:a[0], a1:a[1], a2:a[2], a3:a[3], ini:a[4], def:a[5], atq:a[6], qatq:a[7],
  dano:a[8], vida:a[9], xp:a[10], ouro:a[11], madeira:a[12], alimento:a[13], turno:a[14]
});

export function statsUnidade(raca, nome) {
  if (nome === "Mercenário") return U(MERC);
  return U(RACAS[raca][nome]);
}

export function classeDaUnidade(raca, nome) {
  return statsUnidade(raca, nome).classe;
}

export function nivelPorXP(xp) {
  let n = 1;
  for (const [lv, req] of NIVEIS) if (xp >= req) n = lv;
  return n;
}

// pesquisa que libera cada classe
export function pesquisaDaClasse(classe) {
  for (const [id, p] of Object.entries(PESQ)) if (p.classe === classe) return id;
  return null; // classes sem pesquisa (Con/Mis/Pro etc. cobertas; He não tem unidade recrutável direta)
}
