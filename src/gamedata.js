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
  },
  Elfo: {
    "Lâmina do Vento":["LdF","LdF","Inf",null,17,17,25,1,7,7,42,220,0,200,4],
    "Sentinela":["LdF","LdF","Art",null,14,18,27,2,3,5,40,250,0,150,4],
    "Elfo do Arco Longo":["Art","Ala","Cav","LdF",19,8,30,2,7,6,70,100,400,200,4],
    "Seta Élfica":["Art","Art","LdF",null,12,15,10,1,5,7,55,300,0,250,4],
    "Cavalaria Arqueira":["Cav","Cav","LdF","Ala",21,20,30,2,8,12,60,100,200,300,4],
    "Espadachim":["Inf","Cav","Art","Inf",22,24,30,3,13,19,110,730,0,370,8],
    "Mago":["Con","Pro","Inf","Ala",5,10,7,1,3,10,45,400,0,200,8],
    "Druida":["Con","MdG","Pro","Cav",3,11,12,1,4,11,52,200,300,200,8],
    "Tempesta":["Con","LdF","Cav","Art",10,7,10,1,4,10,120,650,330,230,8],
    "Grifo":["Ala","Con","Mis","LdF",33,16,40,3,9,16,160,700,0,900,8],
    "Arqueiro de Elite":["Pro","Con","Pro","He",30,28,52,5,19,27,300,600,1800,600,12],
    "Alto Elfo":["Pro","Pro","Inf","Mis",28,36,39,4,25,32,330,1500,0,1800,12],
    "Manipulador da Teia":["Mis","Pro","Ala",null,9,17,11,1,3,18,107,950,150,330,12],
    "Mensageiro da Natureza":["Mis","Inf","MdG",null,8,24,15,1,6,20,188,800,850,850,12],
    "Djinn":["Mis","Inf","Pro","Mis",10,20,40,1,3,21,280,1200,800,800,12],
    "Golem de Cristal":["MdG","MdG","Pro","He",60,60,50,2,44,79,400,4000,0,0,12]
  },
  Anão: {
    "Tropa de Choque":["LdF","LdF","Inf",null,24,40,23,1,7,15,72,370,0,350,4],
    "Homem de Armas":["LdF","Cav","LdF","Con",23,34,29,1,11,13,60,200,100,300,4],
    "Bravo":["LdF","Art","LdF",null,19,25,25,1,6,12,47,220,0,250,4],
    "Besteiro":["Art","Ala","Cav",null,21,25,23,2,7,9,72,250,270,200,4],
    "Escavador":["Cav","LdF","Cav","Inf",28,40,25,1,13,23,80,300,100,400,4],
    "Defensor Anão":["Inf","Inf","LdF",null,35,47,36,1,23,54,150,1200,100,200,8],
    "Martelo de Inerill":["Inf","Pro","Inf","Cav",36,43,40,1,28,50,160,900,350,350,8],
    "Clérigo":["Con","Inf","LdF","Con",7,25,30,1,18,24,95,700,300,250,8],
    "Cria de Inerill":["Ala","Ala",null,null,36,35,48,1,25,30,90,100,0,800,8],
    "Suporte Aéreo":["Ala","Con","Mis",null,34,20,27,3,7,24,95,150,650,150,8],
    "Guardião":["Pro","Pro","He",null,49,60,40,2,31,68,300,2500,100,400,12],
    "Impiedoso":["Pro","Pro","MdG","Art",50,52,47,4,26,60,320,2300,200,700,12],
    "Avatar":["Mis","Pro","He","Inf",9,40,30,2,12,35,170,1200,300,800,12],
    "Aríete":["MdG","MdG","Pro","Inf",68,50,60,1,115,73,500,1800,1800,1400,12],
    "Balisteira":["MdG","LdF","Cav","Mis",34,40,50,6,18,44,280,400,2000,400,12]
  },
  Norfss: {
    "Gecko":["LdF","Art","LdF",null,15,15,25,2,3,7,44,50,150,240,4],
    "Molok":["LdF","LdF","Inf","Ala",17,16,35,2,6,8,70,250,150,300,4],
    "Naga":["Art","Ala","Cav","LdF",17,12,38,1,12,7,75,50,500,200,4],
    "Vyper":["Art","Art","Con","Mis",13,12,27,2,5,5,75,0,0,750,4],
    "Kraktor":["Cav","Cav","LdF","Inf",19,24,37,2,6,12,70,0,200,500,4],
    "Píton":["Inf","LdF","Art",null,22,25,35,4,12,22,110,200,350,550,8],
    "Arnole":["Inf","Inf","Pro",null,24,30,36,2,20,25,144,360,540,540,8],
    "Khelus":["Con","LdF","Cav","Art",4,14,12,1,5,13,35,0,400,300,8],
    "Wyrven":["Ala","Ala","Pro","Inf",28,15,40,2,16,17,120,0,0,1200,8],
    "CroK":["Pro","Pro","He","MdG",36,40,40,4,29,35,290,1000,0,1900,12],
    "Kamal":["Pro","Mis","Con","Inf",29,30,30,6,22,30,260,400,1500,700,12],
    "Scynak":["Mis","He","Pro","Cav",2,18,10,1,3,22,135,800,500,500,12],
    "Anaconda":["MdG","MdG","Inf","LdF",55,45,50,4,21,45,350,0,1100,2400,12]
  }
};

