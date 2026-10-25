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
const libObject = Bridge.getScopeOf("Object.js"); // 일반 function Lib

var db_Manager = Bridge.getScopeOf("DataBase.js").DBManager(); // 데이터 담당 객체

function BattleManager(_recordManager) {
    const CriticalRate = libConst.CriticalDamageRate;
    const IncCriMaxDmg = libConst.IncCriticalMaxDamage;
    const RateWeight = libConst.RateWeight;

    const Not_ProvoTarget = -9999;
    const DRAW = 0;
    const WIN = 1;
    const LOST = 2;

    var RecordManager = _recordManager;
    var RankingList = [];
    var AttMaxSpd;

    var _LoadData, _Find, _FindforRank, _Delete, _MakeJson, _Save, _BattleStart, _BattleUser, _BattleSummon;
    var _JudgSkill, _JudbSmnSkill, _JudgCC, _JudgAttack, _JudgAvoid, _MaxAttSpdCounter;
    var _AvoidCalc, _CriCalc, _CriCalcDamage, _AttCalcDamage, _SkillCalcDamage, _RemoveCC;
    var _JudgSummonSkill, _SetSummonMonster, _SelectTarget, _FindTarget;
    var _GetFunc, _SetFunc, _SelectPoint;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["RankingList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            RankingList.push(libObject.clsBattleObj(tmpList[idx]));
        }
    }();
    _Find = function(_id) {
        for (var i = 0; i < RankingList.length; ++i) {
           if (RankingList[i].name === _id) {
              return RankingList[i];
           }
        }
        return null;
    };
    _FindforRank = function(_rank) {
        for (var i = 0; i < RankingList.length; ++i) {
           if (RankingList[i].getRank() === _rank) {
              return RankingList[i];
           }
        }
        return null;
    };
    _Delete = function(_id) {
        var rankinfo = _Find(_id), i;
        if(rankinfo === null)
            return;

        for (i = 0; i < RankingList.length; ++i) {
           if (RankingList[i].getRank() > rankinfo.getRank()) {
              RankingList[i].setRank(RankingList[i].getRank() - 1);
           }
        }

        for (i = 0; i < RankingList.length; ++i) {
           if (RankingList[i].name === _id) {
              RankingList.splice(i,1);
              break;
           }
        }
        _Save();
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < RankingList.length; ++i) {
            jsonArray.push(RankingList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Ranking", function() {
                libCommon.write(libConst.fileNameList["RankingList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["RankingList"], _MakeJson());
        }
    };

    _BattleStart = function(_mine, _match, mine_opt, match_opt) {
        var rtnStr = "", i, s, turnCnt = 0, result = DRAW, refParam = {text:""};
        var m_attspdCounter = 0,
            m_attspd = _mine.getAbility().atkspeed,
            m_CC = {name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0},
            m_Effect = {n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false},
            m_Point = {hp:_mine.getMaxPoint("hp"), mp:_mine.getMaxPoint("mp"), sp:_mine.getMaxPoint("sp"), dp:_mine.getMaxPoint("dp")},
            m_MaxHp = m_Point.hp,
            m_cooltime = [],
            m_summonDB = [],
            m_smnArray = {
                smnList:[],
                smnAttspdCounter:[],
                smnAttspd:[],
                smnCC:[],
                smnEffect:[]
            };


        var u_attspdCounter = 0,
            u_attspd = _match.getAbility().atkspeed,
            u_CC = {name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0},
            u_Effect = {n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false},
            u_Point = {hp:_match.getMaxPoint("hp"), mp:_match.getMaxPoint("mp"), sp:_match.getMaxPoint("sp"), dp:_mine.getMaxPoint("dp")},
            u_MaxHp = u_Point.hp,
            u_cooltime = [],
            u_summonDB = [],
            u_smnArray = {
                smnList:[],
                smnAttspdCounter:[],
                smnAttspd:[],
                smnCC:[],
                smnEffect:[]
            };
        
        var tmpSmnMob; 

        var w_rank, l_rank, tmpRank, target;

        AttMaxSpd = libConst.MinAttackSpeedCounter;

        for(i = 0; i <= libConst.SkillSpace; ++i) {
            m_cooltime[i] = 0;
            u_cooltime[i] = 0;
        }

        AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, _mine.getAbility().atkspeed);
        AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, _match.getAbility().atkspeed);

        m_summonDB = _SetSummonMonster(_mine, mine_opt);
        for(i = 0; i < m_summonDB.length; ++i) {
            AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, m_summonDB[i].ability.atkspeed);
        }
        u_summonDB = _SetSummonMonster(_match, match_opt);
        for(i = 0; i < u_summonDB.length; ++i) {
            AttMaxSpd = _MaxAttSpdCounter(AttMaxSpd, u_summonDB[i].ability.atkspeed);
        }

        AttMaxSpd *= libConst.MaxAttackSpeedRate;
        m_attspdCounter = AttMaxSpd;
        u_attspdCounter = AttMaxSpd;

        rtnStr += "[매치 시작 - " + _mine.name + " VS "+ _match.name + "]\n\n";
        while(true) {
            if(turnCnt === libConst.BattleCount) {
                break;
            }
            m_attspdCounter -= (m_attspd - Math.floor(m_attspd * m_CC.slowrate));
            if(m_attspdCounter <= 0) {
                m_attspdCounter = AttMaxSpd + m_attspdCounter;
                refParam = {text:""};
                rtnStr += "(" + _mine.name + "턴 시작)\n";
                turnCnt++;

                for(i = 0; i < m_cooltime.length; ++i) {
                    if(m_cooltime[i] > 0) {
                        m_cooltime[i]--;
                    }
                }

                target = _SelectTarget(u_smnArray.smnList);
                result = _BattleUser(_mine, m_CC, m_Effect, m_Point, m_MaxHp, mine_opt, m_summonDB, m_smnArray, m_cooltime, _match, u_CC, u_Point, u_MaxHp, u_Effect, u_summonDB, u_smnArray, target, refParam);
                rtnStr += refParam.text;

                if(result !== DRAW) {
                    if(result === WIN) {
                        w_rank = _Find(_mine.name);
                        l_rank = _Find(_match.name);

                        tmpRank = w_rank.getRank();
                        w_rank.setRank(l_rank.getRank());
                        l_rank.setRank(tmpRank);

                        RecordManager.rcdPVP(_mine.name, true);
                    }
                    else {
                        w_rank = _Find(_match.name);
                        l_rank = _Find(_mine.name);

                        RecordManager.rcdPVP(_mine.name, false);
                    }

                    break;
                }
            }

            u_attspdCounter -= (u_attspd - Math.floor(u_attspd * u_CC.slowrate));
            if(u_attspdCounter <= 0) {
                u_attspdCounter = AttMaxSpd + u_attspdCounter;
                refParam = {text:""};
                rtnStr += "(" + _match.name + "턴 시작)\n";
                turnCnt++;

                for(i = 0; i < u_cooltime.length; ++i) {
                    if(u_cooltime[i] > 0) {
                        u_cooltime[i]--;
                    }
                }

                target = _SelectTarget(m_smnArray.smnList);
                result = _BattleUser(_match, u_CC, u_Effect, u_Point, u_MaxHp, match_opt, u_summonDB, u_smnArray, u_cooltime, _mine, m_CC, m_Point, m_MaxHp, m_Effect, m_summonDB, m_smnArray, target, refParam);
                rtnStr += refParam.text;

                if(result !== DRAW) {
                    if(result === WIN) {
                        w_rank = _Find(_match.name);
                        l_rank = _Find(_mine.name);

                        RecordManager.rcdPVP(_mine.name, false);
                    }
                    else {
                        w_rank = _Find(_mine.name);
                        l_rank = _Find(_match.name);

                        tmpRank = w_rank.getRank();
                        w_rank.setRank(l_rank.getRank());
                        l_rank.setRank(tmpRank);

                        RecordManager.rcdPVP(_mine.name, true);
                    }
                    break;
                }
            }
            for(s = 0; s < m_smnArray.smnList.length; ++s) {
                tmpSmnMob = m_smnArray.smnList[s];
                if(tmpSmnMob.ability.hp <= 0) {
                    continue;
                }
                m_smnArray.smnAttspdCounter[s] -= (m_smnArray.smnAttspd[s] - Math.floor(m_smnArray.smnAttspd[s] * m_smnArray.smnCC[s].slowrate));
                if(m_smnArray.smnAttspdCounter[s] <= 0) {
                    m_smnArray.smnAttspdCounter[s] = AttMaxSpd + m_smnArray.smnAttspdCounter[s];
                    refParam = {text:""};
                    rtnStr += "(" + tmpSmnMob.mobname + "턴 시작)\n";
                    turnCnt++;

                    target = _SelectTarget(u_smnArray.smnList);
                    result = _BattleSummon(m_summonDB, m_smnArray, s, _match, u_CC, u_Point, u_MaxHp, u_Effect, u_summonDB, u_smnArray, target, refParam);
                    rtnStr += refParam.text;

                    if(result !== DRAW) {
                        if(result === WIN) {
                            w_rank = _Find(_mine.name);
                            l_rank = _Find(_match.name);
    
                            tmpRank = w_rank.getRank();
                            w_rank.setRank(l_rank.getRank());
                            l_rank.setRank(tmpRank);
    
                            RecordManager.rcdPVP(_mine.name, true);
                        }
                        else {
                            w_rank = _Find(_match.name);
                            l_rank = _Find(_mine.name);
    
                            RecordManager.rcdPVP(_mine.name, false);
                        }
    
                        break;
                    }
                }
            }
            if(result !== DRAW) {
                break;
            }
            for(s = 0; s < u_smnArray.smnList.length; ++s) {
                tmpSmnMob = u_smnArray.smnList[s];
                if(tmpSmnMob.ability.hp <= 0) {
                    continue;
                }
                u_smnArray.smnAttspdCounter[s] -= (u_smnArray.smnAttspd[s] - Math.floor(u_smnArray.smnAttspd[s] * u_smnArray.smnCC[s].slowrate));
                if(u_smnArray.smnAttspdCounter[s] <= 0) {
                    u_smnArray.smnAttspdCounter[s] = AttMaxSpd + u_smnArray.smnAttspdCounter[s];
                    refParam = {text:""};
                    rtnStr += "(" + tmpSmnMob.mobname + "턴 시작)\n";
                    turnCnt++;

                    target = _SelectTarget(m_smnArray.smnList);
                    result = _BattleSummon(u_summonDB, u_smnArray, s, _mine, m_CC, m_Point, m_MaxHp, m_Effect, m_summonDB, m_smnArray, target, refParam);
                    rtnStr += refParam.text;

                    if(result !== DRAW) {
                        if(result === WIN) {
                            w_rank = _Find(_match.name);
                            l_rank = _Find(_mine.name);
    
                            RecordManager.rcdPVP(_mine.name, false);
                        }
                        else {
                            w_rank = _Find(_mine.name);
                            l_rank = _Find(_match.name);
    
                            tmpRank = w_rank.getRank();
                            w_rank.setRank(l_rank.getRank());
                            l_rank.setRank(tmpRank);
    
                            RecordManager.rcdPVP(_mine.name, true);
                        }
                        break;
                    }
                }
            }
            if(result !== DRAW) {
                break;
            }
        }
        rtnStr += "\n";
        if(result === DRAW) {
            rtnStr += "승부를 보지 못했습니다.\n";
            w_rank = _Find(_mine.name);
            l_rank = _Find(_match.name);

            w_rank.incScoreDraw();
            l_rank.incScoreDraw();

            w_rank.addRecord(l_rank.name, "Draw");
            l_rank.addRecord(w_rank.name, "Draw");
        }
        else {
            rtnStr += "승리자 : " + w_rank.name + "\n";
            w_rank.incScoreWin();
            l_rank.incScoreLost();

            w_rank.addRecord(l_rank.name, "Win");
            l_rank.addRecord(w_rank.name, "Lost");
        }

        return rtnStr;
    };

    _BattleUser = function(Attker, attCC, attEffect, attPoint, attMaxhp, AttOpt, attSummonDB, attSmnArray, attCooltime, Defder, defCC, defPoint, defMaxhp, defEffect, defSummonDB, defSmnArray, defIdx, refParam) {
        var tmpHp, tmpCc, tmpCri, tmpSkill, tmpDamage, tmpDthCnt, effectlist;
        var tmpSummonSkill, tmpTargetList = [], tmpTarget;
        var selMob = defIdx;
        var i;

        if(attCC.continue !== 0) {
            if(attCC.damage !== 0) {
                tmpHp = attPoint.hp;
                tmpCc = Math.floor(attMaxhp * attCC.damage);
                attPoint.hp -= tmpCc;
                if(attPoint.hp < 0)
                    attPoint.hp = 0;

                refParam.text += "  - " + attCC.name + "의 효과로 " + tmpCc + " 데미지 발생\n";
                refParam.text += "  - " + Attker.name + "의 Hp가 " + tmpHp + " -> " + attPoint.hp + "로 줄어듬\n";

                if(attPoint.hp === 0)
                {
                    refParam.text += "  - " + Attker.name + "이(가) 정신을 잃었습니다\n";
                    return LOST;
                }
            }

            if(attCC.provo !== Not_ProvoTarget) {
                refParam.text += "  - " + attCC.name + "의 효과로 " + _GetFunc.Name(attCC.provo, Defder, defSmnArray.smnList) + "을(를) 타겟팅합니다.\n";
                selMob = attCC.provo;
            }

            _RemoveCC(null, attEffect);
            if(attCC.effect !== ""){
                effectlist = attCC.effect.split(";");
                for(i = 0; i < effectlist.length; ++i) {
                    if(effectlist[i] === "attack") {attEffect.n_att = true;}
                    if(effectlist[i] === "skill") {attEffect.n_skl = true;}
                    if(effectlist[i] === "potion") {attEffect.n_pot = true;}
                    if(effectlist[i] === "avoid") {attEffect.n_avd = true;}
                    if(effectlist[i] === "provo") {attEffect.n_prv = true;}
                    if(effectlist[i] === "slow") {attEffect.n_slw = true;}
                    if(effectlist[i] === "dth") {attEffect.n_dth = true;}
                }
            }
            attCC.continue--;

            if(attEffect.n_dth) {
                attCC.deathcount--;
                if(attCC.deathcount === 0) {
                    refParam.text += "  - " + attCC.name + "의 효과로 " + Attker.name + "는 즉사 합니다.\n";
                    return LOST;
                }
                else {
                    refParam.text += "  - " + attCC.name + " 효과의 남은 카운터 : " + attCC.deathcount + "\n";
                }
            }
        }
        else {
            _RemoveCC(attCC, attEffect);
        }

        if(attEffect.n_skl) {
            refParam.text += "  - " + attCC.name + "의 효과로 소환 스킬을 사용할 수 없습니다.\n";
            tmpSummonSkill = {jude:false};
        }
        else {
            tmpSummonSkill = _JudgSummonSkill(attSummonDB, attSmnArray.smnList, Attker, attPoint);
            if(tmpSummonSkill.comment !== "") {
                refParam.text += tmpSummonSkill.comment + "\n";
            }
        }

        if(tmpSummonSkill.jude) {
            attPoint.dp -= tmpSummonSkill.removedp;

            refParam.text += "  - [" + tmpSummonSkill.skillname + "] 스킬을 시전\n";
            if(tmpSummonSkill.removedp !== "0")
                refParam.text += "  - Dp 소모: " + tmpSummonSkill.removedp + ", 남아있는 DP : " + attPoint.dp + "\n";

            if(tmpSummonSkill.refresh.length > 0) {
                for(i = 0; i < tmpSummonSkill.refresh.length; ++i) {
                    attSmnArray.smnList[tmpSummonSkill.refresh[i]].ability.hp = tmpSummonSkill.targetmob.ability.hp;
                    attSmnArray.smnList[tmpSummonSkill.refresh[i]].ability.mp = tmpSummonSkill.targetmob.ability.mp;
                    attSmnArray.smnList[tmpSummonSkill.refresh[i]].ability.sp = tmpSummonSkill.targetmob.ability.sp;
                    attSmnArray.smnList[tmpSummonSkill.refresh[i]].keepturn = tmpSummonSkill.targetmob.keepturn;
                    attSmnArray.smnCC[tmpSummonSkill.refresh[i]] = {name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0};
                    attSmnArray.smnEffect[tmpSummonSkill.refresh[i]] = {n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false};
                    attSmnArray.smnAttspdCounter[tmpSummonSkill.refresh[i]] = AttMaxSpd;
                }
            }
            else {
                for(i = 0; i < tmpSummonSkill.count; ++i) {
                    attSmnArray.smnList.push(JSON.parse(JSON.stringify(tmpSummonSkill.targetmob)));
                    attSmnArray.smnAttspdCounter.push(AttMaxSpd);
                    attSmnArray.smnAttspd.push(tmpSummonSkill.targetmob.ability.atkspeed);
                    attSmnArray.smnCC.push({name:"", damage:0, effect:"",continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0});
                    attSmnArray.smnEffect.push({n_att:false, n_skl:false, n_pot:false, n_avd:false, n_prv:false, n_slw:false, n_dth:false});
                }
            }
            refParam.text += "  - " + tmpSummonSkill.targetmob.mobname + "을(를) 소환\n";
        }
        else {
            if(attEffect.n_att) {
                refParam.text += "  - " + attCC.name + "의 효과로 공격이 불가합니다.\n\n";
            }
            else {
                tmpCri = {cri:0};
                if(attEffect.n_skl) {
                    refParam.text += "  - " + attCC.name + "의 효과로 스킬을 사용할 수 없습니다.\n";
                    tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
                }
                else {
                    tmpSkill = _JudgSkill(AttOpt, _GetFunc.AllAbility(selMob, Defder, defSmnArray.smnList), attPoint, Attker, tmpCri, attCooltime);
                }

                if(tmpSkill.range === "single") {
                    tmpTargetList.push(selMob);
                }
                else {
                    refParam.text += "  - [" + tmpSkill.name + "] 전체 스킬 판정!\n";
                    tmpTargetList = _FindTarget(tmpSkill.count, selMob, defSmnArray.smnList);
                }

                if(tmpSkill.damage !== 0) {
                    attPoint.hp -= tmpSkill.removehp;
                    attPoint.mp -= tmpSkill.removemp;
                    attPoint.sp -= tmpSkill.removesp;

                    refParam.text += "  - [" + tmpSkill.name + "] 스킬을 시전\n";
                    if(tmpSkill.removehp !== "0")
                        refParam.text += "  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + attPoint.hp + "\n";
                    if(tmpSkill.removemp !== "0")
                        refParam.text += "  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + attPoint.mp + "\n";
                    if(tmpSkill.removesp !== "0")
                        refParam.text += "  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + attPoint.sp + "\n";
                }

                for(i = 0; i < tmpTargetList.length; ++i) {
                    tmpTarget = tmpTargetList[i];

                    refParam.text += "  - " + _GetFunc.Name(tmpTarget, Defder, defSmnArray.smnList) + "을(를) 공격\n";
                    
                    if(tmpSkill.damage !== 0){
                        if(tmpSkill.range === "single") {
                            tmpDamage = tmpSkill.damage;
                        }
                        else {
                            tmpDamage = _SkillCalcDamage( _SelectPointAndAbility(tmpSkill.skillkind, attPoint, Attker.getAbility()), _SelectPointAndAbility(tmpSkill.skillsubkind, attPoint, Attker.getAbility()), {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "defense"));
                            if(tmpCri.cri === 1) {
                                tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(Attker.getAbility().critical, _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "critical")));
                            }
                            if(tmpDamage <= 0)
                                tmpDamage = 1;
                        }
                    }
                    else {
                        if(tmpSkill.comment !== ""){
                            refParam.text += tmpSkill.comment + "\n";
                        }
                        tmpDamage = _JudgAttack(Attker.getAbility().attack, Attker.getAbility().critical, _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "critical"),  _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "defense"), CriticalRate, tmpCri);
                    }

                    tmpHp = _GetFunc.CurrPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp");
                    refParam.text += "  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n";

                    if(_GetFunc.Effect(tmpTarget, defEffect, defSmnArray.smnEffect, "n_avd")) {
                        refParam.text += "  - " + _GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "name") + "의 효과로 상대방은 회피할 수 없습니다.\n";
                    }

                    if(_GetFunc.Effect(tmpTarget, defEffect, defSmnArray.smnEffect, "n_avd") || _JudgAvoid(Attker.getAbility().accuracy, _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "avoid"))) {
                        
                        _SetFunc.MinusPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp", tmpDamage);
                        if(_GetFunc.CurrPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp") < 0)
                            _SetFunc.SetPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp", 0);
    
                        refParam.text += "  - " + _GetFunc.Name(tmpTarget, Defder, defSmnArray.smnList) + "의 Hp가 " + tmpHp + " -> " + _GetFunc.CurrPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp") + "로 줄어듬\n";
    
                        if(tmpSkill.cc !== null ) {
                            refParam.text += tmpSkill.comment + "\n";
    
                            if(_GetFunc.Effect(tmpTarget, defEffect, defSmnArray.smnEffect, "n_dth")) {
                                tmpDthCnt = _GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "deathcount");
                                tmpSkill.cc.deathcount = ((tmpDthCnt > 1)?(tmpDthCnt - 1):tmpDthCnt);
                                refParam.text += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                            }
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "name", tmpSkill.cc.name);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "damage", tmpSkill.cc.damage);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "effect", tmpSkill.cc.effect);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "continue", tmpSkill.cc.continue);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "slowrate", tmpSkill.cc.slowrate);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "deathcount", tmpSkill.cc.deathcount);
                            if(_GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "effect").indexOf("provo") !== -1)
                                _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "provo", -1);
                        }
    
                        if(_GetFunc.CurrPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp") === 0)
                        {
                            refParam.text += "  - " + _GetFunc.Name(tmpTarget, Defder, defSmnArray.smnList) + "이(가) 정신을 잃었습니다.\n";
                            if(tmpTarget === -1)
                                return WIN;
                        }
                    }
                    else {
                        if(tmpSkill.cc !== null ) {
                            refParam.text += tmpSkill.comment + "\n";
    
                            if(_GetFunc.Effect(tmpTarget, defEffect, defSmnArray.smnEffect, "n_dth")) {
                                tmpDthCnt = _GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "deathcount");
                                tmpSkill.cc.deathcount = ((tmpDthCnt > 1)?(tmpDthCnt - 1):tmpDthCnt);
                                refParam.text += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                            }
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "name", tmpSkill.cc.name);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "damage", tmpSkill.cc.damage);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "effect", tmpSkill.cc.effect);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "continue", tmpSkill.cc.continue);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "slowrate", tmpSkill.cc.slowrate);
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "deathcount", tmpSkill.cc.deathcount);
                            if(_GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "effect").indexOf("provo") !== -1)
                                _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "provo", -1);
                        }
                        refParam.text += "  - " +  _GetFunc.Name(tmpTarget, Defder, defSmnArray.smnList) + "이(가) 회피\n";
                    }
                    refParam.text += "\n";
                }
            }
        }

        return DRAW;

    };

    _BattleSummon = function(attSummonDB, attSmnArray, SmnIdx, Defder, defCC, defPoint, defMaxhp, defEffect, defSummonDB, defSmnArray, defIdx, refParam) {
        var tmpHp, tmpCc, tmpCri, tmpSkill, tmpDamage, tmpDthCnt, effectlist;
        var tmpTargetList = [], tmpTarget;
        var selMob = defIdx;
        var i;

        var attCC = attSmnArray.smnCC[SmnIdx];
        var attEffect = attSmnArray.smnEffect[SmnIdx];
        var Attker = attSmnArray.smnList[SmnIdx];
        var attMaxhp = attSummonDB.find(function(arg) {
            return arg.index === Attker.index;
        }).ability.hp;

        if(attCC.continue !== 0) {
            if(attCC.damage !== 0) {
                tmpHp = Attker.ability.hp;
                tmpCc = Math.floor(attMaxhp * attCC.damage);
                Attker.ability.hp -= tmpCc;
                if(Attker.ability.hp < 0)
                Attker.ability.hp = 0;

                refParam.text += "  - " + attCC.name + "의 효과로 " + tmpCc + " 데미지 발생\n";
                refParam.text += "  - " + Attker.name + "의 Hp가 " + tmpHp + " -> " + Attker.ability.hp + "로 줄어듬\n";

                if(Attker.ability.hp === 0)
                {
                    refParam.text += "  - " + Attker.name + "이(가) 정신을 잃었습니다\n";
                    if(defCC.prove === SmnIdx)
                        defCC.prove = Not_ProvoTarget;

                    for(i = 0; i < defSmnArray.smnCC.length; ++i) {
                        if(defSmnArray.smnCC[i].provo === SmnIdx)
                            defSmnArray.smnCC[i].provo = Not_ProvoTarget;
                    }
                    return DRAW;
                }
            }

            if(attCC.provo !== Not_ProvoTarget) {
                refParam.text += "  - " + attCC.name + "의 효과로 " + _GetFunc.Name(attCC.provo, Defder, defSmnArray.smnList) + "을(를) 타겟팅합니다.\n";
                selMob = attCC.provo;
            }

            _RemoveCC(null, attEffect);
            if(attCC.effect !== ""){
                effectlist = attCC.effect.split(";");
                for(i = 0; i < effectlist.length; ++i) {
                    if(effectlist[i] === "attack") {attEffect.n_att = true;}
                    if(effectlist[i] === "skill") {attEffect.n_skl = true;}
                    if(effectlist[i] === "potion") {attEffect.n_pot = true;}
                    if(effectlist[i] === "avoid") {attEffect.n_avd = true;}
                    if(effectlist[i] === "provo") {attEffect.n_prv = true;}
                    if(effectlist[i] === "slow") {attEffect.n_slw = true;}
                    if(effectlist[i] === "dth") {attEffect.n_dth = true;}
                }
            }
            attCC.continue--;

            if(attEffect.n_dth) {
                attCC.deathcount--;
                if(attCC.deathcount === 0) {
                    refParam.text += "  - " + attCC.name + "의 효과로 " + Attker.name + "는 즉사 합니다.\n";
                    if(defCC.prove === SmnIdx)
                        defCC.prove = Not_ProvoTarget;

                    for(i = 0; i < defSmnArray.smnCC.length; ++i) {
                        if(defSmnArray.smnCC[i].provo === SmnIdx)
                            defSmnArray.smnCC[i].provo = Not_ProvoTarget;
                    }

                    Attker.ability.hp = 0;
                    return DRAW;
                }
                else {
                    refParam.text += "  - " + attCC.name + " 효과의 남은 카운터 : " + attCC.deathcount + "\n";
                }
            }
        }
        else {
            _RemoveCC(attCC, attEffect);
        }

        if(attEffect.n_att) {
            refParam.text += "  - " + attCC.name + "의 효과로 공격이 불가합니다.\n\n";
        }
        else {
            tmpCri = {cri:0};
            if(attEffect.n_skl) {
                refParam.text += "  - " + attCC.name + "의 효과로 스킬을 사용할 수 없습니다.\n";
                tmpSkill = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
            }
            else {
                tmpSkill = _JudbSmnSkill( _GetFunc.AllAbility(selMob, Defder, defSmnArray.smnList), Attker, tmpCri, attSummonDB);
            }

            

            if(tmpSkill.range === "single") {
                tmpTargetList.push(selMob);
            }
            else {
                refParam.text += "  - [" + tmpSkill.name + "] 전체 스킬 판정!\n";
                tmpTargetList = _FindTarget(tmpSkill.count, selMob, defSmnArray.smnList);
            }

            if(tmpSkill.damage !== 0) {
                Attker.ability.hp -= tmpSkill.removehp;
                Attker.ability.mp -= tmpSkill.removemp;
                Attker.ability.sp -= tmpSkill.removesp;

                refParam.text += "  - [" + tmpSkill.name + "] 스킬을 시전\n";
                if(tmpSkill.removehp !== "0")
                    refParam.text += "  - Hp 소모: " + tmpSkill.removehp + ", 남아있는 HP : " + Attker.ability.hp + "\n";
                if(tmpSkill.removemp !== "0")
                    refParam.text += "  - Mp 소모: " + tmpSkill.removemp + ", 남아있는 MP : " + Attker.ability.mp + "\n";
                if(tmpSkill.removesp !== "0")
                    refParam.text += "  - Sp 소모: " + tmpSkill.removesp + ", 남아있는 SP : " + Attker.ability.sp + "\n";
            }

            for(i = 0; i < tmpTargetList.length; ++i) {
                tmpTarget = tmpTargetList[i];

                refParam.text += "  - " + _GetFunc.Name(tmpTarget, Defder, defSmnArray.smnList) + "을(를) 공격\n";
                
                if(tmpSkill.damage !== 0){
                    if(tmpSkill.range === "single") {
                        tmpDamage = tmpSkill.damage;
                    }
                    else {
                        tmpDamage = _SkillCalcDamage(Attker.ability[tmpSkill.skillkind], Attker.ability[tmpSkill.skillsubkind], {kind:tmpSkill.skillkind, effect:tmpSkill.skilleffect}, _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "defense"));
                        if(tmpCri.cri === 1) {
                            tmpDamage = Math.floor(tmpDamage * _CriCalcDamage(Attker.ability.critical, _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "critical")));
                        }
                        if(tmpDamage <= 0)
                            tmpDamage = 1;
                    }
                }
                else {
                    if(tmpSkill.comment !== ""){
                        refParam.text += tmpSkill.comment + "\n";
                    }
                    tmpDamage = _JudgAttack(Attker.ability.attack, Attker.ability.critical, _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "critical"),  _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "defense"), CriticalRate, tmpCri);
                }

                tmpHp = _GetFunc.CurrPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp");
                refParam.text += "  - " + (tmpCri.cri === 0?"":"(크리티컬!!) ") + tmpDamage + "데미지로 공격\n";

                if(_GetFunc.Effect(tmpTarget, defEffect, defSmnArray.smnEffect, "n_avd")) {
                    refParam.text += "  - " + _GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "name") + "의 효과로 상대방은 회피할 수 없습니다.\n";
                }

                if(_GetFunc.Effect(tmpTarget, defEffect, defSmnArray.smnEffect, "n_avd") || _JudgAvoid(Attker.ability.accuracy, _GetFunc.Ability(tmpTarget, Defder, defSmnArray.smnList, "avoid"))) {
                    
                    _SetFunc.MinusPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp", tmpDamage);
                    if(_GetFunc.CurrPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp") < 0)
                        _SetFunc.SetPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp", 0);

                    refParam.text += "  - " + _GetFunc.Name(tmpTarget, Defder, defSmnArray.smnList) + "의 Hp가 " + tmpHp + " -> " + _GetFunc.CurrPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp") + "로 줄어듬\n";

                    if(tmpSkill.cc !== null ) {
                        refParam.text += tmpSkill.comment + "\n";

                        if(_GetFunc.Effect(tmpTarget, defEffect, defSmnArray.smnEffect, "n_dth")) {
                            tmpDthCnt = _GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "deathcount");
                            tmpSkill.cc.deathcount = ((tmpDthCnt > 1)?(tmpDthCnt - 1):tmpDthCnt);
                            refParam.text += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                        }
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "name", tmpSkill.cc.name);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "damage", tmpSkill.cc.damage);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "effect", tmpSkill.cc.effect);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "continue", tmpSkill.cc.continue);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "slowrate", tmpSkill.cc.slowrate);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "deathcount", tmpSkill.cc.deathcount);
                        if(_GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "effect").indexOf("provo") !== -1)
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "provo", SmnIdx);
                    }

                    if(_GetFunc.CurrPoint(tmpTarget, defPoint, defSmnArray.smnList, "hp") === 0)
                    {
                        refParam.text += "  - " + _GetFunc.Name(tmpTarget, Defder, defSmnArray.smnList) + "이(가) 정신을 잃었습니다.\n";
                        if(tmpTarget === -1)
                            return WIN;
                    }
                }
                else {
                    if(tmpSkill.cc !== null ) {
                        refParam.text += tmpSkill.comment + "\n";

                        if(_GetFunc.Effect(tmpTarget, defEffect, defSmnArray.smnEffect, "n_dth")) {
                            tmpDthCnt = _GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "deathcount");
                            tmpSkill.cc.deathcount = ((tmpDthCnt > 1)?(tmpDthCnt - 1):tmpDthCnt);
                            refParam.text += "  - " + tmpSkill.cc.name + "의 중복효과로 죽음의 선고 카운터를 하나 줄입니다. \n";
                        }
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "name", tmpSkill.cc.name);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "damage", tmpSkill.cc.damage);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "effect", tmpSkill.cc.effect);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "continue", tmpSkill.cc.continue);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "slowrate", tmpSkill.cc.slowrate);
                        _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "deathcount", tmpSkill.cc.deathcount);
                        if(_GetFunc.CC(tmpTarget, defCC, defSmnArray.smnCC, "effect").indexOf("provo") !== -1)
                            _SetFunc.SetCC(tmpTarget, defCC, defSmnArray.smnCC, "provo", SmnIdx);
                    }
                    refParam.text += "  - " +  _GetFunc.Name(tmpTarget, Defder, defSmnArray.smnList) + "이(가) 회피\n";
                }
                refParam.text += "\n";
            }
        }

        return DRAW;

    };

    _JudgSkill = function(_opt, _mop, _attpoint, _user, _cri, _cooltime) {
        var rtnObj = {damage:0, name:"", removehp:0, removemp:0, removesp:0, cc:null, comment:"", range:"single", count:1, skillkind:-1, skillsubkind:-1, skilleffect:0};
        //var mobHPpercent = (_mopcurrhp / _mophp) * 100;
        var skillinfo = null;
        var calcCri = 0, calcCriDamage = 0;
        var userAbility = _user.getAbility();
        var rightWeapon = _user.getEquimentInfo("righthand");
        var leftWeapon = _user.getEquimentInfo("lefthand");
        var ccinfo = null;
        var judgment = 0;
        var nhp, nmp, nsp, i;
        var option = _opt.getPvpAttSkillOpt();

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

        // if(mobHPpercent > 50) {
        //     if(_opt.getPvpAttSkillOpt().full !== "")
        //         skillinfo = db_Manager.getSkill(_opt.getPvpAttSkillOpt().full);
        // }
        // else if(mobHPpercent > 20) {
        //     if(_opt.getPvpAttSkillOpt().half !== "")
        //         skillinfo = db_Manager.getSkill(_opt.getPvpAttSkillOpt().half);
        // }
        // else {
        //     if(_opt.getPvpAttSkillOpt().last !== "")
        //         skillinfo = db_Manager.getSkill(_opt.getPvpAttSkillOpt().last);
        // }

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
                if(nhp < _attpoint.hp && nmp <= _attpoint.mp && nsp <= _attpoint.sp) {
                    rtnObj.damage = _SkillCalcDamage(_SelectPointAndAbility(skillinfo.kind, _attpoint, userAbility), _SelectPointAndAbility(skillinfo.subkind, _attpoint, userAbility), skillinfo, _mop.defense);
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
                        calcCri = _CriCalc(userAbility.critical, _mop.critical);
                        if(calcCri > 0) {
                            calcCriDamage = Math.floor(rtnObj.damage * _CriCalcDamage(userAbility.critical, _mop.critical));
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
        return rtnObj;
    };
    _JudbSmnSkill = function(_mop, _summon, _cri, _summondb) { 
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
            if(nhp <= _summon.ability.hp && nmp <= _summon.ability.mp && nsp <= _summon.ability.sp) {
                rtnObj.damage = _SkillCalcDamage(summonDB.ability[skillinfo.kind], summonDB.ability[skillinfo.subkind], skillinfo, _mop.defense);
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
                    calcCri = _CriCalc(summonDB.ability.critical, _mop.critical);
                    if(calcCri > 0) {
                        calcCriDamage = Math.floor(rtnObj.damage * _CriCalcDamage(summonDB.ability.critical, _mop.critical));
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
    _JudgCC = function(_ccidx) {
        var rtnobj = {name:"", damage:0, effect:"", continue:0, provo:Not_ProvoTarget, slowrate:0, deathcount:0};
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

        if(judgment > _myCri) {
            _cri.cri = 0;
            return damage;
        }
        else {
            _cri.cri = 1;
            return cridamage;
        }

    };

    _JudgSummonSkill = function(_db, _summonlist, _user, userpoint) {
        var rtn = {jude:false, count:0, comment:"", removedp:0, skillname:"", targetmob:null, refresh:[]};
        var s;
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
                    if(obj.needdp < userpoint.dp) {
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
    _SetSummonMonster = function(_userObj, _opt) {
        var rtnArray = [], skill, summonMob, obj;
        var summonOpt = _opt.getPvpSummonSkillOpt();

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

    _JudgAvoid = function(_myAcc, _targetAvoid) {
        var Avoid_Percent = _AvoidCalc(_myAcc, _targetAvoid);
        var judgment = libCommon.Randfloat(0,100);

        return (judgment > Avoid_Percent);
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
    _SelectTarget = function(_summonList) {
        var matchingTable = [-1];

        for(var i = 0; i < _summonList.length; ++i) {
            if(_summonList[i].ability.hp > 0) {
                matchingTable.push(i);
            }
        }
        return matchingTable[libCommon.Rand(0,matchingTable.length - 1)];
    };
    _FindTarget = function(_count, _Target, _smnList) {
        var rtnArray = [];
        var cnt = _count;
        var rand, i, t_idx;
        var matchingTable = [-1];
        
        for(i = 0; i < _smnList.length; ++i) {
            if(_smnList[i].ability.hp > 0) {
                matchingTable.push(i);
            }
        }
        //matchingTable.splice(matchingTable.indexOf(_Target), 1);

        if(_count >= (matchingTable.length)) {

            for(i = 0 ; i < matchingTable.length; ++i) {
                rtnArray.push(matchingTable[i]);
            }
        }
        else {
            rtnArray.push(_Target);
            matchingTable.splice(matchingTable.indexOf(_Target), 1);
            cnt--;

            while(cnt > 0) {
                rand = libCommon.Rand(0, matchingTable.length - 1);
                t_idx = matchingTable[rand];
                rtnArray.push(t_idx);
                cnt--;
                matchingTable.splice(rand, 1);
                if(matchingTable.length === 0)
                    break;
            }
        }
        return rtnArray;
    };
    _GetFunc = {
        Name:function(_Idx, _User, _smnList) {
            if(_Idx === -1) {
                return _User.name;
            }
            else {
                return _smnList[_Idx].mobname;
            }
        },
        Ability:function(_Idx, _User, _smnList, _ablname) {
            if(_Idx === -1) {
                return _User.getAbility()[_ablname];
            }
            else {
                return _smnList[_Idx].ability[_ablname];
            }
        },
        AllAbility:function(_Idx, _User, _smnList) {
            if(_Idx === -1) {
                return _User.getAbility();
            }
            else {
                return _smnList[_Idx].ability;
            }
        },
        CurrPoint:function(_Idx, _UserPoint, _smnList, _pointname) {
            if(_Idx === -1) {
                return _UserPoint[_pointname];
            }
            else {
                return _smnList[_Idx].ability[_pointname];
            }
        },
        MaxPoint:function(_Idx, _UserPoint, _smnList, _smnDB, _pointname) {
            var db, rtnvalue = 0;
            if(_Idx === -1) {
                rtnvalue = _UserPoint;
            }
            else {
                for(var i = 0; i < _smnDB.length; ++i) {
                    db = _smnDB[i];
                    
                    if(db.index === _smnList[_Idx].index) {
                        rtnvalue = db.ability[_pointname];
                    }
                }
                
            }
            return rtnvalue;
        },
        Effect:function(_Idx, _UserEff, _sumEffList, _effname) {
            if(_Idx === -1) {
                return _UserEff[_effname];
            }
            else {
                return _sumEffList[_Idx][_effname];
            }
        },
        CC:function(_Idx, _UserCC, _sumCCList, _CCname) {
            if(_Idx === -1) {
                return _UserCC[_CCname];
            }
            else {
                return _sumCCList[_Idx][_CCname];
            }
        }
    };
    _SetFunc = {
        MinusPoint:function(_Idx, _UserPoint, _smnList, _pointname, _amount) {
            if(_Idx === -1) {
                _UserPoint[_pointname] -= _amount;
            }
            else {
                _smnList[_Idx].ability[_pointname] -= _amount;
            }
        },
        SetPoint:function(_Idx, _UserPoint, _smnList, _pointname, _amount) {
            if(_Idx === -1) {
                _UserPoint[_pointname] = _amount;
            }
            else {
                _smnList[_Idx].ability[_pointname] = _amount;
            }
        },
        SetCC:function(_Idx, _UserCC, _sumCCList, _CCname, _TargetName){
            if(_Idx === -1) {
                _UserCC[_CCname] = _TargetName;
            }
            else {
                _sumCCList[_Idx][_CCname] = _TargetName;
            }
        }
    };
    _SelectPointAndAbility = function(_target, _points, _ability) {
        if(_target === "hp" || _target === "mp" || _target === "sp" || _target === "dp") {
            return _points[_target];
        }
        else {
            return _ability[_target];
        }
    };

    return {
        Delete:function(_id){
            _Delete(_id);
        },
        isUser:function(_id){
            if(_Find(_id) === null)
                return false;

            return true;
        },
        getMyRank:function(_id) {
            var rtnObj = _Find(_id);
            if(rtnObj === null){
                return "";
            }
            return rtnObj.getRank();
        },
        Enroll:function(_id){
            RankingList.push(libObject.clsBattleObj({name:_id, score:{win:0,draw:0,lost:0}, record:[], ranking:(RankingList.length+1)}));
            _Save();
        },
        getMatcherName:function(_id){
            var rankinfo = _Find(_id);
            var match_rank = rankinfo.getRank() - 1;
            if(match_rank === 0) {
                return "";
            }
            var matcher = _FindforRank(match_rank);

            return matcher.name;
        },
        Battle:function(_mine, _match, mine_opt, match_opt){
            var str = _BattleStart(_mine, _match, mine_opt, match_opt);
            _Save();

            return str;
        },
        getTopRankerList:function(_count) {
            var rtnStr = "", tmpObj;
            var Lencount = RankingList.length;
            if(Lencount > _count)
                Lencount = _count;

            for(var i = 1; i <= Lencount; ++i) {
                tmpObj = _FindforRank(i);
                rtnStr += "  " + tmpObj.getRank() + "위 " + tmpObj.name + " ( Win : " + tmpObj.getScoreWin()+ ", Lost : " + tmpObj.getScoreLost()+ ", Draw : " + tmpObj.getScoreDraw()+ " )\n";
            }

            return rtnStr;
        },
        getBattleList:function(_id) {
            var rtnStr = "", tmpObj;
            var rankinfo = _Find(_id);
            if(rankinfo === null)
                return rtnStr;

            var recordList = rankinfo.getRecord();

            for(var i = recordList.length - 1; i >= 0 ; --i) {
                rtnStr += "  - 매치상대 : " + recordList[i].matcher + " (" + recordList[i].result + ")\n";
            }

            return rtnStr;
        }
    };
}
