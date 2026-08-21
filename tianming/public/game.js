// ============================================================
// 天命·国策 — 游戏引擎（完善版 Part 1：数据与推演引擎）
// ============================================================

let G = null;
let currentUser = null; // 由 app.js 注入

// ============================
// 1. 基础数据定义
// ============================
const PROVINCES_DATA = [
  {id:'zhili',name:'北直隶',type:'京畿',pop:120,farm:3,market:2,garrison:50000,special:'京师所在',border:false,coast:true,desc:'天子脚下，畿辅重地'},
  {id:'nanzhili',name:'南直隶',type:'京畿',pop:150,farm:4,market:4,garrison:30000,special:'财赋重地',border:false,coast:true,desc:'江南财赋，半出此地'},
  {id:'shandong',name:'山东',type:'腹里',pop:90,farm:3,market:2,garrison:20000,special:'孔孟故里',border:false,coast:true,desc:'齐鲁大地，礼仪之邦'},
  {id:'shanxi',name:'山西',type:'腹里',pop:70,farm:2,market:2,garrison:25000,special:'表里山河',border:true,coast:false,desc:'晋商故里，边防重镇'},
  {id:'henan',name:'河南',type:'腹里',pop:100,farm:4,market:2,garrison:15000,special:'中原腹地',border:false,coast:false,desc:'天下之中，粮仓所在'},
  {id:'shaanxi',name:'陕西',type:'边镇',pop:50,farm:2,market:1,garrison:35000,special:'秦川沃野',border:true,coast:false,desc:'三秦故地，九边重镇'},
  {id:'sichuan',name:'四川',type:'腹里',pop:80,farm:3,market:2,garrison:20000,special:'天府之国',border:false,coast:false,desc:'天府之国，蜀道天险'},
  {id:'huguang',name:'湖广',type:'腹里',pop:110,farm:4,market:2,garrison:15000,special:'湖广熟天下足',border:false,coast:false,desc:'两湖粮仓'},
  {id:'zhejiang',name:'浙江',type:'腹里',pop:95,farm:3,market:4,garrison:15000,special:'丝茶瓷海',border:false,coast:true,desc:'东南形胜，海贸枢纽'},
  {id:'jiangxi',name:'江西',type:'腹里',pop:85,farm:3,market:2,garrison:12000,special:'文章节义',border:false,coast:false,desc:'物华天宝，人杰地灵'},
  {id:'fujian',name:'福建',type:'沿海',pop:55,farm:2,market:3,garrison:10000,special:'海上丝路',border:false,coast:true,desc:'闽海雄风，商贾云集'},
  {id:'guangdong',name:'广东',type:'沿海',pop:70,farm:2,market:3,garrison:15000,special:'岭南都会',border:false,coast:true,desc:'南粤之地，市舶要冲'},
  {id:'guangxi',name:'广西',type:'边疆',pop:40,farm:1,market:1,garrison:20000,special:'桂管边疆',border:true,coast:true,desc:'桂岭瘴烟，土司交错'},
  {id:'yunnan',name:'云南',type:'边疆',pop:45,farm:1,market:1,garrison:25000,special:'彩云之南',border:true,coast:false,desc:'滇池洱海，土司林立'},
  {id:'guizhou',name:'贵州',type:'边疆',pop:25,farm:1,market:1,garrison:15000,special:'黔中苗疆',border:true,coast:false,desc:'地无三里平，苗疆要地'},
  {id:'liaodong',name:'辽东',type:'九边',pop:35,farm:1,market:1,garrison:40000,special:'辽东边镇',border:true,coast:true,desc:'东北门户，胡骑出没'},
  {id:'gansu',name:'甘肃',type:'九边',pop:25,farm:1,market:1,garrison:35000,special:'河西走廊',border:true,coast:false,desc:'西北锁钥，丝路要道'},
  {id:'ningxia',name:'宁夏',type:'九边',pop:20,farm:1,market:1,garrison:30000,special:'塞上江南',border:true,coast:false,desc:'河套之地，屯田重镇'}
];

const OFFICE_POSITIONS = [
  {id:'grand_secretary',name:'首辅',dept:'内阁',effect:'所有修正额外+5%'},
  {id:'minister_li',name:'吏部尚书',dept:'吏部',effect:'官员能力+10%，科举录取率+5%'},
  {id:'minister_hu',name:'户部尚书',dept:'户部',effect:'税收效率+15%，赈灾成本-20%'},
  {id:'minister_bing',name:'兵部尚书',dept:'兵部',effect:'募兵成本-10%，边军士气+5'},
  {id:'minister_libu',name:'礼部尚书',dept:'礼部',effect:'天命恢复+2/年，学派转换成本-10%'},
  {id:'minister_xing',name:'刑部尚书',dept:'刑部',effect:'弹劾成功率+15%，稳定度衰减-10%'},
  {id:'minister_gong',name:'工部尚书',dept:'工部',effect:'建筑成本-15%，漕运效率+10%'},
  {id:'censor_left',name:'左都御史',dept:'都察院',effect:'弹劾案件发现率+20%'}
];

const SCHOOLS_DATA = [
  {id:'rujia',name:'儒家',desc:'仁政礼治',effect:'稳定+10%，税收-5%，天命恢复+2',stability:0.10,tax:-0.05,tianming:2,food:0,admin:0,recruit:0,build:0,disasterReduce:0,diplomacy:0,popGrowth:0},
  {id:'fajia',name:'法家',desc:'以法治国',effect:'行政+15%，弹劾成功率+10%，稳定-5%',stability:-0.05,tax:0,tianming:0,food:0,admin:0.15,recruit:0,build:0,disasterReduce:0,diplomacy:0,popGrowth:0},
  {id:'bingjia',name:'兵家',desc:'富国强兵',effect:'募兵成本-15%，军队士气+10，文官效率-5%',stability:0,tax:0,tianming:0,food:0,admin:-0.05,recruit:-0.15,build:0,disasterReduce:0,diplomacy:0,popGrowth:0},
  {id:'nongjia',name:'农家',desc:'以农为本',effect:'粮产+20%，商业-10%',stability:0,tax:0,tianming:0,food:0.20,admin:0,recruit:0,build:0,disasterReduce:0,diplomacy:0,popGrowth:0},
  {id:'daojia',name:'道家',desc:'无为而治',effect:'天灾概率-30%',stability:0.03,tax:0,tianming:1,food:0,admin:0,recruit:0,build:0,disasterReduce:0.30,diplomacy:0,popGrowth:0},
  {id:'mojia',name:'墨家',desc:'兼爱非攻',effect:'建筑成本-20%，军械产量+15%',stability:0,tax:0,tianming:0,food:0,admin:0,recruit:0,build:-0.20,disasterReduce:0,diplomacy:0,popGrowth:0},
  {id:'zonghengjia',name:'纵横家',desc:'纵横捭阖',effect:'外交行动成功率+15%',stability:0,tax:0,tianming:0,food:0,admin:0,recruit:0,build:0,disasterReduce:0,diplomacy:0.15,popGrowth:0},
  {id:'yinyangjia',name:'阴阳家',desc:'阴阳五行',effect:'事件预警（提前知悉天灾），天命+3',stability:0,tax:0,tianming:3,food:0,admin:0,recruit:0,build:0,disasterReduce:0,diplomacy:0,popGrowth:0},
  {id:'yijia',name:'医家',desc:'悬壶济世',effect:'瘟疫死亡率-50%，人口增长率+0.5%',stability:0,tax:0,tianming:0,food:0,admin:0,recruit:0,build:0,disasterReduce:0,diplomacy:0,popGrowth:0.005}
];

const NATIONS_DATA = [
  {id:'bei_yuan',name:'北元',type:'游牧',relation:-40,trade:0,tribute:false,army:80000,desc:'草原帝国余晖'},
  {id:'wala',name:'瓦剌',type:'游牧',relation:-30,trade:0,tribute:false,army:60000,desc:'西部蒙古强部'},
  {id:'dada',name:'鞑靼',type:'游牧',relation:-35,trade:0,tribute:false,army:70000,desc:'东部蒙古主力'},
  {id:'chaoxian',name:'朝鲜',type:'藩属',relation:60,trade:1,tribute:true,army:30000,desc:'东方礼仪之邦'},
  {id:'annan',name:'安南',type:'藩属',relation:40,trade:1,tribute:true,army:25000,desc:'交趾故地'},
  {id:'liuqiu',name:'琉球',type:'藩属',relation:70,trade:1,tribute:true,army:5000,desc:'东海之中的藩属'},
  {id:'riben',name:'日本',type:'外邦',relation:-20,trade:0,tribute:false,army:50000,desc:'倭国，时有倭寇'},
  {id:'putaoya',name:'葡萄牙',type:'外邦',relation:10,trade:1,tribute:false,army:15000,desc:'佛郎机人，远来通商'},
  {id:'xibanya',name:'西班牙',type:'外邦',relation:0,trade:0,tribute:false,army:20000,desc:'占据吕宋，图谋东方'},
  {id:'helan',name:'荷兰',type:'外邦',relation:5,trade:1,tribute:false,army:12000,desc:'海上马车夫'}
];

const SECTORS = ['民生','军工','基建','资源','金融','贸易'];
const COMPANY_NAMES = {
  '民生':['江南织造','景德官窑','两淮盐运','苏州织造','杭州丝绸','山东盐运'],
  '军工':['广东铁冶','遵化铁厂','龙江船厂','神机火器','太仓军械','直隶铁冶'],
  '基建':['漕运总司','河工总局','驿传系统','海运总司','北京营造','中都守备'],
  '资源':['川盐井务','江西铜矿','云南银矿','福建茶庄','湖广米市','西南木商'],
  '金融':['山西票号','徽商银号','龙游钱庄','洞庭典当','京师宝钞'],
  '贸易':['福建海商','广东洋行','宁波商帮','泉州船队','辽东马市','甘肃茶马','郑和船行','松江棉布']
};

const WONDERS_DATA = [
  {id:'forbidden_city',name:'紫禁城',cost:500000,desc:'帝王居所，威加四海',effect:'行政效率+20%，天命每年+2',stages:['奠基','营建大殿','宫城落成','全城竣工']},
  {id:'grand_canal',name:'大运河',cost:400000,desc:'南北通衢，漕运命脉',effect:'漕运收入+50%，商业效率+15%',stages:['疏浚河道','修建闸坝','全线贯通','配套完善']},
  {id:'great_wall',name:'万里长城',cost:600000,desc:'北御胡骑，固若金汤',effect:'九边防御+30%，边军维护费-20%',stages:['修筑烽燧','加固关隘','城墙连亘','体系完备']}
];

const OFFICIAL_NAMES = ['张居正','徐阶','高拱','王阳明','杨廷和','夏言','严嵩','海瑞','戚继光','俞大猷',
  '胡宗宪','谭纶','于谦','李贤','商辂','杨士奇','杨荣','金幼孜','解缙','方孝孺',
  '黄淮','陈循','徐有贞','李东阳','杨一清','费宏','蒋冕','毛纪','张璁','翟銮',
  '李时','沈炼','杨涟','左光斗','魏大中','周顺昌','黄尊素','顾大章','李三才','邹元标',
  '赵南星','孙慎行','高攀龙','刘宗周','黄道周','倪元璐','史可法','瞿式耜','张煌言','卢象升',
  '孙传庭','洪承畴','袁崇焕','孙承宗','熊廷弼','王在晋','李如松','麻贵','刘綎','邓子龙'];

