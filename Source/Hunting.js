////////////////////////////////////////////////////////////////////////////////
// 제작자/저작권자 : 카카오톡 봇 커뮤니티 - 로젠다로 , Morph's House - 모프
// 커뮤니티 : https://cafe.naver.com/nameyee,
// 개발자 블로그 : https://blog.naver.com/highkrs
// 소스 버전 : v1.0
// 관련 소스는 무료 배포용입니다.
// 사용, 복사, 수정을 허용하되 저작권자를 반드시 표기해야합니다.
// 해당 소스의 오류, 버그로 인하여 발생한 손해 및 어떠한 클래임도 책임지지 않습니다.
// 해당 소스로 상업적/불법적인 행위로 발생한 모든 책임을 지지 않습니다.
////////////////////////////////////////////////////////////////////////////////

const libConst = Bridge.getScopeOf("Const.js"); // const 변수들 Lib
const libCommon = Bridge.getScopeOf("Common.js"); // 일반 function Lib

var db_Manager = Bridge.getScopeOf("DataBase.js").DBManager(); // 데이터 담당 객체

function Hunting(_recordManager, _petManager, _eventManager) {
    const CriticalRate = libConst.CriticalDamageRate;
    const IncCriMaxDmg = libConst.IncCriticalMaxDamage;
    const RateWeight = libConst.RateWeight;
    const Not_MatchKey = -1;
    const Not_ProvoTarget = -9999;
    const FIGHTKIND = {NORMAL:0, WORLDBOSS:1, DUNGEON:2};
    const WorldbossParam = function(_kind, _hp){
        this.kind = _kind;
        this.remainHP = _hp;
        this.accumulateDamage = 0;
    };

    var RecordManager = _recordManager;
    var PetManager = _petManager;
    var EventManager = _eventManager;
    var _Start, _Tower, _Dungeon, _CreateMonster, _CreateTowerMonster, _CreateDungeonMonster, _GainMapClearItem, _StartWorldBoss, _SetSummonMonster, _Fight, _PartyFight, _JudgAttack, _JudgAvoid, _JudgDrop,
        _JudgSummonSkill, _JudgSkill, _JudgHealSkill, _JudgCureSkill, _JudbMerSkill, _JudgMerHealSkill, _JudgMerCureSkill, _JudgCC,
        _JudgMobSkill, _JudgMobHealSkill, _JudgMobCureSkill, _JudgPotion,
        _JudgQuestCount, _getOurAbility, _getPoint, _setPoint, _MaxAttSpdCounter,
        _JudbSmnSkill, _JudgSmnHealSkill, _JudgSmnCureSkill,
        _JudgHealPartySkill, _JudgCurePartySkill, _JudgPartyDrop, _JudgSmnHealPartySkill, _JudgSmnCurePartySkill;
    var _AvoidCalc, _CriCalc, _CriCalcDamage, _AttCalcDamage, _SkillCalcDamage, _AuraCalc, _getCurrVitality;
    var _RemoveCC, _isSummonMob, _addRecordMob;

    _Start = function(_userObj, _count, _option, _summonitem, _boss, _mercentlist, _MercenaryManager, _rank, _needap) {
        var rtnStr = "";
        var tmpMobList, MobJsonList;
        var battlebuff = db_Manager.getBattleBuff(_rank);
        var userMaxPoint = {HP : _userObj.getMaxPoint("hp"),
                            MP : _userObj.getMaxPoint("mp"),
                            SP : _userObj.getMaxPoint("sp"),
                            DP : _userObj.getMaxPoint("dp")};

        var petBuff_rune = 1 + PetManager.getBuffAmountByKind(_userObj.name, "rune") / 100;
        var petBuff_drop = 1 + PetManager.getBuffAmountByKind(_userObj.name, "drop") / 100;
        var petBuff_die = PetManager.getBuffAmountByKind(_userObj.name, "die");

        var result = {result:false, nofight:false};

        if(battlebuff !== null) {
            rtnStr += "현재 결장 랭킹 : " + _rank + "위 관련 버프\n" +
                      "  L " + battlebuff.obtainrune + "배의 룬 획득\n" +
                      "  L " + battlebuff.probability + "배의 아이템 획득확률 증가\n" +
                      "  L " + battlebuff.amount + "배의 최종 데미지 증가가 됩니다.\n";
        }
        if(petBuff_rune !== 1 || petBuff_drop !== 1 || petBuff_die !== 0) {
            rtnStr += libConst.Pet_Name + "가 축복을 합니다\n" +
                    (petBuff_rune === 1?"":"  L " + petBuff_rune + "배의 룬 획득\n") +
                    (petBuff_drop === 1?"":"  L " + petBuff_drop + "배의 아이템 획득확률 증가\n") +
                    (petBuff_die === 0?"":"  L 죽었을 시 룬소모 " + petBuff_die + "% 감소\n");
        }
        for(var i = 0; i < _count; ++i) {
            tmpMobList = _CreateMonster(_userObj, _boss);

            if(_userObj.getAbility().ap < _needap) {
                rtnStr += "현재 행동력이 없으므로 전투 종료합니다.\n\n  - 필요 행동력 : " + _needap;
                break;
            }
            if(_userObj.getAbility().hp === 0) {
                rtnStr += "현재 체력이 없으므로 전투를 종료합니다.";
                break;
            }
            if(_summonitem !== null) {
                if(_userObj.isItem(libConst.ITEM_KIND.SUNDRYITEM, _summonitem)) {
                    _userObj.removeItem(libConst.ITEM_KIND.SUNDRYITEM, _summonitem, 1);
                    rtnStr += "소환 아이템을 소모합니다. - " + db_Manager.getSundryItem(_summonitem).name + "\n";
                }
                else {
                    rtnStr += "보스 소환 아이템이 부족하여 전투를 종료합니다.";
                    break;
                }
            }

            rtnStr += "\n====== 제" + (i+1) + "전투 ======\n";
            _userObj.getAbility().ap -= _needap;
            rtnStr += "  - 행동력 소모 : " + _needap + ", 현재 ap :  " + _userObj.getAbility().ap + "\n";
            _userObj.removeBuffCount();

            MobJsonList = [];
            for(var j = 0; j < tmpMobList.length; ++j) {
                MobJsonList.push(db_Manager.getMonster(tmpMobList[j]));
            }
            rtnStr += _Fight(_userObj, MobJsonList, _option, new WorldbossParam(FIGHTKIND.NORMAL, -1), _mercentlist, _MercenaryManager, battlebuff, userMaxPoint, result);

            if(result.nofight) {
                _userObj.getAbility().ap += _needap;
                rtnStr = "전투 가능한 유닛이 없습니다.";
            }
        }
        return rtnStr;
    };
    _Tower = function(_userObj, _option, _mercentlist, _MercenaryManager, _rank, _result) {
        var rtnStr = "";
        var MobJsonList;
        var battlebuff = db_Manager.getBattleBuff(_rank);
        var userMaxPoint = {HP : _userObj.getMaxPoint("hp"),
                            MP : _userObj.getMaxPoint("mp"),
                            SP : _userObj.getMaxPoint("sp"),
                            DP : _userObj.getMaxPoint("dp")};

        var petBuff_rune = 1 + PetManager.getBuffAmountByKind(_userObj.name, "rune") / 100;
        var petBuff_drop = 1 + PetManager.getBuffAmountByKind(_userObj.name, "drop") / 100;
        var petBuff_die = PetManager.getBuffAmountByKind(_userObj.name, "die");

        if(battlebuff !== null) {
            rtnStr += "현재 결장 랭킹 : " + _rank + "위 관련 버프\n" +
                      "  L " + battlebuff.obtainrune + "배의 룬 획득\n" +
                      "  L " + battlebuff.probability + "배의 아이템 획득확률 증가\n" +
                      "  L " + battlebuff.amount + "배의 최종 데미지 증가가 됩니다.\n";
        }
        if(petBuff_rune !== 1 || petBuff_drop !== 1 || petBuff_die !== 0) {
            rtnStr += libConst.Pet_Name + "가 축복을 합니다\n" +
                    (petBuff_rune === 1?"":"  L " + petBuff_rune + "배의 룬 획득\n") +
                    (petBuff_drop === 1?"":"  L " + petBuff_drop + "배의 아이템 획득확률 증가\n") +
                    (petBuff_die === 0?"":"  L 죽었을 시 룬소모 " + petBuff_die + "% 감소\n");
        }
        if(_userObj.getAbility().hp === 0) {
            rtnStr += "현재 체력이 없으므로 전투를 종료합니다.";
            return rtnStr;
        }

        MobJsonList = _CreateTowerMonster(_userObj);
        rtnStr += _Fight(_userObj, MobJsonList, _option, new WorldbossParam(FIGHTKIND.NORMAL, -1), _mercentlist, _MercenaryManager, battlebuff, userMaxPoint, _result);

        if(_result.nofight) {
            rtnStr = "전투 가능한 유닛이 없습니다.";
        }

        return rtnStr;
    };
    _Dungeon = function(_userList, _optList, _map, _captain, _isoccupy, _result) {
        var rtnStr = "";
        var tmpMobList, MobJsonList;
        var userMaxPointList = [];
        var result = {result:false};
        var i;

        for(i = 0; i < _userList.length; ++i) {
            userMaxPointList.push({HP : _userList[i].getMaxPoint("hp"),
                                   MP : _userList[i].getMaxPoint("mp"),
                                   SP : _userList[i].getMaxPoint("sp"),
                                   DP : _userList[i].getMaxPoint("dp")});
        }

        MobJsonList = _CreateDungeonMonster(_map);

        //(_userObj, _moblist, _option, _WBParam, _mercentlist, _MercenaryManager, _b_buff, _userMaxPoint, _result)
        rtnStr += _PartyFight(_userList, MobJsonList, _optList, userMaxPointList, result);
        if(result.result) {
            rtnStr += "\n" + _map.Name + "을(를) 클리어 하였습니다.\n";
            _map.isClear = true;
            rtnStr += "(클리어 보상)\n";
            rtnStr += _GainMapClearItem(_map, _userList);


            if(_map.Gate === "exit") {
                rtnStr += "던전 출구를 클리어 하여, 던전을 종료 합니다.";
                for(i = 0; i < _userList.length; ++i) {
                    if(_userList[i].name === _captain)
                        _userList[i].setDungeonLocation(null);
                    _userList[i].setIsDungeon(false, "all");

                    if(_isoccupy)
                        _result.complate = true; 
                }
            }
        }
        return rtnStr;
    };
    _CreateMonster = function(_userObj, _boss) {
        var FieldInfo = db_Manager.getField(_userObj.getLocation().field);
        var MobCount = libCommon.Rand(1,FieldInfo.mobcount);
        var Regen_MobList = FieldInfo.monster;
        var rtnArray = [];

        for(var i = 0; i < MobCount; ++i) {
            if(i === 0 && _boss !== null){
                rtnArray.push(_boss);
                continue;
            }
            rtnArray.push(Regen_MobList[libCommon.Rand(0,Regen_MobList.length - 1)]);
        }
        return rtnArray;
    };
    _CreateTowerMonster = function(_userObj) {
        var rtnArray = [];
        var floor = _userObj.getTowerFloor();
        var loc = _userObj.getLocation();
        if(floor === null) {
            floor = _userObj.makeTowerFloor();
        }
        var towerdb = db_Manager.getTower("" + floor.floor, loc.city, loc.facility);
        var moblist = towerdb.towermob, towermob;
        var mobdb;

        for(var i = 0; i < moblist.length; ++i) {
            towermob = db_Manager.getTowerMob(moblist[i]);
            mobdb = db_Manager.getMonster(towermob.mobindex);
            for(var j = 0; j < Number(towermob.count); ++j) {
                rtnArray.push({
                    index : mobdb.index,
                    droprune : "0~0",
                    name : mobdb.name,
                    description : mobdb.description,
                    ability :{ attack : Math.floor(Number(mobdb.ability.attack) * Number(towermob.powerrate)),
                              magic : Math.floor(Number(mobdb.ability.magic) * Number(towermob.powerrate)),
                              defense : Math.floor(Number(mobdb.ability.defense) * Number(towermob.powerrate)),
                              atkspeed : Math.floor(Number(mobdb.ability.atkspeed) * Number(towermob.powerrate)),
                              accuracy : Math.floor(Number(mobdb.ability.accuracy) * Number(towermob.powerrate)),
                              avoid : Math.floor(Number(mobdb.ability.avoid) * Number(towermob.powerrate)),
                              critical : Math.floor(Number(mobdb.ability.critical) * Number(towermob.powerrate)),
                              hp : Math.floor(Number(mobdb.ability.hp) * Number(towermob.powerrate)),
                              mp : Math.floor(Number(mobdb.ability.mp) * Number(towermob.powerrate)),
                              sp : Math.floor(Number(mobdb.ability.sp) * Number(towermob.powerrate))},
                    skill :mobdb.skill,
                    skillrate:mobdb.skillrate,
                    exp : mobdb.exp,
                    dropItem :[]
                });
            }
        }
        return rtnArray;
    };
    _CreateDungeonMonster = function(_map) {
        var MapInfo = db_Manager.getDungeonMap(_map.Index);
        var MobCount = Number(MapInfo.mobcount);
        var Regen_MobList = MapInfo.monster;
        var Regen_Boss = MapInfo.boss;
        var rtnArray = [], mobdb, randMob;
        if(Regen_Boss !== "") {
            mobdb = db_Manager.getMonster(Regen_Boss);
            rtnArray.push({
                index : mobdb.index,
                droprune : mobdb.droprune,
                name : mobdb.name,
                description : mobdb.description,
                ability :{ attack : Math.floor(Number(mobdb.ability.attack) * Number(MapInfo.powerrate)),
                          magic : Math.floor(Number(mobdb.ability.magic) * Number(MapInfo.powerrate)),
                          defense : Math.floor(Number(mobdb.ability.defense) * Number(MapInfo.powerrate)),
                          atkspeed : Math.floor(Number(mobdb.ability.atkspeed) * Number(MapInfo.powerrate)),
                          accuracy : Math.floor(Number(mobdb.ability.accuracy) * Number(MapInfo.powerrate)),
                          avoid : Math.floor(Number(mobdb.ability.avoid) * Number(MapInfo.powerrate)),
                          critical : Math.floor(Number(mobdb.ability.critical) * Number(MapInfo.powerrate)),
                          hp : Math.floor(Number(mobdb.ability.hp) * Number(MapInfo.powerrate)),
                          mp : Math.floor(Number(mobdb.ability.mp) * Number(MapInfo.powerrate)),
                          sp : Math.floor(Number(mobdb.ability.sp) * Number(MapInfo.powerrate))},
                skill :mobdb.skill,
                skillrate:mobdb.skillrate,
                exp : mobdb.exp,
                dropItem :mobdb.dropItem
            });
        }
        for(var i = 0; i < MobCount; ++i) {
            randMob = Regen_MobList[libCommon.Rand(0,Regen_MobList.length - 1)];
            mobdb = db_Manager.getMonster(randMob);
            rtnArray.push({
                index : mobdb.index,
                droprune : mobdb.droprune,
                name : mobdb.name,
                description : mobdb.description,
                ability :{ attack : Math.floor(Number(mobdb.ability.attack) * Number(MapInfo.powerrate)),
                          magic : Math.floor(Number(mobdb.ability.magic) * Number(MapInfo.powerrate)),
                          defense : Math.floor(Number(mobdb.ability.defense) * Number(MapInfo.powerrate)),
                          atkspeed : Math.floor(Number(mobdb.ability.atkspeed) * Number(MapInfo.powerrate)),
                          accuracy : Math.floor(Number(mobdb.ability.accuracy) * Number(MapInfo.powerrate)),
                          avoid : Math.floor(Number(mobdb.ability.avoid) * Number(MapInfo.powerrate)),
                          critical : Math.floor(Number(mobdb.ability.critical) * Number(MapInfo.powerrate)),
                          hp : Math.floor(Number(mobdb.ability.hp) * Number(MapInfo.powerrate)),
                          mp : Math.floor(Number(mobdb.ability.mp) * Number(MapInfo.powerrate)),
                          sp : Math.floor(Number(mobdb.ability.sp) * Number(MapInfo.powerrate))},
                skill :mobdb.skill,
                skillrate:mobdb.skillrate,
                exp : mobdb.exp,
                dropItem :mobdb.dropItem
            });
        }
        return rtnArray;
    };
    _GainMapClearItem = function(_map, _userlist) {
        var MapInfo = db_Manager.getDungeonMap(_map.Index);
        var items = MapInfo.item;
        var judgment, item, rtnStr = "", ItemDB = null;
        for(var i = 0; i < _userlist.length; ++i) {
            rtnStr += " - " + _userlist[i].name + "보상 내역 \n";
            _userlist[i].addRune(Number(MapInfo.rune));
            RecordManager.rcdMaxRune(_userlist[i].name, Number(MapInfo.rune));
            rtnStr += "   L " + MapInfo.rune + " Rune \n";
            for(var j = 0; j < items.length; ++j) {
                item = items[j];
                judgment = libCommon.Randfloat(0,100);
                if(judgment <= Number(item.droprate)) {
                    ItemDB = db_Manager.getItem(item.itemkind, item.itemIdx);
                    _userlist[i].addItem(item.itemkind, item.itemIdx, item.count, (item.strength===""?0:Number(item.strength)));
                    rtnStr += "   L " + ItemDB.name + (item.strength===""?"":("+" + item.strength)) + " x" + item.count + "\n";
                }
            }
        }
        return rtnStr;
    };
    _StartWorldBoss = function(_userObj, _option, _wbstatus, _mercentlist, _MercenaryManager, _rank) {
        var rtnStr = "";
        var MobJsonList = [];
        var battlebuff = db_Manager.getBattleBuff(_rank);
        var userMaxPoint = {HP : _userObj.getMaxPoint("hp"),
                            MP : _userObj.getMaxPoint("mp"),
                            SP : _userObj.getMaxPoint("sp"),
                            DP : _userObj.getMaxPoint("dp")};

        var petBuff_rune = 1 + PetManager.getBuffAmountByKind(_userObj.name, "rune") / 100;
        var petBuff_drop = 1 + PetManager.getBuffAmountByKind(_userObj.name, "drop") / 100;
        var petBuff_die = PetManager.getBuffAmountByKind(_userObj.name, "die");

        var result = {result:false};

        if(battlebuff !== null) {
            rtnStr += "현재 결장 랭킹 : " + _rank + "위 관련 버프\n" +
                      "  L " + battlebuff.obtainrune + "배의 룬 획득\n" +
                      "  L " + battlebuff.probability + "배의 아이템 획득확률 증가\n" +
                      "  L " + battlebuff.amount + "배의 최종 데미지 증가가 됩니다.\n";
        }
        if(petBuff_rune !== 1 || petBuff_drop !== 1 || petBuff_die !== 0) {
            rtnStr += libConst.Pet_Name + "가 축복을 합니다\n" +
                    (petBuff_rune === 1?"":"  L " + petBuff_rune + "배의 룬 획득\n") +
                    (petBuff_drop === 1?"":"  L " + petBuff_drop + "배의 아이템 획득확률 증가\n") +
                    (petBuff_die === 0?"":"  L 죽었을 시 룬소모 " + petBuff_die + "% 감소\n");
        }

        if(_userObj.getAbility().ap <= 0) {
            rtnStr += "현재 행동력이 없으므로 전투 종료합니다.";
            return rtnStr;
        }
        if(_userObj.getAbility().hp === 0) {
            rtnStr += "현재 체력이 없으므로 전투를 종료합니다.";
            return rtnStr;
        }

        rtnStr += "\n====== 월드보스 전투 시작 ======\n";
        (_userObj.getAbility().ap)--;
        rtnStr += "  - 행동력 소모 : 1, 현재 ap :  " + _userObj.getAbility().ap + "\n";

        MobJsonList.push(db_Manager.getMonster(_wbstatus.index));
        var param = new WorldbossParam(FIGHTKIND.WORLDBOSS, _wbstatus.getHP());
        rtnStr += _Fight(_userObj, MobJsonList, _option, param, _mercentlist, _MercenaryManager, battlebuff, userMaxPoint, result);
        _wbstatus.removeHP(_userObj.name, param.accumulateDamage);
        return rtnStr;
    };
    _SetSummonMonster = function(_userObj, _opt) {
        var rtnArray = [], skill, summonMob, obj, userAbility;
        var summonOpt = _opt.getSummonSkillOpt();

        for(var i = 0; i < summonOpt.length; ++i) {
            skill = db_Manager.getSummonSkill(summonOpt[i].index);
            summonMob = db_Manager.getSummonMonster(skill.unit);
            userAbility = _userObj.getAbility();

            obj = {
                index:i,
                skillidx:skill.index,
                mobidx:skill.unit,
                count:Number(skill.count),
                needturn:summonOpt[i].turn,
                mobname:summonMob.name + " Lv." + (1 + Math.floor(userAbility[summonMob.type] / Number(summonMob.rate))),
                skillname:skill.name,
                needdp:skill.needdp,
                keepturn:Number(summonMob.keepturn),
                ability:{
                    attack:Number(summonMob.ability.attack) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.attack))),
                    magic:Number(summonMob.ability.magic) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.magic))),
                    defense:Number(summonMob.ability.defense) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.defense))),
                    atkspeed:Number(summonMob.ability.atkspeed) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.atkspeed))),
                    accuracy:Number(summonMob.ability.accuracy) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.accuracy))),
                    avoid:Number(summonMob.ability.avoid) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.avoid))),
                    critical:Number(summonMob.ability.critical) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.critical))),
                    hp:Number(summonMob.ability.hp) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.hp))),
                    mp:Number(summonMob.ability.mp) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.mp))),
                    sp:Number(summonMob.ability.sp) + (Math.floor((userAbility[summonMob.type] / Number(summonMob.rate)) * Number(summonMob.increase.sp)))
                },
                skill:summonMob.skill,
                skillrate:summonMob.skillrate
            };
            rtnArray.push(obj);
        }
        return rtnArray;
    };
    _Fight = function(_userObj, _moblist, _option, _WBParam, _mercentlist, _MercenaryManager, _b_buff, _userMaxPoint, _result) {
        var AttMaxSpd = libConst.MinAttackSpeedCounter;
        var rtnStr = "", userDeathFlag = false, i, j, hs, totalCnt = 0, c, r;
        var mobretireList = []; // {mob, hp, mp, sp}
        var mobattspdCounter = [],
            mobAttspd = [],
            mobCC = [],
            mobEffect = [],
            mobHP = [],
            mobMP = [],
            mobSP = [];

        var ourList = [];
        var retireList = [];
        
        var BattleLogFlag = (_option.getHuntingOpt() === "Y"?false:true);
        var userattspdCounter = 0,
            userAttspd = _userObj.getAbility().atkspeed,
            userMaxHP = _userMaxPoint.HP,
            userMaxMP = _userMaxPoint.MP,
            userMaxSP = _userMaxPoint.SP,
            userMaxDP = _userMaxPoint.DP,
            userSkillCoolTime = [],
            userHealSkillCoolTime = [],
            userCC = {name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0},
            userEffect = {n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false};

        var merattspdCounter = [],
            merAttspd = [],
            merCC = [],
            merEffect = [],
            merAura = [],
            merMatchingTable = [];

        var summonDB = [];
        var summonlist = [],
            smnattspdCounter = [],
            smnAttspd = [],
            smnCC = [],
            smnEffect = [];

        var tmpDamage, // 최종 데미지
            tmpCri = {cri:0}, // 크리 여부
            tmpHp, // 데미지 적용전 HP
            selMob, //유저가 떄릴 예정인 몹
            targetMob, // 행동할 몹
            tmpSkill, //스킬 판정후 결과값
            tmpCc,  // CC 계산된 데미지
            tmpHealing, // 힐 스킬 판정 결과값
            tmpPotion, // 옵션에 설정된 포션의 DB 값
            tmpCCRecovery, // 상태이상회복 판정 결과값
            tmpSummonSkill; // 소환스킬 판정 결과값

        var tmpOur,   // 유저 와 용병 타겟 인덱스
            tmpOurIdx, // ourList의 타겟 인덱스
            mercentidx, // 이번 턴의 용병의 인덱스
            targetmercent, // 이번 턴의 행동할 용병
            targetMercentDB; // 이번 턴의 행동할 용병 DB정보

        var summonIdx, // ourList 에서 가져와서 소환물 인덱스
            summonOriginIdx,
            targetsummon,
            targetSummonDB;

        var recordMobList = []; // 잡은 몹의 인덱스를 저장해둔다. {index, count}
        var recordRune = {rune:0};

        var tmpAbility;
        var tmpSubAbility;

        var A = _AuraCalc; // 'a', 'c', 'v', 'd', 'r', 's', 'm' : attack, critical, avoid, defense, accuracy, atkspeed, magic

        if(libConst.UserJoinBattleYN) {
            ourList.push(-1);
            for(i = 0; i <= libConst.SkillSpace; ++i) {
                userSkillCoolTime[i] = 0;
            }
            for(i = 0; i <= libConst.HealSkillSpace; ++i) {
                userHealSkillCoolTime[i] = 0;
            }
        }
        
        rtnStr += "(출현 몬스터)\n";
        for(i = 0; i < _moblist.length; ++i) {
            mobattspdCounter.push(0);
            mobAttspd.push(Number(_moblist[i].ability.atkspeed));
            AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, Number(_moblist[i].ability.atkspeed));
            mobCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
            mobEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
            if(_WBParam.kind === FIGHTKIND.NORMAL)
                mobHP.push(Number(_moblist[i].ability.hp));
            else
                mobHP.push(_WBParam.remainHP);
            mobMP.push(Number(_moblist[i].ability.mp));
            mobSP.push(Number(_moblist[i].ability.sp));

            rtnStr += "  - " + _moblist[i].name + "\n";
        }
        rtnStr += "\n";

        rtnStr += "(참여 용병)\n";
        var tmpmer = null;
        var matchingKey = 0;
        for(i = 0; i < _mercentlist.length; ++i) {
            if(_mercentlist[i].isuse === "Y") {
                if(_mercentlist[i].hp > 0) {
                    if(_userObj.addRune(-(_mercentlist[i].pay))) {
                        tmpmer = db_Manager.getMercenary(_mercentlist[i].index);
                        merattspdCounter.push(0);
                        merAttspd.push(tmpmer.ability.atkspeed);
                        merCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
                        merAura.push({kind:tmpmer.aura.kind, type:tmpmer.aura.type, value:tmpmer.aura.value, useYN:true});
                        merEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
                        merMatchingTable.push(matchingKey);
                        matchingKey++;

                        ourList.push(i);
                        rtnStr += "  - " + _mercentlist[i].name + " 출전 (" + _mercentlist[i].pay + " rune 지출)\n";
                        if(tmpmer.aura.kind !== "") {
                            rtnStr += "     L 오러 버프 : " + tmpmer.aura.kind + "+" + tmpmer.aura.value + (tmpmer.aura.type==="PERCENT"?"%":"") + "\n";
                        }
                    }
                    else {
                        merMatchingTable.push(Not_MatchKey);
                        rtnStr += "  - " + _mercentlist[i].name + "은(는) 룬을 지급하지 못하여 출전을 거부합니다.\n";
                    }
                }
                else {
                    merMatchingTable.push(Not_MatchKey);
                    rtnStr += "  - " + _mercentlist[i].name + "은(는) 체력이 없으므로 참여하지 못하였습니다.\n";
                }
            }
            else {
                merMatchingTable.push(Not_MatchKey);
                rtnStr += "  - " + _mercentlist[i].name + "은(는) 휴식중입니다.\n";
            }
        }
        rtnStr += "\n";

        if(libConst.UserJoinBattleYN) {
            AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, A('s', userAttspd, merAura));
        }
        for(i = 0; i < merAttspd.length; ++i) {
            AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, A('s', merAttspd[i], merAura));
        }


        summonDB = _SetSummonMonster(_userObj, _option);
        for(i = 0; i < summonDB.length; ++i) {
            AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, A('s', summonDB[i].ability.atkspeed, merAura));
        }

        AttMaxSpd *= libConst.MaxAttackSpeedRate;
        userattspdCounter = AttMaxSpd;
        for(i = 0; i < mobattspdCounter.length; ++i) {
            mobattspdCounter[i] = AttMaxSpd;
        }
        for(i = 0; i < merattspdCounter.length; ++i) {
            merattspdCounter[i] = AttMaxSpd;
        }

        var effectlist;
        var start = 0, length = 0, dieRune = Math.floor(libConst.DieRune - (libConst.DieRune * PetManager.getBuffAmountByKind(_userObj.name, "die") / 100));

        if(ourList.length === 0) {
            _result.nofight = true;
            return "";
        }

        while(true) {
            if(_moblist.length === 0) {
                _result.result = true;
                break;
            }
            if(ourList.length === 0) {
                rtnStr += "  - 전투 가능한 유닛이 없어서 후퇴합니다.\n";
                if(!_userObj.addRune(-dieRune))
                {
                    _userObj.setRune(0);
                }
                rtnStr += "  - 소지금 " + dieRune + " Rune을 잃습니다. 현재 Rune : " + _userObj.getRune() + "\n";
                _result.result = false;
                break;
            }
            if(_WBParam.kind === FIGHTKIND.WORLDBOSS) {
                if(totalCnt >= libConst.WorldBossHuntingCount) {
                    rtnStr += "  - 월드보스 사냥 턴 횟수가 넘어서 사냥을 종료합니다.\n";
                    rtnStr += "  - 월드보스 사냥 턴수 : " + libConst.WorldBossHuntingCount + ".\n";
                    _result.result = false;
                    break;
                }
            }
            else {
                if(totalCnt >= libConst.MaxHuntingTrunCount) {
                    rtnStr += "  - 몬스터들이 도망가기 시작합니다.\n";
                    rtnStr += "  - 1회 사냥 턴수 : " + libConst.MaxHuntingTrunCount + ".\n";
                    _result.result = false;
                    break;
                }
            }

            if(ourList.indexOf(-1) !== -1) {
                userattspdCounter -= (A('s', userAttspd, merAura) - Math.floor(A('s', userAttspd, merAura) * userCC.slowrate));
            }
            if(userattspdCounter <= 0) {
                userattspdCounter = AttMaxSpd + userattspdCounter;
                selMob = libCommon.Rand(0,_moblist.length - 1);

                rtnStr += BattleLogFlag?"":("(" + _userObj.name + "턴 시작)\n");
                totalCnt++;

                for(i = 0; i < userSkillCoolTime.length; ++i) {
                    if(userSkillCoolTime[i] > 0) {
                        userSkillCoolTime[i]--;
                    }
                }

                for(i = 0; i < userHealSkillCoolTime.length; ++i) {
                    if(userHealSkillCoolTime[i] > 0) {
                        userHealSkillCoolTime[i]--;
                    }
                }
                

                if(userCC.continue !== 0) {
                    if(userCC.damage !== 0) {
                        tmpHp = _userObj.getAbility().hp;
                        tmpCc = Math.floor(userMaxHP * userCC.damage);
                        _userObj.getAbility().hp -= tmpCc;
                        if(_userObj.getAbility().hp < 0)
                            _userObj.getAbility().hp = 0;

                        rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 " + tmpCc + " 데미지 발생\n");
                        rtnStr += BattleLogFlag?"":("  - " + _userObj.name + "의 Hp가 " + tmpHp + " -> " + _userObj.getAbility().hp + "로 줄어듬\n");

                        if(_userObj.getAbility().hp === 0)
                        {
                            rtnStr += BattleLogFlag?"":("  - " + _userObj.name + "이(가) 정신을 잃었습니다\n");
                            for(c = 0; c < mobCC.length; ++c) {
                                if(mobCC[c].provo === -1)
                                    mobCC[c].provo = Not_ProvoTarget;
                            }

                            retireList.push(-1);
                            ourList.splice(ourList.indexOf(-1),1);
                            userDeathFlag = true;
                            if(ourList.length === 0) {
                                rtnStr += "  - 전투 가능한 유닛이 없어서 후퇴합니다.\n";
                                if(!_userObj.addRune(-dieRune))
                                {
                                    _userObj.setRune(0);
                                }
                                rtnStr += "  - 소지금 " + dieRune + " Rune을 잃습니다. 현재 Rune : " + _userObj.getRune() + "\n";
                                _result.result = false;
                                break;
                            }
                        }
                    }

                    if(userCC.provo !== Not_ProvoTarget && userCC.provo < _moblist.length) {
                        rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 " + _moblist[userCC.provo].name + "을(를) 타겟팅합니다.\n");
                        selMob = userCC.provo;
                    }

                    _RemoveCC(null, userEffect);
                    if(userCC.effect !== ""){
                        effectlist = userCC.effect.split(";");
                        for(i = 0; i < effectlist.length; ++i) {
                            if(effectlist[i] === "attack") {userEffect.n_att = true;}
                            if(effectlist[i] === "skill") {userEffect.n_skl = true;}
                            if(effectlist[i] === "potion") {userEffect.n_pot = true;}
                            if(effectlist[i] === "avoid") {userEffect.n_avd = true;}
                            if(effectlist[i] === "provo") {userEffect.n_prv = true;}
                            if(effectlist[i] === "slow") {userEffect.n_slw = true;}
                            if(effectlist[i] === "dth") {userEffect.n_dth = true;}
                        }
                    }
                    userCC.continue--;

                    if(userEffect.n_dth) {
                        userCC.deathcount--;
                        if(userCC.deathcount === 0) {
                            rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 " + _userObj.name + "는 즉사 합니다.\n");
                            for(c = 0; c < mobCC.length; ++c) {
                                if(mobCC[c].provo === -1)
                                    mobCC[c].provo = Not_ProvoTarget;
                            }

                            retireList.push(-1);
                            ourList.splice(ourList.indexOf(-1),1);
                            userDeathFlag = true;
                            if(ourList.length === 0) {
                                rtnStr += "  - 전투 가능한 유닛이 없어서 후퇴합니다.\n";
                                if(!_userObj.addRune(-dieRune))
                                {
                                    _userObj.setRune(0);
                                }
                                rtnStr += "  - 소지금 " + dieRune + " Rune을 잃습니다. 현재 Rune : " + _userObj.getRune() + "\n";
                                _result.result = false;
                                break;
                            }
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - " + userCC.name + " 효과의 남은 카운터 : " + userCC.deathcount + "\n");
                        }
                    }
                }
                else {
                    _RemoveCC(userCC, userEffect);
                }

                if(!userDeathFlag) {
                    if(userEffect.n_skl) {
                        rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 소환 스킬을 사용할 수 없습니다.\n");
                        tmpSummonSkill = {jude:false};
                    }
                    else {
                        tmpSummonSkill = _JudgSummonSkill(summonDB, summonlist, _userObj);
                        if(tmpSummonSkill.comment !== "") {
                            rtnStr += BattleLogFlag?"":(tmpSummonSkill.comment + "\n");
                        }
                    }
                    if(userEffect.n_skl) {
                        rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 회복 스킬을 사용할 수 없습니다.\n");
                        tmpHealing = {heal:0};
                    }
                    else if(!tmpSummonSkill.jude){
                        tmpHealing = _JudgHealSkill(_option, _userObj, userMaxHP, _mercentlist, summonlist, summonDB, ourList, retireList, userHealSkillCoolTime, merAura);
                        if(tmpHealing.comment !== "") {
                            rtnStr += BattleLogFlag?"":(tmpHealing.comment + "\n");
                        }
                    }
                    else {
                        tmpHealing = {heal:0};
                    }
                    if(userEffect.n_skl) {
                        rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 상태이상회복 스킬을 사용할 수 없습니다.\n");
                        tmpCCRecovery = {jude:false};
                    }
                    else if(tmpHealing.heal === 0 && !tmpSummonSkill.jude) {
                        tmpCCRecovery = _JudgCureSkill(_option, _userObj, userCC, merCC, smnCC, merMatchingTable, ourList);
                        if(tmpCCRecovery.comment !== "") {
                            rtnStr += BattleLogFlag?"":(tmpCCRecovery.comment + "\n");
                        }
                    }
                    else {
                        tmpCCRecovery = {jude:false};
                    }

                    if(tmpSummonSkill.jude) {
                        _userObj.getAbility().dp -= tmpSummonSkill.removedp;

                        rtnStr += BattleLogFlag?"":("  - [" + tmpSummonSkill.skillname + "] 스킬을 시전\n");
                        if(tmpSummonSkill.removedp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Dp 소모: " + tmpSummonSkill.removedp + ", 남아있는 DP : " + _userObj.getAbility().dp + "\n");

                        if(tmpSummonSkill.refresh.length > 0) {
                            for(i = 0; i < tmpSummonSkill.refresh.length; ++i) {
                                summonlist[tmpSummonSkill.refresh[i]].ability.hp = tmpSummonSkill.targetmob.ability.hp;
                                summonlist[tmpSummonSkill.refresh[i]].ability.mp = tmpSummonSkill.targetmob.ability.mp;
                                summonlist[tmpSummonSkill.refresh[i]].ability.sp = tmpSummonSkill.targetmob.ability.sp;
                                summonlist[tmpSummonSkill.refresh[i]].keepturn = tmpSummonSkill.targetmob.keepturn;
                                smnCC[tmpSummonSkill.refresh[i]] = {name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0};
                                smnEffect[tmpSummonSkill.refresh[i]] = {n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false};
                                ourList.push("S" + tmpSummonSkill.refresh[i]);
                            }
                        }
                        else {
                            for(i = 0; i < tmpSummonSkill.count; ++i) {
                                summonlist.push(JSON.parse(JSON.stringify(tmpSummonSkill.targetmob)));
                                smnattspdCounter.push(AttMaxSpd);
                                smnAttspd.push(tmpSummonSkill.targetmob.ability.atkspeed);
                                smnCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
                                smnEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
                                ourList.push("S" + (summonlist.length-1));
                            }
                        }
                        rtnStr += BattleLogFlag?"":("  - " + tmpSummonSkill.targetmob.mobname + "을(를) 소환\n");
                    }
                    else if(tmpHealing.heal !== 0) {
                        _userObj.getAbility().hp -= tmpHealing.removehp;
                        _userObj.getAbility().mp -= tmpHealing.removemp;
                        _userObj.getAbility().sp -= tmpHealing.removesp;


                        rtnStr += BattleLogFlag?"":("  - [" + tmpHealing.name + "] 스킬을 시전\n");
                        if(tmpHealing.removehp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpHealing.removehp + ", 남아있는 HP : " + _userObj.getAbility().hp + "\n");
                        if(tmpHealing.removemp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpHealing.removemp + ", 남아있는 MP : " + _userObj.getAbility().mp + "\n");
                        if(tmpHealing.removesp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpHealing.removesp + ", 남아있는 SP : " + _userObj.getAbility().sp + "\n");

                        if(tmpHealing.range === "single")
                        {
                            if(tmpHealing.type === "heal" && ourList[tmpHealing.targetidx[0]] === -1){
                                rtnStr += BattleLogFlag?"":("  - 자신에게 " + tmpHealing.heal + "을(를) 회복\n");
                                _userObj.RecoveryforNum("hp", tmpHealing.heal);
                            }
                            else if(tmpHealing.type === "heal" && _isSummonMob(ourList[tmpHealing.targetidx[0]])){
                                summonIdx = Number(ourList[tmpHealing.targetidx[0]].substring(1));
                                targetsummon = summonlist[summonIdx];
                                rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                targetsummon.ability.hp += tmpHealing.heal;
                                if(targetsummon.ability.hp > summonDB[targetsummon.index].ability.hp) {
                                    targetsummon.ability.hp = summonDB[targetsummon.index].ability.hp;
                                }
                            }
                            else {
                                if(tmpHealing.type === "revive") { 
                                    ourList.push(tmpHealing.targetidx[0]);
                                    targetmercent = _mercentlist[tmpHealing.targetidx[0]];
                                    rtnStr += BattleLogFlag?"":("  - " + targetmercent.name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n");
                                    merAura[merMatchingTable[tmpHealing.targetidx[0]]].useYN = true;
                                    rtnStr += BattleLogFlag?"":("  - 용병 버프 : " + merAura[merMatchingTable[tmpHealing.targetidx[0]]].kind + "+" + merAura[merMatchingTable[tmpHealing.targetidx[0]]].value + (merAura[merMatchingTable[tmpHealing.targetidx[0]]].type==="PLUS"?"":"%") + "\n");
                                }
                                else if(tmpHealing.type === "heal") {
                                    targetmercent = _mercentlist[ourList[tmpHealing.targetidx[0]]];
                                    rtnStr += BattleLogFlag?"":("  - " + targetmercent.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                }
                                targetMercentDB = db_Manager.getMercenary(targetmercent.index);
                                targetmercent.hp += tmpHealing.heal;
                                if(targetmercent.hp > Number(targetMercentDB.ability.hp)) {
                                    targetmercent.hp = Number(targetMercentDB.ability.hp);
                                }
                            }
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - 아군 전체 회복!!!!!!!!\n");

                            for(hs = 0; hs < tmpHealing.targetidx.length; ++hs) {
                                tmpOurIdx = ourList[tmpHealing.targetidx[hs]];
                                if(tmpHealing.type === "heal" && tmpOurIdx === -1) {
                                    rtnStr += BattleLogFlag?"":("  - 자신에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    _userObj.RecoveryforNum("hp", tmpHealing.heal);
                                }
                                else if(tmpHealing.type === "heal" && _isSummonMob(tmpOurIdx)) {
                                    summonIdx = Number(tmpOurIdx.substring(1));
                                    targetsummon = summonlist[summonIdx];
                                    rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    targetsummon.ability.hp += tmpHealing.heal;
                                    if(targetsummon.ability.hp > summonDB[targetsummon.index].ability.hp) {
                                        targetsummon.ability.hp = summonDB[targetsummon.index].ability.hp;
                                    }
                                }
                                else {
                                    if(tmpHealing.type === "revive") { 
                                        ourList.push(tmpHealing.targetidx[hs]);
                                        targetmercent = _mercentlist[tmpHealing.targetidx[hs]];
                                        rtnStr += BattleLogFlag?"":("  - " + targetmercent.name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n");
                                        merAura[merMatchingTable[tmpHealing.targetidx[hs]]].useYN = true;
                                        rtnStr += BattleLogFlag?"":("  - 용병 버프 : " + merAura[merMatchingTable[tmpHealing.targetidx[hs]]].kind + "+" + merAura[merMatchingTable[tmpHealing.targetidx[hs]]].value + (merAura[merMatchingTable[tmpHealing.targetidx[hs]]].type==="PLUS"?"":"%") + "\n");
                                    }
                                    else if(tmpHealing.type === "heal") {
                                        targetmercent = _mercentlist[tmpOurIdx];
                                        rtnStr += BattleLogFlag?"":("  - " + targetmercent.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    }
                                    targetMercentDB = db_Manager.getMercenary(targetmercent.index);
                                    targetmercent.hp += tmpHealing.heal;
                                    if(targetmercent.hp > Number(targetMercentDB.ability.hp)) {
                                        targetmercent.hp = Number(targetMercentDB.ability.hp);
                                    }
                                }
                            }
                        }
                    }
                    else if(tmpCCRecovery.jude) {
                        _userObj.getAbility().hp -= tmpCCRecovery.removehp;
                        _userObj.getAbility().mp -= tmpCCRecovery.removemp;
                        _userObj.getAbility().sp -= tmpCCRecovery.removesp;

                        rtnStr += BattleLogFlag?"":("  - [" + tmpCCRecovery.name + "] 스킬을 시전\n");
                        if(tmpCCRecovery.removehp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpCCRecovery.removehp + ", 남아있는 HP : " + _userObj.getAbility().hp + "\n");
                        if(tmpCCRecovery.removemp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpCCRecovery.removemp + ", 남아있는 MP : " + _userObj.getAbility().mp + "\n");
                        if(tmpCCRecovery.removesp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpCCRecovery.removesp + ", 남아있는 SP : " + _userObj.getAbility().sp + "\n");

                        if(tmpCCRecovery.range === "single")
                        {
                            if(ourList[tmpCCRecovery.targetidx] === -1){
                                rtnStr += BattleLogFlag?"":("  - 자신의 CC 제거\n");
                                _RemoveCC(userCC, userEffect);
                            }
                            else if(_isSummonMob(tmpCCRecovery.targetidx)) {
                                summonIdx = Number(tmpCCRecovery.targetidx.substring(1));
                                targetsummon = summonlist[summonIdx];
                                rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "의 CC 제거\n");
                                _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                            }
                            else {
                                mercentidx = merMatchingTable[ourList[tmpCCRecovery.targetidx]];
                                targetmercent = _mercentlist[ourList[tmpCCRecovery.targetidx]];

                                rtnStr += BattleLogFlag?"":("  - " + targetmercent.name + "의 CC 제거\n");
                                _RemoveCC(merCC[mercentidx], merEffect[mercentidx]);
                            }
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - 아군 전체 CC 제거!!!!!!!!\n");

                            for(hs = 0; hs < ourList.length; ++hs) {
                                if(ourList[hs] === -1) {
                                    rtnStr += BattleLogFlag?"":("  - 자신의 CC 제거\n");
                                    _RemoveCC(userCC, userEffect);
                                }
                                else if(_isSummonMob(ourList[hs])) {
                                    summonIdx = Number(ourList[hs].substring(1));
                                    targetsummon = summonlist[summonIdx];
                                    rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "의 CC 제거\n");
                                    _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                                }
                                else {
                                    mercentidx = merMatchingTable[ourList[hs]];
                                    targetmercent = _mercentlist[ourList[hs]];

                                    rtnStr += BattleLogFlag?"":("  - " + targetmercent.name + "의 CC 제거\n");
                                    _RemoveCC(merCC[mercentidx], merEffect[mercentidx]);
                                }
                            }
                        }
                    }
                    else if(!userEffect.n_pot && _JudgPotion("hp", _option, _userObj, userMaxHP, userMaxMP, userMaxSP, userMaxDP)){
                        tmpPotion = db_Manager.getFunctionalityItem(_option.getpotionOpt().hp.index);
                        rtnStr += BattleLogFlag?"":("  - " + tmpPotion.name + "을(를) 사용\n");
                        if(tmpPotion.kind === "recovery") {
                            rtnStr += BattleLogFlag?"":("  - " + tmpPotion.amount + "%를 회복\n");
                            _userObj.Recovery("hp", tmpPotion.amount);
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - +" + tmpPotion.amount + "을(를) 회복\n");
                            _userObj.RecoveryforNum("hp", Number(tmpPotion.amount));
                        }
                        _userObj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, tmpPotion.index, 1);
                    }
                    else if(!userEffect.n_pot && _JudgPotion("mp", _option, _userObj, userMaxHP, userMaxMP, userMaxSP, userMaxDP)){
                        tmpPotion = db_Manager.getFunctionalityItem(_option.getpotionOpt().mp.index);
                        rtnStr += BattleLogFlag?"":("  - " + tmpPotion.name + "을(를) 사용\n");
                        if(tmpPotion.kind === "recovery") {
                            rtnStr += BattleLogFlag?"":("  - " + tmpPotion.amount + "%를 회복\n");
                            _userObj.Recovery("mp", tmpPotion.amount);
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - +" + tmpPotion.amount + "을(를) 회복\n");
                            _userObj.RecoveryforNum("mp", Number(tmpPotion.amount));
                        }
                        _userObj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, tmpPotion.index, 1);
                    }
                    else if(!userEffect.n_pot && _JudgPotion("sp", _option, _userObj, userMaxHP, userMaxMP, userMaxSP, userMaxDP)){
                        tmpPotion = db_Manager.getFunctionalityItem(_option.getpotionOpt().sp.index);
                        rtnStr += BattleLogFlag?"":("  - " + tmpPotion.name + "을(를) 사용\n");
                        if(tmpPotion.kind === "recovery") {
                            rtnStr += BattleLogFlag?"":("  - " + tmpPotion.amount + "%를 회복\n");
                            _userObj.Recovery("sp", tmpPotion.amount);
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - +" + tmpPotion.amount + "을(를) 회복\n");
                            _userObj.RecoveryforNum("sp", Number(tmpPotion.amount));
                        }
                        _userObj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, tmpPotion.index, 1);
                    }
                    else if(!userEffect.n_pot && _JudgPotion("dp", _option, _userObj, userMaxHP, userMaxMP, userMaxSP, userMaxDP)){
                        tmpPotion = db_Manager.getFunctionalityItem(_option.getpotionOpt().dp.index);
                        rtnStr += BattleLogFlag?"":("  - " + tmpPotion.name + "을(를) 사용\n");
                        if(tmpPotion.kind === "recovery") {
                            rtnStr += BattleLogFlag?"":("  - " + tmpPotion.amount + "%를 회복\n");
                            _userObj.Recovery("dp", tmpPotion.amount);
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - +" + tmpPotion.amount + "을(를) 회복\n");
                            _userObj.RecoveryforNum("dp", Number(tmpPotion.amount));
                        }
                        _userObj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, tmpPotion.index, 1);
                    }
                    else {
                        if(userEffect.n_pot) {
                            rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 포션을 사용할 수 없습니다.\n");
                        }

                        if(userEffect.n_att) {
                            rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 공격이 불가합니다.\n");
                        }
                        else {
                            tmpCri = {cri:0};
                            if(userEffect.n_skl) {
                                rtnStr += BattleLogFlag?"":("  - " + userCC.name + "의 효과로 스킬을 사용할 수 없습니다.\n");
                                tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
                            }
                            else {
                                tmpSkill = _JudgSkill(_option, _moblist[selMob], _userObj, tmpCri, userSkillCoolTime, merAura);
                            }

                            start = 0, length = 0;
                            if(tmpSkill.range === "single") {
                                start = selMob;
                                length = selMob + 1;
                            }
                            else {
                                rtnStr += BattleLogFlag?"":("  - [" + tmpSkill.name + "] 전체 스킬 판정!\n");
                                if(tmpSkill.count >= _moblist.length){
                                    start = 0;
                                    length = _moblist.length;
                                }
                                else {
                                    r = tmpSkill.count - (selMob + 1);
                                    if(r >= 0){
                                        start = 0;
                                        length = tmpSkill.count;
                                    }
                                    else {
                                        start = -r;
                                        length = tmpSkill.count - r;

                                    }
                                }
                            }

                            if(tmpSkill.damage !== 0) {
                                _userObj.getAbility().hp -= tmpSkill.removehp;
                                _userObj.getAbility().mp -= tmpSkill.removemp;
                                _userObj.getAbility().sp -= tmpSkill.removesp;


                                rtnStr += BattleLogFlag?"":("  - [" + tmpSkill.name + "] 스킬을 시전\n");
                                if(tmpSkill.removehp !== "0")
                                    rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + _userObj.getAbility().hp + "\n");
                                if(tmpSkill.removemp !== "0")
                                    rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + _userObj.getAbility().mp + "\n");
                                if(tmpSkill.removesp !== "0")
                                    rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + _userObj.getAbility().sp + "\n");
                            }

                            for(i = start; i < length; ++i) {
                                rtnStr += BattleLogFlag?"":("  - " + _moblist[i].name + "을(를) 공격\n");
                                if(tmpSkill.damage !== 0) {
                                    if(tmpSkill.range === "single") {
                                        tmpDamage = tmpSkill.damage;
                                    }
                                    else {
                                        tmpDamage = _SkillCalcDamage(A(tmpSkill.skillkind, _userObj.getAbility()[tmpSkill.skillkind], merAura), A(tmpSkill.skillsubkind, _userObj.getAbility()[tmpSkill.skillsubkind], merAura), {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, _moblist[i].ability.defense);
                                        if(tmpCri.cri === 1) {
                                            tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(A("c", _userObj.getAbility().critical, merAura), _moblist[i].ability.critical));
                                        }
                                        if(tmpDamage <= 0)
                                            tmpDamage = 1;
                                    }
                                }
                                else {
                                    if(tmpSkill.comment !== ""){
                                        rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                    }

                                    if(_userObj.isFarWeapon()){
                                        if(!_userObj.decArrow()) {
                                            rtnStr += BattleLogFlag?"":("  - (주의)화살을 다 소모하여 활을 내려놓습니다.\n");
                                            _userObj.addItem(libConst.ITEM_KIND.WEARITEM, _userObj.getEquiment().righthand, 1, _userObj.getEquimentLevel().righthand);
                                            _userObj.removeEquiment("righthand"); // 화살이 다 떨어지면 무기를 가방에 넣는다.
                                            _userObj.calcAbility(false);

                                        }
                                    }
                                    tmpDamage = _JudgAttack(A("a", _userObj.getAbility().attack, merAura), A("c", _userObj.getAbility().critical, merAura), _moblist[i].ability.critical, _moblist[i].ability.defense, CriticalRate, tmpCri);
                                }

                                tmpHp = mobHP[i];
                                rtnStr += BattleLogFlag?"":("  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n");

                                if(_b_buff !== null) {
                                    tmpDamage = Math.floor(tmpDamage * Number(_b_buff.amount));
                                    rtnStr += BattleLogFlag?"":("  - 결장버프 데미지 증가 >>>" + tmpDamage + "\n");
                                }

                                if(mobEffect[i].n_avd) {
                                    rtnStr += BattleLogFlag?"":("  - " + mobCC[i].name + "의 효과로 상대방은 회피를 할 수 없습니다.\n");
                                }
                                if(mobEffect[i].n_avd || _JudgAvoid(A("r", _userObj.getAbility().accuracy, merAura), _moblist[i].ability.avoid)) {
                                    mobHP[i] -= tmpDamage;
                                    _WBParam.accumulateDamage = Number(_WBParam.accumulateDamage) + Number(tmpDamage);
                                    if(mobHP[i] < 0)
                                        mobHP[i] = 0;

                                    rtnStr += BattleLogFlag?"":("  - " + _moblist[i].name + "의 Hp가 " + tmpHp + " -> " + mobHP[i] + "로 줄어듬\n");

                                    if(tmpSkill.cc !== null ) {
                                        rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                        if(mobEffect[i].n_dth) {
                                            tmpSkill.cc.deathcount = ((mobCC[i].deathcount > 1)?(mobCC[i].deathcount - 1):mobCC[i].deathcount);
                                            rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                        }
                                        mobCC[i] = tmpSkill.cc;
                                        if(mobCC[i].effect.indexOf("provo") !== -1)
                                            mobCC[i].provo = -1;
                                    }

                                    if(mobHP[i] === 0) {
                                        rtnStr += "  - " + _moblist[i].name + "이(가) 제거됨\n";
                                        rtnStr += _JudgDrop(_moblist[i].index, _moblist[i].name, _moblist[i].dropItem, _moblist[i].droprune, _moblist[i].exp, _userObj, _MercenaryManager, _b_buff, recordRune);
                                        rtnStr += BattleLogFlag?"\n\n":"";
                                        _addRecordMob(recordMobList, _moblist[i].index, 1);
                                        if(userCC.provo === i) {
                                            userCC.provo = Not_ProvoTarget;
                                        }
                                        else if(userCC.provo > i){
                                            userCC.provo--;
                                        }
                                        for(c = 0; c < merCC.length; ++c) {
                                            if(merCC[c].provo === i) {
                                                merCC[c].provo = Not_ProvoTarget;
                                            }
                                            else if(merCC[c].provo > i){
                                                merCC[c].provo--;
                                            }
                                        }
                                        for(c = 0; c < smnCC.length; ++c) {
                                            if(smnCC[c].provo === i) {
                                                smnCC[c].provo = Not_ProvoTarget;
                                            }
                                            else if(smnCC[c].provo > i){
                                                smnCC[c].provo--;
                                            }
                                        }
                                        mobretireList.push({mob:_moblist[i], hp:mobHP[i], mp:mobMP[i], sp:mobSP[i]});
                                        _JudgQuestCount(_moblist[i].index, _userObj);
                                        _moblist.splice(i,1);
                                        mobattspdCounter.splice(i,1);
                                        mobAttspd.splice(i,1);
                                        mobCC.splice(i,1);
                                        mobEffect.splice(i,1);
                                        mobHP.splice(i,1);
                                        mobMP.splice(i,1);
                                        mobSP.splice(i,1);
                                        i--;
                                        length -= 1;
                                    }
                                }
                                else {
                                    if(tmpSkill.cc !== null ) {
                                        rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                        if(mobEffect[i].n_dth) {
                                            tmpSkill.cc.deathcount = ((mobCC[i].deathcount > 1)?(mobCC[i].deathcount - 1):mobCC[i].deathcount);
                                            rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                        }
                                        mobCC[i] = tmpSkill.cc;
                                        if(mobCC[i].effect.indexOf("provo") !== -1)
                                            mobCC[i].provo = -1;
                                    }
                                    rtnStr += BattleLogFlag?"":("  - " +  _moblist[i].name + "이(가) 회피\n");
                                }
                                rtnStr += BattleLogFlag?"":("\n");
                            }
                        }
                    }
                }
                rtnStr += BattleLogFlag?"":("\n");
            }
            for(i = ourList.length - 1; i >= 0; --i) {
                if(ourList[i] === -1)
                    continue;
                if(_moblist.length === 0){
                    break;
                }
                if(!_isSummonMob(ourList[i])) {
                    mercentidx = merMatchingTable[ourList[i]];
                    merattspdCounter[mercentidx] -= (A('s', merAttspd[mercentidx], merAura) - Math.floor(A('s', merAttspd[mercentidx], merAura) * merCC[mercentidx].slowrate));
                    if(merattspdCounter[mercentidx] <= 0) {
                        merattspdCounter[mercentidx] = AttMaxSpd + merattspdCounter[mercentidx];
                        targetmercent = _mercentlist[ourList[i]];
                        targetMercentDB =  db_Manager.getMercenary(targetmercent.index);
                        selMob = libCommon.Rand(0,_moblist.length - 1);

                        rtnStr += BattleLogFlag?"":("(" + targetmercent.name + "턴 시작)\n");
                        totalCnt++;
                        if(merCC[mercentidx].continue !== 0) {
                            if(merCC[mercentidx].damage !== 0) {
                                tmpHp = targetmercent.hp;
                                tmpCc = Math.floor(Number(targetMercentDB.ability.hp) * merCC[mercentidx].damage);
                                targetmercent.hp -= tmpCc;
                                if(targetmercent.hp < 0)
                                    targetmercent.hp = 0;

                                rtnStr += BattleLogFlag?"":("  - " + merCC[mercentidx].name + "의 효과로 " + tmpCc + " 데미지 발생\n");
                                rtnStr += BattleLogFlag?"":("  - " + targetmercent.name + "의 Hp가 " + tmpHp + " -> " + targetmercent.hp + "로 줄어듬\n");

                                if(targetmercent.hp === 0)
                                {
                                    rtnStr += BattleLogFlag?"":("  - " + targetmercent.name + "이(가) 정신을 잃었습니다\n");
                                    for(c = 0; c < mobCC.length; ++c) {
                                        if(mobCC[c].provo === mercentidx)
                                            mobCC[c].provo = Not_ProvoTarget;
                                    }
                                    retireList.push(ourList[i]);
                                    ourList.splice(ourList.indexOf(ourList[i]),1);
                                    merattspdCounter[mercentidx] = AttMaxSpd;
                                    _RemoveCC(merCC[mercentidx], merEffect[mercentidx]);
                                    rtnStr += BattleLogFlag?"":("  - 용병 버프 제거 : " + merAura[mercentidx].kind + "+" + merAura[mercentidx].value + (merAura[mercentidx].type==="PLUS"?"":"%") + "\n");
                                    merAura[mercentidx].useYN = false;
                                    continue;
                                }
                            }

                            if(merCC[mercentidx].provo !== Not_ProvoTarget && merCC[mercentidx].provo < _moblist.length) {
                                rtnStr += BattleLogFlag?"":("  - " + merCC[mercentidx].name + "의 효과로 " + _moblist[merCC[mercentidx].provo].name + "을(를) 타겟팅합니다.\n");
                                selMob = merCC[mercentidx].provo;
                            }

                            _RemoveCC(null, merEffect[mercentidx]);
                            if(merCC[mercentidx].effect !== ""){
                                effectlist = merCC[mercentidx].effect.split(";");
                                for(j = 0; j < effectlist.length; ++j) {
                                    if(effectlist[j] === "attack") {merEffect[mercentidx].n_att = true;}
                                    if(effectlist[j] === "skill") {merEffect[mercentidx].n_skl = true;}
                                    if(effectlist[j] === "potion") {merEffect[mercentidx].n_pot = true;}
                                    if(effectlist[j] === "avoid") {merEffect[mercentidx].n_avd = true;}
                                    if(effectlist[j] === "provo") {merEffect[mercentidx].n_prv = true;}
                                    if(effectlist[j] === "slow") {merEffect[mercentidx].n_slw = true;}
                                    if(effectlist[j] === "dth") {merEffect[mercentidx].n_dth = true;}
                                }
                            }
                            merCC[mercentidx].continue--;

                            if(merEffect[mercentidx].n_dth) {
                                merCC[mercentidx].deathcount--;
                                if(merCC[mercentidx].deathcount === 0) {
                                    rtnStr += BattleLogFlag?"":("  - " + merCC[mercentidx].name + "의 효과로 " + targetmercent.name + "는 즉사 합니다.\n");
                                    for(c = 0; c < mobCC.length; ++c) {
                                        if(mobCC[c].provo === mercentidx)
                                            mobCC[c].provo = Not_ProvoTarget;
                                    }

                                    retireList.push(ourList[i]);
                                    ourList.splice(ourList.indexOf(ourList[i]),1);
                                    merattspdCounter[mercentidx] = AttMaxSpd;
                                    _RemoveCC(merCC[mercentidx], merEffect[mercentidx]);
                                    rtnStr += BattleLogFlag?"":("  - 용병 버프 제거 : " + merAura[mercentidx].kind + "+" + merAura[mercentidx].value + (merAura[mercentidx].type==="PLUS"?"":"%") + "\n");
                                    merAura[mercentidx].useYN = false;
                                    continue;
                                }
                                else {
                                    rtnStr += BattleLogFlag?"":("  - " + merCC[mercentidx].name + " 효과의 남은 카운터 : " + merCC[mercentidx].deathcount + "\n");
                                }
                            }
                        }
                        else {
                            _RemoveCC(merCC[mercentidx], merEffect[mercentidx]);
                        }

                        if(merEffect[mercentidx].n_skl) {
                            rtnStr += BattleLogFlag?"":("  - " + merCC[mercentidx].name + "의 효과로 회복 스킬을 사용할 수 없습니다.\n");
                            tmpHealing = {heal:0};
                        }
                        else {
                            tmpHealing = _JudgMerHealSkill(targetmercent, _userObj, userMaxHP, _mercentlist, summonlist, summonDB, ourList, retireList, merAura);
                            if(tmpHealing.comment !== "") {
                                rtnStr += BattleLogFlag?"":(tmpHealing.comment + "\n");
                            }
                        }

                        if(merEffect[mercentidx].n_skl) {
                            rtnStr += BattleLogFlag?"":("  - " +  merCC[mercentidx].name + "의 효과로 상태이상회복 스킬을 사용할 수 없습니다.\n");
                            tmpCCRecovery = {jude:false};
                        }
                        else if(tmpHealing.heal === 0) {
                            tmpCCRecovery = _JudgMerCureSkill(targetmercent, userCC, merCC, smnCC, merMatchingTable, ourList);
                            if(tmpCCRecovery.comment !== "") {
                                rtnStr += BattleLogFlag?"":(tmpCCRecovery.comment + "\n");
                            }
                        }
                        else {
                            tmpCCRecovery = {jude:false};
                        }

                        if(tmpHealing.heal !== 0) {
                            var healindex, healMercent, healMercentDB;
                            targetmercent.hp -= tmpHealing.removehp;
                            targetmercent.mp -= tmpHealing.removemp;
                            targetmercent.sp -= tmpHealing.removesp;


                            rtnStr += BattleLogFlag?"":("  - [" + tmpHealing.name + "] 스킬을 시전\n");
                            if(tmpHealing.removehp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpHealing.removehp + ", 남아있는 HP : " + targetmercent.hp + "\n");
                            if(tmpHealing.removemp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpHealing.removemp + ", 남아있는 MP : " + targetmercent.mp + "\n");
                            if(tmpHealing.removesp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpHealing.removesp + ", 남아있는 SP : " + targetmercent.sp + "\n");

                            if(tmpHealing.range === "single")
                            {
                                if(ourList[tmpHealing.targetidx[0]] === -1) {
                                    if(tmpHealing.type === "revive") { 
                                        ourList.push(-1);
                                        rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n");
                                    }
                                    else if(tmpHealing.type === "heal") {
                                        rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    }
                                    _userObj.RecoveryforNum("hp", tmpHealing.heal);
                                }
                                else if(tmpHealing.type === "heal" && _isSummonMob(ourList[tmpHealing.targetidx[0]])){
                                    summonIdx = Number(ourList[tmpHealing.targetidx[0]].substring(1));
                                    targetsummon = summonlist[summonIdx];
                                    rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    targetsummon.ability.hp += tmpHealing.heal;
                                    if(targetsummon.ability.hp > summonDB[targetsummon.index].ability.hp) {
                                        targetsummon.ability.hp = summonDB[targetsummon.index].ability.hp;
                                    }
                                }
                                else {
                                    if(tmpHealing.type === "revive") { 
                                        ourList.push(tmpHealing.targetidx[0]);
                                        healMercent = _mercentlist[tmpHealing.targetidx[0]];
                                        rtnStr += BattleLogFlag?"":("  - " + healMercent.name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n");
                                        merAura[merMatchingTable[tmpHealing.targetidx[0]]].useYN = true;
                                        rtnStr += BattleLogFlag?"":("  - 용병 버프 : " + merAura[merMatchingTable[tmpHealing.targetidx[0]]].kind + "+" + merAura[merMatchingTable[tmpHealing.targetidx[0]]].value + (merAura[merMatchingTable[tmpHealing.targetidx[0]]].type==="PLUS"?"":"%") + "\n");
                                    }
                                    else if(tmpHealing.type === "heal") {
                                        healMercent = _mercentlist[ourList[tmpHealing.targetidx[0]]];
                                        rtnStr += BattleLogFlag?"":("  - " + healMercent.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    }
                                    
                                    healMercentDB = db_Manager.getMercenary(healMercent.index);
                                    healMercent.hp += tmpHealing.heal;
                                    if(healMercent.hp > Number(healMercentDB.ability.hp)) {
                                        healMercent.hp = Number(healMercentDB.ability.hp);
                                    }
                                }
                            }
                            else {
                                rtnStr += BattleLogFlag?"":("  - 아군 전체 회복!!!!!!!!\n");

                                for(hs = 0; hs < tmpHealing.targetidx.length; ++hs) {
                                    healindex = ourList[tmpHealing.targetidx[hs]];
                                    if(healindex === -1) {
                                        if(tmpHealing.type === "revive") { 
                                            ourList.push(-1);
                                            rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n");
                                        }
                                        else if(tmpHealing.type === "heal") {
                                            rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                        }
                                        _userObj.RecoveryforNum("hp", tmpHealing.heal);
                                    }
                                    else if(tmpHealing.type === "heal" && _isSummonMob(healindex)) {
                                        summonIdx = Number(healindex.substring(1));
                                        targetsummon = summonlist[summonIdx];
                                        rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                        targetsummon.ability.hp += tmpHealing.heal;
                                        if(targetsummon.ability.hp > summonDB[targetsummon.index].ability.hp) {
                                            targetsummon.ability.hp = summonDB[targetsummon.index].ability.hp;
                                        }
                                    }
                                    else {

                                        if(tmpHealing.type === "revive") { 
                                            ourList.push(tmpHealing.targetidx[hs]);
                                            healMercent = _mercentlist[tmpHealing.targetidx[hs]];
                                            rtnStr += BattleLogFlag?"":("  - " + healMercent.name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n");
                                            merAura[merMatchingTable[tmpHealing.targetidx[hs]]].useYN = true;
                                            rtnStr += BattleLogFlag?"":("  - 용병 버프 : " + merAura[merMatchingTable[tmpHealing.targetidx[hs]]].kind + "+" + merAura[merMatchingTable[tmpHealing.targetidx[hs]]].value + (merAura[merMatchingTable[tmpHealing.targetidx[hs]]].type==="PLUS"?"":"%") + "\n");
                                        }
                                        else if(tmpHealing.type === "heal") {
                                            healMercent = _mercentlist[healindex];
                                            rtnStr += BattleLogFlag?"":("  - " + healMercent.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                        }
                                        healMercentDB = db_Manager.getMercenary(healMercent.index);
                                        healMercent.hp += tmpHealing.heal;
                                        if(healMercent.hp > Number(healMercentDB.ability.hp)) {
                                            healMercent.hp = Number(healMercentDB.ability.hp);
                                        }
                                    }
                                }
                            }
                        }
                        else if(tmpCCRecovery.jude) {
                            var cureindex, cureMercent;
                            targetmercent.hp -= tmpCCRecovery.removehp;
                            targetmercent.mp -= tmpCCRecovery.removemp;
                            targetmercent.sp -= tmpCCRecovery.removesp;


                            rtnStr += BattleLogFlag?"":("  - [" + tmpCCRecovery.name + "] 스킬을 시전\n");
                            if(tmpCCRecovery.removehp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpCCRecovery.removehp + ", 남아있는 HP : " + targetmercent.hp + "\n");
                            if(tmpCCRecovery.removemp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpCCRecovery.removemp + ", 남아있는 MP : " + targetmercent.mp + "\n");
                            if(tmpCCRecovery.removesp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpCCRecovery.removesp + ", 남아있는 SP : " + targetmercent.sp + "\n");

                            if(tmpCCRecovery.range === "single")
                            {
                                if(ourList[tmpCCRecovery.targetidx] === -1){
                                    rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "의 CC 제거\n");
                                    _RemoveCC(userCC, userEffect);
                                }
                                else if(_isSummonMob(tmpCCRecovery.targetidx)) {
                                    summonIdx = Number(tmpCCRecovery.targetidx.substring(1));
                                    targetsummon = summonlist[summonIdx];
                                    rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "의 CC 제거\n");
                                    _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                                }
                                else {
                                    cureMercent = _mercentlist[ourList[tmpCCRecovery.targetidx]];
                                    cureindex = merMatchingTable[ourList[tmpCCRecovery.targetidx]];

                                    rtnStr += BattleLogFlag?"":("  - " + cureMercent.name + "의 CC 제거\n");
                                    _RemoveCC(merCC[cureindex], merEffect[cureindex]);

                                }
                            }
                            else {
                                rtnStr += BattleLogFlag?"":("  - 아군 전체 CC 제거!!!!!!!!\n");

                                for(hs = 0; hs < ourList.length; ++hs) {
                                    if(ourList[hs] === -1) {
                                        rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "의 CC 제거\n");
                                        _RemoveCC(userCC, userEffect);
                                    }
                                    else if(_isSummonMob(ourList[hs])) {
                                        summonIdx = Number(ourList[hs].substring(1));
                                        targetsummon = summonlist[summonIdx];
                                        rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "의 CC 제거\n");
                                        _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                                    }
                                    else {
                                        cureMercent = _mercentlist[ourList[hs]];
                                        cureindex = merMatchingTable[ourList[hs]];

                                        rtnStr += BattleLogFlag?"":("  - " + cureMercent.name + "의 CC 제거\n");
                                        _RemoveCC(merCC[cureindex], merEffect[cureindex]);
                                    }
                                }
                            }
                        }
                        else {
                            if(merEffect[mercentidx].n_att) {
                                rtnStr += BattleLogFlag?"":("  - " + merCC[mercentidx].name + "의 효과로 공격이 불가합니다.\n");
                            }
                            else {
                                tmpCri = {cri:0};
                                if(merEffect[mercentidx].n_skl) {
                                    rtnStr += BattleLogFlag?"":("  - " + merCC[mercentidx].name + "의 효과로 스킬을 사용할 수 없습니다.\n");
                                    tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
                                }
                                else {
                                    tmpSkill = _JudbMerSkill(_moblist[selMob], targetmercent, tmpCri, merAura);
                                }

                                start = 0, length = 0;
                                if(tmpSkill.range === "single") {
                                    start = selMob;
                                    length = selMob + 1;
                                }
                                else {
                                    rtnStr += BattleLogFlag?"":("  - [" + tmpSkill.name + "] 전체 스킬 판정!\n");
                                    if(tmpSkill.count >= _moblist.length){
                                        start = 0;
                                        length = _moblist.length;
                                    }
                                    else {
                                        r = tmpSkill.count - (selMob + 1);
                                        if(r >= 0){
                                            start = 0;
                                            length = tmpSkill.count;
                                        }
                                        else {
                                            start = -r;
                                            length = tmpSkill.count - r;
                                        }
                                    }
                                }

                                tmpAbility = _getCurrVitality(tmpSkill.skillkind, targetMercentDB.ability, targetmercent);
                                tmpSubAbility = _getCurrVitality(tmpSkill.skillsubkind, targetMercentDB.ability, targetmercent);

                                if(tmpSkill.damage !== 0) {
                                    targetmercent.hp -= tmpSkill.removehp;
                                    targetmercent.mp -= tmpSkill.removemp;
                                    targetmercent.sp -= tmpSkill.removesp;


                                    rtnStr += BattleLogFlag?"":("  - [" + tmpSkill.name + "] 스킬을 시전\n");
                                    if(tmpSkill.removehp !== "0")
                                        rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + targetmercent.hp + "\n");
                                    if(tmpSkill.removemp !== "0")
                                        rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + targetmercent.mp + "\n");
                                    if(tmpSkill.removesp !== "0")
                                        rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + targetmercent.sp + "\n");
                                }

                                for(j = start; j < length; ++j) {
                                    rtnStr += BattleLogFlag?"":("  - " + _moblist[j].name + "을(를) 공격\n");
                                    if(tmpSkill.damage !== 0)
                                    {
                                        if(tmpSkill.range === "single") {
                                            tmpDamage = tmpSkill.damage;
                                        }
                                        else {
                                            tmpDamage = _SkillCalcDamage(A(tmpSkill.skillkind, tmpAbility, merAura), A(tmpSkill.skillsubkind, tmpSubAbility, merAura), {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, _moblist[j].ability.defense);
                                            if(tmpCri.cri === 1) {
                                                tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(A("c", targetMercentDB.ability.critical, merAura), _moblist[j].ability.critical));
                                            }
                                            if(tmpDamage <= 0)
                                                tmpDamage = 1;
                                        }
                                    }
                                    else {
                                        if(tmpSkill.comment !== ""){
                                            rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                        }

                                        tmpDamage = _JudgAttack(A("a", targetMercentDB.ability.attack, merAura), A("c", targetMercentDB.ability.critical, merAura), _moblist[j].ability.critical, _moblist[j].ability.defense, CriticalRate, tmpCri);
                                    }

                                    tmpHp = mobHP[j];
                                    rtnStr += BattleLogFlag?"":("  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n");

                                    if(mobEffect[j].n_avd) {
                                        rtnStr += BattleLogFlag?"":("  - " + mobCC[j].name + "의 효과로 상대방은 회피를 할 수 없습니다.\n");
                                    }

                                    if(mobEffect[j].n_avd || _JudgAvoid(A("r", targetMercentDB.ability.accuracy, merAura), _moblist[j].ability.avoid)) {
                                        mobHP[j] -= tmpDamage;
                                        _WBParam.accumulateDamage = Number(_WBParam.accumulateDamage) + Number(tmpDamage);
                                        if(mobHP[j] < 0)
                                            mobHP[j] = 0;

                                        rtnStr += BattleLogFlag?"":("  - " + _moblist[j].name + "의 Hp가 " + tmpHp + " -> " + mobHP[j] + "로 줄어듬\n");

                                        if(tmpSkill.cc !== null ) {
                                            rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                            if(mobEffect[j].n_dth) {
                                                tmpSkill.cc.deathcount = ((mobCC[j].deathcount > 1)?(mobCC[j].deathcount - 1):mobCC[j].deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }
                                            mobCC[j] = tmpSkill.cc;
                                            if(mobCC[j].effect.indexOf("provo") !== -1)
                                                mobCC[j].provo = ourList[i];
                                        }

                                        if(mobHP[j] === 0)
                                        {
                                            rtnStr += "  - " + _moblist[j].name + "이(가) 제거됨\n";
                                            rtnStr += _JudgDrop(_moblist[j].index, _moblist[j].name, _moblist[j].dropItem, _moblist[j].droprune, _moblist[j].exp, _userObj, _MercenaryManager, _b_buff, recordRune);
                                            rtnStr += BattleLogFlag?"\n\n":"";
                                            _addRecordMob(recordMobList, _moblist[j].index, 1);

                                            if(userCC.provo === j) {
                                                userCC.provo = Not_ProvoTarget;
                                            }
                                            else if(userCC.provo > j){
                                                userCC.provo--;
                                            }
                                            for(c = 0; c < merCC.length; ++c) {
                                                if(merCC[c].provo === j) {
                                                    merCC[c].provo = Not_ProvoTarget;
                                                }
                                                else if(merCC[c].provo > j){
                                                    merCC[c].provo--;
                                                }
                                            }
                                            for(c = 0; c < smnCC.length; ++c) {
                                                if(smnCC[c].provo === j) {
                                                    smnCC[c].provo = Not_ProvoTarget;
                                                }
                                                else if(smnCC[c].provo > j){
                                                    smnCC[c].provo--;
                                                }
                                            }

                                            mobretireList.push({mob:_moblist[j], hp:mobHP[j], mp:mobMP[j], sp:mobSP[j]});
                                            _JudgQuestCount(_moblist[j].index, _userObj);
                                            _moblist.splice(j,1);
                                            mobattspdCounter.splice(j,1);
                                            mobAttspd.splice(j,1);
                                            mobCC.splice(j,1);
                                            mobEffect.splice(j,1);
                                            mobHP.splice(j,1);
                                            mobMP.splice(j,1);
                                            mobSP.splice(j,1);
                                            j--;
                                            length -= 1;
                                        }
                                    }
                                    else {
                                        if(tmpSkill.cc !== null ) {
                                            rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                            if(mobEffect[j].n_dth) {
                                                tmpSkill.cc.deathcount = ((mobCC[j].deathcount > 1)?(mobCC[j].deathcount - 1):mobCC[j].deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }
                                            mobCC[j] = tmpSkill.cc;
                                            if(mobCC[j].effect.indexOf("provo") !== -1)
                                                mobCC[j].provo = ourList[i];
                                        }
                                        rtnStr += BattleLogFlag?"":("  - " +  _moblist[j].name + "이(가) 회피\n");
                                    }
                                    rtnStr += BattleLogFlag?"":("\n");
                                }
                            }
                        }
                        rtnStr += BattleLogFlag?"":("\n");
                    }
                }
                else {
                    summonOriginIdx = ourList[i];
                    summonIdx = Number(summonOriginIdx.substring(1));
                    smnattspdCounter[summonIdx] -= (A('s', smnAttspd[summonIdx], merAura) - Math.floor(A('s', smnAttspd[summonIdx], merAura) * smnCC[summonIdx].slowrate));
                    if(smnattspdCounter[summonIdx] <= 0) {
                        smnattspdCounter[summonIdx] = AttMaxSpd + smnattspdCounter[summonIdx];
                        targetsummon = summonlist[summonIdx];
                        targetSummonDB = summonDB[targetsummon.index];
                        selMob = libCommon.Rand(0,_moblist.length - 1);

                        targetsummon.keepturn -= 1;
                        rtnStr += BattleLogFlag?"":("(" + targetsummon.mobname + "턴 시작 > " + targetsummon.keepturn + "턴 남음) \n");

                        if(targetsummon.keepturn <= 0) {
                            rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "이(가) 유지 시간이 종료 되어 소멸됩니다.\n\n");
                            for(c = 0; c < mobCC.length; ++c) {
                                if(mobCC[c].provo == summonOriginIdx)
                                    mobCC[c].provo = Not_ProvoTarget;
                            }

                            ourList.splice(ourList.indexOf(summonOriginIdx),1);
                            targetsummon.ability.hp = 0;
                            smnattspdCounter[summonIdx] = AttMaxSpd;
                            _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                            continue;
                        }
                        totalCnt++;
                        if(smnCC[summonIdx].continue !== 0) {
                            if(smnCC[summonIdx].damage !== 0) {
                                tmpHp = targetsummon.ability.hp;
                                tmpCc = Math.floor(Number(targetSummonDB.ability.hp) * smnCC[summonIdx].damage);
                                targetsummon.ability.hp -= tmpCc;
                                if(targetsummon.ability.hp < 0)
                                    targetsummon.ability.hp = 0;

                                rtnStr += BattleLogFlag?"":("  - " + smnCC[summonIdx].name + "의 효과로 " + tmpCc + " 데미지 발생\n");
                                rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "의 Hp가 " + tmpHp + " -> " + targetsummon.ability.hp + "로 줄어듬\n");

                                if(targetsummon.ability.hp === 0)
                                {
                                    rtnStr += BattleLogFlag?"":("  - " + targetsummon.mobname + "이(가) 정신을 잃었습니다\n");
                                    for(c = 0; c < mobCC.length; ++c) {
                                        if(mobCC[c].provo == summonOriginIdx)
                                            mobCC[c].provo = Not_ProvoTarget;
                                    }

                                    ourList.splice(ourList.indexOf(summonOriginIdx),1);
                                    smnattspdCounter[summonIdx] = AttMaxSpd;
                                    _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                                    continue;
                                }
                            }

                            if(smnCC[summonIdx].provo !== Not_ProvoTarget && smnCC[summonIdx].provo < _moblist.length) {
                                rtnStr += BattleLogFlag?"":("  - " + smnCC[summonIdx].name + "의 효과로 " + _moblist[smnCC[summonIdx].provo].name + "을(를) 타겟팅합니다.\n");
                                selMob = smnCC[summonIdx].provo;
                            }

                            _RemoveCC(null, smnEffect[summonIdx]);
                            if(smnCC[summonIdx].effect !== ""){
                                effectlist = smnCC[summonIdx].effect.split(";");
                                for(j = 0; j < effectlist.length; ++j) {
                                    if(effectlist[j] === "attack") {smnEffect[summonIdx].n_att = true;}
                                    if(effectlist[j] === "skill") {smnEffect[summonIdx].n_skl = true;}
                                    if(effectlist[j] === "potion") {smnEffect[summonIdx].n_pot = true;}
                                    if(effectlist[j] === "avoid") {smnEffect[summonIdx].n_avd = true;}
                                    if(effectlist[j] === "provo") {smnEffect[summonIdx].n_prv = true;}
                                    if(effectlist[j] === "slow") {smnEffect[summonIdx].n_slw = true;}
                                    if(effectlist[j] === "dth") {smnEffect[summonIdx].n_dth = true;}
                                }
                            }
                            smnCC[summonIdx].continue--;

                            if(smnEffect[summonIdx].n_dth) {
                                smnCC[summonIdx].deathcount--;
                                if(smnCC[summonIdx].deathcount === 0) {
                                    rtnStr += BattleLogFlag?"":("  - " + smnCC[summonIdx].name + "의 효과로 " + targetsummon.mobname + "는 즉사 합니다.\n");
                                    for(c = 0; c < mobCC.length; ++c) {
                                        if(mobCC[c].provo == summonOriginIdx)
                                            mobCC[c].provo = Not_ProvoTarget;
                                    }

                                    ourList.splice(ourList.indexOf(summonOriginIdx),1);
                                    targetsummon.ability.hp = 0;
                                    smnattspdCounter[summonIdx] = AttMaxSpd;
                                    _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                                    continue;
                                }
                                else {
                                    rtnStr += BattleLogFlag?"":("  - " + smnCC[summonIdx].name + " 효과의 남은 카운터 : " + smnCC[summonIdx].deathcount + "\n");
                                }
                            }
                        }
                        else {
                            _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                        }

                        if(smnEffect[summonIdx].n_skl) {
                            rtnStr += BattleLogFlag?"":("  - " + smnCC[summonIdx].name + "의 효과로 회복 스킬을 사용할 수 없습니다.\n");
                            tmpHealing = {heal:0};
                        }
                        else {
                            tmpHealing = _JudgSmnHealSkill(targetsummon, _userObj, userMaxHP, _mercentlist, summonlist, summonDB, ourList, merAura);
                            if(tmpHealing.comment !== "") {
                                rtnStr += BattleLogFlag?"":(tmpHealing.comment + "\n");
                            }
                        }

                        if(smnEffect[summonIdx].n_skl) {
                            rtnStr += BattleLogFlag?"":("  - " +  smnCC[summonIdx].name + "의 효과로 상태이상회복 스킬을 사용할 수 없습니다.\n");
                            tmpCCRecovery = {jude:false};
                        }
                        else if(tmpHealing.heal === 0) {
                            tmpCCRecovery = _JudgSmnCureSkill(targetsummon, userCC, merCC, smnCC, merMatchingTable, summonDB, ourList);
                            if(tmpCCRecovery.comment !== "") {
                                rtnStr += BattleLogFlag?"":(tmpCCRecovery.comment + "\n");
                            }
                        }
                        else {
                            tmpCCRecovery = {jude:false};
                        }

                        if(tmpHealing.heal !== 0) {
                            var healindex, healSummon, healSummonTarget, healMercent, healMercentDB;
                            targetsummon.ability.hp -= tmpHealing.removehp;
                            targetsummon.ability.mp -= tmpHealing.removemp;
                            targetsummon.ability.sp -= tmpHealing.removesp;


                            rtnStr += BattleLogFlag?"":("  - [" + tmpHealing.name + "] 스킬을 시전\n");
                            if(tmpHealing.removehp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpHealing.removehp + ", 남아있는 HP : " + targetsummon.ability.hp + "\n");
                            if(tmpHealing.removemp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpHealing.removemp + ", 남아있는 MP : " + targetsummon.ability.mp + "\n");
                            if(tmpHealing.removesp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpHealing.removesp + ", 남아있는 SP : " + targetsummon.ability.sp + "\n");

                            if(tmpHealing.range === "single")
                            {
                                if(ourList[tmpHealing.targetidx] === -1){
                                    rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    _userObj.RecoveryforNum("hp", tmpHealing.heal);
                                }
                                else if(_isSummonMob(ourList[tmpHealing.targetidx])){
                                    healSummon = Number(ourList[tmpHealing.targetidx].substring(1));
                                    healSummonTarget = summonlist[healSummon];
                                    rtnStr += BattleLogFlag?"":("  - " + healSummonTarget.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    healSummonTarget.ability.hp += tmpHealing.heal;
                                    if(healSummonTarget.ability.hp > summonDB[healSummonTarget.index].ability.hp) {
                                        healSummonTarget.ability.hp = summonDB[healSummonTarget.index].ability.hp;
                                    }
                                }
                                else {
                                    healMercent = _mercentlist[ourList[tmpHealing.targetidx]];
                                    healMercentDB = db_Manager.getMercenary(healMercent.index);
                                    rtnStr += BattleLogFlag?"":("  - " + healMercent.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    healMercent.hp += tmpHealing.heal;
                                    if(healMercent.hp > Number(healMercentDB.ability.hp)) {
                                        healMercent.hp = Number(healMercentDB.ability.hp);
                                    }
                                }
                            }
                            else {
                                rtnStr += BattleLogFlag?"":("  - 아군 전체 회복!!!!!!!!\n");

                                for(hs = 0; hs < ourList.length; ++hs) {
                                    healindex = ourList[hs];
                                    if(healindex === -1) {
                                        rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                        _userObj.RecoveryforNum("hp", tmpHealing.heal);
                                    }
                                    else if(_isSummonMob(healindex)) {
                                        healSummon = Number(healindex.substring(1));
                                        healSummonTarget = summonlist[healSummon];
                                        rtnStr += BattleLogFlag?"":("  - " + healSummonTarget.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                        healSummonTarget.ability.hp += tmpHealing.heal;
                                        if(healSummonTarget.ability.hp > summonDB[healSummonTarget.index].ability.hp) {
                                            healSummonTarget.ability.hp = summonDB[healSummonTarget.index].ability.hp;
                                        }
                                    }
                                    else {
                                        healMercent = _mercentlist[healindex];
                                        healMercentDB = db_Manager.getMercenary(healMercent.index);

                                        rtnStr += BattleLogFlag?"":("  - "+ healMercent.name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                        healMercent.hp += tmpHealing.heal;
                                        if(healMercent.hp > Number(healMercentDB.ability.hp)) {
                                            healMercent.hp = Number(healMercentDB.ability.hp);
                                        }
                                    }
                                }
                            }
                        }
                        else if(tmpCCRecovery.jude) {
                            var cureindex, cureMercent;
                            targetsummon.ability.hp -= tmpCCRecovery.removehp;
                            targetsummon.ability.mp -= tmpCCRecovery.removemp;
                            targetsummon.ability.sp -= tmpCCRecovery.removesp;


                            rtnStr += BattleLogFlag?"":("  - [" + tmpCCRecovery.name + "] 스킬을 시전\n");
                            if(tmpCCRecovery.removehp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpCCRecovery.removehp + ", 남아있는 HP : " + targetsummon.ability.hp + "\n");
                            if(tmpCCRecovery.removemp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpCCRecovery.removemp + ", 남아있는 MP : " + targetsummon.ability.mp + "\n");
                            if(tmpCCRecovery.removesp !== "0")
                                rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpCCRecovery.removesp + ", 남아있는 SP : " + targetsummon.ability.sp + "\n");

                            if(tmpCCRecovery.range === "single")
                            {
                                if(ourList[tmpCCRecovery.targetidx] === -1){
                                    rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "의 CC 제거\n");
                                    _RemoveCC(userCC, userEffect);
                                }
                                else if(_isSummonMob(tmpCCRecovery.targetidx)) {
                                    cureMercent = Number(tmpCCRecovery.targetidx.substring(1));
                                    rtnStr += BattleLogFlag?"":("  - " + summonlist[cureMercent].mobname + "의 CC 제거\n");
                                    _RemoveCC(smnCC[cureMercent], smnEffect[cureMercent]);
                                }
                                else {
                                    cureMercent = _mercentlist[ourList[tmpCCRecovery.targetidx]];
                                    cureindex = merMatchingTable[ourList[tmpCCRecovery.targetidx]];

                                    rtnStr += BattleLogFlag?"":("  - " + cureMercent.name + "의 CC 제거\n");
                                    _RemoveCC(merCC[cureindex], merEffect[cureindex]);

                                }
                            }
                            else {
                                rtnStr += BattleLogFlag?"":("  - 아군 전체 CC 제거!!!!!!!!\n");

                                for(hs = 0; hs < ourList.length; ++hs) {
                                    if(ourList[hs] === -1) {
                                        rtnStr += BattleLogFlag?"":("  - "+ _userObj.name + "의 CC 제거\n");
                                        _RemoveCC(userCC, userEffect);
                                    }
                                    else if(_isSummonMob(ourList[hs])) {
                                        cureMercent = Number(ourList[hs].substring(1));
                                        rtnStr += BattleLogFlag?"":("  - " + summonlist[cureMercent].mobname + "의 CC 제거\n");
                                        _RemoveCC(smnCC[summonIdx], smnEffect[summonIdx]);
                                    }
                                    else {
                                        cureMercent = _mercentlist[ourList[hs]];
                                        cureindex = merMatchingTable[ourList[hs]];

                                        rtnStr += BattleLogFlag?"":("  - " + cureMercent.name + "의 CC 제거\n");
                                        _RemoveCC(merCC[cureindex], merEffect[cureindex]);
                                    }
                                }
                            }
                        }
                        else {
                            if(smnEffect[summonIdx].n_att) {
                                rtnStr += BattleLogFlag?"":("  - " + smnCC[summonIdx].name + "의 효과로 공격이 불가합니다.\n");
                            }
                            else {
                                tmpCri = {cri:0};
                                if(smnEffect[summonIdx].n_skl) {
                                    rtnStr += BattleLogFlag?"":("  - " + smnCC[summonIdx].name + "의 효과로 스킬을 사용할 수 없습니다.\n");
                                    tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
                                }
                                else {
                                    tmpSkill = _JudbSmnSkill(_moblist[selMob], targetsummon, tmpCri, summonDB, merAura);
                                }

                                start = 0, length = 0;
                                if(tmpSkill.range === "single") {
                                    start = selMob;
                                    length = selMob + 1;
                                }
                                else {
                                    rtnStr += BattleLogFlag?"":("  - [" + tmpSkill.name + "] 전체 스킬 판정!\n");
                                    if(tmpSkill.count >= _moblist.length){
                                        start = 0;
                                        length = _moblist.length;
                                    }
                                    else {
                                        r = tmpSkill.count - (selMob + 1);
                                        if(r >= 0){
                                            start = 0;
                                            length = tmpSkill.count;
                                        }
                                        else {
                                            start = -r;
                                            length = tmpSkill.count - r;
                                        }
                                    }
                                }

                                tmpAbility = _getCurrVitality(tmpSkill.skillkind, targetSummonDB.ability, targetsummon.ability);
                                tmpSubAbility = _getCurrVitality(tmpSkill.skillsubkind, targetSummonDB.ability, targetsummon.ability);

                                if(tmpSkill.damage !== 0) {
                                    targetsummon.ability.hp -= tmpSkill.removehp;
                                    targetsummon.ability.mp -= tmpSkill.removemp;
                                    targetsummon.ability.sp -= tmpSkill.removesp;


                                    rtnStr += BattleLogFlag?"":("  - [" + tmpSkill.name + "] 스킬을 시전\n");
                                    if(tmpSkill.removehp !== "0")
                                        rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + targetsummon.ability.hp + "\n");
                                    if(tmpSkill.removemp !== "0")
                                        rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + targetsummon.ability.mp + "\n");
                                    if(tmpSkill.removesp !== "0")
                                        rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + targetsummon.ability.sp + "\n");
                                }

                                for(j = start; j < length; ++j) {
                                    rtnStr += BattleLogFlag?"":("  - " + _moblist[j].name + "을(를) 공격\n");
                                    if(tmpSkill.damage !== 0)
                                    {
                                        if(tmpSkill.range === "single") {
                                            tmpDamage = tmpSkill.damage;
                                        }
                                        else {
                                            tmpDamage = _SkillCalcDamage(A(tmpSkill.skillkind, tmpAbility, merAura), A(tmpSkill.skillsubkind, tmpSubAbility, merAura), {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, _moblist[j].ability.defense);
                                            if(tmpCri.cri === 1) {
                                                tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(A("c", targetSummonDB.ability.critical, merAura), _moblist[j].ability.critical));
                                            }
                                            if(tmpDamage <= 0)
                                                tmpDamage = 1;
                                        }
                                    }
                                    else {
                                        if(tmpSkill.comment !== ""){
                                            rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                        }

                                        tmpDamage = _JudgAttack(A("a", targetSummonDB.ability.attack, merAura), A("c", targetSummonDB.ability.critical, merAura), _moblist[j].ability.critical, _moblist[j].ability.defense, CriticalRate, tmpCri);
                                    }

                                    tmpHp = mobHP[j];
                                    rtnStr += BattleLogFlag?"":("  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n");

                                    if(mobEffect[j].n_avd) {
                                        rtnStr += BattleLogFlag?"":("  - " + mobCC[j].name + "의 효과로 상대방은 회피를 할 수 없습니다.\n");
                                    }

                                    if(mobEffect[j].n_avd || _JudgAvoid(A("r", targetSummonDB.ability.accuracy, merAura), _moblist[j].ability.avoid)) {
                                        mobHP[j] -= tmpDamage;
                                        _WBParam.accumulateDamage = Number(_WBParam.accumulateDamage) + Number(tmpDamage);
                                        if(mobHP[j] < 0)
                                            mobHP[j] = 0;

                                        rtnStr += BattleLogFlag?"":("  - " + _moblist[j].name + "의 Hp가 " + tmpHp + " -> " + mobHP[j] + "로 줄어듬\n");

                                        if(tmpSkill.cc !== null ) {
                                            rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                            if(mobEffect[j].n_dth) {
                                                tmpSkill.cc.deathcount = ((mobCC[j].deathcount > 1)?(mobCC[j].deathcount - 1):mobCC[j].deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }
                                            mobCC[j] = tmpSkill.cc;
                                            if(mobCC[j].effect.indexOf("provo") !== -1)
                                                mobCC[j].provo = ourList[i];
                                        }

                                        if(mobHP[j] === 0)
                                        {
                                            rtnStr += "  - " + _moblist[j].name + "이(가) 제거됨\n";
                                            rtnStr += _JudgDrop(_moblist[j].index, _moblist[j].name, _moblist[j].dropItem, _moblist[j].droprune, _moblist[j].exp, _userObj, _MercenaryManager, _b_buff, recordRune);
                                            rtnStr += BattleLogFlag?"\n\n":"";
                                            _addRecordMob(recordMobList, _moblist[j].index, 1);

                                            if(userCC.provo === j) {
                                                userCC.provo = Not_ProvoTarget;
                                            }
                                            else if(userCC.provo > j){
                                                userCC.provo--;
                                            }
                                            for(c = 0; c < merCC.length; ++c) {
                                                if(merCC[c].provo === j) {
                                                    merCC[c].provo = Not_ProvoTarget;
                                                }
                                                else if(merCC[c].provo > j){
                                                    merCC[c].provo--;
                                                }
                                            }
                                            for(c = 0; c < smnCC.length; ++c) {
                                                if(smnCC[c].provo === j) {
                                                    smnCC[c].provo = Not_ProvoTarget;
                                                }
                                                else if(smnCC[c].provo > j){
                                                    smnCC[c].provo--;
                                                }
                                            }

                                            mobretireList.push({mob:_moblist[j], hp:mobHP[j], mp:mobMP[j], sp:mobSP[j]});
                                            _JudgQuestCount(_moblist[j].index, _userObj);
                                            _moblist.splice(j,1);
                                            mobattspdCounter.splice(j,1);
                                            mobAttspd.splice(j,1);
                                            mobCC.splice(j,1);
                                            mobEffect.splice(j,1);
                                            mobHP.splice(j,1);
                                            mobMP.splice(j,1);
                                            mobSP.splice(j,1);
                                            j--;
                                            length -= 1;
                                        }
                                    }
                                    else {
                                        if(tmpSkill.cc !== null ) {
                                            rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                            if(mobEffect[j].n_dth) {
                                                tmpSkill.cc.deathcount = ((mobCC[j].deathcount > 1)?(mobCC[j].deathcount - 1):mobCC[j].deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }
                                            mobCC[j] = tmpSkill.cc;
                                            if(mobCC[j].effect.indexOf("provo") !== -1)
                                                mobCC[j].provo = ourList[i];
                                        }
                                        rtnStr += BattleLogFlag?"":("  - " +  _moblist[j].name + "이(가) 회피\n");
                                    }
                                    rtnStr += BattleLogFlag?"":("\n");
                                }
                            }
                        }
                        rtnStr += BattleLogFlag?"":("\n");
                    }
                }
            }
            for(i = _moblist.length - 1; i >= 0; --i) {
                if(ourList.length === 0){
                    break;
                }

                mobattspdCounter[i] -= (mobAttspd[i] - Math.floor(mobAttspd[i] * mobCC[i].slowrate));
                if(mobattspdCounter[i] <= 0) {
                    mobattspdCounter[i] = AttMaxSpd + mobattspdCounter[i];
                    targetMob = _moblist[i];
                    tmpOurIdx = libCommon.Rand(0, ourList.length - 1);
                    tmpOur = ourList[tmpOurIdx];

                    rtnStr += BattleLogFlag?"":("(" + targetMob.name + "턴 시작)\n");
                    totalCnt++;
                    if(mobCC[i].continue !== 0) {
                        if(mobCC[i].damage !== 0) {
                            tmpHp = mobHP[i];
                            tmpCc = Math.floor(Number(targetMob.ability.hp) * mobCC[i].damage);
                            mobHP[i] -= tmpCc;
                            _WBParam.accumulateDamage = Number(_WBParam.accumulateDamage) + Number(tmpCc);
                            if(mobHP[i] < 0)
                                mobHP[i] = 0;

                            rtnStr += BattleLogFlag?"":("  - " + mobCC[i].name + "의 효과로 " + tmpCc + " 데미지 발생\n");
                            rtnStr += BattleLogFlag?"":("  - " + targetMob.name + "의 Hp가 " + tmpHp + " -> " + mobHP[i] + "로 줄어듬\n");

                            if(mobHP[i] === 0)
                            {
                                rtnStr += "  - " + targetMob.name + "이(가) 제거됨\n";
                                rtnStr += _JudgDrop(targetMob.index, targetMob.name, targetMob.dropItem, targetMob.droprune, targetMob.exp, _userObj, _MercenaryManager, _b_buff, recordRune);
                                rtnStr += BattleLogFlag?"\n\n":"";
                                if(userCC.provo === i) {
                                    userCC.provo = Not_ProvoTarget;
                                }
                                else if(userCC.provo > i){
                                    userCC.provo--;
                                }
                                for(c = 0; c < merCC.length; ++c) {
                                    if(merCC[c].provo === i) {
                                        merCC[c].provo = Not_ProvoTarget;
                                    }
                                    else if(merCC[c].provo > i){
                                        merCC[c].provo--;
                                    }
                                }
                                for(c = 0; c < smnCC.length; ++c) {
                                    if(smnCC[c].provo === i) {
                                        smnCC[c].provo = Not_ProvoTarget;
                                    }
                                    else if(smnCC[c].provo > i){
                                        smnCC[c].provo--;
                                    }
                                }

                                _addRecordMob(recordMobList, _moblist[i].index, 1);

                                mobretireList.push({mob:_moblist[i], hp:mobHP[i], mp:mobMP[i], sp:mobSP[i]});
                                _JudgQuestCount(_moblist[i].index, _userObj);
                                _moblist.splice(i,1);
                                mobattspdCounter.splice(i,1);
                                mobAttspd.splice(i,1);
                                mobCC.splice(i,1);
                                mobEffect.splice(i,1);
                                mobHP.splice(i,1);
                                mobMP.splice(i,1);
                                mobSP.splice(i,1);

                                continue;
                            }
                        }
                        if(mobCC[i].provo !== Not_ProvoTarget) {
                            if(_isSummonMob(mobCC[i].provo)) {
                                summonIdx = Number(mobCC[i].provo.substring(1));
                                if(ourList.indexOf(mobCC[i].provo) !== -1 && summonIdx < summonlist.length) {
                                    rtnStr += BattleLogFlag?"":("  - " + summonlist[summonIdx].mobname + "을(를) 타겟팅합니다.\n");
                                    tmpOurIdx = ourList.indexOf(mobCC[i].provo);
                                    tmpOur = mobCC[i].provo;
                                }
                                else {
                                    mobCC[i].provo = Not_ProvoTarget;
                                }
                            }
                            else {
                                if(mobCC[i].provo < _mercentlist.length) {
                                    rtnStr += BattleLogFlag?"":("  - " + ((mobCC[i].provo === -1)?_userObj.name:_mercentlist[mobCC[i].provo].name) + "을(를) 타겟팅합니다.\n");
                                    tmpOurIdx = ourList.indexOf(mobCC[i].provo);
                                    tmpOur = mobCC[i].provo;
                                }
                                else {
                                    mobCC[i].provo = Not_ProvoTarget;
                                }
                            }
                        }

                        _RemoveCC(null, mobEffect[i]);
                        if(mobCC[i].effect !== ""){
                            effectlist = mobCC[i].effect.split(";");
                            for(j = 0; j < effectlist.length; ++j) {
                                if(effectlist[j] === "attack") {mobEffect[i].n_att = true;}
                                if(effectlist[j] === "skill") {mobEffect[i].n_skl = true;}
                                if(effectlist[j] === "potion") {mobEffect[i].n_pot = true;}
                                if(effectlist[j] === "avoid") {mobEffect[i].n_avd = true;}
                                if(effectlist[j] === "provo") {mobEffect[i].n_prv = true;}
                                if(effectlist[j] === "slow") {mobEffect[i].n_slw = true;}
                                if(effectlist[j] === "dth") {mobEffect[i].n_dth = true;}
                            }
                        }
                        mobCC[i].continue--;

                        if(mobEffect[i].n_dth) {
                              mobCC[i].deathcount--;
                            if(mobCC[i].deathcount === 0) {
                                rtnStr += "  - " + mobCC[i].name + "의 효과로 " + targetMob.name + "는 즉사 합니다.\n";
                                rtnStr += _JudgDrop(targetMob.index, targetMob.name, targetMob.dropItem, targetMob.droprune, targetMob.exp, _userObj, _MercenaryManager, _b_buff, recordRune);
                                rtnStr += BattleLogFlag?"\n\n":"";
                                if(userCC.provo === i) {
                                    userCC.provo = Not_ProvoTarget;
                                }
                                else if(userCC.provo > i){
                                    userCC.provo--;
                                }
                                for(c = 0; c < merCC.length; ++c) {
                                    if(merCC[c].provo === i) {
                                        merCC[c].provo = Not_ProvoTarget;
                                    }
                                    else if(merCC[c].provo > i){
                                        merCC[c].provo--;
                                    }
                                }
                                for(c = 0; c < smnCC.length; ++c) {
                                    if(smnCC[c].provo === i) {
                                        smnCC[c].provo = Not_ProvoTarget;
                                    }
                                    else if(smnCC[c].provo > i){
                                        smnCC[c].provo--;
                                    }
                                }

                                _addRecordMob(recordMobList, _moblist[i].index, 1);

                                mobretireList.push({mob:_moblist[i], hp:mobHP[i], mp:mobMP[i], sp:mobSP[i]});
                                _JudgQuestCount(_moblist[i].index, _userObj);
                                _moblist.splice(i,1);
                                mobattspdCounter.splice(i,1);
                                mobAttspd.splice(i,1);
                                mobCC.splice(i,1);
                                mobEffect.splice(i,1);
                                mobHP.splice(i,1);
                                mobMP.splice(i,1);
                                mobSP.splice(i,1);

                                continue;
                            }
                            else {
                                rtnStr += BattleLogFlag?"":("  - " + mobCC[i].name + " 효과의 남은 카운터 : " + mobCC[i].deathcount + "\n");
                            }
                        }

                    }
                    else {
                        _RemoveCC(mobCC[i], mobEffect[i]);
                    }

                    if(mobEffect[i].n_skl) {
                        rtnStr += BattleLogFlag?"":("  - " + mobCC[i].name + "의 효과로 회복 스킬을 사용할 수 없습니다.\n");
                        tmpHealing = {heal:0};
                    }
                    else {
                        tmpHealing = _JudgMobHealSkill(_moblist, targetMob, mobHP[i], mobMP[i], mobSP[i], mobHP, mobretireList);
                        if(tmpHealing.comment !== "") {
                            rtnStr += BattleLogFlag?"":(tmpHealing.comment + "\n");
                        }
                    }

                    if(mobEffect[i].n_skl) {
                        rtnStr += BattleLogFlag?"":("  - " +  mobCC[i].name + "의 효과로 상태이상회복 스킬을 사용할 수 없습니다.\n");
                        tmpCCRecovery = {jude:false};
                    }
                    else if(tmpHealing.heal === 0) {
                        tmpCCRecovery = _JudgMobCureSkill(targetMob, mobCC, mobHP[i], mobMP[i], mobSP[i]);
                        if(tmpCCRecovery.comment !== "") {
                            rtnStr += BattleLogFlag?"":(tmpCCRecovery.comment + "\n");
                        }
                    }
                    else {
                        tmpCCRecovery = {jude:false};
                    }

                    var reviveIndex = -1;
                    if(tmpHealing.heal !== 0) {
                        mobHP[i] -= tmpHealing.removehp;
                        mobMP[i] -= tmpHealing.removemp;
                        mobSP[i] -= tmpHealing.removesp;

                        rtnStr += BattleLogFlag?"":("  - [" + tmpHealing.name + "] 스킬을 시전\n");
                        if(tmpHealing.removehp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpHealing.removehp + ", 남아있는 HP : " + mobHP[i] + "\n");
                        if(tmpHealing.removemp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpHealing.removemp + ", 남아있는 MP : " + mobMP[i] + "\n");
                        if(tmpHealing.removesp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpHealing.removesp + ", 남아있는 SP : " + mobSP[i] + "\n");

                        if(tmpHealing.range === "single")
                        {
                            if(tmpHealing.type === "revive") {
                                reviveIndex = _moblist.length;
                                _moblist.push(tmpHealing.targetidx[0].mob);
                                mobattspdCounter.push(AttMaxSpd);
                                mobAttspd.push(Number(tmpHealing.targetidx[0].mob.ability.atkspeed));
                                mobCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
                                mobEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
                                mobHP.push(tmpHealing.heal);
                                mobMP.push(tmpHealing.targetidx[0].mp);
                                mobSP.push(tmpHealing.targetidx[0].sp);

                                rtnStr += BattleLogFlag?"":("  - "+ _moblist[reviveIndex].name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n");

                            }
                            else if(tmpHealing.type === "heal") {
                                rtnStr += BattleLogFlag?"":("  - "+ _moblist[tmpHealing.targetidx[0]].name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                mobHP[tmpHealing.targetidx[0]] += tmpHealing.heal;
                            }
                            
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - 아군 전체 회복!!!!!!!!\n");
                            
                            for(hs = 0; hs < tmpHealing.targetidx.length; ++hs) {

                                if(tmpHealing.type === "revive") {
                                    reviveIndex = _moblist.length;
                                    _moblist.push(tmpHealing.targetidx[hs].mob);
                                    mobattspdCounter.push(AttMaxSpd);
                                    mobAttspd.push(Number(tmpHealing.targetidx[hs].mob.ability.atkspeed));
                                    mobCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
                                    mobEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
                                    mobHP.push(tmpHealing.heal);
                                    mobMP.push(tmpHealing.targetidx[hs].mp);
                                    mobSP.push(tmpHealing.targetidx[hs].sp);

                                    rtnStr += BattleLogFlag?"":("  - "+ _moblist[reviveIndex].name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n");
                                }
                                else if(tmpHealing.type === "heal") {
                                    rtnStr += BattleLogFlag?"":("  - "+ _moblist[tmpHealing.targetidx[hs]].name + "에게 " + tmpHealing.heal + "을(를) 회복\n");
                                    mobHP[tmpHealing.targetidx[hs]] += tmpHealing.heal;
                                }
                            }
                        }

                        _WBParam.accumulateDamage = Number(_WBParam.accumulateDamage) - tmpHealing.heal;
                    }
                    else if(tmpCCRecovery.jude) {
                        mobHP[i] -= tmpCCRecovery.removehp;
                        mobMP[i] -= tmpCCRecovery.removemp;
                        mobSP[i] -= tmpCCRecovery.removesp;

                        rtnStr += BattleLogFlag?"":("  - [" + tmpCCRecovery.name + "] 스킬을 시전\n");
                        if(tmpCCRecovery.removehp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpCCRecovery.removehp + ", 남아있는 HP : " + mobHP[i] + "\n");
                        if(tmpCCRecovery.removemp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpCCRecovery.removemp + ", 남아있는 MP : " + mobMP[i] + "\n");
                        if(tmpCCRecovery.removesp !== "0")
                            rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpCCRecovery.removesp + ", 남아있는 SP : " + mobSP[i] + "\n");

                        if(tmpCCRecovery.range === "single")
                        {
                            rtnStr += BattleLogFlag?"":("  - "+ _moblist[tmpCCRecovery.targetidx].name + "의 CC 제거\n");
                            _RemoveCC(mobCC[tmpCCRecovery.targetidx], mobEffect[tmpCCRecovery.targetidx]);
                        }
                        else {
                            rtnStr += BattleLogFlag?"":("  - 아군 전체 CC 제거!!!!!!!!\n");
                            for(hs = 0; hs < _moblist.length; ++hs) {
                                rtnStr += BattleLogFlag?"":("  - "+ _moblist[hs].name + "의 CC 제거\n");
                                _RemoveCC(mobCC[hs], mobEffect[hs]);
                            }
                        }
                    }
                    else {
                        if(mobEffect[i].n_att) {
                            rtnStr += BattleLogFlag?"":("  - " + mobCC[i].name + "의 효과로 공격이 불가합니다.\n");
                        }
                        else {
                            tmpCri = {cri:0};
                            if(mobEffect[i].n_skl) {
                                rtnStr += BattleLogFlag?"":("  - " + mobCC[i].name + "의 효과로 스킬을 사용할 수 없습니다.\n");
                                tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
                            }
                            else {
                                tmpSkill = _JudgMobSkill(A("d",_getOurAbility(tmpOur, _userObj, _mercentlist, summonlist, summonDB, false).defense, merAura), A("c",_getOurAbility(tmpOur, _userObj, _mercentlist, summonlist, summonDB, false).critical, merAura), targetMob, mobHP[i], mobMP[i], mobSP[i], tmpCri);
                            }

                            start = 0, length = 0;
                            if(tmpSkill.range === "single") {
                                start = tmpOurIdx;
                                length = tmpOurIdx + 1;
                            }
                            else {
                                rtnStr += BattleLogFlag?"":("  - [" + tmpSkill.name + "] 전체 스킬 판정!\n");
                                if(tmpSkill.count >= ourList.length){
                                    start = 0;
                                    length = ourList.length;
                                }
                                else {
                                    r = tmpSkill.count - (tmpOurIdx + 1);
                                    if(r >= 0){
                                        start = 0;
                                        length = tmpSkill.count;
                                    }
                                    else {
                                        start = -r;
                                        length = tmpSkill.count - r;
                                    }
                                }
                            }

                            tmpAbility = _getCurrVitality(tmpSkill.skillkind, targetMob.ability, {hp:mobHP[i] , mp:mobMP[i] , sp:mobSP[i]});
                            tmpSubAbility = _getCurrVitality(tmpSkill.skillsubkind, targetMob.ability, {hp:mobHP[i] , mp:mobMP[i] , sp:mobSP[i]});

                            if(tmpSkill.damage !== 0)
                            {
                                mobHP[i] -= tmpSkill.removehp;
                                mobMP[i] -= tmpSkill.removemp;
                                mobSP[i] -= tmpSkill.removesp;

                                _WBParam.accumulateDamage = Number(_WBParam.accumulateDamage) + Number(tmpSkill.removehp);

                                rtnStr += BattleLogFlag?"":("  - [" + tmpSkill.name + "] 스킬을 시전\n");
                                if(tmpSkill.removehp !== "0")
                                    rtnStr += BattleLogFlag?"":("  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + mobHP[i]);
                                if(tmpSkill.removemp !== "0")
                                    rtnStr += BattleLogFlag?"":("  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + mobMP[i]);
                                if(tmpSkill.removesp !== "0")
                                    rtnStr += BattleLogFlag?"":("  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + mobSP[i]);
                                rtnStr += BattleLogFlag?"":(" \n");
                            }

                            for(j = start; j < length; ++j) {
                                tmpOurIdx = j;
                                tmpOur = ourList[tmpOurIdx];
                                summonIdx = _isSummonMob(tmpOur)?Number(tmpOur.substring(1)):0;
                                rtnStr += BattleLogFlag?"":("  - " + ((tmpOur === -1)?_userObj.name:(_isSummonMob(tmpOur)?summonlist[summonIdx].mobname:_mercentlist[tmpOur].name)) + "을(를) 공격\n");
                                if(tmpSkill.damage !== 0) {
                                    if(tmpSkill.range === "single") {
                                        tmpDamage = tmpSkill.damage;
                                    }
                                    else {
                                        tmpDamage = _SkillCalcDamage(tmpAbility, tmpSubAbility, {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, A("d",_getOurAbility(tmpOur, _userObj, _mercentlist, summonlist, summonDB, false).defense, merAura));
                                        if(tmpCri.cri === 1) {
                                            tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(targetMob.ability.critical, A("c",_getOurAbility(tmpOur, _userObj, _mercentlist, summonlist, summonDB, false).critical, merAura)));
                                        }
                                        if(tmpDamage <= 0)
                                            tmpDamage = 1;
                                    }
                                }
                                else {
                                    if(tmpSkill.comment !== ""){
                                        rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                    }
                                    tmpDamage = _JudgAttack(targetMob.ability.attack, targetMob.ability.critical, A("c",_getOurAbility(tmpOur, _userObj, _mercentlist, summonlist, summonDB, false).critical, merAura), A("d",_getOurAbility(tmpOur, _userObj, _mercentlist, summonlist, summonDB, false).defense, merAura), CriticalRate, tmpCri);
                                }

                                tmpHp = _getPoint(tmpOur, "hp", _userObj, _mercentlist, summonlist, false);
                                rtnStr += BattleLogFlag?"":("  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n");

                                if(((tmpOur === -1)?userEffect.n_avd:(_isSummonMob(tmpOur)?smnEffect[summonIdx].n_avd:merEffect[merMatchingTable[tmpOur]].n_avd))){
                                    rtnStr += BattleLogFlag?"":("  - " +  ((tmpOur === -1)?_userObj.name:(_isSummonMob(tmpOur)?summonlist[summonIdx].mobname:_mercentlist[tmpOur].name)) + "의 효과로 상대방은 회피를 할 수 없습니다.\n");
                                }

                                if(((tmpOur === -1)?userEffect.n_avd:(_isSummonMob(tmpOur)?smnEffect[summonIdx].n_avd:merEffect[merMatchingTable[tmpOur]].n_avd)) || _JudgAvoid(targetMob.ability.accuracy, A("v",_getOurAbility(tmpOur, _userObj, _mercentlist, summonlist, summonDB, false).avoid, merAura))) {
                                    _setPoint(tmpOur, "hp", -(tmpDamage), _userObj, _mercentlist, summonlist, false);

                                    rtnStr += BattleLogFlag?"":("  - " +  ((tmpOur === -1)?_userObj.name:(_isSummonMob(tmpOur)?summonlist[summonIdx].mobname:_mercentlist[tmpOur].name)) + "의 Hp가 " + tmpHp + " -> " + _getPoint(tmpOur, "hp", _userObj, _mercentlist, summonlist, false) + "로 줄어듬\n");

                                    if(tmpSkill.cc !== null ) {
                                        rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                        if(tmpOur === -1){
                                            if(userEffect.n_dth) {
                                                tmpSkill.cc.deathcount = ((userCC.deathcount > 1)?(userCC.deathcount - 1):userCC.deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }

                                            userCC = tmpSkill.cc;
                                            if(userCC.effect.indexOf("provo") !== -1)
                                                userCC.provo = i;
                                        }
                                        else if(_isSummonMob(tmpOur)) {
                                            if(smnEffect[summonIdx].n_dth) {
                                                tmpSkill.cc.deathcount = ((smnCC[summonIdx].deathcount > 1)?(smnCC[summonIdx].deathcount - 1):smnCC[summonIdx].deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }

                                            smnCC[summonIdx] = tmpSkill.cc;
                                            if(smnCC[summonIdx].effect.indexOf("provo") !== -1)
                                                smnCC[summonIdx].provo = i;
                                        }
                                        else {
                                            if(merEffect[merMatchingTable[tmpOur]].n_dth) {
                                                tmpSkill.cc.deathcount = ((merCC[merMatchingTable[tmpOur]].deathcount > 1)?(merCC[merMatchingTable[tmpOur]].deathcount - 1):merCC[merMatchingTable[tmpOur]].deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }

                                            merCC[merMatchingTable[tmpOur]] = tmpSkill.cc;
                                            if(merCC[merMatchingTable[tmpOur]].effect.indexOf("provo") !== -1)
                                                merCC[merMatchingTable[tmpOur]].provo = i;
                                        }
                                    }

                                    if(_getPoint(tmpOur, "hp", _userObj, _mercentlist, summonlist, false) === 0)
                                    {
                                        rtnStr += BattleLogFlag?"":("  - " + ((tmpOur === -1)?_userObj.name:(_isSummonMob(tmpOur)?summonlist[summonIdx].mobname:_mercentlist[tmpOur].name)) + "이(가) 정신을 잃었습니다\n");

                                        for(c = 0; c < mobCC.length; ++c) {
                                            if(mobCC[c].provo === j)
                                                mobCC[c].provo = Not_ProvoTarget;
                                        }

                                        if(tmpOur !== -1 && !_isSummonMob(tmpOur)){
                                            var tmpaura = merAura[merMatchingTable[tmpOur]];
                                            rtnStr += BattleLogFlag?"":("  - 용병 버프 제거 : " + tmpaura.kind + "+" + tmpaura.value + (tmpaura.type==="PLUS"?"":"%") + "\n");
                                            tmpaura.useYN = false;
                                        }

                                        if(tmpOur === -1 || !_isSummonMob(tmpOur)) {
                                            retireList.push(tmpOur);
                                        }
                                        
                                        ourList.splice(ourList.indexOf(tmpOur),1);
                                        j--;
                                        length -= 1;
                                    }
                                }
                                else {
                                    if(tmpSkill.cc !== null ) {
                                        rtnStr += BattleLogFlag?"":(tmpSkill.comment + "\n");
                                        if(tmpOur === -1){
                                            if(userEffect.n_dth) {
                                                tmpSkill.cc.deathcount = ((userCC.deathcount > 1)?(userCC.deathcount - 1):userCC.deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }

                                            userCC = tmpSkill.cc;
                                            if(userCC.effect.indexOf("provo") !== -1)
                                                userCC.provo = i;
                                        }
                                        else if(_isSummonMob(tmpOur)) {
                                            if(smnEffect[summonIdx].n_dth) {
                                                tmpSkill.cc.deathcount = ((smnCC[summonIdx].deathcount > 1)?(smnCC[summonIdx].deathcount - 1):smnCC[summonIdx].deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }

                                            smnCC[summonIdx] = tmpSkill.cc;
                                            if(smnCC[summonIdx].effect.indexOf("provo") !== -1)
                                                smnCC[summonIdx].provo = i;
                                        }
                                        else {
                                            if(merEffect[merMatchingTable[tmpOur]].n_dth) {
                                                tmpSkill.cc.deathcount = ((merCC[merMatchingTable[tmpOur]].deathcount > 1)?(merCC[merMatchingTable[tmpOur]].deathcount - 1):merCC[merMatchingTable[tmpOur]].deathcount);
                                                rtnStr += BattleLogFlag?"":("  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n");
                                            }

                                            merCC[merMatchingTable[tmpOur]] = tmpSkill.cc;
                                            if(merCC[merMatchingTable[tmpOur]].effect.indexOf("provo") !== -1)
                                                merCC[merMatchingTable[tmpOur]].provo = i;
                                        }
                                    }
                                    rtnStr += BattleLogFlag?"":("  - " +  ((tmpOur === -1)?_userObj.name:(_isSummonMob(tmpOur)?summonlist[summonIdx].mobname:_mercentlist[tmpOur].name)) + "이(가) 회피\n");
                                }
                                rtnStr += BattleLogFlag?"":("\n");
                            }
                        }
                    }
                    rtnStr += BattleLogFlag?"":("\n");
                }
            }
        }

        RecordManager.rcdMaxRune(_userObj.name, recordRune.rune);
        for(r = 0; r < recordMobList.length; ++r) {
            RecordManager.rcdMonster(_userObj.name, recordMobList[r].index, recordMobList[r].count, false);
        }
        RecordManager.Save();

        mobretireList = null;
        mobattspdCounter  = null;
        mobAttspd  = null;
        mobCC  = null;
        mobEffect = null;
        mobHP = null;
        mobMP = null;
        mobSP = null;
        ourList = null;
        retireList = null;
        userCC  = null;
        userEffect  = null;
        merattspdCounter = null;
        merAttspd = null;
        merCC = null;
        merEffect = null;
        merMatchingTable = null;
        summonDB = null;
        summonlist = null;
        smnattspdCounter = null;
        smnAttspd = null;
        smnCC = null;
        smnEffect = null;
        recordMobList = null;

        return rtnStr;
    };
    _PartyFight = function(_userlist, _moblist, _optlist, _userMaxPointlist, _result) {
        var AttMaxSpd = libConst.MinAttackSpeedCounter;
        var userObj, userMaxPoint, option;
        var rtnStr = "", i, j, hs, totalCnt = 0, c, r, k, sc;
        var mobretireList = []; // {mob, hp, mp, sp}
        var mobattspdCounter = [],
            mobAttspd = [],
            mobCC = [],
            mobEffect = [],
            mobHP = [],
            mobMP = [],
            mobSP = [];

        var ourList = [];
        var retireList = [];
        var userattspdCounter = [],
            userAttspd = [],
            userMaxHP = [],
            userMaxMP = [],
            userMaxSP = [],
            userMaxDP = [],
            userSkillCoolTime = [],
            userHealSkillCoolTime = [],
            userCC = [],
            userEffect = [],
            userIdx;

        var summonDB = [];
        var summonlist = [],
            smnattspdCounter = [],
            smnAttspd = [],
            smnCC = [],
            smnEffect = [];

        var tmpDamage, // 최종 데미지
            tmpCri = {cri:0}, // 크리 여부
            tmpHp, // 데미지 적용전 HP
            selMob, //유저가 떄릴 예정인 몹
            targetUser, // 타겟 유저
            targetMob, // 행동할 몹
            tmpSkill, //스킬 판정후 결과값
            tmpCc,  // CC 계산된 데미지
            tmpHealing, // 힐 스킬 판정 결과값
            tmpPotion, // 옵션에 설정된 포션의 DB 값
            tmpCCRecovery, // 상태이상회복 판정 결과값
            tmpSummonSkill; // 소환스킬 판정 결과값

        var tmpOur,   // 유저 와 용병 타겟 인덱스
            tmpOurIdx; // ourList의 타겟 인덱스

        var summonIdx, // ourList 에서 가져와서 소환물 인덱스
            summonOriginIdx,
            summonUserIdx, // 소환자의 인덱스
            targetsummon,
            targetSummonDB;

        var tmpAbility;
        var tmpSubAbility;

        var recordMobList = []; // 잡은 몹의 인덱스를 저장해둔다. {index, count}
        var recordRune = {rune:0};
        var recordItemList = [];
        
        rtnStr += "(참여 맴버)\n";
        for(i = 0; i < _userlist.length; ++i) {
            userObj = _userlist[i];
            option = _optlist[i];
            userMaxPoint = _userMaxPointlist[i];

            userattspdCounter.push(0);
            userAttspd.push(userObj.getAbility().atkspeed);
            userMaxHP.push(userMaxPoint.HP);
            userMaxMP.push(userMaxPoint.MP);
            userMaxSP.push(userMaxPoint.SP);
            userMaxDP.push(userMaxPoint.DP);

            userSkillCoolTime.push([]);
            for(j = 0; j <= libConst.SkillSpace; ++j) {
                userSkillCoolTime[i][j] = 0;
            }

            userHealSkillCoolTime.push([]);
            for(j = 0; j <= libConst.HealSkillSpace; ++j) {
                userHealSkillCoolTime[i][j] = 0;
            }

            userCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
            userEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});

            summonDB.push([]);
            summonDB[i] = _SetSummonMonster(userObj, option);
            for(j = 0; j < summonDB[i].length; ++j) {
                AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, summonDB[i][j].ability.atkspeed);
            }
            summonlist.push([]);
            smnattspdCounter.push([]);
            smnAttspd.push([]);
            smnCC.push([]);
            smnEffect.push([]);

            ourList.push(i);
            AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, userObj.getAbility().atkspeed);

            rtnStr += "  - " + userObj.name + "\n";
        }
        rtnStr += "\n";

        rtnStr += "(출현 몬스터)\n";
        for(i = 0; i < _moblist.length; ++i) {
            mobattspdCounter.push(0);
            mobAttspd.push(Number(_moblist[i].ability.atkspeed));
            AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, Number(_moblist[i].ability.atkspeed));
            mobCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
            mobEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
            mobHP.push(Number(_moblist[i].ability.hp));
            mobMP.push(Number(_moblist[i].ability.mp));
            mobSP.push(Number(_moblist[i].ability.sp));

            rtnStr += "  - " + _moblist[i].name + "\n";
        }
        rtnStr += "\n";

        AttMaxSpd *= libConst.MaxAttackSpeedRate;
        for(i = 0; i < userattspdCounter.length; ++i) {
            userattspdCounter[i] = AttMaxSpd;
        }
        for(i = 0; i < mobattspdCounter.length; ++i) {
            mobattspdCounter[i] = AttMaxSpd;
        }

        var effectlist;
        var start = 0, length = 0;

        while(true) {
            if(_moblist.length === 0) {
                _result.result = true;
                break;
            }
            if(ourList.length === 0) {
                rtnStr += "  - 전투 가능한 유닛이 없어서 후퇴합니다.\n";
                _result.result = false;
                break;
            }
            if(totalCnt >= libConst.DungeonHuntingCount) {

                rtnStr += "  - 너무 많은 시간을 소모하였습니다. 후퇴합니다.\n";
                rtnStr += "  - 던전 사냥 턴수 : " + libConst.DungeonHuntingCount + ".\n";
                _result.result = false;
                break;
            }

            for(i = 0; i < ourList.length; ++i) {
                if(_moblist.length === 0){
                    break;
                }
                userIdx = ourList[i];

                if(!_isSummonMob(userIdx)) {
                    userattspdCounter[userIdx] -= (userAttspd[userIdx] - Math.floor(userAttspd[userIdx] * userCC[userIdx].slowrate));
                    if(userattspdCounter[userIdx] <= 0) {
                        userattspdCounter[userIdx] = AttMaxSpd + userattspdCounter[userIdx];

                        userObj = _userlist[userIdx];
                        option = _optlist[userIdx];
                        selMob = libCommon.Rand(0,_moblist.length - 1);

                        rtnStr += "(" + userObj.name + "턴 시작)\n";
                        totalCnt++;

                        for(j = 0; j < userSkillCoolTime[userIdx].length; ++j) {
                            if(userSkillCoolTime[userIdx][j] > 0) {
                                userSkillCoolTime[userIdx][j]--;
                            }
                        }

                        for(j = 0; j < userHealSkillCoolTime[userIdx].length; ++j) {
                            if(userHealSkillCoolTime[userIdx][j] > 0) {
                                userHealSkillCoolTime[userIdx][j]--;
                            }
                        }

                        if(userCC[userIdx].continue !== 0) {
                            if(userCC[userIdx].damage !== 0) {
                                tmpHp = userObj.getAbility().hp;
                                tmpCc = Math.floor(userMaxHP[userIdx] * userCC[userIdx].damage);
                                userObj.getAbility().hp -= tmpCc;
                                if(userObj.getAbility().hp < 0)
                                    userObj.getAbility().hp = 0;

                                rtnStr += "  - " + userCC[userIdx].name + "의 효과로 " + tmpCc + " 데미지 발생\n";
                                rtnStr += "  - " + userObj.name + "의 Hp가 " + tmpHp + " -> " + userObj.getAbility().hp + "로 줄어듬\n";
            
                                if(userObj.getAbility().hp === 0) {
                                    rtnStr += "  - " + userObj.name + "이(가) 정신을 잃었습니다\n";
                                    for(c = 0; c < mobCC.length; ++c) {
                                        if(mobCC[c].provo === userIdx)
                                            mobCC[c].provo = Not_ProvoTarget;
                                    }

                                    retireList.push(userIdx);
                                    ourList.splice(ourList.indexOf(userIdx),1);
                                    break;
                                }
                            }

                            if(userCC[userIdx].provo !== Not_ProvoTarget && userCC[userIdx].provo < _moblist.length) {
                                rtnStr += "  - " + userCC[userIdx].name + "의 효과로 " + _moblist[userCC[userIdx].provo].name + "을(를) 타겟팅합니다.\n";
                                selMob = userCC[userIdx].provo;
                            }

                            _RemoveCC(null, userEffect[userIdx]);
                            if(userCC[userIdx].effect !== ""){
                                effectlist = userCC[userIdx].effect.split(";");
                                for(k = 0; k < effectlist.length; ++k) {
                                    if(effectlist[k] === "attack") {userEffect[userIdx].n_att = true;}
                                    if(effectlist[k] === "skill") {userEffect[userIdx].n_skl = true;}
                                    if(effectlist[k] === "potion") {userEffect[userIdx].n_pot = true;}
                                    if(effectlist[k] === "avoid") {userEffect[userIdx].n_avd = true;}
                                    if(effectlist[k] === "provo") {userEffect[userIdx].n_prv = true;}
                                    if(effectlist[k] === "slow") {userEffect[userIdx].n_slw = true;}
                                    if(effectlist[k] === "dth") {userEffect[userIdx].n_dth = true;}
                                }
                            }
                            userCC[userIdx].continue--;

                            if(userEffect[userIdx].n_dth) {
                                userCC[userIdx].deathcount--;
                                if(userCC[userIdx].deathcount === 0) {
                                    rtnStr += "  - " + userCC[userIdx].name + "의 효과로 " + userObj.name + "는 즉사 합니다.\n";
                                    for(c = 0; c < mobCC.length; ++c) {
                                        if(mobCC[c].provo === userIdx)
                                            mobCC[c].provo = Not_ProvoTarget;
                                    }
        
                                    retireList.push(userIdx);
                                    ourList.splice(ourList.indexOf(userIdx),1);
                                    break;
                                }
                                else {
                                    rtnStr += "  - " + userCC[userIdx].name + " 효과의 남은 카운터 : " + userCC[userIdx].deathcount + "\n";
                                }
                            }
                        }
                        else {
                            _RemoveCC(userCC[userIdx], userEffect[userIdx]);
                        }

                        if(userEffect[userIdx].n_skl) {
                            rtnStr += "  - " + userCC[userIdx].name + "의 효과로 소환 스킬을 사용할 수 없습니다.\n";
                            tmpSummonSkill = {jude:false};
                        }
                        else {
                            tmpSummonSkill = _JudgSummonSkill(summonDB[userIdx], summonlist[userIdx], userObj);
                            if(tmpSummonSkill.comment !== "") {
                                rtnStr += tmpSummonSkill.comment + "\n";
                            }
                        }

                        if(userEffect[userIdx].n_skl) {
                            rtnStr += "  - " + userCC[userIdx].name + "의 효과로 회복 스킬을 사용할 수 없습니다.\n";
                            tmpHealing = {heal:0};
                        }
                        else if(!tmpSummonSkill.jude){
                            tmpHealing = _JudgHealPartySkill(option, userObj, userMaxHP, _userlist, summonlist, summonDB, ourList, retireList, userHealSkillCoolTime[userIdx]);
                            if(tmpHealing.comment !== "") {
                                rtnStr += tmpHealing.comment + "\n";
                            }
                        }
                        else {
                            tmpHealing = {heal:0};
                        }

                        if(userEffect[userIdx].n_skl) {
                            rtnStr += "  - " + userCC[userIdx].name + "의 효과로 상태이상회복 스킬을 사용할 수 없습니다.\n";
                            tmpCCRecovery = {jude:false};
                        }
                        else if(tmpHealing.heal === 0 && !tmpSummonSkill.jude) {
                            tmpCCRecovery = _JudgCurePartySkill(option, userObj, _userlist, userCC, smnCC, ourList);
                            if(tmpCCRecovery.comment !== "") {
                                rtnStr += tmpCCRecovery.comment + "\n";
                            }
                        }
                        else {
                            tmpCCRecovery = {jude:false};
                        }

                        if(tmpSummonSkill.jude) {
                            userObj.getAbility().dp -= tmpSummonSkill.removedp;

                            rtnStr += "  - [" + tmpSummonSkill.skillname + "] 스킬을 시전\n";
                            if(tmpSummonSkill.removedp !== "0")
                                rtnStr += "  - Dp 소모: " + tmpSummonSkill.removedp + ", 남아있는 DP : " + userObj.getAbility().dp + "\n";

                            if(tmpSummonSkill.refresh.length > 0) {
                                for(s = 0; s < tmpSummonSkill.refresh.length; ++s) {
                                    summonlist[userIdx][tmpSummonSkill.refresh[s]].ability.hp = tmpSummonSkill.targetmob.ability.hp;
                                    summonlist[userIdx][tmpSummonSkill.refresh[s]].ability.mp = tmpSummonSkill.targetmob.ability.mp;
                                    summonlist[userIdx][tmpSummonSkill.refresh[s]].ability.sp = tmpSummonSkill.targetmob.ability.sp;
                                    summonlist[userIdx][tmpSummonSkill.refresh[s]].keepturn = tmpSummonSkill.targetmob.keepturn;
                                    smnCC[userIdx][tmpSummonSkill.refresh[s]] = {name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0};
                                    smnEffect[userIdx][tmpSummonSkill.refresh[s]] = {n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false};
                                    ourList.push("S" + userIdx + "|" + tmpSummonSkill.refresh[s]);
                                }
                            }
                            else {
                                for(s = 0; s < tmpSummonSkill.count; ++s) {
                                    summonlist[userIdx].push(JSON.parse(JSON.stringify(tmpSummonSkill.targetmob)));
                                    smnattspdCounter[userIdx].push(AttMaxSpd);
                                    smnAttspd[userIdx].push(tmpSummonSkill.targetmob.ability.atkspeed);
                                    smnCC[userIdx].push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
                                    smnEffect[userIdx].push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
                                    ourList.push("S" + userIdx + "|" + (summonlist[userIdx].length-1));
                                }
                            }
                            rtnStr += "  - " + tmpSummonSkill.targetmob.mobname + "을(를) 소환\n";
                        }
                        else if(tmpHealing.heal !== 0) {
                            userObj.getAbility().hp -= tmpHealing.removehp;
                            userObj.getAbility().mp -= tmpHealing.removemp;
                            userObj.getAbility().sp -= tmpHealing.removesp;

                            rtnStr += "  - [" + tmpHealing.name + "] 스킬을 시전\n";
                            if(tmpHealing.removehp !== "0")
                                rtnStr += "  - Hp 소모: " + tmpHealing.removehp + ", 남아있는 HP : " + userObj.getAbility().hp + "\n";
                            if(tmpHealing.removemp !== "0")
                                rtnStr += "  - Mp 소모: " + tmpHealing.removemp + ", 남아있는 MP : " + userObj.getAbility().mp + "\n";
                            if(tmpHealing.removesp !== "0")
                                rtnStr += "  - Sp 소모: " + tmpHealing.removesp + ", 남아있는 SP : " + userObj.getAbility().sp + "\n";

                            if(tmpHealing.range === "single") {
                                if(tmpHealing.type === "heal" && _isSummonMob(ourList[tmpHealing.targetidx[0]])) {
                                    targetUser = Number(ourList[tmpHealing.targetidx[0]].split("|")[0].substring(1));
                                    summonIdx = Number(ourList[tmpHealing.targetidx[0]].split("|")[1]);

                                    targetsummon = summonlist[targetUser][summonIdx];
                                    rtnStr += "  - " + targetsummon.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                    targetsummon.ability.hp += tmpHealing.heal;
                                    if(targetsummon.ability.hp > summonDB[targetUser][targetsummon.index].ability.hp) {
                                        targetsummon.ability.hp = summonDB[targetUser][targetsummon.index].ability.hp;
                                    }
                                }
                                else {
                                    if(tmpHealing.type === "revive") { 
                                        ourList.push(tmpHealing.targetidx[0]);
                                        targetUser = _userlist[tmpHealing.targetidx[0]];
                                        rtnStr += "  - " + targetUser.name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n";
                                    }
                                    else if(tmpHealing.type === "heal") {
                                        targetUser = _userlist[ourList[tmpHealing.targetidx[0]]];
                                        rtnStr += "  - " + targetUser.name + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                    }
                                    targetUser.RecoveryforNum("hp", tmpHealing.heal);
                                }
                            }
                            else {
                                rtnStr += "  - 아군 전체 회복!!!!!!!!\n";

                                for(hs = 0; hs < tmpHealing.targetidx.length; ++hs) {
                                    tmpOurIdx = ourList[tmpHealing.targetidx[hs]];
                                    if(tmpHealing.type === "heal" && _isSummonMob(tmpOurIdx)) {
                                        targetUser = Number(tmpOurIdx.split("|")[0].substring(1));
                                        summonIdx = Number(tmpOurIdx.split("|")[1]);

                                        targetsummon = summonlist[targetUser][summonIdx];
                                        rtnStr += "  - " + targetsummon.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                        targetsummon.ability.hp += tmpHealing.heal;
                                        if(targetsummon.ability.hp > summonDB[targetUser][targetsummon.index].ability.hp) {
                                            targetsummon.ability.hp = summonDB[targetUser][targetsummon.index].ability.hp;
                                        }
                                    }
                                    else {
                                        if(tmpHealing.type === "revive") { 
                                            ourList.push(tmpHealing.targetidx[hs]);
                                            targetUser = _userlist[tmpHealing.targetidx[hs]];
                                            rtnStr += "  - " + targetUser.name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n";
                                        }
                                        else if(tmpHealing.type === "heal") {
                                            targetUser = _userlist[tmpOurIdx];
                                            rtnStr += "  - " + targetUser.name + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                        }
                                        targetUser.RecoveryforNum("hp", tmpHealing.heal);
                                    }
                                }
                            }
                        }
                        else if(tmpCCRecovery.jude) {
                            userObj.getAbility().hp -= tmpCCRecovery.removehp;
                            userObj.getAbility().mp -= tmpCCRecovery.removemp;
                            userObj.getAbility().sp -= tmpCCRecovery.removesp;

                            rtnStr += "  - [" + tmpCCRecovery.name + "] 스킬을 시전\n";
                            if(tmpCCRecovery.removehp !== "0")
                                rtnStr += "  - Hp 소모: " + tmpCCRecovery.removehp + ", 남아있는 HP : " + userObj.getAbility().hp + "\n";
                            if(tmpCCRecovery.removemp !== "0")
                                rtnStr += "  - Mp 소모: " + tmpCCRecovery.removemp + ", 남아있는 MP : " + userObj.getAbility().mp + "\n";
                            if(tmpCCRecovery.removesp !== "0")
                                rtnStr += "  - Sp 소모: " + tmpCCRecovery.removesp + ", 남아있는 SP : " + userObj.getAbility().sp + "\n";

                            if(tmpCCRecovery.range === "single") {
                                if(_isSummonMob(ourList[tmpCCRecovery.targetidx])) {
                                    targetUser = Number(ourList[tmpCCRecovery.targetidx].split("|")[0].substring(1));
                                    summonIdx = Number(ourList[tmpCCRecovery.targetidx].split("|")[1]);

                                    targetsummon = summonlist[targetUser][summonIdx];
                                    rtnStr += "  - " + targetsummon.mobname + "의 CC 제거\n";
                                    _RemoveCC(smnCC[targetUser][summonIdx], smnEffect[targetUser][summonIdx]);
                                }
                                else {
                                    targetUser = _userlist[ourList[tmpCCRecovery.targetidx]];
                                    rtnStr += "  - " + targetUser.name + "의 CC 제거\n";
                                    _RemoveCC(userCC[ourList[tmpCCRecovery.targetidx]], userEffect[ourList[tmpCCRecovery.targetidx]]);
                                }
                            }
                            else {
                                rtnStr += "  - 아군 전체 CC 제거!!!!!!!!\n";

                                for(hs = 0; hs < ourList.length; ++hs) {
                                    tmpOurIdx = ourList[hs];
                                    if(_isSummonMob(tmpOurIdx)) {
                                        targetUser = Number(ourList[tmpOurIdx].split("|")[0].substring(1));
                                        summonIdx = Number(ourList[tmpOurIdx].split("|")[1]);

                                        targetsummon = summonlist[targetUser][summonIdx];
                                        rtnStr += "  - " + targetsummon.mobname + "의 CC 제거\n";
                                        _RemoveCC(smnCC[targetUser][summonIdx], smnEffect[targetUser][summonIdx]);
                                    }
                                    else {

                                        targetUser = _userlist[tmpOurIdx];
                                        rtnStr += "  - " + targetUser.name + "의 CC 제거\n";
                                        _RemoveCC(userCC[tmpOurIdx], userEffect[tmpOurIdx]);
                                    }
                                }
                            }
                        }
                        else if(!userEffect[userIdx].n_pot && _JudgPotion("hp", option, userObj, userMaxHP[userIdx], userMaxMP[userIdx], userMaxSP[userIdx], userMaxDP[userIdx])){
                            tmpPotion = db_Manager.getFunctionalityItem(option.getpotionOpt().hp.index);
                            rtnStr += "  - " + tmpPotion.name + "을(를) 사용\n";
                            if(tmpPotion.kind === "recovery") {
                                rtnStr += "  - " + tmpPotion.amount + "%를 회복\n";
                                userObj.Recovery("hp", tmpPotion.amount);
                            }
                            else {
                                rtnStr += "  - +" + tmpPotion.amount + "을(를) 회복\n";
                                userObj.RecoveryforNum("hp", Number(tmpPotion.amount));
                            }
                            userObj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, tmpPotion.index, 1);
                        }
                        else if(!userEffect[userIdx].n_pot && _JudgPotion("mp", option, userObj, userMaxHP[userIdx], userMaxMP[userIdx], userMaxSP[userIdx], userMaxDP[userIdx])){
                            tmpPotion = db_Manager.getFunctionalityItem(option.getpotionOpt().mp.index);
                            rtnStr += "  - " + tmpPotion.name + "을(를) 사용\n";
                            if(tmpPotion.kind === "recovery") {
                                rtnStr += "  - " + tmpPotion.amount + "%를 회복\n";
                                userObj.Recovery("mp", tmpPotion.amount);
                            }
                            else {
                                rtnStr += "  - +" + tmpPotion.amount + "을(를) 회복\n";
                                userObj.RecoveryforNum("mp", Number(tmpPotion.amount));
                            }
                            userObj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, tmpPotion.index, 1);
                        }
                        else if(!userEffect[userIdx].n_pot && _JudgPotion("sp", option, userObj, userMaxHP[userIdx], userMaxMP[userIdx], userMaxSP[userIdx], userMaxDP[userIdx])){
                            tmpPotion = db_Manager.getFunctionalityItem(option.getpotionOpt().sp.index);
                            rtnStr += "  - " + tmpPotion.name + "을(를) 사용\n";
                            if(tmpPotion.kind === "recovery") {
                                rtnStr += "  - " + tmpPotion.amount + "%를 회복\n";
                                userObj.Recovery("sp", tmpPotion.amount);
                            }
                            else {
                                rtnStr += "  - +" + tmpPotion.amount + "을(를) 회복\n";
                                userObj.RecoveryforNum("sp", Number(tmpPotion.amount));
                            }
                            userObj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, tmpPotion.index, 1);
                        }
                        else if(!userEffect[userIdx].n_pot && _JudgPotion("dp", option, userObj, userMaxHP[userIdx], userMaxMP[userIdx], userMaxSP[userIdx], userMaxDP[userIdx])){
                            tmpPotion = db_Manager.getFunctionalityItem(option.getpotionOpt().dp.index);
                            rtnStr += "  - " + tmpPotion.name + "을(를) 사용\n";
                            if(tmpPotion.kind === "recovery") {
                                rtnStr += "  - " + tmpPotion.amount + "%를 회복\n";
                                userObj.Recovery("dp", tmpPotion.amount);
                            }
                            else {
                                rtnStr += "  - +" + tmpPotion.amount + "을(를) 회복\n";
                                userObj.RecoveryforNum("dp", Number(tmpPotion.amount));
                            }
                            userObj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, tmpPotion.index, 1);
                        }
                        else {
                            if(userEffect[userIdx].n_pot) {
                                rtnStr += "  - " + userCC[userIdx].name + "의 효과로 포션을 사용할 수 없습니다.\n";
                            }
                            if(userEffect[userIdx].n_att) {
                                rtnStr += "  - " + userCC[userIdx].name + "의 효과로 공격이 불가합니다.\n";
                            }
                            else {
                                tmpCri = {cri:0};
                                if(userEffect[userIdx].n_skl) {
                                    rtnStr += "  - " + userCC[userIdx].name + "의 효과로 스킬을 사용할 수 없습니다.\n";
                                    tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
                                }
                                else {
                                    tmpSkill = _JudgSkill(option, _moblist[selMob], userObj, tmpCri, userSkillCoolTime[userIdx]);
                                }

                                start = 0, length = 0;
                                if(tmpSkill.range === "single") {
                                    start = selMob;
                                    length = selMob + 1;
                                }
                                else {
                                    rtnStr += "  - [" + tmpSkill.name + "] 전체 스킬 판정!\n";
                                    if(tmpSkill.count >= _moblist.length){
                                        start = 0;
                                        length = _moblist.length;
                                    }
                                    else {
                                        r = tmpSkill.count - (selMob + 1);
                                        if(r >= 0){
                                            start = 0;
                                            length = tmpSkill.count;
                                        }
                                        else {
                                            start = -r;
                                            length = tmpSkill.count - r;

                                        }
                                    }
                                }

                                if(tmpSkill.damage !== 0) {
                                    userObj.getAbility().hp -= tmpSkill.removehp;
                                    userObj.getAbility().mp -= tmpSkill.removemp;
                                    userObj.getAbility().sp -= tmpSkill.removesp;
    
    
                                    rtnStr += "  - [" + tmpSkill.name + "] 스킬을 시전\n";
                                    if(tmpSkill.removehp !== "0")
                                        rtnStr += "  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + userObj.getAbility().hp + "\n";
                                    if(tmpSkill.removemp !== "0")
                                        rtnStr += "  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + userObj.getAbility().mp + "\n";
                                    if(tmpSkill.removesp !== "0")
                                        rtnStr += "  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + userObj.getAbility().sp + "\n";
                                }
    
                                for(j = start; j < length; ++j) {
                                    rtnStr += "  - " + _moblist[j].name + "을(를) 공격\n";
                                    if(tmpSkill.damage !== 0) {
                                        if(tmpSkill.range === "single") {
                                            tmpDamage = tmpSkill.damage;
                                        }
                                        else {
                                            tmpDamage = _SkillCalcDamage(userObj.getAbility()[tmpSkill.skillkind], userObj.getAbility()[tmpSkill.skillsubkind], {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, _moblist[j].ability.defense);
                                            if(tmpCri.cri === 1) {
                                                tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(userObj.getAbility().critical, _moblist[j].ability.critical));
                                            }
                                            if(tmpDamage <= 0)
                                                tmpDamage = 1;
                                        }
                                    }
                                    else {
                                        if(tmpSkill.comment !== ""){
                                            rtnStr += tmpSkill.comment + "\n";
                                        }
    
                                        if(userObj.isFarWeapon()){
                                            if(!userObj.decArrow()) {
                                                rtnStr += "  - (주의)화살을 다 소모하여 활을 내려놓습니다.\n";
                                                userObj.addItem(libConst.ITEM_KIND.WEARITEM, userObj.getEquiment().righthand, 1, userObj.getEquimentLevel().righthand);
                                                userObj.removeEquiment("righthand"); // 화살이 다 떨어지면 무기를 가방에 넣는다.
                                                userObj.calcAbility(false);
    
                                            }
                                        }
                                        tmpDamage = _JudgAttack(userObj.getAbility().attack, userObj.getAbility().critical, _moblist[j].ability.critical, _moblist[j].ability.defense, CriticalRate, tmpCri);
                                    }
    
                                    tmpHp = mobHP[j];
                                    rtnStr += "  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n";
    
                                    if(mobEffect[j].n_avd) {
                                        rtnStr += "  - " + mobCC[j].name + "의 효과로 상대방은 회피를 할 수 없습니다.\n";
                                    }
    
                                    if(mobEffect[j].n_avd || _JudgAvoid(userObj.getAbility().accuracy, _moblist[j].ability.avoid)) {
                                        mobHP[j] -= tmpDamage;
                                        if(mobHP[j] < 0)
                                            mobHP[j] = 0;
    
                                        rtnStr += "  - " + _moblist[j].name + "의 Hp가 " + tmpHp + " -> " + mobHP[j] + "로 줄어듬\n";
    
                                        if(tmpSkill.cc !== null ) {
                                            rtnStr += tmpSkill.comment + "\n";
                                            if(mobEffect[j].n_dth) {
                                                tmpSkill.cc.deathcount = ((mobCC[j].deathcount > 1)?(mobCC[j].deathcount - 1):mobCC[j].deathcount);
                                                rtnStr += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                                            }
                                            mobCC[j] = tmpSkill.cc;
                                            if(mobCC[j].effect.indexOf("provo") !== -1)
                                                mobCC[j].provo = ourList[i];
                                        }
        
                                        if(mobHP[j] === 0) {
                                            rtnStr += "  - " + _moblist[j].name + "이(가) 제거됨\n";
                                            rtnStr += _JudgPartyDrop(_moblist[j].index, _moblist[j].name, _moblist[j].dropItem, _moblist[j].droprune, _moblist[j].exp, recordItemList, recordRune);
                                            _addRecordMob(recordMobList, _moblist[j].index, 1);
                                            for(k = 0; k < userCC.length; ++k) {
                                                if(userCC[k].provo === j) {
                                                    userCC[k].provo = Not_ProvoTarget;
                                                }
                                                else if(userCC[k].provo > j){
                                                    userCC[k].provo--;
                                                }
    
                                                for(c = 0; c < smnCC[k].length; ++c) {
                                                    if(smnCC[k][c].provo === j) {
                                                        smnCC[k][c].provo = Not_ProvoTarget;
                                                    }
                                                    else if(smnCC[k][c].provo > j){
                                                        smnCC[k][c].provo--;
                                                    }
                                                }
                                            }
                                            
                                            
                                            for(k = 0; k < _userlist.length; ++k) {
                                                _JudgQuestCount(_moblist[j].index, _userlist[k]);
                                            }
                                            mobretireList.push({mob:_moblist[j], hp:mobHP[j], mp:mobMP[j], sp:mobSP[j]});
                                            _moblist.splice(j,1);
                                            mobattspdCounter.splice(j,1);
                                            mobAttspd.splice(j,1);
                                            mobCC.splice(j,1);
                                            mobEffect.splice(j,1);
                                            mobHP.splice(j,1);
                                            mobMP.splice(j,1);
                                            mobSP.splice(j,1);
                                            j--;
                                            length -= 1;
                                        }
                                    }
                                    else {
                                        if(tmpSkill.cc !== null ) {
                                            rtnStr += tmpSkill.comment + "\n";
                                            if(mobEffect[j].n_dth) {
                                                tmpSkill.cc.deathcount = ((mobCC[j].deathcount > 1)?(mobCC[j].deathcount - 1):mobCC[j].deathcount);
                                                rtnStr += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                                            }
                                            mobCC[j] = tmpSkill.cc;
                                            if(mobCC[j].effect.indexOf("provo") !== -1)
                                                mobCC[j].provo = ourList[i];
                                        }
                                        rtnStr += "  - " +  _moblist[j].name + "이(가) 회피\n";
                                    }
                                    rtnStr += "\n";
                                }
                            }
                        }
                        rtnStr += "\n";
                    }
                }
                else {
                    summonOriginIdx = userIdx;
                    summonUserIdx = Number(summonOriginIdx.split("|")[0].substring(1));
                    summonIdx = Number(summonOriginIdx.split("|")[1]);
                    smnattspdCounter[summonUserIdx][summonIdx] -= (smnAttspd[summonUserIdx][summonIdx] - Math.floor(smnAttspd[summonUserIdx][summonIdx] * smnCC[summonUserIdx][summonIdx].slowrate));
                    if(smnattspdCounter[summonUserIdx][summonIdx] <= 0) {
                        smnattspdCounter[summonUserIdx][summonIdx] = AttMaxSpd + smnattspdCounter[summonUserIdx][summonIdx];
                        targetsummon = summonlist[summonUserIdx][summonIdx];
                        targetSummonDB = summonDB[summonUserIdx][targetsummon.index];
                        userObj = _userlist[summonUserIdx];
                        selMob = libCommon.Rand(0,_moblist.length - 1);

                        targetsummon.keepturn -= 1;
                        rtnStr += "(" + targetsummon.mobname + "턴 시작 > " + targetsummon.keepturn + "턴 남음) \n";

                        if(targetsummon.keepturn <= 0) {
                            rtnStr += "  - " + targetsummon.mobname + "이(가) 유지 시간이 종료 되어 소멸됩니다.\n\n";
                            for(c = 0; c < mobCC.length; ++c) {
                                if(mobCC[c].provo === summonOriginIdx)
                                    mobCC[c].provo = Not_ProvoTarget;
                            }
                            ourList.splice(ourList.indexOf(summonOriginIdx),1);
                            targetsummon.ability.hp = 0;
                            smnattspdCounter[summonUserIdx][summonIdx] = AttMaxSpd;
                            _RemoveCC(smnCC[summonUserIdx][summonIdx], smnEffect[summonUserIdx][summonIdx]);
                            continue;
                        }
                        totalCnt++;
                        if(smnCC[summonUserIdx][summonIdx].continue !== 0) {
                            if(smnCC[summonUserIdx][summonIdx].damage !== 0) {
                                tmpHp = targetsummon.ability.hp;
                                tmpCc = Math.floor(Number(targetSummonDB.ability.hp) * smnCC[summonUserIdx][summonIdx].damage);
                                targetsummon.ability.hp -= tmpCc;
                                if(targetsummon.ability.hp < 0)
                                    targetsummon.ability.hp = 0;

                                rtnStr += "  - " + smnCC[summonUserIdx][summonIdx].name + "의 효과로 " + tmpCc + " 데미지 발생\n";
                                rtnStr += "  - " + targetsummon.mobname + "의 Hp가 " + tmpHp + " -> " + targetsummon.ability.hp + "로 줄어듬\n";

                                if(targetsummon.ability.hp === 0)
                                {
                                    rtnStr += "  - " + targetsummon.mobname + "이(가) 정신을 잃었습니다\n";
                                    for(c = 0; c < mobCC.length; ++c) {
                                        if(mobCC[c].provo === summonOriginIdx)
                                            mobCC[c].provo = Not_ProvoTarget;
                                    }

                                    ourList.splice(ourList.indexOf(summonOriginIdx),1);
                                    smnattspdCounter[summonUserIdx][summonIdx] = AttMaxSpd;
                                    _RemoveCC(smnCC[summonUserIdx][summonIdx], smnEffect[summonUserIdx][summonIdx]);
                                    continue;
                                }
                            }

                            if(smnCC[summonUserIdx][summonIdx].provo !== Not_ProvoTarget && smnCC[summonUserIdx][summonIdx].provo < _moblist.length) {
                                rtnStr += "  - " + smnCC[summonUserIdx][summonIdx].name + "의 효과로 " + _moblist[smnCC[summonUserIdx][summonIdx].provo].name + "을(를) 타겟팅합니다.\n";
                                selMob = smnCC[summonUserIdx][summonIdx].provo;
                            }

                            _RemoveCC(null, smnEffect[summonUserIdx][summonIdx]);
                            if(smnCC[summonUserIdx][summonIdx].effect !== ""){
                                effectlist = smnCC[summonUserIdx][summonIdx].effect.split(";");
                                for(j = 0; j < effectlist.length; ++j) {
                                    if(effectlist[j] === "attack") {smnEffect[summonUserIdx][summonIdx].n_att = true;}
                                    if(effectlist[j] === "skill") {smnEffect[summonUserIdx][summonIdx].n_skl = true;}
                                    if(effectlist[j] === "potion") {smnEffect[summonUserIdx][summonIdx].n_pot = true;}
                                    if(effectlist[j] === "avoid") {smnEffect[summonUserIdx][summonIdx].n_avd = true;}
                                    if(effectlist[j] === "provo") {smnEffect[summonUserIdx][summonIdx].n_prv = true;}
                                    if(effectlist[j] === "slow") {smnEffect[summonUserIdx][summonIdx].n_slw = true;}
                                    if(effectlist[j] === "dth") {smnEffect[summonUserIdx][summonIdx].n_dth = true;}
                                }
                            }
                            smnCC[summonUserIdx][summonIdx].continue--;

                            if(smnEffect[summonUserIdx][summonIdx].n_dth) {
                                smnCC[summonUserIdx][summonIdx].deathcount--;
                                if(smnCC[summonUserIdx][summonIdx].deathcount === 0) {
                                    rtnStr += "  - " + smnCC[summonUserIdx][summonIdx].name + "의 효과로 " + targetsummon.mobname + "는 즉사 합니다.\n";
                                    for(c = 0; c < mobCC.length; ++c) {
                                        if(mobCC[c].provo === summonOriginIdx)
                                            mobCC[c].provo = Not_ProvoTarget;
                                    }

                                    ourList.splice(ourList.indexOf(summonOriginIdx),1);
                                    targetsummon.ability.hp = 0;
                                    smnattspdCounter[summonUserIdx][summonIdx] = AttMaxSpd;
                                    _RemoveCC(smnCC[summonUserIdx][summonIdx], smnEffect[summonUserIdx][summonIdx]);
                                    continue;
                                }
                                else {
                                    rtnStr += "  - " + smnCC[summonUserIdx][summonIdx].name + " 효과의 남은 카운터 : " + smnCC[summonUserIdx][summonIdx].deathcount + "\n";
                                }
                            }
                        }
                        else {
                            _RemoveCC(smnCC[summonUserIdx][summonIdx], smnEffect[summonUserIdx][summonIdx]);
                        }

                        if(smnEffect[summonUserIdx][summonIdx].n_skl) {
                            rtnStr += "  - " + smnCC[summonUserIdx][summonIdx].name + "의 효과로 회복 스킬을 사용할 수 없습니다.\n";
                            tmpHealing = {heal:0};
                        }
                        else {
                            tmpHealing = _JudgSmnHealPartySkill(targetsummon, targetSummonDB, _userlist, userMaxHP, summonlist, summonDB, ourList);
                            if(tmpHealing.comment !== "") {
                                rtnStr += tmpHealing.comment + "\n";
                            }
                        }

                        if(smnEffect[summonUserIdx][summonIdx].n_skl) {
                            rtnStr += "  - " +  smnCC[summonUserIdx][summonIdx].name + "의 효과로 상태이상회복 스킬을 사용할 수 없습니다.\n";
                            tmpCCRecovery = {jude:false};
                        }
                        else if(tmpHealing.heal === 0) {
                            tmpCCRecovery = _JudgSmnCurePartySkill(targetsummon, targetSummonDB, userCC, smnCC, summonDB, ourList);
                            if(tmpCCRecovery.comment !== "") {
                                rtnStr += tmpCCRecovery.comment + "\n";
                            }
                        }
                        else {
                            tmpCCRecovery = {jude:false};
                        }

                        if(tmpHealing.heal !== 0) {
                            var healindex, healSummon, healUserSummon, healSummonTarget;
                            targetsummon.ability.hp -= tmpHealing.removehp;
                            targetsummon.ability.mp -= tmpHealing.removemp;
                            targetsummon.ability.sp -= tmpHealing.removesp;

                            rtnStr += "  - [" + tmpHealing.name + "] 스킬을 시전\n";
                            if(tmpHealing.removehp !== "0")
                                rtnStr += "  - Hp 소모: " + tmpHealing.removehp + ", 남아있는 HP : " + targetsummon.ability.hp + "\n";
                            if(tmpHealing.removemp !== "0")
                                rtnStr += "  - Mp 소모: " + tmpHealing.removemp + ", 남아있는 MP : " + targetsummon.ability.mp + "\n";
                            if(tmpHealing.removesp !== "0")
                                rtnStr += "  - Sp 소모: " + tmpHealing.removesp + ", 남아있는 SP : " + targetsummon.ability.sp + "\n";

                            if(tmpHealing.range === "single") {
                                if(_isSummonMob(ourList[tmpHealing.targetidx])){
                                    healUserSummon = Number(ourList[tmpHealing.targetidx].split("|")[0].substring(1));
                                    healSummon = Number(ourList[tmpHealing.targetidx].split("|")[1]);
                                    healSummonTarget = summonlist[healUserSummon][healSummon];
                                    rtnStr += "  - " + healSummonTarget.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                    healSummonTarget.ability.hp += tmpHealing.heal;
                                    if(healSummonTarget.ability.hp > summonDB[healUserSummon][healSummonTarget.index].ability.hp) {
                                        healSummonTarget.ability.hp = summonDB[healUserSummon][healSummonTarget.index].ability.hp;
                                    }
                                }
                                else {
                                    rtnStr += "  - "+ _userlist[ourList[tmpHealing.targetidx]].name + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                    _userlist[ourList[tmpHealing.targetidx]].RecoveryforNum("hp", tmpHealing.heal);
                                }
                            }
                            else {
                                rtnStr += "  - 아군 전체 회복!!!!!!!!\n";

                                for(hs = 0; hs < ourList.length; ++hs) {
                                    healindex = ourList[hs];
                                    if(_isSummonMob(healindex)) {
                                        healUserSummon = Number(ourList[tmpHealing.targetidx].split("|")[0].substring(1));
                                        healSummon = Number(ourList[tmpHealing.targetidx].split("|")[1]);
                                        healSummonTarget = summonlist[healUserSummon][healSummon];
                                        rtnStr += "  - " + healSummonTarget.mobname + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                        healSummonTarget.ability.hp += tmpHealing.heal;
                                        if(healSummonTarget.ability.hp > summonDB[healUserSummon][healSummonTarget.index].ability.hp) {
                                            healSummonTarget.ability.hp = summonDB[healUserSummon][healSummonTarget.index].ability.hp;
                                        }
                                    }
                                    else {
                                        rtnStr += "  - "+ _userlist[ourList[tmpHealing.targetidx]].name + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                        _userlist[ourList[tmpHealing.targetidx]].RecoveryforNum("hp", tmpHealing.heal);
                                    }
                                }
                            }

                        }
                        else if(tmpCCRecovery.jude) {
                            var cureUserSummon, cureSummon;
                            targetsummon.ability.hp -= tmpCCRecovery.removehp;
                            targetsummon.ability.mp -= tmpCCRecovery.removemp;
                            targetsummon.ability.sp -= tmpCCRecovery.removesp;


                            rtnStr += "  - [" + tmpCCRecovery.name + "] 스킬을 시전\n";
                            if(tmpCCRecovery.removehp !== "0")
                                rtnStr += "  - Hp 소모: " + tmpCCRecovery.removehp + ", 남아있는 HP : " + targetsummon.ability.hp + "\n";
                            if(tmpCCRecovery.removemp !== "0")
                                rtnStr += "  - Mp 소모: " + tmpCCRecovery.removemp + ", 남아있는 MP : " + targetsummon.ability.mp + "\n";
                            if(tmpCCRecovery.removesp !== "0")
                                rtnStr += "  - Sp 소모: " + tmpCCRecovery.removesp + ", 남아있는 SP : " + targetsummon.ability.sp + "\n";

                            if(tmpCCRecovery.range === "single")
                            {
                                if(_isSummonMob(tmpCCRecovery.targetidx)) {
                                    cureUserSummon = Number(ourList[tmpCCRecovery.targetidx].split("|")[0].substring(1));
                                    cureSummon = Number(ourList[tmpCCRecovery.targetidx].split("|")[1]);
                                    rtnStr += "  - " + summonlist[cureUserSummon][cureSummon].mobname + "의 CC 제거\n";
                                    _RemoveCC(smnCC[cureUserSummon][cureSummon], smnEffect[cureUserSummon][cureSummon]);
                                }
                                else {
                                    rtnStr += "  - "+ _userlist[ourList[tmpCCRecovery.targetidx]].name + "의 CC 제거\n";
                                    _RemoveCC(_userlist[ourList[tmpCCRecovery.targetidx]], userEffect[ourList[tmpCCRecovery.targetidx]]);
                                }
                            }
                            else {
                                rtnStr += "  - 아군 전체 CC 제거!!!!!!!!\n";

                                for(hs = 0; hs < ourList.length; ++hs) {
                                    if(_isSummonMob(ourList[hs])) {
                                        cureUserSummon = Number(ourList[hs].split("|")[0].substring(1));
                                        cureSummon = Number(ourList[hs].split("|")[1]);
                                        rtnStr += "  - " + summonlist[cureUserSummon][cureSummon].mobname + "의 CC 제거\n";
                                        _RemoveCC(smnCC[cureSummon], smnEffect[cureSummon]);
                                    }
                                    else {
                                        rtnStr += "  - "+ _userlist[ourList[tmpCCRecovery.targetidx]].name + "의 CC 제거\n";
                                        _RemoveCC(_userlist[ourList[tmpCCRecovery.targetidx]], userEffect[ourList[tmpCCRecovery.targetidx]]);
                                    }
                                }
                            }
                        }
                        else {
                            if(smnEffect[summonUserIdx][summonIdx].n_att) {
                                rtnStr += "  - " + smnCC[summonUserIdx][summonIdx].name + "의 효과로 공격이 불가합니다.\n";
                            }
                            else {
                                tmpCri = {cri:0};
                                if(smnEffect[summonUserIdx][summonIdx].n_skl) {
                                    rtnStr += "  - " + smnCC[summonUserIdx][summonIdx].name + "의 효과로 스킬을 사용할 수 없습니다.\n";
                                    tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
                                }
                                else {
                                    tmpSkill = _JudbSmnSkill(_moblist[selMob], targetsummon, tmpCri, summonDB[summonUserIdx]);
                                }

                                start = 0, length = 0;
                                if(tmpSkill.range === "single") {
                                    start = selMob;
                                    length = selMob + 1;
                                }
                                else {
                                    rtnStr += "  - [" + tmpSkill.name + "] 전체 스킬 판정!\n";
                                    if(tmpSkill.count >= _moblist.length){
                                        start = 0;
                                        length = _moblist.length;
                                    }
                                    else {
                                        r = tmpSkill.count - (selMob + 1);
                                        if(r >= 0){
                                            start = 0;
                                            length = tmpSkill.count;
                                        }
                                        else {
                                            start = -r;
                                            length = tmpSkill.count - r;
                                        }
                                    }
                                }

                                tmpAbility = _getCurrVitality(tmpSkill.skillkind, targetSummonDB.ability, targetsummon.ability);
                                tmpSubAbility = _getCurrVitality(tmpSkill.skillsubkind, targetSummonDB.ability, targetsummon.ability);

                                if(tmpSkill.damage !== 0) {
                                    targetsummon.ability.hp -= tmpSkill.removehp;
                                    targetsummon.ability.mp -= tmpSkill.removemp;
                                    targetsummon.ability.sp -= tmpSkill.removesp;


                                    rtnStr += "  - [" + tmpSkill.name + "] 스킬을 시전\n";
                                    if(tmpSkill.removehp !== "0")
                                        rtnStr += "  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + targetsummon.ability.hp + "\n";
                                    if(tmpSkill.removemp !== "0")
                                        rtnStr += "  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + targetsummon.ability.mp + "\n";
                                    if(tmpSkill.removesp !== "0")
                                        rtnStr += "  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + targetsummon.ability.sp + "\n";
                                }

                                for(j = start; j < length; ++j) {
                                    rtnStr += "  - " + _moblist[j].name + "을(를) 공격\n";
                                    if(tmpSkill.damage !== 0)
                                    {
                                        if(tmpSkill.range === "single") {
                                            tmpDamage = tmpSkill.damage;
                                        }
                                        else {
                                            tmpDamage = _SkillCalcDamage(tmpAbility, tmpSubAbility, {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, _moblist[j].ability.defense);
                                            if(tmpCri.cri === 1) {
                                                tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(targetSummonDB.ability.critical, _moblist[j].ability.critical));
                                            }
                                            if(tmpDamage <= 0)
                                                tmpDamage = 1;
                                        }
                                    }
                                    else {
                                        if(tmpSkill.comment !== ""){
                                            rtnStr += tmpSkill.comment + "\n";
                                        }

                                        tmpDamage = _JudgAttack(targetSummonDB.ability.attack, targetSummonDB.ability.critical, _moblist[j].ability.critical, _moblist[j].ability.defense, CriticalRate, tmpCri);
                                    }

                                    tmpHp = mobHP[j];
                                    rtnStr += "  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n";

                                    if(mobEffect[j].n_avd) {
                                        rtnStr += "  - " + mobCC[j].name + "의 효과로 상대방은 회피를 할 수 없습니다.\n";
                                    }

                                    if(mobEffect[j].n_avd || _JudgAvoid(targetSummonDB.ability.accuracy, _moblist[j].ability.avoid)) {
                                        mobHP[j] -= tmpDamage;
                                        if(mobHP[j] < 0)
                                            mobHP[j] = 0;

                                        rtnStr += "  - " + _moblist[j].name + "의 Hp가 " + tmpHp + " -> " + mobHP[j] + "로 줄어듬\n";

                                        if(tmpSkill.cc !== null ) {
                                            rtnStr += tmpSkill.comment + "\n";
                                            if(mobEffect[j].n_dth) {
                                                tmpSkill.cc.deathcount = ((mobCC[j].deathcount > 1)?(mobCC[j].deathcount - 1):mobCC[j].deathcount);
                                                rtnStr += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                                            }
                                            mobCC[j] = tmpSkill.cc;
                                            if(mobCC[j].effect.indexOf("provo") !== -1)
                                                mobCC[j].provo = ourList[i];
                                        }

                                        if(mobHP[j] === 0)
                                        {
                                            rtnStr += "  - " + _moblist[j].name + "이(가) 제거됨\n";
                                            rtnStr += _JudgPartyDrop(_moblist[j].index, _moblist[j].name, _moblist[j].dropItem, _moblist[j].droprune, _moblist[j].exp, recordItemList, recordRune);
                                            _addRecordMob(recordMobList, _moblist[j].index, 1);

                                            for(k = 0; k < userCC.length; ++k) {
                                                if(userCC[k].provo === j) {
                                                    userCC[k].provo = Not_ProvoTarget;
                                                }
                                                else if(userCC[k].provo > j){
                                                    userCC[k].provo--;
                                                }

                                                for(c = 0; c < smnCC[k].length; ++c) {
                                                    if(smnCC[k][c].provo === j) {
                                                        smnCC[k][c].provo = Not_ProvoTarget;
                                                    }
                                                    else if(smnCC[k][c].provo > j){
                                                        smnCC[k][c].provo--;
                                                    }
                                                }
                                            }

                                            for(k = 0; k < _userlist.length; ++k) {
                                                _JudgQuestCount(_moblist[j].index, _userlist[k]);
                                            }
                                            mobretireList.push({mob:_moblist[j], hp:mobHP[j], mp:mobMP[j], sp:mobSP[j]});
                                            _moblist.splice(j,1);
                                            mobattspdCounter.splice(j,1);
                                            mobAttspd.splice(j,1);
                                            mobCC.splice(j,1);
                                            mobEffect.splice(j,1);
                                            mobHP.splice(j,1);
                                            mobMP.splice(j,1);
                                            mobSP.splice(j,1);
                                            j--;
                                            length -= 1;
                                        }
                                    }
                                    else {
                                        if(tmpSkill.cc !== null ) {
                                            rtnStr += tmpSkill.comment + "\n";
                                            if(mobEffect[j].n_dth) {
                                                tmpSkill.cc.deathcount = ((mobCC[j].deathcount > 1)?(mobCC[j].deathcount - 1):mobCC[j].deathcount);
                                                rtnStr += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                                            }
                                            mobCC[j] = tmpSkill.cc;
                                            if(mobCC[j].effect.indexOf("provo") !== -1)
                                                mobCC[j].provo = ourList[i];
                                        }
                                        rtnStr += "  - " +  _moblist[j].name + "이(가) 회피\n";
                                    }
                                    rtnStr += "\n";
                                }
                            }
                        }
                    }
                }
            }
            for(i = _moblist.length - 1; i >= 0; --i) {
                if(ourList.length === 0){
                    break;
                }

                mobattspdCounter[i] -= (mobAttspd[i] - Math.floor(mobAttspd[i] * mobCC[i].slowrate));
                if(mobattspdCounter[i] <= 0) {
                    mobattspdCounter[i] = AttMaxSpd + mobattspdCounter[i];
                    targetMob = _moblist[i];
                    tmpOurIdx = libCommon.Rand(0, ourList.length - 1);
                    tmpOur = ourList[tmpOurIdx];

                    rtnStr += "(" + targetMob.name + "턴 시작)\n";
                    totalCnt++;
                    if(mobCC[i].continue !== 0) {
                        if(mobCC[i].damage !== 0) {
                            tmpHp = mobHP[i];
                            tmpCc = Math.floor(Number(targetMob.ability.hp) * mobCC[i].damage);
                            mobHP[i] -= tmpCc;
                            if(mobHP[i] < 0)
                                mobHP[i] = 0;

                            rtnStr += "  - " + mobCC[i].name + "의 효과로 " + tmpCc + " 데미지 발생\n";
                            rtnStr += "  - " + targetMob.name + "의 Hp가 " + tmpHp + " -> " + mobHP[i] + "로 줄어듬\n";

                            if(mobHP[i] === 0)
                            {
                                rtnStr += "  - " + targetMob.name + "이(가) 제거됨\n";
                                rtnStr += _JudgPartyDrop(targetMob.index, targetMob.name, targetMob.dropItem, targetMob.droprune, targetMob.exp, recordItemList, recordRune);
                                for(k = 0; k < userCC.length; ++k) {
                                    if(userCC[k].provo === i) {
                                        userCC[k].provo = Not_ProvoTarget;
                                    }
                                    else if(userCC[k].provo > i){
                                        userCC[k].provo--;
                                    }

                                    for(c = 0; c < smnCC[k].length; ++c) {
                                        if(smnCC[k][c].provo === i) {
                                            smnCC[k][c].provo = Not_ProvoTarget;
                                        }
                                        else if(smnCC[k][c].provo > i){
                                            smnCC[k][c].provo--;
                                        }
                                    }
                                }

                                _addRecordMob(recordMobList, targetMob.index, 1);

                                for(k = 0; k < _userlist.length; ++k) {
                                    _JudgQuestCount(targetMob.index, _userlist[k]);
                                }
                                mobretireList.push({mob:_moblist[i], hp:mobHP[i], mp:mobMP[i], sp:mobSP[i]});
                                _moblist.splice(i,1);
                                mobattspdCounter.splice(i,1);
                                mobAttspd.splice(i,1);
                                mobCC.splice(i,1);
                                mobEffect.splice(i,1);
                                mobHP.splice(i,1);
                                mobMP.splice(i,1);
                                mobSP.splice(i,1);

                                continue;
                            }
                        }
                        if(mobCC[i].provo !== Not_ProvoTarget) {
                            if(_isSummonMob(mobCC[i].provo)) {
                                summonUserIdx = Number(mobCC[i].provo.split("|")[0].substring(1));
                                summonIdx = Number(mobCC[i].provo.split("|")[1]);
                                if(ourList.indexOf(mobCC[i].provo) !== -1 && summonUserIdx < summonlist.length && summonIdx < summonlist[summonUserIdx].length) {
                                    rtnStr += "  - " + summonlist[summonUserIdx][summonIdx].mobname + "을(를) 타겟팅합니다.\n";
                                    tmpOurIdx = ourList.indexOf(mobCC[i].provo);
                                    tmpOur = mobCC[i].provo;
                                }
                                else {
                                    mobCC[i].provo = Not_ProvoTarget;
                                }
                            }
                            else {
                                if(mobCC[i].provo < _userlist.length) {
                                    rtnStr += "  - " + _userlist[mobCC[i].provo].name + "을(를) 타겟팅합니다.\n";
                                    tmpOurIdx = ourList.indexOf(mobCC[i].provo);
                                    tmpOur = mobCC[i].provo;
                                }
                                else {
                                    mobCC[i].provo = Not_ProvoTarget;
                                }
                            }
                        }

                        _RemoveCC(null, mobEffect[i]);
                        if(mobCC[i].effect !== ""){
                            effectlist = mobCC[i].effect.split(";");
                            for(j = 0; j < effectlist.length; ++j) {
                                if(effectlist[j] === "attack") {mobEffect[i].n_att = true;}
                                if(effectlist[j] === "skill") {mobEffect[i].n_skl = true;}
                                if(effectlist[j] === "potion") {mobEffect[i].n_pot = true;}
                                if(effectlist[j] === "avoid") {mobEffect[i].n_avd = true;}
                                if(effectlist[j] === "provo") {mobEffect[i].n_prv = true;}
                                if(effectlist[j] === "slow") {mobEffect[i].n_slw = true;}
                                if(effectlist[j] === "dth") {mobEffect[i].n_dth = true;}
                            }
                        }
                        mobCC[i].continue--;

                        if(mobEffect[i].n_dth) {
                              mobCC[i].deathcount--;
                            if(mobCC[i].deathcount === 0) {
                                rtnStr += "  - " + mobCC[i].name + "의 효과로 " + targetMob.name + "는 즉사 합니다.\n";
                                rtnStr += _JudgPartyDrop(targetMob.index, targetMob.name, targetMob.dropItem, targetMob.droprune, targetMob.exp, recordItemList, recordRune);
                                for(k = 0; k < userCC.length; ++k) {
                                    if(userCC[k].provo === i) {
                                        userCC[k].provo = Not_ProvoTarget;
                                    }
                                    else if(userCC[k].provo > i){
                                        userCC[k].provo--;
                                    }

                                    for(c = 0; c < smnCC[k].length; ++c) {
                                        if(smnCC[k][c].provo === i) {
                                            smnCC[k][c].provo = Not_ProvoTarget;
                                        }
                                        else if(smnCC[k][c].provo > i){
                                            smnCC[k][c].provo--;
                                        }
                                    }
                                }
                                _addRecordMob(recordMobList, targetMob.index, 1);

                                for(k = 0; k < _userlist.length; ++k) {
                                    _JudgQuestCount(targetMob.index, _userlist[k]);
                                }
                                mobretireList.push({mob:_moblist[i], hp:mobHP[i], mp:mobMP[i], sp:mobSP[i]});
                                _moblist.splice(i,1);
                                mobattspdCounter.splice(i,1);
                                mobAttspd.splice(i,1);
                                mobCC.splice(i,1);
                                mobEffect.splice(i,1);
                                mobHP.splice(i,1);
                                mobMP.splice(i,1);
                                mobSP.splice(i,1);

                                continue;
                            }
                            else {
                                rtnStr += "  - " + mobCC[i].name + " 효과의 남은 카운터 : " + mobCC[i].deathcount + "\n";
                            }
                        }

                    }
                    else {
                        _RemoveCC(mobCC[i], mobEffect[i]);
                    }

                    if(mobEffect[i].n_skl) {
                        rtnStr += "  - " + mobCC[i].name + "의 효과로 회복 스킬을 사용할 수 없습니다.\n";
                        tmpHealing = {heal:0};
                    }
                    else {
                        tmpHealing = _JudgMobHealSkill(_moblist, targetMob, mobHP[i], mobMP[i], mobSP[i], mobHP, mobretireList);
                        if(tmpHealing.comment !== "") {
                            rtnStr += tmpHealing.comment + "\n";
                        }
                    }

                    if(mobEffect[i].n_skl) {
                        rtnStr += "  - " +  mobCC[i].name + "의 효과로 상태이상회복 스킬을 사용할 수 없습니다.\n";
                        tmpCCRecovery = {jude:false};
                    }
                    else if(tmpHealing.heal === 0) {
                        tmpCCRecovery = _JudgMobCureSkill(targetMob, mobCC, mobHP[i], mobMP[i], mobSP[i]);
                        if(tmpCCRecovery.comment !== "") {
                            rtnStr += tmpCCRecovery.comment + "\n";
                        }
                    }
                    else {
                        tmpCCRecovery = {jude:false};
                    }

                    var reviveIndex = -1;
                    if(tmpHealing.heal !== 0) {
                        mobHP[i] -= tmpHealing.removehp;
                        mobMP[i] -= tmpHealing.removemp;
                        mobSP[i] -= tmpHealing.removesp;

                        rtnStr += "  - [" + tmpHealing.name + "] 스킬을 시전\n";
                        if(tmpHealing.removehp !== "0")
                            rtnStr += "  - Hp 소모: " + tmpHealing.removehp + ", 남아있는 HP : " + mobHP[i] + "\n";
                        if(tmpHealing.removemp !== "0")
                            rtnStr += "  - Mp 소모: " + tmpHealing.removemp + ", 남아있는 MP : " + mobMP[i] + "\n";
                        if(tmpHealing.removesp !== "0")
                            rtnStr += "  - Sp 소모: " + tmpHealing.removesp + ", 남아있는 SP : " + mobSP[i] + "\n";

                        if(tmpHealing.range === "single")
                        {
                            if(tmpHealing.type === "revive") {
                                reviveIndex = _moblist.length;
                                _moblist.push(tmpHealing.targetidx[0].mob);
                                mobattspdCounter.push(AttMaxSpd);
                                mobAttspd.push(Number(tmpHealing.targetidx[0].mob.ability.atkspeed));
                                mobCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
                                mobEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
                                mobHP.push(tmpHealing.heal);
                                mobMP.push(tmpHealing.targetidx[0].mp);
                                mobSP.push(tmpHealing.targetidx[0].sp);

                                rtnStr += "  - "+ _moblist[reviveIndex].name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n";

                            }
                            else if(tmpHealing.type === "heal") {
                                rtnStr += "  - "+ _moblist[tmpHealing.targetidx[0]].name + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                mobHP[tmpHealing.targetidx[0]] += tmpHealing.heal;
                            }
                            
                        }
                        else {
                            rtnStr += "  - 아군 전체 회복!!!!!!!!\n";
                            for(hs = 0; hs < tmpHealing.targetidx.length; ++hs) {

                                if(tmpHealing.type === "revive") {
                                    reviveIndex = _moblist.length;
                                    _moblist.push(tmpHealing.targetidx[hs].mob);
                                    mobattspdCounter.push(AttMaxSpd);
                                    mobAttspd.push(Number(tmpHealing.targetidx[hs].mob.ability.atkspeed));
                                    mobCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
                                    mobEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
                                    mobHP.push(tmpHealing.heal);
                                    mobMP.push(tmpHealing.targetidx[hs].mp);
                                    mobSP.push(tmpHealing.targetidx[hs].sp);

                                    rtnStr += "  - "+ _moblist[reviveIndex].name + "를 부활시키고 " + tmpHealing.heal + "을(를) 회복\n";
                                }
                                else if(tmpHealing.type === "heal") {
                                    rtnStr += "  - "+ _moblist[tmpHealing.targetidx[hs]].name + "에게 " + tmpHealing.heal + "을(를) 회복\n";
                                    mobHP[tmpHealing.targetidx[hs]] += tmpHealing.heal;
                                }
                            }
                        }
                    }
                    else if(tmpCCRecovery.jude) {
                        mobHP[i] -= tmpCCRecovery.removehp;
                        mobMP[i] -= tmpCCRecovery.removemp;
                        mobSP[i] -= tmpCCRecovery.removesp;

                        rtnStr += "  - [" + tmpCCRecovery.name + "] 스킬을 시전\n";
                        if(tmpCCRecovery.removehp !== "0")
                            rtnStr += "  - Hp 소모: " + tmpCCRecovery.removehp + ", 남아있는 HP : " + mobHP[i] + "\n";
                        if(tmpCCRecovery.removemp !== "0")
                            rtnStr += "  - Mp 소모: " + tmpCCRecovery.removemp + ", 남아있는 MP : " + mobMP[i] + "\n";
                        if(tmpCCRecovery.removesp !== "0")
                            rtnStr += "  - Sp 소모: " + tmpCCRecovery.removesp + ", 남아있는 SP : " + mobSP[i] + "\n";

                        if(tmpCCRecovery.range === "single")
                        {
                            rtnStr += "  - "+ _moblist[tmpCCRecovery.targetidx].name + "의 CC 제거\n";
                            _RemoveCC(mobCC[tmpCCRecovery.targetidx], mobEffect[tmpCCRecovery.targetidx]);
                        }
                        else {
                            rtnStr += "  - 아군 전체 CC 제거!!!!!!!!\n";
                            for(hs = 0; hs < _moblist.length; ++hs) {
                                rtnStr += "  - "+ _moblist[hs].name + "의 CC 제거\n";
                                _RemoveCC(mobCC[hs], mobEffect[hs]);
                            }
                        }
                    }
                    else {
                        if(mobEffect[i].n_att) {
                            rtnStr += "  - " + mobCC[i].name + "의 효과로 공격이 불가합니다.\n";
                        }
                        else {
                            tmpCri = {cri:0};
                            if(mobEffect[i].n_skl) {
                                rtnStr += "  - " + mobCC[i].name + "의 효과로 스킬을 사용할 수 없습니다.\n";
                                tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
                            }
                            else {
                                tmpSkill = _JudgMobSkill(_getOurAbility(tmpOur, _userlist, null, summonlist, summonDB, true).defense, _getOurAbility(tmpOur, _userlist, null, summonlist, summonDB, true).critical, targetMob, mobHP[i], mobMP[i], mobSP[i], tmpCri);
                            }

                            start = 0, length = 0;
                            if(tmpSkill.range === "single") {
                                start = tmpOurIdx;
                                length = tmpOurIdx + 1;
                            }
                            else {
                                rtnStr += "  - [" + tmpSkill.name + "] 전체 스킬 판정!\n";
                                if(tmpSkill.count >= ourList.length){
                                    start = 0;
                                    length = ourList.length;
                                }
                                else {
                                    r = tmpSkill.count - (tmpOurIdx + 1);
                                    if(r >= 0){
                                        start = 0;
                                        length = tmpSkill.count;
                                    }
                                    else {
                                        start = -r;
                                        length = tmpSkill.count - r;
                                    }
                                }
                            }

                            tmpAbility = _getCurrVitality(tmpSkill.skillkind, targetMob.ability, {hp:mobHP[i] , mp:mobMP[i] , sp:mobSP[i]});
                            tmpSubAbility = _getCurrVitality(tmpSkill.skillsubkind, targetMob.ability, {hp:mobHP[i] , mp:mobMP[i] , sp:mobSP[i]});

                            if(tmpSkill.damage !== 0)
                            {
                                mobHP[i] -= tmpSkill.removehp;
                                mobMP[i] -= tmpSkill.removemp;
                                mobSP[i] -= tmpSkill.removesp;

                                rtnStr += "  - [" + tmpSkill.name + "] 스킬을 시전\n";
                                if(tmpSkill.removehp !== "0")
                                    rtnStr += "  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + mobHP[i];
                                if(tmpSkill.removemp !== "0")
                                    rtnStr += "  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + mobMP[i];
                                if(tmpSkill.removesp !== "0")
                                    rtnStr += "  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + mobSP[i];
                                rtnStr += " \n";
                            }

                            for(j = start; j < length; ++j) {
                                tmpOurIdx = j;
                                tmpOur = ourList[tmpOurIdx];
                                summonUserIdx = _isSummonMob(tmpOur)?Number(tmpOur.split("|")[0].substring(1)):0;
                                summonIdx = _isSummonMob(tmpOur)?Number(tmpOur.split("|")[1]):0;
                                rtnStr += "  - " + (_isSummonMob(tmpOur)?summonlist[summonUserIdx][summonIdx].mobname:_userlist[tmpOur].name) + "을(를) 공격\n";
                                if(tmpSkill.damage !== 0) {
                                    if(tmpSkill.range === "single") {
                                        tmpDamage = tmpSkill.damage;
                                    }
                                    else {
                                        tmpDamage = _SkillCalcDamage(tmpAbility, tmpSubAbility, {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, _getOurAbility(tmpOur, _userlist, null, summonlist, summonDB, true).defense);
                                        if(tmpCri.cri === 1) {
                                            tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(targetMob.ability.critical, _getOurAbility(tmpOur, _userlist, null, summonlist, summonDB, true).critical));
                                        }
                                        if(tmpDamage <= 0)
                                            tmpDamage = 1;
                                    }
                                }
                                else {
                                    if(tmpSkill.comment !== ""){
                                        rtnStr += tmpSkill.comment + "\n";
                                    }
                                    tmpDamage = _JudgAttack(targetMob.ability.attack, targetMob.ability.critical, _getOurAbility(tmpOur, _userlist, null, summonlist, summonDB, true).critical, _getOurAbility(tmpOur, _userlist, null, summonlist, summonDB, true).defense, CriticalRate, tmpCri);
                                }

                                tmpHp = _getPoint(tmpOur, "hp", _userlist, null, summonlist, true);
                                rtnStr += "  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n";

                                if(_isSummonMob(tmpOur)?smnEffect[summonUserIdx][summonIdx].n_avd:userEffect[tmpOur].n_avd){
                                    rtnStr += "  - " +  (_isSummonMob(tmpOur)?summonlist[summonUserIdx][summonIdx].mobname:_userlist[tmpOur].name) + "의 효과로 상대방은 회피를 할 수 없습니다.\n";
                                }

                                if((_isSummonMob(tmpOur)?smnEffect[summonUserIdx][summonIdx].n_avd:userEffect[tmpOur].n_avd) || _JudgAvoid(targetMob.ability.accuracy, _getOurAbility(tmpOur, _userlist, null, summonlist, summonDB, true).avoid)) {
                                    _setPoint(tmpOur, "hp", -(tmpDamage), _userlist, null, summonlist, true);

                                    rtnStr += "  - " +  (_isSummonMob(tmpOur)?summonlist[summonUserIdx][summonIdx].mobname:_userlist[tmpOur].name) + "의 Hp가 " + tmpHp + " -> " + _getPoint(tmpOur, "hp", _userlist, null, summonlist, true) + "로 줄어듬\n";

                                    if(tmpSkill.cc !== null ) {
                                        rtnStr += tmpSkill.comment + "\n";
                                        if(_isSummonMob(tmpOur)) {
                                            if(smnEffect[summonUserIdx][summonIdx].n_dth) {
                                                tmpSkill.cc.deathcount = ((smnCC[summonUserIdx][summonIdx].deathcount > 1)?(smnCC[summonUserIdx][summonIdx].deathcount - 1):smnCC[summonUserIdx][summonIdx].deathcount);
                                                rtnStr += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                                            }

                                            smnCC[summonUserIdx][summonIdx] = tmpSkill.cc;
                                            if(smnCC[summonUserIdx][summonIdx].effect.indexOf("provo") !== -1)
                                                smnCC[summonUserIdx][summonIdx].provo = i;
                                        }
                                        else {
                                            if(userEffect[tmpOur].n_dth) {
                                                tmpSkill.cc.deathcount = ((userCC[tmpOur].deathcount > 1)?(userCC[tmpOur].deathcount - 1):userCC[tmpOur].deathcount);
                                                rtnStr += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                                            }

                                            userCC[tmpOur] = tmpSkill.cc;
                                            if(userCC[tmpOur].effect.indexOf("provo") !== -1)
                                                userCC[tmpOur].provo = i;
                                        }
                                    }

                                    if(_getPoint(tmpOur, "hp", _userlist, null, summonlist, true) === 0)
                                    {
                                        rtnStr += "  - " + (_isSummonMob(tmpOur)?summonlist[summonUserIdx][summonIdx].mobname:_userlist[tmpOur].name) + "이(가) 정신을 잃었습니다\n";

                                        for(c = 0; c < mobCC.length; ++c) {
                                            if(mobCC[c].provo === j)
                                                mobCC[c].provo = Not_ProvoTarget;
                                        }

                                        if(!_isSummonMob(tmpOur))
                                            retireList.push(tmpOur);
                                        
                                        ourList.splice(ourList.indexOf(tmpOur),1);
                                        j--;
                                        length -= 1;
                                    }
                                }
                                else {
                                    if(tmpSkill.cc !== null ) {
                                        rtnStr += tmpSkill.comment + "\n";
                                        if(_isSummonMob(tmpOur)) {
                                            if(smnEffect[summonUserIdx][summonIdx].n_dth) {
                                                tmpSkill.cc.deathcount = ((smnCC[summonUserIdx][summonIdx].deathcount > 1)?(smnCC[summonUserIdx][summonIdx].deathcount - 1):smnCC[summonUserIdx][summonIdx].deathcount);
                                                rtnStr += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                                            }

                                            smnCC[summonUserIdx][summonIdx] = tmpSkill.cc;
                                            if(smnCC[summonUserIdx][summonIdx].effect.indexOf("provo") !== -1)
                                                smnCC[summonUserIdx][summonIdx].provo = i;
                                        }
                                        else {
                                            if(userEffect[tmpOur].n_dth) {
                                                tmpSkill.cc.deathcount = ((userCC[tmpOur].deathcount > 1)?(userCC[tmpOur].deathcount - 1):userCC[tmpOur].deathcount);
                                                rtnStr += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                                            }

                                            userCC[tmpOur] = tmpSkill.cc;
                                            if(userCC[tmpOur].effect.indexOf("provo") !== -1)
                                                userCC[tmpOur].provo = i;
                                        }
                                    }
                                    rtnStr += "  - " +  (_isSummonMob(tmpOur)?summonlist[summonUserIdx][summonIdx].mobname:_userlist[tmpOur].name) + "이(가) 회피\n";
                                }
                                rtnStr += "\n";
                            }
                        }
                    }
                }
            }
        }

        var divRune = Math.floor(recordRune.rune / _userlist.length);
        var shuffledUser = _userlist.sort(function() { return Math.random() - 0.5;});
        var dividx = -1, divItem = null, divItemDB = null;
        var result = [], rst_list, rst_item;
        rtnStr += "(파티 정산)\n";
        
        rtnStr += " - 모인 총 룬 : " + recordRune.rune + "\n";
        rtnStr += " - 정산 룬 : " + divRune + "\n";
    
        for(i = 0; i < shuffledUser.length; ++i) {
            shuffledUser[i].addRune(divRune);
            result.push({name : shuffledUser[i].name, list:[]});
        }

         rtnStr += " - 드롭템\n";
        while(recordItemList.length !== 0) {
            for(j = 0; j < shuffledUser.length; ++j) {
                if(recordItemList.length === 0) break;
                dividx = libCommon.Rand(0, recordItemList.length -1);
                divItem = recordItemList[dividx];
                divItemDB = db_Manager.getItem(divItem.kind, divItem.index);

                divItem.count--;
                shuffledUser[j].addItem(divItem.kind, divItem.index, 1, divItem.strength);
                rst_list = result.find(function(obj) { return obj.name === shuffledUser[j].name}).list;
                rst_item = rst_list.find(function(obj) { return obj.name === divItemDB.name});
                if(rst_item === undefined || rst_item === null) {
                    rst_list.push({name : divItemDB.name, count:1, strength: divItem.strength});
                }
                else {
                    rst_item.count++;
                }
                
                if(divItem.count === 0){
                    recordItemList.splice(dividx,1);
                }
            }
        }

        for(i = 0; i < result.length; ++i) {
            rst_list = result[i].list;
            rtnStr += "   L " + result[i].name + "\n";
            for(j = 0; j < rst_list.length; ++j) {
                rtnStr += "     > " + rst_list[j].name + (rst_list[j].strength===0?"":("+" + rst_list[j].strength)) + " x" + rst_list[j].count + "\n";
            }
        }

        for(i = 0; i < _userlist.length; ++i) {
            RecordManager.rcdMaxRune(_userlist[i].name, divRune);
            for(r = 0; r < recordMobList.length; ++r) {
                RecordManager.rcdMonster(_userlist[i].name, recordMobList[r].index, recordMobList[r].count, false);
            }
        }

        mobretireList = null;
        mobattspdCounter = null;
        mobAttspd = null;
        mobCC = null;
        mobEffect = null;
        mobHP = null;
        mobMP = null;
        mobSP = null;

        ourList = null;
        retireList = null;
        userattspdCounter = null;
        userAttspd = null;
        userMaxHP = null;
        userMaxMP = null;
        userMaxSP = null;
        userMaxDP = null;
        userSkillCoolTime = null;
        userCC = null;
        userEffect = null;
        userIdx;

        summonDB = null;
        summonlist = null;
        smnattspdCounter = null;
        smnAttspd = null;
        smnCC = null;
        smnEffect = null;

        recordMobList = null;
        recordRune = null;
        recordItemList = null;

        return rtnStr;

    };
    _JudgAvoid = function(_myAcc, _targetAvoid) {
        var Avoid_Percent = _AvoidCalc(_myAcc, _targetAvoid);
        var judgment = libCommon.Randfloat(0,100);

        return (judgment > Avoid_Percent);
    };
    _JudgAttack = function(_myAtt, _myCri, _targetCri, _targetDef, _myCriRate, _cri) {
        var damage = _AttCalcDamage(_myAtt, _targetDef);
        if(damage <= 0)
            damage = 1;
        var calcCri = _CriCalc(_myCri, _targetCri);
        if(calcCri <= 0) {
            _cri.cri = 0;
            return damage;
        }

        var cridamage = Math.floor(damage * _CriCalcDamage(_myCri, _targetCri));
        var judgment = libCommon.Randfloat(0,100);

        if(judgment > calcCri) {
            _cri.cri = 0;
            return damage;
        }
        else {
            _cri.cri = 1;
            return cridamage;
        }

    };
    _JudgDrop = function(_index, _name, _itemlist, _rune, _exp, _user, _MercenaryManager, _b_buff, _recordrune) {
        var item, rune;
        var rtnstr = "";
        var judgment, obj, i, j, resultflag, allIdx;
        var petBuff_rune = PetManager.getBuffAmountByKind(_user.name, "rune") / 100;
        var petBuff_drop = PetManager.getBuffAmountByKind(_user.name, "drop") / 100;
        var event_DropItemRate = EventManager.getDropItemRate();
        var event_DropRuneRate = EventManager.getDropRuneRate();
        var event_TargetItem = EventManager.getEvent(EventManager.TARGETEVENT);

        if(event_DropItemRate > 0) {
            rtnstr += "  - (이벤트) 아이템 드랍률이 " + (event_DropItemRate+1) + "배 상승합니다.\n";
        }
        if(event_DropRuneRate > 0) {
            rtnstr += "  - (이벤트) 룬 획득이 " + (event_DropRuneRate+1) + "배 상승합니다.\n";
        }

        for(i = 0; i < _itemlist.length; ++i) {
            item = _itemlist[i];
            judgment = libCommon.Randfloat(0,100);
            if(judgment <= (Number(item.droprate) * ((_b_buff !== null?Number(_b_buff.probability):1) + event_DropItemRate + petBuff_drop))) {
                rtnstr += "  - " + db_Manager.getSundryItem(item.itemIdx).name + "을(를) 획득하였습니다.\n";
                _user.addItem(libConst.ITEM_KIND["SUNDRYITEM"], item.itemIdx, item.count);
            }
        }
        rune = Math.floor(libCommon.Rand(Number(_rune.split("~")[0]) ,Number(_rune.split("~")[1])) * ((_b_buff !== null?Number(_b_buff.obtainrune):1) + event_DropRuneRate + petBuff_rune));
        rtnstr += "  - " + rune + "Rune을 획득하였습니다.\n";
        _user.addRune(rune);
        if(_MercenaryManager !== null) {
            _MercenaryManager.incExp(_user.name, Math.floor(Number(_exp) / libConst.MercenaryExpWeight));
            rtnstr += "  - 용병들 경험치 증가 : +" + Math.floor(Number(_exp) / libConst.MercenaryExpWeight) + "\n";
        }
            
        _recordrune.rune += rune;

        for(j = 0; j < event_TargetItem.length; ++j) {
            obj = event_TargetItem[j];

            if(obj.onoff) {
                resultflag = false;
                allIdx = -1;
                for(i = 0; i < obj.moblist.length; ++i) {
                    if(obj.moblist[i].index === _index) {
                        resultflag = true;
                        judgment = libCommon.Randfloat(0,100);
                        if(judgment <= Number(obj.moblist[i].rate)) {
                            rtnstr += "  - (이벤트) " + db_Manager.getItem(obj.item.kind, obj.item.index).name + (obj.item.strength==="0"?"":("+" + obj.item.strength)) + "을(를) " + obj.item.count + "개 획득하였습니다.\n";
                            _user.addItem(obj.item.kind, obj.item.index, obj.item.count, Number(obj.item.strength));
                        }
                    }

                    if(obj.moblist[i].index === "all") {
                        allIdx = i;
                    }
                }

                if(allIdx !== -1 && !resultflag) {
                    judgment = libCommon.Randfloat(0,100);
                    if(judgment <= Number(obj.moblist[allIdx].rate)) {
                        rtnstr += "  - (이벤트) " + db_Manager.getItem(obj.item.kind, obj.item.index).name + (obj.item.strength==="0"?"":("+" + obj.item.strength)) + "을(를) " + obj.item.count + "개 획득하였습니다.\n";
                        _user.addItem(obj.item.kind, obj.item.index, obj.item.count, Number(obj.item.strength));
                    }
                }
            }
        }

        return rtnstr;
    };
    _JudgSummonSkill = function(_db, _summonlist, _user) {
        var rtn = {jude:false, count:0, comment:"", removedp:0, skillname:"", targetmob:null, refresh:[]};
        var userAbility = _user.getAbility(), s;
        var obj, mob, flag = true, stopFlag = true;
        for(var i = 0; i < _db.length; ++i) {
            obj = _db[i];
            if(stopFlag && obj.needturn === 0) {
                stopFlag = false;
                rtn.refresh = [];
                flag = true;
                for(s = 0; s < _summonlist.length; ++s) {
                    mob = _summonlist[s];
                    if(mob.index === obj.index && mob.ability.hp > 0) {
                        flag = false;
                    }

                    if(mob.index === obj.index && mob.ability.hp === 0) {
                        rtn.refresh.push(s);
                    }
                }
                if(flag) {
                    if(obj.needdp < userAbility.dp) {
                        rtn.targetmob = {
                            index:obj.index,
                            mobidx:obj.mobidx,
                            mobname:obj.mobname,
                            skill:obj.skill,
                            skillrate:obj.skillrate,
                            ability:{
                                attack:obj.ability.attack,
                                magic:obj.ability.magic,
                                defense:obj.ability.defense,
                                atkspeed:obj.ability.atkspeed,
                                accuracy:obj.ability.accuracy,
                                avoid:obj.ability.avoid,
                                critical:obj.ability.critical,
                                hp:obj.ability.hp,
                                mp:obj.ability.mp,
                                sp:obj.ability.sp
                            },
                            keepturn:obj.keepturn
                        };
                        rtn.jude = true;
                        rtn.count = obj.count;
                        rtn.skillname = obj.skillname;
                        rtn.removedp = obj.needdp;
                    }
                    else {
                        rtn.comment += "  - 정신력이 부족하여 " + obj.skillname + "을(를) 사용할 수 없습니다.\n";
                    }
                }
                else {
                    stopFlag = true;
                }
            }
            else {
                obj.needturn -= 1;
                if(obj.needturn < 0)
                    obj.needturn = 0;
            }
        }
        return rtn;
    };
    // 개인 플 관련
    _JudgSkill = function(_opt, _mop, _user, _cri, _cooltime, _meraura) {
        var rtnObj = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
        var skillinfo = null;
        var calcCri = 0, calcCriDamage = 0;
        var userAbility = _user.getAbility();
        var rightWeapon = _user.getEquimentInfo("righthand");
        var leftWeapon = _user.getEquimentInfo("lefthand");
        var ccinfo = null;
        var judgment = 0;
        var nhp, nmp, nsp, i;
        var option = _opt.getattSkillOpt();

        for(i = 0; i < option.length; ++i) {
            if(option[i] === undefined || option[i] === null) {
                continue;
            }

            if(_cooltime[i] === 0) {
                skillinfo = db_Manager.getSkill(option[i]);
                _cooltime[i] = Number(skillinfo.time);
                break;
            }
        }
        

        if(skillinfo !== null && rightWeapon !== null) {
            if(skillinfo.needhp === "all" && userAbility.hp > 1) {
                nhp = userAbility.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && userAbility.mp > 0) {
                nmp = userAbility.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && userAbility.sp > 0) {
                nsp = userAbility.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }

            if(skillinfo.weapon === rightWeapon.kind || (leftWeapon !== null && skillinfo.weapon === leftWeapon.kind)) {
                if(nhp < userAbility.hp && nmp <= userAbility.mp && nsp <= userAbility.sp) {
                    rtnObj.damage = _SkillCalcDamage(_AuraCalc(skillinfo.kind, userAbility[skillinfo.kind], _meraura), _AuraCalc(skillinfo.subkind, userAbility[skillinfo.subkind], _meraura), skillinfo, _mop.ability.defense);
                    if(rtnObj.damage <= 0)
                        rtnObj.damage = 1;
                    rtnObj.name = skillinfo.name;
                    rtnObj.removehp = nhp;
                    rtnObj.removemp = nmp;
                    rtnObj.removesp = nsp;
                    rtnObj.range = skillinfo.range;
                    rtnObj.count = Number(skillinfo.count);
                    rtnObj.skillkind = skillinfo.kind;
                    rtnObj.skillsubkind = skillinfo.subkind;
                    rtnObj.skilleffect = skillinfo.effect;
                    ccinfo = _JudgCC(skillinfo.cc);
                    if(ccinfo.continue !== 0) {
                        rtnObj.cc = ccinfo;
                        rtnObj.comment = "  - 상대에게 상태이상 " + ccinfo.name + "에 걸었습니다.";
                    }

                    if(skillinfo.iscritical === "T") {
                        calcCri = _CriCalc(_AuraCalc("c", userAbility.critical, _meraura), _mop.ability.critical);
                        if(calcCri > 0) {
                            calcCriDamage = Math.floor(rtnObj.damage * _CriCalcDamage(_AuraCalc("c", userAbility.critical, _meraura), _mop.ability.critical));
                            judgment = libCommon.Randfloat(0,100);
                            if(judgment > calcCri) {
                                _cri.cri = 0;
                            }
                            else {
                                _cri.cri = 1;
                                rtnObj.damage = calcCriDamage;
                            }
                        }
                    }
                }
                else {
                    rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                }
            }
            else {
                rtnObj.comment = "  - 무기 타입이 달라서 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        else {
            if(skillinfo === null) {
                rtnObj.comment = "  - 모든 스킬이 쿨타임 중입니다.";
            }
            else if(rightWeapon === null) {
                rtnObj.comment = "  - 무기를 착용하고 있지 않아서 스킬을 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgHealSkill = function(_opt, _user, _usermaxhp, _mercentlist, _summonlist, _summondb, _ourlist, _retirelist, _cooltime, _meraura) {
        var rtnObj = {name:"", type:"", heal:0, removehp:0, removemp:0, removesp:0, comment:"", range:"single", count:1, targetidx:[]};
        var userAbility = _user.getAbility();
        var rightWeapon = _user.getEquimentInfo("righthand");
        var leftWeapon = _user.getEquimentInfo("lefthand");
        var userOpt = _opt.getHealSkillOpt();
        var userMaxHp = _usermaxhp;
        var userCurrHp = userAbility.hp;
        var skillinfo = null;
        var nhp, nmp, nsp;
        var option = null;
        var healCount = 1;

        var targetpercent, tmpMercentDB;
        var targetidx = -1;
        var targetIdxList = [];
        var untargetIdxList = [];

        var i = 0, j, tmpNum, tmplength, tmpCooltimeidx;

        if(userOpt.length === 0) return rtnObj;

        //revice일경우, tmpHealing.targetidx는 ourList 실제값, heal일 경우 ourList 인덱스
        for(i = 0; i < userOpt.length; ++i) {
            option = userOpt[i];
            if(option === undefined || option === null) {
                continue;
            }

            if(_cooltime[i] === 0) {
                skillinfo = db_Manager.getSkill(option.index);

                if(skillinfo.type === "heal") {
                    for(j = 0; j < _ourlist.length; ++j) {
                        targetidx = _ourlist[j];
                        if(targetidx === -1) {
                            targetpercent = Math.floor((userCurrHp / userMaxHp) * 100);
                        }
                        else if(_isSummonMob(targetidx)) {
                            targetidx = Number(targetidx.substring(1));
                            targetpercent = Math.floor((_summonlist[targetidx].ability.hp / _summondb[_summonlist[targetidx].index].ability.hp) * 100);
                        }
                        else {
                            tmpMercentDB =  db_Manager.getMercenary(_mercentlist[targetidx].index);
                            targetpercent = Math.floor((_mercentlist[targetidx].hp / tmpMercentDB.ability.hp) * 100);
                        }

                        if(targetpercent <= option.percent) {
                            targetIdxList.push(j);
                        }
                    }
                    if(targetIdxList.length === 0)
                        continue;
                }

                if(skillinfo.type === "revive" && _retirelist.length === 0)
                    continue;

                healCount = Number(skillinfo.count);
                tmpCooltimeidx = i;
                break;
            }
        }
        if(skillinfo === null) return rtnObj;

        if(skillinfo.type === "heal") {
            for(i = 0; i < _ourlist.length; ++i) {
                targetidx = _ourlist[i];
                if(targetidx === -1) {
                    targetpercent = Math.floor((userCurrHp / userMaxHp) * 100);
                }
                else if(_isSummonMob(targetidx)) {
                    targetidx = Number(targetidx.substring(1));
                    targetpercent = Math.floor((_summonlist[targetidx].ability.hp / _summondb[_summonlist[targetidx].index].ability.hp) * 100);
                }
                else {
                    tmpMercentDB =  db_Manager.getMercenary(_mercentlist[targetidx].index);
                    targetpercent = Math.floor((_mercentlist[targetidx].hp / tmpMercentDB.ability.hp) * 100);
                }

                if(targetpercent <= option.percent) {
                    targetIdxList.push(i);
                }
                else {
                    untargetIdxList.push(i);
                }
            }
            
            tmplength = targetIdxList.length;

            if(tmplength === 0) {
                return rtnObj;
            }
            else if(tmplength > healCount) {
                for(i = 0; i < (tmplength - healCount); ++i) {
                    targetIdxList.splice(libCommon.Rand(0,targetIdxList.length - 1), 1);
                }
            }
            else if(tmplength <= healCount) {
                for(i = 0; i < (healCount - tmplength); ++i) {
                    if(untargetIdxList.length === 0) break;

                    tmpNum = libCommon.Rand(0,untargetIdxList.length - 1);
                    targetIdxList.push(untargetIdxList[tmpNum]);
                    untargetIdxList.splice(tmpNum, 1);
                }
            }
        }
        else if(skillinfo.type === "revive") {
            for(i = 0; i < healCount; ++i) {
                if(_retirelist.length === 0) break;

                tmpNum = libCommon.Rand(0,_retirelist.length - 1);
                targetIdxList.push(_retirelist[tmpNum]);
                _retirelist.splice(tmpNum, 1);
            }

            if(targetIdxList.length === 0) {
                return rtnObj;
            }
        }
        
        rtnObj.targetidx = targetIdxList;

        if(skillinfo !== null && rightWeapon !== null) {
            if(skillinfo.needhp === "all" && userAbility.hp > 1) {
                nhp = userAbility.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && userAbility.mp > 0) {
                nmp = userAbility.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && userAbility.sp > 0) {
                nsp = userAbility.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(skillinfo.weapon === rightWeapon.kind || (leftWeapon !== null && skillinfo.weapon === leftWeapon.kind)) {
                if(nhp < userAbility.hp && nmp <= userAbility.mp && nsp <= userAbility.sp) {
                    rtnObj.heal = Math.floor((_AuraCalc(skillinfo.kind, userAbility[skillinfo.kind], _meraura) + (_AuraCalc(skillinfo.subkind, userAbility[skillinfo.subkind], _meraura)/2)) * libConst.HealSkillIncRate * skillinfo.effect);
                    if(rtnObj.heal <= 0)
                        rtnObj.heal = 1;

                    rtnObj.name = skillinfo.name;
                    rtnObj.removehp = nhp;
                    rtnObj.removemp = nmp;
                    rtnObj.removesp = nsp;
                    rtnObj.range = skillinfo.range;
                    rtnObj.count = healCount;
                    rtnObj.type = skillinfo.type;
                    _cooltime[tmpCooltimeidx] = Number(skillinfo.time);
                }
                else {
                    rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                }
            }
            else {
                rtnObj.comment = "  - 무기 타입이 달라서 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgCureSkill = function(_opt, _user, _userCC, _mercentCC, _summonCC, _mtable, _ourlist) {
        var rtnObj = {name:"", jude:false, removehp:0, removemp:0, removesp:0, comment:"", range:"single", targetidx:-1};
        var userAbility = _user.getAbility();
        var rightWeapon = _user.getEquimentInfo("righthand");
        var leftWeapon = _user.getEquimentInfo("lefthand");
        var userOpt = _opt.getCureSkillOpt();
        var skillinfo;
        var nhp, nmp, nsp;

        var CCname = "";
        var targetidx = -1;
        var targetIdxList = [];

        if(userOpt === "") {
            return rtnObj;
        }

        for(var i = 0; i < _ourlist.length; ++i) {
            targetidx = _ourlist[i];
            CCname = "";
            if(targetidx === -1) {
                CCname = _userCC.name;
            }
            else if(_isSummonMob(targetidx)) {
                targetidx = Number(targetidx.substring(1));
                CCname = _summonCC[targetidx].name;
            }
            else {
                CCname = _mercentCC[_mtable[targetidx]].name;
            }
            if(CCname !== "") {
                targetIdxList.push(i);
            }
        }
        if(targetIdxList.length === 0) {
            return rtnObj;
        }
        rtnObj.targetidx = targetIdxList[libCommon.Rand(0,targetIdxList.length - 1)];

        skillinfo = db_Manager.getSkill(userOpt);
        if(skillinfo !== null && rightWeapon !== null) {
            if(skillinfo.needhp === "all" && userAbility.hp > 1) {
                nhp = userAbility.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && userAbility.mp > 0) {
                nmp = userAbility.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && userAbility.sp > 0) {
                nsp = userAbility.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(skillinfo.weapon === rightWeapon.kind || (leftWeapon !== null && skillinfo.weapon === leftWeapon.kind)) {
                if(nhp < userAbility.hp && nmp <= userAbility.mp && nsp <= userAbility.sp) {

                    rtnObj.name = skillinfo.name;
                    rtnObj.jude = true;
                    rtnObj.removehp = nhp;
                    rtnObj.removemp = nmp;
                    rtnObj.removesp = nsp;
                    rtnObj.range = skillinfo.range;
                }
                else {
                    rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                }
            }
            else {
                rtnObj.comment = "  - 무기 타입이 달라서 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }

        return rtnObj;
    };
    //용병 관련
    _JudbMerSkill = function(_mop, _mercent, _cri, _meraura) {
        var rtnObj = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
        var mercentDB = db_Manager.getMercenary(_mercent.index);
        var tmpskilllist = [];
        var ccinfo = null;
        var nhp, nmp, nsp;
        var skillRand = libCommon.Randfloat(0,100);
        if(Number(mercentDB.skillrate) <= skillRand) {
            return rtnObj;
        }

        for(var i = 0; i < mercentDB.skill.length; ++i){
            if(db_Manager.getSkill(mercentDB.skill[i]).type === "damage") {
                tmpskilllist.push(mercentDB.skill[i]);
            }
        }
        if(tmpskilllist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpskilllist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpskilllist[skillIdx]);
        var calcCri = 0, calcCriDamage = 0, judgment = 0;

        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _mercent.hp > 1) {
                nhp = _mercent.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _mercent.mp > 0) {
                nmp = _mercent.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _mercent.sp > 0) {
                nsp = _mercent.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }

            var tmpAbility = _getCurrVitality(skillinfo.kind, mercentDB.ability, _mercent);
            var tmpSubAbility = _getCurrVitality(skillinfo.subkind, mercentDB.ability, _mercent);

            if(nhp <= _mercent.hp && nmp <= _mercent.mp && nsp <= _mercent.sp) {
                rtnObj.damage = _SkillCalcDamage(_AuraCalc(skillinfo.kind, tmpAbility, _meraura), _AuraCalc(skillinfo.subkind, tmpSubAbility, _meraura), skillinfo, _mop.ability.defense);
                if(rtnObj.damage <= 0)
                    rtnObj.damage = 1;
                rtnObj.name = skillinfo.name;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
                rtnObj.count = Number(skillinfo.count);
                rtnObj.skillkind = skillinfo.kind;
                rtnObj.skillsubkind = skillinfo.subkind;
                rtnObj.skilleffect = skillinfo.effect;
                ccinfo = _JudgCC(skillinfo.cc);
                if(ccinfo.continue !== 0) {
                    rtnObj.cc = ccinfo;
                    rtnObj.comment = "  - 상대에게 상태이상 " + ccinfo.name + "에 걸었습니다.";
                }

                if(skillinfo.iscritical === "T") {
                    calcCri = _CriCalc(_AuraCalc("c", mercentDB.ability.critical, _meraura), _mop.ability.critical);
                    if(calcCri > 0) {
                        calcCriDamage = Math.floor(rtnObj.damage * _CriCalcDamage(_AuraCalc("c", mercentDB.ability.critical, _meraura), _mop.ability.critical));
                        judgment = libCommon.Randfloat(0,100);
                        if(judgment > calcCri) {
                            _cri.cri = 0;
                        }
                        else {
                            _cri.cri = 1;
                            rtnObj.damage = calcCriDamage;
                        }
                    }
                }
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgMerHealSkill = function(_mercent, _user, _usermaxhp, _mercentlist, _summonlist, _summondb, _ourlist, _retirelist, _meraura) {
        var rtnObj = {name:"", type:"", heal:0, removehp:0, removemp:0, removesp:0, comment:"", range:"single", count:1, targetidx:[]};
        var mercentDB = db_Manager.getMercenary(_mercent.index);
        var tmpheallist = [], i, tmpNum;
        var nhp, nmp, nsp;
        var tmpSkill = null, tmplength;
        var skillRand = libCommon.Randfloat(0,100);
        if(Number(mercentDB.skillrate) <= skillRand) {
            return rtnObj;
        }

        for(i = 0; i < mercentDB.skill.length; ++i){
            tmpSkill = db_Manager.getSkill(mercentDB.skill[i]);
            if(tmpSkill.type === "heal" || tmpSkill.type === "revive") {
                tmpheallist.push(mercentDB.skill[i]);
            }
        }
        if(tmpheallist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpheallist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpheallist[skillIdx]);
        var healCount = Number(skillinfo.count);

        var targetpercent, tmpMercentDB;
        var targetidx = -1;
        var targetIdxList = [];
        var untargetIdxList = [];

        if(skillinfo === null) return rtnObj;

        if(skillinfo.type === "heal") {
            for(i = 0; i < _ourlist.length; ++i) {
                targetidx = _ourlist[i];
                if(targetidx === -1) {
                    targetpercent = Math.floor((_user.getAbility().hp / _usermaxhp) * 100);
                }
                else if(_isSummonMob(targetidx)) {
                    targetidx = Number(targetidx.substring(1));
                    targetpercent = Math.floor((_summonlist[targetidx].ability.hp / _summondb[_summonlist[targetidx].index].ability.hp) * 100);
                }
                else {
                    tmpMercentDB =  db_Manager.getMercenary(_mercentlist[targetidx].index);
                    targetpercent = Math.floor((_mercentlist[targetidx].hp / tmpMercentDB.ability.hp) * 100);
                }
                if(targetpercent <= libConst.MercenaryHealSkillRate) {
                    targetIdxList.push(i);
                }
                else {
                    untargetIdxList.push(i);
                }
            }
            tmplength = targetIdxList.length;

            if(tmplength === 0) {
                return rtnObj;
            }
            else if(tmplength > healCount) {
                for(i = 0; i < (tmplength - healCount); ++i) {
                    targetIdxList.splice(libCommon.Rand(0,targetIdxList.length - 1), 1);
                }
            }
            else if(tmplength <= healCount) {
                for(i = 0; i < (healCount - tmplength); ++i) {
                    if(untargetIdxList.length === 0) break;

                    tmpNum = libCommon.Rand(0,untargetIdxList.length - 1);
                    targetIdxList.push(untargetIdxList[tmpNum]);
                    untargetIdxList.splice(tmpNum, 1);
                }
            }
        }
        else if(skillinfo.type === "revive") {
            for(i = 0; i < healCount; ++i) {
                if(_retirelist.length === 0) break;

                tmpNum = libCommon.Rand(0,_retirelist.length - 1);
                targetIdxList.push(_retirelist[tmpNum]);
                _retirelist.splice(tmpNum, 1);
            }

            if(targetIdxList.length === 0) {
                return rtnObj;
            }
        }

        rtnObj.targetidx = targetIdxList;

        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _mercent.hp > 1) {
                nhp = _mercent.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _mercent.mp > 0) {
                nmp = _mercent.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _mercent.sp > 0) {
                nsp = _mercent.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(nhp <= _mercent.hp && nmp <= _mercent.mp && nsp <= _mercent.sp) {
                rtnObj.heal = Math.floor((_AuraCalc(skillinfo.kind, mercentDB.ability[skillinfo.kind], _meraura) + (_AuraCalc(skillinfo.subkind, mercentDB.ability[skillinfo.subkind], _meraura)/2)) * libConst.HealSkillIncRate * skillinfo.effect);
                if(rtnObj.heal <= 0)
                    rtnObj.heal = 1;

                rtnObj.name = skillinfo.name;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
                rtnObj.count = healCount;
                rtnObj.type = skillinfo.type;
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgMerCureSkill = function(_mercent,  _userCC, _mercentCC, _summonCC, _mtable, _ourlist) {
        var rtnObj = {name:"", jude:false, removehp:0, removemp:0, removesp:0, comment:"", range:"single", targetidx:-1};
        var mercentDB = db_Manager.getMercenary(_mercent.index);
        var tmpheallist = [], i;
        var nhp, nmp, nsp;
        for(i = 0; i < mercentDB.skill.length; ++i){
            if(db_Manager.getSkill(mercentDB.skill[i]).type === "remove") {
                tmpheallist.push(mercentDB.skill[i]);
            }
        }
        if(tmpheallist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpheallist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpheallist[skillIdx]);

        var CCname = "";
        var targetidx = -1;
        var targetIdxList = [];
        for(i = 0; i < _ourlist.length; ++i) {
            targetidx = _ourlist[i];
            CCname = "";
            if(targetidx === -1) {
                CCname = _userCC.name;
            }
            else if(_isSummonMob(targetidx)) {
                targetidx = Number(targetidx.substring(1));
                CCname = _summonCC[targetidx].name;
            }
            else {
                CCname = _mercentCC[_mtable[targetidx]].name;
            }
            if(CCname !== "") {
                targetIdxList.push(i);
            }
        }
        if(targetIdxList.length === 0) {
            return rtnObj;
        }
        rtnObj.targetidx = targetIdxList[libCommon.Rand(0,targetIdxList.length - 1)];
        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _mercent.hp > 1) {
                nhp = _mercent.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _mercent.mp > 0) {
                nmp = _mercent.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _mercent.sp > 0) {
                nsp = _mercent.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(nhp <= _mercent.hp && nmp <= _mercent.mp && nsp <= _mercent.sp) {

                rtnObj.name = skillinfo.name;
                rtnObj.jude = true;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    //소환수 관련
    _JudbSmnSkill = function(_mop, _summon, _cri, _summondb, _meraura) {
        var rtnObj = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
        var summonDB = _summondb[_summon.index];
        var tmpskilllist = [];
        var ccinfo = null;
        var nhp, nmp, nsp;
        var skillRand = libCommon.Randfloat(0,100);
        if(Number(summonDB.skillrate) <= skillRand) {
            
            return rtnObj;
        }

        for(var i = 0; i < summonDB.skill.length; ++i){
            if(db_Manager.getSkill(summonDB.skill[i]).type === "damage") {
                tmpskilllist.push(summonDB.skill[i]);
            }
        }
        if(tmpskilllist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpskilllist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpskilllist[skillIdx]);
        var calcCri = 0, calcCriDamage = 0, judgment = 0;

        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _summon.ability.hp > 1) {
                nhp = _summon.ability.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _summon.ability.mp > 0) {
                nmp = _summon.ability.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _summon.ability.sp > 0) {
                nsp = _summon.ability.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }

            var tmpAbility = _getCurrVitality(skillinfo.kind, summonDB.ability, _summon.ability);
            var tmpSubAbility = _getCurrVitality(skillinfo.subkind, summonDB.ability, _summon.ability);

            if(nhp <= _summon.ability.hp && nmp <= _summon.ability.mp && nsp <= _summon.ability.sp) {
                rtnObj.damage = _SkillCalcDamage(_AuraCalc(skillinfo.kind, tmpAbility, _meraura), _AuraCalc(skillinfo.subkind, tmpSubAbility, _meraura), skillinfo, _mop.ability.defense);
                if(rtnObj.damage <= 0)
                    rtnObj.damage = 1;
                rtnObj.name = skillinfo.name;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
                rtnObj.count = Number(skillinfo.count);
                rtnObj.skillkind = skillinfo.kind;
                rtnObj.skillsubkind = skillinfo.subkind;
                rtnObj.skilleffect = skillinfo.effect;
                ccinfo = _JudgCC(skillinfo.cc);
                if(ccinfo.continue !== 0) {
                    rtnObj.cc = ccinfo;
                    rtnObj.comment = "  - 상대에게 상태이상 " + ccinfo.name + "에 걸었습니다.";
                }

                if(skillinfo.iscritical === "T") {
                    calcCri = _CriCalc(_AuraCalc("c", summonDB.ability.critical, _meraura), _mop.ability.critical);
                    if(calcCri > 0) {
                        calcCriDamage = Math.floor(rtnObj.damage * _CriCalcDamage(_AuraCalc("c", summonDB.ability.critical, _meraura), _mop.ability.critical));
                        judgment = libCommon.Randfloat(0,100);
                        if(judgment > calcCri) {
                            _cri.cri = 0;
                        }
                        else {
                            _cri.cri = 1;
                            rtnObj.damage = calcCriDamage;
                        }
                    }
                }
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgSmnHealSkill = function(_summon, _user, _usermaxhp, _mercentlist, _summonlist, _summondb, _ourlist, _meraura) {
        var rtnObj = {name:"", heal:0, removehp:0, removemp:0, removesp:0, comment:"", range:"single", targetidx:-1};
        var summonDB = _summondb[_summon.index];
        var tmpheallist = [], i;
        var nhp, nmp, nsp;
        for(i = 0; i < summonDB.skill.length; ++i){
            if(db_Manager.getSkill(summonDB.skill[i]).type === "heal") {
                tmpheallist.push(summonDB.skill[i]);
            }
        }
        if(tmpheallist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpheallist.length - 1);
        var skillinfo;

        var targetpercent, tmpMercentDB;
        var targetidx = -1;
        var targetIdxList = [];
        for(i = 0; i < _ourlist.length; ++i) {
            targetidx = _ourlist[i];
            if(targetidx === -1) {
                targetpercent = Math.floor((_user.getAbility().hp / _usermaxhp) * 100);
            }
            else if(_isSummonMob(targetidx)) {
                targetidx = Number(targetidx.substring(1));
                targetpercent = Math.floor((_summonlist[targetidx].ability.hp / _summondb[_summonlist[targetidx].index].ability.hp) * 100);
            }
            else {
                tmpMercentDB =  db_Manager.getMercenary(_mercentlist[targetidx].index);
                targetpercent = Math.floor((_mercentlist[targetidx].hp / tmpMercentDB.ability.hp) * 100);
            }
            if(targetpercent <= 60) {
                targetIdxList.push(i);
            }
        }
        if(targetIdxList.length === 0) {
            return rtnObj;
        }
        rtnObj.targetidx = targetIdxList[libCommon.Rand(0,targetIdxList.length - 1)];

        skillinfo = db_Manager.getSkill(tmpheallist[skillIdx]);
        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _summon.ability.hp > 1) {
                nhp = _summon.ability.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _summon.ability.mp > 0) {
                nmp = _summon.ability.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _summon.ability.sp > 0) {
                nsp = _summon.ability.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(nhp <= _summon.ability.hp && nmp <= _summon.ability.mp && nsp <= _summon.ability.sp) {
                rtnObj.heal = Math.floor(_AuraCalc(skillinfo.kind, summonDB.ability[skillinfo.kind], _meraura) * libConst.HealSkillIncRate * skillinfo.effect);
                if(rtnObj.heal <= 0)
                    rtnObj.heal = 1;

                rtnObj.name = skillinfo.name;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgSmnCureSkill = function(_summon,  _userCC, _mercentCC, _summonCC, _mtable, _summondb, _ourlist) {
        var rtnObj = {name:"", jude:false, removehp:0, removemp:0, removesp:0, comment:"", range:"single", targetidx:-1};
        var summonDB = _summondb[_summon.index];
        var tmpheallist = [], i;
        var nhp, nmp, nsp;
        for(i = 0; i < summonDB.skill.length; ++i){
            if(db_Manager.getSkill(summonDB.skill[i]).type === "remove") {
                tmpheallist.push(summonDB.skill[i]);
            }
        }
        if(tmpheallist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpheallist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpheallist[skillIdx]);

        var CCname = "";
        var targetidx = -1;
        var targetIdxList = [];
        for(i = 0; i < _ourlist.length; ++i) {
            targetidx = _ourlist[i];
            CCname = "";
            if(targetidx === -1) {
                CCname = _userCC.name;
            }
            else if(_isSummonMob(targetidx)) {
                targetidx = Number(targetidx.substring(1));
                CCname = _summonCC[targetidx].name;
            }
            else {
                CCname = _mercentCC[_mtable[targetidx]].name;
            }
            if(CCname !== "") {
                targetIdxList.push(i);
            }
        }
        if(targetIdxList.length === 0) {
            return rtnObj;
        }
        rtnObj.targetidx = targetIdxList[libCommon.Rand(0,targetIdxList.length - 1)];

        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _summon.ability.hp > 1) {
                nhp = _summon.ability.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _summon.ability.mp > 0) {
                nmp = _summon.ability.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _summon.ability.sp > 0) {
                nsp = _summon.ability.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(nhp <= _summon.ability.hp && nmp <= _summon.ability.mp && nsp <= _summon.ability.sp) {
                rtnObj.name = skillinfo.name;
                rtnObj.jude = true;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    //몹 관련
    _JudgMobSkill = function(_userdef, _usercri, _mop, _mophp, _mopmp, _mopsp, _cri) {
        var rtnObj = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
        var tmpskilllist = [];
        var ccinfo = null;
        var nhp, nmp, nsp;
        var skillRand = libCommon.Randfloat(0,100);
        if(Number(_mop.skillrate) <= skillRand) {
            
            return rtnObj;
        }

        for(var i = 0; i < _mop.skill.length; ++i){
            if(db_Manager.getSkill(_mop.skill[i]).type === "damage") {
                tmpskilllist.push(_mop.skill[i]);
            }
        }
        if(tmpskilllist.length === 0) {
            return rtnObj;
        }
        var skillIdx = libCommon.Rand(0,tmpskilllist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpskilllist[skillIdx]);
        var calcCri = 0, calcCriDamage = 0, judgment = 0;

        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _mophp > 1) {
                nhp = _mophp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _mopmp > 0) {
                nmp = _mopmp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _mopsp > 0) {
                nsp = _mopsp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }

            var tmpAbility = _getCurrVitality(skillinfo.kind, _mop.ability, {hp:_mophp, mp:_mopmp, sp:_mopsp});
            var tmpSubAbility = _getCurrVitality(skillinfo.subkind, _mop.ability, {hp:_mophp, mp:_mopmp, sp:_mopsp});

            if(nhp <= _mophp && nmp <= _mopmp && nsp <= _mopsp) {
                rtnObj.damage = _SkillCalcDamage(tmpAbility, tmpSubAbility, skillinfo, _userdef);
                if(rtnObj.damage <= 0)
                    rtnObj.damage = 1;
                rtnObj.name = skillinfo.name;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
                rtnObj.count = Number(skillinfo.count);
                rtnObj.skillkind = skillinfo.kind;
                rtnObj.skillsubkind = skillinfo.subkind;
                rtnObj.skilleffect = skillinfo.effect;
                ccinfo = _JudgCC(skillinfo.cc);
                if(ccinfo.continue !== 0) {
                    rtnObj.cc = ccinfo;
                    rtnObj.comment = "  - 상대에게 상태이상 " + ccinfo.name + "에 걸었습니다.";
                }

                if(skillinfo.iscritical === "T") {
                    calcCri = _CriCalc(_mop.ability.critical, _usercri);
                    if(calcCri > 0) {
                        calcCriDamage = Math.floor(rtnObj.damage * _CriCalcDamage(_mop.ability.critical, _usercri));
                        judgment = libCommon.Randfloat(0,100);
                        if(judgment > calcCri) {
                            _cri.cri = 0;
                        }
                        else {
                            _cri.cri = 1;
                            rtnObj.damage = calcCriDamage;
                        }
                    }
                }
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgMobHealSkill = function(_moblist, _mop, _mophp, _mopmp, _mopsp, _mophplist, _mopretirelist) {
        var rtnObj = {name:"", heal:0, removehp:0, removemp:0, removesp:0, comment:"", range:"single", count:1, targetidx:[]};
        var tmpheallist = [];
        var nhp, nmp, nsp, i, tmpNum;
        var tmpSkill = null, tmplength;
        var skillRand = libCommon.Randfloat(0,100);
        if(Number(_mop.skillrate) <= skillRand) {
            return rtnObj;
        }

        for(i = 0; i < _mop.skill.length; ++i){
            tmpSkill = db_Manager.getSkill(_mop.skill[i]);
            if(tmpSkill.type === "heal" || tmpSkill.type === "revive") {
                tmpheallist.push(_mop.skill[i]);
            }
        }
        if(tmpheallist.length === 0) {
            return rtnObj;
        }
        var skillIdx = libCommon.Rand(0,tmpheallist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpheallist[skillIdx]);
        var healCount = Number(skillinfo.count);

        var targetpercent;
        var targetIdxList = [];
        var untargetIdxList = [];

        if(skillinfo === null) return rtnObj;

        if(skillinfo.type === "heal") {
            for(var h = 0; h < _moblist.length; ++h) {
                targetpercent = Math.floor((_mophplist[h] / Number(_moblist[h].ability.hp)) * 100);
                if(targetpercent <= libConst.MonsterHealSkillRate) {
                    targetIdxList.push(h);
                }
                else {
                    untargetIdxList.push(h);
                }
            }

            tmplength = targetIdxList.length;

            if(tmplength === 0) {
                return rtnObj;
            }
            else if(tmplength > healCount) {
                for(i = 0; i < (tmplength - healCount); ++i) {
                    targetIdxList.splice(libCommon.Rand(0,targetIdxList.length - 1), 1);
                }
            }
            else if(tmplength <= healCount) {
                for(i = 0; i < (healCount - tmplength); ++i) {
                    if(untargetIdxList.length === 0) break;

                    tmpNum = libCommon.Rand(0,untargetIdxList.length - 1);
                    targetIdxList.push(untargetIdxList[tmpNum]);
                    untargetIdxList.splice(tmpNum, 1);
                }
            }
        }
        else if(skillinfo.type === "revive") {
            for(i = 0; i < healCount; ++i) {
                if(_mopretirelist.length === 0) break;

                tmpNum = libCommon.Rand(0,_mopretirelist.length - 1);
                targetIdxList.push(_mopretirelist[tmpNum]);
                _mopretirelist.splice(tmpNum, 1);
            }

            if(targetIdxList.length === 0) {
                return rtnObj;
            }
        }

        rtnObj.targetidx = targetIdxList;

        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _mophp > 1) {
                nhp = _mophp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _mopmp > 0) {
                nmp = _mopmp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _mopsp > 0) {
                nsp = _mopsp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(nhp <= _mophp && nmp <= _mopmp && nsp <= _mopsp) {
                rtnObj.heal = Math.floor(_mop.ability[skillinfo.kind] * libConst.HealSkillIncRate * skillinfo.effect);
                if(rtnObj.heal <= 0)
                    rtnObj.heal = 1;

                rtnObj.name = skillinfo.name;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
                rtnObj.count = healCount;
                rtnObj.type = skillinfo.type;
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgMobCureSkill = function(_mop, _mopCC, _mophp, _mopmp, _mopsp) {
        var rtnObj = {name:"", jude:false, removehp:0, removemp:0, removesp:0, comment:"", range:"single", targetidx:-1};
        var tmpheallist = [];
        var nhp, nmp, nsp;
        for(var i = 0; i < _mop.skill.length; ++i){
            if(db_Manager.getSkill(_mop.skill[i]).type === "remove") {
                tmpheallist.push(_mop.skill[i]);
            }
        }
        if(tmpheallist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpheallist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpheallist[skillIdx]);

        var CCname = "";
        var targetIdxList = [];
        for(var h = 0; h < _mopCC.length; ++h) {
            CCname = _mopCC[h].name;
            if(CCname !== "") {
                targetIdxList.push(h);
            }
        }
        if(targetIdxList.length === 0) {
            return rtnObj;
        }
        rtnObj.targetidx = targetIdxList[libCommon.Rand(0,targetIdxList.length - 1)];

        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _mophp > 1) {
                nhp = _mophp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _mopmp > 0) {
                nmp = _mopmp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _mopsp > 0) {
                nsp = _mopsp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(nhp <= _mophp && nmp <= _mopmp && nsp <= _mopsp) {

                rtnObj.name = skillinfo.name;
                rtnObj.jude = true;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    // 파티 개인 관련
    _JudgHealPartySkill = function(_opt, _user, _usermaxhp, _userlist, _summonlist, _summondb, _ourlist, _retirelist, _cooltime) {
        var rtnObj = {name:"", heal:0, removehp:0, removemp:0, removesp:0, comment:"", range:"single", count:1, targetidx:[]};
        var userAbility = _user.getAbility();
        var rightWeapon = _user.getEquimentInfo("righthand");
        var leftWeapon = _user.getEquimentInfo("lefthand");
        var userOpt = _opt.getHealSkillOpt();

        var skillinfo = null;
        var nhp, nmp, nsp;
        var option = null;
        var healCount = 1;

        var targetpercent;
        var targetidx = -1;
        var tmptargetidx_user = -1;
        var tmptargetidx = -1;
        var targetIdxList = [];
        var untargetIdxList = [];

        var i, j, tmpNum, tmplength, tmpCooltimeidx;

        if(userOpt.length === 0) return rtnObj;

        for(i = 0; i < userOpt.length; ++i) {
            option = userOpt[i];
            if(option === undefined || option === null) {
                continue;
            }

            if(_cooltime[i] === 0) {
                skillinfo = db_Manager.getSkill(option.index);

                if(skillinfo.type === "heal") {
                    for(j = 0; j < _ourlist.length; ++j) {
                        targetidx = _ourlist[j];
                        if(_isSummonMob(targetidx)) {
                            tmptargetidx_user = Number(targetidx.split("|")[0].substring(1));
                            tmptargetidx = Number(targetidx.split("|")[1]);
                            targetpercent = Math.floor((_summonlist[tmptargetidx_user][tmptargetidx].ability.hp / _summondb[tmptargetidx_user][_summonlist[tmptargetidx_user][tmptargetidx].index].ability.hp) * 100);
                        }
                        else {
                            targetpercent = Math.floor((_userlist[targetidx].getAbility().hp / _usermaxhp[targetidx]) * 100);
                        }

                        if(targetpercent <= option.percent) {
                            targetIdxList.push(j);
                        }
                    }
                    if(targetIdxList.length === 0)
                        continue;
                }

                if(skillinfo.type === "revive" && _retirelist.length === 0)
                    continue;

                healCount = Number(skillinfo.count);
                tmpCooltimeidx = i;
                break;
            }
        }

        if(skillinfo === null) return rtnObj;
        
        if(skillinfo.type === "heal") {
            for(i = 0; i < _ourlist.length; ++i) {
                targetidx = _ourlist[i];
                if(_isSummonMob(targetidx)) {
                    tmptargetidx_user = Number(targetidx.split("|")[0].substring(1));
                    tmptargetidx = Number(targetidx.split("|")[1]);
                    targetpercent = Math.floor((_summonlist[tmptargetidx_user][tmptargetidx].ability.hp / _summondb[tmptargetidx_user][_summonlist[tmptargetidx_user][tmptargetidx].index].ability.hp) * 100);
                }
                else {
                    targetpercent = Math.floor((_userlist[targetidx].getAbility().hp / _usermaxhp[targetidx]) * 100);
                }

                if(targetpercent <= option.percent) {
                    targetIdxList.push(i);
                }
                else {
                    untargetIdxList.push(i);
                }
            }

            tmplength = targetIdxList.length;

            if(tmplength === 0) {
                return rtnObj;
            }
            else if(tmplength > healCount) {
                for(i = 0; i < (tmplength - healCount); ++i) {
                    targetIdxList.splice(libCommon.Rand(0,targetIdxList.length - 1), 1);
                }
            }
            else if(tmplength <= healCount) {
                for(i = 0; i < (healCount - tmplength); ++i) {
                    if(untargetIdxList.length === 0) break;

                    tmpNum = libCommon.Rand(0,untargetIdxList.length - 1);
                    targetIdxList.push(untargetIdxList[tmpNum]);
                    untargetIdxList.splice(tmpNum, 1);
                }
            }
        }
        else if(skillinfo.type === "revive") {
            for(i = 0; i < healCount; ++i) {
                if(_retirelist.length === 0) break;

                tmpNum = libCommon.Rand(0,_retirelist.length - 1);
                targetIdxList.push(_retirelist[tmpNum]);
                _retirelist.splice(tmpNum, 1);
            }

            

            if(targetIdxList.length === 0) {
                return rtnObj;
            }
        }

        rtnObj.targetidx = targetIdxList;

        if(skillinfo !== null && rightWeapon !== null) {
            if(skillinfo.needhp === "all" && userAbility.hp > 1) {
                nhp = userAbility.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && userAbility.mp > 0) {
                nmp = userAbility.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && userAbility.sp > 0) {
                nsp = userAbility.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }

            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(skillinfo.weapon === rightWeapon.kind || (leftWeapon !== null && skillinfo.weapon === leftWeapon.kind)) {
                if(nhp < userAbility.hp && nmp <= userAbility.mp && nsp <= userAbility.sp) {
                    rtnObj.heal = Math.floor((userAbility[skillinfo.kind] + (skillinfo.subkind==="none"?0:userAbility[skillinfo.subkind]/2)) * libConst.HealSkillIncRate * skillinfo.effect);
                    if(rtnObj.heal <= 0)
                        rtnObj.heal = 1;

                    rtnObj.name = skillinfo.name;
                    rtnObj.removehp = nhp;
                    rtnObj.removemp = nmp;
                    rtnObj.removesp = nsp;
                    rtnObj.range = skillinfo.range;
                    rtnObj.count = healCount;
                    rtnObj.type = skillinfo.type;
                    _cooltime[tmpCooltimeidx] = Number(skillinfo.time);
                    
                }
                else {
                    rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                }
            }
            else {
                rtnObj.comment = "  - 무기 타입이 달라서 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgCurePartySkill = function(_opt, _user, _userlist, _userCC, _summonCC, _ourlist) {
        var rtnObj = {name:"", jude:false, removehp:0, removemp:0, removesp:0, comment:"", range:"single", targetidx:-1};
        var userAbility = _user.getAbility();
        var rightWeapon = _user.getEquimentInfo("righthand");
        var leftWeapon = _user.getEquimentInfo("lefthand");
        var userOpt = _opt.getCureSkillOpt();
        var skillinfo;
        var nhp, nmp, nsp;

        var CCname = "";
        var targetidx = -1;
        var tmptargetidx = -1;
        var tmptargetidx_user = -1;
        var targetIdxList = [];

        if(userOpt === "") {
            return rtnObj;
        }
        for(var i = 0; i < _ourlist.length; ++i) {
            targetidx = _ourlist[i];
            CCname = "";
            if(_isSummonMob(targetidx)) {
                tmptargetidx_user = Number(targetidx.split("|")[0].substring(1));
                tmptargetidx = Number(targetidx.split("|")[1]);
                CCname = _summonCC[tmptargetidx_user][tmptargetidx].name;
            }
            else {
                CCname = _userCC[targetidx].name;
            }

            if(CCname !== "") {
                targetIdxList.push(i);
            }
        }
        if(targetIdxList.length === 0) {
            return rtnObj;
        }
        rtnObj.targetidx = targetIdxList[libCommon.Rand(0,targetIdxList.length - 1)];

        skillinfo = db_Manager.getSkill(userOpt);
        if(skillinfo !== null && rightWeapon !== null) {
            if(skillinfo.needhp === "all" && userAbility.hp > 1) {
                nhp = userAbility.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && userAbility.mp > 0) {
                nmp = userAbility.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && userAbility.sp > 0) {
                nsp = userAbility.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }

            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(skillinfo.weapon === rightWeapon.kind || (leftWeapon !== null && skillinfo.weapon === leftWeapon.kind)) {
                if(nhp < userAbility.hp && nmp <= userAbility.mp && nsp <= userAbility.sp) {

                    rtnObj.name = skillinfo.name;
                    rtnObj.jude = true;
                    rtnObj.removehp = nhp;
                    rtnObj.removemp = nmp;
                    rtnObj.removesp = nsp;
                    rtnObj.range = skillinfo.range;
                }
                else {
                    rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                }
            }
            else {
                rtnObj.comment = "  - 무기 타입이 달라서 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        
        return rtnObj;
    };
    _JudgPartyDrop = function(_index, _name, _itemlist, _rune, _exp, _recordItemList, _recordrune) {
        var item, rune;
        var rtnstr = "";
        var judgment, obj, i, j, resultflag, allIdx;
        var event_DropItemRate = EventManager.getDropItemRate();
        var event_DropRuneRate = EventManager.getDropRuneRate();
        var event_TargetItem = EventManager.getEvent(EventManager.TARGETEVENT);

        if(event_DropItemRate > 0) {
            rtnstr += "  - (이벤트) 아이템 드랍률이 " + (event_DropItemRate+1) + "배 상승합니다.\n";
        }
        if(event_DropRuneRate > 0) {
            rtnstr += "  - (이벤트) 룬 획득이 " + (event_DropRuneRate+1) + "배 상승합니다.\n";
        }

        for(i = 0; i < _itemlist.length; ++i) {
            item = _itemlist[i];
            judgment = libCommon.Randfloat(0,100);
            if(judgment <= (Number(item.droprate) * (1 + event_DropItemRate))) {
                rtnstr += "  - " + db_Manager.getSundryItem(item.itemIdx).name + "을(를) 획득하였습니다.\n";
                _recordItemList.push({kind : libConst.ITEM_KIND["SUNDRYITEM"], index : item.itemIdx, count : item.count, strength : 0});
            }
        }
        rune = Math.floor(libCommon.Rand(Number(_rune.split("~")[0]) ,Number(_rune.split("~")[1])) * (1 + event_DropRuneRate));
        rtnstr += "  - " + rune + "Rune을 획득하였습니다.\n";
            
        _recordrune.rune += rune;

        for(j = 0; j < event_TargetItem.length; ++j) {
            obj = event_TargetItem[j];

            if(obj.onoff) {
                resultflag = false;
                allIdx = -1;
                for(i = 0; i < obj.moblist.length; ++i) {
                    if(obj.moblist[i].index === _index) {
                        resultflag = true;
                        judgment = libCommon.Randfloat(0,100);
                        if(judgment <= Number(obj.moblist[i].rate)) {
                            rtnstr += "  - (이벤트) " + db_Manager.getItem(obj.item.kind, obj.item.index).name + (obj.item.strength==="0"?"":("+" + obj.item.strength)) + "을(를) " + obj.item.count + "개 획득하였습니다.\n";
                            _recordItemList.push({kind : obj.item.kind, index : obj.item.index, count : obj.item.count, strength : Number(obj.item.strength)});
                        }
                    }

                    if(obj.moblist[i].index === "all") {
                        allIdx = i;
                    }
                }

                if(allIdx !== -1 && !resultflag) {
                    judgment = libCommon.Randfloat(0,100);
                    if(judgment <= Number(obj.moblist[allIdx].rate)) {
                        rtnstr += "  - (이벤트) " + db_Manager.getItem(obj.item.kind, obj.item.index).name + (obj.item.strength==="0"?"":("+" + obj.item.strength)) + "을(를) " + obj.item.count + "개 획득하였습니다.\n";
                        _recordItemList.push({kind : obj.item.kind, index : obj.item.index, count : obj.item.count, strength : Number(obj.item.strength)});
                    }
                }
            }
        }

        return rtnstr;
    };
    // 파티 소환수 관련
    _JudgSmnHealPartySkill = function(_summon, _targetdb, _userlist, _usersmaxhp, _summonlist, _summondb, _ourlist) { 
        var rtnObj = {name:"", heal:0, removehp:0, removemp:0, removesp:0, comment:"", range:"single", targetidx:-1};
        var summonDB = _targetdb;
        var tmpheallist = [], i;
        var nhp, nmp, nsp;
        for(i = 0; i < summonDB.skill.length; ++i){
            if(db_Manager.getSkill(summonDB.skill[i]).type === "heal") {
                tmpheallist.push(summonDB.skill[i]);
            }
        }
        if(tmpheallist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpheallist.length - 1);
        var skillinfo;

        var targetpercent;
        var targetidx = -1;
        var tmptargetidx_user = -1;
        var tmptargetidx = -1;
        var targetIdxList = [];

        for(i = 0; i < _ourlist.length; ++i) {
            targetidx = _ourlist[i];
            if(_isSummonMob(targetidx)) {
                tmptargetidx_user = Number(targetidx.split("|")[0].substring(1));
                tmptargetidx = Number(targetidx.split("|")[1]);

                targetpercent = Math.floor((_summonlist[tmptargetidx_user][tmptargetidx].ability.hp / _summondb[tmptargetidx_user][_summonlist[tmptargetidx_user][tmptargetidx].index].ability.hp) * 100);
            }
            else {
                targetpercent = Math.floor((_userlist[targetidx].getAbility().hp / _usersmaxhp[targetidx]) * 100);
            }
            if(targetpercent <= 60) {
                targetIdxList.push(i);
            }
        }
        if(targetIdxList.length === 0) {
            return rtnObj;
        }
        rtnObj.targetidx = targetIdxList[libCommon.Rand(0,targetIdxList.length - 1)];

        skillinfo = db_Manager.getSkill(tmpheallist[skillIdx]);
        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _summon.ability.hp > 1) {
                nhp = _summon.ability.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _summon.ability.mp > 0) {
                nmp = _summon.ability.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _summon.ability.sp > 0) {
                nsp = _summon.ability.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(nhp <= _summon.ability.hp && nmp <= _summon.ability.mp && nsp <= _summon.ability.sp) {
                rtnObj.heal = Math.floor(summonDB.ability[skillinfo.kind] * libConst.HealSkillIncRate * skillinfo.effect);
                if(rtnObj.heal <= 0)
                    rtnObj.heal = 1;

                rtnObj.name = skillinfo.name;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };
    _JudgSmnCurePartySkill = function(_summon,  _targetdb, _userCC, _summonCC, _summondb, _ourlist) {
        var rtnObj = {name:"", jude:false, removehp:0, removemp:0, removesp:0, comment:"", range:"single", targetidx:-1};
        var summonDB = _targetdb;
        var tmpheallist = [], i;
        var nhp, nmp, nsp;
        for(i = 0; i < summonDB.skill.length; ++i){
            if(db_Manager.getSkill(summonDB.skill[i]).type === "remove") {
                tmpheallist.push(summonDB.skill[i]);
            }
        }
        if(tmpheallist.length === 0) {
            return rtnObj;
        }

        var skillIdx = libCommon.Rand(0,tmpheallist.length - 1);
        var skillinfo = db_Manager.getSkill(tmpheallist[skillIdx]);

        var CCname = "";
        var targetidx = -1;
        var tmptargetidx = -1;
        var tmptargetidx_user = -1;
        var targetIdxList = [];

        for(i = 0; i < _ourlist.length; ++i) {
            targetidx = _ourlist[i];
            CCname = "";
            if(_isSummonMob(targetidx)) {
                tmptargetidx_user = Number(targetidx.split("|")[0].substring(1));
                tmptargetidx = Number(targetidx.split("|")[1]);
                CCname = _summonCC[tmptargetidx_user][tmptargetidx].name;
            }
            else {
                CCname = _userCC[targetidx].name;
            }
            if(CCname !== "") {
                targetIdxList.push(i);
            }
        }
        if(targetIdxList.length === 0) {
            return rtnObj;
        }
        rtnObj.targetidx = targetIdxList[libCommon.Rand(0,targetIdxList.length - 1)];

        if(skillinfo !== null) {
            if(skillinfo.needhp === "all" && _summon.ability.hp > 1) {
                nhp = _summon.ability.hp - 1;
            }
            else {
                nhp = skillinfo.needhp;
            }
            if(skillinfo.needmp === "all" && _summon.ability.mp > 0) {
                nmp = _summon.ability.mp;
            }
            else {
                nmp = skillinfo.needmp;
            }
            if(skillinfo.needsp === "all" && _summon.ability.sp > 0) {
                nsp = _summon.ability.sp;
            }
            else {
                nsp = skillinfo.needsp;
            }
    
            if(nhp === "all" || nmp === "all" || nsp === "all") {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
                return rtnObj;
            }
            if(nhp <= _summon.ability.hp && nmp <= _summon.ability.mp && nsp <= _summon.ability.sp) {
                rtnObj.name = skillinfo.name;
                rtnObj.jude = true;
                rtnObj.removehp = nhp;
                rtnObj.removemp = nmp;
                rtnObj.removesp = nsp;
                rtnObj.range = skillinfo.range;
            }
            else {
                rtnObj.comment = "  - 체력 또는 마력 또는 기력이 부족하여 " + skillinfo.name + "을(를) 사용할 수 없습니다.";
            }
        }
        return rtnObj;
    };

    //기타 관련
    _JudgCC = function(_ccidx) {
        var rtnobj = {name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0};
        var ccinfo = db_Manager.getCC(_ccidx);
        var judgment = libCommon.Randfloat(0,100);
        if(ccinfo !== null) {
            if(judgment <= (Number(ccinfo.hit) * 100)) {
                rtnobj.name = ccinfo.name;
                rtnobj.damage = Number(ccinfo.damage);
                rtnobj.effect = ccinfo.effect;
                rtnobj.continue = Number(ccinfo.continue);
                rtnobj.deathcount = Number(ccinfo.continue);
                if(ccinfo.effect.indexOf("slow") !== -1)
                    rtnobj.slowrate = Number(ccinfo.slowrate);
            }
        }
        return rtnobj;
    };
    _JudgPotion = function(_targetpos, _opt, _user, _usermaxhp, _usermaxmp, _usermaxsp, _usermaxdp) {
        var potionOpt;
        var targetpercent;
        switch(_targetpos) {
            case "hp":
                if(!_user.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, _opt.getpotionOpt().hp.index))
                    return false;

                targetpercent = Math.floor((_user.getAbility().hp / _usermaxhp) * 100);
                potionOpt = _opt.getpotionOpt().hp;
                break;
            case "mp":
                if(!_user.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, _opt.getpotionOpt().mp.index))
                    return false;

                targetpercent = Math.floor((_user.getAbility().mp / _usermaxmp) * 100);
                potionOpt = _opt.getpotionOpt().mp;
                break;
            case "sp":
                if(!_user.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, _opt.getpotionOpt().sp.index))
                    return false;

                targetpercent = Math.floor((_user.getAbility().sp / _usermaxsp) * 100);
                potionOpt = _opt.getpotionOpt().sp;
                break;
            case "dp":
                if(!_user.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, _opt.getpotionOpt().dp.index))
                    return false;

                targetpercent = Math.floor((_user.getAbility().dp / _usermaxdp) * 100);
                potionOpt = _opt.getpotionOpt().dp;
                break;
        }

        if(targetpercent <= potionOpt.percent)
            return true;

        return false;
    };
    _JudgQuestCount = function(_targetMobIdx, _user) {
        var questlist = _user.getCurrQuest();
        var tmpquest;

        for(var i = 0; i < questlist.length; ++i) {
            tmpquest = questlist[i];
            if(_targetMobIdx === tmpquest.monsteridx) {
                _user.addQuestMob(tmpquest.index);
                break;
            }
        }
    };
    _getOurAbility = function(_index, _user, _mercentlist, _summonlist, _summondb, _isparty) {
        if(_isparty) {
            if(_isSummonMob(_index)) {
                var cureUserSummon = Number(_index.split("|")[0].substring(1));
                var cureSummon = Number(_index.split("|")[1]);
                return _summondb[cureUserSummon][_summonlist[cureUserSummon][cureSummon].index].ability;
            }
            else {
                return _user[_index].getAbility();
            }
        }
        else {
            if(_index === -1) {
                return _user.getAbility();
            }
            else if(_isSummonMob(_index)) {
                var idx = Number(_index.substring(1));
                return _summondb[_summonlist[idx].index].ability;
            }
            else {
                return db_Manager.getMercenary(_mercentlist[_index].index).ability;
            }
        }
    };
    _getPoint = function(_index, _ptname, _user, _mercentlist, _summonlist, _isparty) {
        if(_isparty) {
            if(_isSummonMob(_index)) {
                var cureUserSummon = Number(_index.split("|")[0].substring(1));
                var cureSummon = Number(_index.split("|")[1]);
                return _summonlist[cureUserSummon][cureSummon].ability[_ptname];
            }
            else {
                return _user[_index].getAbility()[_ptname];
            }
        }
        else {
            if(_index === -1) {
                return _user.getAbility()[_ptname];
            }
            else if(_isSummonMob(_index)) {
                var idx = Number(_index.substring(1));
                return _summonlist[idx].ability[_ptname];
            }
            else {
                return _mercentlist[_index][_ptname];
            }
        }
    };
    _setPoint = function(_index, _ptname, _value, _user, _mercentlist, _summonlist, _isparty) {
        if(_isparty) {
            if(_isSummonMob(_index)) {
                var cureUserSummon = Number(_index.split("|")[0].substring(1));
                var cureSummon = Number(_index.split("|")[1]);
                _summonlist[cureUserSummon][cureSummon].ability[_ptname] += _value;
                if(_summonlist[cureUserSummon][cureSummon].ability[_ptname] < 0)
                    _summonlist[cureUserSummon][cureSummon].ability[_ptname] = 0;
            }
            else {
                _user[_index].getAbility()[_ptname] += _value;
                if(_user[_index].getAbility()[_ptname] < 0)
                    _user[_index].getAbility()[_ptname] = 0;
            }
        }
        else {
            if(_index === -1) {
                _user.getAbility()[_ptname] += _value;
                if(_user.getAbility()[_ptname] < 0)
                    _user.getAbility()[_ptname] = 0;
            }
            else if(_isSummonMob(_index)) {
                var idx = Number(_index.substring(1));
                _summonlist[idx].ability[_ptname] += _value;
                if(_summonlist[idx].ability[_ptname] < 0)
                    _summonlist[idx].ability[_ptname] = 0;
            }
            else {
                _mercentlist[_index][_ptname] += _value;
                if(_mercentlist[_index][_ptname] < 0)
                    _mercentlist[_index][_ptname] = 0;
            }
        }
    };

    _AvoidCalc = function(_acc, _avoid) {
        var acc = Number(_acc);
        var avd = Number(_avoid);
        return ((avd - acc) / (avd + (acc / 2) + RateWeight)) * 100;
    };
    _CriCalc = function(_mycri, _enermycri) {
        var m_cri = Number(_mycri);
        var e_cri = Number(_enermycri);
        return ((m_cri - e_cri) / (m_cri + (e_cri / 2) + RateWeight)) * 100;
    };
    _CriCalcDamage = function(_mycri, _enermycri) {
        var m_cri = Number(_mycri);
        var e_cri = Number(_enermycri);
        var data = ((m_cri - e_cri) * IncCriMaxDmg) / (m_cri + (e_cri / 2) + RateWeight);
        return (data < 0 ? CriticalRate : (data + CriticalRate));
    };
    _AttCalcDamage = function(_attack, _enermydef) {
        var att = Number(_attack);
        var def = Number(_enermydef);
        if(att === 0 && def === 0) {
            return 0;
        }
        else {
            return Math.floor(att * (att - def) / (att + def));
        }
    };
    _SkillCalcDamage = function(_attack, _subattack, _skillinfo, _enermydef){
        var attack = Number(_attack);
        var defense = Number(_enermydef);
        var coefficient = Number(_skillinfo.effect);
        var fullattack = attack + ((_subattack === undefined || _subattack === null)?0:Math.floor(Number(_subattack) / 2));
        if(_skillinfo.kind === "magic")
            return Math.floor(_AttCalcDamage(fullattack, defense/2) * coefficient);
        else
            return Math.floor(_AttCalcDamage(fullattack, defense) * coefficient);
    };
    _AuraCalc = function(_kind, _origindata, _auralist) {
        var rtnValue = Number(_origindata);
        var aura = null;
        var totalPlus = 0;
        var totalPercent = 0, changePercent = 0;
        var k = _kind;

        if(k.length === 1) {
            switch(k) {
                case "a":
                    k = "attack";
                    break;
                case "c":
                    k = "critical";
                    break;
                case "v":
                    k = "avoid";
                    break;
                case "d":
                    k = "defense";
                    break;
                case "r":
                    k = "accuracy";
                    break;
                case "s":
                    k = "atkspeed";
                    break;
                case "m":
                    k = "magic";
                    break;
            }
        }

        if(k === "none") {
            return null;
        }
        
        if(_auralist !== undefined && _auralist !== null) {
            for(var i = 0; i < _auralist.length; ++i) {
                aura = _auralist[i];
                if(!aura.useYN) continue;
    
                if(aura.kind === k) {
                    if(aura.type === "PLUS") {
                        totalPlus += Number(aura.value);
                    }
                    else if(aura.type === "PERCENT") {
                        totalPercent += Number(aura.value);
                    }
                }
            }
    
            if(totalPercent > 0) {
                changePercent = Math.floor(Number(_origindata) * (totalPercent / 100));
            }
    
            rtnValue += (totalPlus + changePercent);
        }
        return rtnValue;
    };
    _getCurrVitality = function(_skillkind, _ability, _vitality) {
        var rtnValue = null;

        if(_skillkind === "hp" || _skillkind === "mp" || _skillkind === "sp") {
            rtnValue = _vitality[_skillkind];
        }
        else {
            rtnValue = _ability[_skillkind];
        }
        return rtnValue;
    };

    _RemoveCC = function(_cc, _effect) {
        if(_cc !== null) {
            _cc.name = "";
            _cc.damage = 0;
            _cc.effect = "";
            _cc.continue = 0;
            _cc.provo = Not_ProvoTarget;
            _cc.slowrate = 0;
            _cc.deathcount = 0;
        }
        if(_effect !== null) {
            _effect.n_att = false;
            _effect.n_skl = false;
            _effect.n_pot = false;
            _effect.n_avd = false;
            _effect.n_prv = false;
            _effect.n_slw = false;
            _effect.n_dth = false;
        }
    };
    _MaxAttSpdCounter = function(_currspd,_atkspd) {
        return (_currspd >= Number(_atkspd)?_currspd:Number(_atkspd));
    };
    _isSummonMob = function(_ouridx) {
        return isNaN(_ouridx);
    };
    _addRecordMob = function(_array, _mobidx, _count) {
        var targetidx = -1;
        for(var i = 0; i < _array.length; ++i) {
            if(_array[i].index === _mobidx) {
                targetidx = i;
                break;
            }
        }

        if(targetidx === -1) {
            _array.push({index:_mobidx, count:_count});
        }
        else {
            _array[i].count += _count;
        }
    };
    return {
        Start:function(_user, _count, _option, _mercentlist, _MercenaryManager, _ranking, _needap) {
            return _Start(_user, _count, _option, null, null, _mercentlist, _MercenaryManager, "" + _ranking, Number(_needap));
        },
        Boss:function(_user, _count, _option, _summonitem, _boss, _mercentlist, _MercenaryManager, _ranking, _needap) {
            return _Start(_user, _count, _option, _summonitem, _boss, _mercentlist, _MercenaryManager, "" + _ranking, Number(_needap));
        },
        WorldBoss:function(_user, _option, _wbstatus, _mercentlist, _MercenaryManager, _ranking){
            return _StartWorldBoss(_user, _option, _wbstatus, _mercentlist, _MercenaryManager, "" + _ranking);
        },
        Tower:function(_user, _option, _mercentlist, _MercenaryManager, _ranking, _result) {
            return _Tower(_user, _option, _mercentlist, _MercenaryManager, "" + _ranking, _result);
        },
        Dungeon:function(_userlist, _optionlist, _map, _captain, _isoccupy, _result) {
            return _Dungeon(_userlist, _optionlist, _map, _captain, _isoccupy, _result);
        }
    };
}