export const MERC = ["LdF","Trab",null,null,90,5,3,0,0,8,70,200,250,250,4];

export const DESCR = {
  Humano:"A raça mais versátil do mundo, que chegou às terras de Primórdio atravessando os mares.",
  Ferlix:"Outrora animais de guerra usados pelos elfos, foram libertos e evoluíram.",
  Urgrosh:"Quatro raças moribundas, agora unidas. Disciplina rígida e brutalidade no combate.",
  Elfo:"Mestres da magia e do arco, ágeis e antigos, ligados às florestas de Primórdio.",
  Anão:"Guerreiros resistentes das montanhas, devotos de Inerill e exímios construtores de máquinas.",
  Norfss:"Criaturas reptilianas dos pântanos, traiçoeiras e velozes, mestres do veneno."
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

// ============================================================
// ESPIONAGEM
// Espiões e contra-espiões são unidades permanentes do clã (ficam parados, como tropa).
// São produzidos pela fila normal de tropas, mas só após a pesquisa correspondente.
// ============================================================
export const ESPIOES = {
  "Espião":      { pesq:"esp1", custo:{ouro:120, madeira:0,   alimento:80},  ticks:4 },
  "Contra-Espião":{ pesq:"ctr1", custo:{ouro:120, madeira:80,  alimento:0},  ticks:4 }
};

export const ESPIONAGEM = {
  // bônus racial somado à força de espionagem (só Norfss; demais = 0)
  BONUS_RACA: { Norfss: 100 },
  PESO_CONTRA: 2,        // cada contra-espião do alvo vale 2 na defesa
  FATOR_ESP_ALVO: 0.75,  // espiões do próprio alvo também defendem, atenuados
  TETO: 95,              // % máxima de sucesso (nunca 100% — preserva a graça)
  PERDA_FALHA: 0.10,     // perde 10% dos espiões enviados se falhar
  // tipos de relatório e seus custos de recurso por tentativa
  TIPOS: {
    recursos: { nome:"Recursos", custo:{ouro:200, madeira:0, alimento:200} },
    tropas:   { nome:"Tropas",   custo:{ouro:400, madeira:0, alimento:300} }
  }
};

// Chance de sucesso (0..TETO). Reproduz a simulação do jogo original:
//   força  = espiões enviados + bônus racial
//   defesa = contra-espiões do alvo * PESO_CONTRA + espiões do alvo * FATOR_ESP_ALVO
//   chance = força / (força + defesa) escalado, limitado ao TETO
export function chanceEspionagem(espioesEnviados, bonusRaca, contraAlvo, espioesAlvo) {
  const forca = espioesEnviados + (bonusRaca || 0);
  const defesa = contraAlvo * ESPIONAGEM.PESO_CONTRA + espioesAlvo * ESPIONAGEM.FATOR_ESP_ALVO;
  if (forca <= 0) return 0;
  const bruta = forca / (forca + defesa) * 100;
  return Math.max(0, Math.min(ESPIONAGEM.TETO, Math.round(bruta * 10) / 10));
}

// Força relativa (estilo planilha): quantas vezes a espionagem supera a defesa.
// Pode passar de 100% (ex: 167% = você tem 1,67x a força da defesa).
export function forcaEspionagem(espioesEnviados, bonusRaca, contraAlvo, espioesAlvo) {
  const forca = espioesEnviados + (bonusRaca || 0);
  const defesa = contraAlvo * ESPIONAGEM.PESO_CONTRA + espioesAlvo * ESPIONAGEM.FATOR_ESP_ALVO;
  if (defesa <= 0) return 999; // alvo sem nenhuma defesa
  return Math.round(forca / defesa * 1000) / 10;
}

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