// 事件池：weight 接收游戏状态 G，返回权重（修复版：不再错误调用 p.schoolEffect）
const EVENTS_POOL = [
  {id:'locust',name:'蝗灾',type:'天灾',desc:'农田等级高的省份易发',
    weight:g=>{let w=0;g.provinces.forEach(p=>{if(p.farm>=3)w+=1.5});if(g.activeSchool==='nongjia')w*=0.5;return w},
    effect:g=>{
      let targets=g.provinces.filter(p=>p.farm>=3);
      if(!targets.length)targets=g.provinces;
      let p=targets[Math.floor(Math.random()*targets.length)];
      p.farm=Math.max(0,p.farm-1);p.foodShock=0.5;
      g.addLog(`蝗灾！${p.name}粮产减半`,'bad');g.addNotif(`⚠️ ${p.name}发生蝗灾`,'bad');
    }},
  {id:'yellow_river',name:'黄河决口',type:'天灾',desc:'水利质量低于50时概率大增',
    weight:g=>g.waterQuality<50?5:(g.waterQuality<70?1.5:0.3),
    effect:g=>{
      g.waterQuality=Math.max(0,g.waterQuality-20);
      ['henan','shandong','nanzhili'].forEach(id=>{
        let p=g.getProvince(id);
        if(p){p.farm=Math.max(0,p.farm-1);p.pop=Math.floor(p.pop*0.97);p.foodShock=0.6;}
      });
      g.plagueRisk=true;
      g.addLog('黄河决口！豫鲁直隶沿岸受灾','bad');g.addNotif('🌊 黄河决口，沿岸受灾！','bad');
    }},
  {id:'plague',name:'瘟疫',type:'天灾',desc:'黄河决口次年易爆发',
    weight:g=>(g.plagueRisk?8:1)*(g.activeSchool==='daojia'?0.7:1),
    effect:g=>{
      let rate=g.activeSchool==='yijia'?0.015:0.03;
      let loss=0;
      g.provinces.forEach(p=>{let l=Math.floor(p.pop*rate);p.pop-=l;loss+=l;});
      g.stability=Math.max(0,g.stability-5);g.plagueRisk=false;
      g.addLog(`瘟疫蔓延，约${(loss/10000).toFixed(1)}万人病亡`,'bad');g.addNotif('☠️ 瘟疫爆发！','bad');
    }},
  {id:'prince_revolt',name:'藩王不臣',type:'内政',desc:'稳定低且地方无官时易发',
    weight:g=>(g.stability<50&&g.provinces.some(p=>!p.officialId))?3:0,
    effect:g=>{
      let t=g.provinces.filter(p=>!p.officialId);
      if(t.length){let p=t[Math.floor(Math.random()*t.length)];p.loyalty=Math.max(0,p.loyalty-20);g.princeRebellion=true;
        g.addLog(`${p.name}藩王心生怨望，暗中蓄养死士`,'bad');g.addNotif(`👑 ${p.name}藩王有异动！`,'bad');}
    }},
  {id:'exam_scandal',name:'科举舞弊',type:'内政',desc:'法家当政时更易被查出',
    weight:g=>g.activeSchool==='fajia'?3:1,
    effect:g=>{g.stability=Math.max(0,g.stability-3);g.tianming=Math.max(0,g.tianming-1);
      g.addLog('科举舞弊案发，朝野震动，主考官下狱','bad');g.addNotif('📜 科举舞弊案发！','bad');}},
  {id:'good_harvest',name:'丰年',type:'吉兆',desc:'风调雨顺，五谷丰登',
    weight:g=>g.activeSchool==='nongjia'?3:1.5,
    effect:g=>{g.provinces.forEach(p=>{p.foodBonus=1.3;});
      g.addLog('天下丰年，五谷丰登，粮产+30%','good');g.addNotif('🌾 丰年！粮产大增','good');}},
  {id:'trade_boom',name:'市舶兴盛',type:'吉兆',desc:'海贸繁荣',
    weight:g=>g.provinces.some(p=>p.coast&&p.market>=3)?2:0.5,
    effect:g=>{let amt=3000+Math.floor(Math.random()*4000);g.treasury+=amt;
      g.addLog(`海外贸易兴盛，市舶司增收${amt}两`,'good');g.addNotif('🚢 市舶兴盛！','good');}},
  {id:'rebel',name:'民变',type:'动乱',desc:'稳定度过低时爆发',
    weight:g=>g.stability<35?4:0,
    effect:g=>{
      let t=g.provinces.filter(p=>p.loyalty<45);if(!t.length)t=g.provinces;
      let p=t[Math.floor(Math.random()*t.length)];
      p.loyalty=Math.max(0,p.loyalty-25);p.devastation=Math.min(100,(p.devastation||0)+20);
      g.activeRebels++;g.stability=Math.max(0,g.stability-5);
      g.addLog(`${p.name}民变！百姓揭竿而起`,'bad');g.addNotif(`🔥 ${p.name}民变！`,'bad');
    }},
  {id:'comet',name:'彗星现世',type:'天象',desc:'天人感应，天命有损',
    weight:g=>1,
    effect:g=>{g.tianming=Math.max(0,g.tianming-3);
      g.addLog('彗星现世，群臣上书修省','bad');g.addNotif('☄️ 彗星现世！','bad');}},
  {id:'tribute_arrive',name:'朝贡来朝',type:'外交',desc:'藩属国遣使进贡',
    weight:g=>g.nations.filter(n=>n.tribute&&n.relation>50).length>0?3:0,
    effect:g=>{
      let v=g.nations.filter(n=>n.tribute&&n.relation>50);
      if(v.length){let n=v[Math.floor(Math.random()*v.length)];let amt=2000+Math.floor(Math.random()*3000);
        g.treasury+=amt;g.addLog(`${n.name}遣使朝贡，贡银${amt}两`,'good');g.addNotif(`🎁 ${n.name}朝贡`,'good');}
    }},
  {id:'corruption_exposed',name:'贪腐案发',type:'内政',desc:'官员腐败过高被揭发',
    weight:g=>g.officials.some(o=>!o.empty&&o.corruption>65)?3:0.5,
    effect:g=>{
      let corrupt=g.officials.filter(o=>!o.empty&&o.corruption>65);
      if(corrupt.length){let o=corrupt[Math.floor(Math.random()*corrupt.length)];
        g.impeachCases.push({id:Date.now()+Math.random(),officialId:o.id,name:o.name,position:o.position,crime:'贪墨巨万',evidence:60+Math.floor(Math.random()*30),status:'待审'});
        g.addLog(`${o.position}${o.name}贪腐案发，已交都察院`,'event');g.addNotif(`⚖️ ${o.name}贪腐案发！`,'bad');}
    }},
  {id:'wokou',name:'倭寇犯境',type:'动乱',desc:'沿海省份遭劫掠',
    weight:g=>{let w=g.nations.find(n=>n.id==='riben');return (w&&w.relation<-30)?3:0.8},
    effect:g=>{
      let coasts=g.provinces.filter(p=>p.coast);
      let p=coasts[Math.floor(Math.random()*coasts.length)];
      p.wokouDamage=(p.wokouDamage||0)+15;p.market=Math.max(0,p.market-1);
      g.addLog(`倭寇劫掠${p.name}，市肆受损`,'bad');g.addNotif(`🏴‍☠️ 倭寇犯境：${p.name}`,'bad');
    }}
];

const WAR_JUSTIFICATIONS = [
  {id:'tian_tao',name:'天讨不臣',desc:'征讨关系恶劣之国',cond:g=>g.nations.some(n=>n.relation<-30),bonus:'天命+5，士气+10%'},
  {id:'recover',name:'收复失地',desc:'收复被占城池',cond:g=>g.lostTerritories>0,bonus:'敌军防御-15%'},
  {id:'qing_jun_ce',name:'清君侧',desc:'稳定低且有巨贪在朝',cond:g=>g.stability<40&&g.officials.some(o=>!o.empty&&o.corruption>70),bonus:'敌方可能倒戈'},
  {id:'suppress_rebel',name:'剿寇平乱',desc:'平定地方叛乱',cond:g=>g.activeRebels>0,bonus:'平叛效率+20%'},
  {id:'defend',name:'御虏保境',desc:'抵御外敌入侵',cond:g=>g.underAttack,bonus:'防御战军费-30%'},
  {id:'punish_corrupt',name:'惩贪除恶',desc:'弹劾案件积压过多',cond:g=>g.impeachCases.filter(c=>c.status==='待审').length>3,bonus:'整肃buff，官员腐败-10'},
  {id:'jing_nan',name:'靖难',desc:'藩王叛乱',cond:g=>g.princeRebellion,bonus:'宗室内战，天命不扣'},
  {id:'suppress_wokou',name:'平倭',desc:'沿海遭倭寇劫掠',cond:g=>g.provinces.some(p=>(p.wokouDamage||0)>0),bonus:'水军战力+15%'},
  {id:'subdue_miao',name:'改土归流',desc:'西南土司不臣',cond:g=>['yunnan','guizhou','guangxi'].some(id=>{let p=g.getProvince(id);return p&&p.loyalty<40}),bonus:'西南三省可用'},
  {id:'expand',name:'开疆拓土',desc:'纯扩张（天命-10）',cond:()=>true,bonus:'天命-10，稳定-5'},
  {id:'qin_wang',name:'勤王',desc:'京师兵力空虚',cond:g=>g.military.jingying.troops<25000,bonus:'士气+20%'},
  {id:'protect_vassal',name:'护藩',desc:'藩属国遭攻击',cond:g=>g.nations.some(n=>n.tribute&&n.relation>40&&n.underAttack),bonus:'藩属忠诚+20'}
];

// ============================
// 2. 游戏状态创建
// ============================
function createGame(){
  const g = {
    year:1368, era:'洪武', eraYear:1, turn:0,
    treasury:50000, stability:60, tianming:70,
    adminPoints:100, maxAdminPoints:100,
    waterQuality:60, inflation:0, bankReserve:0.15,
    interestRate:0.08, depositRate:0.03,
    grainReserve:200000,
    lostTerritories:0, activeRebels:0, underAttack:false,
    princeRebellion:false, plagueRisk:false,
    capitalGarrisonBase:50000,
    atWarWith:[],
    log:[], provinces:[], officials:[], examPool:[],
    nations:[], companies:[], schools:[], wonders:[],
    activeSchool:'rujia', schoolInfluence:{},
    impeachCases:[], battles:[], currentEvents:[],
    warJustifications:[], lastYearEvent:null,
    playersStocks:{}, playersFutures:{},
    playerBank:{deposit:0,loan:0},
    futuresPrices:{grain:50,iron:40,salt:60,horse:100,silk:80},
    taxIncome:0, canalIncome:0, tributeIncome:0, militaryCost:0, foodProduction:0, commerceTotal:0,
    eraNames:{1399:'建文',1403:'永乐',1425:'洪熙',1426:'宣德',1436:'正统',1450:'景泰',1457:'天顺',
      1465:'成化',1488:'弘治',1506:'正德',1522:'嘉靖',1567:'隆庆',1573:'万历',1620:'泰昌',1621:'天启',1628:'崇祯'}
  };

  g.addLog = function(msg,type='info'){
    this.log.unshift({year:this.year,era:this.era,eraYear:this.eraYear,msg,type});
    if(this.log.length>300)this.log.pop();
  };
  g.addNotif = function(msg,type='info'){ addNotif(msg,type); };
  g.getProvince = function(id){ return this.provinces.find(p=>p.id===id); };
  g.getOfficial = function(id){ return this.officials.find(o=>o.id===id); };
  g.fireOfficial = function(o){ o.empty = true; this.addLog(`${o.name}（${o.position}）被革职`,'event'); };

  // 省份
  g.provinces = PROVINCES_DATA.map(d=>({
    ...d, pop:d.pop*10000, officialId:null, officialName:null,
    farm:d.farm, market:d.market, granary:0,
    loyalty:50+Math.floor(Math.random()*20),
    corruption:20+Math.floor(Math.random()*30),
    garrison:d.garrison, wokouDamage:0, devastation:0,
    foodProd:0, commerceProd:0, foodShock:1, foodBonus:1
  }));

  // 中央官员
  g.officials = OFFICE_POSITIONS.map(pos=>({
    id:pos.id, name:OFFICIAL_NAMES[Math.floor(Math.random()*OFFICIAL_NAMES.length)],
    position:pos.name, dept:pos.dept, effect:pos.effect, slot:true,
    age:38+Math.floor(Math.random()*20), ability:50+Math.floor(Math.random()*50),
    loyalty:50+Math.floor(Math.random()*50), corruption:10+Math.floor(Math.random()*60),
    faction:['东林','浙党','楚党','齐党','无'][Math.floor(Math.random()*5)],
    health:75+Math.floor(Math.random()*25), empty:false
  }));
  // 地方官（前10省已有）
  g.provinces.slice(0,10).forEach((p,i)=>{
    let o = {
      id:'local_'+p.id, name:OFFICIAL_NAMES[(i+20)%OFFICIAL_NAMES.length],
      position:'巡抚', dept:'地方', slot:false, province:p.id,
      age:35+Math.floor(Math.random()*25), ability:40+Math.floor(Math.random()*60),
      loyalty:50+Math.floor(Math.random()*50), corruption:15+Math.floor(Math.random()*60),
      faction:['东林','浙党','楚党','齐党','无'][Math.floor(Math.random()*5)],
      health:70+Math.floor(Math.random()*30), empty:false
    };
    g.officials.push(o);
    p.officialId = o.id; p.officialName = o.name;
  });

  // 军事
  g.military = {
    jingying:{name:'京营',troops:50000,training:60,equip:50,morale:60,location:'zhili'},
    jiubian:{
      liaodong:{name:'辽东镇',troops:40000,training:50,equip:40,morale:50},
      jizhou:{name:'蓟州镇',troops:30000,training:55,equip:45,morale:55},
      xuanfu:{name:'宣府镇',troops:28000,training:50,equip:40,morale:50},
      datong:{name:'大同镇',troops:35000,training:50,equip:40,morale:50},
      yansui:{name:'延绥镇',troops:30000,training:45,equip:35,morale:45},
      ningxia:{name:'宁夏镇',troops:30000,training:45,equip:35,morale:45},
      gansu:{name:'甘肃镇',troops:35000,training:45,equip:35,morale:45},
      guyuan:{name:'固原镇',troops:20000,training:40,equip:30,morale:40}
    },
    weisuo:g.provinces.map(p=>({province:p.id,troops:Math.floor(p.pop*0.02),training:30,equip:20,morale:30}))
  };

  g.nations = NATIONS_DATA.map(n=>({...n,underAttack:false}));

  // 市舶公司（35家）
  let companies = [], cid = 1;
  SECTORS.forEach(sector=>{
    COMPANY_NAMES[sector].forEach(name=>{
      companies.push({id:'c'+(cid++),name,sector,price:40+Math.floor(Math.random()*120),volatility:0.08+Math.random()*0.2});
    });
  });
  g.companies = companies;

  g.schools = SCHOOLS_DATA.map(s=>({...s}));
  g.schoolInfluence = {};
  SCHOOLS_DATA.forEach(s=>{ g.schoolInfluence[s.id] = s.id==='rujia'?30:8+Math.floor(Math.random()*5); });

  g.wonders = WONDERS_DATA.map(w=>({...w,done:false,progress:0,stage:0,stageProgress:0}));

  g.addLog('太祖高皇帝开国，定都应天府，年号洪武','event');
  return g;
}

// ============================
// 3. 工具函数
// ============================
function isSchoolActive(id){ return G && G.activeSchool === id; }
function getSchool(id){ return G.schools.find(s=>s.id===id); }
function getActiveSchool(){ return getSchool(G.activeSchool); }

// 部门修正：官员在任且能力越高修正越强，空缺则无修正
function deptModifier(deptId){
  let o = G.officials.find(x=>x.id===deptId);
  if(!o || o.empty) return 0;
  return o.ability/100;
}
function hasOfficial(deptId){
  let o = G.officials.find(x=>x.id===deptId);
  return !!(o && !o.empty);
}
function grandSecretaryBonus(){ return hasOfficial('grand_secretary') ? 1.05 : 1; }

