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

function ExplorerManager() {
    var m_ExplorerList = [];
    var m_ExplorerDump = new libCommon.DumpModule();

    var _LoadData, _Find, _CreateExplorer, _RandStat, _Result, _PlusDropItem, _PlusMobName, _Delete, _MakeJson, _Save;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["ExplorerList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            m_ExplorerList.push(libObject.clsExplorer(tmpList[idx]));
        }
    }();
    _Find = function(_id) {
        var i;
        for (i = 0; i < m_ExplorerDump.dumpList.length; ++i) {
           if (m_ExplorerDump.dumpList[i].name === _id) {
              m_ExplorerDump.resetTimeStemp(i);
              return m_ExplorerDump.dumpList[i];
           }
        }
        for (i = 0; i < m_ExplorerList.length; ++i) {
           if (m_ExplorerList[i].name === _id) {
              m_ExplorerDump.addDump(m_ExplorerList[i]);
              return m_ExplorerList[i];
           }
        }

        return null;
    };

    _CreateExplorer = function(_id) {
        var obj = {name:_id, stat:{str:0, dex:0, luk:0}, grade:"C", lock:false, huntingtime:-1, huntingloc:""};

        m_ExplorerList.push(libObject.clsExplorer(obj));

        _Save();
    };
    _RandStat = function(_id, _step) {
        var expl = _Find(_id);
        if(expl === null) return null;

        var r, stat = {str : 0, dex: 0, luk:0};
        var point = libCommon.Rand(((_step - 1)*10) + 1 ,(_step + 2) * 10);
        if(point >= 1 && point <= 10) expl.setGrade("C");
        if(point >= 11 && point <= 20) expl.setGrade("B");
        if(point >= 21 && point <= 30) expl.setGrade("A");
        if(point >= 31 && point <= 40) expl.setGrade("S");
        if(point >= 41 && point <= 50) expl.setGrade("SS");

        r = libCommon.Rand(0, point);
        stat.str += r;
        point -= r;

        r = libCommon.Rand(0, point);
        stat.dex += r;
        point -= r;

        stat.luk += point;

        expl.setStat(stat);

        _Save();
        return expl;
    };
    _Result = function(_el) {
        var rtnObj = {mob:[], items:[], rune:0}, i;
        var currTime = (new Date()).getTime();
        var remineTime = currTime - _el.getTime();
        var chance = Math.floor(remineTime / (libConst.AutoHTSpeed - (_el.getStat().dex * libConst.AutoHTSpeedWgt * 1000)));
        var dropAmount = Math.floor(libConst.AutoHTDropItemAmount + (_el.getStat().str * libConst.AutoHTDropItemAmountWgt));
        var bossRate = libConst.AutoHTBossRate + (_el.getStat().luk * libConst.AutoHTBossRateWgt);
        var fieldDB = db_Manager.getField(_el.getLoc());

        var r_mob, r_boss, monster;
        var dropList, rune;

        if(chance > libConst.AutoHTMaxCount) {
          chance = libConst.AutoHTMaxCount;
        }

        for(i = 0; i < chance; ++i){
            r_boss = libCommon.Randfloat(0,100);
            if(bossRate > r_boss) {
                monster = db_Manager.getMonster(fieldDB.boss);
                rune = monster.droprune.split("~");
                dropList = monster.dropItem;
            }
            else {
                monster = fieldDB.monster;
                r_mob = libCommon.Rand(0,monster.length - 1);
                monster = db_Manager.getMonster(monster[r_mob]);
                rune = monster.droprune.split("~");
                dropList = monster.dropItem;
            }

            rune = libCommon.Rand(Number(rune[0]), Number(rune[1]));
            rtnObj.rune += Number(rune);
            for(var j = 0; j < dropList.length; ++j) {
                _PlusDropItem(rtnObj, dropList[j], dropAmount);
            }

            _PlusMobName(rtnObj, monster.name);
        }
        return rtnObj;
    };

    _PlusDropItem = function(_obj, _item, _dropamount) {
        var r = libCommon.Randfloat(0,100);
        if(_item.droprate > r) {
            for(var i = 0; i < _obj.items.length; ++i) {
                if(_obj.items[i].itemIdx === _item.itemIdx) {
                    _obj.items[i].count += Math.floor(_item.count * _dropamount);
                    return;
                }
            }
            _obj.items.push({itemIdx:_item.itemIdx, count:Math.floor(_item.count * _dropamount)});
        }
    };
    _PlusMobName = function(_obj, _name) {
        for(var i = 0; i < _obj.mob.length; ++i) {
            if(_obj.mob[i].name === _name) {
                _obj.mob[i].count++;
                return;
            }
        }
        _obj.mob.push({name:_name, count:1});
    };

    _Delete = function(_id) {
        m_ExplorerDump.clear();
        for (var i = 0; i < m_ExplorerList.length; ++i) {
           if (m_ExplorerList[i].name === _id) {
              m_ExplorerList.splice(i,1);
              break;
           }
        }
        _Save();
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_ExplorerList.length; ++i) {
            jsonArray.push(m_ExplorerList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Explorer", function() {
                libCommon.write(libConst.fileNameList["ExplorerList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["ExplorerList"], _MakeJson());
        }
    };
    return {
        Find:_Find,
        Delete:function(_id) {
            _Delete(_id);
        },
        isExplorer:function(_id) {
            return ((_Find(_id) === null)?false:true);
        },
        getExplorer:function(_id) {
            return _Find(_id);
        },
        isLock:function(_id) {
            var expl = _Find(_id);
            if(expl !== null) {
                return expl.getLock();
            }
            return false;
        },
        setLock:function(_id, _lock) {
            var expl = _Find(_id);
            if(expl !== null) {
                expl.setLock(_lock);
                _Save();
                return true;
            }
            return false;
        },
        CreateExplorer:function(_id) {
            _CreateExplorer(_id);
        },
        RandExplorer:function(_id, _step) {
            return _RandStat(_id, _step);
        },
        StartAutoHunting:function(_id, _loc) {
            var expl = _Find(_id);
            if(expl !== null) {
                expl.setTime((new Date).getTime());
                expl.setLoc(_loc);
                _Save();
                return true;
            }
            return false;
        },
        whereAutoHunting:function(_id) {
            var expl = _Find(_id);
            if(expl !== null) {
                  return expl.getLoc();
            }
            return "";
        },
        AutoHuntingResult:function(_id) {
            var expl = _Find(_id), rtnObj = null;
            if(expl !== null) {
                  rtnObj = _Result(expl);
                  expl.setTime(-1);
                  expl.setLoc("");
                  _Save();
            }
            return rtnObj;
        },
        activeExplorer:function(_expl) {
            m_ExplorerList.push(libObject.clsExplorer(_expl));
            _Save();
        }
    };
}
