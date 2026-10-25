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

function CharactorManager(_eventMgr, _homeworkMgr) {
    var m_charactorList = [], m_charOptionList = [];
    var m_charDump = new libCommon.DumpModule();
    var m_OptDump = new libCommon.DumpModule();
    var m_dbmanager = db_Manager;
    var EventManager = _eventMgr;
    var HomeworkManager = _homeworkMgr;
    var RecordManager = Bridge.getScopeOf("RecordManager.js").RecordManager();
    var PetManager = Bridge.getScopeOf("PetManager.js").PetManager();
    var MercenaryManager = Bridge.getScopeOf("MercenaryManager.js").MercenaryManager();
    var ExplorerManager = Bridge.getScopeOf("ExplorerManager.js").ExplorerManager();
    var BattleManager = Bridge.getScopeOf("BattleManager.js").BattleManager(RecordManager);
    var PostManager = Bridge.getScopeOf("GameManager.js").post_manager;
    var m_huntSystem = Bridge.getScopeOf("Hunting.js").Hunting(RecordManager, PetManager, EventManager);
    var WorldBossManager = Bridge.getScopeOf("WorldBossManager.js").WorldBossManager(PostManager);
    var MyHomeManager = Bridge.getScopeOf("MyHomeManager.js").MyHomeManager();
    var CalendarManager = Bridge.getScopeOf("ETCManager.js").CalendarManager();
    var AutoObtainManager = Bridge.getScopeOf("ETCManager.js").AutoObtainManager();

    var _LoadData, _Contain, _RandStat, _Find, _FindOption, _FindNamesinLocation, _MakeJson, _MakeJsonOption, _CompliteCharactor, _Save, _SaveOption, _RecordCallBack, _RecivePost;
    var _CreateCharactor, _DeleteCharactor, _GetSummonCnt, _SortItem, _FindCategory, _FindUnderSpecies, _ChangeStat, _ChangeRecipe, _ChangeSummonType, _MakeDungeonMap, _MakeDungeonInfo, _isMyConquest;

    var _HomeWorkReward;

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["CharactorList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_charactorList.push(libObject.clsCharactor(tmpList[idx], libObject.ENUM_MAKE_CHARACTOR.COMPLITE, 0));
        }

        tmpList = libCommon.read(libConst.fileNameList["CharOption"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_charOptionList.push(libObject.clsUserOption(tmpList[idx]));
        }
    }();

    _Contain = function(_id){
        for (var i = 0; i < m_charactorList.length; ++i) {
           if (m_charactorList[i].name === _id) {
              return i;
           }
        }
        return -1;
    };
    _Find = function(_id) {
        var i;
        for(i = 0; i < m_charDump.dumpList.length; ++i) {
            if (m_charDump.dumpList[i].name === _id) {
                m_charDump.resetTimeStemp(i);
                return m_charDump.dumpList[i];
            }
        }
        for (i = 0; i < m_charactorList.length; ++i) {
            if (m_charactorList[i].name === _id) {
                m_charDump.addDump(m_charactorList[i]);
                return m_charactorList[i];
            }
        }
        return null;
    };
    _FindOption = function(_id) {
        var i;
        for(i = 0; i < m_OptDump.dumpList.length; ++i) {
            if (m_OptDump.dumpList[i].name === _id) {
                m_OptDump.resetTimeStemp(i);
               return m_OptDump.dumpList[i];
            }
        }
        for (i = 0; i < m_charOptionList.length; ++i) {
           if (m_charOptionList[i].name === _id) {
              m_OptDump.addDump(m_charOptionList[i]);
              return m_charOptionList[i];
           }
        }
        return null;
    };
    _FindNamesinLocation = function(_country, _city, _facility, _field, _dungeon, _home) {
        var rtnAry = [];
        var loc = null;
        for (i = 0; i < m_charactorList.length; ++i) {
            loc = m_charactorList[i].getLocation();
            if (loc.country === _country && loc.city === _city && loc.facility === _facility && loc.field === _field && loc.dungeon === _dungeon && loc.home === _home) {
                rtnAry.push(m_charactorList[i]);
            }
        }
        return rtnAry;
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_charactorList.length; ++i) {
            jsonArray.push(m_charactorList[i].getJson());
        }
        return jsonArray;
    };
    _MakeJsonOption = function() {
        var jsonArray = [];
        for(var i = 0; i < m_charOptionList.length; ++i) {
            jsonArray.push(m_charOptionList[i].getJson());
        }
        return jsonArray;
    };
    _CreateCharactor = function(_id) {
        var origin = m_dbmanager.copyOriginChar("디폴트");
        origin.location.home = "";
        origin.location.dungeon = "";
        var obj = {
                    name:_id,
                    species:"",
                    rune:Number(origin.rune),
                    purchasestat:0,
                    status:{str:0, con:0, dex:0, agi:0, int:0, luk:0, ept:0, com:0, ptr:0},
                    ability:{attack:0, magic:0, defense:0, atkspeed:0, accuracy:0, avoid:0, critical:0, friendly:0, godevil:0, hp:0, mp:0, sp:0, dp:0, ap:0},
                    vitality:{technic:0, wisdom:0, insight:0},
                    accrue_aptime:-1,
                    talent:[],
                    skill:origin.skill,
                    smnskill:[],
                    smntype:"",
                    buff:[],
                    inventory:origin.inventory,
                    equipment:origin.equipment,
                    equipmentlevel:{head:0, body:0, leg:0, glove:0, shoes:0, righthand:0, lefthand:0, earing:0, necklace:0, ring1:0, ring2:0, backdeco:0},
                    location:origin.location,
                    miningtime:-1,
                    fellingtime:-1,
                    stoningtime:-1,
                    gettingtime:-1,
                    playdungeontime:-1,
                    passport:[origin.location.country],
                    questlist:[],
                    complitequest:[],
                    clan:"",
                    clanbuff:[],
                    recipe:[],
                    loan:{kind:"", index:"", rune:0, time:-1},
                    tower:[],
                    isdungeon:false,
                    isoccupy:false,
                    dungeonloc:null,
                    writer:"F"
        };
        m_charactorList.push(libObject.clsCharactor(obj, libObject.ENUM_MAKE_CHARACTOR.START, libConst.RandStatCount));
        origin = null;

        var opt = {
            name:_id,
            potionopt:{hp:{index:"", percent:""}, mp:{index:"", percent:""}, sp:{index:"", percent:""}, dp:{index:"", percent:""}},
            apopt:"",
            skillopt:{atkskill:[], healskill:[], helpskill:"", cureskill:""},
            pvpskillopt:{atkskill:[], healskill:[], helpskill:""},
            campingopt:{equipment:"", food:""},
            privateopt:"N",
            summonskillopt:[],
            pvpsummonskillOpt:[],
            huntingopt:"Y"
        };
        m_charOptionList.push(libObject.clsUserOption(opt));
        _Save();
        _SaveOption();
        RecordManager.newRecord(_id, obj.rune, obj.skill.length);
    };
    _RandStat = function(_charinfo) {
        if(_charinfo.getMakeStat() === 0)
            return null;

        var obj = {};
        obj.str = libCommon.Rand(5,18);
        obj.con = libCommon.Rand(5,18);
        obj.dex = libCommon.Rand(5,18);
        obj.agi = libCommon.Rand(5,18);
        obj.int = libCommon.Rand(5,18);
        obj.luk = libCommon.Rand(5,18);
        obj.ept = libCommon.Rand(5,18);
        obj.com = libCommon.Rand(5,18);
        obj.spr = libCommon.Rand(5,18);

        _charinfo.setStatus(obj);
        _charinfo.decMakeStat();
        return obj;
    };
    _CompliteCharactor = function(_charinfo) {
        if(_charinfo.getMakeStat() === 5)
            return false;

        _charinfo.setGeneration(libObject.ENUM_MAKE_CHARACTOR.COMPLITE);
        _charinfo.setMakeStat(0);
        _charinfo.calcAbility(true);

        RecordManager.setStatus(_charinfo.name, _charinfo.getStatus());

        _Save();
        _SaveOption();
        return true;
    };
    _DeleteCharactor = function(_id) {
        var i;
        m_charDump.clear();
        m_OptDump.clear();
        for (i = 0; i < m_charactorList.length; ++i) {
           if (m_charactorList[i].name === _id) {
              m_charactorList.splice(i,1);
              break;
           }
        }
        _Save();
        for (i = 0; i < m_charOptionList.length; ++i) {
           if (m_charOptionList[i].name === _id) {
              m_charOptionList.splice(i,1);
              break;
           }
        }
        _SaveOption();
    };
    _GetSummonCnt = function(_friendly, _godevil) {
        var count = _friendly + _godevil;
        var n_level, rtnCnt = libConst.SummonSkill_Defualt_Cnt;

        for(var i = 0; i < libConst.SummonSkill_NextLv_Cnt.length; ++i) {
            n_level = libConst.SummonSkill_NextLv_Cnt[i];
            count -= n_level;
            if(count < 0) {
                break;
            }
            rtnCnt++;
        }
        return rtnCnt;
    };

    _SortItem = function(_itemlist, _search) {
        var item, data;
        var rtnstr = "", i;
        var sortList = {potion:[], recall:[],skill:[], stat:[], species:[], reset:[], sapling:[], furniture:[],
                        etc:[],weapon:[],assis:[],wear:[],accessory:[],sundry:[], mines:[], fell:[], stone:[],
                        getting:[], anal:[], buff:[], recipe:[], fish:[], obtain:[], mercenary:[], box:[], quest:[],
                        battlecard:[]};
        for(i = 0; i < _itemlist.length; ++i) {
            item = _itemlist[i];
            switch(item.kind) {
                case libConst.ITEM_KIND["WEARITEM"] :
                    data =  m_dbmanager.getWearItem(item.index);
                    if(_search !== null && data.name.indexOf(_search) === -1) {
                        continue;
                    }
                    if(data.wearpos === "righthand") sortList.weapon.push("  - " + data.prefix + " " + data.name + (item.strength === 0?"":"+"+item.strength) + " x " + item.count + "\n");
                    else if(data.wearpos === "lefthand") sortList.assis.push("  - " + data.prefix + " " + data.name + (item.strength === 0?"":"+"+item.strength) + " x " + item.count + "\n");
                    else if(data.wearpos === "body" ||
                            data.wearpos === "leg" ||
                            data.wearpos === "shoes" ||
                            data.wearpos === "glove" ||
                            data.wearpos === "head") sortList.wear.push("  - " + data.prefix + " " + data.name + (item.strength === 0?"":"+"+item.strength) + " x " + item.count + "\n");
                    else if(data.wearpos === "ring1" ||
                            data.wearpos === "ring2" ||
                            data.wearpos === "earing" ||
                            data.wearpos === "necklace" ||
                            data.wearpos === "backdeco") sortList.accessory.push("  - " + data.prefix + " " + data.name + (item.strength === 0?"":"+"+item.strength) + " x " + item.count + "\n");

                    break;
                case libConst.ITEM_KIND["SUNDRYITEM"] :
                    data = m_dbmanager.getSundryItem(item.index);
                    if(_search !== null && data.name.indexOf(_search) === -1) {
                        continue;
                    }
                    if(m_dbmanager.getMine(item.index) !== null) {
                        sortList.mines.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    }
                    else if(m_dbmanager.getTree(item.index) !== null){
                        sortList.fell.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    }
                    else if(m_dbmanager.getStone(item.index) !== null){
                        sortList.stone.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    }
                    else if(m_dbmanager.getGetting(item.index) !== null){
                        sortList.getting.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    }
                    else if(m_dbmanager.getAnalyze(item.index) !== null){
                        sortList.anal.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    }
                    else {
                        sortList.sundry.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    }
                    break;
                case libConst.ITEM_KIND["FUNCTIONALITYITEM"] :
                    data =  m_dbmanager.getFunctionalityItem(item.index);
                    if(_search !== null && data.name.indexOf(_search) === -1) {
                        continue;
                    }
                    if(data.kind === "recovery" || data.kind === "recovery2") sortList.potion.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "recall") sortList.recall.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "skill" || data.kind === "summon") sortList.skill.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "stat") sortList.stat.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "species") sortList.species.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "reset") sortList.reset.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "sapling") sortList.sapling.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "furniture") sortList.furniture.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "buff") sortList.buff.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "recipe") sortList.recipe.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "fishinglod" || data.kind === "reel" || data.kind === "lure" || data.kind === "fishinggut") sortList.fish.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "obtain") sortList.obtain.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "mercenary") sortList.mercenary.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "storyquest" || data.kind === "repeatquest") sortList.quest.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "rune" || data.kind === "coin" || data.kind === "randombox" || data.kind === "package") sortList.box.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else if(data.kind === "battlecard") sortList.battlecard.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    else sortList.etc.push("  - " + data.prefix + " " + data.name + " x " + item.count + "\n");
                    break;
            }
        }

        for(var objs in sortList) {
            if(objs === "potion") rtnstr += "[포션류]\n";
            else if(objs === "buff") rtnstr += "[버프류]\n";
            else if(objs === "recall") rtnstr += "[리콜류]\n";
            else if(objs === "skill") rtnstr += "[스킬류]\n";
            else if(objs === "stat") rtnstr += "[스텟류]\n";
            else if(objs === "species") rtnstr += "[종족류]\n";
            else if(objs === "reset") rtnstr += "[초기화류]\n";
            else if(objs === "sapling") rtnstr += "[작물류]\n";
            else if(objs === "furniture") rtnstr += "[가구]\n";
            else if(objs === "recipe") rtnstr += "[레시피]\n";
            else if(objs === "fish") rtnstr += "[낚시장비]\n";
            else if(objs === "obtain") rtnstr += "[자동수집]\n";
            else if(objs === "mercenary") rtnstr += "[용병고용서]\n";
            else if(objs === "box") rtnstr += "[상자류]\n";
            else if(objs === "quest") rtnstr += "[퀘스트]\n";
            else if(objs === "etc") rtnstr += "[기타]\n";
            else if(objs === "weapon") rtnstr += "[무기]\n";
            else if(objs === "assis") rtnstr += "[보조무기]\n";
            else if(objs === "wear") rtnstr += "[옷]\n";
            else if(objs === "accessory") rtnstr += "[악세사리]\n";
            else if(objs === "anal") rtnstr += "[미확인템]\n";
            else if(objs === "mines") rtnstr += "[광물]\n";
            else if(objs === "fell") rtnstr += "[벌목]\n";
            else if(objs === "stone") rtnstr += "[광석]\n";
            else if(objs === "getting") rtnstr += "[채집]\n";
            else if(objs === "sundry") rtnstr += "[잡템]\n";
            else if(objs === "battlecard") rtnstr += "[배틀카드]\n";
            for(i = 0; i < sortList[objs].length; ++i) {
                rtnstr += sortList[objs][i];
            }
        }
        return rtnstr;
    };
    _FindCategory = function(_itemlist, _keyword) {
        var rtnArray = [], item, obj;
        var funcCompare = function(_item, _kind) {
            if(_item.kind === libConst.ITEM_KIND["FUNCTIONALITYITEM"]) {
                var data =  m_dbmanager.getFunctionalityItem(_item.index);
                if(data.kind ===_kind) {
                    return {kind:_item.kind, index:_item.index, count:_item.count};
                }
            }
            else if(_item.kind === libConst.ITEM_KIND["SUNDRYITEM"]) {
                if((_kind === "mines" && m_dbmanager.getMine(_item.index) !== null) ||
                   (_kind === "fell" && m_dbmanager.getTree(_item.index) !== null) ||
                   (_kind === "stone" && m_dbmanager.getStone(_item.index) !== null) ||
                   (_kind === "getting" && m_dbmanager.getGetting(_item.index) !== null) ||
                   (_kind === "anal" && m_dbmanager.getAnalyze(_item.index) !== null) ||
                   (_kind === "sundry" && m_dbmanager.getMine(_item.index) === null &&
                                          m_dbmanager.getTree(_item.index) === null &&
                                          m_dbmanager.getStone(_item.index) === null &&
                                          m_dbmanager.getGetting(_item.index) === null &&
                                          m_dbmanager.getAnalyze(_item.index) === null)) {
                    return {kind:_item.kind, index:_item.index, count:_item.count};
                }
            }
            return null;
        };
        for(i = 0; i < _itemlist.length; ++i) {
            item = _itemlist[i];
            switch(_keyword) {
                case "포션류":
                    obj = funcCompare(item, "recovery");
                    if(obj !== null) {rtnArray.push(obj);}
                    obj = funcCompare(item, "recovery2");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "리콜류":
                    obj = funcCompare(item, "recall");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "스킬류":
                    obj = funcCompare(item, "skill");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "스텟류":
                    obj = funcCompare(item, "stat");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "종족류":
                    obj = funcCompare(item, "species");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "초기화류":
                    obj = funcCompare(item, "reset");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "작물류":
                    obj = funcCompare(item, "sapling");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "가구":
                    obj = funcCompare(item, "furniture");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "미확인템":
                    obj = funcCompare(item, "anal");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "광물":
                    obj = funcCompare(item, "mines");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "벌목":
                    obj = funcCompare(item, "fell");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "광석":
                    obj = funcCompare(item, "stone");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "채집":
                    obj = funcCompare(item, "getting");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;
                case "잡템":
                    obj = funcCompare(item, "sundry");
                    if(obj !== null) {rtnArray.push(obj);}
                    break;

                default:
                    return null;
            }
        }
        return rtnArray;
    };

    _FindUnderSpecies = function(_specname, _rtnAry) {
        var dbList = m_dbmanager.getUnderSpeciesList(_specname);
        
        for(var i = 0; i < dbList.length; ++i) {
            _FindUnderSpecies(dbList[i], _rtnAry);
        }

        _rtnAry.push(_specname);
    };

    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("CharactorInfo", function() {
                libCommon.write(libConst.fileNameList["CharactorList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["CharactorList"], _MakeJson());
        }
    };
    
    _SaveOption = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("CharOption", function() {
                libCommon.write(libConst.fileNameList["CharOption"], _MakeJsonOption());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["CharOption"], _MakeJsonOption());
        }
    };

    _RecordCallBack = function(_property, _name) {
        var user = _Find(_name);
        if(user.isTalent(_property.index) === -1){
            user.addTalent(_property.index);
            var incStat = _property.stat;
            for(var i in incStat) {
                user.setStatusForName(i, Number(incStat[i]));
            }

            RecordManager.setStatus(user.name, user.getStatus());
            user.calcAbility(false);
            _Save();

            libCommon.replyID(_name, " 특성 [" + _property.name + "] 을(를) 획득함.");
            libCommon.AlarmMainRoom("축하 >>> [" + _name + "] 님이 특성 [" + _property.name + "] 을(를) 획득하였습니다.");
        }
    };
    RecordManager.setEventListerner(_RecordCallBack);

    _RecivePost = function(_user, _items, _rune) {
        var rtnstr = "", item;
        for(var i = 0; i < _items.length; ++i) {
            item = _items[i];
            _user.addItem(item.kind, item.index,item.count);
            rtnstr += " - " + item.name + "을(를) 수령합니다.\n";
        }
        if(Number(_rune) !== 0) {
            _user.addRune(Number(_rune));
            rtnstr += " - " + Number(_rune) + "Rune을 수령합니다.\n";
        }

        return rtnstr;
    };

    _ChangeStat = function(_stat) {
        var stat;
        switch (_stat) {
          case "힘":
            stat = "str";
            break;
          case "체질":
            stat = "con";
            break;
          case "민첩":
            stat = "dex";
            break;
          case "재주":
            stat = "agi";
            break;
          case "지능":
            stat = "int";
            break;
          case "운":
            stat = "luk";
            break;
          case "효율":
            stat = "ept";
            break;
          case "교감":
            stat = "com";
            break;
          case "영혼":
            stat = "spr";
            break;
          case "str":
            stat = "힘";
            break;
          case "con":
            stat = "체질";
            break;
          case "dex":
            stat = "민첩";
            break;
          case "agi":
            stat = "재주";
            break;
          case "int":
            stat = "지능";
            break;
          case "luk":
            stat = "운";
            break;
          case "ept":
            stat = "효율";
            break;
          case "com":
            stat = "교감";
            break;
          case "spr":
            stat = "영혼";
            break;
          default:
            return "잘못된 스테이터스";
        }
        return stat;
    };
    _ChangeRecipe = function(_option) {
        var rtn;
        switch (_option) {
          case "potion":
            rtn = "포션";
            break;
          case "accessory":
            rtn = "악세서리";
            break;
          case "book":
            rtn = "서적";
            break;
          case "equipment":
            rtn = "장비";
            break;
          default:
            return "잘못된 스테이터스";
        }
        return rtn;
    };
    _ChangeSummonType = function(_type) {
        var rtn;
        switch (_type) {
          case "element":
            rtn = "원소계통";
            break;
          case "animal":
            rtn = "자연계통";
            break;
          case "divine":
            rtn = "신성계통";
            break;
          case "chaos":
            rtn = "혼돈계통";
            break;
          default:
            return "잘못된 스테이터스";
        }
        return rtn;
    };
    _MakeDungeonMap = function(_dungeonidx) {
        var findFunc = function(_mapdb, _gatetype) {
            var rtnArray = [];
            for(var i = 0; i < _mapdb.length; ++i) {
                if(_mapdb[i].gate === _gatetype) {
                    rtnArray.push(_mapdb[i]);
                }
            }
            return rtnArray;
        };
        var Matching = function(_queue, _obj, _ispush) {
            for(var i = 0; i < _queue.length; ++i) {
                if(_queue[i].getDirectionCount() === libConst.DungeonCrossCount || _obj.getDirectionCount() === libConst.DungeonCrossCount) {
                    continue;
                }
                if(_queue[i].Index === _obj.Index) {
                    continue;
                }
                if(_queue[i].ContainIndex(_obj.Index) || _obj.ContainIndex(_queue[i].Index)) {
                    continue;
                }

                if(_queue[i].Mappush(_obj)) {
                    if(_ispush)
                        _queue.push(_obj);
                    break;
                }
            }
        };

        var MapDBList = db_Manager.getDungeonMapList(_dungeonidx);
        var rootMap = null;
        var findMap_entrance = findFunc(MapDBList, "entrance");
        var findMap_common = findFunc(MapDBList, "common");
        var findMap_rare = findFunc(MapDBList, "rare");
        var findMap_middle = findFunc(MapDBList, "middle");
        var findMap_exit = findFunc(MapDBList, "exit");
        var waitingQueue = [];

        var i, j, rand, tmptarget, tmpobj;
        
        if(findMap_entrance.length > 0) {
            rand = libCommon.Rand(0,findMap_entrance.length - 1);
            tmptarget = findMap_entrance[rand];
            rootMap = new libCommon.MapLinkedList(tmptarget.index, tmptarget.gate, tmptarget.name, tmptarget.powerrate, tmptarget.boss, tmptarget.monster, tmptarget.mobcount, tmptarget.rune, tmptarget.item, tmptarget.description);

            waitingQueue.push(rootMap);
        }

        if(rootMap !== null) {
            for(i = 0; i < findMap_common.length; ++i) {
                tmptarget = findMap_common[i];
                tmpobj = new libCommon.MapLinkedList(tmptarget.index, tmptarget.gate, tmptarget.name, tmptarget.powerrate, tmptarget.boss, tmptarget.monster, tmptarget.mobcount, tmptarget.rune, tmptarget.item, tmptarget.description);
                
                Matching(waitingQueue, tmpobj, true);
            }
            for(i = 0; i < findMap_rare.length; ++i) {
                tmptarget = findMap_rare[i];
                tmpobj = new libCommon.MapLinkedList(tmptarget.index, tmptarget.gate, tmptarget.name, tmptarget.powerrate, tmptarget.boss, tmptarget.monster, tmptarget.mobcount, tmptarget.rune, tmptarget.item, tmptarget.description);
                
                Matching(waitingQueue, tmpobj, true);
            }
            for(i = 0; i < findMap_middle.length; ++i) {
                tmptarget = findMap_middle[i];
                tmpobj = new libCommon.MapLinkedList(tmptarget.index, tmptarget.gate, tmptarget.name, tmptarget.powerrate, tmptarget.boss, tmptarget.monster, tmptarget.mobcount, tmptarget.rune, tmptarget.item, tmptarget.description);
                
                Matching(waitingQueue, tmpobj, true);
            }
            for(i = 0; i < findMap_exit.length; ++i) {
                tmptarget = findMap_exit[i];
                tmpobj = new libCommon.MapLinkedList(tmptarget.index, tmptarget.gate, tmptarget.name, tmptarget.powerrate, tmptarget.boss, tmptarget.monster, tmptarget.mobcount, tmptarget.rune, tmptarget.item, tmptarget.description);
                
                Matching(waitingQueue, tmpobj, true);
            }
        }

        for(i = 0; i < libConst.DungeonComplexity; ++i) {
            for(j = 0; j < waitingQueue.length; ++j) {
                tmpobj = waitingQueue[j];
                Matching(waitingQueue, tmpobj, false);
            }
        }

        return rootMap;
    };
    _MakeDungeonInfo = function(_map, _isoccupy) {
        var totalstr = "{" + _map.Name + "}\n";
        var fix = libConst.CommandPrefix;
        totalstr += "맵 종류 : " + _map.Gate + "\n\n";

        totalstr += "[파티장 메뉴]\n";
        if(_isoccupy) {
            totalstr += " " + fix + "점령지\n " + fix + "점령지이동\n " + fix + "점령지전투\n " + fix + "점령지포기\n\n";
        }
        else {
            totalstr += " " + fix + "던전\n " + fix + "던전이동\n " + fix + "던전전투\n " + fix + "던전포기\n\n";
        }
        

        totalstr += "[이동 가능 목록]\n";
        for(i = 0; i < _map.Direction.length; ++i) {
            totalstr += (i+1) + ". " + _map.Direction[i].Name + "\n";
        }
        totalstr += "\n";
        

        if(_map.isClear) {
            totalstr += "이미 클리어된 장소 입니다.\n";
        }
        else {
            totalstr += "출현 몬스터 수 : " + _map.MobCount + "\n";
            if(_map.Boss !== "") {
                totalstr += "보스 : " + m_dbmanager.getMonster(_map.Boss).name + "\n";
            }

            totalstr += "[출현 몬스터]\n";
            for(i = 0; i < _map.Monster.length; ++i) {
                totalstr += "  L " + m_dbmanager.getMonster(_map.Monster[i]).name + "\n";
            }

            totalstr += "\n[클리어 보상]\n";
            totalstr += "  L : " + _map.Rune + " rune\n";
            for(i = 0; i < _map.ClearItem.length; ++i) {
                item = _map.ClearItem[i];
                totalstr += "  L " + m_dbmanager.getItem(item.itemkind, item.itemIdx).name + (item.strength===""?"":("+" + item.strength)) + " x" + item.count + "\n";
            }
        }
        return totalstr;
    };

    _isMyConquest = function(_loc, _conquestlist) {
        var rtnValue = false;
        var conquest = null;
        for(var i = 0; i < _conquestlist.length; ++i) {
            conquest = _conquestlist[i];
            if(conquest.nation === _loc.country && conquest.city === _loc.city) {
                rtnValue = true;
                break;
            }
        }
        return rtnValue;
    };

    _HomeWorkReward = function(_user, _rewardlist) {
        var quest = null;
        var itemList = null, item, itemDB;
        var rtnStr = "";
        if(_rewardlist !== null) {
            for(var i = 0; i < _rewardlist.length; ++i) {
                quest = m_dbmanager.getHomework(_rewardlist[i]);
                if(quest !== null) {
                    rtnStr += (i+1) + ". " + quest.title + " : " + quest.contents + "\n";
                    itemList = quest.item;

                    _user.addRune(Number(quest.rune));
                    rtnStr += "   L 보상 룬 : " + quest.rune + " rune\n";

                    for(var j = 0; j < itemList.length; ++j) {
                        item = itemList[j];
                        itemDB = m_dbmanager.getItem(item.itemkind, item.itemIdx);
                        _user.addItem(item.itemkind, item.itemIdx, item.count);
                        rtnStr += "   L" + itemDB.name + "x" + item.count + "\n";
                    }
                    rtnStr += "\n";
                }
            }
        }
        return rtnStr;
    };

    return {
        getRecordManager:RecordManager,
        getPetManager:PetManager,
        getMercenaryManager:MercenaryManager,
        getExplorerManager:ExplorerManager,
        getMyHomeManager:MyHomeManager,
        deleteCharactor:function(_id) {
            _DeleteCharactor(_id);
            PetManager.Delete(_id);
            MyHomeManager.Delete(_id);
            MercenaryManager.Delete(_id);
            ExplorerManager.Delete(_id);
            BattleManager.Delete(_id);
            RecordManager.Delete(_id);
            WorldBossManager.Delete(_id);
            AutoObtainManager.Delete(_id);
            CalendarManager.removeTodayUser(_id);
        },
        Tutorial:function(_id, _command) {
            var obj = _Find(_id), loc, locName = "", tmpTuto = null;
            var rtnStr = "";
            if(obj === null) {
                rtnStr = m_dbmanager.getTutorial("nonChar", "").description;
            }
            else {
                if(_command === null) {
                    loc = obj.getLocation(); // {country, city, facility, field, dungeon, home}
                    switch(obj.getGeneration()) {
                        case libObject.ENUM_MAKE_CHARACTOR.START:
                            tmpTuto = m_dbmanager.getTutorial("nonSpec", "");
                            if(tmpTuto !== null)
                                rtnStr = tmpTuto.description;
                            break;
                        case libObject.ENUM_MAKE_CHARACTOR.MAKING:
                            tmpTuto = m_dbmanager.getTutorial("nonStat", "");
                            if(tmpTuto !== null)
                                rtnStr = tmpTuto.description;
                            break;
                        case libObject.ENUM_MAKE_CHARACTOR.COMPLITE:
                            libCommon.log_i(JSON.stringify(loc));
                            if(loc.home !== "") {
                                rtnStr += "[마이홈 튜토리얼]\n\n";
                                tmpTuto = m_dbmanager.getTutorial("myHome", "");
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description + "\n\n";
                            }
                            else if(loc.dungeon !== "") {
                                locName = m_dbmanager.getDungeon(loc.dungeon).name;
                                rtnStr += "[" + locName + " 튜토리얼]\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Dungeon", "");
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description + "\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Map", locName);
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description;
                            }
                            else if(loc.field !== "") {
                                locName = m_dbmanager.getField(loc.field).name;
                                rtnStr += "[" + locName + " 튜토리얼]\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Field", "");
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description + "\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Map", locName);
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description;
                            }
                            else if(loc.facility !== "") {
                                locName = m_dbmanager.getFacility(loc.facility).name;
                                rtnStr += "[" + locName + " 튜토리얼]\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Facility", "");
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description + "\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Map", locName);
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description;
                            }
                            else if(loc.city !== "") {
                                locName = m_dbmanager.getCity(loc.city).name;
                                rtnStr += "[" + locName + " 튜토리얼]\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("City", "");
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description + "\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Map", locName);
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description;
                            }
                            else {
                                locName = m_dbmanager.getNation(loc.country).name;
                                rtnStr += "[" + locName + " 튜토리얼]\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Country", "");
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description + "\n\n";
    
                                tmpTuto = m_dbmanager.getTutorial("Map", locName);
                                if(tmpTuto !== null)
                                    rtnStr += tmpTuto.description;
                            }
    
                            break;
                    }
                }
                else {
                    rtnStr += "[" + _command + " 튜토리얼]\n\n";
                    tmpTuto = m_dbmanager.getTutorial("Command", _command);
                    if(tmpTuto !== null)
                        rtnStr += tmpTuto.description;
                }
            }

            return rtnStr;
        },
        isMyCharactor:function(_id) {
            return (_Contain(_id) === -1?false:true);
        },
        isCompliteMaking:function(_id) {
            var obj = _Find(_id);
            if(obj !== null) return obj.getGeneration();
            else return libObject.ENUM_MAKE_CHARACTOR.NONE;
        },
        getSkillinfo:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[보유한 스킬]\n\n";
                var list = obj.getSkill();
                var skillDB;
                for(var i = 0; i < list.length; ++i) {
                    skillDB =  m_dbmanager.getSkill(list[i]);
                    rtnstr += "  - (" + skillDB.kind + ") " + skillDB.name + "\n";
                }

            }
            return rtnstr;
        },
        getSummonSkillinfo:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[보유한 소환 스킬]\n\n";
                var list = obj.getSummonSkill();
                var skillDB;
                for(var i = 0; i < list.length; ++i) {
                    skillDB =  m_dbmanager.getSummonSkill(list[i]);
                    rtnstr += "  - (" + skillDB.type + ") " + skillDB.name + "\n";
                }

            }
            return rtnstr;
        },
        getTalentinfo:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[보유한 특성]\n\n";
                var list = obj.getTalent();
                var skillDB;
                for(var i = 0; i < list.length; ++i) {
                    skillDB =  m_dbmanager.getProperty(list[i]);
                    rtnstr += "  - " + skillDB.name + "\n";
                }
            }
            return rtnstr;
        },
        makeCharactor:function(_id) {
            var idx = _Contain(_id);
            if(idx === -1) {
                _CreateCharactor(_id);
                return true;
            }
            else {
                return false;
            }
        },
        selectSpecies:function(_id, _species) {
            var obj = _Find(_id);
            if(obj !== null && obj.getGeneration() === libObject.ENUM_MAKE_CHARACTOR.START)
            {
                obj.setSpecies(_species);
                obj.setOriginChar();
                obj.setGeneration(libObject.ENUM_MAKE_CHARACTOR.MAKING);
                return true;
            }
            return false;
        },
        RandStat:function(_id) {
            var obj = _Find(_id);
            if(obj !== null && obj.getGeneration() === libObject.ENUM_MAKE_CHARACTOR.MAKING)
            {
                return _RandStat(obj);
            }

            return null;
        },
        RemainChangeStat:function(_id) {
            var obj = _Find(_id);
            return obj.getMakeStat();
        },
        CompliteCharactor:function(_id) {
            var obj = _Find(_id);
            if(obj !== null && obj.getGeneration() === libObject.ENUM_MAKE_CHARACTOR.MAKING)
            {
                return _CompliteCharactor(obj);
            }

            return false;
        },
        Charinfo:function(_id, _species) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                var uchar = obj.getJson();
                var uspecies = m_dbmanager.getSpecies(uchar.species);
                var tmpVar;
                var i = 0;
                {
                    rtnstr += "[" + uchar.name + " 캐릭 정보]\n";
                    rtnstr += "종족 : " + uchar.species + "\n";
                    rtnstr += "룬 : " + uchar.rune + "\n";
                    rtnstr += (obj.getSummonType() === ""?"": _ChangeSummonType(obj.getSummonType()) + " 소환사\n");
                    if(uchar.clan !== "") {
                        rtnstr += "클랜 : " + uchar.clan + "\n";
                        for(i = 0; i < uchar.clanbuff.length; ++i) {
                            if(uchar.clanbuff[i].target !== "maxuser")
                                rtnstr += "   L " + uchar.clanbuff[i].target + " +" + uchar.clanbuff[i].percent + "% \n";
                        }
                    }
                    rtnstr += "(현재 위치)\n";
                    rtnstr += "  - 나라 : " + (m_dbmanager.isNation(uchar.location.country)?m_dbmanager.getNation(uchar.location.country).name:"") + "\n";
                    rtnstr += "  - 마을 : " + (m_dbmanager.isCity(uchar.location.city)?m_dbmanager.getCity(uchar.location.city).name:"") + "\n";
                    rtnstr += "  - 건물 : " + (m_dbmanager.isFacility(uchar.location.facility)?m_dbmanager.getFacility(uchar.location.facility).name:"") + "\n";
                    rtnstr += "  - 필드 : " + (m_dbmanager.isField(uchar.location.field)?m_dbmanager.getField(uchar.location.field).name:"") + "\n";
                    rtnstr += "  - 던전 : " + (m_dbmanager.isDungeon(uchar.location.dungeon)?m_dbmanager.getDungeon(uchar.location.dungeon).name:"") + "\n";
                    rtnstr += "(스테이터스 정보)\n";
                    rtnstr += "  - 힘 : " + uchar.status.str + (uspecies.inc_stat.str === "1" ? "\n":( "( x" + uspecies.inc_stat.str + ")\n"));
                    rtnstr += "  - 체질 : " + uchar.status.con + (uspecies.inc_stat.con === "1" ? "\n":( "( x" + uspecies.inc_stat.con + ")\n"));
                    rtnstr += "  - 민첩 : " + uchar.status.dex + (uspecies.inc_stat.dex === "1" ? "\n":( "( x" + uspecies.inc_stat.dex + ")\n"));
                    rtnstr += "  - 재주 : " + uchar.status.agi + (uspecies.inc_stat.agi === "1" ? "\n":( "( x" + uspecies.inc_stat.agi + ")\n"));
                    rtnstr += "  - 지능 : " + uchar.status.int + (uspecies.inc_stat.int === "1" ? "\n":( "( x" + uspecies.inc_stat.int + ")\n"));
                    rtnstr += "  - 운 : " + uchar.status.luk + (uspecies.inc_stat.luk === "1" ? "\n":( "( x" + uspecies.inc_stat.luk + ")\n"));
                    rtnstr += "  - 효율 : " + uchar.status.ept + (uspecies.inc_stat.ept === "1" ? "\n":( "( x" + uspecies.inc_stat.ept + ")\n"));
                    rtnstr += "  - 교감 : " + uchar.status.com + (uspecies.inc_stat.com === "1" ? "\n":( "( x" + uspecies.inc_stat.com + ")\n"));
                    rtnstr += "  - 영혼 : " + uchar.status.spr + (uspecies.inc_stat.spr === "1" ? "\n":( "( x" + uspecies.inc_stat.spr + ")\n"));
                    rtnstr += "(능력치 정보)\n";
                    rtnstr += "  - 공격력 : " + uchar.ability.attack + "\n";
                    rtnstr += "  - 마법력 : " + uchar.ability.magic + "\n";
                    rtnstr += "  - 방어력 : " + uchar.ability.defense + "\n";
                    rtnstr += "  - 공격속도 : " + uchar.ability.atkspeed + "\n";
                    rtnstr += "  - 정확도 : " + uchar.ability.accuracy + "\n";
                    rtnstr += "  - 회피력 : " + uchar.ability.avoid + "\n";
                    rtnstr += "  - 치명률 : " + uchar.ability.critical + "\n";
                    rtnstr += "  - 친화력 : " + uchar.ability.friendly + "\n";
                    rtnstr += "  - 신마력 : " + uchar.ability.godevil + "\n";
                    rtnstr += "  - 체력 : " + uchar.ability.hp + "\n";
                    rtnstr += "  - 마력 : " + uchar.ability.mp + "\n";
                    rtnstr += "  - 기력 : " + uchar.ability.sp + "\n";
                    rtnstr += "  - 정신력 : " + uchar.ability.dp + "\n";
                    rtnstr += "  - 행동력 : " + uchar.ability.ap + "\n";
                    rtnstr += "(생활 수치 정보)\n";
                    rtnstr += "  - 기술력 : " + uchar.vitality.technic + "\n";
                    rtnstr += "  - 지혜 : " + uchar.vitality.wisdom + "\n";
                    rtnstr += "  - 통찰력 : " + uchar.vitality.insight + "\n\n";

                    rtnstr += "(특성 정보)\n";
                    for(i = 0; i < uchar.talent.length;++i){
                        rtnstr += "[" + m_dbmanager.getProperty(uchar.talent[i]).name + "], ";
                    }
                    rtnstr += "\n\n";

                    rtnstr += "(스킬 정보)\n";
                    for(i = 0; i < uchar.skill.length;++i){
                        rtnstr += "[" + m_dbmanager.getSkill(uchar.skill[i]).name + "], ";
                    }
                    rtnstr += "\n\n";

                    rtnstr += "(탑 현재 정보)\n";
                    for(i = 0; i < uchar.tower.length;++i){
                        rtnstr += "  L " + m_dbmanager.getFacility(uchar.tower[i].facility).name + " : " + uchar.tower[i].floor + "층\n";
                    }
                    rtnstr += "\n\n";

                    rtnstr += "(가방 정보)\n";
                    for(i = 0; i < uchar.inventory.length; ++i){
                        tmpVar = uchar.inventory[i];
                        if(tmpVar.kind === libConst.ITEM_KIND["WEARITEM"]) {
                            rtnstr += "  - " + m_dbmanager.getWearItem(tmpVar.index).name + " x " + tmpVar.count + "\n";
                        }
                        else if(tmpVar.kind === libConst.ITEM_KIND["SUNDRYITEM"]) {
                            rtnstr += "  - " + m_dbmanager.getSundryItem(tmpVar.index).name + " x " + tmpVar.count + "\n";
                        }
                        else if(tmpVar.kind === libConst.ITEM_KIND["FUNCTIONALITYITEM"]) {
                            rtnstr += "  - " + m_dbmanager.getFunctionalityItem(tmpVar.index).name + " x " + tmpVar.count + "\n";
                        }

                    }
                    rtnstr += "\n";

                    rtnstr += "(장착 정보)\n";
                    rtnstr += "  - 머리 : " +(m_dbmanager.isWearItem(uchar.equipment.head)?m_dbmanager.getWearItem(uchar.equipment.head).name:"") + "\n";
                    rtnstr += "  - 몸 : " + (m_dbmanager.isWearItem(uchar.equipment.body)?m_dbmanager.getWearItem(uchar.equipment.body).name:"") + "\n";
                    rtnstr += "  - 다리 : " + (m_dbmanager.isWearItem(uchar.equipment.leg)?m_dbmanager.getWearItem(uchar.equipment.leg).name:"") + "\n";
                    rtnstr += "  - 손 : " + (m_dbmanager.isWearItem(uchar.equipment.glove)?m_dbmanager.getWearItem(uchar.equipment.glove).name:"") + "\n";
                    rtnstr += "  - 발 : " + (m_dbmanager.isWearItem(uchar.equipment.shoes)?m_dbmanager.getWearItem(uchar.equipment.shoes).name:"") + "\n";
                    rtnstr += "  - 무기 : " + (m_dbmanager.isWearItem(uchar.equipment.righthand)?m_dbmanager.getWearItem(uchar.equipment.righthand).name:"") + "\n";
                    rtnstr += "  - 보조무기 : " + (m_dbmanager.isWearItem(uchar.equipment.lefthand)?m_dbmanager.getWearItem(uchar.equipment.lefthand).name:"") + "\n";
                    rtnstr += "  - 귀걸이 : " + (m_dbmanager.isWearItem(uchar.equipment.earing)?m_dbmanager.getWearItem(uchar.equipment.earing).name:"") + "\n";
                    rtnstr += "  - 목걸이 : " + (m_dbmanager.isWearItem(uchar.equipment.necklace)?m_dbmanager.getWearItem(uchar.equipment.necklace).name:"") + "\n";
                    rtnstr += "  - 반지1 : " + (m_dbmanager.isWearItem(uchar.equipment.ring1)?m_dbmanager.getWearItem(uchar.equipment.ring1).name:"") + "\n";
                    rtnstr += "  - 반지2 : " + (m_dbmanager.isWearItem(uchar.equipment.ring2)?m_dbmanager.getWearItem(uchar.equipment.ring2).name:"") + "\n";
                    rtnstr += "  - 등장식 : " + (m_dbmanager.isWearItem(uchar.equipment.backdeco)?m_dbmanager.getWearItem(uchar.equipment.backdeco).name:"") + "\n";
                }
            }
            return rtnstr;
        },
        getGuide:function(_id, _clanMng) {
            var obj = _Find(_id);
            var rtnstr = "", tmpfield, tmpdungeon;
            var fix = libConst.CommandPrefix;
            var myConquest = true;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                var loc = obj.getLocation();
                var passport = obj.getPassPort();
                var nationInfo = m_dbmanager.getNation(loc.country);
                var cityInfo = m_dbmanager.getCity(loc.city);
                var facilityInfo = m_dbmanager.getFacility(loc.facility);
                var fieldInfo = m_dbmanager.getField(loc.field);
                var dungeonInfo = m_dbmanager.getDungeon(loc.dungeon);
                var isMyHome = loc.home;
                var i, userNameList, tmpcity, questList, questInfo, cnt;
                var conquestClanName = _clanMng.getClanConquestByLoc(loc.country, loc.city);

                rtnstr += "[유저 정보]\n";
                rtnstr += " - 이름 : " + obj.name + "\n";
                rtnstr += " - 종족 : " + obj.getSpecies() + "\n";
                if(libConst.RuneConsume) {
                    rtnstr += " - 마석흡수 : " + obj.getPurchaseStat() + "회\n";
                    rtnstr += "  L 다음 : " + obj.calcNextPruchaseStat() + " rune\n";
                    
                }
                if(obj.getClanName() !== "")
                    rtnstr += " - 소속클랜 : " + obj.getClanName() + "\n";
                
                rtnstr += "\n";

                rtnstr += "[유저 위치]\n";
                if(nationInfo !== null)
                    rtnstr += " - " + nationInfo.name + nationInfo.kind + "\n";
                if(cityInfo !== null)
                    rtnstr += " - (" + cityInfo.kind + ") " + cityInfo.name + "\n";
                if(conquestClanName !== "")
                    rtnstr += "    L 점령중인 클랜 : " + conquestClanName + "\n";
                if(facilityInfo !== null)
                    rtnstr += " - " + facilityInfo.name + "\n";
                if(fieldInfo !== null)
                    rtnstr += " - " + fieldInfo.name + "\n";
                if(dungeonInfo !== null)
                    rtnstr += " - " + dungeonInfo.name + "\n";
                if(isMyHome !== "")
                    rtnstr += " - 마이홈\n";

                rtnstr += "\n";
                rtnstr += "[행동 메뉴]\n";
                if(isMyHome !== "") {
                    rtnstr += "  " + fix + "마이홈정보\n";
                    rtnstr += "  " + fix + "시설정보\n";
                    rtnstr += "  " + fix + "증축\n";
                    rtnstr += "  " + fix + "창고넣기\n";
                    rtnstr += "  " + fix + "창고꺼내기\n";
                    rtnstr += "  " + fix + "배치\n";
                    rtnstr += "  " + fix + "수거\n";
                    rtnstr += MyHomeManager.getCommand(_id, true);
                    rtnstr += "  " + fix + "떠나기\n";
                }
                else if(fieldInfo !== null || facilityInfo !== null || dungeonInfo !== null) {
                    if(fieldInfo !== null) {
                        rtnstr += "  " + fix + "사냥\n";
                        rtnstr += "  " + fix + "자동사냥\n";
                        if(fieldInfo.boss !== "")
                            rtnstr += "  " + fix + "보스소환\n";
                        rtnstr += MyHomeManager.getCommand(_id, false);
                        rtnstr += "  " + fix + "떠나기\n";
                    }
                    else if(facilityInfo !== null){
                        for(i = 0; i < facilityInfo.action.length; ++i){
                            rtnstr += "  " + fix + facilityInfo.action[i] + "\n";
                        }
                        rtnstr += MyHomeManager.getCommand(_id, false);
                        rtnstr += "  " + fix + "떠나기\n";
                        rtnstr += "\n";
                        questList = m_dbmanager.getQuestinCity(loc.city, loc.facility);
                        rtnstr += "[퀘스트 목록]\n";
                        for(i = 0; i < questList.length; ++i) {
                            questInfo = questList[i];
                            if(!obj.isCompliteQuest(questInfo.conversation.questindex)){
                                if(questInfo.conversation.condition === "" || obj.isCompliteQuest(questInfo.conversation.condition)) {
                                    rtnstr += " - " + questInfo.person.character + " : " + m_dbmanager.getQuest(questInfo.conversation.questindex).title.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix);
                                    if(obj.isQuest(questInfo.conversation.questindex)){
                                        rtnstr += "(진행중)";
                                    }
                                    rtnstr += "\n";
                                }
                            }
                        }
                        rtnstr += "\n";
                    }
                    else if(dungeonInfo !== null) {
                        rtnstr += "  " + fix + "던전진입\n";
                        rtnstr += MyHomeManager.getCommand(_id, false);
                        rtnstr += "  " + fix + "떠나기\n";
                    }
                }
                else if(cityInfo !== null) {
                    if(cityInfo.occupy === "Y") {
                        myConquest = _isMyConquest(loc, _clanMng.getConquest(_id));
                    }

                    cnt = 1;
                    rtnstr += "  " + fix + "이동\n";
                    if(cityInfo.occupy === "Y")
                        rtnstr += "  " + fix + "점령하기\n";
                    rtnstr += MyHomeManager.getCommand(_id, false);
                    rtnstr += "  " + fix + "떠나기\n\n";

                    rtnstr += "[이동 가능한 지역]\n";
                    for(i = 0; i < cityInfo.facilities.length; ++i) {
                        rtnstr += " - " + cnt + ". " + m_dbmanager.getFacility(cityInfo.facilities[i]).name + ( myConquest?" ":" (진입불가)") + "\n";
                        cnt++;
                    }
                    rtnstr += "\n";

                    rtnstr += "[몬스터 필드]\n";
                    for(i = 0; i < cityInfo.fields.length; ++i) {
                        tmpfield = m_dbmanager.getField(cityInfo.fields[i]);
                        rtnstr += " - " + cnt + ". " + tmpfield.name + ( myConquest?" (AP " + tmpfield.needap + "소모)":" (진입불가)") + "\n";
                        cnt++;
                    }
                    rtnstr += "\n";

                    rtnstr += "[파티던전]\n";
                    for(i = 0; i < cityInfo.dungeon.length; ++i) {
                        tmpdungeon = m_dbmanager.getDungeon(cityInfo.dungeon[i]);
                        rtnstr += " - " + cnt + ". " + tmpdungeon.name + ( myConquest?" ":" (진입불가)") + "\n";
                        cnt++;
                    }
                    rtnstr += "\n";

                    if(MyHomeManager.CompareLoc(_id, loc)){
                        rtnstr += "[개인 주택]\n";
                        rtnstr += " - 마이홈\n";
                    }
                    rtnstr += "\n";
                    questList = m_dbmanager.getQuestinCity(loc.city, "all");
                    rtnstr += "[퀘스트 목록]\n";
                    for(i = 0; i < questList.length; ++i) {
                        questInfo = questList[i];
                        if(!obj.isCompliteQuest(questInfo.conversation.questindex)){
                            if(questInfo.conversation.condition === "" || obj.isCompliteQuest(questInfo.conversation.condition)) {
                                rtnstr += " - " + m_dbmanager.getFacility(questInfo.person.facility).name + " -> " + questInfo.person.character;
                                if(obj.isQuest(questInfo.conversation.questindex)){
                                    rtnstr += "(진행중)";
                                }
                                rtnstr += "\n";
                            }
                        }
                    }
                    rtnstr += "\n";
                }
                else if(nationInfo !== null){
                    cnt = 1;
                    rtnstr += "  " + fix + "이동\n";
                    rtnstr += MyHomeManager.getCommand(_id, false);


                    rtnstr += "\n[이동 가능한 지역]\n";
                    for(i = 0; i < nationInfo.cities.length; ++i) {
                        tmpcity = m_dbmanager.getCity(nationInfo.cities[i]);
                        if(tmpcity.needquest === "" || obj.isCompliteQuest(tmpcity.needquest))
                            rtnstr += " - " + cnt + ". " + tmpcity.name + "\n";
                        else
                            rtnstr += " - " + cnt + ". " + tmpcity.name + " (이동불가)\n";
                        cnt++;
                    }
                }
                else {
                    rtnstr += "  " + fix + "이동\n";
                }

                rtnstr += "\n[통행증 정보]\n";
                for(i = 0; i < passport.length; ++i) {
                    rtnstr += " - " + m_dbmanager.getNation(passport[i]).name + " 통행증\n";
                }

                if(libConst.CurrUserLocationInfo) {
                    userNameList = _FindNamesinLocation(loc.country, loc.city, loc.facility, loc.field, loc.dungeon, loc.home);
                    if(userNameList.length > 1) {
                        rtnstr += "\n[현 위치 유저]"+ libConst.dummy + "\n";
                        for(i = 0; i < userNameList.length; ++i) {
                            if(userNameList[i].name !== obj.name)
                                if(userNameList[i].getClanName() === "") {
                                    rtnstr += " - " + userNameList[i].name + "\n";
                                }
                                else {
                                    rtnstr += " - [" + userNameList[i].getClanName() + "] " + userNameList[i].name + "\n";
                                }
                        }
                    }
                }
            }
            return rtnstr;
        },
        getPotionItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[보유한 포션]\n\n";
                var list = obj.getItemList(libConst.ITEM_KIND.FUNCTIONALITYITEM);
                var potionDB;
                for(var i = 0; i < list.length; ++i) {
                    potionDB =  m_dbmanager.getFunctionalityItem(list[i].index);
                    if((potionDB.kind === "recovery" || potionDB.kind === "recovery2") && (potionDB.effect === "hp"||potionDB.effect === "mp"||potionDB.effect === "sp"||potionDB.effect === "dp"))
                        rtnstr += "  - (" + potionDB.kind + ") " + potionDB.name + "\n";
                }

            }
            return rtnstr;
        },
        getAPPotionItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[보유한 포션]\n\n";
                var list = obj.getItemList(libConst.ITEM_KIND.FUNCTIONALITYITEM);
                var potionDB;
                for(var i = 0; i < list.length; ++i) {
                    potionDB =  m_dbmanager.getFunctionalityItem(list[i].index);
                    if((potionDB.kind === "recovery" || potionDB.kind === "recovery2") && (potionDB.effect === "ap"))
                        rtnstr += "  - (" + potionDB.kind + ") " + potionDB.name + "\n";
                }

            }
            return rtnstr;
        },
        getCampingItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[보유한 캠핑장비]\n\n";
                var list = obj.getItemList(libConst.ITEM_KIND.FUNCTIONALITYITEM);
                var campingDB;
                for(var i = 0; i < list.length; ++i) {
                    campingDB =  m_dbmanager.getFunctionalityItem(list[i].index);
                    if(campingDB.kind === "camping")
                        rtnstr += "  - (" + campingDB.kind + ") " + campingDB.name + "\n";
                }
            }
            return rtnstr;
        },
        getFoodItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[보유한 음식]\n\n";
                var list = obj.getItemList(libConst.ITEM_KIND.FUNCTIONALITYITEM);
                var foodDB;
                for(var i = 0; i < list.length; ++i) {
                    foodDB =  m_dbmanager.getFunctionalityItem(list[i].index);
                    if(foodDB.kind === "recovery" && foodDB.effect === "ap")
                        rtnstr += "  - (" + foodDB.kind + ") " + foodDB.name + "\n";
                }
            }
            return rtnstr;
        },
        getStat:function(_id) {
            var obj = _Find(_id);
            var opt = _FindOption(_id);
            var rtnstr = "", species, status, ability, vitality, buff;
            var atkcount, damage, cri, cridamage, dpt;
            var skldamage, skldpt;
            var potionbuff = {str:0, con:0, dex:0, agi:0, int:0, luk:0, ept:0, com:0, spr:0};
            var s_db;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                species = m_dbmanager.getSpecies(obj.getSpecies());
                status = obj.getStatus();
                ability = obj.getAbility();
                vitality = obj.getVitality();
                buff = obj.getBuffList();
                s_db = db_Manager.getSkill(opt.getattSkillOpt()[1]);

                for(i = 0; i < buff.length; ++i) {
                    potionbuff[buff[i].stat] += buff[i].amount;
                }

                atkcount = Math.floor((ability.atkspeed * libConst.CALC_DPT_TURN)  / (ability.atkspeed + libConst.CLAC_DPT_DEFUALT_ASPD));
                cri = (ability.critical - libConst.CLAC_DPT_DEFUALT_CRI) / (ability.critical + (libConst.CLAC_DPT_DEFUALT_CRI / 2) + libConst.RateWeight);
                cri = ((cri > 0)?cri:0);
                cridamage = libConst.CriticalDamageRate + (((ability.critical - libConst.CLAC_DPT_DEFUALT_CRI) * libConst.IncCriticalMaxDamage) / (ability.critical + (libConst.CLAC_DPT_DEFUALT_CRI / 2) + libConst.RateWeight));
                cridamage = ((cridamage > 0)?cridamage:0);
                damage = Math.floor(ability.attack * atkcount / libConst.CALC_DPT_TURN);
                dpt = Math.floor((damage * (1 - cri)) + (damage * cridamage * cri));
                if(s_db !== null) {
                    skldamage = Math.floor(ability[s_db.kind] * Number(s_db.effect) * atkcount / libConst.CALC_DPT_TURN);
                    skldpt = Math.floor((skldamage * (1 - cri)) + (skldamage * cridamage * cri));
                }


                rtnstr += "[스테이터스 정보]\n";
                rtnstr += "  - 힘 : (" + status.str + "+" + potionbuff.str +")"+ (species.inc_stat.str === "1" ? "\n":  ( "( x" + species.inc_stat.str + ")\n" ) );
                rtnstr += "  - 체질 : (" + status.con + "+" + potionbuff.con +")"+ (species.inc_stat.con === "1" ? "\n":  ( "( x" + species.inc_stat.con + ")\n" ) );
                rtnstr += "  - 민첩 : (" + status.dex + "+" + potionbuff.dex +")"+ (species.inc_stat.dex === "1" ? "\n":  ( "( x" + species.inc_stat.dex + ")\n" ) );
                rtnstr += "  - 재주 : (" + status.agi + "+" + potionbuff.agi +")"+ (species.inc_stat.agi === "1" ? "\n":  ( "( x" + species.inc_stat.agi + ")\n" ) );
                rtnstr += "  - 지능 : (" + status.int + "+" + potionbuff.int +")"+ (species.inc_stat.int === "1" ? "\n":  ( "( x" + species.inc_stat.int + ")\n" ) );
                rtnstr += "  - 운 : (" + status.luk + "+" + potionbuff.luk +")"+ (species.inc_stat.luk === "1" ? "\n":  ( "( x" + species.inc_stat.luk + ")\n" ) );
                rtnstr += "  - 효율 : (" + status.ept + "+" + potionbuff.ept +")"+ (species.inc_stat.ept === "1" ? "\n":  ( "( x" + species.inc_stat.ept + ")\n" ) );
                rtnstr += "  - 교감 : (" + status.com + "+" + potionbuff.com +")"+ (species.inc_stat.com === "1" ? "\n":  ( "( x" + species.inc_stat.com + ")\n" ) );
                rtnstr += "  - 영혼 : (" + status.spr + "+" + potionbuff.spr +")"+ (species.inc_stat.spr === "1" ? "\n":  ( "( x" + species.inc_stat.spr + ")\n" ) );
                rtnstr += "\n[능력치 정보]\n";
                rtnstr += "  - 공격력  : " + ability.attack + "\n";
                rtnstr += "  - 마법력  : " + ability.magic + "\n";
                rtnstr += "  - 방어력  : " + ability.defense + "\n";
                rtnstr += "  - 마법방어력  : " + Math.floor(ability.defense/2) + "\n";
                rtnstr += "  - 공격속도  : " + ability.atkspeed + "\n";
                rtnstr += "  - 정확도  : " + ability.accuracy + "\n";
                rtnstr += "  - 회피력  : " + ability.avoid + "\n";
                rtnstr += "  - 치명률  : " + ability.critical + "\n";
                rtnstr += "  - 친화력  : " + ability.friendly + "\n";
                rtnstr += "  - 신마력  : " + ability.godevil + "\n";
                rtnstr += "\n[소모치 정보]\n";
                rtnstr += "  - 체력  : " + ability.hp + "/" + obj.getMaxPoint("hp") + "\n";
                rtnstr += "  - 마력  : " + ability.mp + "/" + obj.getMaxPoint("mp") + "\n";
                rtnstr += "  - 기력  : " + ability.sp + "/" + obj.getMaxPoint("sp") + "\n";
                rtnstr += "  - 정신력  : " + ability.dp + "/" + obj.getMaxPoint("dp") + "\n";
                rtnstr += "  - 행동력  : " + ability.ap + "/" + obj.getMaxPoint("ap") + "\n";
                if(libConst.AutoAPRecovery)
                    rtnstr += "  - 예비행동력 : " + obj.calcAutoAP()+ "/" + obj.getMaxPoint("ap") + "\n";
                rtnstr += "\n[기타 정보]\n";
                rtnstr += "  - 소환스킬 설정 갯수  : " + _GetSummonCnt(ability.friendly, ability.godevil) + "\n";
                rtnstr += "\n[생활 수치 정보]\n";
                rtnstr += "  - 기술력 : " + vitality.technic + "\n";
                rtnstr += "  - 지혜 : " + vitality.wisdom + "\n";
                rtnstr += "  - 통찰력 : " + vitality.insight + "\n";
                rtnstr += "\n[단일 측정치]\n";
                rtnstr += "  - 기본크리확률 : " + Math.floor(cri) + "\n";
                rtnstr += "  - 기본크리딜 : " + Math.floor(cridamage) + "\n";
                rtnstr += "  - 턴당평딜 : " + damage + "\n";
                rtnstr += "  - 턴당크리평딜 : " + dpt + "\n";
                if(s_db !== null) {
                    rtnstr += "  (스킬 : " + s_db.name + ")\n";
                    rtnstr += "  - 턴당스킬딜 : " + skldamage + "\n";
                    if(s_db.iscritical === "T")
                        rtnstr += "  - 턴당크리스킬딜 : " + skldpt + "\n";
                    else
                        rtnstr += "  - 턴당크리스킬딜 : 없음\n";
                }
            }
            return rtnstr;
        },
        getMountItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", mountItem, mountlevel;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                mountItem = obj.getEquiment();
                mountlevel = obj.getEquimentLevel();

                rtnstr += "[장착 정보]\n";
                rtnstr += "  - 머리 : " +(m_dbmanager.isWearItem(mountItem.head)?(m_dbmanager.getWearItem(mountItem.head).name + (mountlevel.head===0?"":("+" + mountlevel.head))):"") + "\n";
                rtnstr += "  - 몸 : " + (m_dbmanager.isWearItem(mountItem.body)?(m_dbmanager.getWearItem(mountItem.body).name + (mountlevel.body===0?"":("+" + mountlevel.body))):"") + "\n";
                rtnstr += "  - 다리 : " + (m_dbmanager.isWearItem(mountItem.leg)?(m_dbmanager.getWearItem(mountItem.leg).name + (mountlevel.leg===0?"":("+" + mountlevel.leg))):"") + "\n";
                rtnstr += "  - 손 : " + (m_dbmanager.isWearItem(mountItem.glove)?(m_dbmanager.getWearItem(mountItem.glove).name + (mountlevel.glove===0?"":("+" + mountlevel.glove))):"") + "\n";
                rtnstr += "  - 발 : " + (m_dbmanager.isWearItem(mountItem.shoes)?(m_dbmanager.getWearItem(mountItem.shoes).name + (mountlevel.shoes===0?"":("+" + mountlevel.shoes))):"") + "\n";
                rtnstr += "  - 무기 : " + (m_dbmanager.isWearItem(mountItem.righthand)?(m_dbmanager.getWearItem(mountItem.righthand).name + (mountlevel.righthand===0?"":("+" + mountlevel.righthand))):"") + "\n";
                rtnstr += "  - 보조무기 : " + (m_dbmanager.isWearItem(mountItem.lefthand)?(m_dbmanager.getWearItem(mountItem.lefthand).name + (mountlevel.lefthand===0?"":("+" + mountlevel.lefthand))):"") + "\n";
                rtnstr += "  - 귀걸이 : " + (m_dbmanager.isWearItem(mountItem.earing)?(m_dbmanager.getWearItem(mountItem.earing).name + (mountlevel.earing===0?"":("+" + mountlevel.earing))):"") + "\n";
                rtnstr += "  - 목걸이 : " + (m_dbmanager.isWearItem(mountItem.necklace)?(m_dbmanager.getWearItem(mountItem.necklace).name + (mountlevel.necklace===0?"":("+" + mountlevel.necklace))):"") + "\n";
                rtnstr += "  - 반지1 : " + (m_dbmanager.isWearItem(mountItem.ring1)?(m_dbmanager.getWearItem(mountItem.ring1).name + (mountlevel.ring1===0?"":("+" + mountlevel.ring1))):"") + "\n";
                rtnstr += "  - 반지2 : " + (m_dbmanager.isWearItem(mountItem.ring2)?(m_dbmanager.getWearItem(mountItem.ring2).name + (mountlevel.ring2===0?"":("+" + mountlevel.ring2))):"") + "\n";
                rtnstr += "  - 등장식 : " + (m_dbmanager.isWearItem(mountItem.backdeco)?(m_dbmanager.getWearItem(mountItem.backdeco).name + (mountlevel.backdeco===0?"":("+" + mountlevel.backdeco))):"") + "\n";
            }
            return rtnstr;
        },
        getSaleItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, itemList, itemkind, itemfunc, tmpitem, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("구매하기")) {
                    rtnstr = "구매하기 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(facilityDB.kind === libConst.ITEM_KIND.FUNCTIONALITYITEM) {
                    itemkind = libConst.ITEM_KIND.FUNCTIONALITYITEM;
                    itemfunc = db_Manager.getFunctionalityItem;
                }
                else if(facilityDB.kind === libConst.ITEM_KIND.WEARITEM) {
                    itemkind = libConst.ITEM_KIND.WEARITEM;
                    itemfunc = db_Manager.getWearItem;
                }
                else if(facilityDB.kind === libConst.ITEM_KIND.SUNDRYITEM) {
                    itemkind = libConst.ITEM_KIND.SUNDRYITEM;
                    itemfunc = db_Manager.getSundryItem;
                }

                itemList = db_Manager.getSaleList(user_loc.city, user_loc.facility, itemkind);

                rtnstr += "[진열된 상품 목록]\n";
                for(var i = 0; i < itemList.length; ++i) {
                    tmpitem = itemfunc(itemList[i].item);
                    rtnstr += "  - " + tmpitem.name + " ----- " + tmpitem.needrune + "(Rune)\n";
                }
            }
            return rtnstr;
        },
        getSaleCapital:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, itemList, tmpitem, capital, facilityDB, tmpobj;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("교환하기")) {
                    rtnstr = "교환하기 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                itemList = db_Manager.getSaleCapitalList(user_loc.city, user_loc.facility);

                rtnstr += "[진열된 상품 목록]\n";
                for(var i = 0; i < itemList.length; ++i) {
                    tmpobj = itemList[i];
                    tmpitem = db_Manager.getItem(tmpobj.itemkind, tmpobj.item);
                    capital = db_Manager.getItem(tmpobj.capkind, tmpobj.capital);
                    rtnstr += "  - " + tmpitem.name + " ----- " + capital.name + " " + tmpobj.capcount + "개\n";
                }
            }
            return rtnstr;
        },
        getSaleSkill:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, saleskills, tmpskill, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {

                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("스킬배우기")) {
                    rtnstr = "스킬 배우기를 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                saleskills = db_Manager.getSkillSaleList(user_loc.city, user_loc.facility);

                rtnstr += "[터득할 수 있는 스킬]\n";
                for(var i = 0; i < saleskills.length; ++i) {
                    tmpskill = db_Manager.getSkill(saleskills[i].skill);
                    rtnstr += "  - " + tmpskill.name + " > " + tmpskill.needrune + " Rune " + (tmpskill.spec === "all"?"":"(" + tmpskill.spec + " 전용)") + "\n";
                }
            }
            return rtnstr;
        },
        getSaleSummon:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, saleskills, tmpskill, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {

                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("소환배우기")) {
                    rtnstr = "소환 스킬을 배울수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                saleskills = db_Manager.getSummonSaleList(user_loc.city, user_loc.facility);

                rtnstr += "[터득할 수 있는 소환스킬]\n";
                for(var i = 0; i < saleskills.length; ++i) {
                    tmpskill = db_Manager.getSummonSkill(saleskills[i].skill);
                    rtnstr += "  - " + tmpskill.name + " > " + tmpskill.needrune + " Rune " + (tmpskill.spec === "all"?"":"(" + tmpskill.spec + " 전용)") + "\n";
                }
            }
            return rtnstr;
        },
        getMenufactureItem:function(_id, _kind) {
            var obj = _Find(_id), i;
            var rtnstr = "", user_loc, itemList, itemkind, itemfunc, tmpitem, facilityDB, rtnflag = false;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {

                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !(facilityDB.action.includes("제조하기") || facilityDB.action.includes("장비제작") || facilityDB.action.includes("클랜합성") || facilityDB.action.includes("생산하기"))) {
                    if(_kind === 0)
                        rtnstr = "제조를 할수 있는 위치가 아닙니다.";
                    else if(_kind === 1)
                        rtnstr = "제작을 할수 있는 위치가 아닙니다.";
                    else if(_kind === 2)
                        rtnstr = "클랜 합성을 할수 있는 위치가 아닙니다.";
                    else if(_kind === 3)
                        rtnstr = "생산을 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(_kind === 0 || _kind === 2) {
                    itemkind = libConst.ITEM_KIND.SUNDRYITEM;
                    itemfunc = db_Manager.getSundryItem;
                }
                else if(_kind === 1) {
                    itemkind = libConst.ITEM_KIND.WEARITEM;
                    itemfunc = db_Manager.getWearItem;
                }
                else if(_kind === 3) {
                    itemkind = libConst.ITEM_KIND.FUNCTIONALITYITEM;
                    itemfunc = db_Manager.getFunctionalityItem;
                }

                itemList = db_Manager.getMenufactureList(user_loc.city, user_loc.facility, itemkind);
                if(_kind === 0)
                    rtnstr += "[제조 목록]\n";
                else if(_kind === 1)
                    rtnstr += "[제작 목록]\n";
                else if(_kind === 2)
                    rtnstr += "[합성 목록]\n";
                else if(_kind === 3)
                    rtnstr += "[생산 목록]\n";

                for(i = 0; i < itemList.length; ++i) {
                    tmpitem = itemfunc(itemList[i].index);
                    rtnstr += "  - " + tmpitem.name + " ----- " + itemList[i].needrune + "(Rune)\n";
                }

                itemList = db_Manager.getHighMenufactureList(user_loc.city, user_loc.facility, itemkind);
                if(_kind === 0)
                    rtnstr += "\n[고급 제조 목록]\n";
                else if(_kind === 1)
                    rtnstr += "\n[고급 제작 목록]\n";
                else if(_kind === 2)
                    rtnstr += "\n[고급 합성 목록]\n";
                else if(_kind === 3)
                    rtnstr += "\n[고급 생산 목록]\n";

                for(i = 0; i < itemList.length; ++i) {
                    tmpitem = itemfunc(itemList[i].index);
                    rtnstr += "  - " + tmpitem.name + " ----- " + itemList[i].needrune + "(Rune)\n";
                }
            }
            return rtnstr;
        },
        getMaterial:function(_id, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", i, sellItem, itemKind, meterialList, rune, tmpMater, tmpItem, menufacture, highmenufacture, buff, count, isHigh = false;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {

                sellItem = db_Manager.Search(_itemname, "SUNDRYITEM", "name");
                itemKind = libConst.ITEM_KIND.SUNDRYITEM;
                if(sellItem === null){
                    sellItem = db_Manager.Search(_itemname, "WEARITEM", "name");
                    itemKind = libConst.ITEM_KIND.WEARITEM;
                }
                if(sellItem === null) {
                    sellItem = db_Manager.Search(_itemname, "FUNCTIONALITYITEM", "name");
                    itemKind = libConst.ITEM_KIND.FUNCTIONALITYITEM;
                }
                if(sellItem === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                    return rtnstr;
                }

                menufacture = db_Manager.getMenufacture(sellItem.index, itemKind);
                highmenufacture = db_Manager.getHighMenufacture(sellItem.index, itemKind);
                if(menufacture === null && highmenufacture === null) {
                    rtnstr = "조합 아이템이 아닙니다.";
                    return rtnstr;
                }
                else {
                    if(menufacture === null) {
                        meterialList = highmenufacture.material;
                        rune = highmenufacture.needrune;
                        isHigh = true;
                    }
                    else {
                        meterialList = menufacture.material;
                        rune = menufacture.needrune;
                        isHigh = false;
                    }

                    buff = PetManager.getBuffAmountByKind(_id, "reduce");
                    if(buff !== 0) {
                        rtnstr += "[(" + libConst.Pet_Name + " 버프)" + sellItem.name + " 재료 목록]\n";
                        for(i = 0; i < meterialList.length; ++i) {
                            tmpMater = meterialList[i];
                            if(tmpMater.itemkind === libConst.ITEM_KIND.SUNDRYITEM) {
                                tmpItem = db_Manager.getSundryItem(tmpMater.itemIdx);
                            }
                            else if(tmpMater.itemkind === libConst.ITEM_KIND.WEARITEM) {
                                tmpItem = db_Manager.getWearItem(tmpMater.itemIdx);
                            }
                            else if(tmpMater.itemkind === libConst.ITEM_KIND.FUNCTIONALITYITEM) {
                                tmpItem = db_Manager.getFunctionalityItem(tmpMater.itemIdx);
                            }
                            count = Math.floor(Number(tmpMater.count) - (Number(tmpMater.count) * buff / 100));
                            if(count <= 0)
                                count = 1;
                            rtnstr += "  - " + tmpItem.name + ((isHigh && tmpMater.strength!=="")?("+" + tmpMater.strength):"") + " : " + tmpMater.count + " => " + count + "개\n";
                        }
                        rtnstr += "   L " + rune + " (rune)";
                        rtnstr += "\nps. 클랜합성/고급장비제작은 펫 버프가 적용되지 않습니다.";
                    }
                    else {
                        rtnstr += "[" + sellItem.name + "의 재료 목록]\n";
                        for(i = 0; i < meterialList.length; ++i) {
                            tmpMater = meterialList[i];
                            if(tmpMater.itemkind === libConst.ITEM_KIND.SUNDRYITEM) {
                                tmpItem = db_Manager.getSundryItem(tmpMater.itemIdx);
                            }
                            else if(tmpMater.itemkind === libConst.ITEM_KIND.WEARITEM) {
                                tmpItem = db_Manager.getWearItem(tmpMater.itemIdx);
                            }
                            else if(tmpMater.itemkind === libConst.ITEM_KIND.FUNCTIONALITYITEM) {
                                tmpItem = db_Manager.getFunctionalityItem(tmpMater.itemIdx);
                            }
                            rtnstr += "  - " + tmpItem.name + ((isHigh && tmpMater.strength!=="")?("+" + tmpMater.strength):"") + " : " + tmpMater.count + "개\n";
                        }
                        rtnstr += "   L " + rune + " (rune)";
                    }
                }



            }
            return rtnstr;
        },
        isTradeLoc:function(_id) {
            var obj = _Find(_id);
            var rtnbool = false, user_loc, facilityDB;
            if (obj !== null) {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB !== null && facilityDB.action.includes("판매하기")) {
                    rtnbool = true;
                }
            }
            return rtnbool;
        },
        getRune:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", loan, loanDB, type, currTime, remainTime, goalTime;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr += "[현재 보유중인 룬]\n\n   " + obj.getRune() + " Rune";

                loan = obj.getLoan();
                if(loan.index !== "") {
                    if(loan.kind === "loan") {
                        type = "대출";
                        loanDB = m_dbmanager.getLoan(loan.index);
                    }
                    else {
                        type = "예금";
                        loanDB = m_dbmanager.getDeposit(loan.index);
                    }

                    goalTime = loan.time + (Number(loanDB.period) * 86400000);
                    currTime = (new Date()).getTime();
                    remainTime = goalTime - currTime;

                    rtnstr += "\n\n[현재 보유중인 대출/예금]\n\n";
                    rtnstr += "  - " + loanDB.name + "\n";
                    rtnstr += "  - " + type + "금액 : " + loan.rune + " rune\n";
                    rtnstr += "  - " + type + "금리 : " + Math.floor(Number(loanDB.rate) * 100) + "%\n";
                    rtnstr += "  - " + type + "정산금액 : " + Math.floor(loan.rune * (1 + Number(loanDB.rate))) + " rune\n";
                    if(remainTime > 0)
                        rtnstr += "  - " + type + "남은기한 : " + Math.floor(remainTime / 86400000) + "일 후에 정산\n";
                    else
                        rtnstr += "  - " + type + " 정산일이 지났습니다. 은행으로 가셔서 정산하시기 바랍니다.\n";
                }
            }
            return rtnstr;
        },
        RuneConsume:function(_id, _count, _statname) {
            var obj = _Find(_id);
            var rtnstr = "", stat = "", totalRune = 0, statCnt = 0;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                stat = _ChangeStat(_statname);
                rtnstr += "[마석 흡수]\n\n";
                for(var i = 0; i < _count; ++i) {
                    if(obj.getPurchaseStat() >= libConst.LimitRuneConsume) {
                        rtnstr += "최고 수치에 도달하여 " + _statname + "을(를)" + statCnt + "개만 상승시킵니다.\n\n";
                        break;
                    }

                    if(obj.addRune(-obj.calcNextPruchaseStat())) {
                        totalRune += obj.calcNextPruchaseStat();
                        statCnt++;
                        obj.incPurchaseStat();
                    }
                    else {
                        rtnstr += "룬이 부족하여 "+ _statname + "을(를) +" + statCnt + "개만 상승시킵니다.\n\n";
                        break;
                    }
                }
                if(statCnt !== 0) {

                    rtnstr += "   - 룬 " + totalRune + " rune을 소비하여 " + _statname + "을(를) +" + statCnt + " 상승시킵니다.\n";
                    obj.setStatusForName(stat, statCnt);
                    RecordManager.setStatus(obj.name, obj.getStatus());
                    obj.calcAbility(false);
                    rtnstr += "   - 총 흡수한 스텟 갯수 : " + obj.getPurchaseStat() + "\n";
                    _Save();
                }
                else {
                    if(obj.getPurchaseStat() >= libConst.LimitRuneConsume) {
                        rtnstr += "이미 최고수치에 도달하였습니다.";
                    }
                    else {
                        rtnstr += "룬이 부족합니다.\n\n";
                        rtnstr += "다음 스텟치 흡수 비용 : " + obj.calcNextPruchaseStat() + " rune";
                    }
                }
            }
            return rtnstr;
        },
        currQuestList:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", questloc, questList = [], tmpQuest, tmpObj, itemCount;
            var nation, city, facility, field, dungeon;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                questList = obj.getCurrQuest();
                rtnstr += "[진행중인 퀘스트]\n\n";

                for(var i = 0; i < questList.length; ++i) {
                    tmpQuest = m_dbmanager.getQuest(questList[i].index);

                    rtnstr += (i+1) + ". " + tmpQuest.title.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + "\n";
                    if(tmpQuest.kind === "Item") {
                        tmpObj = m_dbmanager.getItem(tmpQuest.option, tmpQuest.target);
                        itemCount = obj.getItemCount(tmpQuest.option, tmpQuest.target);
                        itemCount = ((itemCount === -1)?0:itemCount);
                        rtnstr += "  - 달성치 : " + tmpObj.name + " (" + ((itemCount > tmpQuest.count)?tmpQuest.count:itemCount) + "/" + tmpQuest.count + ")\n";
                    }
                    else if(tmpQuest.kind === "Monster") {
                        tmpObj = m_dbmanager.getMonster(tmpQuest.target);
                        rtnstr += "  - 달성치 : " + tmpObj.name + " (" + ((questList[i].goal > tmpQuest.count)?tmpQuest.count:questList[i].goal) + "/" + tmpQuest.count + ")\n";
                    }
                    questloc = tmpQuest.compliteloc.split(";");
                    for(var l = 0; l < questloc.length; ++l)
                        questloc[l] = ((questloc[l] === "0")?"":questloc[l]);

                    nation = m_dbmanager.getNation(questloc[0]);
                    city = m_dbmanager.getCity(questloc[1]);
                    facility = m_dbmanager.getFacility(questloc[2]);
                    field = m_dbmanager.getField(questloc[3]);
                    dungeon = m_dbmanager.getDungeon(questloc[4]);
                    
                    if(tmpQuest.kind !== "Action") {
                        rtnstr += "  - 완료 위치 : " + ((nation!==null)?nation.name:"") + ((city!==null)?" > " + city.name:"") + ((facility!==null)?" > " + facility.name:"") + ((field!==null)?" > " + field.name:"") + ((dungeon!==null)?" > " + dungeon.name:"") + "\n";
                    }
                    rtnstr += "  - 보상 : \n";
                    for(var j = 0; j < tmpQuest.item.length; ++j) {
                        tmpObj = m_dbmanager.getItem(tmpQuest.item[j].itemkind, tmpQuest.item[j].itemIdx);
                        rtnstr += "     " + (j+1) + ". " + tmpObj.name + " x " + tmpQuest.item[j].count + "\n";
                    }
                    if(tmpQuest.rune !== "") {
                        rtnstr += "  - 룬 : " + tmpQuest.rune +" Rune\n";
                    }
                    if(tmpQuest.passport !== "") {
                        rtnstr += "  - 획득 권한 : " + m_dbmanager.getNation(tmpQuest.passport).name +" 통행증\n";
                    }
                    rtnstr += "\n";
                }
            }
            return rtnstr;
        },
        getPassportinfo:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[통행증 리스트]\n\n";
                var list = obj.getPassPort();
                var notionDB;
                for(var i = 0; i < list.length; ++i) {
                    notionDB =  m_dbmanager.getNation(list[i]);
                    rtnstr += "  - " + notionDB.name + " 통행증\n";
                }
            }
            return rtnstr;
        },
        getMercenary:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", mercenarylist, mercenary, dbdata, promotionlist;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                mercenarylist = MercenaryManager.getMercenary(_id);
                rtnstr += "[" + _id + "] 보유 용병\n\n";
                for(var i = 0; i < mercenarylist.length; ++i) {
                    mercenary = mercenarylist[i];
                    dbdata = m_dbmanager.getMercenary(mercenary.index);
                    promotionlist = m_dbmanager.getPromotionMercenary(mercenary.index);
                    rtnstr += "" + (i+1) + ". " + mercenary.name + "\n";
                    rtnstr += "  - 타입 : " + dbdata.kind + "\n";
                    rtnstr += "  - 경험치 : " + mercenary.exp + "\n";
                    rtnstr += "  - 출전 여부 : " + (mercenary.isuse === "Y"?"출전중":"휴식중") + "\n";
                    if(dbdata.ability.hp !== "0")
                        rtnstr += "  - hp : " + mercenary.hp + "/" + dbdata.ability.hp + "\n";
                    if(dbdata.ability.mp !== "0")
                        rtnstr += "  - mp : " + mercenary.mp + "/" + dbdata.ability.mp + "\n";
                    if(dbdata.ability.sp !== "0")
                        rtnstr += "  - sp : " + mercenary.sp + "/" + dbdata.ability.sp + "\n";
                    rtnstr += "  - 봉급 : " + mercenary.pay + " (rune)\n";
                    rtnstr += "  - 진급 가능 직업 : \n";
                    for(var j = 0; j < promotionlist.length; ++j) {
                        rtnstr += "     L " + promotionlist[j].name + "\n";
                    }

                    rtnstr += "\n";
                }
            }

            return rtnstr;
        },
        DoCamping:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", opt, equDB, foodDB, campingDB, fireDB, userAbility, recoveryHP, recoveryAP;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                opt = _FindOption(_id).getCampingOpt();
                if(opt.equipment !== "" && opt.food !== "") {
                    equDB = m_dbmanager.getFunctionalityItem(opt.equipment);

                    if(obj.isItemCount(libConst.ITEM_KIND.FUNCTIONALITYITEM, opt.equipment, 1)) {
                        foodDB = m_dbmanager.getFunctionalityItem(opt.food);
                        fireDB = m_dbmanager.Search("석탄", "SUNDRYITEM", "name");
                        if(obj.isItemCount(libConst.ITEM_KIND.FUNCTIONALITYITEM, opt.food, 1) && obj.isItemCount(libConst.ITEM_KIND.SUNDRYITEM, fireDB.index, 1)) {
                            campingDB = m_dbmanager.getCamping(opt.equipment);

                            userAbility = obj.getAbility();
                            recoveryHP = Math.floor(obj.getMaxPoint("hp") * (Number(campingDB.recoveryhp) / 100));
                            recoveryAP = Math.floor(obj.getMaxPoint("ap") * (Number(campingDB.recoveryap) / 100));

                            if(recoveryHP > userAbility.hp)
                                obj.RecoveryforNum("hp", recoveryHP - userAbility.hp);
                            if(recoveryAP > userAbility.ap)
                                obj.RecoveryforNum("ap", recoveryAP - userAbility.ap);

                            obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, opt.food, 1);
                            obj.removeItem(libConst.ITEM_KIND.SUNDRYITEM, fireDB.index, 1);

                            _Save();
                            rtnstr += "[캠핑장비 " + equDB.name + "의 효율]\n\n   - HP 회복률 : " + campingDB.recoveryhp + "%\n   - AP 회복률 : " + campingDB.recoveryap + "%\n";
                            rtnstr += "석탄 한개와 " + foodDB.name + "을(를) 소비하여 체력과 행동력을 회복합니다.";
                        }
                        else {
                            rtnstr = "석탄 또는 " + foodDB.name + "을(를) 소지하고 있지 않습니다.";
                        }
                    }
                    else {
                        rtnstr = equDB.name + "을(를) 소지하고 있지 않습니다.";
                    }
                }
                else {
                    rtnstr = "설정된 캠핑장비 또는 캠핑음식이 없습니다.";
                }
            }
            return rtnstr;
        },
        getExplorer:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", expl;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                expl = ExplorerManager.getExplorer(_id);
                if(expl !== null) {
                    rtnstr += "[보유중인 탐험가]\n\n";
                    rtnstr += "  - 등급 : " + expl.getGrade() + "\n";
                    rtnstr += "  - 힘 : " + expl.getStat().str + "\n";
                    rtnstr += "  - 민첩 : " + expl.getStat().dex + "\n";
                    rtnstr += "  - 운 : " + expl.getStat().luk + "\n";
                    rtnstr += "  - 잠금여부 : " + (expl.getLock()?"O":"X") + "\n";

                    rtnstr += "(계산 수치)\n";
                    rtnstr += "  L 탐험속도 : " + Math.floor((libConst.AutoHTSpeed /1000) - (expl.getStat().dex * libConst.AutoHTSpeedWgt)) + "초/몹\n";
                    rtnstr += "  L 드랍율 : " + Math.floor(libConst.AutoHTDropItemAmount + (expl.getStat().str * libConst.AutoHTDropItemAmountWgt)) + "배\n";
                    rtnstr += "  L 보스만날확률 : " + (libConst.AutoHTBossRate + (expl.getStat().luk * libConst.AutoHTBossRateWgt)) + "%\n\n";

                    rtnstr += "(탐험 위치)\n";
                    if(expl.getLoc() === "" && expl.getTime() === -1){
                        rtnstr += "  - 휴식중\n";
                    }
                    else {
                        rtnstr += "  - 탐험장소 : " + m_dbmanager.getField(expl.getLoc()).name + "\n";
                        rtnstr += "  - 탐험시간 : " + Math.floor(((new Date).getTime() - expl.getTime()) / 60000) + "분째 탐험중\n";
                    }
                }
                else {
                    rtnstr = "보유중인 탐험가가 존재하지 않습니다.";
                }
            }
            return rtnstr;
        },
        BuffInfo:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", bufflist, buff;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                bufflist = obj.getBuffList();
                rtnstr = "[현재 보유 버프]\n\n";
                for(var i = 0; i < bufflist.length; ++i) {
                    buff = bufflist[i];
                    rtnstr += (i+1) + ". " + _ChangeStat(buff.stat) + "+" + buff.amount + "(" + buff.count + "회 남음)\n";
                }
            }
            return rtnstr;
        },

        //[사용자 행동 부분]
        Move:function(_id, _purpose, _conquestlist) {
            var obj = _Find(_id);
            var rtnstr = "", loc, nationInfo, cityInfo, facilityInfo, fieldInfo, dungeonInfo, cnt, tmpcity, purpose;
            var myConquest = true;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(_purpose === "마이홈") {
                    loc = obj.getLocation();
                    if(MyHomeManager.isMyHome(_id)) {
                        if(MyHomeManager.CompareLoc(_id, loc)) {
                            obj.moveMyHome();
                            rtnstr = "목적지에 이동하였습니다.";
                            _Save();
                        }
                        else {
                            rtnstr = "현재 위치에서는 당신의 집으로 이동할 수 없습니다.";
                        }
                    }
                    else {
                        rtnstr = "당신은 집을 소유하지 않았습니다.";
                    }
                }
                else {
                    tmpcity = m_dbmanager.getCityByName(_purpose);
                    loc = obj.getLocation();
                    nationInfo = m_dbmanager.getNation(loc.country);
                    cityInfo = m_dbmanager.getCity(loc.city);
                    facilityInfo = m_dbmanager.getFacility(loc.facility);
                    fieldInfo = m_dbmanager.getField(loc.field);
                    dungeonInfo = m_dbmanager.getDungeon(loc.dungeon);

                    if(cityInfo !== null && cityInfo.occupy === "Y") {
                        myConquest = _isMyConquest(loc, _conquestlist);
                    }
                    
                    if(!isNaN(_purpose) && (Number(_purpose) >= 1)) {
                        purpose = Number(_purpose);

                        if(fieldInfo === null && facilityInfo === null && dungeonInfo === null) {
                            cnt = purpose - 1;
                            if(cityInfo !== null) {
                                if(myConquest) {
                                    if((cityInfo.facilities.length + cityInfo.fields.length + cityInfo.dungeon.length) < purpose){
                                        rtnstr = "그 목적지는 인덱스 범위를 넘어섰거나 잘못되었습니다.";
                                    }
                                    else if(cityInfo.facilities.length >= purpose) {
                                        if(obj.moveLocation(m_dbmanager.getFacility(cityInfo.facilities[cnt]).name, myConquest)){
                                            rtnstr = "목적지에 이동하였습니다.";
                                            obj.setTargetQuest("");
                                            _Save();
                                        }
                                        else {
                                           rtnstr = "그 목적지는 인덱스 범위를 넘어섰거나 잘못되었습니다.";
                                        }
                                    }
                                    else if((cityInfo.facilities.length + cityInfo.fields.length) >= purpose){
                                        if(obj.moveLocation(m_dbmanager.getField(cityInfo.fields[cnt - cityInfo.facilities.length]).name, myConquest)){
                                            rtnstr = "목적지에 이동하였습니다.";
                                            obj.setTargetQuest("");
                                            _Save();
                                        }
                                        else {
                                           rtnstr = "그 목적지는 인덱스 범위를 넘어섰거나 잘못되었습니다.";
                                        }
                                    }
                                    else {
                                        if(obj.moveLocation(m_dbmanager.getDungeon(cityInfo.dungeon[cnt - cityInfo.facilities.length - cityInfo.fields.length]).name, myConquest)){
                                            rtnstr = "목적지에 이동하였습니다.";
                                            obj.setTargetQuest("");
                                            _Save();
                                        }
                                        else {
                                           rtnstr = "그 목적지는 인덱스 범위를 넘어섰거나 잘못되었습니다.";
                                        }
                                    }
                                }
                                else {
                                    rtnstr = "이곳은 당신의 클랜이 점령한 곳이 아닙니다. 시설 이용을 금지합니다.";
                                }
                            }
                            else if(nationInfo !== null) {
                                tmpcity = m_dbmanager.getCity(nationInfo.cities[cnt]);
                                if(nationInfo.cities.length < purpose){
                                    rtnstr = "그 목적지는 인덱스 범위를 넘어섰거나 잘못되었습니다.";
                                }
                                else if(tmpcity.needquest !== "" && !obj.isCompliteQuest(tmpcity.needquest)) {
                                    rtnstr = "그 목적지는 퀘스트가 완료되지 않아서 이동이 불가능합니다.\n\n퀘스트 완료 후 이동이 가능합니다.";
                                }
                                else if(obj.moveLocation(m_dbmanager.getCity(nationInfo.cities[cnt]).name, myConquest)){
                                    rtnstr = "목적지에 이동하였습니다.";
                                    obj.setTargetQuest("");
                                    _Save();
                                }
                                else {
                                   rtnstr = "그 목적지는 인덱스 범위를 넘어섰거나 잘못되었습니다.";
                                }
                            }
                        }
                    }
                    else if(tmpcity !== null && tmpcity.needquest !== "" && !obj.isCompliteQuest(tmpcity.needquest)) {
                        rtnstr = "그 목적지는 퀘스트가 완료되지 않아서 이동이 불가능합니다.\n\n퀘스트 완료 후 이동이 가능합니다.";
                    }
                    else if(obj.moveLocation(_purpose, myConquest)) {
                        rtnstr = "목적지에 이동하였습니다.";
                        obj.setTargetQuest("");
                        _Save();
                    }
                    else {
                        rtnstr = "그 목적지는 현위치에서 이동할수 없거나, 현재 당신이 점령하지 못한 곳이거나, 명칭이 잘못되었습니다.";
                    }
                }
            }
            return rtnstr;
        },
        MoveNation:function(_id, _purpose) {
            var obj = _Find(_id);
            var rtnstr = "", nation, user_loc, facilityDB, nationList, flag = false, i;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("국가이동")) {
                    rtnstr = "국경을 넘을 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                nation = m_dbmanager.Search(_purpose, "NATION", "name");
                nationList = m_dbmanager.getNationMoveList(user_loc.city, user_loc.facility);

                if(nation === null) {
                    return _purpose + " (이)라는 국가는 존재 하지 않습니다.";
                }

                for(i = 0; i < nationList.length; ++i) {
                    if(nationList[i].country === nation.index) {
                        flag = true;
                    }
                }

                if(flag) {
                    if(nation !== null) {
                        if(obj.isPassPort(nation.index)){
                            obj.setLocation(nation.index,"","","","","");
                            rtnstr = "목적지에 이동하였습니다.";
                            obj.setTargetQuest("");
                            _Save();
                        }
                        else {
                            rtnstr = "해당 국가의 통행증을 보유하고 있지 않습니다.";
                        }
                    }
                    else {
                        rtnstr = "그 목적지는 현위치에서 이동할수 없거나, 명칭이 잘못되었습니다.";
                    }
                }
                else {
                    rtnstr = "여기서는 그 국가로 이동할 수 없습니다.\n\n(현 위치에서 이동가능 국가)\n";
                    for(i = 0; i < nationList.length; ++i) {
                        rtnstr += "  L " + m_dbmanager.Search(nationList[i].country, "NATION", "index").name;
                    }
                }

            }
            return rtnstr;
        },
        Back:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(obj.backLocation()) {
                    rtnstr = "목적지에 이동하였습니다.";
                    obj.setTargetQuest("");
                    _Save();
                }
                else {
                    rtnstr = "국가에서 벗어날수 없습니다.";
                }
            }
            return rtnstr;
        },
        Hunting:function(_id, _count) {
            var obj = _Find(_id);
            var opt = _FindOption(_id);
            var rtnstr = "", dbItem, dbField;
            var rewardList = null;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(obj.getLocation().field === "")
                    rtnstr = "현재위치에서는 사냥이 불가능합니다.";
                else {
                    dbField = db_Manager.getField(obj.getLocation().field);
                    if(obj.getAbility().ap < Number(dbField.needap)) {
                        rtnstr += "행동력이 부족합니다.\n";

                        if(opt.getApOpt() === "") {
                            rtnstr += "전투를 종료합니다.";
                            return rtnstr;
                        }
                        else {
                            dbItem = db_Manager.getFunctionalityItem(opt.getApOpt());
                            if(obj.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index)) {
                                if(dbItem.kind === "recovery") {
                                    obj.Recovery(dbItem.effect, dbItem.amount);
                                    obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                    rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                    rtnstr += "" + dbItem.effect + "이(가) " + dbItem.amount + "% 회복하였습니다.";
                                }
                                else if(dbItem.kind === "recovery2") {
                                    obj.RecoveryforNum(dbItem.effect, Number(dbItem.amount));
                                    obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                    rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                    rtnstr += "" + dbItem.effect + "이(가) +" + dbItem.amount + " 회복하였습니다.";
                                }
                            }
                            else {
                                rtnstr += dbItem.name + "(이)가 부족하여 AP 회복을 할 수 없습니다.";
                                return rtnstr;
                            }
                            rtnstr += "\n\n";
                        }
                    }
                    if(obj.getAbility().hp > 0) {
                        rtnstr += "[전투 결과]" + libConst.dummy + "\n\n";
                        rtnstr += m_huntSystem.Start(obj, _count, _FindOption(_id), MercenaryManager.getMercenary(_id), MercenaryManager, BattleManager.getMyRank(_id), dbField.needap);
                        MercenaryManager.Save();

                        rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Hunting, 1);
                        if(rewardList.length > 0) {
                            rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                            rtnstr += _HomeWorkReward(obj, rewardList);
                        }
                    }
                    else {
                        rtnstr = "체력이 부족합니다.";
                    }
                    _Save();
                }
            }
            return rtnstr;
        },
        Lodge:function(_id, _ishome) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {

                user_loc = obj.getLocation();
                if(_ishome) {
                    if(user_loc.home !== _id) {
                        rtnstr = "현재위치에서는 잠자기를 할수 없습니다.";
                        return rtnstr;
                    }

                    if(MyHomeManager.isFurnitureEffect(_id, "bed")) {
                        obj.HPMPRecovery();
                        MercenaryManager.AllHPMPRecovery(_id);
                        RecordManager.rcdAction(_id, "sleep");
                        _Save();
                        MercenaryManager.Save();
                        rtnstr = "HP와 MP/SP가 가득찹니다.";
                    }
                    else {
                        rtnstr = "마이홈에 잠 잘수 있는 시설이 배치되어 있지 않습니다.";
                    }
                }
                else {
                    facilityDB = m_dbmanager.getFacility(user_loc.facility);
                    if(facilityDB === null || !facilityDB.action.includes("숙박하기")) {
                        rtnstr = "현재위치에서는 숙박하기가 불가능합니다.";
                        return rtnstr;
                    }

                    if(obj.addRune(-libConst.LodgeMaxRune * (1 + MercenaryManager.getMercenary(_id).length))) {
                        obj.HPMPRecovery();
                        MercenaryManager.AllHPMPRecovery(_id);
                        RecordManager.rcdAction(_id, "sleep");
                        _Save();
                        MercenaryManager.Save();
                        rtnstr = "숙박료 "+ (libConst.LodgeMaxRune * (1 + MercenaryManager.getMercenary(_id).length)) + "Rune이 지출됩니다. HP/MP/SP/DP가 가득찹니다.";
                    }
                    else {
                        rtnstr = "Rune이 부족합니다.";
                    }
                }
            }
            return rtnstr;
        },
        EatRice:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();

                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if((facilityDB === null || !facilityDB.action.includes("식사하기")) && user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 식사하기가 불가능합니다.";
                    return rtnstr;
                }

                if(user_loc.home === _id) {
                    if(MyHomeManager.isFurnitureEffect(_id, "table")) {
                        obj.APRecovery();
                        RecordManager.rcdAction(_id, "eatfood");
                        _Save();
                        MercenaryManager.Save();
                        rtnstr = "AP가 가득찹니다.";
                    }
                    else {
                        rtnstr = "마이홈에 식사할 수 있는 시설이 배치되어 있지 않습니다.";
                    }
                }
                else {
                    if(obj.addRune(-(libConst.EatRiceMaxRune) * (1 + MercenaryManager.getMercenary(_id).length))) {
                        obj.APRecovery();
                        RecordManager.rcdAction(_id, "eatfood");
                        _Save();
                        MercenaryManager.Save();
                        rtnstr = "식사료 " + (libConst.EatRiceMaxRune * (1 + MercenaryManager.getMercenary(_id).length)) + "Rune이 지출됩니다. AP가 가득찹니다.";
                    }
                    else {
                        rtnstr = "Rune이 부족합니다.";
                    }
                }

            }
            return rtnstr;
        },
        OpenBag:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", itemlist = [];

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                itemlist = obj.getItemList("all");
                rtnstr = _SortItem(itemlist, null);
            }
            return rtnstr;
        },
        SearchBag:function(_id, _search) {
            var obj = _Find(_id);
            var rtnstr = "", itemlist = [];

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                itemlist = obj.getItemList("all");
                rtnstr = _SortItem(itemlist, _search);
            }
            return rtnstr;
        },
        AnalyzeItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", itemlist = [], item, user_loc, analyze, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("감정하기")) {
                    rtnstr = "감정할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                itemlist = obj.getItemList("all");
                for(var i = 0; i < itemlist.length; ++i) {
                    item = itemlist[i];
                    if(item.kind === libConst.ITEM_KIND["SUNDRYITEM"]) {
                        analyze = m_dbmanager.getAnalyze(item.index);
                        if(analyze !== null)
                        {
                            rtnstr += "  - " + m_dbmanager.getSundryItem(item.index).name + " - " + analyze.needrune + "(rune)\n";
                        }
                    }
                }
            }
            return rtnstr;
        },
        Analyze:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, findItem, analyze, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("감정하기")) {
                    rtnstr = "감정할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                findItem = db_Manager.Search(_itemname, "SUNDRYITEM", "name");
                if(findItem === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                    return rtnstr;
                }

                analyze = db_Manager.getAnalyze(findItem.index);
                if(analyze === null) {
                    rtnstr = "해당 아이템은 감정이 불가능한 아이템 입니다.";
                    return rtnstr;
                }

                //가방에 있는지 없는지 확인 필요
                if(obj.isItemCount(libConst.ITEM_KIND.SUNDRYITEM, findItem.index, _count)) {
                    if(obj.addRune(-(Number(analyze.needrune) * _count))) {
                        obj.removeItem(libConst.ITEM_KIND.SUNDRYITEM, findItem.index, _count);
                        obj.addItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, analyze.functionalyindex, _count);
                        _Save();
                        rtnstr += "" + (Number(analyze.needrune) * _count) + " (룬) 을 소모합니다.\n\n";
                        rtnstr += "감정 결과 : " + db_Manager.getFunctionalityItem(analyze.functionalyindex).name + " x " + _count + " 획득";
                    }
                    else {
                        rtnstr = "감정에 필요한 룬이 부족합니다.";
                    }
                }
                else {
                    rtnstr = "해당 아이템은 소유하고 있지 않거나 갯수가 부족합니다.";
                }
            }
            return rtnstr;
        },
        Purchase:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, itemList, itemkind, itemfunc, targetItemIdx, targetItem = null, facilityDB, buff, rune;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("구매하기")) {
                    rtnstr = "구매할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(facilityDB.kind === libConst.ITEM_KIND.FUNCTIONALITYITEM) {
                    itemkind = libConst.ITEM_KIND.FUNCTIONALITYITEM;
                    itemfunc = db_Manager.getFunctionalityItem;
                    targetItemIdx = db_Manager.Search(_itemname, "FUNCTIONALITYITEM", "name");
                }
                else if(facilityDB.kind === libConst.ITEM_KIND.WEARITEM) {
                    itemkind = libConst.ITEM_KIND.WEARITEM;
                    itemfunc = db_Manager.getWearItem;
                    targetItemIdx = db_Manager.Search(_itemname, "WEARITEM", "name");
                }
                else if(facilityDB.kind === libConst.ITEM_KIND.SUNDRYITEM) {
                    itemkind = libConst.ITEM_KIND.SUNDRYITEM;
                    itemfunc = db_Manager.getSundryItem;
                    targetItemIdx = db_Manager.Search(_itemname, "SUNDRYITEM", "name");
                }

                if(targetItemIdx === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
                else {
                    itemList = db_Manager.getSaleList(user_loc.city, user_loc.facility, itemkind);
                    for(var i = 0; i < itemList.length; ++i) {
                        if(itemList[i].item === targetItemIdx.index) {
                            targetItem = itemfunc(itemList[i].item);
                        }
                    }

                    if(targetItem === null) {
                        rtnstr = "이 상점에서 판매하는 아이템이 아닙니다.";
                    }
                    else {
                        buff = PetManager.getBuffAmountByKind(_id, "buy");
                        rune = Math.floor(Number(targetItem.needrune) - (Number(targetItem.needrune) * buff / 100));
                        if(buff !== 0) {
                            rtnstr += "펫 버프로 인하여 구매 가격이 할인 되어 " + rune + " rune에 구매를 진행합니다.\n\n";
                        }
                        if(obj.addRune(-(rune * _count))) {
                            obj.addItem(itemkind, targetItem.index, _count);
                            rtnstr += "" + targetItem.name + "을(를) " + _count + "개 구매 완료하였습니다.\n\n" +
                                    (rune * _count) + "Rune을 소모했습니다.";
                            _Save();
                        }
                        else {
                            rtnstr = "소지 룬이 부족합니다.";
                        }
                    }
                }
            }
            return rtnstr;
        },
        Exchange:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, itemList, flagIdx, targetItem = null, capitalDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("교환하기")) {
                    rtnstr = "교환할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                targetItem = db_Manager.getItemByName(_itemname);

                if(targetItem.obj === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
                else {
                    itemList = db_Manager.getSaleCapitalList(user_loc.city, user_loc.facility);
                    flagIdx = -1;
                    for(var i = 0; i < itemList.length; ++i) {
                        if(itemList[i].item === targetItem.obj.index && itemList[i].itemkind === targetItem.kind) {
                            flagIdx = i;
                        }
                    }

                    if(flagIdx === -1) {
                        rtnstr = "이 상점에서 판매하는 아이템이 아닙니다.";
                    }
                    else {

                        if(obj.isItemCount(itemList[flagIdx].capkind, itemList[flagIdx].capital, Number(itemList[flagIdx].capcount) * _count)) {
                            obj.addItem(targetItem.kind, targetItem.obj.index, _count);
                            rtnstr += "" + targetItem.obj.name + "을(를) " + _count + "개 구매 완료하였습니다.\n\n";

                            capitalDB = db_Manager.getItem(itemList[flagIdx].capkind, itemList[flagIdx].capital);
                            obj.removeItem(itemList[flagIdx].capkind, itemList[flagIdx].capital, ( Number(itemList[flagIdx].capcount) * _count));

                            rtnstr += capitalDB.name + "을(를) " + ( Number(itemList[flagIdx].capcount) * _count)  + "개 소모했습니다.";
                            _Save();
                        }
                        else {
                            rtnstr = "교환가능한 필요 아이템이 부족합니다.";
                        }
                    }
                }
            }
            return rtnstr;
        },
        Sell:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var spl_item = _itemname.split("+"), itemlevel, itemname;
            var rtnstr = "", user_loc, itemList, tmpItem, sellItem, itemKind, sellPrice, facilityDB, strengthDB, categoryList;
            var i = 0, buff, category;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("판매하기")) {
                    rtnstr = "판매할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];
                strengthDB = m_dbmanager.getStrength("" + Number(itemlevel), "N");

                itemList = obj.getItemList("all");//{kind, index, count}

                categoryList = _FindCategory(itemList, itemname);
                if(categoryList === null) {
                    sellItem = db_Manager.Search(itemname, "SUNDRYITEM", "name");
                    itemKind = libConst.ITEM_KIND.SUNDRYITEM;
                    if(sellItem === null){
                        sellItem = db_Manager.Search(itemname, "WEARITEM", "name");
                        itemKind = libConst.ITEM_KIND.WEARITEM;
                    }
                    if(sellItem === null) {
                        sellItem = db_Manager.Search(itemname, "FUNCTIONALITYITEM", "name");
                        itemKind = libConst.ITEM_KIND.FUNCTIONALITYITEM;
                    }
                    if(sellItem === null) {
                        rtnstr = "존재하지 않는 아이템 입니다.";
                        return rtnstr;
                    }

                    //가방에 있는지 없는지 확인 필요
                    if(obj.isItemCount(itemKind, sellItem.index, _count, Number(itemlevel))) {
                        sellPrice = Math.floor((Number(sellItem.needrune) * 2 / 3) + (strengthDB !== null?Number(strengthDB.needrune):0));
                        if(sellPrice === 0)
                            sellPrice = 1;

                        buff = PetManager.getBuffAmountByKind(_id, "sell");
                        sellPrice = Math.floor(sellPrice + (sellPrice * buff / 100));
                        if(buff !== 0) {
                            rtnstr += "펫 버프로 인하여 요금을 추가하여 " + sellPrice + " Rune 에 판매 합니다.\n\n";
                        }
                        else {
                            rtnstr += "원가의 2/3 가격과 강화에 해당하는 룬을 합산한 " + sellPrice + "Rune 에 판매 합니다.\n\n";
                        }

                        obj.addRune(sellPrice * _count);
                        obj.removeItem(itemKind, sellItem.index, _count, Number(itemlevel));
                        rtnstr += "" + sellItem.name + "을(를) " + _count + "개 판매 완료하였습니다.\n\n" +
                                (sellPrice * _count) + "Rune을 획득하였습니다.";
                        RecordManager.rcdMaxRune(_id, sellPrice * _count);
                        _Save();
                    }
                    else {
                        rtnstr = "해당 아이템은 소유하고 있지 않거나, 갯수가 부족합니다.";
                    }
                }
                else {
                    buff = PetManager.getBuffAmountByKind(_id, "sell");
                    if(categoryList.length === 0) {
                        rtnstr += "해당 카테고리에 판매 가능한 템이 존재하지 않습니다.";
                    }
                    for(i = 0; i < categoryList.length; ++i) {
                        category = categoryList[i];
                        sellItem = db_Manager.getItem(category.kind, category.index);
                        sellPrice = Math.floor(Number(sellItem.needrune) * 2 / 3);
                        if(sellPrice === 0)
                            sellPrice = 1;

                        if(buff !== 0) {
                            rtnstr += "펫 버프로 인하여 요금을 추가하여 " + sellPrice + " Rune 에 판매 합니다.\n";
                        }
                        else {
                            rtnstr += "원가의 2/3 가격과 강화에 해당하는 룬을 합산한 " + sellPrice + "Rune 에 판매 합니다.\n";
                        }

                        obj.addRune(sellPrice * category.count);
                        obj.removeItem(category.kind, category.index, category.count);
                        rtnstr += "" + sellItem.name + "을(를) " + category.count + "개 판매 완료하였습니다." +
                                (sellPrice * category.count) + "Rune을 획득하였습니다.\n\n";
                        RecordManager.rcdMaxRune(_id, sellPrice * category.count);
                        _Save();
                    }
                }
                return rtnstr;
            }
        },
        Mount:function(_id, _itemname) {
            var obj = _Find(_id), i, j;
            var rtnstr = "", bag = [], item, t_iteminfo, equipment, equilevel, flag = false, position, removeItem, stat, limit, limitList;
            var spl_item = _itemname.split("+");
            var itemname, itemlevel;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];

                t_iteminfo = db_Manager.Search(itemname, "WEARITEM", "name");
                if(t_iteminfo !== null) {
                    position = t_iteminfo.wearpos;
                    bag = obj.getItemList(libConst.ITEM_KIND["WEARITEM"]);
                    equipment = obj.getEquiment();
                    equilevel = obj.getEquimentLevel();

                    for(i = 0; i < bag.length; ++i) {
                        item = bag[i];
                        if(item.index === t_iteminfo.index && Number(item.strength) === Number(itemlevel)) {
                            flag = true;
                            break;
                        }
                    }
                    if(flag) {
                        if(position === "lefthand" && t_iteminfo.kind === libConst.WearItem_Kind.Assis_Arrow) {
                            if(obj.getEquimentInfo("righthand") === null || obj.getEquimentInfo("righthand").kind !== libConst.WearItem_Kind.Far_Weapon) {
                                return "주 장비가 활이 아니면, 화살을 장착할 수 없습니다.";
                            }
                        }
                        //[방패 장착시 오른손에 활인지 아닌지 먼저 확인한다.]
                        if(position === "lefthand" && t_iteminfo.kind === libConst.WearItem_Kind.Assis_Shield) {
                            if(obj.getEquimentInfo("righthand") === null || obj.getEquimentInfo("righthand").kind === libConst.WearItem_Kind.Far_Weapon) {
                                return "주 장비가 활이면, 방패를 장착할 수 없습니다.";
                            }
                        }

                        //[장비 제한 수치가 있을경우 제한 수치가 안되면 막는다.]
                        stat = obj.getStatus();
                        limitList = t_iteminfo.limit;
                        for(i = 0; i < limitList.length; ++i) {
                            limit = limitList[i];
                            if(Number(stat[limit.statname]) < Number(limit.count)) {
                                rtnstr = "장비 스텟 제한이 걸렸습니다.\n\n(요구 필요 스텟)\n";
                                for(j = 0; j < limitList.length; ++j) {
                                    rtnstr += "  L " + limitList[j].statname + "+" + limitList[j].count + "\n";
                                }
                                return rtnstr;
                            }
                        }

                        if(equipment[position] !== "") {
                            obj.addItem(libConst.ITEM_KIND["WEARITEM"], equipment[position], 1, equilevel[position]);
                        }
                        //[활 일떄, 왼쪽 장비가 화살이 아니면 제거한다.]
                        if(position === "righthand" && t_iteminfo.kind === libConst.WearItem_Kind.Far_Weapon) {
                            if(!obj.isEquimentArrow()) {
                                removeItem = obj.getEquimentInfo("lefthand");
                                if(removeItem !== null) {
                                    rtnstr += "" + removeItem.name + "을(를) 제거합니다.\n";
                                    obj.addItem(libConst.ITEM_KIND["WEARITEM"], removeItem.index, 1, equilevel["lefthand"]);
                                    obj.removeEquiment("lefthand");
                                }

                            }
                        }
                        //[활 이외의 무기일경우 왼쪽 장비가 화살이면 제거한다.]
                        else if(position === "righthand") {
                            if(obj.isEquimentArrow()) {
                                removeItem = obj.getEquimentInfo("lefthand");
                                rtnstr += "" + removeItem.name + "을(를) 제거합니다.\n";
                                obj.addItem(libConst.ITEM_KIND["WEARITEM"], removeItem.index, 1, equilevel["lefthand"]);
                                obj.removeEquiment("lefthand");
                            }
                        }

                        obj.setEquiment(t_iteminfo.index, position, Number(itemlevel));
                        obj.removeItem(libConst.ITEM_KIND["WEARITEM"], t_iteminfo.index, 1, Number(itemlevel));
                        obj.calcAbility(false);
                        _Save();
                        rtnstr += "" + t_iteminfo.name + "을(를) " + position + " 위치에 장착했습니다.";
                    }
                    else {
                        rtnstr = "가방엔 없는 장비 이거나 강화 레벨이 다릅니다.";
                    }
                }
                else{
                    rtnstr = "존재하지 않는 장비 입니다.";
                }

            }
            return rtnstr;
        },
        Desorption:function(_id, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", t_iteminfo, equimentidx, equimentlevel;
            var spl_item = _itemname.split("+");
            var itemname, itemlevel;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];
                t_iteminfo = db_Manager.Search(itemname, "WEARITEM", "name");
                if(t_iteminfo !== null) {
                    equimentidx = obj.getEquiment()[t_iteminfo.wearpos];
                    equimentlevel = obj.getEquimentLevel()[t_iteminfo.wearpos];
                    if(equimentidx === t_iteminfo.index && equimentlevel === Number(itemlevel)) {
                        obj.removeEquiment(t_iteminfo.wearpos);
                        obj.addItem(libConst.ITEM_KIND["WEARITEM"], t_iteminfo.index, 1, equimentlevel);
                        obj.calcAbility(false);
                        _Save();
                        rtnstr += "" + t_iteminfo.name + "을(를) 탈착했습니다.";
                    }
                    else {
                        rtnstr = "해당장비를 장착하고 있지 않거나, 강화레벨이 맞지 않습니다.";
                    }
                }
                else{
                    rtnstr = "존재하지 않는 장비 입니다.";
                }
            }
            return rtnstr;
        },
        GoMining:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, buff;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("채굴하기")) {
                    rtnstr = "현재위치에서는 채굴하기를 할수 없습니다.";
                    return rtnstr;
                }

                var d = new Date();
                obj.startMining();
                _Save();
                rtnstr = "현재시간 " + d + " 부터 채굴을 시작합니다.\n\n";
                buff = PetManager.getBuffAmountByKind(_id, "mine");
                rtnstr += (Math.floor(libConst.MiningDefaultSpeed - (libConst.MiningDefaultSpeed * buff / 100))/60000) + "분 채굴시 획득 재화를 확률적으로 획득합니다.\n\n";
                rtnstr += "채굴 종료 명령어 : !채굴종료";
            }
            return rtnstr;
        },
        StopMining:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", itemlist, tmpitem, itemCount = [], buff;
            var rewardList = null;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                buff = PetManager.getBuffAmountByKind(_id, "mine");
                itemlist = obj.endMining(buff);
                rtnstr += "[채굴 결과]\n\n";
                if(buff !== 0) {
                    rtnstr += "  L 펫 버프의 효과로 인해 더 많은 광석을 채굴하였습니다.\n\n";
                }
                for(var c = 0; c < obj.const_MINEITEMLIST.length; ++c) {
                    itemCount.push(0);
                }
                for(var i = 0; i < itemlist.length; ++i) {
                    itemCount[obj.const_MINEITEMLIST.indexOf(itemlist[i])]++;
                    obj.addItem(libConst.ITEM_KIND.SUNDRYITEM, itemlist[i], 1);
                }
                for(var j = 0; j < obj.const_MINEITEMLIST.length; ++j){
                    tmpitem = db_Manager.getSundryItem(obj.const_MINEITEMLIST[j]);
                    rtnstr += "  - " + tmpitem.name + "을(를) " + itemCount[j] + "개 획득하였습니다.\n";
                }
                RecordManager.rcdMineTime(_id, itemlist.length);

                rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Mine, itemlist.length);
                if(rewardList.length > 0) {
                    rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                    rtnstr += _HomeWorkReward(obj, rewardList);
                }
                _Save();
            }

            return rtnstr;
        },
        isMining:function(_id) {
            var obj = _Find(_id);
            if (obj !== null && obj.getMiningTiem() !== -1) {
                return true;
            }
            return false;
        },
        useItem:function(_id, _itemname, _count) {
            var obj = _Find(_id), i, j;
            var rtnstr = "", dbItem, loc, tmpdata, stat, rune, tmpitem, dbdata, total = 0, precnt = 0, cnt = 0;
            var speciesList = [];
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                dbItem = db_Manager.Search(_itemname, "FUNCTIONALITYITEM", "name");
                if(dbItem === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
                else {
                    if(obj.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index)) {
                        switch(dbItem.kind)
                        {
                            case "recovery":
                                obj.Recovery(dbItem.effect, dbItem.amount);
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                rtnstr += "" + dbItem.effect + "이(가) " + dbItem.amount + "% 회복하였습니다.";
                                break;
                            case "recovery2":
                                obj.RecoveryforNum(dbItem.effect, Number(dbItem.amount));
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                rtnstr += "" + dbItem.effect + "이(가) +" + dbItem.amount + " 회복하였습니다.";
                                break;
                            case "recall" :
                                if(obj.getStoningTiem() !== -1) {
                                    rtnstr += "채광중엔 해당장소를 떠날수 없습니다.";
                                    break;
                                }
                                else if(obj.getFellingTiem() !== -1) {
                                    rtnstr += "벌목중엔 해당장소를 떠날수 없습니다.";
                                    break;
                                }
                                else if(obj.getMiningTiem() !== -1) {
                                    rtnstr += "채굴중엔 해당장소를 떠날수 없습니다.";
                                    break;
                                }
                                else if(obj.getGettingTiem() !== -1) {
                                    rtnstr += "채집중엔 해당장소를 떠날수 없습니다.";
                                    break;
                                }
                                else if(obj.getIsDungeon("dungeon")) {
                                    rtnstr += "던전 진입중이라서 떠날수 없습니다.";
                                    break;
                                }
                                else if(obj.getIsDungeon("occupy")) {
                                    rtnstr += "점령전 중이라서 떠날수 없습니다.";
                                    break;
                                }
                                else {
                                    loc = dbItem.amount;
                                    tmpdata = db_Manager.getCity(loc);
                                    if(tmpdata.needquest !== "" && !obj.isCompliteQuest(tmpdata.needquest)) {
                                        rtnstr += "해당 지역은 퀘스트를 완료해야 이동 가능합니다.";
                                        break;
                                    }
                                    obj.setLocation(tmpdata.attach, loc, "", "", "", "");
                                    obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                    rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                    rtnstr += "" + tmpdata.name + "으로 이동였습니다.";
                                }
                                break;
                            case "species":
                                tmpdata = dbItem.amount;
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                obj.setSpecies(tmpdata);
                                obj.calcAbility(false);
                                rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                rtnstr += "" + tmpdata + "(으)로 종족을 변경하였습니다.";
                                break;
                            case "reset":
                                stat = _ChangeStat(dbItem.effect);
                                if(obj.getPurchaseStat() === 0) {
                                    rtnstr += "초기화할 스텟이 존재하지 않습니다.";
                                    break;
                                }
                                else if(obj.getStatus()[dbItem.effect] <= 0) {
                                    rtnstr += stat + "은(는) 이미 0 이므로 초기화 할수 없습니다.";
                                    break;
                                }
                                tmpdata = dbItem.amount;
                                rune = 0;
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                for(i = 0; i < Number(tmpdata); ++i) {
                                    if(obj.getPurchaseStat() === 0) {
                                        rtnstr += "모든 스텟이 초기화 되어 초기화 남은 횟수는 사라집니다.\n  - 진행된 초기화 횟수 : " + i + "회\n\n";
                                        tmpdata = i;
                                        break;
                                    }
                                    else if(obj.getStatus()[dbItem.effect] <= 0){
                                        rtnstr += stat + "은(는) 0에 도달하여 남은 초기화 횟수는 사라집니다.\n  - 진행된 초기화 횟수 : " + i + "회\n\n";
                                        tmpdata = i;
                                        break;
                                    }
                                    obj.decPurchaseStat();
                                    obj.setStatusForName(dbItem.effect, -1);
                                    obj.addRune(Math.floor(obj.calcNextPruchaseStat() / 2));
                                    rune += Math.floor(obj.calcNextPruchaseStat() / 2);
                                }
                                obj.calcAbility(false);
                                rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                rtnstr += "" + rune + " rune을 획득하였습니다.\n";
                                rtnstr += "" + stat + "을(를) " + tmpdata + "개 망각하였습니다.";
                                break;
                            case "skill" :
                                tmpdata = dbItem.amount;
                                dbdata = db_Manager.getSkill(tmpdata);
                                _FindUnderSpecies(obj.getSpecies(), speciesList);
                                if(dbdata.spec === "all" || speciesList.indexOf(dbdata.spec) !== -1) {
                                    if(dbdata.preskill === "" || obj.isSkill(dbdata.preskill) !== -1) {
                                        if(obj.isSkill(tmpdata) === -1) {
                                            obj.addSkill(tmpdata);
                                            obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                            rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                            rtnstr += "" + dbdata.name + "을(를) 습득하였습니다.";
                                        }
                                        else {
                                            rtnstr = "이미 해당 스킬을 보유하고 있습니다.";
                                        }
                                    }
                                    else {
                                        rtnstr = "선행 스킬 [" + db_Manager.getSkill(dbdata.preskill).name + "] 을(를) 먼저 배워야 합니다.";
                                    }
                                }
                                else {
                                    rtnstr = "해당 스킬은 " + dbdata.spec + " 전용 스킬이라서 배울 수 없습니다.";
                                }
                                break;
                            case "summon" :
                                tmpdata = dbItem.amount;
                                dbdata = db_Manager.getSummonSkill(tmpdata);
                                if(dbdata.spec === "all" || dbdata.spec === obj.getSpecies()) {
                                    if(dbdata.type === obj.getSummonType()) {
                                        if(obj.isSummonSkill(tmpdata) === -1) {
                                            obj.addSummonSkill(tmpdata);
                                            obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                            rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                            rtnstr += "" + dbdata.name + "을(를) 습득하였습니다.";
                                        }
                                        else {
                                            rtnstr = "이미 해당 스킬을 보유하고 있습니다.";
                                        }
                                    }
                                    else {
                                        rtnstr = "현재 등록된 소환사 타입과 맞지 않는 스킬입니다.\n\n" +
                                                 "  - 본인 소환사 타입 : " + _ChangeSummonType(obj.getSummonType()) + "\n" +
                                                 "  - 소환 스킬 타입 : " + _ChangeSummonType(dbdata.type);
                                    }
                                }
                                else {
                                    rtnstr = "해당 스킬은 " + dbdata.spec + " 전용 스킬이라서 배울 수 없습니다.";
                                }
                                break;
                            case "buff" :
                                tmpdata = dbItem.amount.split(";");
                                if(obj.getBuffCount() > libConst.BuffCount) {
                                    rtnstr = "현재 버프 갯수가 넘어섰기 때문에 " + dbItem.name + "을(를) 사용할 수 없습니다.";
                                    return rtnstr;
                                }
                                else if(obj.getBuffCount() === libConst.BuffCount){
                                    rtnstr = "현재 버프가 가득차서, 가장 오래된 버프를 제거합니다.";
                                }
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                obj.addBuff(dbItem.effect, Number(tmpdata[0]), Number(tmpdata[1]));
                                rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                rtnstr += "" + tmpdata[1] + "회 전투동안 " + _ChangeStat(dbItem.effect) + "+" + tmpdata[0] + "을 향상시킵니다.\n";
                                break;
                            case "stat" :
                                if(!obj.isItemCount(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, _count)) {
                                    rtnstr += "아이템 갯수가 부족합니다.";
                                    break;
                                }
                                tmpdata = dbItem.amount;
                                obj.setStatusForName(dbItem.effect, Number(tmpdata) * _count);
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, _count);
                                RecordManager.setStatus(obj.name, obj.getStatus());
                                obj.calcAbility(false);
                                rtnstr += "" + dbItem.name + "을(를) " + _count + "개 사용하였습니다.\n";
                                stat = _ChangeStat(dbItem.effect);
                                rtnstr += "" + stat + "을(를) +" + (Number(tmpdata) * _count) + " 향상시켰습니다.";
                                break;
                            case "recipe" :
                                if(obj.isRecipe(dbItem.index)) {
                                    rtnstr += "이미 습득한 레시피 입니다.";
                                    break;
                                }
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                obj.addRecipe(dbItem.index);
                                rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                rtnstr += "레시피를 습득하였습니다.\n\n !레시피 명령어로 확인하시기 바랍니다.";
                                break;
                            case "rune" :
                                total = obj.getItemCount(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index);
                                if(_count < total) {
                                    total = _count;
                                }
                                else {
                                    rtnstr += "현재 보유중인 " + dbItem.name + "갯수가 부족하여 " + total + "개만 사용합니다.\n\n";
                                }

                                rune = 0;
                                for(i = 0; i < total; ++i) {
                                    tmpdata = dbItem.amount.split("~");
                                    rune += libCommon.Rand(Number(tmpdata[0]), Number(tmpdata[1]));
                                }

                                obj.addRune(rune);
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, total);
                                rtnstr += "" + dbItem.name + "을(를) " + total + "개 사용하였습니다.\n";
                                rtnstr += "" + rune + " rune을 획득하였습니다.";
                                break;
                            case "mercenary" :
                                if(!MercenaryManager.Hire(_id, dbItem.amount)) {
                                    rtnstr = "고용가능한 최대 용병 수를 넘겼습니다. \n  - 최대 고용 용병수 : " + libConst.MercenaryCount;
                                }
                                else {
                                    obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                    rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                    rtnstr += "고용을 완료하였습니다.";
                                }
                                break;
                            case "randombox" :
                                if(!obj.isItemCount(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, _count)) {
                                    rtnstr += "아이템 갯수가 부족합니다.";
                                    break;
                                }
                                dbdata = db_Manager.getRandBoxList(dbItem.index);
                                for(i = 0; i < dbdata.length; ++i) {
                                    total += Number(dbdata[i].rate);
                                }

                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, _count);
                                rtnstr += "" + dbItem.name + "을(를) " + _count + "개 사용하였습니다.\n\n";
                                for(j = 0; j < _count; ++j) {
                                    tmpdata = libCommon.Randfloat(0, total);

                                    precnt = 0;
                                    for(i = 0; i < dbdata.length; ++i) {
                                        if(precnt <= tmpdata && (precnt+Number(dbdata[i].rate)) > tmpdata) {
                                            tmpitem = db_Manager.getItem(dbdata[i].itemkind, dbdata[i].itemidx);
                                            break;
                                        }
                                        else {
                                            precnt += Number(dbdata[i].rate);
                                        }
                                    }
                                    
                                    obj.addItem(dbdata[i].itemkind, dbdata[i].itemidx, Number(dbdata[i].itemcount));
                                    rtnstr += "" + tmpitem.name + " 을(를) " + dbdata[i].itemcount + "개 획득하였습니다.\n";
                                }
                                break;
                            case "package":
                                total = obj.getItemCount(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index);
                                if(_count <= total) {
                                    total = _count;
                                }
                                else {
                                    rtnstr += "현재 보유중인 " + dbItem.name + "갯수가 부족하여 " + total + "개만 사용합니다.\n\n";
                                }
                                dbdata = db_Manager.getPackage(dbItem.index);

                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, total);
                                rtnstr += "" + dbItem.name + "을(를) " + total + "개 사용하였습니다.\n\n";
                                for(i = 0; i < dbdata.itemlist.length; ++i) {
                                    tmpitem = db_Manager.getItem(dbdata.itemlist[i].itemkind, dbdata.itemlist[i].itemidx);

                                    cnt =  Number(dbdata.itemlist[i].count) * Number(total);
                                    obj.addItem(dbdata.itemlist[i].itemkind, dbdata.itemlist[i].itemidx, cnt);
                                    rtnstr += "" + tmpitem.name + " 을(를) " + cnt + "개 획득하였습니다.\n";
                                }
                                break;
                            case "storyquest":
                                tmpdata = dbItem.amount;
                                if(obj.isCompliteQuest(tmpdata)) {
                                    rtnstr = "이미 완료된 퀘스트 입니다.";
                                }
                                else if(obj.isQuest(tmpdata)) {
                                    rtnstr = "현재 수행중인 퀘스트 입니다.";
                                }
                                else {
                                    obj.setTargetQuest(tmpdata); 
                                    obj.confirmTargetQuest();
                                    obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                    rtnstr = "퀘스트를 수락하였습니다.";   
                                }
                                break;
                            case "repeatquest":
                                tmpdata = dbItem.amount;
                                if(obj.isQuest(tmpdata)) {
                                    rtnstr = "현재 수행중인 퀘스트 입니다.";
                                }
                                else {
                                    obj.setTargetQuest(tmpdata); 
                                    obj.confirmTargetQuest();
                                    obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                    rtnstr = "퀘스트를 수락하였습니다.";   
                                }
                                break;
                        }
                        _Save();
                    }
                    else {
                        rtnstr = "해당 아이템을 보유하고 있지 않습니다.";
                    }
                }
            }
            return rtnstr;
        },
        Menufacture:function(_id, _count, _itemname, _ishigh) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, i, itemkind, itemfunc, itemList, menufactureObj, materialList, targetItem = null,  possible = true, isFlag = false;
            var buff, count;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !(facilityDB.action.includes("제조하기") || facilityDB.action.includes("장비제작") || facilityDB.action.includes("생산하기"))) {
                    rtnstr = "제조/제작/생산할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(facilityDB.action.includes("제조하기")) {
                    itemkind = libConst.ITEM_KIND.SUNDRYITEM;
                    itemfunc = db_Manager.getSundryItem;
                    targetItem = db_Manager.Search(_itemname, "SUNDRYITEM", "name");
                }
                if(targetItem === null && facilityDB.action.includes("장비제작")) {
                    itemkind = libConst.ITEM_KIND.WEARITEM;
                    itemfunc = db_Manager.getWearItem;
                    targetItem = db_Manager.Search(_itemname, "WEARITEM", "name");
                }
                if(targetItem === null && facilityDB.action.includes("생산하기")) {
                    itemkind = libConst.ITEM_KIND.FUNCTIONALITYITEM;
                    itemfunc = db_Manager.getFunctionalityItem;
                    targetItem = db_Manager.Search(_itemname, "FUNCTIONALITYITEM", "name");
                }

                if(targetItem === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
                else {
                    itemList = (_ishigh?db_Manager.getHighMenufactureList(user_loc.city, user_loc.facility, itemkind):db_Manager.getMenufactureList(user_loc.city, user_loc.facility, itemkind));
                    for(i = 0; i < itemList.length; ++i) {
                        if(itemList[i].index === targetItem.index) {
                            isFlag = true;
                            break;
                        }
                    }

                    if(isFlag) {
                        menufactureObj = (_ishigh?db_Manager.getHighMenufacture(targetItem.index, itemkind):db_Manager.getMenufacture(targetItem.index, itemkind));
                        materialList = menufactureObj.material;
                        buff = PetManager.getBuffAmountByKind(_id, "reduce");
                        if(buff !== 0) {
                            rtnstr += "펫 버프로 인하여 재료가 " + buff + "% 줄어듭니다.\n";
                        }
                        if(obj.getRune() < (Number(menufactureObj.needrune) * _count)) {
                            possible = false;
                        }
                        else {
                            for(i = 0; i < materialList.length; ++i) {
                                count = (_ishigh?Number(materialList[i].count): Math.floor(Number(materialList[i].count) - (Number(materialList[i].count) * buff / 100)));
                                if(count <= 0)
                                    count = 1;
                                if(_ishigh) {
                                    if(obj.getItemCountOfUpStrength(materialList[i].itemkind, materialList[i].itemIdx, Number(materialList[i].strength)) < (count * _count)) {
                                        possible = false;
                                        break;
                                    }
                                }
                                else {
                                    if(obj.getItemCount(materialList[i].itemkind, materialList[i].itemIdx) < (count * _count)) {
                                        possible = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if(possible) {
                            obj.addItem(menufactureObj.itemkind, menufactureObj.index, _count);
                            for(var j = 0; j < materialList.length; ++j) {
                                count = (_ishigh?Number(materialList[j].count): Math.floor(Number(materialList[j].count) - (Number(materialList[j].count) * buff / 100)));
                                if(count <= 0)
                                    count = 1;
                                if(_ishigh) {
                                    obj.removeItemOfUpStrength(materialList[j].itemkind, materialList[j].itemIdx, count * _count, Number(materialList[j].strength));
                                }
                                else {
                                    obj.removeItem(materialList[j].itemkind, materialList[j].itemIdx, count * _count);
                                }

                            }
                            obj.addRune(-(Number(menufactureObj.needrune) * _count));
                            rtnstr += "제조를 완료하였습니다.";
                            _Save();
                        }
                        else {
                            rtnstr = "제조를 실패하였습니다. - 룬과 재료갯수를 확인 바랍니다.";
                        }
                    }
                    else {
                        rtnstr = "해당 아이템은 제조 리스트에 없습니다.";
                    }
                }
            }
            return rtnstr;
        },
        SummonBoss:function(_id, _count) {
            var obj = _Find(_id);
            var opt = _FindOption(_id);
            var rtnstr = "", dbItem, fieldInfo;
            var rewardList = null;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(obj.getLocation().field === "")
                    rtnstr = "현재위치에서는 보스소환이 불가능합니다.";
                else {
                    fieldInfo = db_Manager.getField(obj.getLocation().field);
                    if(fieldInfo.boss !== ""){
                        if(obj.getAbility().ap < Number(fieldInfo.needap)) {
                            rtnstr += "행동력이 부족합니다.\n";

                            if(opt.getApOpt() === "") {
                                rtnstr += "전투를 종료합니다.";
                                return rtnstr;
                            }
                            else {
                                dbItem = db_Manager.getFunctionalityItem(opt.getApOpt());
                                if(obj.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index)) {
                                    if(dbItem.kind === "recovery") {
                                        obj.Recovery(dbItem.effect, dbItem.amount);
                                        obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                        rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                        rtnstr += "" + dbItem.effect + "이(가) " + dbItem.amount + "% 회복하였습니다.";
                                    }
                                    else if(dbItem.kind === "recovery2") {
                                        obj.RecoveryforNum(dbItem.effect, Number(dbItem.amount));
                                        obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.index, 1);
                                        rtnstr += "" + dbItem.name + "을(를) 사용하였습니다.\n";
                                        rtnstr += "" + dbItem.effect + "이(가) +" + dbItem.amount + " 회복하였습니다.";
                                    }
                                }
                                else {
                                    rtnstr += dbItem.name + "(이)가 부족하여 AP 회복을 할 수 없습니다.";
                                    return rtnstr;
                                }
                                rtnstr += "\n\n";
                            }
                        }

                        if(obj.isItem(libConst.ITEM_KIND.SUNDRYITEM, fieldInfo.summonitem)) {
                            if(obj.getAbility().hp > 0) {
                                rtnstr += "[보스 전투 결과]" + libConst.dummy + "\n\n";
                                rtnstr += m_huntSystem.Boss(obj, _count, _FindOption(_id), fieldInfo.summonitem, fieldInfo.boss, MercenaryManager.getMercenary(_id), MercenaryManager, BattleManager.getMyRank(_id), fieldInfo.needap);
                                MercenaryManager.Save();

                                rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Fieldboss, 1);
                                if(rewardList.length > 0) {
                                    rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                                    rtnstr += _HomeWorkReward(obj, rewardList);
                                }
                            }
                            else {
                                rtnstr = "체력이 부족합니다.";
                            }
                        }
                        else {
                            rtnstr = "보스 소환에 필요한 아이템을 소지하고 있지 않습니다.\n";
                            rtnstr += " - 필요 아이템 : " + db_Manager.getSundryItem(fieldInfo.summonitem).name;
                        }
                        _Save();
                    }
                    else {
                        rtnstr = "현재 필드엔 보스가 존재 하지 않습니다.";
                    }
                }
            }
            return rtnstr;
        },
        injectRune:function(_id, _rune) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("제물기부")) {
                    rtnstr = "현재위치에서는 제물기부가 불가능합니다.";
                    return rtnstr;
                }

                if(!WorldBossManager.getSummonYN(obj.getLocation())) {
                    if(obj.addRune(-Number(_rune))) {
                        var total = WorldBossManager.injectRune(obj.name, obj.getLocation(), _rune);
                        rtnstr = "[" + _id + "] 제물 기부 정보\n\n";
                        rtnstr += "  - 기부 룬 : " + _rune + "\n";
                        rtnstr += "  - 내 누적 기부 룬 : " + WorldBossManager.getMyinjectRune(obj.name, obj.getLocation()) + "\n";
                        rtnstr += "  - 총 누적 기부 룬 : " + total + "\n";

                        _Save();
                    }
                    else {
                        rtnstr = "소지 룬이 부족합니다.";
                    }
                }
                else {
                    rtnstr = "현재 전설적인 존재가 강림한 상태임으로 제물을 기부할수 없습니다.";
                }
            }

            return rtnstr;
        },
        getAltarInfo:function(_id) {
            var obj = _Find(_id), i;
            var rtnstr = "", injectList = [], damageList= [], user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("제단정보")) {
                    rtnstr = "현재위치에서는 제단정보 확인이 불가능합니다.";
                    return rtnstr;
                }

                rtnstr = "[현 제단 정보]\n\n";
                rtnstr += "  - 소환여부 : " + (WorldBossManager.getSummonYN(obj.getLocation())?"소환됨":"소멸됨") + "\n";
                rtnstr += "  - 제단 누적 금액 : " + WorldBossManager.getTotalinjectRune(obj.getLocation()) + " (rune)\n";
                rtnstr += "  - 기부 금액 리스트\n";
                injectList = WorldBossManager.getInjectList(obj.getLocation());
                for(i = 0; i < injectList.length; ++i) {
                    rtnstr += "    L Rank " + injectList[i].rank +". " + injectList[i].userid + " : " + injectList[i].rune + "(rune)\n";
                }
                rtnstr += "  - 데미지 리스트\n";
                damageList = WorldBossManager.getDamageRankList(obj.getLocation());
                for(i = 0; i < damageList.length; ++i) {
                    rtnstr += "    L Rank " + damageList[i].rank +". " + damageList[i].userid + " : " + damageList[i].damage + "(dmg)\n";
                }
            }
            return rtnstr;
        },
        LegendSummon:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("전설소환")) {
                    rtnstr = "현재위치에서는 전설적인 존재 강림할 수 없습니다.";
                    return rtnstr;
                }

                if(!WorldBossManager.getSummonYN(obj.getLocation())) {
                    if(WorldBossManager.Summon(obj.getLocation())){
                        rtnstr = "[" + WorldBossManager.getLocalBossInfo(obj.getLocation()).name + "] 전설 소환 완료.";
                    }
                    else {
                        rtnstr = "현재 제단의 제물이 부족합니다.\n";
                        rtnstr += "  - 소환까지 남은 룬 : " + WorldBossManager.getRemainRune(obj.getLocation());
                    }
                }
                else {
                    rtnstr = "이미 전설적인 존재가 강림한 상태 입니다.";
                }
            }
            return rtnstr;
        },
        LegendChallenge:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("도전하기")) {
                    rtnstr = "현재위치에서는 전설적인 존재에게 도전할 수 없습니다.";
                    return rtnstr;
                }

                if(WorldBossManager.getSummonYN(obj.getLocation())) {
                    rtnstr += "[월드 보스 전투 결과]" + libConst.dummy + "\n\n";
                    rtnstr += m_huntSystem.WorldBoss(obj, _FindOption(_id), WorldBossManager.getBossStatus(obj.getLocation()), MercenaryManager.getMercenary(_id), MercenaryManager, BattleManager.getMyRank(_id));
                    if(WorldBossManager.ResultAndReward(obj.getLocation())){
                        RecordManager.rcdLastWorldBoss(_id);
                        rtnstr += "\n월드 보스를 처치하였습니다.";
                    }
                    else {
                        rtnstr += "\n월드 보스가 건재 합니다. 다시 도전하시기 바랍니다.";
                    }

                    _Save();
                    MercenaryManager.Save();
                }
                else {
                    rtnstr = "현재 전설적인 존재가 소환되지 않는 상태 입니다.";
                }

            }

            return rtnstr;
        },
        checkAutoSummon:function() {
            return WorldBossManager.checkAutoSummon();
        },
        LearnSkill:function(_id, _skillname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, skillinfo, saleskills, facilityDB, isFlag = false, kind = "skill";
            var speciesList = [];
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !(facilityDB.action.includes("스킬배우기") || facilityDB.action.includes("소환배우기"))) {
                    rtnstr = "스킬/소환 배우기를 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }


                skillinfo = db_Manager.Search(_skillname, "SKILL", "name");
                saleskills = db_Manager.getSkillSaleList(user_loc.city, user_loc.facility);
                if(skillinfo === null) {
                    skillinfo = db_Manager.Search(_skillname, "SUMMONSKILL", "name");
                    saleskills = db_Manager.getSummonSaleList(user_loc.city, user_loc.facility);
                    kind = "summon";
                }

                if(skillinfo !== null) {
                    for(var i = 0; i < saleskills.length; ++i) {
                        if(saleskills[i].skill === skillinfo.index) {
                            isFlag = true;
                            break;
                        }
                    }
                    if(isFlag) {
                        _FindUnderSpecies(obj.getSpecies(), speciesList);
                        if(skillinfo.spec === "all" || speciesList.indexOf(skillinfo.spec) !== -1) {
                            if(kind === "skill") {
                                if(skillinfo.preskill === "" || obj.isSkill(skillinfo.preskill) !== -1) {
                                    if(obj.isSkill(skillinfo.index) === -1) {
                                        if(obj.addRune(-Number(skillinfo.needrune))){
                                            obj.addSkill(skillinfo.index);
                                            rtnstr = "(" + skillinfo.kind + ")" + skillinfo.name + "을(를) 배웠습니다.";
                                            RecordManager.rcdSkillCnt(_id);
                                            _Save();
                                        }
                                        else {
                                            rtnstr = "보유중인 룬이 부족합니다.";
                                        }
                                    }
                                    else {
                                        rtnstr = "이미 해당 스킬을 보유하고 있습니다.";
                                    }
                                }
                                else {
                                    rtnstr = "선행 스킬 [" + db_Manager.getSkill(skillinfo.preskill).name + "] 을(를) 먼저 배워야 합니다.";
                                }
                            }
                            else {
                                if(obj.isSummonSkill(skillinfo.index) === -1) {
                                    if(obj.addRune(-Number(skillinfo.needrune))){
                                        if(obj.getSummonType() === skillinfo.type) {
                                            obj.addSummonSkill(skillinfo.index);
                                            rtnstr = "(" + _ChangeSummonType(skillinfo.type) + ")" + skillinfo.name + "을(를) 배웠습니다.";
                                            RecordManager.rcdSkillCnt(_id);
                                        }
                                        else {
                                            obj.addRune(Number(skillinfo.needrune));
                                            rtnstr = "소환타입이 달라서 스킬을 배울 수 없습니다.";
                                        }
                                        _Save();
                                    }
                                    else {
                                        rtnstr = "보유중인 룬이 부족합니다.";
                                    }
                                }
                                else {
                                    rtnstr = "이미 해당 스킬을 보유하고 있습니다.";
                                }
                            }
                        }
                        else {
                            rtnstr = "해당 스킬은 " + skillinfo.spec + " 전용 스킬이라서 배울 수 없습니다.";
                        }
                    }
                    else {
                        rtnstr = "이곳에서는 배울수 없는 스킬입니다.";
                    }
                }
                else {
                    rtnstr = _skillname + "은(는) 존재하지 않는 스킬 입니다.";
                }
            }
            return rtnstr;
        },
        Betting:function(_id, _rune, _target) {
            var obj = _Find(_id);
            var rtnstr = "", result = "", user_loc, r, targets = [], tmpTG, rate = 1, winFlag = true, facilityDB, buff;
            var rewardList = null;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("룰렛")) {
                    rtnstr = "도박장이 아닙니다.";
                    return rtnstr;
                }

                if(obj.getLoan().kind === "loan") {
                    rtnstr = "대출이 있어 도박을 할수 없습니다.\n";
                    return rtnstr;
                }

                if(_rune > libConst.BettingRuneLimit)
                {
                  rtnstr = "배팅금액 한도를 넘었습니다.\n";
                  rtnstr = "배팅 한도 : " + libConst.BettingRuneLimit + " (rune)";
                  return rtnstr;
                }

                if(_target.length === 1){
                    targets.push(_target);
                }
                else {
                    targets.push(_target.substring(0,1));
                    targets.push(_target.substring(1,2));
                }

                if(obj.addRune(-Number(_rune))){
                    rtnstr += "룰렛을 돌립니다.\n";
                    rtnstr += "당신은 [" + _target + "] 에 배팅을 합니다.\n";
                    for(var i = 0; i < targets.length; ++i) {
                        tmpTG = targets[i];

                        if(tmpTG === "흑" || tmpTG === "적"){
                            r = (libCommon.Rand(0,1) === 0?"흑":"적");
                            result += r;
                            if(r === tmpTG) {
                                rate *= 2;
                            }
                            else {
                                winFlag = false;
                            }
                        }
                        else {
                            r = libCommon.Rand(1,9);
                            result += r;
                            if((tmpTG === "하" && r >= 1 && r <= 3) || (tmpTG === "중" && r >= 4 && r <= 6) || (tmpTG === "상" && r >= 7 && r <= 9)) {
                                rate *= 3;
                            }
                            else if(Number(tmpTG) === r)
                            {
                                rate *= 9;
                            }
                            else {
                                winFlag = false;
                            }
                        }
                    }
                    rtnstr += "룰렛 결과는 [" + result + "] 입니다.\n";
                    if(winFlag){
                        buff = 1 + (PetManager.getBuffAmountByKind(_id, "rollet") / 100);
                        if(buff !== 0) {
                            rtnstr += "당첨 입니다. " + rate + "배 & 펫버프로 인한 추가 배율의 룬인 " + Math.floor(Number(_rune) * rate * buff) + "룬을 획득합니다.";
                            obj.addRune(Math.floor(Number(_rune) * rate * buff));
                            RecordManager.rcdMaxRune(_id, Math.floor(Number(_rune) * rate * buff));
                        }
                        else {
                            rtnstr += "당첨 입니다. " + rate + "배의 룬인 " + (Number(_rune) * rate) + "룬을 획득합니다.";
                            obj.addRune(Number(_rune) * rate);
                            RecordManager.rcdMaxRune(_id, Number(_rune) * rate);
                        }
                        RecordManager.rcdGamble(_id, true);

                        rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.VictoryRoulette, 1);
                        if(rewardList.length > 0) {
                            rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                            rtnstr += _HomeWorkReward(obj, rewardList);
                        }
                    }
                    else {
                        rtnstr += "실패 입니다. " + _rune + "룬을 잃습니다.";
                        RecordManager.rcdGamble(_id, false);
                    }
                    _Save();
                }
                else {
                    rtnstr += "현재 배팅금액에 해당하는 룬을 가지고 있지 않습니다.";
                }
            }
            return rtnstr;
        },
        RecivePost:function(_id, _items, _rune) {
            var obj = _Find(_id);
            var rtnstr = "", item;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr += _RecivePost(obj, _items, _rune);
                _Save();
            }
            return rtnstr;
        },
        ReciveAllPost:function(_id, _postlist) {
            var obj = _Find(_id);
            var rtnstr = "", post;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                for(var i = 0; i < _postlist.length; ++i) {
                    post = _postlist[i];
                    rtnstr += _RecivePost(obj, post.items, post.rune);
                }

                _Save();
            }
            return rtnstr;
        },
        MatchGame:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, matcher, facilityDB;
            var rewardList = null;
            var i = 0;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("시합하기")) {
                    rtnstr = "해당위치에서는 시합을 할 수 없습니다.";
                    return rtnstr;
                }

                if(!BattleManager.isUser(_id)){
                    BattleManager.Enroll(_id);
                }

                matcher = BattleManager.getMatcherName(_id);
                if(matcher !== "") {
                    if(obj.addRune(-libConst.ColosseumRune)) {
                        rtnstr += "[콜로세움 전투 결과]" + libConst.dummy + "\n\n";
                        rtnstr += "" + libConst.ColosseumRune + " Rune을 소모합니다.\n\n";
                        rtnstr += BattleManager.Battle(obj, _Find(matcher), _FindOption(_id), _FindOption(matcher));

                        rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Fight, 1);
                        if(rewardList.length > 0) {
                            rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                            rtnstr += _HomeWorkReward(obj, rewardList);
                        }
                        _Save();
                    }
                    else {
                        rtnstr = "Rune이 부족합니다. (필요 룬 : " + libConst.ColosseumRune + " Rune)";
                    }
                }
                else {
                    rtnstr += "현재 랭킹 1위입니다.";
                    
                    rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Fight, 1);
                    if(rewardList.length > 0) {
                        rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                        rtnstr += _HomeWorkReward(obj, rewardList);
                    }
                }
            }
            return rtnstr;
        },
        RankingInfo:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            var i = 0;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("랭킹정보")) {
                    rtnstr = "해당위치에서는 랭킹정보를 확인할수 없습니다.";
                    return rtnstr;
                }

                rtnstr += "[콜로세움 탑 랭커 Top " + libConst.RankingCount + "]" + libConst.dummy + "\n\n";
                rtnstr += BattleManager.getTopRankerList(libConst.RankingCount);
            }
            return rtnstr;
        },
        RankingInfoforMainRoom:function() {
            var rtnstr = "[콜로세움 탑 랭커 Top " + libConst.RankingCount + "]" + libConst.dummy + "\n\n";
            rtnstr += BattleManager.getTopRankerList(libConst.RankingCount);

            return rtnstr;
        },
        BattleRecord:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            var i = 0;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("전투기록")) {
                    rtnstr = "해당위치에서는 전투기록을 확인할수 없습니다.";
                    return rtnstr;
                }

                rtnstr += "[최근 5개 전투 기록]" + libConst.dummy + "\n\n";
                rtnstr += BattleManager.getBattleList(_id, 5);
            }
            return rtnstr;
        },
        PersonList:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, psersonlist;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("대화하기")) {
                    rtnstr = "대화가능한 사람이 없습니다.";
                    return rtnstr;
                }

                psersonlist = m_dbmanager.getPerson(user_loc.country, user_loc.city, user_loc.facility, "conversation", "all");
                rtnstr = "[대화 목록]\n\n";
                for(var i = 0; i < psersonlist.length; ++i){
                    rtnstr += "  - (" + psersonlist[i].job + ") " + psersonlist[i].character + "\n";
                }

            }
            return rtnstr;
        },
        Conversation:function(_id, _npcname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, personlist, converlist, r;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("대화하기")) {
                    rtnstr = "대화가능한 사람이 없습니다.";
                    return rtnstr;
                }

                personlist = m_dbmanager.getPerson(user_loc.country, user_loc.city, user_loc.facility, "all", _npcname);
                if(personlist.length === 1) {
                    obj.setTargetQuest("");
                    converlist = m_dbmanager.getConversation(personlist[0].index);

                    if(converlist.length > 0) {
                        while(true) {
                            r = libCommon.Rand(0, converlist.length - 1);
                            if(converlist[r].questindex === "" && converlist[r].condition === "") {
                                break;
                            }
                            else if(converlist[r].questindex !== "" && converlist[r].condition === "")
                            {
                                if(!obj.isCompliteQuest(converlist[r].questindex) && !obj.isQuest(converlist[r].questindex)) {
                                    break;
                                }
                            }
                            else if(converlist[r].questindex === "" && converlist[r].condition !== "") {
                                if(obj.isCompliteQuest(converlist[r].condition)) {
                                    break;
                                }
                            }
                            else {
                                if(obj.isCompliteQuest(converlist[r].condition) && (!obj.isCompliteQuest(converlist[r].questindex) && !obj.isQuest(converlist[r].questindex))) {
                                    break;
                                }
                            }

                        }

                        rtnstr = "[" + personlist[0].character + "]\n\n" + converlist[r].story.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix);
                        if(converlist[r].type === "quest") {
                            obj.setTargetQuest(converlist[r].questindex);
                            rtnstr += "\n\n퀘스트를 수락하시겠습니까?\n   - !예\n   - !아니오";
                        }
                    }
                    else {
                        rtnstr = "상대방이 대화하길 꺼려합니다.";
                    }
                }
                else {
                    rtnstr = "대화하려는 이름을 가진 대상이 없습니다.";
                }
            }
            return rtnstr;
        },
        setQuest:function(_id, _param) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("대화하기")) {
                    rtnstr = "퀘스트 수락할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(_param) {
                    if(obj.getTargetQuest() === "") {
                        rtnstr = "수락할 퀘스트가 없습니다.";
                    }
                    else if(obj.isQuest(obj.getTargetQuest())) {
                        rtnstr = "이미 수락한 퀘스트 입니다.";
                    }
                    else {
                        obj.confirmTargetQuest();
                        rtnstr = "퀘스트를 수락하였습니다.";
                        _Save();
                    }
                }
                else {
                    obj.setTargetQuest("");
                    rtnstr = "퀘스트를 취소하였습니다.";
                }
            }
            return rtnstr;
        },
        GiveUpQuest:function(_id, _idx) {
            var obj = _Find(_id);
            var rtnstr = "", questList = [];
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(obj.removeQuest(_idx - 1)) {
                    rtnstr = "선택한 퀘스트를 포기하였습니다.";
                }
                else {
                    rtnstr = "인덱스 범위를 벗어났습니다.";
                }
            }
            return rtnstr;
        },
        CompliteQuest:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, questloc = [], questList = [], tmpQuest, Quest, tmpitem, isrequest, Command;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                questList = obj.getCurrQuest();

                rtnstr = "[완료된 퀘스트]\n\n";
                for(var i = 0; i < questList.length; ++i) {
                    tmpQuest = questList[i];
                    Quest = m_dbmanager.getQuest(tmpQuest.index);

                    questloc = Quest.compliteloc.split(";");
                    for(var l = 0; l < questloc.length; ++l)
                        questloc[l] = ((questloc[l] === "0")?"":questloc[l]);

                    if((questloc[0] === user_loc.country && questloc[1] === user_loc.city && questloc[2] === user_loc.facility && questloc[3] === user_loc.field && questloc[4] === user_loc.dungeon) ||
                        (questloc[0] === "" && questloc[1] === "" && questloc[2] === "" && questloc[3] === "" && questloc[4] === "")){
                        if(Quest.kind === "Item") {
                            if(obj.isItemCount(Quest.option, Quest.target, Quest.count)) {
                                tmpitem = m_dbmanager.getItem(Quest.option, Quest.target);
                                rtnstr += "\n  - " + Quest.story.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + "\n\n";

                                rtnstr += (i+1) + ". " + Quest.title.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + " : 완료\n";
                                obj.removeItem(Quest.option, Quest.target, Quest.count);
                                rtnstr += "  - " + tmpitem.name + " " + Quest.count + "개를 소모합니다.\n";
                                obj.addRune(Number(Quest.rune));
                                RecordManager.rcdMaxRune(_id, Number(Quest.rune));
                                rtnstr += "  - " + Quest.rune +"룬을 획득합니다.\n";
                                for(var j = 0; j < Quest.item.length; ++j) {
                                    tmpitem = m_dbmanager.getItem(Quest.item[j].itemkind, Quest.item[j].itemIdx);
                                    obj.addItem(Quest.item[j].itemkind, Quest.item[j].itemIdx, Number(Quest.item[j].count));
                                    rtnstr += "  - " + tmpitem.name +"을(를) " +Quest.item[j].count+ "개 획득합니다.\n";
                                }
                                if(Quest.passport !== "") {
                                    if(!obj.isPassPort(Quest.passport)){
                                        obj.setPassPort(Quest.passport);
                                        rtnstr += "  - " + m_dbmanager.getNation(Quest.passport).name +" 통행증을 획득합니다.\n";
                                    }
                                }
                                isrequest = m_dbmanager.getRequestByIndex(tmpQuest.index);
                                obj.CompliteQuest(tmpQuest.index, (isrequest === null?false:true));
                            }
                        }
                        else if(Quest.kind === "Monster") {
                            if(tmpQuest.goal >= Number(Quest.count)){
                                rtnstr += "\n  - " + Quest.story.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + "\n\n";
                                rtnstr += (i+1) + ". " + Quest.title.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + " : 완료\n";
                                obj.addRune(Number(Quest.rune));
                                RecordManager.rcdMaxRune(_id, Number(Quest.rune));
                                rtnstr += "  - " + Quest.rune +"룬을 획득합니다.\n";
                                for(var j = 0; j < Quest.item.length; ++j) {
                                    tmpitem = m_dbmanager.getItem(Quest.item[j].itemkind, Quest.item[j].itemIdx);
                                    obj.addItem(Quest.item[j].itemkind, Quest.item[j].itemIdx, Number(Quest.item[j].count));
                                    rtnstr += "  - " + tmpitem.name +"을(를) " +Quest.item[j].count+ "개 획득합니다.\n";
                                }
                                if(Quest.passport !== "") {
                                    if(!obj.isPassPort(Quest.passport)){
                                        obj.setPassPort(Quest.passport);
                                        rtnstr += "  - " + m_dbmanager.getNation(Quest.passport).name +" 통행증을 획득합니다.\n";
                                    }
                                }
                                isrequest = m_dbmanager.getRequestByIndex(tmpQuest.index);
                                obj.CompliteQuest(tmpQuest.index, (isrequest === null?false:true));
                            }
                        }
                        else if(Quest.kind === "Move") {
                            rtnstr += "\n  - " + Quest.story.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + "\n\n";
                            rtnstr += (i+1) + ". " + Quest.title.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + " : 완료\n";
                            obj.addRune(Number(Quest.rune));
                            RecordManager.rcdMaxRune(_id, Number(Quest.rune));
                            rtnstr += "  - " + Quest.rune +"룬을 획득합니다.\n";
                            for(var j = 0; j < Quest.item.length; ++j) {
                                tmpitem = m_dbmanager.getItem(Quest.item[j].itemkind, Quest.item[j].itemIdx);
                                obj.addItem(Quest.item[j].itemkind, Quest.item[j].itemIdx, Number(Quest.item[j].count));
                                rtnstr += "  - " + tmpitem.name +"을(를) " +Quest.item[j].count+ "개 획득합니다.\n";
                            }
                            if(Quest.passport !== "") {
                                if(!obj.isPassPort(Quest.passport)){
                                    obj.setPassPort(Quest.passport);
                                    rtnstr += "  - " + m_dbmanager.getNation(Quest.passport).name +" 통행증을 획득합니다.\n";
                                }
                            }
                            isrequest = m_dbmanager.getRequestByIndex(tmpQuest.index);
                            obj.CompliteQuest(tmpQuest.index, (isrequest === null?false:true));
                        }
                    }
                }
                _Save();
            }
            return rtnstr;
        },
        CommandQuest:function(_id, _command) {
            var obj = _Find(_id);
            var rtnstr = "", questList = [], tmpQuest, Quest, tmpitem, isrequest, Command;
            if (obj !== null) {
                questList = obj.getCurrQuest();
                for(var i = 0; i < questList.length; ++i) {
                    tmpQuest = questList[i];
                    Quest = m_dbmanager.getQuest(tmpQuest.index);
                    if(Quest.kind === "Action") {
                        if(_command !== undefined && _command !== null) {
                            Command = _command.split(" ")[0];
                            if(Command === (libConst.CommandPrefix + Quest.target) || Command.split(" ")[0] === (libConst.CommandPrefix + Quest.target)) {
                                rtnstr += "\n  - " + Quest.story.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + "\n\n";
                                rtnstr += (i+1) + ". " + Quest.title.replace(/(@Name)/g, obj.name).replace(/(@Fix)/g, libConst.CommandPrefix) + " : 완료\n";
                                obj.addRune(Number(Quest.rune));
                                RecordManager.rcdMaxRune(_id, Number(Quest.rune));
                                rtnstr += "  - " + Quest.rune +"룬을 획득합니다.\n";
                                for(var j = 0; j < Quest.item.length; ++j) {
                                    tmpitem = m_dbmanager.getItem(Quest.item[j].itemkind, Quest.item[j].itemIdx);
                                    obj.addItem(Quest.item[j].itemkind, Quest.item[j].itemIdx, Number(Quest.item[j].count));
                                    rtnstr += "  - " + tmpitem.name +"을(를) " +Quest.item[j].count+ "개 획득합니다.\n";
                                }
                                if(Quest.passport !== "") {
                                    if(!obj.isPassPort(Quest.passport)){
                                        obj.setPassPort(Quest.passport);
                                        rtnstr += "  - " + m_dbmanager.getNation(Quest.passport).name +" 통행증을 획득합니다.\n";
                                    }
                                }
                                isrequest = m_dbmanager.getRequestByIndex(tmpQuest.index);
                                obj.CompliteQuest(tmpQuest.index, (isrequest === null?false:true));

                                _Save();
                            }
                        }
                    }
                }
            }
            return rtnstr;
        },
        getSaleMercenary:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, hirelist, tmpmercenary, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {

                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("용병영입")) {
                    rtnstr = "용병영입을 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                hirelist = db_Manager.getHireList(user_loc.city, user_loc.facility);

                rtnstr += "[고용 가능 용병]\n";
                for(var i = 0; i < hirelist.length; ++i) {
                    tmpmercenary = db_Manager.getMercenary(hirelist[i].mercenary);
                    rtnstr += "  - " + tmpmercenary.name + " --- " + tmpmercenary.needrune + ", 봉급 : " + tmpmercenary.pay + "\n";
                }
            }
            return rtnstr;
        },
        HireMercenary:function(_id, _name) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, hirelist, mercenary;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("용병영입")) {
                    rtnstr = "해당 위치에서 용병영입을 할 수 없습니다.";
                    return rtnstr;
                }

                hirelist = m_dbmanager.getHireList(user_loc.city, user_loc.facility);
                mercenary = m_dbmanager.getMercenarybyName(_name);
                if(mercenary === null) {
                    rtnstr = _name + "이란 용병은 존재 하지 않습니다.";
                    return rtnstr;
                }

                var flag = false;
                for(var i = 0; i < hirelist.length;++i){
                    if(hirelist[i].mercenary === mercenary.index) {
                        flag = true;
                        break;
                    }
                }

                if(flag) {
                    if(obj.addRune(-(Number(mercenary.needrune)))) {
                        if(!MercenaryManager.Hire(_id, mercenary.index)) {
                            obj.addRune(Number(mercenary.needrune));
                            rtnstr = "고용가능한 최대 용병 수를 넘겼습니다. \n  - 최대 고용 용병수 : " + libConst.MercenaryCount;
                        }
                        else {
                            rtnstr = "고용을 완료하였습니다.";
                        }
                        _Save();
                    }
                    else {
                        rtnstr = "현재 보유한 룬이 부족합니다. (가격 : " + mercenary.needrune + " rune)";
                    }
                }
                else {
                    rtnstr = "해당 장소에서 " + _name + "을(를) 고용할 수 없습니다.";
                }

            }
            return rtnstr;
        },
        getRemoveMercenary:function(_id){
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, mercenarylist, mercenary, dbdata;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("용병이적")) {
                    rtnstr = "용병이적을 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                mercenarylist = MercenaryManager.getMercenary(_id);
                rtnstr += "[방출 가능한 용병&인덱스]\n\n";
                for(var i = 0; i < mercenarylist.length; ++i) {
                    mercenary = mercenarylist[i];
                    dbdata = m_dbmanager.getMercenary(mercenary.index);
                    rtnstr += "" + (i+1) + ". " + mercenary.name + "\n";
                    rtnstr += "  - 타입 : " + dbdata.kind + "\n";
                    rtnstr += "  - 경험치 : " + mercenary.exp + "\n";
                    rtnstr += "  - 이적료 : " + Math.floor(Number(dbdata.needrune) * 2 / 3) + "\n";
                    rtnstr += "  - 봉급 : " + mercenary.pay + " (rune)\n";
                    rtnstr += "\n";
                }
            }
            return rtnstr;
        },
        FireMercenary:function(_id, _arridx) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, mercenarylist, mercenary, dbdata;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("용병이적")) {
                    rtnstr = "용병이적을 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                mercenarylist = MercenaryManager.getMercenary(_id);
                if(mercenarylist.length > _arridx) {
                    mercenary = mercenarylist[_arridx];
                    dbdata = m_dbmanager.getMercenary(mercenary.index);
                    if(MercenaryManager.Fire(_id, _arridx)) {
                        obj.addRune(Math.floor(Number(dbdata.needrune) * 2 / 3));
                        RecordManager.rcdMaxRune(_id, Math.floor(Number(dbdata.needrune) * 2 / 3));
                        _Save();

                        rtnstr = "용병이적에 성공하였습니다.\n   - 이적료 획득 : " + Math.floor(Number(dbdata.needrune) * 2 / 3) + " rune";
                    }
                }
                else {
                    rtnstr = "용병 인덱스가 범위를 벗어났습니다.";
                }
            }
            return rtnstr;
        },
        getChangeMercenary:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, mercenarylist, mercenary, gradelist, item;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("용병전직")) {
                    rtnstr = "용병전직을 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                mercenarylist = MercenaryManager.getMercenary(_id);
                rtnstr += "[전직 가능한 용병 리스트]\n\n";
                for(var i = 0; i < mercenarylist.length; ++i) {
                    mercenary = mercenarylist[i];
                    gradelist = m_dbmanager.getPromotionMercenary(mercenary.index);
                    rtnstr += "" + (i+1) + ". " + mercenary.name + "\n";
                    rtnstr += "  - 보유 경험치 : " + mercenary.exp + "\n";
                    rtnstr += "  - 진급 가능 직업 : \n";
                    for(var j = 0; j < gradelist.length; ++j) {
                        item = m_dbmanager.getItem(gradelist[j].upitem.kind, gradelist[j].upitem.index);
                        rtnstr += "     L " + gradelist[j].name + "\n";
                        rtnstr += "        > 필요 경험치 : " + gradelist[j].upcounter + " exp (" + ((mercenary.exp >= gradelist[j].upcounter)?"가능":"불가능") + ")\n";
                        rtnstr += "        > 필요 룬 : " + gradelist[j].uprune + " rune\n";
                        rtnstr += "        > 필요 아이템 : " + item.name + " x " + gradelist[j].upitem.count + "\n";
                    }

                    rtnstr += "\n";
                }
            }
            return rtnstr;
        },
        ChangeMercenary:function(_id, _arridx, _jobname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, jobDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("용병전직")) {
                    rtnstr = "용병전직을 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                jobDB = m_dbmanager.getMercenarybyName(_jobname);
                if(jobDB !== null) {
                    if(obj.isItemCount(jobDB.upitem.kind, jobDB.upitem.index, Number(jobDB.upitem.count))) {
                        if(obj.getRune() > Number(jobDB.uprune)) {
                            if(MercenaryManager.ChangeMercenary(_id, _arridx, _jobname)) {
                                rtnstr = "용병 전직에 성공하였습니다.";
                                obj.removeItem(jobDB.upitem.kind, jobDB.upitem.index, Number(jobDB.upitem.count));
                                obj.addRune(-Number(jobDB.uprune));
                                _Save();
                            }
                            else {
                                rtnstr = "해당 용병은 " + _jobname + "로 전직 할수 없습니다. \n용병 경험치 및 전직가능 용병명을 확인 바랍니다.";
                            }
                        }
                        else {
                            rtnstr = "전직에 필요한 룬이 부족합니다.";
                        }
                    }
                    else {
                        rtnstr = "전직에 필요한 아이템이 부족합니다.";
                    }
                }
                else {
                    rtnstr = "" + _jobname + "은(는) 없는 직업 입니다.";
                }
            }
            return rtnstr;
        },
        getMyMercenary:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", mercenarylist, mercenary;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                mercenarylist = MercenaryManager.getMercenary(_id);
                rtnstr += "[보유한 용병 리스트]\n\n";
                for(var i = 0; i < mercenarylist.length; ++i) {
                    mercenary = mercenarylist[i];
                    rtnstr += "" + (i+1) + ". " + mercenary.name + "\n";
                    rtnstr += "  - 보유 경험치 : " + mercenary.exp + "\n";
                    rtnstr += "  - 출전 여부 : " + (mercenary.isuse === "Y"?"출전중":"휴식중") + "\n";
                    rtnstr += "\n";
                }
            }
            return rtnstr;
        },
        getloanList:function(_id, _kind) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, db;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !(facilityDB.action.includes("대출하기") || facilityDB.action.includes("예금하기"))) {
                    rtnstr = "은행 업무를 볼 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(_kind === "loan") {
                    rtnstr += "[은행 대출 목록]\n\n";
                    db = m_dbmanager.getLoanList();
                }
                else if(_kind === "deposit") {
                    rtnstr += "[은행 예금 목록]\n\n";
                    db = m_dbmanager.getDepositList();
                }

                for(var i = 0;i < db.length; ++i) {
                    rtnstr += "  - " + db[i].name + " ( 기간 : " + db[i].period + "일, 금리 : " + Math.floor(Number(db[i].rate) * 100) + "%)\n";
                }
            }

            return rtnstr;
        },
        loan:function(_id, _kind, _rune, _target) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, loanDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !(facilityDB.action.includes("대출하기") || facilityDB.action.includes("예금하기"))) {
                    rtnstr = "은행 업무를 볼 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(_kind === "loan") {
                    if(_rune > libConst.LoanMaxRune) {
                        rtnstr = "대출 한도를 넘어섰습니다.\n대출한도 : " + libConst.LoanMaxRune + " rune";
                    }
                    else {
                        loanDB = m_dbmanager.getLoanByName(_target);
                        if(loanDB !== null) {
                            if(obj.setLoan(loanDB.index, _kind, _rune)) {
                                obj.addRune(_rune);
                                rtnstr = loanDB.name + "을(를) 하였습니다.\n";
                                rtnstr += "  - " + _rune + " rune 을(를) 획득하였습니다.\n";
                                rtnstr += "  - 대출금리는 " + Math.floor(Number(loanDB.rate) * 100) + "% 입니다.\n";
                                rtnstr += "  - " + loanDB.period + "일 후에 정산 금액 : " + Math.floor(_rune * (1 + Number(loanDB.rate))) + "\n";
                                rtnstr += "  - " + loanDB.period + "일 후에 정산부탁드립니다.";
                            }
                            else {
                                rtnstr = "해당 유저는 이미 대출 및 예금 정보가 있어서 더이상 은행 거래가 불가능합니다. 현재 대출 및 예금이 종료가 된 후에 다시 방문하시기 바랍니다.";
                            }
                        }
                        else {
                            rtnstr = "해당 대출명은 존재 하지 않습니다.";
                        }
                    }
                }
                else if(_kind === "deposit") {
                    loanDB = m_dbmanager.getDepositByName(_target);
                    if(loanDB !== null) {
                        if(obj.addRune(-_rune)) {
                            if(obj.setLoan(loanDB.index, _kind, _rune)) {
                                rtnstr = loanDB.name + "을(를) 하였습니다.\n";
                                rtnstr += "  - " + _rune + " rune 을(를) 차감 하였습니다.\n";
                                rtnstr += "  - 예금금리는 " + Math.floor(Number(loanDB.rate) * 100) + "% 입니다.\n";
                                rtnstr += "  - " + loanDB.period + "일 후에 정산 금액 : " + Math.floor(_rune * (1 + Number(loanDB.rate))) + "\n";
                                rtnstr += "  - " + loanDB.period + "일 후에 정산부탁드립니다.";
                            }
                            else {
                                obj.addRune(_rune);
                                rtnstr = "해당 유저는 이미 대출 및 예금 정보가 있어서 더이상 은행 거래가 불가능합니다. 현재 대출 및 예금이 종료가 된 후에 다시 방문하시기 바랍니다.";
                            }
                        }
                        else {
                            rtnstr = "보유 룬이 부족합니다.";
                        }
                    }
                    else {
                        rtnstr = "해당 예금명은 존재 하지 않습니다.";
                    }
                }
                _Save();
            }
            return rtnstr;
        },
        calcLoan:function(_id) {
          var obj = _Find(_id);
          var rtnstr = "", user_loc, facilityDB, goalTime, currTime, remainTime, loan, loanDB, calcRune, userRune;
          if (obj === null) {
              rtnstr = "생성된 캐릭이 없습니다.";
          }
          else {
              user_loc = obj.getLocation();
              facilityDB = m_dbmanager.getFacility(user_loc.facility);
              if(facilityDB === null || !facilityDB.action.includes("정산하기")) {
                  rtnstr = "은행 업무를 볼 수 있는 위치가 아닙니다.";
                  return rtnstr;
              }

              loan = obj.getLoan();
              if(loan.index !== "") {
                  if(loan.kind === "loan") {
                      loanDB = m_dbmanager.getLoan(loan.index);
                  }
                  else if(loan.kind === "deposit") {
                      loanDB = m_dbmanager.getDeposit(loan.index);
                  }

                  goalTime = loan.time + (Number(loanDB.period) * 86400000);
                  currTime = (new Date()).getTime();
                  remainTime = goalTime - currTime;

                  if(remainTime > 0) {
                      rtnstr = "정산일이 아닙니다.";
                  }
                  else {
                      rtnstr += "정산을 시작합니다.\n";
                      if(loan.kind === "loan") {
                          calcRune = Math.floor(loan.rune * (1 + Number(loanDB.rate)));
                          userRune = obj.getRune();
                          if(calcRune > userRune) {
                              rtnstr += "유저가 보유한 rune이 부족합니다.\n";
                          }
                          else {
                              obj.addRune(-calcRune);
                              rtnstr += calcRune + " rune을 갚습니다.\n";
                          }
                      }
                      else if(loan.kind === "deposit") {
                          calcRune = Math.floor(loan.rune * (1 + Number(loanDB.rate)));
                          obj.addRune(calcRune);
                          rtnstr += calcRune + " rune을 획득합니다.\n";
                      }
                      obj.removeLoan();
                      _Save();
                  }
              }
              else {
                  rtnstr = "현재 대출/예금을 보유하고 있지 않습니다.";
              }
          }
          return rtnstr;
        },
        cancelLoan:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, loan, loanDB, calcRune, userRune;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("정산하기")) {
                    rtnstr = "은행 업무를 볼 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                loan = obj.getLoan();
                if(loan.index !== "") {
                    if(loan.kind === "loan") {
                        rtnstr = "현재 대출을 해지합니다. 중도해지라고 할지라도 이자 차감합니다.";
                        loanDB = m_dbmanager.getLoan(loan.index);
                        calcRune = Math.floor(loan.rune * (1 + Number(loanDB.rate)));
                        userRune = obj.getRune();
                        if(calcRune > userRune) {
                            rtnstr += "유저가 보유한 rune이 부족합니다. 해지 할수가 없습니다.\n";
                        }
                        else {
                            obj.addRune(-calcRune);
                            obj.removeLoan();
                            rtnstr += calcRune + " rune을 갚습니다.\n";
                        }
                    }
                    else if(loan.kind === "deposit") {
                        rtnstr = "현재 예금을 해지합니다. 중도해지임으로 이자는 받을수 없습니다.";
                        loanDB = m_dbmanager.getDeposit(loan.index);
                        obj.addRune(loan.rune);
                        obj.removeLoan();
                        rtnstr += loan.rune + " rune을 획득합니다.\n";
                    }
                }
                else {
                    rtnstr = "현재 대출/예금을 보유하고 있지 않습니다.";
                }

                _Save();
            }
            return rtnstr;
        },
        Evolution:function(_id, _species) {
            var obj = _Find(_id), i;
            var rtnstr = "", user_loc, facilityDB, curr_speciesDB, next_speciesDB, needTalent, result = true;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("종족진화")) {
                    rtnstr = "종족진화를 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }
                curr_speciesDB = m_dbmanager.getSpecies(obj.getSpecies());
                next_speciesDB = m_dbmanager.getSpecies(_species);

                if(next_speciesDB === null) {
                    return "선택하신 종족은 존재하지 않는 종족입니다.";
                }
                else if(curr_speciesDB.upspec.indexOf(_species) === -1) {
                    return "선택하신 종족은 현재 종족에서 진화가 불가능한 종족입니다.";
                }

                needTalent = next_speciesDB.talent;
                for(i = 0; i < needTalent.length; ++i) {
                    if(obj.isTalent(needTalent[i]) === -1) {
                        result = false;
                        break;
                    }
                }

                if(result) {
                    obj.setSpecies(_species);
                    obj.calcAbility(false);
                    rtnstr = "종족진화를 완료하여 당신은 이제 " + next_speciesDB.spec_name + " 종족이 되었습니다.";
                    _Save();
                }
                else {
                    rtnstr = "종족진화에 필요한 특성이 부족합니다.\n";
                    rtnstr += "(필요한 특성).\n";
                    for(i = 0; i < needTalent.length; ++i) {
                        rtnstr += "  - " + m_dbmanager.getProperty(needTalent[i]).name + "\n";
                    }
                }
            }
            return rtnstr;
        },
        EvolutionList:function(_id) {
            var obj = _Find(_id), i, j;
            var rtnstr = "", user_loc, facilityDB, curr_speciesDB, next_speciesDB, needTalent;
            var spec;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("종족진화")) {
                    rtnstr = "종족진화를 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                rtnstr += "[진화 가능 종족]\n\n";
                curr_speciesDB = m_dbmanager.getSpecies(obj.getSpecies());
                for(i = 0; i < curr_speciesDB.upspec.length; ++i) {
                    spec = curr_speciesDB.upspec[i];
                    next_speciesDB = m_dbmanager.getSpecies(spec);
                    needTalent = next_speciesDB.talent;
                    rtnstr += "[" + next_speciesDB.spec_name + "]\n";
                    rtnstr += "   L 힘 : " + next_speciesDB.inc_stat.str + "배 \n";
                    rtnstr += "   L 체질 : " + next_speciesDB.inc_stat.con + "배 \n";
                    rtnstr += "   L 민첩 : " + next_speciesDB.inc_stat.dex + "배 \n";
                    rtnstr += "   L 재주 : " + next_speciesDB.inc_stat.agi + "배 \n";
                    rtnstr += "   L 지능 : " + next_speciesDB.inc_stat.int + "배 \n";
                    rtnstr += "   L 운 : " + next_speciesDB.inc_stat.luk + "배 \n";
                    rtnstr += "   L 효율 : " + next_speciesDB.inc_stat.ept + "배 \n";
                    rtnstr += "   L 교감 : " + next_speciesDB.inc_stat.com + "배 \n";
                    rtnstr += "   L 영혼 : " + next_speciesDB.inc_stat.spr + "배 \n";
                    rtnstr += "(필요한 특성)\n";
                    for(j = 0; j < needTalent.length; ++j) {
                        rtnstr += "   L " + m_dbmanager.getProperty(needTalent[j]).name + "\n";
                    }

                    rtnstr += "\n";
                }
            }
            return rtnstr;
        },
        Alchemy:function(_id) {
            var obj = _Find(_id), i;
            var rtnstr = "", user_loc, facilityDB, alchemyList, alchemy, item;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("연금술하기")) {
                    rtnstr = "연금술을 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                alchemyList = m_dbmanager.getAlchemyList(user_loc.city, user_loc.facility);
                if(alchemyList.length > 0) {
                    rtnstr = "[연금술 확률 표]\n\n";
                    for(i = 0; i < alchemyList.length; ++i) {
                        alchemy = alchemyList[i];
                        item = m_dbmanager.getItem(alchemy.itemkind, alchemy.item);
                        rtnstr += (i+1) + ". " + item.name + " x " + alchemy.count + " (확률 : " + alchemy.rate + "%)\n";
                    }
                }
                else {
                    rtnstr = "현재 연금술사가 폐업 상태입니다.";
                }
            }
            return rtnstr;
        },
        ActAlchemy:function(_id, _count, _iscp) {
            var obj = _Find(_id), m, c;
            var rtnstr = "", user_loc, facilityDB, alchemyList, alchemy, coupon;
            var tmpRand, preRate, currRate;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !((facilityDB.action.includes("연금술하기") && _iscp === "N") || (facilityDB.action.includes("쿠폰연성") && _iscp === "Y"))) {
                    rtnstr = "연금술을 할 수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                alchemyList = m_dbmanager.getAlchemyList(user_loc.city, user_loc.facility);
                coupon = m_dbmanager.getSundryItem(libConst.CouponIndex);
                if(alchemyList.length > 0) {
                    if(_iscp==="N"?obj.addRune(-libConst.AlchemyRune * _count):obj.isItemCount(libConst.ITEM_KIND.SUNDRYITEM, libConst.CouponIndex, _count * 10)) {
                        rtnstr = "[연금술 결과]\n\n";
                        if(_iscp === "Y") {
                            obj.removeItem(libConst.ITEM_KIND.SUNDRYITEM, libConst.CouponIndex, _count * 10);
                        }
                        for(c = 0; c < _count; ++c) {
                            tmpRand = libCommon.Randfloat(0,100);
                            preRate = 0;
                            currRate = 0;
                            for(m = 0; m < alchemyList.length; ++m) {
                                preRate += (m===0?0:Number(alchemyList[m - 1].rate));
                                currRate += Number(alchemyList[m].rate);

                                if(tmpRand >= preRate && tmpRand <= currRate) {
                                    obj.addItem(alchemyList[m].itemkind, alchemyList[m].item, alchemyList[m].count);
                                    rtnstr += (c+1) + ". " + m_dbmanager.getItem(alchemyList[m].itemkind, alchemyList[m].item).name + " " + alchemyList[m].count + "개 획득. \n";
                                    break;
                                }
                            }
                        }
                        if(_iscp === "N") {
                            obj.addItem(libConst.ITEM_KIND.SUNDRYITEM, libConst.CouponIndex, _count);
                            rtnstr += "\n  - 마일리지 획득 : " + coupon.name + " x "+ _count;
                        }
                        _Save();
                    }
                    else {
                        if(_iscp==="N")
                            rtnstr = "연금술에 필요한 룬이 부족합니다.\n   - 필요 룬 : " + libConst.AlchemyRune;
                        else
                            rtnstr = "연금술에 필요한 쿠폰이 부족합니다.\n   - 필요 쿠폰 : " + coupon.name + " -> 10개당 1회";
                    }
                }
                else {
                    rtnstr = "현재 연금술사가 폐업 상태입니다.";
                }
            }
            return rtnstr;
        },
        HireExplorer:function(_id, _step) {
            var obj = _Find(_id), m, c;
            var rtnstr = "", user_loc, facilityDB, expl;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("탐험가영입")) {
                    rtnstr = "탐험가를 영입할 수 있는 장소가 아닙니다.";
                    return rtnstr;
                }

                if(obj.addRune(-libConst["ExplorerRune" + _step])) {
                    if(!ExplorerManager.isExplorer(_id)) {
                        ExplorerManager.CreateExplorer(_id);
                    }

                    if(ExplorerManager.isLock(_id)) {
                        rtnstr = "탐험가 락이 걸려 있습니다. 락을 해제하고 실행하시기 바랍니다.";
                        obj.addRune(libConst["ExplorerRune" + _step]);
                    }
                    else if(ExplorerManager.whereAutoHunting(_id) !== "") {
                        rtnstr = "모험가가 탐험중에는 탐험가 영입이 불가능합니다.";
                        obj.addRune(libConst["ExplorerRune" + _step]);
                    }
                    else {
                        expl = ExplorerManager.RandExplorer(_id, _step);
                        rtnstr += "[소환된 탐험가 능력치]\n\n";
                        rtnstr += "  - 등급 : " + expl.getGrade() + "\n";
                        rtnstr += "  - 힘 : " + expl.getStat().str + "\n";
                        rtnstr += "  - 민첩 : " + expl.getStat().dex + "\n";
                        rtnstr += "  - 운 : " + expl.getStat().luk + "\n\n";
                        rtnstr += "(계산 수치)\n";
                        rtnstr += "  L 탐험속도 : " + Math.floor((libConst.AutoHTSpeed /1000) - (expl.getStat().dex * libConst.AutoHTSpeedWgt)) + "초/몹\n";
                        rtnstr += "  L 드랍율 : " + Math.floor(libConst.AutoHTDropItemAmount + (expl.getStat().str * libConst.AutoHTDropItemAmountWgt)) + "배\n";
                        rtnstr += "  L 보스만날확률 : " + (libConst.AutoHTBossRate + (expl.getStat().luk * libConst.AutoHTBossRateWgt)) + "%";
                    }
                }
                else {
                    rtnstr = "소지룬이 부족합니다. 보유중인 룬을 확인 바랍니다.";
                }

                _Save();
            }
            return rtnstr;
        },
        LockExplorer:function(_id, _lock) {
            var rtnstr = "";

            if(ExplorerManager.isExplorer(_id)) {
                ExplorerManager.setLock(_id, _lock);
                rtnstr += "탐험가 정보를 " + (_lock?"잠궜습니다.":"풀었습니다.");
            }
            else {
                rtnstr = "고용된 탐험가가 없습니다.";
            }
            return rtnstr;
        },
        AutoHunting:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", fieldDB, bossidx, bosscnt, tmpwhere;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(obj.getLocation().field === "")
                    rtnstr = "현재위치에서는 자동사냥이 불가능합니다.";
                else {
                    fieldDB = db_Manager.getField(obj.getLocation().field);
                    bossidx = fieldDB.boss;
                    if(bossidx !== "") {
                        bosscnt = fieldDB.autocount;
                        if(RecordManager.confirmMonsterCnt(_id, bossidx, bosscnt)) {
                            if(ExplorerManager.isExplorer(_id)) {
                                tmpwhere = ExplorerManager.whereAutoHunting(_id);
                                if(tmpwhere === "") {
                                    if(ExplorerManager.StartAutoHunting(_id, obj.getLocation().field)) {
                                        rtnstr = "탐험가가 " + fieldDB.name + "으로 탐험을 떠납니다.";
                                    }
                                    else {
                                        rtnstr = "탐험가가 탐험 떠나기를 거부합니다.";
                                    }
                                }
                                else {
                                    rtnstr = "탐험가는 이미 " + db_Manager.getField(tmpwhere).name + "(으)로 탐험을 떠났습니다.";
                                }
                            }
                            else {
                                rtnstr = "탐험가를 보유하지 않았습니다. 탐험가를 고용 후에 사용하시기 바랍니다.";
                            }
                        }
                        else {
                            rtnstr = "자동사냥의 조건을 충족하지 못하였습니다.\n";
                            rtnstr += "충족요건 : " + db_Manager.getMonster(bossidx).name + "을(를) " + bosscnt + "마리 사냥시 자동사냥 가능.";
                        }
                    }
                    else {
                        rtnstr = "해당 필드에는 보스몬스터가 존재 하지 않습니다.";
                    }
                }
            }
            return rtnstr;
        },
        StopAutoHunting:function(_id) {
            var obj = _Find(_id), i;
            var rtnstr = "", result = null, item, mob;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(ExplorerManager.isExplorer(_id)) {
                    if(ExplorerManager.whereAutoHunting(_id) !== "") {
                        result = ExplorerManager.AutoHuntingResult(_id); // {items:[], rune:0}
                        rtnstr += "[탐험가 보고]\n\n";

                        rtnstr += "(사냥한 몬스터)\n";
                        for(i = 0; i < result.mob.length; ++i) {
                            mob = result.mob[i];
                            rtnstr += "  L " + mob.name + " >> " + mob.count + "마리 사냥함\n";
                        }

                        rtnstr += "\n";
                        rtnstr += "  - 획득룬 : " + result.rune + "rune\n";
                        obj.addRune(result.rune);

                        rtnstr += "\n";
                        rtnstr += "(획득 아이템)\n";
                        for(i = 0; i < result.items.length; ++i) {
                            item = result.items[i];
                            rtnstr += "  L " + db_Manager.getSundryItem(item.itemIdx).name + " x " + item.count + "\n";
                            obj.addItem(libConst.ITEM_KIND.SUNDRYITEM, item.itemIdx, item.count);
                        }
                        _Save();
                    }
                    else {
                        rtnstr = "탐험가는 현재 탐험중이 아닙니다.";
                    }
                }
                else {
                    rtnstr = "탐험가를 보유하지 않았습니다. 탐험가를 고용 후에 사용하시기 바랍니다.";
                }
            }
            return rtnstr;
        },
        getStrengthItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, itemlist, item, data;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("강화하기")) {
                    rtnstr = "장비 강화를 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                rtnstr += "[강화 가능 아이템]\n\n";
                itemlist = obj.getItemList("all");
                for(i = 0; i < itemlist.length; ++i) {
                    item = itemlist[i];
                    if(item.kind === libConst.ITEM_KIND["WEARITEM"]) {
                        data =  m_dbmanager.getWearItem(item.index);
                        if(data.strength_yn === "Y" && item.strength !== 15) {
                            rtnstr += "  L " + data.name + (item.strength === 0?"":("+" + item.strength)) + " x " + item.count + "\n";
                        }
                    }
                }

            }
            return rtnstr;
        },
        StrengthItem:function(_id, _itemname, _safety) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            var spl_item = _itemname.split("+");
            var itemlevel, itemname, itemDB, strengthDB, materialList;
            var possible = true, rand, buff;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("강화하기")) {
                    rtnstr = "장비 강화를 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];

                itemDB = m_dbmanager.Search(itemname, "WEARITEM", "name");
                if(itemDB === null) {
                    rtnstr = "해당 장비는 존재하지 않는 장비 입니다.";
                }
                else {
                    if(itemDB.strength_yn === "Y") {
                        if(obj.isItem(libConst.ITEM_KIND["WEARITEM"], itemDB.index, Number(itemlevel))) {
                            strengthDB = m_dbmanager.getStrength("" + (Number(itemlevel)+1), (_safety?"Y":"N"));
                            if(strengthDB === null) {
                                rtnstr = "요청하신 강화 단계가 존재하지 않습니다.";
                                return rtnstr;
                            }

                            materialList = strengthDB.meterial;
                            if(obj.getRune() >= Number(strengthDB.needrune)) {
                                for(i = 0; i < materialList.length; ++i) {
                                    if(!obj.isItemCount(materialList[i].kind, materialList[i].itemIdx, Number(materialList[i].count))) {
                                        possible = false;
                                        break;
                                    }
                                }

                                if(possible) {
                                    obj.addRune(-Number(strengthDB.needrune));
                                    rtnstr += " - 룬 소모 : " + strengthDB.needrune + " rune\n\n";
                                    rtnstr += " - 아이템 소모 \n";
                                    for(i = 0; i < materialList.length; ++i) {
                                        obj.removeItem(materialList[i].kind, materialList[i].itemIdx, Number(materialList[i].count));
                                        rtnstr += " L " + m_dbmanager.getSundryItem(materialList[i].itemIdx).name + "x" + materialList[i].count + "\n";
                                    }

                                    rand = libCommon.Randfloat(0,100);
                                    buff = PetManager.getBuffAmountByKind(_id, "strength");
                                    if(buff !== 0) {
                                        rtnstr += "  - 펫 버프로 강화 확률 " + buff + "%를 상승시킵니다.";
                                    }
                                    if(rand <= (Number(strengthDB.rate) + buff)) {
                                        obj.setStrengthItem(libConst.ITEM_KIND["WEARITEM"], itemDB.index, Number(itemlevel), 1);
                                        rtnstr += "\n<강화 성공>\n";
                                        rtnstr += "  - " + itemDB.name + "을 강화에 성공하여 강화단계를 상승시킵니다.";
                                    }
                                    else {
                                        rtnstr += "\n<강화 실패>\n";
                                        if(_safety === "Y") {
                                            rtnstr += "  - " + itemDB.name + "을 강화에 실패하였지만 안전 강화는 강화 단계를 하락시키지 않습니다.";
                                        }
                                        else {
                                            rand = libCommon.Randfloat(0,100);
                                            if(rand <= libConst.Strength_DownRate){
                                                obj.setStrengthItem(libConst.ITEM_KIND["WEARITEM"], itemDB.index, Number(itemlevel), -1);
                                                rtnstr += "  - " + itemDB.name + "을 강화에 실패하여 강화단계를 하락시킵니다.";
                                            }
                                            else {
                                                rtnstr += "  - " + itemDB.name + "을 강화에 실패하였지만 강화단계를 유지합니다.";
                                            }
                                        }
                                    }
                                    _Save();
                                }
                                else {
                                    rtnstr = "강화에 필요한 재료가 부족합니다. \n\n (필요 재료)\n";
                                    for(i = 0; i < materialList.length; ++i) {
                                        itemDB = m_dbmanager.getSundryItem(materialList[i].itemIdx);
                                        rtnstr += "  L " + itemDB.name + " x " + materialList[i].count + "\n";
                                    }
                                }
                            }
                            else {
                                rtnstr = "강화에 필요한 룬이 부족합니다. \n\n 필요 룬 : " + strengthDB.needrune;
                            }
                        }
                        else {
                            rtnstr = "해당 장비를 보유하고 있지 않습니다.";
                        }
                    }
                    else {
                        rtnstr = "해당 장비는 강화가 불가능한 장비 입니다.";
                    }
                }
            }
            return rtnstr;
        },
        RemoveStrength:function(_id, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            var spl_item = _itemname.split("+");
            var itemlevel, itemname, itemDB, strengthDB, materialList, meter;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("강화초기화")) {
                    rtnstr = "강화 초기화를 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];

                itemDB = m_dbmanager.Search(itemname, "WEARITEM", "name");
                if(itemDB === null) {
                    rtnstr = "해당 장비는 존재하지 않는 장비 입니다.";
                }
                else {
                    if(itemlevel !== "0") {
                        if(obj.isItem(libConst.ITEM_KIND["WEARITEM"], itemDB.index, Number(itemlevel))) {
                            rtnstr = "[장비 초기화 결과]\n\n";
                            for(var i = Number(itemlevel); i > 0; --i) {
                                strengthDB = m_dbmanager.getStrength("" + i, "N");
                                rtnstr += "(강화 단계 변경 +" + i + "강 >>> +" + (i-1)+"강)\n";
                                obj.setStrengthItem(libConst.ITEM_KIND["WEARITEM"], itemDB.index, i, -1);
                                if(strengthDB === null)
                                    continue;

                                materialList = strengthDB.meterial;
                                for(var j = 0; j < materialList.length; ++j) {
                                    meter = materialList[j];
                                    obj.addItem(meter.kind, meter.itemIdx, meter.count);
                                    rtnstr += "  L " + m_dbmanager.getItem(meter.kind, meter.itemIdx).name + "을(를) " + meter.count + "개 획득함\n";
                                }
                                rtnstr += "\n";
                            }
                            _Save();
                        }
                        else {
                            rtnstr = "해당 장비를 보유하고 있지 않습니다.";
                        }
                    }
                    else {
                        rtnstr = "초기화할 필요가 없는 아이템 입니다.";
                    }
                }
            }
            return rtnstr;
        },
        getDecomposeItem:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, itemlist, item, data;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("장비분해")) {
                    rtnstr = "장비 분해를 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                rtnstr += "[분해 가능 아이템]\n\n";
                itemlist = obj.getItemList("all");
                for(i = 0; i < itemlist.length; ++i) {
                    item = itemlist[i];
                    if(item.kind === libConst.ITEM_KIND["WEARITEM"]) {
                        data =  m_dbmanager.getWearItem(item.index);
                        if(data.strength_yn === "Y") {
                            rtnstr += "  L " + data.name + (item.strength === 0?"":("+" + item.strength)) + " x " + item.count + "\n";
                        }
                    }
                }
            }
            return rtnstr;
        },
        DecomposeItem:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            var spl_item = _itemname.split("+");
            var itemlevel, itemname, itemDB, decomposeDB, r, counts;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("장비분해")) {
                    rtnstr = "장비 분해를 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];

                itemDB = m_dbmanager.Search(itemname, "WEARITEM", "name");
                if(itemDB === null) {
                    rtnstr = "해당 장비는 존재하지 않는 장비 입니다.";
                }
                else {
                    if(itemDB.strength_yn === "Y") {
                        if(obj.isItem(libConst.ITEM_KIND["WEARITEM"], itemDB.index, Number(itemlevel))) {
                            decomposeDB = m_dbmanager.getDecompose(itemDB.grade);
                            if(decomposeDB !== null) {
                                obj.removeItem(libConst.ITEM_KIND["WEARITEM"], itemDB.index, _count, Number(itemlevel));
                                counts = decomposeDB.count.split("~");
                                r = libCommon.Rand(Number(counts[0]), Number(counts[1])) * _count;
                                obj.addItem(libConst.ITEM_KIND["SUNDRYITEM"], decomposeDB.itemidx, r);
                                rtnstr = "" + _itemname + "을(를) " + _count + "개 분해하여 " + m_dbmanager.getSundryItem(decomposeDB.itemidx).name + "을(를) " + r + "개 획득하였습니다.";
                                _Save();
                            }
                            else {
                                rtnstr = "해당 장비의 등급은 분해가 불가능합니다.";
                            }
                        }
                        else {
                            rtnstr = "해당 장비를 보유하고 있지 않습니다.";
                        }
                    }
                    else {
                        rtnstr = "해당 장비는 강화가 불가능한 장비 입니다.";
                    }
                }
            }
            return rtnstr;
        },
        meetPet:function(_id, _name) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            var petinfo;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("교감하기")) {
                    rtnstr = libConst.Pet_Name +  " 교감을 할수 있는 위치가 아닙니다.";
                    return rtnstr;
                }

                petinfo = PetManager.Find(_id);
                if(petinfo === null) {
                    rtnstr = libConst.Pet_Meet_Comment.replace(/(@Name)/g, _name);
                    PetManager.CreatePet(_id, _name);

                    rtnstr += "당신은 " + libConst.Pet_Name + "와 동행을 시작합니다.";
                }
                else {
                    rtnstr = "이미 당신은 " + libConst.Pet_Name + "을(를) 보유하고 있습니다.";
                }
            }
            return rtnstr;

        },
        getPetInfo:function(_id) {
            var pet = PetManager.Find(_id);
            var rtnstr = "";
            var currTime = (new Date()).getTime();
            var buffList, buff;
            var timeGap, tmpText, hour = 0, min = 0, sec = 0;

            if (pet === null) {
                rtnstr = "당신은 아직" + libConst.Pet_Name + "을(를) 보유하고 있지 않습니다.";
            }
            else {
                timeGap = PetManager.getConversationCoolTime(_id);
                timeGap =  timeGap - currTime;
                if(timeGap > 0) {
                    hour = Math.floor(timeGap / 3600000);
                    timeGap -= 3600000 * hour;
                    min = Math.floor(timeGap / 60000);
                    timeGap -= 60000 * min;
                    sec = Math.floor(timeGap / 1000);

                    tmpText = hour + "시 " + min + "분 " + sec + "초 후에 가능함";
                }
                else {
                    tmpText = "대화/선물하기 가능함";
                }

                rtnstr += "[" + pet.getPetName() + "]\n\n";
                rtnstr += "   - 친밀도 : " + pet.getFamiliarity() + "\n";
                rtnstr += "   - 대화/선물 쿨타임 : " + tmpText + " 가능\n\n";

                buffList = pet.getBuff();
                rtnstr += "(버프)\n";
                for(var i = 0; i < buffList.length; ++i) {
                    buff = buffList[i];
                    rtnstr += " L " + m_dbmanager.getPetBuffByIdx(buff.index).description + " + " + buff.amount + "%\n";
                }
            }
            return rtnstr;
        },
        getPetGiftList:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", giftList;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                giftList = m_dbmanager.getPetFamilyList();
                rtnstr += "[" + libConst.Pet_Name + "에게 선물가능 리스트]\n\n";

                for(var i = 0; i < giftList.length; ++i) {
                    if(obj.isItem(giftList[i].itemkind, giftList[i].itemidx)) {
                        rtnstr += "   - " + m_dbmanager.getItem(giftList[i].itemkind, giftList[i].itemidx).name + "\n";
                    }
                }
            }
            return rtnstr;
        },
        giftPet:function(_id, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", gift, db_item;
            var currTime = (new Date()).getTime();
            var timeGap, hour = 0, min = 0, sec = 0;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else if(!PetManager.isPet(_id)) {
                rtnstr = "당신은 아직 " + libConst.Pet_Name + "을(를) 보유하고 있지 않습니다.";
            }
            else {
                timeGap = PetManager.getConversationCoolTime(_id);
                timeGap =  timeGap - currTime;
                if(timeGap > 0) {
                    hour = Math.floor(timeGap / 3600000);
                    timeGap -= 3600000 * hour;
                    min = Math.floor(timeGap / 60000);
                    timeGap -= 60000 * min;
                    sec = Math.floor(timeGap / 1000);

                    rtnstr += "아직 선물하기가 불가능합니다.\n";
                    rtnstr += hour + "시 " + min + "분 " + sec + "초 후에 선물하기 가능함.";
                }
                else {
                    db_item = m_dbmanager.getItemByName(_itemname);
                    if(db_item.obj === null) {
                        rtnstr = "해당 아이템은 존재 하지 않습니다.";
                    }
                    else {
                        gift = m_dbmanager.getPetFamily(db_item.kind, db_item.obj.index);

                        if(gift === null) {
                            rtnstr = "해당 물건은 당신의 " + libConst.Pet_Name + "이(가) 싫어 합니다.";
                        }
                        else {
                            if(obj.isItemCount(db_item.kind, db_item.obj.index, 1)) {
                                obj.removeItem(db_item.kind, db_item.obj.index, 1);

                                rtnstr += "당신은 " + libConst.Pet_Name + "에게 " + _itemname + "을(를) 선물하였습니다.\n";
                                rtnstr += "" + PetManager.getMyPetName(_id) + "은(는) 매우 기뻐합니다. (친밀도 상승)\n\n";
                                PetManager.Upfamiliarity(_id, Number(gift.upcount));
                                _Save();
                            }
                            else {
                                rtnstr = "당신은 해당 물건을 보유하고 있지 않습니다.";
                            }
                        }
                    }
                }
            }
            return rtnstr;
        },
        OpenPetStore:function(_id) {
            var rtnstr = "", invenList, i;
            if (!PetManager.isPet(_id)) {
                rtnstr = "당신은 아직" + libConst.Pet_Name + "을(를) 보유하고 있지 않습니다.";
            }
            else if(!PetManager.isStore(_id)) {
                rtnstr = "당신의 " + libConst.Pet_Name  + "은(는) 아직 당신에게 아공간을 허용하지 않았습니다.";
            }
            else {
                rtnstr += "[" + libConst.Pet_Name + " 아공간]" + libConst.dummy + "\n\n";
                invenList = PetManager.getInventory(_id);
                rtnstr += _SortItem(invenList, null);
            }
            return rtnstr;
        },
        SearchPetStore:function(_id, _search) {
            var rtnstr = "", invenList, i;
            if (!PetManager.isPet(_id)) {
                rtnstr = "당신은 아직" + libConst.Pet_Name + "을(를) 보유하고 있지 않습니다.";
            }
            else if(!PetManager.isStore(_id)) {
                rtnstr = "당신의 " + libConst.Pet_Name  + "은(는) 아직 당신에게 아공간을 허용하지 않았습니다.";
            }
            else {
                rtnstr += "[" + libConst.Pet_Name + " 아공간]" + libConst.dummy + "\n\n";
                invenList = PetManager.getInventory(_id);
                rtnstr += _SortItem(invenList, _search);
            }
            return rtnstr;
        },
        PutPetStore:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var spl_item = _itemname.split("+"), itemlevel, itemname, itemlist, categoryList, category;
            var db_item, item, i;
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else if(!PetManager.isPet(_id)) {
                rtnstr = "당신은 아직 " + libConst.Pet_Name + "을(를) 보유하고 있지 않습니다.";
            }
            else if(!PetManager.isStore(_id)) {
                rtnstr = "당신의 " + libConst.Pet_Name  + "은(는) 아직 당신에게 아공간을 허용하지 않았습니다.";
            }
            else {
                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];

                itemlist = obj.getItemList("all");//{kind, index, count}

                categoryList = _FindCategory(itemlist, itemname);
                if(categoryList === null) {
                    if(itemname === "all") {
                        for(i = itemlist.length - 1; i >= 0; --i) {
                            item = itemlist[i];
                            PetManager.PushItem(_id, item.kind, item.index, item.count, item.strength);
                            obj.removeItem(item.kind, item.index, item.count, item.strength);
                        }
                        rtnstr = libConst.Pet_Name + "에게 모든 아이템을 맡겼습니다.";
                        _Save();
                    }
                    else {
                        db_item = m_dbmanager.getItemByName(itemname);
                        if(db_item.obj === null) {
                            rtnstr = "해당 아이템은 존재 하지 않습니다.";
                        }
                        else {
                            if(obj.isItemCount(db_item.kind, db_item.obj.index, _count, Number(itemlevel))){
                                PetManager.PushItem(_id, db_item.kind, db_item.obj.index, _count, Number(itemlevel));
                                obj.removeItem(db_item.kind, db_item.obj.index, _count, Number(itemlevel));
                                rtnstr = libConst.Pet_Name + "에게 " + db_item.obj.name + "을(를) " + _count + "개를 맡겼습니다.";
                                _Save();
                            }
                            else {
                                rtnstr = "당신은 해당 물건을 보유하고 있지 않습니다.";
                            }
                        }
                    }
                }
                else {
                    if(categoryList.length === 0) {
                        rtnstr += "해당 카테고리에 저장 가능한 템이 존재하지 않습니다.";
                    }
                    else {
                        for(i = 0; i < categoryList.length; ++i) {
                            category = categoryList[i];
                            PetManager.PushItem(_id, category.kind, category.index, category.count);
                            obj.removeItem(category.kind, category.index, category.count);
                        }
                        rtnstr += itemname + "의 템을 모두 맡겼습니다.";
                        _Save();
                    }
                }
            }
            return rtnstr;
        },
        GetPetStore:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var spl_item = _itemname.split("+"), itemlevel, itemname, itemlist, categoryList, category;
            var db_item, item, i;
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else if(!PetManager.isPet(_id)) {
                rtnstr = "당신은 아직 " + libConst.Pet_Name + "을(를) 보유하고 있지 않습니다.";
            }
            else if(!PetManager.isStore(_id)) {
                rtnstr = "당신의 " + libConst.Pet_Name  + "은(는) 아직 당신에게 아공간을 허용하지 않았습니다.";
            }
            else {
                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];

                if(obj.addRune(-libConst.Pet_StoreRune)) {
                    itemlist = PetManager.getInventory(_id);
                    categoryList = _FindCategory(itemlist, itemname);
                    if(categoryList === null) {
                        if(itemname === "all") {
                            for(i = itemlist.length - 1; i >= 0; --i) {
                                item = itemlist[i];
                                obj.addItem(item.kind, item.index, item.count, item.strength);
                                PetManager.PopItem(_id, item.kind, item.index, item.count, item.strength);
                            }
                            rtnstr += libConst.Pet_Name + "에게 모든 아이템을 받습니다.";
                        }
                        else {
                            db_item = m_dbmanager.getItemByName(itemname);
                            if(db_item.obj === null) {
                                rtnstr = "해당 아이템은 존재 하지 않습니다.";
                                obj.addRune(libConst.Pet_StoreRune);
                            }
                            else {
                                if(PetManager.isItemCount(_id, db_item.kind, db_item.obj.index, _count, Number(itemlevel))){
                                    obj.addItem(db_item.kind, db_item.obj.index, _count, Number(itemlevel));
                                    PetManager.PopItem(_id, db_item.kind, db_item.obj.index, _count, Number(itemlevel));
                                    rtnstr = libConst.Pet_Name + "에게 " + db_item.obj.name + "을(를) " + _count + "개를 받았습니다.";
                                }
                                else {
                                    rtnstr = "아공간에 해당 물건이 존재하지 않습니다.";
                                    obj.addRune(libConst.Pet_StoreRune);
                                }
                            }
                        }
                    }
                    else {
                        if(categoryList.length === 0) {
                            rtnstr += "해당 카테고리에 수거 가능한 템이 존재하지 않습니다.";
                        }
                        else {
                            for(i = 0; i < categoryList.length; ++i) {
                                category = categoryList[i];
                                obj.addItem(category.kind, category.index, category.count);
                                PetManager.PopItem(_id, category.kind, category.index, category.count);
                            }
                            rtnstr += itemname + "의 템을 모두 받습니다.";
                        }
                    }
                }
                else {
                    rtnstr = "아공간을 열수 있는 룬이 부족합니다.";
                }
                _Save();
            }
            return rtnstr;
        },
        PetAwaken:function(_id) {
            var obj = _Find(_id), buffList, buffDB;
            var rtnstr = "", user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("펫각성")) {
                    rtnstr = "펫 각성이 가능한 곳이 아닙니다.";
                    return rtnstr;
                }

                if(PetManager.isAwakenPet(_id)) {
                    if(obj.addRune(-libConst.Pet_AwakeRune)) {
                        rtnstr += "[" + libConst.Pet_Name + " 각성결과]\n\n";
                        buffList = PetManager.AwakenPet(_id);
                        for(var i = 0; i < buffList.length; ++i) {
                            buffDB = m_dbmanager.getPetBuffByIdx(buffList[i].index);
                            rtnstr += buffDB.description + " +" + buffList[i].amount + "%\n";
                        }
                        RecordManager.rcdPetAwaken(_id);
                        _Save();
                    }
                    else {
                        rtnstr = libConst.Pet_Name + " 각성에 필요한 룬이 부족합니다.\n\n - " + libConst.Pet_Name + " 각성에 필요한 룬 : " + libConst.Pet_AwakeRune + " rune";
                    }
                }
                else {
                    rtnstr = libConst.Pet_Name + "의 호감도가 낮아서 펫 각성을 할수가 없습니다.";
                }
            }
            return rtnstr;
        },
        TowerUp:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            var result = {result:false, nofight:false};
            var floor, towerdb, reward;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("오르기")) {
                    rtnstr = "탑을 오를수 있는 장소가 아닙니다.";
                    return rtnstr;
                }

                if(obj.getAbility().hp > 0) {
                    floor = obj.getTowerFloor();
                    if(floor === null)
                        floor = obj.makeTowerFloor();
                    towerdb = m_dbmanager.getTower(""+floor.floor, user_loc.city, user_loc.facility);
                    if(towerdb === null) {
                        rtnstr = "이미 탑의 마지막층에 도달하였습니다.";
                    }
                    else {
                        rtnstr += "[탑 " + floor.floor + "층 전투 결과]" + libConst.dummy + "\n\n";
                        rtnstr += m_huntSystem.Tower(obj, _FindOption(_id), MercenaryManager.getMercenary(_id), MercenaryManager, BattleManager.getMyRank(_id), result);
                        if(result.result) {
                            rtnstr += "탑 " + floor.floor + "층을 클리어 하였습니다.\n";
                            RecordManager.rcdTowerClearFloor(_id, user_loc.city, user_loc.facility, floor.floor);
                            obj.addTowerFloor();
                            rtnstr += "[획득 보상]\n";
                            for(var i = 0; i < towerdb.item.length; ++i) {
                                reward = towerdb.item[i];
                                obj.addItem(reward.kind, reward.index, Number(reward.count));
                                rtnstr += "  L " + m_dbmanager.getItem(reward.kind, reward.index).name +  " x " + reward.count + "\n";
                            }
                            obj.addRune(Number(towerdb.rune));
                            rtnstr += "  L Rune : " + towerdb.rune + "\n";
                        }
                        else {
                            rtnstr += "탑 " + floor.floor + "층을 돌파하지 못하였습니다.\n";
                        }
                        _Save();
                        MercenaryManager.Save();
                    }
                }
                else {
                    rtnstr = "체력이 부족합니다.";
                }
            }
            return rtnstr;
        },
        TowerInfo:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, i;
            var floor, towerdb, reward, towermob, mob;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("현층정보")) {
                    rtnstr = "탑의 정보를 확인할 수 있는 장소가 아닙니다.";
                    return rtnstr;
                }


                floor = obj.getTowerFloor();
                if(floor === null)
                    floor = obj.makeTowerFloor();
                rtnstr += "[" + facilityDB.name + "의 현재 층 정보]" + libConst.dummy + "\n\n";
                towerdb = m_dbmanager.getTower(""+floor.floor, user_loc.city, user_loc.facility);
                if(towerdb === null) {
                    rtnstr += "  - 탑을 끝까지 오르셨습니다.";
                }
                else {
                    rtnstr += "  - 보상 룬 : " + towerdb.rune + " rune\n";
                    rtnstr += "  - 보상 아이템 :\n";
                    for(i = 0; i < towerdb.item.length; ++i) {
                        reward = towerdb.item[i];
                        rtnstr += "    L " + m_dbmanager.getItem(reward.kind, reward.index).name +  " x " + reward.count + "\n";
                    }
                    rtnstr += "  - 출현 몬스터 :\n";
                    for(i = 0; i < towerdb.towermob.length; ++i) {
                        towermob = m_dbmanager.getTowerMob(towerdb.towermob[i]);
                        mob = m_dbmanager.getMonster(towermob.mobindex);
                        rtnstr += "    L " + mob.name +  " (파워 " + towermob.powerrate + "배 상승) " + towermob.count + " 마리\n";
                    }
                }
            }
            return rtnstr;
        },
        GoFelling:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, buff;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("벌목하기")) {
                    rtnstr = "현재위치에서는 벌목하기를 할수 없습니다.";
                    return rtnstr;
                }

                var d = new Date();
                obj.startFelling();
                _Save();
                rtnstr = "현재시간 " + d + " 부터 벌목을 시작합니다.\n\n";
                buff = PetManager.getBuffAmountByKind(_id, "fell");
                rtnstr += (Math.floor(libConst.FellingDefaultSpeed - (libConst.FellingDefaultSpeed * buff / 100))/60000) + "분 벌목시 획득 재화를 확률적으로 획득합니다.\n\n";
                rtnstr += "벌목 종료 명령어 : !벌목종료";
            }
            return rtnstr;
        },
        StopFelling:function(_id) {
            var obj = _Find(_id);
            var user_loc, dbFellList;
            var rtnstr = "", itemlist, tmpitem, itemCount = {}, buff;
            var rewardList = null;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                dbFellList = db_Manager.getTreeList(user_loc.city, user_loc.facility);

                buff = PetManager.getBuffAmountByKind(_id, "fell");
                itemlist = obj.endFelling(user_loc.city, user_loc.facility, buff);
                rtnstr += "[벌목 결과]\n\n";
                if(buff !== 0) {
                    rtnstr += "  L 펫 버프의 효과로 인해 더 많은 재료를 획득하였습니다.\n\n";
                }
                for(var c = 0; c < dbFellList.length; ++c) {
                    itemCount[dbFellList[c].item] = {count:0, kind:dbFellList[c].itemkind};
                }
                for(var i = 0; i < itemlist.length; ++i) {
                    itemCount[itemlist[i].index].count += Number(itemlist[i].count);
                    obj.addItem(itemlist[i].kind, itemlist[i].index, Number(itemlist[i].count));
                }
                for(var item in itemCount){
                    tmpitem = db_Manager.getItem(itemCount[item].kind, item);
                    rtnstr += "  - " + tmpitem.name + "을(를) " + itemCount[item].count + "개 획득하였습니다.\n";
                }
                RecordManager.rcdFellTime(_id, itemlist.length);

                rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Tree, itemlist.length);
                if(rewardList.length > 0) {
                    rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                    rtnstr += _HomeWorkReward(obj, rewardList);
                }
                _Save();
            }
            return rtnstr;
        },
        isFelling:function(_id) {
            var obj = _Find(_id);
            if (obj !== null && obj.getFellingTiem() !== -1) {
                return true;
            }
            return false;
        },
        GoStoning:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, buff;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("채광하기")) {
                    rtnstr = "현재위치에서는 채광하기를 할수 없습니다.";
                    return rtnstr;
                }

                var d = new Date();
                obj.startStoning();
                _Save();
                rtnstr = "현재시간 " + d + " 부터 채광을 시작합니다.\n\n";
                buff = PetManager.getBuffAmountByKind(_id, "stone");
                rtnstr += (Math.floor(libConst.StoningDefaultSpeed - (libConst.StoningDefaultSpeed * buff / 100))/60000) + "분 채광시 획득 재화를 확률적으로 획득합니다.\n\n";
                rtnstr += "채광 종료 명령어 : !채광종료";
            }
            return rtnstr;
        },
        StopStoning:function(_id) {
            var obj = _Find(_id);
            var user_loc, dbStoneList;
            var rtnstr = "", itemlist, tmpitem, itemCount = {}, buff;
            var rewardList = null;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                dbStoneList = db_Manager.getStoneList(user_loc.city, user_loc.facility);

                buff = PetManager.getBuffAmountByKind(_id, "stone");
                itemlist = obj.endStoning(user_loc.city, user_loc.facility, buff);
                rtnstr += "[채광 결과]\n\n";
                if(buff !== 0) {
                    rtnstr += "  L 펫 버프의 효과로 인해 더 많은 재료를 획득하였습니다.\n\n";
                }
                for(var c = 0; c < dbStoneList.length; ++c) {
                    itemCount[dbStoneList[c].item] = {count:0, kind:dbStoneList[c].itemkind};
                }
                for(var i = 0; i < itemlist.length; ++i) {
                    itemCount[itemlist[i].index].count += Number(itemlist[i].count);
                    obj.addItem(itemlist[i].kind, itemlist[i].index, Number(itemlist[i].count));
                }
                for(var item in itemCount){
                    tmpitem = db_Manager.getItem(itemCount[item].kind, item);
                    rtnstr += "  - " + tmpitem.name + "을(를) " + itemCount[item].count + "개 획득하였습니다.\n";
                }
                RecordManager.rcdStoneTime(_id, itemlist.length);

                rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Stone, itemlist.length);
                if(rewardList.length > 0) {
                    rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                    rtnstr += _HomeWorkReward(obj, rewardList);
                }
                _Save();
            }
            return rtnstr;
        },
        isStoning:function(_id) {
            var obj = _Find(_id);
            if (obj !== null && obj.getStoningTiem() !== -1) {
                return true;
            }
            return false;
        },
        GoGetting:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, buff;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("채집하기")) {
                    rtnstr = "현재위치에서는 채집하기를 할수 없습니다.";
                    return rtnstr;
                }

                var d = new Date();
                obj.startGetting();
                _Save();
                rtnstr = "현재시간 " + d + " 부터 채집을 시작합니다.\n\n";
                buff = PetManager.getBuffAmountByKind(_id, "getting");
                rtnstr += (Math.floor(libConst.GettingDefaultSpeed - (libConst.GettingDefaultSpeed * buff / 100))/60000) + "분 채집시 획득 재화를 확률적으로 획득합니다.\n\n";
                rtnstr += "채집 종료 명령어 : !채집종료";
            }
            return rtnstr;
        },
        StopGetting:function(_id) {
            var obj = _Find(_id);
            var user_loc, dbGettingList;
            var rtnstr = "", itemlist, tmpitem, itemCount = {}, buff;
            var rewardList = null;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                dbGettingList = db_Manager.getGettingList(user_loc.city, user_loc.facility);

                buff = PetManager.getBuffAmountByKind(_id, "getting");
                itemlist = obj.endGetting(user_loc.city, user_loc.facility, buff);
                rtnstr += "[채집 결과]\n\n";
                if(buff !== 0) {
                    rtnstr += "  L 펫 버프의 효과로 인해 더 많은 재료를 획득하였습니다.\n\n";
                }
                for(var c = 0; c < dbGettingList.length; ++c) {
                    itemCount[dbGettingList[c].item] = {count:0, kind:dbGettingList[c].itemkind};
                }
                for(var i = 0; i < itemlist.length; ++i) {
                    itemCount[itemlist[i].index].count += Number(itemlist[i].count);
                    obj.addItem(itemlist[i].kind, itemlist[i].index, Number(itemlist[i].count));
                }
                for(var item in itemCount){
                    tmpitem = db_Manager.getItem(itemCount[item].kind, item);
                    rtnstr += "  - " + tmpitem.name + "을(를) " + itemCount[item].count + "개 획득하였습니다.\n";
                }
                RecordManager.rcdGetterTime(_id, itemlist.length);

                rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Getting, itemlist.length);
                if(rewardList.length > 0) {
                    rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                    rtnstr += _HomeWorkReward(obj, rewardList);
                }
                _Save();
            }
            return rtnstr;
        },
        isGetting:function(_id) {
            var obj = _Find(_id);
            if (obj !== null && obj.getGettingTiem() !== -1) {
                return true;
            }
            return false;
        },
        getRequestList:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, requestList, request, db;
            var tmpObj;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("의뢰받기")) {
                    rtnstr = "의뢰를 받을수 있는 곳이 아닙니다.";
                    return rtnstr;
                }

                requestList = m_dbmanager.getRequest(user_loc.city, user_loc.facility);

                for(var i = 0; i < requestList.length; ++i) {
                    request = m_dbmanager.getQuest(requestList[i].index);
                    rtnstr += (i+1) +  ". " + request.title + "\n";
                    if(request.kind === "Item") {
                        tmpObj = m_dbmanager.getItem(request.option, request.target);
                        rtnstr += "  - 목표 : " + tmpObj.name + "을(를) " + request.count + "개 가져오기\n";
                    }
                    else if(request.kind === "Monster") {
                        tmpObj = m_dbmanager.getMonster(request.target);
                        rtnstr += "  - 목표 : " + tmpObj.name + "을(를) "  + request.count + "마리 잡아오기\n";
                    }
                    rtnstr += "  - 보상 : \n";
                    for(var j = 0; j < request.item.length; ++j) {
                        tmpObj = m_dbmanager.getItem(request.item[j].itemkind, request.item[j].itemIdx);
                        rtnstr += "     " + (j+1) + ". " + tmpObj.name + " x " + request.item[j].count + "\n";
                    }
                    rtnstr += "  - 보상룬 : " + request.rune + "rune \n\n";
                }
            }

            return rtnstr;
        },
        ReciveRequest:function(_id, _idx) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, requestList, request;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("의뢰받기")) {
                    rtnstr = "의뢰를 받을수 있는 곳이 아닙니다.";
                    return rtnstr;
                }

                requestList = m_dbmanager.getRequest(user_loc.city, user_loc.facility);
                if(requestList.length > _idx ) {
                    request = m_dbmanager.getQuest(requestList[_idx].index);
                    if(request !== null) {
                        obj.setTargetQuest(request.index);

                        if(obj.isQuest(obj.getTargetQuest())) {
                            rtnstr = "이미 수락한 퀘스트 입니다.";
                        }
                        else {
                            obj.confirmTargetQuest();
                            rtnstr = "퀘스트를 수락하였습니다.";
                            _Save();
                        }
                    }
                    else {
                        rtnstr = "존재하지 않는 퀘스트 입니다.";
                    }
                }
                else {
                    rtnstr = "인덱스" + (_idx+1) + "번 대한 의뢰가 없습니다.";
                }

            }
            return rtnstr;
        },
        getRecipeList:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", recipeList, recipe, dbRecipe, dbItem, compliteItem, meter, j;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                recipeList = obj.getRecipeList();
                rtnstr = "[보유중인 레시피]\n\n";
                for(var i = 0; i < recipeList.length; ++i) {
                    recipe = recipeList[i];
                    dbRecipe = m_dbmanager.getRecipe(recipe);
                    dbItem = m_dbmanager.getItem(dbRecipe.kind, recipe);
                    compliteItem = m_dbmanager.getItem(dbRecipe.goods.itemkind, dbRecipe.goods.itemindex);
                    rtnstr += (i+1) + ". " + dbItem.name + "\n";
                    rtnstr += "  L 완성품 : " + compliteItem.name + " x " + dbRecipe.goods.count + "개\n";
                    rtnstr += "  L 제품종류 : " + _ChangeRecipe(dbRecipe.info) + "\n";
                    if(dbRecipe.talent !== "")
                        rtnstr += "  L 필요특성 : " + m_dbmanager.getProperty(dbRecipe.talent).name + "\n";
                    if(dbRecipe.skill !== "")
                        rtnstr += "  L 필요스킬 : " + m_dbmanager.getSkill(dbRecipe.skill).name + "\n";
                    rtnstr += "\n";
                }
            }
            return rtnstr;
        },
        StartObtain:function(_id, _kind, _count, _item) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            var itemDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);

                if(_kind === libObject.ObtainKind.MINING) {
                    if(facilityDB === null || !facilityDB.action.includes("자동채굴")) {
                        rtnstr = "현재위치에서는 자동채굴을 할수 없습니다.";
                        return rtnstr;
                    }
                }
                else if(_kind === libObject.ObtainKind.STONING){
                    if(facilityDB === null || !facilityDB.action.includes("자동채광")) {
                        rtnstr = "현재위치에서는 자동채광을 할수 없습니다.";
                        return rtnstr;
                    }
                }
                else if(_kind === libObject.ObtainKind.GETTING){
                    if(facilityDB === null || !facilityDB.action.includes("자동채집")) {
                        rtnstr = "현재위치에서는 자동채집을 할수 없습니다.";
                        return rtnstr;
                    }
                }
                else if(_kind === libObject.ObtainKind.FELLING){
                    if(facilityDB === null || !facilityDB.action.includes("자동벌목")) {
                        rtnstr = "현재위치에서는 자동벌목을 할수 없습니다.";
                        return rtnstr;
                    }
                }
            }

            itemDB = m_dbmanager.getItemByName(_item);
            if(itemDB.obj !== null) {
                if(itemDB.obj.kind === "obtain") {
                    if(obj.isItemCount(itemDB.kind, itemDB.obj.index, _count)) {
                        if(AutoObtainManager.isWorking(_id, _kind)) {
                            if(_kind === libObject.ObtainKind.MINING) {
                                rtnstr = "이미 자동채굴을 하고 있습니다.";
                            }
                            else if(_kind === libObject.ObtainKind.FELLING){
                                rtnstr = "이미 자동채광을 하고 있습니다.";
                            }
                            else if(_kind === libObject.ObtainKind.STONING){
                                rtnstr = "이미 자동채집을 하고 있습니다.";
                            }
                            else if(_kind === libObject.ObtainKind.GETTING){
                                rtnstr = "이미 자동벌목을 하고 있습니다.";
                            }
                        }
                        else {
                            obj.removeItem(itemDB.kind, itemDB.obj.index, _count);
                            AutoObtainManager.AutoWorkingStart(_id, _kind, Number(itemDB.obj.amount) * _count, user_loc);
                            if(_kind === libObject.ObtainKind.MINING) {
                                rtnstr = "자동채굴 " + Number(itemDB.obj.amount) * _count + "초 동안 실행합니다.";
                            }
                            else if(_kind === libObject.ObtainKind.FELLING){
                                rtnstr = "자동채광 " + Number(itemDB.obj.amount) * _count + "초 동안 실행합니다.";
                            }
                            else if(_kind === libObject.ObtainKind.STONING){
                                rtnstr = "자동채집 " + Number(itemDB.obj.amount) * _count + "초 동안 실행합니다.";
                            }
                            else if(_kind === libObject.ObtainKind.GETTING){
                                rtnstr = "자동벌목 " + Number(itemDB.obj.amount) * _count + "초 동안 실행합니다.";
                            }

                            _Save();
                        }
                    }
                    else {
                        rtnstr = "해당 아이템을 보유하고 있지 않거나, 갯수가 부족합니다.";
                    }
                }
                else {
                    rtnstr = "해당 아이템은 채굴 아이템이 아닙니다.";
                }
            }
            else {
                rtnstr = "해당 아이템은 존재하지 않는 아이템 입니다.";
            }

            return rtnstr;
        },
        EndObtain:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", result;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                rtnstr = "[정산 결과]\n\n";
                result = AutoObtainManager.CompliteAutoWorking(_id);
                rtnstr += result.text;
                for(var i = 0; i < result.list.length; ++i) {
                    obj.addItem(result.list[i].kind, result.list[i].index, Number(result.list[i].count));
                }
                _Save();
            }
            return rtnstr;
        },

        //[마이홈]
        getHomeInfo:function(_id) {
            return MyHomeManager.getInfo(_id);
        },
        getHomeDetailInfo:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, box;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "마이홈에서 확인할 수 있습니다.";
                    return rtnstr;
                }

                rtnstr = MyHomeManager.getDetailInfo(_id);

                rtnstr += "\n";
                rtnstr += "(창고 리스트)" + libConst.dummy + "\n";
                box = MyHomeManager.getBox(_id);
                rtnstr += _SortItem(box, null);
            }
            return rtnstr;
        },
        getBuildingAreaList:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, nationDB, buildingDB, meter;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("건축하기")) {
                    rtnstr = "현재위치에서는 건축하기를 할수 없습니다.";
                    return rtnstr;
                }

                if(MyHomeManager.isMyHome(_id)){
                    rtnstr = "이미 당신은 집을 보유하고 있습니다.";
                    return rtnstr;
                }

                nationDB = m_dbmanager.getNation(user_loc.country);
                if(nationDB !== null) {
                    rtnstr = "[" + nationDB.name + " 건축가능 도시목록]\n";
                    for(var i = 0 ; i < nationDB.cities.length; ++i){
                        rtnstr += "  L " + m_dbmanager.getCity(nationDB.cities[i]).name + "\n";
                    }

                    buildingDB = m_dbmanager.getBuilding("1");
                    rtnstr += "\n[건축 재료]\n";
                    for(var j = 0; j < buildingDB.meterial.length; ++j) {
                        meter = buildingDB.meterial[j];
                        rtnstr += "  - " + m_dbmanager.getItem(meter.itemkind, meter.itemindex).name + " x " + meter.count + "\n";
                    }
                    rtnstr += "  - " + buildingDB.needrune + " rune";
                }
                else {
                    rtnstr = "현재위치에서는 건축이 불가능합니다.";
                }
            }
            return rtnstr;
        },
        BuildingHouse:function(_id, _cityname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, nationDB, i, tmpcity;
            var buildingDB, meter, itemflag = true;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("건축하기")) {
                    rtnstr = "현재위치에서는 건축을 할수 없습니다.";
                    return rtnstr;
                }
                if(MyHomeManager.isMyHome(_id)){
                    rtnstr = "이미 당신은 집을 보유하고 있습니다.";
                    return rtnstr;
                }

                nationDB = m_dbmanager.getNation(user_loc.country);
                tmpcity = m_dbmanager.getCityByName(_cityname);
                if(nationDB === null || tmpcity === null || nationDB.cities.indexOf(tmpcity.index) === -1) {
                    rtnstr = "건축하고자하는 지역명이 잘못 되었거나 현재 나라에 속한 지명이 아닙니다.";
                    return rtnstr;
                }

                buildingDB = m_dbmanager.getBuilding("1");
                if(buildingDB === null) {
                    rtnstr = "건축정보가 없습니다.";
                }
                else {
                    if(obj.addRune(-Number(buildingDB.needrune))) {
                        for(i = 0; i < buildingDB.meterial.length; ++i) {
                            meter =  buildingDB.meterial[i];
                            if(!obj.isItemCount(meter.itemkind, meter.itemindex, meter.count)) {
                                itemflag = false;
                                break;
                            }
                        }
                        if(itemflag) {
                            for(i = 0; i < buildingDB.meterial.length; ++i) {
                                meter =  buildingDB.meterial[i];
                                obj.removeItem(meter.itemkind, meter.itemindex, meter.count);
                            }
                            MyHomeManager.Buliding(_id, _cityname);
                            rtnstr = "건축이 완료되었습니다. 관련 정보는 !마이홈 명령어로 확인이 가능합니다.";
                        }
                        else {
                            obj.addRune(Number(buildingDB.needrune));
                            rtnstr = "재료가 부족합니다. 필요한 재료와 갯수를 확인하시기 바랍니다.";
                        }
                    }
                    else {
                        rtnstr = "보유룬이 부족합니다.\n\n  - 필요 룬 : " + buildingDB.needrune + " rune";
                    }
                }
                _Save();
            }
            return rtnstr;
        },
        BuildingExtend:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, i;
            var buildingDB, meter, itemflag = true;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 증축을 할수 없습니다.";
                    return rtnstr;
                }

                buildingDB = m_dbmanager.getBuilding(MyHomeManager.getHomeNextLevel(_id));
                if(buildingDB === null) {
                    rtnstr = "건축정보가 없습니다.";
                }
                else {
                    if(obj.addRune(-Number(buildingDB.needrune))) {
                        for(i = 0; i < buildingDB.meterial.length; ++i) {
                            meter =  buildingDB.meterial[i];
                            if(!obj.isItemCount(meter.itemkind, meter.itemindex, meter.count)) {
                                itemflag = false;
                                break;
                            }
                        }
                        if(itemflag) {
                            for(i = 0; i < buildingDB.meterial.length; ++i) {
                                meter =  buildingDB.meterial[i];
                                obj.removeItem(meter.itemkind, meter.itemindex, meter.count);
                            }
                            MyHomeManager.Extending(_id);
                            rtnstr = "증축이 완료되었습니다. 관련 정보는 !마이홈 명령어로 확인이 가능합니다.";
                        }
                        else {
                            obj.addRune(Number(buildingDB.needrune));
                            rtnstr = "재료가 부족합니다. 필요한 재료와 갯수를 확인하시기 바랍니다.";
                        }
                    }
                    else {
                        rtnstr = "보유룬이 부족합니다.\n\n  - 필요 룬 : " + buildingDB.needrune + " rune";
                    }
                }
                _Save();
            }
            return rtnstr;
        },
        getMoveAreaList:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, nationDB, tmpcity;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("이전하기")) {
                    rtnstr = "현재위치에서는 이전하기를 할수 없습니다.";
                    return rtnstr;
                }

                if(!MyHomeManager.isMyHome(_id)){
                    rtnstr = "당신은 집을 보유하고 있지 않습니다.";
                    return rtnstr;
                }

                nationDB = m_dbmanager.getNation(user_loc.country);
                if(nationDB !== null) {
                    rtnstr = "[" + nationDB.name + " 이전가능 도시목록]\n";
                    for(var i = 0 ; i < nationDB.cities.length; ++i){
                        tmpcity = m_dbmanager.getCity(nationDB.cities[i]);
                        if(tmpcity.needquest === "" || obj.isCompliteQuest(tmpcity.needquest))
                            rtnstr += "  L " + m_dbmanager.getCity(nationDB.cities[i]).name + "\n";
                        else
                            rtnstr += "  L " + m_dbmanager.getCity(nationDB.cities[i]).name + "(이전불가)\n";
                    }

                    rtnstr += "\n";
                    rtnstr += "  - 비용 : " + libConst.House_MoveRune + " rune";
                }
                else {
                    rtnstr = "현재위치로 이전이 불가능합니다.";
                }
            }
            return rtnstr;
        },
        MoveHouse:function(_id, _cityname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, nationDB, tmpcity, i, home_loc;
            var buildingDB, meter, itemflag = true;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("이전하기")) {
                    rtnstr = "현재위치에서는 이전을 할수 없습니다.";
                    return rtnstr;
                }
                if(!MyHomeManager.isMyHome(_id)){
                    rtnstr = "당신은 집을 보유하고 있지 않습니다.";
                    return rtnstr;
                }

                nationDB = m_dbmanager.getNation(user_loc.country);
                tmpcity = m_dbmanager.getCityByName(_cityname);
                if(nationDB === null || tmpcity === null || nationDB.cities.indexOf(tmpcity.index) === -1) {
                    rtnstr = "건축하고자하는 지역명이 잘못 되었거나 현재 나라에 속한 지명이 아닙니다.";
                    return rtnstr;
                }

                home_loc = MyHomeManager.getHomeLoc(_id);
                if(home_loc.city === tmpcity.index) {
                    rtnstr = "해당 장소에 이미 마이홈이 존재 합니다.";
                    return rtnstr;
                }

                if(tmpcity.needquest === "" || obj.isCompliteQuest(tmpcity.needquest)) {
                    if(obj.addRune(-libConst.House_MoveRune)) {
                        MyHomeManager.Move(_id, _cityname);
                        rtnstr = "마이홈 이전이 완료되었습니다.";
                    }
                    else {
                        rtnstr = "보유룬이 부족합니다.\n\n  - 필요 룬 : " + libConst.House_MoveRune + " rune";
                    }
                }
                else {
                  rtnstr = "건축하고자하는 지역은 선행 퀘스트가 존재 합니다. 퀘스트를 완료 후 이전 가능합니다.";
                  return rtnstr;
                }


                _Save();
            }
            return rtnstr;
        },
        PushBox:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, i;
            var spl_item = _itemname.split("+"), itemlevel, itemname, itemlist, categoryList, category;
            var db_item, item;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 창고를 사용할 수 없습니다.";
                    return rtnstr;
                }

                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];

                itemlist = obj.getItemList("all");

                categoryList = _FindCategory(itemlist, itemname);
                if(categoryList === null) {
                    if(itemname === "all") {
                        for(i = itemlist.length - 1; i >= 0; --i) {
                            item = itemlist[i];
                            MyHomeManager.PushItem(_id, item.kind, item.index, item.count, item.strength);
                            obj.removeItem(item.kind, item.index, item.count, item.strength);
                        }
                        rtnstr = "창고에 모든 아이템을 저장하였습니다.";
                        _Save();
                    }
                    else {
                        db_item = m_dbmanager.getItemByName(itemname);
                        if(db_item.obj === null) {
                            rtnstr = "해당 아이템은 존재 하지 않습니다.";
                        }
                        else {
                            if(obj.isItemCount(db_item.kind, db_item.obj.index, _count, Number(itemlevel))){
                                MyHomeManager.PushItem(_id, db_item.kind, db_item.obj.index, _count, Number(itemlevel));
                                obj.removeItem(db_item.kind, db_item.obj.index, _count, Number(itemlevel));
                                rtnstr = "창고에서 " + db_item.obj.name + "을(를) " + _count + "개를 저장하였습니다.";
                                _Save();
                            }
                            else {
                                rtnstr = "당신은 해당 물건을 보유하고 있지 않습니다.";
                            }
                        }
                    }
                }
                else {
                    if(categoryList.length === 0) {
                        rtnstr += "해당 카테고리에 저장 가능한 템이 존재하지 않습니다.";
                    }
                    else {
                        for(i = 0; i < categoryList.length; ++i) {
                            category = categoryList[i];
                            MyHomeManager.PushItem(_id, category.kind, category.index, category.count);
                            obj.removeItem(category.kind, category.index, category.count);
                        }
                        rtnstr += itemname + "의 템을 모두 저장하였습니다.";
                        _Save();
                    }


                }
            }
            return rtnstr;
        },
        PopBox:function(_id, _count, _itemname) {
            var obj = _Find(_id);
            var spl_item = _itemname.split("+"), itemlevel, itemname, itemlist, categoryList, category;
            var rtnstr = "", user_loc, i;
            var db_item, item;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 창고를 사용할 수 없습니다.";
                    return rtnstr;
                }

                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];

                itemlist = MyHomeManager.getBox(_id);
                categoryList = _FindCategory(itemlist, itemname);
                if(categoryList === null) {
                    if(itemname === "all") {
                        for(i = itemlist.length - 1; i >= 0; --i) {
                            item = itemlist[i];
                            obj.addItem(item.kind, item.index, item.count, item.strength);
                            MyHomeManager.PopItem(_id, item.kind, item.index, item.count, item.strength);
                        }
                        rtnstr += "창고에서 모든 아이템을 꺼냈습니다.";
                    }
                    else {
                        db_item = m_dbmanager.getItemByName(itemname);
                        if(db_item.obj === null) {
                            rtnstr = "해당 아이템은 존재 하지 않습니다.";
                        }
                        else {
                            if(MyHomeManager.isItemCount(_id, db_item.kind, db_item.obj.index, _count, Number(itemlevel))){
                                obj.addItem(db_item.kind, db_item.obj.index, _count, Number(itemlevel));
                                MyHomeManager.PopItem(_id, db_item.kind, db_item.obj.index, _count, Number(itemlevel));
                                rtnstr = "창고에서 " + db_item.obj.name + "을(를) " + _count + "개를 꺼냈습니다.";
                            }
                            else {
                                rtnstr = "창고에 해당 물건이 존재하지 않습니다.";
                            }
                        }
                    }
                }
                else {
                    if(categoryList.length === 0) {
                        rtnstr += "해당 카테고리에 수거 가능한 템이 존재하지 않습니다.";
                    }
                    else {
                        for(i = 0; i < categoryList.length; ++i) {
                            category = categoryList[i];
                            obj.addItem(category.kind, category.index, category.count);
                            MyHomeManager.PopItem(_id, category.kind, category.index, category.count);
                        }
                        rtnstr += itemname + "의 템을 모두 받습니다.";
                    }
                }
                _Save();
            }
            return rtnstr;
        },
        getFurniturePlaceList:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, itemlist, item, i;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 가구배치를 할수 없습니다.";
                    return rtnstr;
                }

                itemlist = obj.getItemList(libConst.ITEM_KIND.FUNCTIONALITYITEM);
                rtnstr += MyHomeManager.getFurnitureInfo(_id);
                rtnstr += "[배치가능한 보유한 가구]\n";
                for(i = 0; i < itemlist.length; ++i) {
                    item = m_dbmanager.getFunctionalityItem(itemlist[i].index);
                    if(item.kind === "furniture") {
                        rtnstr += "  - " + item.name + " (" + (item.effect === "deco" ?"+":"-") + item.amount + ")\n";
                    }
                }
            }
            return rtnstr;
        },
        FurniturePlace:function(_id, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, dbItem;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 가구배치를 할수 없습니다.";
                    return rtnstr;
                }
                dbItem = m_dbmanager.getItemByName(_itemname);
                if(dbItem.obj !== null) {
                    if(dbItem.kind === libConst.ITEM_KIND.FUNCTIONALITYITEM && dbItem.obj.kind === "furniture") {
                        if(obj.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.obj.index)) {
                            if(MyHomeManager.setFurniture(_id, dbItem.obj.index)) {
                                obj.removeItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.obj.index, 1);
                                _Save();
                                rtnstr = dbItem.obj.name + "을(를) 배치하였습니다.";
                            }
                            else {
                                rtnstr = "환경도가 낮거나, 배치 공간이 부족합니다.";
                            }
                        }
                        else {
                            rtnstr = "해당 아이템을 보유하고 있지 않습니다.";
                        }
                    }
                    else {
                        rtnstr = "해당 아이템은 가구가 아닙니다.";
                    }
                }
                else {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
            }
            return rtnstr;
        },
        FurnitureRemove:function(_id, _itemname) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, dbItem;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 가구수거를 할수 없습니다.";
                    return rtnstr;
                }
                dbItem = m_dbmanager.getItemByName(_itemname);
                if(dbItem.obj !== null) {
                    if(dbItem.kind === libConst.ITEM_KIND.FUNCTIONALITYITEM && dbItem.obj.kind === "furniture") {
                        if(MyHomeManager.removeFurniture(_id, dbItem.obj.index)) {
                            obj.addItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, dbItem.obj.index, 1);
                            _Save();
                            rtnstr = dbItem.obj.name + "을(를) 수거하였습니다.";
                        }
                        else {
                            rtnstr = "집에 " + dbItem.obj.name + " 가구가 배치 되어 있지 않습니다.";
                        }
                    }
                    else {
                        rtnstr = "해당 아이템은 가구가 아닙니다.";
                    }
                }
                else {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
            }
            return rtnstr;
        },
        ComeBackHome:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", homeloc, user_loc;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(!MyHomeManager.isMyHome(_id)){
                    rtnstr = "당신은 집을 소유하고 있지 않습니다.";
                    return rtnstr;
                }
                user_loc = obj.getLocation();
                if(user_loc.home === _id) {
                    rtnstr = "내 집에서는 귀환하기를 할 수 없습니다.";
                    return rtnstr;
                }

                if(obj.getStoningTiem() !== -1) {
                    rtnstr += "채광중엔 해당장소를 떠날수 없습니다.";
                }
                else if(obj.getFellingTiem() !== -1) {
                    rtnstr += "벌목중엔 해당장소를 떠날수 없습니다.";
                }
                else if(obj.getMiningTiem() !== -1) {
                    rtnstr += "채굴중엔 해당장소를 떠날수 없습니다.";
                }
                else if(obj.getGettingTiem() !== -1) {
                    rtnstr += "채집중엔 해당장소를 떠날수 없습니다.";
                }
                else if(obj.getIsDungeon("dungeon")) {
                    rtnstr += "던전 진입중이라서 떠날수 없습니다.";
                }
                else if(obj.getIsDungeon("occupy")) {
                    rtnstr += "점령전 중이라서 떠날수 없습니다.";
                }
                else {
                    if(MyHomeManager.isFurnitureEffect(_id, "back")) {
                        homeloc = MyHomeManager.getHomeLoc(_id);
                        obj.setLocation(homeloc.country, homeloc.city, homeloc.facility, homeloc.field, homeloc.dungeon, _id);
                        _Save();
                        rtnstr = "자신의 집으로 귀환했습니다.";
                    }
                    else {
                        rtnstr = "마이홈에 귀환 시설이 배치되어 있지 않습니다.";
                    }
                }
            }
            return rtnstr;
        },
        SaveLocation:function(_id, _locname) {
            var obj = _Find(_id);
            var rtnstr = "", homeloc, user_loc;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(!MyHomeManager.isMyHome(_id)){
                    rtnstr = "당신은 집을 소유하고 있지 않습니다.";
                    return rtnstr;
                }
                user_loc = obj.getLocation();
                if(user_loc.home === _id) {
                    rtnstr = "내 집은 위치 저장을 할 수 없습니다.";
                    return rtnstr;
                }

                if(MyHomeManager.isFurnitureEffect(_id, "go") || MyHomeManager.isFurnitureEffect(_id, "savelocation")) {
                    rtnstr = MyHomeManager.SaveLocation(_id, _locname, user_loc);
                }
                else {
                    rtnstr = "마이홈에 워프관련 시설이 배치되어 있지 않습니다.";
                }
            }
            return rtnstr;
        },
        RemoveLocation:function(_id, _locname) {
            var obj = _Find(_id);
            var rtnstr = "", homeloc, user_loc;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(!MyHomeManager.isMyHome(_id)){
                    rtnstr = "당신은 집을 소유하고 있지 않습니다.";
                    return rtnstr;
                }
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재 위치에서는 워프 포인트를 삭제할 수 없습니다.";
                    return rtnstr;
                }

                if(MyHomeManager.isFurnitureEffect(_id, "go") || MyHomeManager.isFurnitureEffect(_id, "savelocation")) {
                    rtnstr = MyHomeManager.RemoveLocation(_id, _locname);
                }
                else {
                    rtnstr = "마이홈에 워프관련 시설이 배치되어 있지 않습니다.";
                }
            }
            return rtnstr;
        },
        MoveWrapPoint:function(_id, _locname, _conquestlist) {
            var obj = _Find(_id);
            var rtnstr = "", cityInfo, user_loc;
            var myConquest = true;
            var tmploc;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(!MyHomeManager.isMyHome(_id)){
                    rtnstr = "당신은 집을 소유하고 있지 않습니다.";
                    return rtnstr;
                }
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재 위치에서는 워프할 수 없습니다..";
                    return rtnstr;
                }

                if(MyHomeManager.isFurnitureEffect(_id, "go")) {
                    tmploc = MyHomeManager.FindWarpPoint(_id, _locname);
                    
                    if(tmploc === null) {
                        rtnstr = "해당 워프명이 존재하지 않습니다.";
                    }
                    else {
                        if(tmploc.city !== "" && tmploc.facility !== "") {
                            cityInfo = m_dbmanager.getCity(tmploc.city);

                            if(cityInfo !== null && cityInfo.occupy === "Y") {
                                myConquest = _isMyConquest(tmploc, _conquestlist);
                            }
                        }

                        if(myConquest) {
                            obj.setLocation(tmploc.country, tmploc.city, tmploc.facility, tmploc.field, tmploc.dungeon, "");
                            _Save();
                            rtnstr = "워프를 완료하였습니다.";
                        }
                        else {
                            rtnstr = "점령지는 자신의 클랜이 점령한 곳만 워프 가능합니다.";
                        }
                    }
                }
                else {
                    rtnstr = "마이홈에 워프관련 시설이 배치되어 있지 않습니다.";
                }
            }
            return rtnstr;
        },
        getMakeList:function(_id, _option) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, i, j, idx = 1;
            var recipeList, recipe, item, compliteItem;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 포션만들기를 할 수 없습니다.";
                    return rtnstr;
                }

                recipeList = obj.getRecipeList();
                rtnstr = "[제조 " + _ChangeRecipe(_option) + " 리스트]\n\n";

                if(_option === "potion")
                    effect = "experiment";
                else if(_option === "accessory")
                    effect = "smithdesk";
                else if(_option === "book")
                    effect = "desk";
                else if(_option === "equipment")
                    effect = "anvil";

                if(MyHomeManager.isFurnitureEffect(_id, effect)) {
                    for(i = 0; i < recipeList.length; ++i) {
                        recipe = m_dbmanager.getRecipe(recipeList[i]);
                        item = m_dbmanager.getItem(recipe.kind, recipeList[i]);
                        compliteItem = m_dbmanager.getItem(recipe.goods.itemkind, recipe.goods.itemindex);
                        if(recipe.info === _option) {
                            rtnstr += idx + ". " + item.name + "\n";
                            rtnstr += "  L 완성품 : " + compliteItem.name + " x " + recipe.goods.count + "\n";
                            if(recipe.talent !== "")
                                rtnstr += "  L 필요특성 : " + m_dbmanager.getProperty(recipe.talent).name + "\n";
                            if(recipe.skill !== "")
                                rtnstr += "  L 필요스킬 : " + m_dbmanager.getSkill(recipe.skill).name + "\n";
                            if(recipe.furniture !== "")
                                rtnstr += "  L 필요가구 : " + m_dbmanager.getFunctionalityItem(recipe.furniture).name + "\n";

                            rtnstr += "(요구 능력치)\n";
                            if(recipe.technic !== 0)
                                rtnstr += "  - 기술력: " + recipe.technic + "\n";
                            if(recipe.wisdom !== 0)
                                rtnstr += "  - 지혜: " + recipe.wisdom + "\n";
                            if(recipe.insight !== 0)
                                rtnstr += "  - 통찰력: " + recipe.insight + "\n";

                            rtnstr += "(재료)\n";
                            for(j = 0; j < recipe.meterial.length; ++j) {
                                meter = recipe.meterial[j];
                                rtnstr += "  - " +  m_dbmanager.getItem(meter.meterkind, meter.meterindex).name + "x" + meter.count + "\n";
                            }
                            ++idx;
                            rtnstr += "\n";
                        }
                    }
                }
                else {
                    rtnstr = "제조에 필요한 가구가 없습니다.";
                }
            }
            return rtnstr;
        },
        MyMakeRecipe:function(_id, _recipename, _option, _count) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc;
            var itemDB, recipeDB, effect, materialList, buff, count, possible = true;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                if(user_loc.home !== _id) {
                    rtnstr = "현재위치에서는 만들기를 할 수 없습니다.";
                    return rtnstr;
                }
                itemDB = m_dbmanager.getItemByName(_recipename);
                if(itemDB.obj !== null) {
                    recipeDB = m_dbmanager.getRecipe(itemDB.obj.index);
                    if(itemDB.obj.kind === "recipe" && recipeDB !== null) {
                        if(recipeDB.info === _option) {
                            if(recipeDB.talent !== "" && obj.isTalent(recipeDB.talent) === -1) {
                                return "제조에 필요한 특성을 가지고 있지 않습니다.";
                            }
                            else if(recipeDB.skill !== "" && obj.isSkill(recipeDB.skill) === -1) {
                                return "제조에 필요한 스킬을 가지고 있지 않습니다.";
                            }
                            else if(obj.getVitality().technic < Number(recipeDB.technic)) {
                                return "기술력이 부족하여 제조를 할수 없습니다.";
                            }
                            else if(obj.getVitality().wisdom < Number(recipeDB.wisdom)) {
                                return "지혜가 부족하여 제조를 할수 없습니다.";
                            }
                            else if(obj.getVitality().insight < Number(recipeDB.insight)) {
                                return "통찰력이 부족하여 제조를 할수 없습니다.";
                            }

                            if(_option === "potion")
                                effect = "experiment";
                            else if(_option === "accessory")
                                effect = "smithdesk";
                            else if(_option === "book")
                                effect = "desk";
                            else if(_option === "equipment")
                                effect = "anvil";

                            if(MyHomeManager.isFurnitureEffect(_id, effect)) {
                                materialList = recipeDB.meterial;
                                buff = PetManager.getBuffAmountByKind(_id, "reduce");
                                if(buff !== 0) {
                                    rtnstr += "펫 버프로 인하여 재료가 " + buff + "% 줄어듭니다.\n";
                                }
                                for(i = 0; i < materialList.length; ++i) {
                                    count = Math.floor(Number(materialList[i].count) - (Number(materialList[i].count) * buff / 100));
                                    if(count <= 0)
                                        count = 1;
                                    if(obj.getItemCount(materialList[i].meterkind, materialList[i].meterindex) < count * _count) {
                                        possible = false;
                                        break;
                                    }
                                }
                                if(possible) {
                                    obj.addItem(recipeDB.goods.itemkind, recipeDB.goods.itemindex, Number(recipeDB.goods.count) * _count);
                                    for(var j = 0; j < materialList.length; ++j) {
                                        count = Math.floor(Number(materialList[j].count) - (Number(materialList[j].count) * buff / 100));
                                        if(count <= 0)
                                            count = 1;
                                        obj.removeItem(materialList[j].meterkind, materialList[j].meterindex, count * _count);
                                    }
                                    rtnstr += "완료하였습니다.";
                                    _Save();
                                }
                                else {
                                    rtnstr = "제조를 실패하였습니다. - 재료갯수를 확인 바랍니다.";
                                }
                            }
                            else {
                                rtnstr = "제조에 필요한 가구가 없습니다.";
                            }
                        }
                        else {
                            rtnstr = "해당 레시피는 " + _ChangeRecipe(_option) + " 타입의 레시피가 아닙니다.";
                        }
                    }
                    else {
                        rtnstr = "해당 아이템명은 레시피가 아닙니다.";
                    }
                }
                else {
                    rtnstr = "해당 레시피는 존재하지 않습니다.";
                }
            }
            return rtnstr;
        },
        Attendance:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", date, calendarDB, itemDB;
            var rewardList = null;

            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(CalendarManager.isAttendance(_id)) {
                    rtnstr = "이미 오늘 출석 보상을 수령하였습니다.";
                }
                else {
                    date = new Date();
                    calendarDB = m_dbmanager.getTodayAttendance(Number(date.getDate()) - 1);
                    if(calendarDB === undefined || calendarDB === null) {
                        rtnstr = "해당 날짜에 보상이 없습니다.";
                    }
                    else {
                        CalendarManager.Attendance(_id);
                        itemDB = m_dbmanager.getItem(calendarDB.kind, calendarDB.index);
                        obj.addItem(calendarDB.kind, calendarDB.index, calendarDB.count, Number(calendarDB.strength));
                        rtnstr = "금일 출석을 완료하였습니다.";
                        rtnstr += " - " + itemDB.name + ((calendarDB.strength === "" || calendarDB.strength === 0)?"":"+"+calendarDB.strength) + "을(를) " + calendarDB.count + "개 획득하였습니다.";
                        
                        rewardList = HomeworkManager.completeHomework(_id, libConst.HomeworkType.Attendance, 1);
                        if(rewardList.length > 0) {
                            rtnstr += "\n\n[숙제 퀘스트]\n\n"; 
                            rtnstr += _HomeWorkReward(obj, rewardList);
                        }
                        _Save();
                    }
                }
            }
            return rtnstr;
        },
        Calendar:function(_id) {
            var rtnstr = "", citem, itemDB;
            var d = new Date();
            var calendarDB = m_dbmanager.getAttendanceList();

            if(calendarDB === null) {
                rtnstr = "이 게임은 출석 보상이 존재하지 않습니다.";
            }
            else {
              rtnstr = "[" + (d.getYear() + 1900) + "년 " + (d.getMonth() + 1) + "월 보상 리스트]\n\n";
                for(var i = 0; i < calendarDB.length; ++i) {
                    citem = calendarDB[i];
                    itemDB = m_dbmanager.getItem(citem.kind, citem.index);
                    rtnstr += (i+1) + "일 : " + itemDB.name + ((citem.strength === "" || citem.strength === 0)?"":"+"+citem.strength) + " x " + citem.count +
                              (CalendarManager.isAttendanceForDate(_id, (i+1), d.getMonth(), d.getYear())?"(수령)":"") + "\n";
                }
            }
            return rtnstr;
        },
        InDungeon:function(_id, _memberlist) {
            var objList = [];
            var remainMemberList = [];
            var tmpInfo, CaptainLoc = null, Captain = null, dungeonDB;
            var rtnstr = "", totalstr = "", i;
            var Map;

            for(i = 0; i < _memberlist.length; ++i) {
                tmpInfo = _Find(_memberlist[i]);
                if(tmpInfo === null) {
                    rtnstr = _memberlist[i] + " 라는 유저 정보가 존재하지 않습니다.";
                    return rtnstr;
                }
                objList.push(tmpInfo);
                if(tmpInfo.name === _id) {
                    CaptainLoc = tmpInfo.getLocation();
                    Captain = tmpInfo;
                }
            }

            if(Captain.getIsDungeon("dungeon")) {
                rtnstr = "이미 던전에 진입하였습니다.";
            }
            else {
                if(CaptainLoc.dungeon === "") {
                    rtnstr = "현재위치에서는 던전 진입이 불가능합니다.";
                }
                else {
                    dungeonDB = m_dbmanager.getDungeon(CaptainLoc.dungeon);

                    for(i = 0; i < objList.length; ++i) {
                        tmpInfo = objList[i].getLocation();
                        if(tmpInfo.country !== CaptainLoc.country || tmpInfo.city !== CaptainLoc.city || tmpInfo.dungeon !== CaptainLoc.dungeon) {
                            remainMemberList.push(objList[i].name);
                        }
                    }
        
                    if(remainMemberList.length > 0){
                        rtnstr = "모든 파티원이 던전 입구에 존재하지 않습니다.\n\n [없는 파티원]\n";
                        for(i = 0; i < remainMemberList.length; ++i) {
                            rtnstr += " - " + remainMemberList[i] + "\n";
                        }
                        return rtnstr;
                    }
        
                    if(Captain.isItem(libConst.ITEM_KIND.SUNDRYITEM, dungeonDB.needitem)) {
                        Captain.removeItem(libConst.ITEM_KIND.SUNDRYITEM, dungeonDB.needitem, 1);
                        totalstr += "파티장이 " + m_dbmanager.getItem(libConst.ITEM_KIND.SUNDRYITEM, dungeonDB.needitem).name + "을(를) 1개 소모하여 던전에 진입합니다.\n\n";
                        Map = _MakeDungeonMap(CaptainLoc.dungeon);
        
                        Captain.setDungeonLocation(Map);
                        for(i = 0; i < objList.length; ++i) {
                            objList[i].setIsDungeon(true, "dungeon");
                        }
        
                        totalstr += _MakeDungeonInfo(Map, false);
                        libCommon.replyIDbyArray(_memberlist, totalstr);
                        _Save();
                    }
                    else {
                        rtnstr = "던전에 입장할 아이템이 존재하지 않습니다. 입장 아이템을 확인하시기 바랍니다.\n\n";
                        rtnstr += "던전 진입 아이템 : " + m_dbmanager.getItem(libConst.ITEM_KIND.SUNDRYITEM, dungeonDB.needitem).name;
                    }
                }
            }
            return rtnstr;
        },
        Occupy:function(_id, _memberlist, _isopen) {
            var objList = [];
            var remainMemberList = [];
            var cityDB = null;
            var tmpInfo, CaptainLoc = null, Captain = null, ClanName = "", dungeonDB;
            var rtnstr = "", totalstr = "", i;
            var Map;

            if(_isopen) {
                rtnstr = "비공식 클랜은 점령전에 참여할 수 없습니다.";
            }
            else {
                if(libCommon.OccupyIncludeTime()) {
                    for(i = 0; i < _memberlist.length; ++i) {
                        tmpInfo = _Find(_memberlist[i]);
                        if(tmpInfo === null) {
                            rtnstr = _memberlist[i] + " 라는 유저 정보가 존재하지 않습니다.";
                            return rtnstr;
                        }
                        objList.push(tmpInfo);
                        if(tmpInfo.name === _id) {
                            CaptainLoc = tmpInfo.getLocation();
                            ClanName = tmpInfo.getClanName();
                            Captain = tmpInfo;
                        }
                    }

                    for(i = 0; i < objList.length; ++i) {
                        if(ClanName !== objList[i].getClanName()) {
                            rtnstr = objList[i].name + " 라는 유저는 다른 클랜 소속입니다. 다른 클랜 소속이 있어서 점령전에 참여할 수 없습니다.";
                            return rtnstr;
                        }
                    }
                    cityDB = m_dbmanager.getCity(CaptainLoc.city);
                    if(cityDB !== null && cityDB.occupy === "Y" && CaptainLoc.facility === "" && CaptainLoc.field === "" && CaptainLoc.dungeon === "" && CaptainLoc.home === "") {
                        if(Captain.getIsDungeon("occupy")) {
                            rtnstr = "이미 점령전에 참여중입니다.";
                        }
                        else {
                            dungeonDB = m_dbmanager.getOccupyDungeonbyCity(CaptainLoc.city);

                            for(i = 0; i < objList.length; ++i) {
                                tmpInfo = objList[i].getLocation();
                                if(tmpInfo.country !== CaptainLoc.country || tmpInfo.city !== CaptainLoc.city) {
                                    remainMemberList.push(objList[i].name);
                                }
                            }
                
                            if(remainMemberList.length > 0){
                                rtnstr = "모든 파티원이 점령지에 존재하지 않습니다.\n\n [없는 파티원]\n";
                                for(i = 0; i < remainMemberList.length; ++i) {
                                    rtnstr += " - " + remainMemberList[i] + "\n";
                                }
                                return rtnstr;
                            }

                            if(Captain.isItem(libConst.ITEM_KIND.SUNDRYITEM, dungeonDB.needitem)) {
                                Captain.removeItem(libConst.ITEM_KIND.SUNDRYITEM, dungeonDB.needitem, 1);
                                totalstr += "파티장이 " + m_dbmanager.getItem(libConst.ITEM_KIND.SUNDRYITEM, dungeonDB.needitem).name + "을(를) 1개 소모하여 점령지에 진입합니다.\n\n";
                                Map = _MakeDungeonMap(dungeonDB.index);

                                Captain.setDungeonLocation(Map);
                                for(i = 0; i < objList.length; ++i) {
                                    objList[i].setIsDungeon(true, "occupy");
                                }
                                totalstr += _MakeDungeonInfo(Map, true);
                                libCommon.replyIDbyArray(_memberlist, totalstr);
                                _Save();
                            }
                            else {
                                rtnstr = "점령지에 입장할 아이템이 존재하지 않습니다. 입장 아이템을 확인하시기 바랍니다.\n\n";
                                rtnstr += "점령에 필요한 아이템 : " + m_dbmanager.getItem(libConst.ITEM_KIND.SUNDRYITEM, dungeonDB.needitem).name;
                            }
                        }
                    }
                    else {
                        rtnstr = "점령이 불가능한 지역입니다.";
                    }
                }
                else {
                    rtnstr = "현재 점령할 수 있는 시간이 아닙니다.\n\n 점령 가능시간 : 매주 " + libCommon.getDayText(libConst.OccupyDayofWeek) + "요일 " + libConst.OccupyStartTime + "시에 시작하여 " + libConst.OccupyTime + "분간 진행함.";
                }
            }
            return rtnstr;
        },
        IsDungeon:function(_id, _type) {
            var obj = _Find(_id);
            if (obj !== null && obj.getIsDungeon(_type)) {
                return true;
            }
            return false;
        },
        outDungeon:function(_id) {
            var obj = _Find(_id);
            if (obj !== null) {
                obj.setIsDungeon(false, "all");
            }
        },
        DungeonInfo:function(_id, _captain, _isoccupy) {
            var obj = _Find(_id);
            var captain = _Find(_captain);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(!obj.getIsDungeon((_isoccupy?"occupy":"dungeon"))) {
                    if(_isoccupy) {
                        rtnstr = "점령전 중이 이닙니다.";
                    }
                    else {
                        rtnstr = "던전 진입 상태가 아닙니다.";
                    }
                }
                else {
                    rtnstr += _MakeDungeonInfo(captain.getDungeonLocation(), _isoccupy);
                }
            }
            return rtnstr;
        },
        GiveupDungeon:function(_id, _memberlist, _isoccupy) {
            var objList = [];
            var tmpInfo, Captain = null;
            var rtnstr = "", totalstr = "", i;


            for(i = 0; i < _memberlist.length; ++i) {
                tmpInfo = _Find(_memberlist[i]);

                objList.push(tmpInfo);
                if(tmpInfo.name === _id) {
                    Captain = tmpInfo;
                }
            }

            if(!Captain.getIsDungeon((_isoccupy?"occupy":"dungeon"))) {
                if(_isoccupy) {
                    rtnstr = "점령전 중이 이닙니다.";
                }
                else {
                    rtnstr = "던전 진입 상태가 아닙니다.";
                }
            }
            else {
                Captain.setDungeonLocation(null);
                for(i = 0; i < objList.length; ++i) {
                    objList[i].setIsDungeon(false, "all");
                }

                libCommon.replyIDbyArray(_memberlist, "진행중이었던 " + (_isoccupy?"점령지를":"던전을") + " 포기합니다.");

                _Save();
            }

            return rtnstr;
        },
        FightDungeon:function(_id, _memberlist, _isoccupy, _clanMng) {
            var objList = [];
            var optList = [];
            var lowAPMemberList = [];
            var tmpInfo, Captain = null, CaptainLoc = null, zerohplist = [];
            var rtnstr = "", totalstr = "", i;
            var Map, result = {complate:false};

            for(i = 0; i < _memberlist.length; ++i) {
                tmpInfo = _Find(_memberlist[i]);

                objList.push(tmpInfo);
                if(tmpInfo.name === _id) {
                    Captain = tmpInfo;
                    CaptainLoc = Captain.getLocation();
                }
                optList.push(_FindOption(_memberlist[i]));
            }

            if(!Captain.getIsDungeon((_isoccupy?"occupy":"dungeon"))) {
                if(_isoccupy) {
                    rtnstr = "점령전 중이 이닙니다.";
                }
                else {
                    rtnstr = "던전 진입 상태가 아닙니다.";
                }
            }
            else {
                Map = Captain.getDungeonLocation();
                if(Map === null) {
                    return "파티장이 탈퇴하여 " + (_isoccupy?"점령지":"던전") + " 정보가 사라졌습니다. " + (_isoccupy?"점령지를":"던전을") + " 포기해야합니다.\n\n " + libConst.CommandPrefix + (_isoccupy?"점령지포기":"던전포기");
                }
                if(Map.isClear) {
                    rtnstr = "이미 클리어 된 맵입니다.";
                }
                else {
                    for(i = 0; i < objList.length; ++i) {
                        if(objList[i].getAbility().hp <= 0) {
                            zerohplist.push(objList[i].name);
                        }
                    }
                    if(zerohplist.length <= 0) {
                        var mapInfo = m_dbmanager.getDungeonMap(Map.Index);
                        var needAP = Number(mapInfo.needap) || 0;

                        if (needAP > 0) {
                            for(i = 0; i < objList.length; ++i) {
                                if(objList[i].getAbility().ap < needAP) {
                                    lowAPMemberList.push(objList[i].name);
                                }
                            }
                        }

                        if (lowAPMemberList.length > 0) {
                            totalstr += "AP가 부족한 파티원이 있어 전투를 시작할 수 없습니다.\n";
                            totalstr += "필요 AP: " + needAP + "\n\n";
                            totalstr += "[AP 부족 파티원]\n";
                            for(i = 0; i < lowAPMemberList.length; ++i) {
                                totalstr += " - " + lowAPMemberList[i] + "\n";
                            }
                            libCommon.replyIDbyArray(_memberlist, totalstr);
                            return rtnstr;
                        }
                        else {
                            totalstr += "소모 AP: " + needAP + "\n\n";
                        }


                        totalstr += "[" + (_isoccupy?"점령지":"던전") + " 전투 결과]" + libConst.dummy + "\n\n";
                        totalstr += m_huntSystem.Dungeon(objList, optList, Map, _id, _isoccupy, result);

                        if(_isoccupy) {
                            if(result.complate) {
                                totalstr += "\n\n[점령전 결과]\n";
                                if(!libCommon.OccupyIncludeTime()) {
                                    totalstr += "점령전 시간이 지나 해당 점령지를 점령하지 못하였습니다.\n";
                                }
                                else {
                                    totalstr += "\n" + _clanMng.setConquest(CaptainLoc.country, CaptainLoc.city);
                                }
                            }
                        }

                        if (needAP > 0) {
                            for(i = 0; i < objList.length; ++i) {
                                objList[i].getAbility().ap -= needAP;
                            }
                        }

                        libCommon.replyIDbyArray(_memberlist, totalstr);
                        _Save();
                    }
                    else {
                        totalstr += "Hp가 없는 파티원이 존재하여 전투를 실행할 수 없습니다.\n\n(hp가 0인 파티원 목록)\n";
                        for(i = 0; i < zerohplist.length; ++i) {
                            totalstr += "  - " + zerohplist[i] + "\n";
                        }
                        libCommon.replyIDbyArray(_memberlist, totalstr);
                    }
                }
            }

            return rtnstr;
        },
        MoveDungeon:function(_id, _mapidx, _memberlist, _isoccupy) {
            var obj = _Find(_id);
            var rtnstr = "", totalstr = "";
            var map = null;
            var index = _mapidx - 1;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(!obj.getIsDungeon((_isoccupy?"occupy":"dungeon"))) {
                    if(_isoccupy) {
                        rtnstr = "점령전 중이 이닙니다.";
                    }
                    else {
                        rtnstr = "던전 진입 상태가 아닙니다.";
                    }
                }
                else {
                    map = obj.getDungeonLocation();
                    if(map != null) {
                        if(map.Direction.length > index) {
                            if(map.isClear) {
                                obj.setDungeonLocation(map.Direction[index]);
                                map = obj.getDungeonLocation();
                                totalstr = map.Name + "으로 이동하였습니다.\n\n";
                                totalstr += _MakeDungeonInfo(map, _isoccupy);
                                libCommon.replyIDbyArray(_memberlist, totalstr);
                                _Save();
                            }
                            else {
                                rtnstr = "현재 맵을 클리어해야 이동 가능합니다.";
                            }
                        }
                        else {
                            rtnstr = "없는 던전 맵번호 입니다.";
                        }
                    }
                    else {
                        rtnstr = "맵 정보가 존재 하지 않습니다.";
                    }
                }
            }
            return rtnstr;
        },

        RecoveryAPPoint(_id) {
            var obj = _Find(_id);
            var rtnstr = "", recoveryAp;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                recoveryAp = obj.endAutoAP();
                if(recoveryAp !== null) {
                    obj.RecoveryforNum("ap", recoveryAp);
                    rtnstr = recoveryAp + " 만큼 Ap를 회복하였습니다.\n\n Max 수치를 넘어선 Ap는 버려집니다.";
                    _Save();
                }
                else {
                    rtnstr = "회복할 AP가 없습니다.";
                }
            }
            return rtnstr;
        },

        //[등록]
        EnrollWriter:function(_id) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("작가등록")) {
                    rtnstr = "해당 위치에서 작가등록을 할수 없습니다.";
                    return rtnstr;
                }
                if(obj.getWriter() === "F")
                {
                    obj.setWriter(true);
                    _Save();
                    rtnstr = "작가등록을 완료하였습니다.\n\n!작가 명령어를 통하여 글을 쓸수 있으며, 완성된 글은 사서의 검수가 통과되면 도서관에 글을 등록 할수 있습니다.";
                }
                else rtnstr = "이미 작가 권한을 가지고 있습니다.";

            }
            return rtnstr;
        },
        EnrollSummoner:function(_id, _type) {
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, speciesDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                speciesDB = m_dbmanager.getSpecies(obj.getSpecies());
                if(facilityDB === null || !facilityDB.action.includes("소환사등록")) {
                    rtnstr = "해당 위치에서 소환사등록을 할수 없습니다.";
                    return rtnstr;
                }

                if(!speciesDB.sommontype.includes(_type)) {
                    rtnstr = obj.getSpecies() + " 종족은 " + _ChangeSummonType(_type) + "을 선택할 수 없습니다.";
                    return rtnstr;
                }

                if(obj.getSummonType() === "")
                {
                    obj.setSummonType(_type);
                    _Save();
                    rtnstr = "소환사등록을 완료하였습니다.";
                }
                else rtnstr = "이미 소환사 권한을 가지고 있습니다.";
            }
            return rtnstr;
        },
        TypeChangeSummoner:function(_id, _type) {
            var option;
            var obj = _Find(_id);
            var rtnstr = "", user_loc, facilityDB, speciesDB;
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = m_dbmanager.getFacility(user_loc.facility);
                speciesDB = m_dbmanager.getSpecies(obj.getSpecies());
                if(facilityDB === null || !facilityDB.action.includes("계통변경")) {
                    rtnstr = "해당 위치에서 소환사 계통을 변경할 수 없습니다.";
                    return rtnstr;
                }

                if(!speciesDB.sommontype.includes(_type)) {
                    rtnstr = obj.getSpecies() + " 종족은 " + _ChangeSummonType(_type) + "을 선택할 수 없습니다.";
                    return rtnstr;
                }

                if(obj.getSummonType() !== "")
                {
                    obj.setSummonType(_type);
                    obj.clearSummonSkill();
                    _Save();

                    option = _FindOption(_id);
                    if(option !== null) {
                        option.clearSummonSkillOpt();
                        _SaveOption();
                    }

                    rtnstr = "소환사 계통을 변경 완료하였습니다. 기존에 보유한 소환 스킬은 삭제 됩니다.";
                }
                else rtnstr = "아직 소환사등록이 되지 않았습니다. 소환사 등록 후 사용가능합니다.";
            }
            return rtnstr;
        },

        //[세팅 관련 부분]
        setSkillSetting:function(_id, _type, _slot, _skillname, _percent) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var skillobj = db_Manager.Search(_skillname, "SKILL", "name");
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(skillobj === null) {
                    rtnstr = _skillname + "스킬은 존재 하지 않습니다.";
                }
                else {
                    if(user.isSkill(skillobj.index) === -1){
                        rtnstr = _skillname + "스킬을 보유하고 있지 않습니다.";
                    }
                    else {
                        if(_type === "heal") {
                            if(skillobj.type === "heal") {
                                if(_slot <= libConst.HealSkillSpace) {
                                    obj.removeHealSkillOpt(skillobj.index);
                                    obj.setHealSkillOpt(_slot, skillobj.index, _percent);
                                    rtnstr += "스킬 설정을 완료 하였습니다.";
                                    _SaveOption();
                                }
                                else {
                                    rtnstr += "회복스킬 슬롯 갯수를 넘었습니다.";
                                }
                            }
                            else if(skillobj.type === "revive") {
                                if(_slot <= libConst.HealSkillSpace) {
                                    obj.removeHealSkillOpt(skillobj.index);
                                    obj.setHealSkillOpt(_slot, skillobj.index, 0);
                                    rtnstr += "스킬 설정을 완료 하였습니다.";
                                    _SaveOption();
                                }
                                else {
                                    rtnstr += "회복스킬 슬롯 갯수를 넘었습니다.";
                                }
                            }
                            else {
                                rtnstr += "회복스킬이 아닙니다.";
                            }
                        }
                        else if(_type === "cure") {
                            if(skillobj.type === "remove") {
                                obj.setCureSkillOpt(skillobj.index, _percent);
                                rtnstr += "스킬 설정을 완료 하였습니다.";
                                _SaveOption();
                            }
                            else {
                                rtnstr += "상태이상 회복스킬이 아닙니다.";
                            }
                        }
                        else if(_type === "skill"){
                            if(skillobj.type === "damage") {
                                if(_slot <= libConst.SkillSpace) {
                                    obj.removeAttSkillOpt(skillobj.index);
                                    obj.setAttSkillOpt(_slot, skillobj.index);
                                    rtnstr += "스킬 설정을 완료 하였습니다.";
                                    _SaveOption();
                                }
                                else {
                                    rtnstr += "공격스킬 슬롯 갯수를 넘었습니다.";
                                }
                            }
                            else {
                                rtnstr += "공격스킬이 아닙니다.";
                            }
                        }
                    }
                }
            }
            return rtnstr;
        },
        getSkillSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "", skillopt, i, tmpskl;
            var skilldb = null;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                skillopt = obj.getattSkillOpt();
                rtnstr += "[현재 전투 스킬설정]\n";
                for(i = 0; i < skillopt.length; ++i) {
                    tmpskl = skillopt[i];
                    if(tmpskl !== undefined && tmpskl !== null) {
                        skilldb = db_Manager.getSkill(tmpskl);
                        rtnstr += "   L " + i + " : " + skilldb.name + "\n";
                    }
                }

                rtnstr += "\n[현재 회복 스킬설정]\n";
                skillopt = obj.getHealSkillOpt();
                for(i = 0; i < skillopt.length; ++i) {
                    tmpskl = skillopt[i];
                    if(tmpskl !== undefined && tmpskl !== null) {
                        skilldb = db_Manager.getSkill(tmpskl.index);
                        if(skilldb.type === "revive") {
                            rtnstr += "   L " + i + " : " + skilldb.name + "을(를) 리타이어 된 유닛에게 사용\n";
                        }
                        else if(skilldb.type === "heal") {
                            rtnstr += "   L " + i + " : " + skilldb.name + "을(를) HP " + tmpskl.percent + "% 남았을시 사용\n";
                        }
                    }
                }

                rtnstr += "\n[현재 상태 이상 회복 스킬설정]\n\n";
                skillopt = obj.getCureSkillOpt();
                if(skillopt !== "")
                    rtnstr += "  - 큐어스킬 : " + db_Manager.getSkill(skillopt).name + "\n";

            }
            return rtnstr;
        },
        setSummonSkillSetting:function(_id, _turn, _skillname) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var skillobj = db_Manager.Search(_skillname, "SUMMONSKILL", "name");
            var skilllist, skill;
            var rtnstr = "", totalCnt;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(skillobj === null) {
                    rtnstr = _skillname + "스킬은 존재 하지 않습니다.";
                }
                else {
                    if(user.isSummonSkill(skillobj.index) === -1){
                        rtnstr = _skillname + "스킬을 보유하고 있지 않습니다.";
                    }
                    else {
                        totalCnt = _GetSummonCnt(user.getAbility().friendly, user.getAbility().godevil);
                        obj.addSummonSkillOpt(_turn, skillobj.index);
                        if(totalCnt < obj.getSummonSkillOpt().length) {
                            obj.removeSummonSkillOpt(0);
                            rtnstr += "스킬 설정 갯수를 초과하여 처음 스킬을 제거합니다.\n";
                        }
                        _SaveOption();
                        rtnstr += "소환스킬을 설정하였습니다.";
                    }
                }
            }
            return rtnstr;
        },
        getSummonSkillSetting:function(_id) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var rtnstr = "", totalCnt, skilllist, skill;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                skilllist = obj.getSummonSkillOpt();
                rtnstr += "[현재 전투 스킬설정]\n";
                totalCnt = _GetSummonCnt(user.getAbility().friendly, user.getAbility().godevil);
                rtnstr += "  - 스킬 설정 갯수 : " + skilllist.length + "/" + totalCnt + "\n\n";
                for(var i = 0; i < skilllist.length; ++i) {
                    skill = skilllist[i];
                    rtnstr += "  "+(i+1)+". " + db_Manager.getSummonSkill(skill.index).name + "(" + skill.turn + "턴 후에 소환)\n";
                }
            }
            return rtnstr;
        },
        setPvpSummonSkillSetting:function(_id, _turn, _skillname) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var skillobj = db_Manager.Search(_skillname, "SUMMONSKILL", "name");
            var skilllist, skill;
            var rtnstr = "", totalCnt;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(skillobj === null) {
                    rtnstr = _skillname + "스킬은 존재 하지 않습니다.";
                }
                else {
                    if(user.isSummonSkill(skillobj.index) === -1){
                        rtnstr = _skillname + "스킬을 보유하고 있지 않습니다.";
                    }
                    else {
                        totalCnt = _GetSummonCnt(user.getAbility().friendly, user.getAbility().godevil);
                        obj.addPvpSummonSkillOpt(_turn, skillobj.index);
                        if(totalCnt < obj.getPvpSummonSkillOpt().length) {
                            obj.removePvpSummonSkillOpt(0);
                            rtnstr += "스킬 설정 갯수를 초과하여 처음 스킬을 제거합니다.\n";
                        }
                        _SaveOption();
                        rtnstr += "결장소환스킬을 설정하였습니다.";
                    }
                }
            }
            return rtnstr;
        },
        getPvpSummonSkillSetting:function(_id) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var rtnstr = "", totalCnt, skilllist, skill;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                skilllist = obj.getPvpSummonSkillOpt();
                rtnstr += "[현재 전투 스킬설정]\n";
                totalCnt = _GetSummonCnt(user.getAbility().friendly, user.getAbility().godevil);
                rtnstr += "  - 스킬 설정 갯수 : " + skilllist.length + "/" + totalCnt + "\n\n";
                for(var i = 0; i < skilllist.length; ++i) {
                    skill = skilllist[i];
                    rtnstr += "  "+(i+1)+". " + db_Manager.getSummonSkill(skill.index).name + "(" + skill.turn + "턴 후에 소환)\n";
                }
            }
            return rtnstr;
        },
        setPvpSkillSetting:function(_id, _slot, _skillname) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var skillobj = db_Manager.Search(_skillname, "SKILL", "name");
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(skillobj === null) {
                    rtnstr = _skillname + "스킬은 존재 하지 않습니다.";
                }
                else {
                    if(user.isSkill(skillobj.index) === -1){
                        rtnstr = _skillname + "스킬을 보유하고 있지 않습니다.";
                    }
                    else {
                        if(skillobj.type === "damage"){
                            if(_slot <= libConst.SkillSpace) {
                                obj.removePvpAttSkillOpt(skillobj.index);
                                obj.setPvpAttSkillOpt(_slot, skillobj.index);
                                rtnstr += "스킬 설정을 완료 하였습니다.";
                                _SaveOption();
                            }
                            else {
                                rtnstr += "공격스킬 슬롯 갯수를 넘었습니다.";
                            }
                        }
                        else {
                            rtnstr = _skillname + "공격스킬이 아닙니다.";
                        }
                    }
                }
            }
            return rtnstr;
        },
        getPvpSkillSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "", skillopt, i, tmpskl;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                skillopt = obj.getPvpAttSkillOpt();
                rtnstr += "[현재 유저 설정정보]\n";
                for(i = 0; i < skillopt.length; ++i) {
                    tmpskl = skillopt[i];
                    if(tmpskl !== undefined && tmpskl !== null) {
                        rtnstr += "   L " + i + " : " + db_Manager.getSkill(tmpskl).name + "\n";
                    }
                }
            }
            return rtnstr;
        },
        setPotionSetting:function(_id, _percent, _itemname, _type) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var itemobj = db_Manager.Search(_itemname, "FUNCTIONALITYITEM", "name");
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(itemobj === null) {
                    rtnstr = _itemname + "은 존재 하지 않습니다.";
                }
                else {
                    if(user.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, itemobj.index)) {
                        if(itemobj.effect === _type) {
                            if(_type === "ap") {
                                obj.setApOpt(itemobj.index);
                            }
                            else {
                                obj.setpotionOpt(_type, itemobj.index, _percent);
                            }
                            rtnstr += "포션 설정을 완료 하였습니다.";
                            _SaveOption();
                        }
                        else {
                            rtnstr = _itemname + "은(는) " + _type + " 타입이 아닙니다.";
                        }
                    }
                    else {
                        rtnstr = _itemname + "을 보유하고 있지 않습니다.";
                    }

                }
            }
            return rtnstr;
        },
        getPotionSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "", option;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                option = obj.getpotionOpt();
                rtnstr += "[현재 유저 설정정보]\n\n";
                if(option.hp.index !== "")
                    rtnstr += "  - HP포션 설정정보 : " + db_Manager.getFunctionalityItem(option.hp.index).name + "(을)를 HP " + option.hp.percent + "% 남았을시 사용\n";
                if(option.mp.index !== "")
                    rtnstr += "  - MP포션 설정정보 : " + db_Manager.getFunctionalityItem(option.mp.index).name + "(을)를 MP " + option.mp.percent + "% 남았을시 사용\n";
                if(option.sp.index !== "")
                    rtnstr += "  - SP포션 설정정보 : " + db_Manager.getFunctionalityItem(option.sp.index).name + "(을)를 SP " + option.sp.percent + "% 남았을시 사용\n";
                if(option.dp.index !== "")
                    rtnstr += "  - DP포션 설정정보 : " + db_Manager.getFunctionalityItem(option.dp.index).name + "(을)를 DP " + option.dp.percent + "% 남았을시 사용\n";
            }
            return rtnstr;
        },
        getAPPotionSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "", option;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                option = obj.getApOpt();
                rtnstr += "[현재 유저 설정정보]\n\n";
                if(option !== "")
                    rtnstr += "  - AP포션 설정정보 : " + db_Manager.getFunctionalityItem(option).name + "(을)를 행동력이 없을시 사용\n";
            }
            return rtnstr;
        },
        setCampingSetting:function(_id, _itemname) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var itemobj = db_Manager.Search(_itemname, "FUNCTIONALITYITEM", "name");
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(itemobj === null) {
                    rtnstr = _itemname + "은 존재 하지 않습니다.";
                }
                else {
                    if(user.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, itemobj.index)) {
                        if(itemobj.kind === "camping") {
                            obj.setCampingEquOpt(itemobj.index);
                            rtnstr += "캠핑장비 설정이 완료되었습니다.";
                            _SaveOption();
                        }
                        else {
                            rtnstr = _itemname + "은(는) 캠핑장비가 아닙니다.";
                        }
                    }
                    else {
                        rtnstr = _itemname + "을 보유하고 있지 않습니다.";
                    }
                }
            }
            return rtnstr;
        },
        setCampingFoodSetting:function(_id, _itemname) {
            var obj = _FindOption(_id);
            var user = _Find(_id);
            var itemobj = db_Manager.Search(_itemname, "FUNCTIONALITYITEM", "name");
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(itemobj === null) {
                    rtnstr = _itemname + "은 존재 하지 않습니다.";
                }
                else {
                    if(user.isItem(libConst.ITEM_KIND.FUNCTIONALITYITEM, itemobj.index)) {
                        if(itemobj.effect === "ap") {
                            obj.setCampingFood(itemobj.index);
                            rtnstr += "캠핑음식 설정이 완료되었습니다.";
                            _SaveOption();
                        }
                        else {
                            rtnstr = _itemname + "은(는) 캠핑음식이 아닙니다.";
                        }
                    }
                    else {
                        rtnstr = _itemname + "을 보유하고 있지 않습니다.";
                    }
                }
            }
            return rtnstr;
        },
        getCampingSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "", campingopt;
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                campingopt = obj.getCampingOpt();
                rtnstr += "[현재 유저 설정정보]\n\n";
                if(campingopt.equipment !== "")
                    rtnstr += "  - 캠핑장비 설정정보 : " + db_Manager.getFunctionalityItem(campingopt.equipment).name + "을(를) 장비함\n";
                if(campingopt.food !== "")
                    rtnstr += "  - 캠핑음식 설정정보 : " + db_Manager.getFunctionalityItem(campingopt.food).name + "을(를) 설정함\n";
            }
            return rtnstr;
        },
        setPrivateSetting:function(_id, _YN) {
            var obj = _FindOption(_id);

            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(_YN) {
                    obj.onPrivateOpt();
                    rtnstr = "개인 정보에 대한 열람을 차단합니다.";
                }
                else {
                    obj.offPrivateOpt();
                    rtnstr = "개인 정보에 대한 열람을 허용합니다.";
                }
                _SaveOption();
            }
            return rtnstr;
        },
        getPrivateSetting:function(_id) {
            var obj = _FindOption(_id);
            var info;
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                info = obj.getPrivateOpt();
                rtnstr = "개인정보 상태 : " + (info === "N"?"조회 가능":"조회 불가");
            }
            return rtnstr;
        },
        setHuntingSetting:function(_id, _YN) {
            var obj = _FindOption(_id);

            var rtnstr = "q";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                if(_YN) {
                    obj.onHuntingOpt();
                    rtnstr = "전투로그를 전부 표시합니다.";

                }
                else {
                    obj.offHuntingOpt();
                    rtnstr = "전투로그를 간소화 합니다.";
                }
                _SaveOption();
            }
            return rtnstr;
        },
        getHuntingSetting:function(_id) {
            var obj = _FindOption(_id);
            var info;
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                info = obj.getHuntingOpt();
                rtnstr = "전투로그 옵션 : " + (info === "Y"?"전체 전투로그":"전투로그 간소화");
            }
            return rtnstr;
        },
        removeSkillSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                obj.resetAttSkillOpt();
                obj.resetHealSkillOpt();
                obj.setCureSkillOpt("");
                rtnstr = "스킬설정을 제거하였습니다.";
                _SaveOption();
            }
            return rtnstr;
        },
        removeSummonSkillSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                obj.clearSummonSkillOpt();
                rtnstr = "소환 스킬설정을 제거하였습니다.";
                _SaveOption();
            }
            return rtnstr;
        },
        removePvpSummonSkillSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                obj.clearPvpSummonSkillOpt();
                rtnstr = "소환 스킬설정을 제거하였습니다.";
                _SaveOption();
            }
            return rtnstr;
        },
        removePvpSkillSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                obj.resetPvpAttSkillOpt();
                rtnstr = "결장설정을 제거하였습니다.";
                _SaveOption();
            }
            return rtnstr;
        },
        removePotionSetting:function(_id) {
            var obj = _FindOption(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 설정정보가 없습니다.";
            }
            else {
                obj.setpotionOpt("hp", "", "");
                obj.setpotionOpt("mp", "", "");
                obj.setpotionOpt("sp", "", "");
                obj.setpotionOpt("dp", "", "");
                obj.setApOpt("");
                rtnstr = "포션설정을 제거하였습니다.";
                _SaveOption();
            }
            return rtnstr;
        },
        settingMercenary:function(_id, _arridx, _use) {
            var obj = _Find(_id);
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(MercenaryManager.setUse(_id, _arridx, _use)) {
                    rtnstr = "해당 용병의 출전 여부를 변경했습니다.";
                }
                else {
                    rtnstr = "해당 용병의 출전 여부를 정할수 없습니다. 용병 인덱스 범위를 확인하시기 바랍니다.";
                }
            }
            return rtnstr;
        },

        //[외부 함수]
        findUser:function(_id) {
            return _Find(_id);
        },
        findOption:function(_id) {
            return _FindOption(_id);
        },
        SaveUser:function() {
            _Save();
        },
        isWriter:function(_id) {
            var user = _Find(_id);
            if(user === null)
                return false;
            return (user.getWriter() === "T"?true:false);
        },
        isSummoner:function(_id) {
            var user = _Find(_id);
            if(user === null)
                return "";
            return user.getSummonType();
        },
        getCharactorList:function(_kind) {
            var character, option;
            var rtnAry = [];
            for (var i = 0; i < m_charactorList.length; ++i) {
                character = m_charactorList[i];
                option = _FindOption(character.name);
                if(character.getSpecies() !== "") {
                    switch(_kind) {
                        case "user":
                            rtnAry.push({name:character.name, species:character.getSpecies()});
                            break;
                        case "hp":
                            rtnAry.push({name:character.name, hp:character.getMaxPoint("hp"), private:option.getPrivateOpt()});
                            break;
                        case "mp":
                            rtnAry.push({name:character.name, mp:character.getMaxPoint("mp"), private:option.getPrivateOpt()});
                            break;
                        case "sp":
                            rtnAry.push({name:character.name, sp:character.getMaxPoint("sp"), private:option.getPrivateOpt()});
                            break;
                        case "dp":
                            rtnAry.push({name:character.name, dp:character.getMaxPoint("dp"), private:option.getPrivateOpt()});
                            break;
                        case "ap":
                            rtnAry.push({name:character.name, ap:character.getMaxPoint("ap"), private:option.getPrivateOpt()});
                            break;
                        case "rune":
                            rtnAry.push({name:character.name, rune:character.getRune(), private:option.getPrivateOpt()});
                            break;
                        default:
                            rtnAry.push({name:character.name, ability:character.getAbility(), vitality:character.getVitality(), private:option.getPrivateOpt()});
                            break;
                    }
                }
            }
            return rtnAry;
        },
        activeAccount:function(_account) {
            if(_account.character !== null){
                m_charactorList.push(libObject.clsCharactor(_account.character, libObject.ENUM_MAKE_CHARACTOR.COMPLITE, 0));
                _Save();
            }
            if(_account.option !== null){
                m_charOptionList.push(libObject.clsUserOption(_account.option));
                _SaveOption();
            }
            if(_account.record !== null){
                RecordManager.activeRecord(_account.record);
            }
            if(_account.pet !== null){
                PetManager.activePet(_account.pet);
            }
            if(_account.mercenary !== null){
                MercenaryManager.activeMercenary(_account.mercenary);
            }
            if(_account.explorer !== null){
                ExplorerManager.activeExplorer(_account.explorer);
            }
            if(_account.myhome !== null){
                MyHomeManager.activeMyHome(_account.myhome);
            }
        },
        

        //[Master 함수]
        collectionRune:function(_id, _rune) {
            var obj = _Find(_id);
            var rtnstr = "", currRune, rune = Number(_rune);
            var msg = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                currRune = obj.getRune();

                if(currRune >= rune) {
                    rtnstr = obj.name + "에게 " + rune + "rune을 회수하였습니다.";
                    obj.addRune(-rune);
                }
                else {
                    rtnstr = obj.name + "에게 " + rune + "만큼 Rune을 보유하고 있지 않습니다.";
                    rtnstr += obj.name + "에게 룬을 전부 회수하였습니다.";
                    obj.addRune(-currRune);
                }
                msg += "운영자가 룬을 회수합니다.\n\n";
                msg += "  - 회수된 룬 금액 : " + rune + "Rune";
                libCommon.replyID(_id, msg);

                _Save();
            }
            return rtnstr;
        },
        collectionItem:function(_id, _item, _count) {
            var obj = _Find(_id);
            var spl_item = _item.split("+");
            var itemname, itemlevel, targetItem;
            var invenCnt = 0, totalCnt = Number(_count);
            var msg = "운영자가 아이템을 회수합니다.\n\n";
            var rtnstr = "";
            if (obj === null) {
                rtnstr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(spl_item.length > 1)
                    itemlevel = spl_item[1];
                else
                    itemlevel = "0";
                itemname = spl_item[0];
            }

            targetItem = db_Manager.getItemByName(itemname);

            if(targetItem.obj === null) {
                rtnstr = "존재하지 않는 아이템 입니다.";
            }
            else {
                invenCnt = obj.getItemCount(targetItem.kind, targetItem.obj.index, Number(itemlevel));
                if(invenCnt === 0) {
                    rtnstr += _id + " 유저의 인벤토리에는 해당 아이템을 가지고 있지 않습니다.\n";
                }
                else if(invenCnt >= totalCnt) {
                    obj.removeItem(targetItem.kind, targetItem.obj.index, totalCnt, Number(itemlevel));
                    rtnstr += _id + " 유저의 인벤토리에서 해당 아이템을 " + totalCnt + "개 회수합니다.\n";
                    msg += _id + " 유저의 인벤토리에서 해당 아이템을 " + totalCnt + "개 회수합니다.\n";
                    totalCnt = 0;
                }
                else {
                    obj.removeItem(targetItem.kind, targetItem.obj.index, invenCnt, Number(itemlevel));
                    rtnstr += _id + " 유저는 해당 아이템을 " + invenCnt + "개를 가지고 있습니다. 전부 회수합니다.\n";
                    msg += _id + " 유저는 해당 아이템을 " + invenCnt + "개를 가지고 있습니다. 전부 회수합니다.\n";
                    totalCnt -= invenCnt;
                }
                _Save();
                
                rtnstr += "\n";
                if(PetManager.isPet(_id)) {
                    invenCnt = PetManager.getItemCount(_id, targetItem.kind, targetItem.obj.index, Number(itemlevel));

                    if(invenCnt === 0) {
                        rtnstr += _id + " 유저의 펫 창고에는 해당 아이템을 가지고 있지 않습니다.\n";
                    }
                    else if(invenCnt >= totalCnt) {
                        if(totalCnt !== 0) {
                            PetManager.PopItem(_id, targetItem.kind, targetItem.obj.index, totalCnt, Number(itemlevel));
                            rtnstr += _id + " 유저의 펫 창고에서 해당 아이템을 " + totalCnt + "개 회수합니다.\n";
                            msg += _id + " 유저의 펫 창고에서 해당 아이템을 " + totalCnt + "개 회수합니다.\n";
                            totalCnt = 0;
                        }
                    }
                    else {
                        PetManager.PopItem(_id, targetItem.kind, targetItem.obj.index, invenCnt, Number(itemlevel));
                        rtnstr += _id + " 유저의 펫 창고에 해당 아이템을 " + invenCnt + "개를 가지고 있습니다. 전부 회수합니다.\n";
                        msg += _id + " 유저의 펫 창고에 해당 아이템을 " + invenCnt + "개를 가지고 있습니다. 전부 회수합니다.\n";
                        totalCnt -= invenCnt;
                    } 
                }
                else {
                    rtnstr += _id + " 유저는 펫을 소유하고 있지 않습니다.\n";
                }

                rtnstr += "\n";
                if(MyHomeManager.isMyHome(_id)) {
                    invenCnt = MyHomeManager.getItemCount(_id, targetItem.kind, targetItem.obj.index, Number(itemlevel));

                    if(invenCnt === 0) {
                        rtnstr += _id + " 유저의 마이홈 창고에는 해당 아이템을 가지고 있지 않습니다.\n";
                    }
                    else if(invenCnt >= totalCnt) {
                        if(totalCnt !== 0) {
                            MyHomeManager.PopItem(_id, targetItem.kind, targetItem.obj.index, totalCnt, Number(itemlevel));
                            rtnstr += _id + " 유저의 마이홈 창고에서 해당 아이템을 " + totalCnt + "개 회수합니다.\n";
                            msg += _id + " 유저의 마이홈 창고에서 해당 아이템을 " + totalCnt + "개 회수합니다.\n";
                            totalCnt = 0;
                        }
                    }
                    else {
                        MyHomeManager.PopItem(_id, targetItem.kind, targetItem.obj.index, invenCnt, Number(itemlevel));
                        rtnstr += _id + " 유저의 마이홈 창고에 해당 아이템을 " + invenCnt + "개를 가지고 있습니다. 전부 회수합니다.\n";
                        msg += _id + " 유저의 마이홈 창고에 해당 아이템을 " + invenCnt + "개를 가지고 있습니다. 전부 회수합니다.\n";
                        totalCnt -= invenCnt;
                    } 
                }
                else {
                    rtnstr += _id + " 유저는 마이홈을 소유하고 있지 않습니다.\n";
                }
                libCommon.replyID(_id, msg);
            }
            return rtnstr;
        }
    };
}