function addNotif(msg,type='info'){
  const el = document.createElement('div');
  el.className = 'notif '+type;
  el.textContent = msg;
  document.getElementById('notification').appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

function fmt(n){ return Math.floor(n).toLocaleString('zh-CN'); }

// ============================
// 4. 年度推演引擎（18步联动）
// ============================
function annualReview(){
  if(!G) return;
  if(!confirm(`【${G.era}${G.eraYear}年】上朝进奏，开始年度推演？`)) return;

  G.addLog(`═══ ${G.era}${G.eraYear}年 推演开始 ═══`,'info');

  // 1. 年份与年号
  G.year++; G.eraYear++;
  if(G.eraNames[G.year]){
    G.era = G.eraNames[G.year]; G.eraYear = 1;
    G.addLog(`改元【${G.era}】，大赦天下`,'event');
    addNotif(`👑 改元${G.era}！`,'good');
  }

  // 2. 官员 aging / 致仕 / 病逝 / 补位
  G.officials.forEach(o=>{
    if(o.empty) return;
    o.age++;
    o.health = Math.max(0, o.health - (Math.random()<0.15 ? 3+Math.floor(Math.random()*5) : 1));
    if(o.age>=70 && Math.random()<0.4){
      G.addLog(`${o.position}${o.name}（${o.age}岁）致仕还乡`,'info');
      o.empty = true;
      if(o.slot) addNotif(`📭 ${o.position}空缺`,'bad');
    } else if(o.health<=0){
      G.addLog(`${o.position}${o.name}病逝任上`,'bad');
      o.empty = true;
      if(o.slot) addNotif(`🕯 ${o.name}病逝，${o.position}空缺`,'bad');
    }
  });
  fillVacancies();

  // 3. 建筑缓存更新（清除年度临时buff）
  G.provinces.forEach(p=>{
    p.foodShock = 1; p.foodBonus = 1;
    p.wokouDamage = Math.max(0,(p.wokouDamage||0)-5);
    p.devastation = Math.max(0,(p.devastation||0)-5);
  });

  // 4. 人口增长：基础率 × 稳定系数 × 医家 × 破坏惩罚
  let baseRate = 0.015 * (0.5 + G.stability/100) + (isSchoolActive('yijia')?0.005:0);
  G.provinces.forEach(p=>{
    let rate = baseRate * (p.devastation>50?0.3:1);
    p.pop = Math.floor(p.pop * (1+rate));
  });

  // 5. 粮产结算
  let totalFood = 0;
  G.provinces.forEach(p=>{
    let offBonus = 0.6;
    if(p.officialId){
      let o = G.getOfficial(p.officialId);
      if(o && !o.empty) offBonus = 0.5 + (o.ability/100)*0.6;
    }
    let weisuoBonus = 1 + (p.border?0.10:0);
    let prod = p.pop*0.1 * (1+p.farm*0.15) * offBonus * weisuoBonus
      * (isSchoolActive('nongjia')?1.2:1) * p.foodShock * p.foodBonus
      * (1-(p.devastation||0)/200);
    p.foodProd = Math.floor(prod);
    totalFood += p.foodProd;
  });
  G.foodProduction = Math.floor(totalFood);

  // 粮食消耗与饥荒判定（粮仓系统）
  let population = G.provinces.reduce((s,p)=>s+p.pop,0);
  let foodNeed = population * 0.08;
  if(G.foodProduction < foodNeed){
    let deficit = foodNeed - G.foodProduction;
    if(G.grainReserve >= deficit){
      G.grainReserve -= deficit;
      G.addLog(`粮产不足，开仓放粮${fmt(deficit)}石`,'info');
    } else {
      G.grainReserve = 0;
      G.stability = Math.max(0, G.stability - 8);
      G.provinces.forEach(p=>{ p.pop = Math.max(10000, Math.floor(p.pop*0.99)); });
      G.addLog(`大饥！粮仓已空，饿殍遍野，稳定-8`,'bad');
      addNotif('💀 大饥荒爆发！','bad');
    }
  } else {
    let surplus = Math.min(50000, (G.foodProduction-foodNeed)*0.3);
    G.grainReserve = Math.min(1000000, G.grainReserve + surplus);
  }

  // 6. 商业结算
  let canalWonder = G.wonders.find(w=>w.id==='grand_canal'&&w.done);
  let totalCommerce = 0;
  G.provinces.forEach(p=>{
    let offBonus = 0.6;
    if(p.officialId){
      let o = G.getOfficial(p.officialId);
      if(o && !o.empty) offBonus = 0.5 + (o.ability/100)*0.6;
    }
    let prod = p.pop*0.05 * (1+p.market*0.2) * offBonus
      * (1+G.inflation*0.5) * (canalWonder?1.15:1) * (1-(p.wokouDamage||0)/200);
    p.commerceProd = Math.floor(prod);
    totalCommerce += p.commerceProd;
  });
  G.commerceTotal = Math.floor(totalCommerce);

  // 7. 国库收支
  let huBonus = hasOfficial('minister_hu') ? 0.15 : 0;
  let schoolTax = getActiveSchool().tax || 0;
  let taxRate = (0.08 + huBonus*0.5 + schoolTax) * grandSecretaryBonus();
  let taxIncome = Math.floor(G.commerceTotal * taxRate + G.foodProduction * 0.01);
  let canalIncome = Math.floor(3000 * (G.waterQuality/100) * (1+deptModifier('minister_gong')*0.1) * (canalWonder?1.5:1));
  let tributeIncome = 0;
  G.nations.forEach(n=>{ if(n.tribute && n.relation>40) tributeIncome += 500+Math.floor(Math.random()*1000); });
  let tradeIncome = 0;
  G.nations.forEach(n=>{ if(n.trade && n.relation>0) tradeIncome += Math.floor(n.relation*20); });

  let bingCostCut = hasOfficial('minister_bing') ? 0.9 : 1;
  let wallWonder = G.wonders.find(w=>w.id==='great_wall'&&w.done);
  let jingyingCost = G.military.jingying.troops * 0.08;
  let jiubianCost = Object.values(G.military.jiubian).reduce((s,j)=>s+j.troops*0.06,0) * bingCostCut * (wallWonder?0.8:1);
  let weisuoCost = G.military.weisuo.reduce((s,w)=>s+w.troops*0.02,0);
  let militaryCost = Math.floor(jingyingCost + jiubianCost + weisuoCost);
  let salaryCost = G.officials.filter(o=>!o.empty).length * 200;
  let buildingMaint = G.provinces.reduce((s,p)=>s+p.farm*100+p.market*150+p.granary*200,0);

  G.treasury += taxIncome + canalIncome + tributeIncome + tradeIncome - militaryCost - salaryCost - buildingMaint;
  G.taxIncome=taxIncome; G.canalIncome=canalIncome; G.tributeIncome=tributeIncome+tradeIncome; G.militaryCost=militaryCost;

  // 8. 银行结算与通胀
  let depositInterest = Math.floor(G.playerBank.deposit * G.depositRate);
  let loanInterest = Math.floor(G.playerBank.loan * G.interestRate);
  G.playerBank.deposit += depositInterest;
  G.treasury -= loanInterest;
  G.inflation = Math.max(-0.05, Math.min(0.3, G.inflation + (G.treasury>200000?0.01:-0.005) + (Math.random()-0.5)*0.01));

  // 9. 股价波动（事件/战争/国策定向影响板块）
  G.companies.forEach(c=>{
    let change = (Math.random()-0.5) * c.volatility;
    if(G.atWarWith.length && c.sector==='军工') change += 0.12;
    if(G.currentEvents.includes('locust') && c.sector==='资源') change -= 0.1;
    if(G.currentEvents.includes('trade_boom') && c.sector==='贸易') change += 0.15;
    if(G.inflation>0.15 && c.sector==='金融') change += 0.08;
    c.price = Math.max(5, Math.round(c.price*(1+change)));
  });

  // 10. 期货价格与实物产出挂钩
  G.futuresPrices = {
    grain: Math.max(10, Math.floor(50 * (G.foodProduction<foodNeed?1.8:1) + (Math.random()-0.5)*10)),
    iron: Math.max(10, Math.floor(40 + (G.atWarWith.length?25:0) + (Math.random()-0.5)*8)),
    salt: Math.max(10, Math.floor(60 + (Math.random()-0.5)*8)),
    horse: Math.max(10, Math.floor(100 + (G.nations.filter(n=>n.relation<-30).length*10) + (Math.random()-0.5)*15)),
    silk: Math.max(10, Math.floor(80 + (G.provinces.some(p=>p.coast&&p.market>=3)?15:0) + (Math.random()-0.5)*12))
  };

  // 11. 外交关系自然漂移
  G.nations.forEach(n=>{
    let change = (Math.random()-0.5)*6;
    if(isSchoolActive('zonghengjia')) change += 2;
    if(n.trade) change += 1;
    if(G.atWarWith.includes(n.id)) change -= 5;
    n.relation = Math.max(-100, Math.min(100, Math.round(n.relation+change)));
  });

  // 12. 沦陷领土与叛乱消退
  if(G.lostTerritories>0 && Math.random()<0.3) G.lostTerritories--;
  if(G.activeRebels>0 && G.stability>55) { G.activeRebels--; G.addLog('一处民变被抚平','good'); }

  // 13. 学派影响力重分配
  Object.keys(G.schoolInfluence).forEach(k=>{
    let drift = (Math.random()-0.5)*3;
    if(k===G.activeSchool) drift += 1;
    G.schoolInfluence[k] = Math.max(3, Math.min(50, G.schoolInfluence[k]+drift));
  });

  // 14. 弹劾案件生成（左都御史+刑部能力驱动）
  let censorRate = deptModifier('censor_left') + deptModifier('minister_xing')*0.5 + (isSchoolActive('fajia')?0.3:0);
  let corruptOfficials = G.officials.filter(o=>!o.empty && o.corruption>55);
  if(corruptOfficials.length && Math.random() < 0.3+censorRate*0.5){
    let o = corruptOfficials[Math.floor(Math.random()*corruptOfficials.length)];
    if(!G.impeachCases.some(c=>c.officialId===o.id && c.status==='待审')){
      let crimes = ['贪墨钱粮','卖官鬻爵','侵占民田','结党营私','欺君罔上'];
      let crime = crimes[Math.floor(Math.random()*crimes.length)];
      G.impeachCases.push({
        id:Date.now()+Math.random(), officialId:o.id, name:o.name, position:o.position,
        crime, evidence:Math.floor(30+censorRate*50+Math.random()*20), status:'待审'
      });
      G.addLog(`都察院弹劾${o.position}${o.name}：${crime}`,'event');
    }
  }

  // 15. 事件触发（按权重抽1-3个，阴阳家预警）
  G.currentEvents = [];
  let disasterReduce = isSchoolActive('daojia') ? 0.7 : 1;
  let pool = [...EVENTS_POOL].sort(()=>Math.random()-0.5);
  let triggered = 0;
  for(let evt of pool){
    if(triggered>=3) break;
    let w = evt.weight(G);
    if(evt.type==='天灾') w *= disasterReduce;
    if(w>2 && isSchoolActive('yinyangjia') && evt.type==='天灾' && Math.random()<0.5){
      G.addLog(`阴阳家观星示警：恐有【${evt.name}】之患，宜早做准备`,'event');
      addNotif(`🔮 阴阳家预警：${evt.name}`,'info');
      continue;
    }
    if(w>0 && Math.random()*8 < w){
      evt.effect(G);
      G.currentEvents.push(evt.id);
      G.lastYearEvent = evt.id;
      triggered++;
    }
  }
  if(triggered===0){ G.addLog('本年四海升平，无大事发生','good'); G.lastYearEvent=null; }

  // 16. 战争名分刷新
  G.warJustifications = WAR_JUSTIFICATIONS.filter(j=>j.cond(G)).map(j=>j.id);

  // 17. 稳定度/天命终算
  let school = getActiveSchool();
  let stabDelta = (G.treasury>0?1.5:-3) + (school.stability||0)*30
    + (G.foodProduction>=foodNeed?1:-2)
    + (hasOfficial('minister_xing')?0.5:-0.5);
  G.stability = Math.max(0, Math.min(100, G.stability + stabDelta));
  let tmDelta = (G.stability>50?1:-2) + (school.tianming||0)*0.5
    + (G.wonders.find(w=>w.id==='forbidden_city'&&w.done)?2:0)
    + (hasOfficial('minister_libu')?1:0);
  G.tianming = Math.max(0, Math.min(100, G.tianming + tmDelta));

  // 18. 行政点恢复
  let liBonus = hasOfficial('minister_li') ? 5 : 0;
  let fcWonder = G.wonders.find(w=>w.id==='forbidden_city'&&w.done);
  G.maxAdminPoints = 100 + (fcWonder?20:0);
  G.adminPoints = Math.min(G.maxAdminPoints, G.adminPoints + 10 + liBonus + (isSchoolActive('fajia')?3:0));

  // 水利自然损耗，工部在任可维护
  G.waterQuality = Math.max(0, G.waterQuality - 3 + (hasOfficial('minister_gong')?2:0));

  G.turn++;
  G.addLog(`═══ ${G.era}${G.eraYear}年 推演结束 ═══`,'info');
  updateAll();
  addNotif(`📊 ${G.era}${G.eraYear}年推演完成`,'good');
  checkGameOver();
}

function checkGameOver(){
  let msgs = [];
  if(G.tianming<=0) msgs.push('天命已尽，社稷倾覆');
  if(G.stability<=0) msgs.push('天下大乱，王朝崩解');
  if(G.treasury<-100000) msgs.push('国库枯竭，无力回天');
  if(msgs.length){
    setTimeout(()=>{
      showModal('⚠️ 王朝覆灭',
        `<div style="text-align:center;padding:20px">
          <div style="font-size:18px;color:var(--accent-red);margin-bottom:12px">${msgs.join('<br>')}</div>
          <div class="text-dim">国祚 ${G.turn} 年（${G.era}${G.eraYear}年）</div>
        </div>`,
        [{text:'重整河山（重新开始）',cls:'btn-gold',fn:()=>{closeModal();G=createGame();updateAll();}}]);
    },500);
  }
}

// 空缺补位：优先从人才池，其次随机新晋
function fillVacancies(){
  OFFICE_POSITIONS.forEach(pos=>{
    let o = G.officials.find(x=>x.id===pos.id);
    if(!o || !o.empty) return;
    let candidates = G.examPool.filter(c=>c.ability>45).sort((a,b)=>b.ability-a.ability);
    if(candidates.length){
      let best = candidates[0];
      Object.assign(o,{name:best.name,age:best.age,ability:best.ability,loyalty:best.loyalty||50,
        corruption:best.corruption||20,faction:best.faction||'无',health:80,empty:false});
      G.examPool = G.examPool.filter(c=>c!==best);
      G.addLog(`${best.name}（${best.level}）补任${pos.name}`,'good');
    } else {
      Object.assign(o,{name:OFFICIAL_NAMES[Math.floor(Math.random()*OFFICIAL_NAMES.length)],
        age:32+Math.floor(Math.random()*15),ability:30+Math.floor(Math.random()*45),
        loyalty:50+Math.floor(Math.random()*40),corruption:20+Math.floor(Math.random()*50),
        health:80,empty:false});
      G.addLog(`新晋官员${o.name}补任${pos.name}`,'info');
    }
  });
}

// ============================
// 5. UI 渲染
// ============================
function updateAll(){
  if(!G) return;
  updateTopBar();
  renderPanels();
}

function updateTopBar(){
  const el = document.getElementById('top-info');
  if(!el || !G) return;
  const cls = v => v>50?'good':v>25?'':'danger';
  const pop = G.provinces.reduce((s,p)=>s+p.pop,0);
  el.innerHTML = `
    <span class="item"><span class="label">📅</span><span class="val">${G.era}${G.eraYear}年</span></span>
    <span class="item"><span class="label">💰</span><span class="val ${G.treasury<0?'danger':'good'}">${fmt(G.treasury)}</span></span>
    <span class="item"><span class="label">👥</span><span class="val">${(pop/10000).toFixed(0)}万</span></span>
    <span class="item"><span class="label">🏛稳定</span><span class="val ${cls(G.stability)}">${G.stability.toFixed(0)}</span></span>
    <span class="item"><span class="label">☀天命</span><span class="val ${cls(G.tianming)}">${G.tianming.toFixed(0)}</span></span>
    <span class="item"><span class="label">📋</span><span class="val">${G.adminPoints}/${G.maxAdminPoints}</span></span>`;
}

function switchPanel(name){
  document.querySelectorAll('#content .panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#sidebar .nav-item').forEach(n=>n.classList.remove('active'));
  const p = document.getElementById('panel-'+name);
  if(p) p.classList.add('active');
  const n = document.querySelector(`#sidebar .nav-item[data-panel="${name}"]`);
  if(n) n.classList.add('active');
  renderPanels();
}

function renderPanels(){
  const active = document.querySelector('#content .panel.active');
  if(!active || !G) return;
  const id = active.id.replace('panel-','');
  const renderers = {overview:renderOverview,provinces:renderProvinces,officials:renderOfficials,
    military:renderMilitary,economy:renderEconomy,diplomacy:renderDiplomacy,schools:renderSchools,
    exam:renderExam,events:renderEvents,wonders:renderWonders,impeach:renderImpeach,log:renderLog};
  if(renderers[id]) renderers[id]();
}

// ---------- 朝政总览 ----------
function renderOverview(){
  const el = document.getElementById('panel-overview');
  const stCls = G.stability>50?'good':G.stability>25?'warn':'danger';
  const tmCls = G.tianming>50?'good':G.tianming>25?'warn':'danger';
  const school = getActiveSchool();
  const pop = G.provinces.reduce((s,p)=>s+p.pop,0);
  const vacant = G.officials.filter(o=>o.slot&&o.empty).map(o=>o.position);
  el.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header">国运概览</div>
        <table>
          <tr><td>纪年</td><td class="text-gold">${G.era}${G.eraYear}年（在位${G.turn}年）</td></tr>
          <tr><td>总人口</td><td class="text-bright">${fmt(pop)}</td></tr>
          <tr><td>粮产 / 需求</td><td><span class="text-green">${fmt(G.foodProduction)}</span> / ${fmt(pop*0.08)} 石</td></tr>
          <tr><td>粮仓储备</td><td class="${G.grainReserve<50000?'text-red':'text-gold'}">${fmt(G.grainReserve)} 石</td></tr>
          <tr><td>商业总额</td><td class="text-gold">${fmt(G.commerceTotal)}</td></tr>
          <tr><td>通货膨胀</td><td class="${G.inflation>0.15?'text-red':'text-green'}">${(G.inflation*100).toFixed(1)}%</td></tr>
          <tr><td>水利质量</td><td class="${G.waterQuality<50?'text-red':'text-gold'}">${G.waterQuality}/100</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-header">核心指标</div>
        <div style="margin-bottom:10px">
          <div class="flex" style="justify-content:space-between"><span>稳定度</span><span>${G.stability.toFixed(1)}/100</span></div>
          <div class="progress-bar"><div class="fill ${stCls}" style="width:${G.stability}%"></div></div>
        </div>
        <div style="margin-bottom:10px">
          <div class="flex" style="justify-content:space-between"><span>天命</span><span>${G.tianming.toFixed(1)}/100</span></div>
          <div class="progress-bar"><div class="fill ${tmCls}" style="width:${G.tianming}%"></div></div>
        </div>
        <div style="margin-bottom:10px">
          <div class="flex" style="justify-content:space-between"><span>行政点</span><span>${G.adminPoints}/${G.maxAdminPoints}</span></div>
          <div class="progress-bar"><div class="fill blue" style="width:${G.adminPoints/G.maxAdminPoints*100}%"></div></div>
        </div>
        <table>
          <tr><td>主流学派</td><td class="text-gold">${school.name}</td></tr>
          <tr><td>税收</td><td class="text-green">+${fmt(G.taxIncome)}</td></tr>
          <tr><td>漕运+朝贡</td><td class="text-green">+${fmt(G.canalIncome+G.tributeIncome)}</td></tr>
          <tr><td>军费</td><td class="text-red">-${fmt(G.militaryCost)}</td></tr>
        </table>
      </div>
    </div>
    ${vacant.length?`<div class="card" style="border-color:var(--accent-red)">
      <div class="card-header" style="color:var(--accent-red)">⚠ 要员空缺（修正失效）</div>
      <div class="flex flex-wrap gap-4">${vacant.map(v=>`<span class="btn btn-sm btn-red" style="cursor:default">${v}</span>`).join('')}
      <button class="btn btn-sm btn-gold" onclick="switchPanel('officials')">去任命 →</button></div>
    </div>`:''}
    <div class="grid-2">
      <div class="card">
        <div class="card-header">可用战争名分</div>
        <div class="flex flex-wrap gap-4">
          ${G.warJustifications.length?G.warJustifications.map(j=>{
            const jd = WAR_JUSTIFICATIONS.find(w=>w.id===j);
            return `<span class="btn btn-sm" style="cursor:default;border-color:var(--war)" title="${jd.bonus}">${jd.name}</span>`;
          }).join(''):'<span class="text-dim">当前无名分</span>'}
        </div>
        ${G.atWarWith.length?`<div class="mt-8 text-red">⚔ 交战中：${G.atWarWith.map(id=>G.nations.find(n=>n.id===id)?.name).join('、')}</div>`:''}
      </div>
      <div class="card">
        <div class="card-header">本年大事</div>
        ${G.currentEvents.length?G.currentEvents.map(id=>{
          const e = EVENTS_POOL.find(x=>x.id===id);
          return `<div class="log-entry log-event">${e?e.name+'：'+e.desc:id}</div>`;
        }).join(''):'<div class="text-dim">本年暂无大事</div>'}
      </div>
    </div>`;
}

// ---------- 省份 ----------
function renderProvinces(){
  const el = document.getElementById('panel-provinces');
  el.innerHTML = `
    <div class="card">
      <div class="card-header">两京十三省 <span class="sub">点击省份查看详情/建设 · 🛡边疆 ⚓沿海</span></div>
      <table>
        <tr><th>省份</th><th>类型</th><th>人口</th><th>农田</th><th>市肆</th><th>粮仓</th><th>粮产</th><th>商业</th><th>忠诚</th><th>巡抚</th></tr>
        ${G.provinces.map(p=>`<tr class="clickable" onclick="showProvince('${p.id}')">
          <td class="text-gold">${p.name}${p.border?' 🛡':''}${p.coast?' ⚓':''}</td>
          <td class="text-dim">${p.type}</td>
          <td>${(p.pop/10000).toFixed(0)}万</td>
          <td>${'★'.repeat(p.farm)}${'☆'.repeat(5-p.farm)}</td>
          <td>${'★'.repeat(p.market)}${'☆'.repeat(5-p.market)}</td>
          <td>${p.granary>0?'🏺'+p.granary:'—'}</td>
          <td class="text-green">${fmt(p.foodProd)}</td>
          <td class="text-gold">${fmt(p.commerceProd)}</td>
          <td class="${p.loyalty<40?'text-red':p.loyalty>60?'text-green':'text-gold'}">${p.loyalty}</td>
          <td>${p.officialName||'<span class="text-red">空缺</span>'}</td>
        </tr>`).join('')}
      </table>
    </div>`;
}

function showProvince(id){
  const p = G.getProvince(id);
  if(!p) return;
  const ws = G.military.weisuo.find(w=>w.province===id);
  const buildCost = lvl => Math.floor(2000*(lvl+1)*(1+(getActiveSchool().build||0))*(hasOfficial('minister_gong')?0.85:1));
  showModal(`${p.name} · ${p.type}`,`
    <div class="grid-2">
      <div><b>人口：</b>${fmt(p.pop)}</div>
      <div><b>驻军：</b>${fmt(p.garrison)}</div>
      <div><b>忠诚度：</b><span class="${p.loyalty<40?'text-red':'text-green'}">${p.loyalty}</span></div>
      <div><b>卫所兵：</b>${ws?fmt(ws.troops):0}（屯田+10%粮产）</div>
      <div><b>粮产：</b><span class="text-green">${fmt(p.foodProd)}</span> 石</div>
      <div><b>商业：</b><span class="text-gold">${fmt(p.commerceProd)}</span></div>
      <div><b>巡抚：</b>${p.officialName||'<span class="text-red">空缺</span>'}</div>
      <div><b>破坏度：</b>${p.devastation||0}%</div>
    </div>
    <div class="text-dim mt-8">${p.desc}${p.special?' · '+p.special:''}</div>
    <div class="section-title">基础建设（工部在任省15%成本）</div>
    <table>
      <tr><td>农田 Lv.${p.farm}/5</td><td class="text-gold">${p.farm<5?fmt(buildCost(p.farm))+'两':'已满级'}</td>
        <td>${p.farm<5?`<button class="btn btn-sm btn-gold" onclick="upgradeBuilding('${p.id}','farm')">升级（粮产+15%）</button>`:''}</td></tr>
      <tr><td>市肆 Lv.${p.market}/5</td><td class="text-gold">${p.market<5?fmt(buildCost(p.market))+'两':'已满级'}</td>
        <td>${p.market<5?`<button class="btn btn-sm btn-gold" onclick="upgradeBuilding('${p.id}','market')">升级（商业+20%）</button>`:''}</td></tr>
      <tr><td>粮仓 Lv.${p.granary}/3</td><td class="text-gold">${p.granary<3?fmt(buildCost(p.granary+2))+'两':'已满级'}</td>
        <td>${p.granary<3?`<button class="btn btn-sm btn-gold" onclick="upgradeBuilding('${p.id}','granary')">修建（储粮防灾）</button>`:''}</td></tr>
    </table>
    <div class="section-title">人事与安抚</div>
    <div class="flex flex-wrap gap-4">
      ${p.officialId?`<button class="btn btn-sm" onclick="dismissLocalOfficial('${p.id}')">罢免 ${p.officialName}</button>`
        :`<button class="btn btn-sm btn-gold" onclick="appointLocalOfficial('${p.id}')">任命巡抚</button>`}
      ${p.loyalty<60?`<button class="btn btn-sm" onclick="pacifyProvince('${p.id}')">赈抚（${hasOfficial('minister_hu')?1600:2000}两，忠诚+10）</button>`:''}
    </div>
  `,[{text:'关闭',cls:'',fn:closeModal}]);
}

function upgradeBuilding(pid, type){
  const p = G.getProvince(pid);
  if(!p) return;
  if((type==='farm'&&p.farm>=5)||(type==='market'&&p.market>=5)||(type==='granary'&&p.granary>=3)) return;
  const lvl = type==='granary'?p.granary+2:p[type];
  const cost = Math.floor(2000*(lvl+1)*(1+(getActiveSchool().build||0))*(hasOfficial('minister_gong')?0.85:1));
  if(G.treasury<cost){ addNotif('国库不足','bad'); return; }
  G.treasury -= cost;
  if(type==='farm') p.farm++;
  else if(type==='market') p.market++;
  else { p.granary++; G.grainReserve = Math.min(1000000, G.grainReserve + 50000); }
  G.addLog(`${p.name}${type==='farm'?'农田':type==='market'?'市肆':'粮仓'}升为${type==='granary'?p.granary:p[type]}级，耗银${fmt(cost)}两`,'good');
  addNotif(`🏗 ${p.name}建设完成`,'good');
  closeModal(); renderPanels();
}

function appointLocalOfficial(pid){
  const p = G.getProvince(pid);
  const candidates = G.examPool.filter(c=>c.ability>35).sort((a,b)=>b.ability-a.ability).slice(0,8);
  const locals = G.officials.filter(o=>!o.slot&&!o.empty&&!o.province).slice(0,4);
  if(!candidates.length && !locals.length){
    addNotif('人才池为空，请先开科取士','bad'); return;
  }
  let html = '<div style="max-height:300px;overflow-y:auto">';
  candidates.forEach(c=>{
    html += `<div style="padding:6px;border-bottom:1px solid var(--border);cursor:pointer" onclick="confirmAppoint('${pid}','pool','${c.id}')">
      ${c.name}（${c.level}·能力${c.ability}·${c.age}岁）</div>`;
  });
  locals.forEach(o=>{
    html += `<div style="padding:6px;border-bottom:1px solid var(--border);cursor:pointer" onclick="confirmAppoint('${pid}','official','${o.id}')">
      ${o.name}（现任职·能力${o.ability}）</div>`;
  });
  html += '</div>';
  showModal(`任命${p.name}巡抚`, html, [{text:'取消',cls:'',fn:closeModal}]);
}

function confirmAppoint(pid, source, cid){
  const p = G.getProvince(pid);
  if(source==='pool'){
    const c = G.examPool.find(x=>x.id===cid);
    if(!c) return;
    const o = {id:'local_'+pid+'_'+Date.now(), name:c.name, position:'巡抚', dept:'地方', slot:false,
      province:pid, age:c.age, ability:c.ability, loyalty:c.loyalty||55, corruption:c.corruption||15,
      faction:c.faction||'无', health:85, empty:false};
    G.officials.push(o);
    G.examPool = G.examPool.filter(x=>x.id!==cid);
    p.officialId = o.id; p.officialName = o.name;
  } else {
    const o = G.officials.find(x=>x.id===cid);
    if(!o) return;
    if(o.province){ const old = G.getProvince(o.province); if(old){old.officialId=null;old.officialName=null;} }
    o.province = pid;
    p.officialId = o.id; p.officialName = o.name;
  }
  G.addLog(`${p.officialName}出任${p.name}巡抚`,'good');
  addNotif(`👤 ${p.officialName}赴任${p.name}`,'good');
  closeModal(); renderPanels();
}

function dismissLocalOfficial(pid){
  const p = G.getProvince(pid);
  const o = G.officials.find(x=>x.id===p.officialId);
  if(o) o.empty = true;
  p.officialId = null; p.officialName = null;
  G.addLog(`${p.name}巡抚被罢免`,'info');
  closeModal(); renderPanels();
}

function pacifyProvince(pid){
  const p = G.getProvince(pid);
  const cost = hasOfficial('minister_hu') ? 1600 : 2000;
  if(G.treasury<cost){ addNotif('国库不足','bad'); return; }
  G.treasury -= cost;
  p.loyalty = Math.min(100, p.loyalty+10);
  G.addLog(`赈抚${p.name}，民心稍安`,'good');
  closeModal(); renderPanels();
}

// ---------- 官员 ----------
function renderOfficials(){
  const el = document.getElementById('panel-officials');
  const core = G.officials.filter(o=>o.slot);
  const locals = G.officials.filter(o=>!o.slot&&!o.empty);
  el.innerHTML = `
    <div class="card">
      <div class="card-header">内阁 · 六部 · 都察院 <span class="sub">空缺则对应修正失效</span></div>
      <table>
        <tr><th>职位</th><th>姓名</th><th>年龄</th><th>能力</th><th>忠诚</th><th>腐败</th><th>派系</th><th>状态</th><th>操作</th></tr>
        ${core.map(o=>`<tr>
          <td class="text-gold">${o.position}<div class="text-dim" style="font-size:10px">${o.effect}</div></td>
          <td>${o.empty?'<span class="text-red">〈空缺〉</span>':o.name}</td>
          <td>${o.empty?'—':o.age}</td>
          <td>${o.empty?'—':`<span class="${o.ability>70?'text-green':o.ability>45?'text-gold':'text-red'}">${o.ability}</span>`}</td>
          <td>${o.empty?'—':o.loyalty}</td>
          <td>${o.empty?'—':`<span class="${o.corruption>60?'text-red':o.corruption>35?'text-gold':'text-green'}">${o.corruption}</span>`}</td>
          <td>${o.empty?'—':o.faction}</td>
          <td>${o.empty?'<span class="text-red">空缺</span>':o.age>=65?'<span class="text-gold">将致仕</span>':'<span class="text-green">在职</span>'}</td>
          <td>${o.empty?`<button class="btn btn-sm btn-gold" onclick="fillPosition('${o.id}')">任命</button>`
            :`<button class="btn btn-sm" onclick="showOfficial('${o.id}')">详情</button>`}</td>
        </tr>`).join('')}
      </table>
    </div>
    <div class="card">
      <div class="card-header">地方官员 <span class="sub">${locals.length}人在任 · ${G.provinces.filter(p=>!p.officialId).length}省空缺</span></div>
      <table>
        <tr><th>姓名</th><th>任职省份</th><th>年龄</th><th>能力</th><th>忠诚</th><th>腐败</th><th>派系</th></tr>
        ${locals.map(o=>`<tr class="clickable" onclick="showOfficial('${o.id}')">
          <td>${o.name}</td>
          <td class="text-gold">${o.province?(G.getProvince(o.province)?.name||'—'):'待命'}</td>
          <td>${o.age}</td>
          <td><span class="${o.ability>70?'text-green':o.ability>45?'text-gold':'text-red'}">${o.ability}</span></td>
          <td>${o.loyalty}</td>
          <td><span class="${o.corruption>60?'text-red':o.corruption>35?'text-gold':'text-green'}">${o.corruption}</span></td>
          <td>${o.faction}</td>
        </tr>`).join('')}
      </table>
    </div>`;
}

function showOfficial(id){
  const o = G.officials.find(x=>x.id===id);
  if(!o) return;
  const bar = (v,good)=>`<div class="progress-bar"><div class="fill ${good}" style="width:${v}%"></div></div>`;
  showModal(`${o.name} · ${o.position}`,`
    <div class="grid-2">
      <div><b>部门：</b>${o.dept}</div>
      <div><b>年龄：</b>${o.age}岁</div>
      <div><b>派系：</b>${o.faction}</div>
      <div><b>任职：</b>${o.province?(G.getProvince(o.province)?.name||'—'):'中央'}</div>
    </div>
    <div class="mt-8">
      <div class="flex" style="justify-content:space-between"><span>能力</span><span>${o.ability}</span></div>${bar(o.ability,'blue')}
      <div class="flex" style="justify-content:space-between"><span>忠诚</span><span>${o.loyalty}</span></div>${bar(o.loyalty,o.loyalty>60?'good':o.loyalty>30?'warn':'danger')}
      <div class="flex" style="justify-content:space-between"><span>腐败</span><span>${o.corruption}</span></div>${bar(o.corruption,o.corruption>60?'danger':o.corruption>35?'warn':'good')}
      <div class="flex" style="justify-content:space-between"><span>健康</span><span>${o.health}</span></div>${bar(o.health,o.health>60?'good':'warn')}
    </div>
    ${o.effect?`<div class="mt-8"><b>职位修正：</b><span class="text-gold">${o.effect}</span></div>`:''}
    <div class="mt-8 flex gap-4">
      ${o.corruption>30?`<button class="btn btn-sm" onclick="warnOfficial('${o.id}')">训诫（腐败-10）</button>`:''}
      ${!o.slot?`<button class="btn btn-sm btn-red" onclick="dismissLocalOfficial2('${o.id}')">罢免</button>`:''}
    </div>
  `,[{text:'关闭',cls:'',fn:closeModal}]);
}

function warnOfficial(id){
  const o = G.officials.find(x=>x.id===id);
  if(!o) return;
  o.corruption = Math.max(0, o.corruption-10);
  o.loyalty = Math.max(0, o.loyalty-5);
  G.addLog(`训诫${o.name}，其贪墨稍敛`,'info');
  closeModal(); renderPanels();
}

function dismissLocalOfficial2(id){
  const o = G.officials.find(x=>x.id===id);
  if(!o) return;
  if(o.province){ const p = G.getProvince(o.province); if(p){p.officialId=null;p.officialName=null;} }
  o.empty = true;
  G.addLog(`${o.name}被罢免`,'info');
  closeModal(); renderPanels();
}

function fillPosition(posId){
  const o = G.officials.find(x=>x.id===posId);
  if(!o) return;
  const candidates = G.examPool.filter(c=>c.ability>45).sort((a,b)=>b.ability-a.ability).slice(0,8);
  if(!candidates.length){
    showModal('无人可用','<div class="text-red">人才池中无能力足够者（需能力>45），请先开科取士</div>',[{text:'知道了',cls:'',fn:closeModal}]);
    return;
  }
  showModal(`选任${o.position}`,
    `<div class="text-dim mb-8">职位修正：${o.effect}</div>` +
    candidates.map(c=>`<div style="padding:8px;border-bottom:1px solid var(--border);cursor:pointer" onclick="confirmFill('${posId}','${c.id}')">
      <b>${c.name}</b>（${c.level}）· 能力<span class="text-green">${c.ability}</span> · ${c.age}岁 · ${c.faction||'无派系'}</div>`).join(''),
    [{text:'取消',cls:'',fn:closeModal}]);
}

function confirmFill(posId, candId){
  const o = G.officials.find(x=>x.id===posId);
  const c = G.examPool.find(x=>x.id===candId);
  if(!o || !c) return;
  Object.assign(o,{name:c.name,age:c.age,ability:c.ability,loyalty:c.loyalty||55,
    corruption:c.corruption||15,faction:c.faction||'无',health:85,empty:false});
  G.examPool = G.examPool.filter(x=>x.id!==candId);
  G.addLog(`${c.name}（${c.level}）出任${o.position}`,'good');
  addNotif(`👤 ${c.name}出任${o.position}`,'good');
  closeModal(); renderPanels();
}

// ---------- 军事 ----------
function renderMilitary(){
  const el = document.getElementById('panel-military');
  const jy = G.military.jingying;
  const bar = (v,c)=>`<div class="progress-bar"><div class="fill ${c}" style="width:${v}%"></div></div>`;
  el.innerHTML = `
    <div class="card">
      <div class="card-header">京营（机动部队） <span class="sub">可调动至任意省</span></div>
      <table>
        <tr><th>兵力</th><th>操练</th><th>装备</th><th>士气</th><th>驻地</th><th>操作</th></tr>
        <tr>
          <td class="text-gold">${fmt(jy.troops)}</td>
          <td style="min-width:100px">${jy.training}${bar(jy.training,'blue')}</td>
          <td style="min-width:100px">${jy.equip}${bar(jy.equip,jy.equip>50?'good':'warn')}</td>
          <td style="min-width:100px">${jy.morale}${bar(jy.morale,jy.morale>50?'good':'warn')}</td>
          <td>${G.getProvince(jy.location)?.name||'京师'}</td>
          <td>
            <button class="btn btn-sm" onclick="showMoveArmy()">调动</button>
            <button class="btn btn-sm btn-gold" onclick="showTrainArmy()">操练</button>
            <button class="btn btn-sm" onclick="recruitTroops()">募兵</button>
          </td>
        </tr>
      </table>
    </div>
    <div class="card">
      <div class="card-header">九边重镇 <span class="sub">长城竣工：防御+30% 维护-20%</span></div>
      <table>
        <tr><th>军镇</th><th>兵力</th><th>操练</th><th>装备</th><th>士气</th></tr>
        ${Object.values(G.military.jiubian).map(j=>`<tr>
          <td class="text-gold">${j.name}</td><td>${fmt(j.troops)}</td>
          <td style="min-width:90px">${j.training}${bar(j.training,'blue')}</td>
          <td style="min-width:90px">${j.equip}${bar(j.equip,j.equip>50?'good':'warn')}</td>
          <td style="min-width:90px">${j.morale}${bar(j.morale,j.morale>50?'good':'warn')}</td>
        </tr>`).join('')}
      </table>
    </div>
    <div class="card">
      <div class="card-header">卫所屯田 <span class="sub">边省农田+10%，军费自养</span></div>
      <table>
        <tr><th>省份</th><th>卫所兵</th><th>操练</th><th>装备</th></tr>
        ${G.military.weisuo.map(w=>`<tr>
          <td>${G.getProvince(w.province)?.name||w.province}</td>
          <td>${fmt(w.troops)}</td><td>${w.training}</td><td>${w.equip}</td>
        </tr>`).join('')}
      </table>
    </div>`;
}

function showMoveArmy(){
  showModal('调动京营',`
    <div>选择目标驻地（消耗5行政点）：</div>
    <select id="move-target" style="width:100%;padding:6px;background:var(--bg-card);color:var(--text);border:1px solid var(--border);margin:8px 0">
      ${G.provinces.map(p=>`<option value="${p.id}" ${G.military.jingying.location===p.id?'selected':''}>${p.name}</option>`).join('')}
    </select>
  `,[
    {text:'调动',cls:'btn-gold',fn:()=>{
      if(G.adminPoints<5){addNotif('行政点不足','bad');return;}
      G.adminPoints-=5;
      const target = document.getElementById('move-target').value;
      G.military.jingying.location = target;
      G.addLog(`京营移驻${G.getProvince(target).name}`,'info');
      addNotif(`🚩 京营移驻${G.getProvince(target).name}`,'info');
      closeModal(); renderPanels();
    }},
    {text:'取消',cls:'',fn:closeModal}
  ]);
}

function showTrainArmy(){
  showModal('操练京营',`
    <div class="flex flex-wrap gap-4">
      <button class="btn" onclick="doTrain(5000,5)">5000两 → 操练+5</button>
      <button class="btn" onclick="doTrain(12000,12)">12000两 → 操练+12</button>
      <button class="btn" onclick="doTrain(25000,25)">25000两 → 操练+25</button>
    </div>
    <div class="text-dim mt-8">操练度直接影响战斗力</div>
  `,[{text:'关闭',cls:'',fn:closeModal}]);
}

function doTrain(cost,gain){
  if(G.treasury<cost){addNotif('国库不足','bad');return;}
  G.treasury-=cost;
  G.military.jingying.training = Math.min(100, G.military.jingying.training+gain);
  G.addLog(`京营大操练，操练+${gain}`,'good');
  closeModal(); renderPanels();
}

function recruitTroops(){
  showModal('募兵',`
    <div>每名士兵成本约 ${Math.floor(0.5*(hasOfficial('minister_bing')?0.9:1)*(isSchoolActive('bingjia')?0.85:1))} 两（兵部在任-10%，兵家-15%）</div>
    <div class="flex flex-wrap gap-4 mt-8">
      <button class="btn" onclick="doRecruit(5000)">募 5000 人</button>
      <button class="btn" onclick="doRecruit(10000)">募 10000 人</button>
      <button class="btn" onclick="doRecruit(20000)">募 20000 人</button>
    </div>
  `,[{text:'关闭',cls:'',fn:closeModal}]);
}

function doRecruit(n){
  const costPer = (hasOfficial('minister_bing')?0.9:1) * (isSchoolActive('bingjia')?0.85:1) * 0.5;
  const cost = Math.floor(n*costPer);
  if(G.treasury<cost){addNotif('国库不足','bad');return;}
  G.treasury-=cost;
  G.military.jingying.troops += n;
  G.addLog(`募兵${n}人入京营，耗银${fmt(cost)}两`,'good');
  addNotif(`⚔ 募兵${n}人`,'good');
  closeModal(); renderPanels();
}

// ---------- 战斗系统（战报式结算） ----------
function openWarRoom(nationId){
  const n = G.nations.find(x=>x.id===nationId);
  if(!n) return;
  const armies = [
    {key:'jingying',name:`京营（${fmt(G.military.jingying.troops)}）`,power:calcArmyPower(G.military.jingying)},
    ...Object.entries(G.military.jiubian).map(([k,j])=>({key:'jb_'+k,name:`${j.name}（${fmt(j.troops)}）`,power:calcArmyPower(j)}))
  ];
  showModal(`出征 ${n.name}`,`
    <div class="mb-8">敌军兵力：<b class="text-red">${fmt(n.army)}</b> · 关系：<span class="${n.relation<0?'text-red':'text-green'}">${n.relation}</span></div>
    <div class="text-dim mb-8">战力 = 兵力 × 操练 × 装备 × 士气 综合。胜则夺其辎重，败则折损兵将。</div>
    <div class="section-title">选择出征部队（可多选）</div>
    ${armies.map(a=>`<div style="padding:6px;border-bottom:1px solid var(--border)">
      <label><input type="checkbox" class="war-army-check" value="${a.key}" style="margin-right:6px">${a.name} <span class="text-dim">战力${fmt(a.power)}</span></label>
    </div>`).join('')}
    <div class="mt-8">可用名分：${G.warJustifications.length?G.warJustifications.map(j=>WAR_JUSTIFICATIONS.find(w=>w.id===j)?.name).join('、'):'<span class="text-red">无（强行出征天命-10）</span>'}</div>
  `,[
    {text:'⚔ 出征！',cls:'btn-red',fn:()=>{
      const checked = [...document.querySelectorAll('.war-army-check:checked')].map(c=>c.value);
      if(!checked.length){addNotif('请至少选择一支部队','bad');return;}
      resolveBattle(nationId, checked);
    }},
    {text:'取消',cls:'',fn:closeModal}
  ]);
}

function calcArmyPower(a){
  return a.troops * (0.5+a.training/100) * (0.5+a.equip/100) * (0.5+a.morale/100);
}

function resolveBattle(nationId, armyKeys){
  const n = G.nations.find(x=>x.id===nationId);
  if(!n) return;
  closeModal();

  let myPower = 0, myTroops = 0;
  const units = [];
  armyKeys.forEach(key=>{
    let a = key==='jingying' ? G.military.jingying : G.military.jiubian[key.slice(3)];
    if(!a) return;
    units.push(a);
    myPower += calcArmyPower(a);
    myTroops += a.troops;
  });

  // 名分加成
  let moraleBoost = 0;
  if(G.warJustifications.length){
    const j = WAR_JUSTIFICATIONS.find(w=>w.id===G.warJustifications[0]);
    if(j && j.id==='tian_tao') moraleBoost = 0.1;
    if(j && j.id==='qin_wang') moraleBoost = 0.2;
    if(j && j.id==='suppress_wokou') moraleBoost = 0.15;
  } else {
    G.tianming = Math.max(0, G.tianming-10);
    G.stability = Math.max(0, G.stability-5);
    G.addLog('无名分强行出征，天命-10，稳定-5','bad');
  }
  myPower *= (1+moraleBoost) * grandSecretaryBonus();
  if(isSchoolActive('bingjia')) myPower *= 1.1;

  let enemyPower = n.army * (0.7+Math.random()*0.5);
  if(G.warJustifications.includes('recover')) enemyPower *= 0.85;

  const ratio = myPower / Math.max(1, enemyPower);
  const win = ratio > 1;

  let myLossRate = win ? Math.max(0.05, 0.25/ratio) : Math.min(0.6, 0.3*ratio+0.15);
  let enemyLossRate = win ? Math.min(0.7, 0.3*ratio) : Math.max(0.05, 0.2/ratio);
  const myLoss = Math.floor(myTroops * myLossRate * (0.7+Math.random()*0.4));
  const enemyLoss = Math.floor(n.army * enemyLossRate);

  // 按比例分摊战损
  let remaining = myLoss;
  units.forEach(a=>{
    const loss = Math.min(a.troops, Math.floor(remaining * a.troops/Math.max(1,myTroops)));
    a.troops -= loss;
    a.morale = Math.max(10, a.morale + (win?5:-10));
    remaining -= loss;
  });
  n.army = Math.max(1000, n.army - enemyLoss);
  n.relation = -100;
  if(!G.atWarWith.includes(nationId)) G.atWarWith.push(nationId);

  const generals = ['戚继光','俞大猷','李如松','麻贵','刘綎','孙承宗','袁崇焕','卢象升','孙传庭'];
  const general = generals[Math.floor(Math.random()*generals.length)];
  let report = `<div style="line-height:2">`;
  report += `<div class="text-gold">【战报】${G.era}${G.eraYear}年 · 征${n.name}之役</div>`;
  report += `<div>总兵官 <b>${general}</b> 率师${fmt(myTroops)}人出征。</div>`;
  if(win){
    report += `<div class="text-green">我军奋击，大破敌军！斩首${fmt(enemyLoss)}级。</div>`;
    const loot = Math.floor(3000 + enemyLoss*0.3 + Math.random()*5000);
    G.treasury += loot;
    G.tianming = Math.min(100, G.tianming+3);
    G.stability = Math.min(100, G.stability+3);
    report += `<div>缴获辎重折银 <b class="text-gold">${fmt(loot)}两</b>，天命+3，稳定+3。</div>`;
    if(n.army < 10000){
      report += `<div class="text-gold">${n.name}主力尽丧，遣使乞和！</div>`;
      G.atWarWith = G.atWarWith.filter(id=>id!==nationId);
      n.relation = n.tribute ? 30 : -20;
    }
  } else {
    report += `<div class="text-red">敌众我寡，师败而归。折兵${fmt(myLoss)}人。</div>`;
    G.stability = Math.max(0, G.stability-5);
    G.tianming = Math.max(0, G.tianming-2);
    if(G.military.jingying.troops < 10000 && armyKeys.includes('jingying')){
      G.lostTerritories++;
      report += `<div class="text-red">京师大震，边城失守！</div>`;
    }
  }
  report += `<div class="text-dim">我军损失：${fmt(myLoss)}人 · 敌军损失：${fmt(enemyLoss)}人</div></div>`;

  G.battles.unshift({year:G.year,era:G.era,eraYear:G.eraYear,nation:n.name,win,myLoss,enemyLoss});
  if(G.battles.length>20) G.battles.pop();
  G.addLog(`征${n.name}：${win?'大胜':'失利'}，我军损失${fmt(myLoss)}，歼敌${fmt(enemyLoss)}`, win?'good':'bad');
  addNotif(win?`⚔ 大破${n.name}！`:`⚔ 征${n.name}失利`, win?'good':'war');

  showModal(`战报 · 征${n.name}`, report, [{text:'收兵',cls:'btn-gold',fn:()=>{closeModal();renderPanels();updateTopBar();}}]);
  updateTopBar();
}

// ---------- 经济 ----------
function renderEconomy(){
  const el = document.getElementById('panel-economy');
  const futuresNames = {grain:'粮食',iron:'铁矿',salt:'盐',horse:'战马',silk:'丝绸'};
  el.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card-header">国库收支（上年结算）</div>
        <table>
          <tr><td>税收</td><td class="text-green">+${fmt(G.taxIncome)}</td></tr>
          <tr><td>漕运</td><td class="text-green">+${fmt(G.canalIncome)}</td></tr>
          <tr><td>朝贡+互市</td><td class="text-green">+${fmt(G.tributeIncome)}</td></tr>
          <tr><td>军费</td><td class="text-red">-${fmt(G.militaryCost)}</td></tr>
          <tr><td>俸禄</td><td class="text-red">-${fmt(G.officials.filter(o=>!o.empty).length*200)}</td></tr>
          <tr><td>建筑维护</td><td class="text-red">-${fmt(G.provinces.reduce((s,p)=>s+p.farm*100+p.market*150+p.granary*200,0))}</td></tr>
          <tr><td><b>国库结余</b></td><td class="${G.treasury>=0?'text-green':'text-red'}"><b>${fmt(G.treasury)}两</b></td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-header">银行 <span class="sub">通胀 ${(G.inflation*100).toFixed(1)}%</span></div>
        <table>
          <tr><td>存款</td><td class="text-green">${fmt(G.playerBank.deposit)}两</td><td>年利率</td><td>${(G.depositRate*100).toFixed(1)}%</td></tr>
          <tr><td>贷款</td><td class="text-red">${fmt(G.playerBank.loan)}两</td><td>年利率</td><td>${(G.interestRate*100).toFixed(1)}%</td></tr>
        </table>
        <div class="flex flex-wrap gap-4 mt-8">
          <button class="btn btn-sm" onclick="bankAction('deposit')">存款</button>
          <button class="btn btn-sm" onclick="bankAction('withdraw')">取款</button>
          <button class="btn btn-sm" onclick="bankAction('loan')">贷款</button>
          <button class="btn btn-sm" onclick="bankAction('repay')">还贷</button>
        </div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header">市舶司（股市） <span class="sub">${G.companies.length}家 · 战争利好军工</span></div>
        <div style="max-height:320px;overflow-y:auto">
          <table>
            <tr><th>公司</th><th>板块</th><th>股价</th><th>持股</th><th>操作</th></tr>
            ${G.companies.map(c=>`<tr>
              <td>${c.name}</td>
              <td class="text-dim">${c.sector}</td>
              <td class="text-gold">${c.price}文</td>
              <td>${G.playersStocks[c.id]||0}</td>
              <td>
                <button class="btn btn-sm" onclick="tradeStock('${c.id}','buy')">买</button>
                ${(G.playersStocks[c.id]||0)>0?`<button class="btn btn-sm" onclick="tradeStock('${c.id}','sell')">卖</button>`:''}
              </td>
            </tr>`).join('')}
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header">期货市场 <span class="sub">价格与实物产出挂钩</span></div>
        <table>
          <tr><th>品种</th><th>现价</th><th>持仓</th><th>成本</th><th>操作</th></tr>
          ${Object.keys(futuresNames).map(k=>{
            const hold = G.playersFutures[k];
            return `<tr>
              <td>${futuresNames[k]}</td>
              <td class="text-gold">${G.futuresPrices[k]}文</td>
              <td>${hold?hold.qty:0}</td>
              <td>${hold?fmt(hold.cost):0}</td>
              <td>
                <button class="btn btn-sm" onclick="tradeFuture('${k}','buy')">买</button>
                ${hold&&hold.qty>0?`<button class="btn btn-sm" onclick="tradeFuture('${k}','sell')">卖</button>`:''}
              </td>
            </tr>`;
          }).join('')}
        </table>
        <div class="text-dim mt-8" style="font-size:11px">提示：饥荒→粮价涨；战争→铁/马涨；沿海繁荣→丝绸涨</div>
      </div>
    </div>`;
}

function bankAction(action){
  const titles = {deposit:'存款',withdraw:'取款',loan:'贷款',repay:'还贷'};
  const max = {deposit:Math.max(0,G.treasury),withdraw:G.playerBank.deposit,
    loan:Math.max(0,(G.taxIncome||5000)*3-G.playerBank.loan),repay:Math.min(Math.max(0,G.treasury),G.playerBank.loan)};
  showModal(titles[action],`
    <div class="mb-8">可操作上限：<b class="text-gold">${fmt(max[action])}两</b></div>
    <input id="bank-amt" type="number" min="1" max="${max[action]}" value="${Math.min(1000,max[action])||1}"
      style="width:100%;padding:8px;background:var(--bg-card);color:var(--text);border:1px solid var(--border)">
  `,[
    {text:'确认',cls:'btn-gold',fn:()=>{
      const amt = parseInt(document.getElementById('bank-amt').value)||0;
      if(amt<=0||amt>max[action]){addNotif('金额不合法','bad');return;}
      if(action==='deposit'){G.treasury-=amt;G.playerBank.deposit+=amt;}
      else if(action==='withdraw'){G.treasury+=amt;G.playerBank.deposit-=amt;}
      else if(action==='loan'){G.treasury+=amt;G.playerBank.loan+=amt;}
      else {G.treasury-=amt;G.playerBank.loan-=amt;}
      G.addLog(`银行${titles[action]}${fmt(amt)}两`,'info');
      closeModal(); renderPanels();
    }},
    {text:'取消',cls:'',fn:closeModal}
  ]);
}

function tradeStock(cid, action){
  const c = G.companies.find(x=>x.id===cid);
  if(!c) return;
  if(action==='buy'){
    const maxQty = Math.max(0, Math.floor(G.treasury/c.price));
    showModal(`买入 ${c.name}`,`
      <div>股价：<b class="text-gold">${c.price}文/股</b> · 可买 ${fmt(maxQty)} 股</div>
      <input id="stock-qty" type="number" min="1" max="${maxQty}" value="100" style="width:100%;padding:8px;margin:8px 0;background:var(--bg-card);color:var(--text);border:1px solid var(--border)">
    `,[
      {text:'买入',cls:'btn-gold',fn:()=>{
        const qty = parseInt(document.getElementById('stock-qty').value)||0;
        const cost = qty*c.price;
        if(qty<=0||cost>G.treasury){addNotif('资金不足','bad');return;}
        G.treasury-=cost;
        G.playersStocks[cid]=(G.playersStocks[cid]||0)+qty;
        G.addLog(`买入${c.name}${qty}股`,'info');
        closeModal(); renderPanels();
      }},
      {text:'取消',cls:'',fn:closeModal}
    ]);
  } else {
    const hold = G.playersStocks[cid]||0;
    showModal(`卖出 ${c.name}`,`
      <div>持股 ${fmt(hold)} · 股价 <b class="text-gold">${c.price}文</b></div>
      <input id="stock-qty" type="number" min="1" max="${hold}" value="${hold}" style="width:100%;padding:8px;margin:8px 0;background:var(--bg-card);color:var(--text);border:1px solid var(--border)">
    `,[
      {text:'卖出',cls:'btn-gold',fn:()=>{
        const qty = parseInt(document.getElementById('stock-qty').value)||0;
        if(qty<=0||qty>hold){addNotif('数量不合法','bad');return;}
        G.treasury+=qty*c.price;
        G.playersStocks[cid]-=qty;
        G.addLog(`卖出${c.name}${qty}股，得银${fmt(qty*c.price)}`,'good');
        closeModal(); renderPanels();
      }},
      {text:'取消',cls:'',fn:closeModal}
    ]);
  }
}

function tradeFuture(key, action){
  const names = {grain:'粮食',iron:'铁矿',salt:'盐',horse:'战马',silk:'丝绸'};
  const price = G.futuresPrices[key];
  if(action==='buy'){
    const maxQty = Math.max(0, Math.floor(G.treasury/price));
    showModal(`买入${names[key]}期货`,`
      <div>现价：<b class="text-gold">${price}文/单位</b> · 可买 ${fmt(maxQty)}</div>
      <input id="future-qty" type="number" min="1" max="${maxQty}" value="100" style="width:100%;padding:8px;margin:8px 0;background:var(--bg-card);color:var(--text);border:1px solid var(--border)">
    `,[
      {text:'买入',cls:'btn-gold',fn:()=>{
        const qty = parseInt(document.getElementById('future-qty').value)||0;
        const cost = qty*price;
        if(qty<=0||cost>G.treasury){addNotif('资金不足','bad');return;}
        G.treasury-=cost;
        if(!G.playersFutures[key]) G.playersFutures[key]={qty:0,cost:0};
        G.playersFutures[key].qty+=qty;
        G.playersFutures[key].cost+=cost;
        closeModal(); renderPanels();
      }},
      {text:'取消',cls:'',fn:closeModal}
    ]);
  } else {
    const hold = G.playersFutures[key];
    if(!hold||!hold.qty) return;
    const profit = hold.qty*price - hold.cost;
    showModal(`卖出${names[key]}期货`,`
      <div>持仓 ${fmt(hold.qty)} · 现价 ${price}文 · 预计盈亏 <span class="${profit>=0?'text-green':'text-red'}">${fmt(profit)}</span></div>
      <input id="future-qty" type="number" min="1" max="${hold.qty}" value="${hold.qty}" style="width:100%;padding:8px;margin:8px 0;background:var(--bg-card);color:var(--text);border:1px solid var(--border)">
    `,[
      {text:'卖出',cls:'btn-gold',fn:()=>{
        const qty = parseInt(document.getElementById('future-qty').value)||0;
        if(qty<=0||qty>hold.qty){addNotif('数量不合法','bad');return;}
        G.treasury+=qty*price;
        const costPart = Math.floor(hold.cost*qty/hold.qty);
        hold.qty-=qty; hold.cost-=costPart;
        if(hold.qty<=0) delete G.playersFutures[key];
        G.addLog(`卖出${names[key]}期货${qty}单位`,'info');
        closeModal(); renderPanels();
      }},
      {text:'取消',cls:'',fn:closeModal}
    ]);
  }
}

// ============================================================
// 天命·国策 — Part 5：外交/学派/科举/事件/奇观/弹劾/日志 + 弹窗与存档
// ============================================================

// ---------- 弹窗 ----------
function showModal(title, bodyHtml, buttons){
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  const footer = document.getElementById('modal-footer');
  footer.innerHTML = '';
  (buttons||[]).forEach(b=>{
    const btn = document.createElement('button');
    btn.className = 'btn ' + (b.cls||'');
    btn.textContent = b.text;
    btn.onclick = b.fn;
    footer.appendChild(btn);
  });
  document.getElementById('modal-overlay').classList.add('show');
}
function closeModal(){
  document.getElementById('modal-overlay').classList.remove('show');
}

// ---------- 外交 ----------
function renderDiplomacy(){
  const el = document.getElementById('panel-diplomacy');
  const relCls = r => r>30?'text-green':r>-10?'text-gold':'text-red';
  const typeIcon = {游牧:'🐎',藩属:'🎁',外邦:'🚢'};
  el.innerHTML = `
    <div class="card">
      <div class="card-header">天下形势 <span class="sub">纵横家当政：外交成功率+15% · 关系每年自然漂移</span></div>
      <table>
        <tr><th>国名</th><th>类型</th><th>关系</th><th>兵力</th><th>通商</th><th>状态</th><th>操作</th></tr>
        ${G.nations.map(n=>`<tr>
          <td class="text-gold">${typeIcon[n.type]||''} ${n.name}<div class="text-dim" style="font-size:10px">${n.desc}</div></td>
          <td class="text-dim">${n.type}</td>
          <td class="${relCls(n.relation)}">${n.relation}</td>
          <td>${fmt(n.army)}</td>
          <td>${n.trade?'<span class="text-green">互市中</span>':'—'}</td>
          <td>${G.atWarWith.includes(n.id)?'<span class="text-red">⚔ 交战</span>':n.tribute&&n.relation>40?'<span class="text-green">朝贡</span>':'<span class="text-dim">和平</span>'}</td>
          <td>
            <button class="btn btn-sm" onclick="diplomacyAction('${n.id}','envoy')">遣使</button>
            ${!n.trade&&n.relation>0?`<button class="btn btn-sm" onclick="diplomacyAction('${n.id}','trade')">通商</button>`:''}
            ${G.atWarWith.includes(n.id)?`<button class="btn btn-sm btn-green" onclick="diplomacyAction('${n.id}','peace')">议和</button>`
              :`<button class="btn btn-sm btn-red" onclick="openWarRoom('${n.id}')">出征</button>`}
          </td>
        </tr>`).join('')}
      </table>
    </div>
    <div class="card">
      <div class="card-header">战争名分 <span class="sub">有名分出征得加成，无名分天命-10</span></div>
      <table>
        <tr><th>名分</th><th>条件</th><th>效果</th><th>状态</th></tr>
        ${WAR_JUSTIFICATIONS.map(j=>{
          const has = G.warJustifications.includes(j.id);
          return `<tr>
            <td class="${has?'text-gold':'text-dim'}">${j.name}</td>
            <td class="text-dim">${j.desc}</td>
            <td class="text-dim">${j.bonus}</td>
            <td>${has?'<span class="text-green">✓ 可用</span>':'<span class="text-dim">未达成</span>'}</td>
          </tr>`;
        }).join('')}
      </table>
    </div>
    ${G.battles.length?`<div class="card">
      <div class="card-header">战史</div>
      <table>
        <tr><th>时间</th><th>战役</th><th>结果</th><th>我军损失</th><th>歼敌</th></tr>
        ${G.battles.map(b=>`<tr>
          <td class="text-dim">${b.era}${b.eraYear}年</td>
          <td>征${b.nation}</td>
          <td class="${b.win?'text-green':'text-red'}">${b.win?'大胜':'失利'}</td>
          <td>${fmt(b.myLoss)}</td><td>${fmt(b.enemyLoss)}</td>
        </tr>`).join('')}
      </table>
    </div>`:''}`;
}

function diplomacyAction(nationId, action){
  const n = G.nations.find(x=>x.id===nationId);
  if(!n) return;
  const dipBonus = isSchoolActive('zonghengjia') ? 0.15 : 0;
  if(action==='envoy'){
    if(G.adminPoints<8){ addNotif('行政点不足（需8）','bad'); return; }
    if(G.treasury<1000){ addNotif('国库不足（需1000两礼品）','bad'); return; }
    G.adminPoints-=8; G.treasury-=1000;
    const success = Math.random() < 0.7 + dipBonus + (n.relation/200);
    if(success){
      const gain = 8 + Math.floor(Math.random()*8);
      n.relation = Math.min(100, n.relation+gain);
      G.addLog(`遣使${n.name}，邦交改善（关系+${gain}）`,'good');
      addNotif(`🕊 ${n.name}关系+${gain}`,'good');
    } else {
      G.addLog(`遣使${n.name}，被拒之门外`,'bad');
      addNotif(`💢 ${n.name}拒绝遣使`,'bad');
    }
  } else if(action==='trade'){
    if(G.adminPoints<5){ addNotif('行政点不足（需5）','bad'); return; }
    G.adminPoints-=5;
    n.trade = 1;
    G.addLog(`与${n.name}开通互市，岁入增${Math.max(0,Math.floor(n.relation*20))}两`,'good');
    addNotif(`🚢 与${n.name}通商`,'good');
  } else if(action==='peace'){
    const cost = 5000 + Math.floor(n.army*0.05);
    if(G.treasury<cost){ addNotif(`议和需岁币${fmt(cost)}两`,'bad'); return; }
    showModal(`与${n.name}议和`,`
      <div>对方要求岁币 <b class="text-red">${fmt(cost)}两</b> 以罢兵。</div>
      <div class="text-dim mt-8">议和后关系回升，脱离战争状态。</div>
    `,[
      {text:'同意议和',cls:'btn-gold',fn:()=>{
        G.treasury-=cost;
        G.atWarWith = G.atWarWith.filter(id=>id!==nationId);
        n.relation = n.tribute ? 20 : -10;
        G.addLog(`与${n.name}议和，岁币${fmt(cost)}两`,'info');
        closeModal(); renderPanels();
      }},
      {text:'拒绝',cls:'',fn:closeModal}
    ]);
    return;
  }
  renderPanels(); updateTopBar();
}

// ---------- 学派 ----------
function renderSchools(){
  const el = document.getElementById('panel-schools');
  el.innerHTML = `
    <div class="card">
      <div class="card-header">诸子学派 <span class="sub">主流学派影响全国 · 转换需影响力支持</span></div>
      <table>
        <tr><th>学派</th><th>主张</th><th>效果</th><th>影响力</th><th>状态</th><th>操作</th></tr>
        ${G.schools.map(s=>{
          const inf = Math.floor(G.schoolInfluence[s.id]||0);
          const active = G.activeSchool===s.id;
          return `<tr>
            <td class="${active?'text-gold':''}"><b>${s.name}</b></td>
            <td class="text-dim">${s.desc}</td>
            <td class="text-dim" style="font-size:11px">${s.effect}</td>
            <td style="min-width:110px">${inf}<div class="progress-bar"><div class="fill ${active?'gold':'blue'}" style="width:${inf*2}%"></div></div></td>
            <td>${active?'<span class="text-gold">★ 主流</span>':'<span class="text-dim">在野</span>'}</td>
            <td>${active?'':`<button class="btn btn-sm" onclick="switchSchool('${s.id}')">尊奉</button>`}</td>
          </tr>`;
        }).join('')}
      </table>
    </div>
    <div class="card">
      <div class="card-header">当前国策效果 <span class="sub">${getActiveSchool().name} · ${getActiveSchool().desc}</span></div>
      <div class="text-gold">${getActiveSchool().effect}</div>
      <div class="text-dim mt-8" style="font-size:11px">提示：学派影响力每年自然漂移，尊奉学派可巩固其地位。礼部在任时天命恢复+1/年。</div>
    </div>`;
}

function switchSchool(id){
  const s = getSchool(id);
  if(!s) return;
  const inf = G.schoolInfluence[id]||0;
  const cost = Math.max(10, 40 - Math.floor(inf/2));
  if(G.adminPoints<cost){ addNotif(`行政点不足（需${cost}）`,'bad'); return; }
  showModal(`尊奉${s.name}`,`
    <div>确立<b class="text-gold">${s.name}</b>为治国主流学派。</div>
    <div class="mt-8"><b>效果：</b><span class="text-gold">${s.effect}</span></div>
    <div class="mt-8 text-dim">消耗行政点 ${cost}（影响力越高消耗越低）</div>
  `,[
    {text:'确立',cls:'btn-gold',fn:()=>{
      if(G.adminPoints<cost){ addNotif('行政点不足','bad'); return; }
      G.adminPoints-=cost;
      G.activeSchool=id;
      G.schoolInfluence[id]=Math.min(50,inf+10);
      G.addLog(`罢黜百家，独尊【${s.name}】`,'event');
      addNotif(`📖 ${s.name}成为主流学派`,'good');
      closeModal(); renderPanels();
    }},
    {text:'取消',cls:'',fn:closeModal}
  ]);
}

// ---------- 科举 ----------
function renderExam(){
  const el = document.getElementById('panel-exam');
  const pool = G.examPool||[];
  el.innerHTML = `
    <div class="card">
      <div class="card-header">开科取士 <span class="sub">人才池现有 ${pool.length} 人</span></div>
      <div class="text-dim mb-8">科举选拔人才入池，用于补任中央要职与地方巡抚。吏部在任：录取率+5%。</div>
      <div class="flex flex-wrap gap-4">
        <button class="btn btn-gold" onclick="holdExam('county')">院试（3000两，录6-10人）</button>
        <button class="btn btn-gold" onclick="holdExam('province')">乡试（8000两，录4-7人·质量更高）</button>
        <button class="btn btn-gold" onclick="holdExam('palace')">殿试（20000两，录2-4人·精英）</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">候补人才池 <span class="sub">能力>45可任中央要职 · >35可任地方官</span></div>
      ${pool.length?`<table>
        <tr><th>姓名</th><th>功名</th><th>年龄</th><th>能力</th><th>派系</th></tr>
        ${pool.sort((a,b)=>b.ability-a.ability).map(c=>`<tr>
          <td>${c.name}</td>
          <td class="text-gold">${c.level}</td>
          <td>${c.age}</td>
          <td><span class="${c.ability>70?'text-green':c.ability>45?'text-gold':'text-red'}">${c.ability}</span></td>
          <td class="text-dim">${c.faction||'无'}</td>
        </tr>`).join('')}
      </table>`:'<div class="text-dim">人才池为空，请开科取士</div>'}
    </div>`;
}

function holdExam(level){
  const cfg = {
    county:{cost:3000,min:6,max:10,base:25,spread:45,levels:['秀才','监生']},
    province:{cost:8000,min:4,max:7,base:40,spread:45,levels:['举人','贡生']},
    palace:{cost:20000,min:2,max:4,base:55,spread:45,levels:['状元','榜眼','探花','进士']}
  }[level];
  if(G.treasury<cfg.cost){ addNotif('国库不足','bad'); return; }
  if(G.adminPoints<10){ addNotif('行政点不足（需10）','bad'); return; }
  G.treasury-=cfg.cost;
  G.adminPoints-=10;
  const liBonus = hasOfficial('minister_li') ? 1 : 0;
  const n = cfg.min + Math.floor(Math.random()*(cfg.max-cfg.min+1)) + liBonus;
  const factions = ['东林','浙党','楚党','齐党','无'];
  const newTalents = [];
  for(let i=0;i<n;i++){
    const ability = Math.min(99, cfg.base + Math.floor(Math.random()*cfg.spread));
    const lvl = level==='palace' ? cfg.levels[Math.min(i,cfg.levels.length-1)] : cfg.levels[Math.floor(Math.random()*cfg.levels.length)];
    newTalents.push({
      id:'t_'+Date.now()+'_'+i, name:OFFICIAL_NAMES[Math.floor(Math.random()*OFFICIAL_NAMES.length)],
      level:lvl, age:20+Math.floor(Math.random()*25), ability,
      loyalty:50+Math.floor(Math.random()*45), corruption:5+Math.floor(Math.random()*30),
      faction:factions[Math.floor(Math.random()*factions.length)]
    });
  }
  G.examPool.push(...newTalents);
  const best = newTalents.reduce((a,b)=>a.ability>b.ability?a:b);
  G.addLog(`开科取士，录取${n}人，榜首${best.name}（${best.level}·能力${best.ability}）`,'good');
  addNotif(`🎓 科举录取${n}人`,'good');
  showModal('放榜',`
    <div class="text-gold mb-8">本次录取 ${n} 人</div>
    ${newTalents.sort((a,b)=>b.ability-a.ability).map(c=>`<div style="padding:4px 0;border-bottom:1px solid var(--border)">
      ${c.name}（${c.level}）· 能力<span class="text-green">${c.ability}</span> · ${c.age}岁</div>`).join('')}
  `,[{text:'张榜',cls:'btn-gold',fn:()=>{closeModal();renderPanels();}}]);
}

// ---------- 事件 ----------
function renderEvents(){
  const el = document.getElementById('panel-events');
  const typeColor = {天灾:'text-red',内政:'text-gold',吉兆:'text-green',动乱:'text-red',天象:'text-blue',外交:'text-gold'};
  el.innerHTML = `
    <div class="card">
      <div class="card-header">本年已触发事件</div>
      ${G.currentEvents.length?G.currentEvents.map(id=>{
        const e = EVENTS_POOL.find(x=>x.id===id);
        if(!e) return '';
        return `<div class="log-entry"><span class="${typeColor[e.type]||''}">【${e.type}】</span> <b>${e.name}</b> — ${e.desc}</div>`;
      }).join(''):'<div class="text-dim">本年四海升平</div>'}
    </div>
    <div class="card">
      <div class="card-header">天下事典 <span class="sub">事件按国家状态加权触发 · 阴阳家可预警天灾</span></div>
      <table>
        <tr><th>事件</th><th>类型</th><th>触发倾向</th></tr>
        ${EVENTS_POOL.map(e=>`<tr>
          <td class="text-gold">${e.name}</td>
          <td class="${typeColor[e.type]||'text-dim'}">${e.type}</td>
          <td class="text-dim">${e.desc}</td>
        </tr>`).join('')}
      </table>
    </div>`;
}

// ---------- 奇观 ----------
function renderWonders(){
  const el = document.getElementById('panel-wonders');
  el.innerHTML = `
    <div class="card">
      <div class="card-header">皇家奇观 <span class="sub">墨家当政：建造成本-20% · 工部在任：-15%</span></div>
      ${G.wonders.map(w=>{
        const stageName = w.done?'✦ 已竣工':w.stages[Math.min(w.stage,w.stages.length-1)];
        const pct = Math.floor(w.progress/w.cost*100);
        return `<div style="padding:12px;border:1px solid var(--border);border-radius:4px;margin-bottom:10px;${w.done?'border-color:var(--gold)':''}">
          <div class="flex" style="justify-content:space-between">
            <b class="text-gold" style="font-size:14px">${w.name} ${w.done?'✦':''}</b>
            <span class="text-dim">${stageName}</span>
          </div>
          <div class="text-dim" style="font-size:12px;margin:4px 0">${w.desc}</div>
          <div class="text-green" style="font-size:12px">效果：${w.effect}</div>
          <div class="progress-bar mt-8"><div class="fill ${w.done?'gold':'blue'}" style="width:${pct}%"></div></div>
          <div class="flex mt-8" style="justify-content:space-between">
            <span class="text-dim">投入 ${fmt(w.progress)} / ${fmt(w.cost)} 两（${pct}%）</span>
            ${w.done?'':`<button class="btn btn-sm btn-gold" onclick="investWonder('${w.id}')">拨款营造</button>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function investWonder(wid){
  const w = G.wonders.find(x=>x.id===wid);
  if(!w || w.done) return;
  const costMod = (isSchoolActive('mojia')?0.8:1) * (hasOfficial('minister_gong')?0.85:1);
  const remain = w.cost - w.progress;
  showModal(`拨款营造 · ${w.name}`,`
    <div>剩余工程需 <b class="text-gold">${fmt(remain)}两</b>（成本修正 ×${costMod.toFixed(2)}）</div>
    <div class="flex flex-wrap gap-4 mt-8">
      <button class="btn" onclick="doInvestWonder('${wid}',10000)">拨款 1万两</button>
      <button class="btn" onclick="doInvestWonder('${wid}',50000)">拨款 5万两</button>
      <button class="btn" onclick="doInvestWonder('${wid}',${remain})">一次拨足</button>
    </div>
  `,[{text:'取消',cls:'',fn:closeModal}]);
}

function doInvestWonder(wid, amt){
  const w = G.wonders.find(x=>x.id===wid);
  if(!w || w.done) return;
  const costMod = (isSchoolActive('mojia')?0.8:1) * (hasOfficial('minister_gong')?0.85:1);
  const realAmt = Math.min(amt, Math.ceil((w.cost-w.progress)*costMod));
  if(G.treasury<realAmt){ addNotif('国库不足','bad'); return; }
  G.treasury -= realAmt;
  w.progress += Math.floor(realAmt/costMod);
  if(w.progress >= w.cost){
    w.done = true; w.progress = w.cost;
    G.tianming = Math.min(100, G.tianming+5);
    G.stability = Math.min(100, G.stability+5);
    G.addLog(`奇观【${w.name}】竣工！${w.effect}`,'event');
    addNotif(`🏗 ${w.name}竣工！天命+5`,'good');
  } else {
    const newStage = Math.min(w.stages.length-1, Math.floor(w.progress/w.cost*w.stages.length));
    if(newStage>w.stage){ w.stage=newStage; G.addLog(`${w.name}工程推进至【${w.stages[newStage]}】`,'good'); }
    G.addLog(`拨款${fmt(realAmt)}两营造${w.name}`,'info');
  }
  closeModal(); renderPanels(); updateTopBar();
}

// ---------- 弹劾 ----------
function renderImpeach(){
  const el = document.getElementById('panel-impeach');
  const cases = G.impeachCases;
  el.innerHTML = `
    <div class="card">
      <div class="card-header">都察院 · 弹劾案 <span class="sub">刑部在任：成功率+15% · 法家：+10%</span></div>
      ${cases.length?`<table>
        <tr><th>被劾官员</th><th>罪名</th><th>证据</th><th>状态</th><th>处置</th></tr>
        ${cases.map(c=>`<tr>
          <td class="text-gold">${c.position} ${c.name}</td>
          <td>${c.crime}</td>
          <td class="${c.evidence>60?'text-green':'text-gold'}">${c.evidence}%</td>
          <td>${c.status==='待审'?'<span class="text-gold">待审</span>':c.status==='定罪'?'<span class="text-red">已定罪</span>':'<span class="text-dim">已了结</span>'}</td>
          <td>${c.status==='待审'?`
            <button class="btn btn-sm" onclick="investigateCase(${JSON.stringify(c.id).replace(/"/g,'&quot;')})">彻查</button>
            <button class="btn btn-sm btn-red" onclick="judgeCase(${JSON.stringify(c.id).replace(/"/g,'&quot;')},'guilty')">定罪革职</button>
            <button class="btn btn-sm" onclick="judgeCase(${JSON.stringify(c.id).replace(/"/g,'&quot;')},'dismiss')">驳回</button>`:'—'}</td>
        </tr>`).join('')}
      </table>`:'<div class="text-dim">当前无弹劾案件。官员腐败过高时，都察院会自动发起弹劾。</div>'}
    </div>
    <div class="card">
      <div class="card-header">整肃说明</div>
      <div class="text-dim" style="font-size:12px;line-height:1.8">
        · 彻查：消耗3000两与5行政点，提升证据强度<br>
        · 定罪革职：证据≥50%成功率较高，成功则该官员革职、腐败值清零，失败则稳定-3<br>
        · 驳回：了结案件，该官员忠诚-10（心生怨望）<br>
        · 左都御史能力越高，每年发现贪腐案件的概率越大
      </div>
    </div>`;
}

function investigateCase(cid){
  const c = G.impeachCases.find(x=>x.id===cid);
  if(!c) return;
  if(G.treasury<3000){ addNotif('国库不足（需3000两）','bad'); return; }
  if(G.adminPoints<5){ addNotif('行政点不足（需5）','bad'); return; }
  G.treasury-=3000; G.adminPoints-=5;
  const gain = 10+Math.floor(Math.random()*20);
  c.evidence = Math.min(100, c.evidence+gain);
  G.addLog(`彻查${c.name}案，证据+${gain}（现${c.evidence}%）`,'info');
  addNotif(`🔍 证据+${gain}`,'info');
  renderPanels();
}

function judgeCase(cid, verdict){
  const c = G.impeachCases.find(x=>x.id===cid);
  if(!c) return;
  if(verdict==='dismiss'){
    c.status='了结';
    const o = G.officials.find(x=>x.id===c.officialId);
    if(o && !o.empty) o.loyalty = Math.max(0, o.loyalty-10);
    G.addLog(`${c.name}案驳回，其人心生怨望`,'info');
    renderPanels(); return;
  }
  const successRate = c.evidence/100 * (hasOfficial('minister_xing')?1.15:1) * (isSchoolActive('fajia')?1.1:1);
  if(Math.random() < successRate){
    c.status='定罪';
    const o = G.officials.find(x=>x.id===c.officialId);
    if(o && !o.empty){
      o.empty = true;
      if(o.province){ const p = G.getProvince(o.province); if(p){p.officialId=null;p.officialName=null;} }
    }
    G.stability = Math.min(100, G.stability+2);
    G.tianming = Math.min(100, G.tianming+1);
    G.addLog(`${c.position}${c.name}罪证确凿，革职查办，家产充公`,'good');
    addNotif(`⚖ ${c.name}伏法！稳定+2`,'good');
    G.treasury += 2000+Math.floor(Math.random()*5000);
  } else {
    c.status='了结';
    G.stability = Math.max(0, G.stability-3);
    G.addLog(`${c.name}案证据不足，不了了之，朝野非议`,'bad');
    addNotif('📜 弹劾失败，稳定-3','bad');
  }
  renderPanels(); updateTopBar();
}

// ---------- 起居注 ----------
function renderLog(){
  const el = document.getElementById('panel-log');
  el.innerHTML = `
    <div class="card">
      <div class="card-header">起居注 <span class="sub">记录王朝大事 · 最多保留300条</span></div>
      <div id="log-panel">
        ${G.log.map(l=>`<div class="log-entry log-${l.type}"><span class="text-dim">[${l.era}${l.eraYear}年]</span> ${l.msg}</div>`).join('')||'<div class="text-dim">暂无记录</div>'}
      </div>
    </div>`;
}

// ---------- 云存档 ----------
async function cloudSave(){
  if(!currentUser){ addNotif('请先登录','bad'); return; }
  try {
    const plain = JSON.parse(JSON.stringify(G, (k,v)=>typeof v==='function'?undefined:v));
    const res = await fetch('/api/game/save', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({data:plain})
    });
    const data = await res.json();
    if(data.ok){
      addNotif('☁ 云端存档成功','good');
      document.getElementById('save-status').textContent = '已存档 '+new Date().toLocaleTimeString('zh-CN');
    } else addNotif(data.error||'存档失败','bad');
  } catch(e){ addNotif('存档失败：'+e.message,'bad'); }
}

async function cloudLoad(){
  if(!currentUser){ addNotif('请先登录','bad'); return; }
  try {
    const res = await fetch('/api/game/save');
    const data = await res.json();
    if(!data.save){ addNotif('云端无存档','bad'); return; }
    loadFromPlain(JSON.parse(data.save));
    addNotif('☁ 云档读取成功','good');
  } catch(e){ addNotif('读档失败：'+e.message,'bad'); }
}

function loadFromPlain(plain){
  G = plain;
  G.addLog = function(msg,type='info'){
    this.log.unshift({year:this.year,era:this.era,eraYear:this.eraYear,msg,type});
    if(this.log.length>300)this.log.pop();
  };
  G.addNotif = function(msg,type='info'){ addNotif(msg,type); };
  G.getProvince = function(id){ return this.provinces.find(p=>p.id===id); };
  G.getOfficial = function(id){ return this.officials.find(o=>o.id===id); };
  G.fireOfficial = function(o){ o.empty = true; this.addLog(`${o.name}（${o.position}）被革职`,'event'); };
  if(!G.examPool) G.examPool = [];
  if(!G.playersStocks) G.playersStocks = {};
  if(!G.playersFutures) G.playersFutures = {};
  if(!G.playerBank) G.playerBank = {deposit:0,loan:0};
  updateAll();
}

function exportSave(){
  if(!G) return;
  const plain = JSON.parse(JSON.stringify(G, (k,v)=>typeof v==='function'?undefined:v));
  const blob = new Blob([JSON.stringify(plain,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `天命国策_${G.era}${G.eraYear}年.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// 新开局（登录后若无云档则自动创建）
function startNewGame(){
  G = createGame();
  updateAll();
}
