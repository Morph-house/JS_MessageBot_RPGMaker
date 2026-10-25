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
const libObject = Bridge.getScopeOf("Object.js"); // Object Lib

var db_Manager = Bridge.getScopeOf("DataBase.js").DBManager(); // 데이터 담당 객체

function RecordManager() {
    var m_recordList = [];
    var m_recordDump = new libCommon.DumpModule();

    const m_mobPropertyList = db_Manager.getMonsterPropertyList("monstercounter");
    const m_stausPropertyList = db_Manager.getPropertyList("maxstatus");
    const m_gamedefPropertyList = db_Manager.getPropertyList("gambledefeat");
    const m_gamevicPropertyList = db_Manager.getPropertyList("gamblevictory");
    const m_minePropertyList = db_Manager.getPropertyList("timemine");
    const m_fellPropertyList = db_Manager.getPropertyList("timefell");
    const m_stonePropertyList = db_Manager.getPropertyList("timestone");
    const m_getterPropertyList = db_Manager.getPropertyList("timegetter");
    const m_runePropertyList = db_Manager.getPropertyList("maxrune");
    const m_actPropertyList = db_Manager.getPropertyList("action");
    const m_winPropertyList = db_Manager.getPropertyList("pvpwin");
    const m_lostPropertyList = db_Manager.getPropertyList("pvplost");
    const m_wbPropertyList = db_Manager.getPropertyList("lastworldboss");
    const m_clanGiveRuneList = db_Manager.getPropertyList("clangiverune");
    const m_clanGiveItemList = db_Manager.getPropertyList("clangiveitem");
    const m_MaxTowerFloorList = db_Manager.getPropertyList("topclearfloor");
    const m_PetAwakenList = db_Manager.getPropertyList("petawaken");
    const m_FishingList = db_Manager.getPropertyList("fishingcount");

    var dump_mobPropertyList = new libCommon.DumpModule();

    var _LoadData, _Find, _Delete, _MakeJson, _CreateRecord, _Save, _CheckCondition, _ConditionEvent;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["RecordList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            m_recordList.push(libObject.clsUserRecord(tmpList[idx]));
        }
    }();
    _Find = function(_id) {
        var i;
        for (i = 0; i < m_recordDump.dumpList.length; ++i) {
           if (m_recordDump.dumpList[i].name === _id) {
             m_recordDump.resetTimeStemp(i);
              return m_recordDump.dumpList[i];
           }
        }
        for (i = 0; i < m_recordList.length; ++i) {
           if (m_recordList[i].name === _id) {
              m_recordDump.addDump(m_recordList[i]);
              return m_recordList[i];
           }
        }
        return null;
    };
    _Delete = function(_id) {
        m_recordDump.clear();
        for (var i = 0; i < m_recordList.length; ++i) {
           if (m_recordList[i].name === _id) {
              m_recordList.splice(i,1);
              break;
           }
        }
        _Save();
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_recordList.length; ++i) {
            jsonArray.push(m_recordList[i].getJson());
        }
        return jsonArray;
    };
    _CreateRecord = function(_id, _rune, _skillcnt) {
        var obj = {
             name:_id,
             monstercounter:[],
             gamblevictory:0,
             gambledefeat:0,
             skillcounter:_skillcnt,
             maxstatus:{str:0, con:0, dex:0, agi:0, int:0, luk:0, ept:0, com:0, spr:0},
             timemine:0,
             timefell:0,
             timestone:0,
             timegetter:0,
             maxrune:_rune,
             action:{eatfood:0, sleep:0, drunk:0},
             pvpwin:0,
             pvplost:0,
             lastworldboss:0,
             topclearfloor:[],
             clangiverune:0,
             clangiveitem:0,
             petawaken:0,
             fishingcount:0

         };

        m_recordList.push(libObject.clsUserRecord(obj));
        _Save();
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Record", function() {
                libCommon.write(libConst.fileNameList["RecordList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["RecordList"], _MakeJson());
        }
    };
    _CheckCondition = function(_type, _checkidx, _currCount, _record) {
        var property = db_Manager.getProperty(_checkidx);
        var reachCount = 0, currCount = _currCount;
        var moblist = [];

        switch(_type) {
            case 0:
                reachCount = property.count;
                break;
            case 1:
                if(property.rcdidx !== "")
                    moblist = property.rcdidx.split(";");
                reachCount = property.count;
                currCount = _record.getMonsterCount(moblist);
                break;
        }

        if(currCount >= reachCount) {
            _ConditionEvent(property, _record.name);
        }
    };

    return {
        Find:_Find,
        Save:_Save,
        getRecord:function(_id){
          return _Find(_id);
        },
        getRecordText:function(_id) {
            var rcd = _Find(_id);
            var rtnstr = "";
            var json, mob, i, tower;

            if(rcd === null) {
                _replier.reply("유저 기록이 존재 하지 않습니다.");
            }
            else {
                json = rcd.getJson();

                rtnstr += "[" + json.name + "플레이 기록]\n\n";
                rtnstr += "(갬블 관련)\n";
                rtnstr += "  - 승리횟수 : " + json.gamblevictory + "회\n";
                rtnstr += "  - 패배횟수 : " + json.gambledefeat + "회\n";

                rtnstr += "(획득 스텟)\n";
                rtnstr += "  - 힘 : " + json.maxstatus.str + "\n";
                rtnstr += "  - 체질 : " + json.maxstatus.con + "\n";
                rtnstr += "  - 민첩 : " + json.maxstatus.dex + "\n";
                rtnstr += "  - 재주 : " + json.maxstatus.agi + "\n";
                rtnstr += "  - 지능 : " + json.maxstatus.int + "\n";
                rtnstr += "  - 운 : " + json.maxstatus.luk + "\n";
                rtnstr += "  - 효율 : " + json.maxstatus.ept + "\n";
                rtnstr += "  - 교감 : " + json.maxstatus.com + "\n";
                rtnstr += "  - 영혼 : " + json.maxstatus.spr + "\n";

                rtnstr += "(각종 횟수)\n";
                rtnstr += "  - 전체 채굴 : " + json.timemine + "회\n";
                rtnstr += "  - 전체 벌목 : " + json.timefell + "회\n";
                rtnstr += "  - 전체 채광 : " + json.timestone + "회\n";
                rtnstr += "  - 전체 채집 : " + json.timegetter + "회\n";

                rtnstr += "(획득  룬)\n";
                rtnstr += "  - 누적 룬량 : " + json.maxrune + " rune\n";

                rtnstr += "(펫)\n";
                rtnstr += "  - 각성횟수 : " + json.petawaken + "회\n";

                rtnstr += "(클랜)\n";
                rtnstr += "  - 룬기부 : " + json.clangiverune + " rune\n";
                rtnstr += "  - 템기부 : " + json.clangiveitem + "회\n";

                rtnstr += "(액션)\n";
                rtnstr += "  - 식사 : " + json.action.eatfood + "회\n";
                rtnstr += "  - 숙박 : " + json.action.sleep + "회\n";

                rtnstr += "(PVP)\n";
                rtnstr += "  - 승리 : " + json.pvpwin + "회\n";
                rtnstr += "  - 패배 : " + json.pvplost + "회\n";

                rtnstr += "(월드보스)\n";
                rtnstr += "  - 막타 : " + json.lastworldboss + "회\n";

                rtnstr += "(낚시)\n";
                rtnstr += "  - 낚시 횟수 : " + json.fishingcount + "회\n";

                rtnstr += "(최대 도달 타워)\n";
                for(i = 0; i < json.topclearfloor.length; ++i) {
                    tower = json.topclearfloor[i];
                    rtnstr += "  - " + db_Manager.getCity(tower.city).name + " > " +
                              db_Manager.getFacility(tower.facility).name + " : " +
                              tower.floor + "층\n";
                }

                rtnstr += "(몬스터)" + libConst.dummy + "\n";
                for(i = 0; i < json.monstercounter.length; ++i) {
                    mob = json.monstercounter[i];
                    rtnstr += "  - " + db_Manager.getMonster(mob.mobidx).name + " : " + mob.count + "회\n";
                }
            }
            return rtnstr;
        },
        Delete:function(_id) {
            _Delete(_id);
        },
        setEventListerner:function(_listerner) {
            _ConditionEvent = _listerner;
        },
        newRecord:function(_id, _rune) {
            _CreateRecord(_id, _rune);
        },
        confirmMonsterCnt:function(_id, _monidx, _count) {
            var rcd = _Find(_id), rcdmobCount;
            var rtnFlag = false;
            if (rcd !== null) {
                rcdmobCount = rcd.getMonsterCount([_monidx]);
                if(rcdmobCount >= _count) rtnFlag = true;
            }

            return rtnFlag;
        },
        setStatus:function(_id, _stat) {
            var rcd = _Find(_id), property;
            if (rcd !== null) {
                rcd.setMaxStatus(_stat);
                _Save();

                for(var i = 0; i < m_stausPropertyList.length; ++i) {
                    property = m_stausPropertyList[i];
                    _CheckCondition(0,property.index,rcd.getStatus(property.detailname), rcd);
                }
            }
        },
        rcdMonster:function(_id, _mobidx, _count, _isSave) {
            var id = _id, mobidx = _mobidx;

            var rcd = _Find(id), i;
            if (rcd !== null) {
                rcd.addMonsterCount(mobidx, Number(_count));
                if(_isSave)
                    _Save();

                for(i = 0; i < dump_mobPropertyList.dumpList.length; ++i) {
                    if(dump_mobPropertyList.dumpList[i] !== undefined && dump_mobPropertyList.dumpList[i] !== null){
                        if(dump_mobPropertyList.dumpList[i].rcdidx.split(";").indexOf(mobidx) !== -1) {
                            dump_mobPropertyList.resetTimeStemp(i);
                            _CheckCondition(1,dump_mobPropertyList.dumpList[i].index,0, rcd);
                            return;
                        }
                    }
                    else {
                        dump_mobPropertyList.clear();
                        break;
                    }
                }

                for(i = 0; i < m_mobPropertyList.length; ++i) {
                    if(m_mobPropertyList[i].rcdidx.split(";").indexOf(mobidx) !== -1) {
                        dump_mobPropertyList.addDump(m_mobPropertyList[i]);
                        _CheckCondition(1,m_mobPropertyList[i].index,0, rcd);
                        break;
                    }
                }
            }
        },
        rcdGamble:function(_id, _vs) {
            var rcd = _Find(_id), property, i;
            if (rcd !== null) {
                if(_vs) {
                    rcd.addGambleVictory();
                }
                else {
                    rcd.addGambleDefeat();
                }
                _Save();
                if(_vs) {
                    for(i = 0; i < m_gamevicPropertyList.length; ++i) {
                        property = m_gamevicPropertyList[i];
                        _CheckCondition(0,property.index,rcd.getGambleVictory(), rcd);
                    }
                }
                else {
                    for(i = 0; i < m_gamedefPropertyList.length; ++i) {
                        property = m_gamedefPropertyList[i];
                        _CheckCondition(0,property.index,rcd.getGambleDefeat(), rcd);
                    }
                }
            }
        },
        rcdSkillCnt:function(_id) {
            var rcd = _Find(_id);
            if (rcd !== null) {
                rcd.addSkillCnt();
                _Save();
            }
        },
        rcdMineTime:function(_id, _cnt) {
            var rcd = _Find(_id), property;
            if (rcd !== null) {
                rcd.addTimeMineCnt(_cnt);
                _Save();

                for(var i = 0; i < m_minePropertyList.length; ++i) {
                    property = m_minePropertyList[i];
                    _CheckCondition(0,property.index,rcd.getTimeMineCnt(), rcd);
                }
            }
        },
        rcdFellTime:function(_id, _cnt) {
            var rcd = _Find(_id), property;
            if (rcd !== null) {
                rcd.addTimeFellCnt(_cnt);
                _Save();

                for(var i = 0; i < m_fellPropertyList.length; ++i) {
                    property = m_fellPropertyList[i];
                    _CheckCondition(0,property.index,rcd.getTimeFellCnt(), rcd);
                }
            }
        },
        rcdStoneTime:function(_id, _cnt) {
            var rcd = _Find(_id), property;
            if (rcd !== null) {
                rcd.addTimeStoneCnt(_cnt);
                _Save();

                for(var i = 0; i < m_stonePropertyList.length; ++i) {
                    property = m_stonePropertyList[i];
                    _CheckCondition(0,property.index,rcd.getTimeStoneCnt(), rcd);
                }
            }
        },
        rcdGetterTime:function(_id, _cnt) {
            var rcd = _Find(_id), property;
            if (rcd !== null) {
                rcd.addTimeGetterCnt(_cnt);
                _Save();

                for(var i = 0; i < m_getterPropertyList.length; ++i) {
                    property = m_getterPropertyList[i];
                    _CheckCondition(0,property.index,rcd.getTimeGetterCnt(), rcd);
                }
            }
        },
        rcdMaxRune:function(_id, _cnt) {
            var id = _id, cnt = _cnt;

            var rcd = _Find(id), property;
            if (rcd !== null) {
                rcd.addMaxRune(cnt);
                _Save();

                for(var i = 0; i < m_runePropertyList.length; ++i) {
                    property = m_runePropertyList[i];
                    _CheckCondition(0,property.index,rcd.getMaxRune(), rcd);
                }
            }
        },
        rcdAction:function(_id, _act) {
            var rcd = _Find(_id), property, i;
            if (rcd !== null) {
                rcd.addAction(_act);
                _Save();

                for(i = 0; i < m_actPropertyList.length; ++i) {
                    property = m_actPropertyList[i];
                    if(property.detailname === _act)
                      _CheckCondition(0,property.index,rcd.getAction(_act), rcd);
                }
            }
        },
        rcdPVP:function(_id, _vs) {
            var id = _id, vs = _vs;

            var rcd = _Find(id), property, i;
            if (rcd !== null) {
                if(vs) {
                    rcd.addPVPWin();
                }
                else {
                    rcd.addPVPLost();
                }
                _Save();
                if(vs) {
                    for(i = 0; i < m_winPropertyList.length; ++i) {
                        property = m_winPropertyList[i];
                        _CheckCondition(0,property.index,rcd.getPVPWin(), rcd);
                    }
                }
                else {
                    for(i = 0; i < m_lostPropertyList.length; ++i) {
                        property = m_lostPropertyList[i];
                        _CheckCondition(0,property.index,rcd.getPVPLost(), rcd);
                    }
                }
            }
        },
        rcdLastWorldBoss:function(_id) {
            var rcd = _Find(_id), property;
            if (rcd !== null) {
                rcd.addLastWorldBoss();
                _Save();

                for(var i = 0; i < m_wbPropertyList.length; ++i) {
                    property = m_wbPropertyList[i];
                    _CheckCondition(0,property.index,rcd.getLastWorldBoss(), rcd);
                }
            }
        },
        rcdClanGiveRune:function(_id, _cnt) {
            var id = _id, rune = _cnt;
            var rcd = _Find(id), property;
            if (rcd !== null) {
                rcd.addClanRuneCount(rune);
                _Save();

                for(var i = 0; i < m_clanGiveRuneList.length; ++i) {
                    property = m_clanGiveRuneList[i];
                    _CheckCondition(0,property.index,rcd.getClanRuneCount(), rcd);
                }
            }
        },
        rcdClanGiveItem:function(_id, _cnt) {
            var id = _id, rune = _cnt;
            var rcd = _Find(id), property;
            if (rcd !== null) {
                rcd.addClanItemCount(rune);
                _Save();

                for(var i = 0; i < m_clanGiveItemList.length; ++i) {
                    property = m_clanGiveItemList[i];
                    _CheckCondition(0,property.index,rcd.getClanItemCount(), rcd);
                }
            }
        },
        rcdTowerClearFloor:function(_id, _city, _facility, _floor) {
            var id = _id;
            var rcd = _Find(id), property;
            if (rcd !== null) {
                rcd.setMaxTowerFloor(_city, _facility, _floor);
                _Save();

                for(var i = 0; i < m_MaxTowerFloorList.length; ++i) {
                    property = m_MaxTowerFloorList[i];
                    _CheckCondition(0,property.index,rcd.getMaxTowerFloor(_city, _facility), rcd);
                }
            }
        },
        rcdPetAwaken:function(_id) {
            var rcd = _Find(_id), property;
            if (rcd !== null) {
                rcd.addPetAwaken();
                _Save();

                for(var i = 0; i < m_PetAwakenList.length; ++i) {
                    property = m_PetAwakenList[i];
                    _CheckCondition(0,property.index,rcd.getPetAwaken(), rcd);
                }
            }
        },
        rcdFishingCount:function(_id) {
            var rcd = _Find(_id), property;
            if (rcd !== null) {
                rcd.addFishingCount();
                _Save();

                for(var i = 0; i < m_FishingList.length; ++i) {
                    property = m_FishingList[i];
                    _CheckCondition(0,property.index,rcd.getFishingCount(), rcd);
                }
            }
        },

        activeRecord:function(_record) {
            m_recordList.push(libObject.clsUserRecord(_record));
            _Save();
        }
    };
}
