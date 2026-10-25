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

function DBManager() {
    var DB = {};
    var DUMP = {};

    var _LoadData, _CopyDB, _Find, _Find2Condition, _Find3Condition, _Find4Condition, _FindList, _FindListForIndex, _FindList2Condition, _FindPersonList, _FindMenufacture, _FindHighMenufacture, _FindSale, _FindDropItemForMonster, _FindAnalyzeByFunItem, _FindFieldsByMonster, _FindQuestinCity, _FindFishing, _FindUnderSpecies, _Dic, _DicList;

    _LoadData = function() {
        DB.SPECIES = function() { return libCommon.read(libConst.DBNameList["Species"]);};
        DB.WEARITEM = function() { return libCommon.read(libConst.DBNameList["WearItem"]);};
        DB.SUNDRYITEM = function() { return libCommon.read(libConst.DBNameList["SundryItem"]);};
        DB.FUNCTIONALITYITEM = function() { return libCommon.read(libConst.DBNameList["FunctionalityItem"]);};
        DB.MONSTER = function() { return libCommon.read(libConst.DBNameList["Monster"]);};
        DB.NATION = function() { return libCommon.read(libConst.DBNameList["Nation"]);};
        DB.CITY = function() { return libCommon.read(libConst.DBNameList["City"]);};
        DB.FACILITY = function() { return libCommon.read(libConst.DBNameList["Facility"]);};
        DB.FIELD = function() { return libCommon.read(libConst.DBNameList["Field"]);};
        DB.DUNGEON = function() { return libCommon.read(libConst.DBNameList["Dungeon"]);};
        DB.DUNGEONMAP = function() { return libCommon.read(libConst.DBNameList["DungeonMap"]);};
        DB.SKILL = function() { return libCommon.read(libConst.DBNameList["Skill"]);};
        DB.MENUFACTURE = function() { return libCommon.read(libConst.DBNameList["Menufacture"]);};
        DB.HIGHMENUFACTURE = function() { return libCommon.read(libConst.DBNameList["HighMenufacture"]);};
        DB.SALE = function() { return libCommon.read(libConst.DBNameList["Sale"]);};
        DB.SKILLSALE = function() { return libCommon.read(libConst.DBNameList["Skillsale"]);};
        DB.CC = function() { return libCommon.read(libConst.DBNameList["Cc"]);};
        DB.MERCENARY = function() { return libCommon.read(libConst.DBNameList["Mercenary"]);};
        DB.HIRE = function() { return libCommon.read(libConst.DBNameList["Hire"]);};
        DB.PROPERTY = function() { return libCommon.read(libConst.DBNameList["Property"]);};
        DB.WORLDBOSS = function() { return libCommon.read(libConst.DBNameList["WorldBoss"]);};
        DB.WORLDBOSSLOC = function() { return libCommon.read(libConst.DBNameList["WorldBossLoc"]);};
        DB.MINE = function() { return libCommon.read(libConst.DBNameList["Mine"]);};
        DB.ANALYZE = function() { return libCommon.read(libConst.DBNameList["Analyze"]);};
        DB.PERSON = function() { return libCommon.read(libConst.DBNameList["Person"]);};
        DB.QUEST = function() { return libCommon.read(libConst.DBNameList["Quest"]);};
        DB.CONVERSATION = function() { return libCommon.read(libConst.DBNameList["Conversation"]);};
        DB.CLANBUFF = function() { return libCommon.read(libConst.DBNameList["ClanBuff"]);};
        DB.NATIONMOVE = function() { return libCommon.read(libConst.DBNameList["NationMove"]);};
        DB.LOAN = function() { return libCommon.read(libConst.DBNameList["Loan"]);};
        DB.DEPOSIT = function() { return libCommon.read(libConst.DBNameList["Deposit"]);};
        DB.CAMPING = function() { return libCommon.read(libConst.DBNameList["Camping"]);};
        DB.ALCHEMY = function() { return libCommon.read(libConst.DBNameList["Alchemy"]);};
        DB.ORIGINCHAR = function() { return libCommon.read(libConst.DBNameList["OriginChar"]);};
        DB.EXCHANGE = function() { return libCommon.read(libConst.DBNameList["Exchange"]);};
        DB.BATTLEBUFF = function() { return libCommon.read(libConst.DBNameList["BattleBuff"]);};
        DB.STRENGTH = function() { return libCommon.read(libConst.DBNameList["Strength"]);};
        DB.STRENGTHLIST = function() { return libCommon.read(libConst.DBNameList["StrengthList"]);};
        DB.DECOMPOSE = function() { return libCommon.read(libConst.DBNameList["Decompose"]);};
        DB.PETFAMILY = function() { return libCommon.read(libConst.DBNameList["PetFamily"]);};
        DB.PETBUFF = function() { return libCommon.read(libConst.DBNameList["PetBuff"]);};
        DB.TOWER = function() { return libCommon.read(libConst.DBNameList["Tower"]);};
        DB.TOWERMOB = function() { return libCommon.read(libConst.DBNameList["TowerMob"]);};
        DB.TREE = function() { return libCommon.read(libConst.DBNameList["Tree"]);};
        DB.STONE = function() { return libCommon.read(libConst.DBNameList["Stone"]);};
        DB.GETTING = function() { return libCommon.read(libConst.DBNameList["Getting"]);};
        DB.BUILDING = function() { return libCommon.read(libConst.DBNameList["Building"]);};
        DB.REQUEST = function() { return libCommon.read(libConst.DBNameList["Request"]);};
        DB.RECIPE = function() { return libCommon.read(libConst.DBNameList["Recipe"]);};
        DB.FISH = function() { return libCommon.read(libConst.DBNameList["Fish"]);};
        DB.FISHING = function() { return libCommon.read(libConst.DBNameList["Fishing"]);};
        DB.SALECOIN = function() { return libCommon.read(libConst.DBNameList["SaleCoin"]);};
        DB.ATTENDANCE = function() { return libCommon.read(libConst.DBNameList["Attendance"]);};
        DB.SUMMONSKILL = function() { return libCommon.read(libConst.DBNameList["SummonSkill"]);};
        DB.SUMMONMONSTER = function() { return libCommon.read(libConst.DBNameList["SummonMonster"]);};
        DB.SUMMONSALE = function() { return libCommon.read(libConst.DBNameList["Summonsale"]);};
        DB.SALECAPITAL = function() { return libCommon.read(libConst.DBNameList["SaleCapital"]);};
        DB.STOCK = function() { return libCommon.read(libConst.DBNameList["Stock"]);};
        DB.NEWS = function() { return libCommon.read(libConst.DBNameList["News"]);};
        DB.RANDBOX = function() { return libCommon.read(libConst.DBNameList["RandBox"]);};
        DB.TUTORIAL = function() { return libCommon.read(libConst.DBNameList["Tutorial"]);};
        DB.PACKAGE = function() { return libCommon.read(libConst.DBNameList["Package"]);};
        DB.HOMEWORK = function() { return libCommon.read(libConst.DBNameList["Homework"]);};

        DUMP.SPECIES = new libCommon.DumpModule();
        DUMP.WEARITEM = new libCommon.DumpModule();
        DUMP.SUNDRYITEM = new libCommon.DumpModule();
        DUMP.FUNCTIONALITYITEM = new libCommon.DumpModule();
        DUMP.MONSTER = new libCommon.DumpModule();
        DUMP.NATION = new libCommon.DumpModule();
        DUMP.CITY = new libCommon.DumpModule();
        DUMP.FACILITY = new libCommon.DumpModule();
        DUMP.FIELD = new libCommon.DumpModule();
        DUMP.DUNGEON = new libCommon.DumpModule();
        DUMP.DUNGEONMAP = new libCommon.DumpModule();
        DUMP.SKILL = new libCommon.DumpModule();
        DUMP.MENUFACTURE = new libCommon.DumpModule();
        DUMP.HIGHMENUFACTURE = new libCommon.DumpModule();
        DUMP.SALE = new libCommon.DumpModule();
        DUMP.SKILLSALE = new libCommon.DumpModule();
        DUMP.CC = new libCommon.DumpModule();
        DUMP.MERCENARY = new libCommon.DumpModule();
        DUMP.HIRE = new libCommon.DumpModule();
        DUMP.PROPERTY = new libCommon.DumpModule();
        DUMP.WORLDBOSS = new libCommon.DumpModule();
        DUMP.WORLDBOSSLOC = new libCommon.DumpModule();
        DUMP.MINE = new libCommon.DumpModule();
        DUMP.ANALYZE = new libCommon.DumpModule();
        DUMP.PERSON = new libCommon.DumpModule();
        DUMP.QUEST = new libCommon.DumpModule();
        DUMP.CONVERSATION = new libCommon.DumpModule();
        DUMP.CLANBUFF = new libCommon.DumpModule();
        DUMP.NATIONMOVE = new libCommon.DumpModule();
        DUMP.LOAN = new libCommon.DumpModule();
        DUMP.DEPOSIT = new libCommon.DumpModule();
        DUMP.CAMPING = new libCommon.DumpModule();
        DUMP.ALCHEMY = new libCommon.DumpModule();
        DUMP.ORIGINCHAR = new libCommon.DumpModule();
        DUMP.EXCHANGE = new libCommon.DumpModule();
        DUMP.BATTLEBUFF = new libCommon.DumpModule();
        DUMP.STRENGTH = new libCommon.DumpModule();
        DUMP.STRENGTHLIST = new libCommon.DumpModule();
        DUMP.DECOMPOSE = new libCommon.DumpModule();
        DUMP.PETFAMILY = new libCommon.DumpModule();
        DUMP.PETBUFF = new libCommon.DumpModule();
        DUMP.TOWER = new libCommon.DumpModule();
        DUMP.TOWERMOB = new libCommon.DumpModule();
        DUMP.TREE = new libCommon.DumpModule();
        DUMP.STONE = new libCommon.DumpModule();
        DUMP.GETTING = new libCommon.DumpModule();
        DUMP.BUILDING = new libCommon.DumpModule();
        DUMP.REQUEST = new libCommon.DumpModule();
        DUMP.RECIPE = new libCommon.DumpModule();
        DUMP.FISH = new libCommon.DumpModule();
        DUMP.FISHING = new libCommon.DumpModule();
        DUMP.SALECOIN = new libCommon.DumpModule();
        DUMP.ATTENDANCE = new libCommon.DumpModule();
        DUMP.SUMMONSKILL = new libCommon.DumpModule();
        DUMP.SUMMONMONSTER = new libCommon.DumpModule();
        DUMP.SUMMONSALE = new libCommon.DumpModule();
        DUMP.SALECAPITAL = new libCommon.DumpModule();
        DUMP.STOCK = new libCommon.DumpModule();
        DUMP.NEWS = new libCommon.DumpModule();
        DUMP.RANDBOX = new libCommon.DumpModule();
        DUMP.TUTORIAL = new libCommon.DumpModule();
        DUMP.PACKAGE = new libCommon.DumpModule();
        DUMP.HOMEWORK = new libCommon.DumpModule();
    }();

    _CopyDB = function(_object) {
        return JSON.parse(JSON.stringify(_object));
    };
    _Find = function(_table, _colume, _compare) {
        var infos = DUMP[_table].dumpList;
        var i;
        for(i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare) {
                DUMP[_table].resetTimeStemp(i);
                return infos[i];
            }
        }
        infos = DB[_table]();
        for(i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare) {
                DUMP[_table].addDump(infos[i]);
                return infos[i];
            }
        }
        return null;
    };
    _Find2Condition = function(_table, _colume, _compare, _colume2, _compare2) {
        var infos = DUMP[_table].dumpList;
        var i;
        for(i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare && infos[i][_colume2] === _compare2) {
                DUMP[_table].resetTimeStemp(i);
                return infos[i];
            }
        }
        infos = DB[_table]();
        for(i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare && infos[i][_colume2] === _compare2) {
                DUMP[_table].addDump(infos[i]);
                return infos[i];
            }
        }
        return null;
    };
    _Find3Condition = function(_table, _colume, _compare, _colume2, _compare2, _colume3, _compare3) {
        var infos = DUMP[_table].dumpList;
        var i;
        for(i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare && infos[i][_colume2] === _compare2 && infos[i][_colume3] === _compare3) {
                DUMP[_table].resetTimeStemp(i);
                return infos[i];
            }
        }
        infos = DB[_table]();
        for(i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare && infos[i][_colume2] === _compare2 && infos[i][_colume3] === _compare3) {
                DUMP[_table].addDump(infos[i]);
                return infos[i];
            }
        }
        return null;
    };
    _Find4Condition = function(_table, _colume, _compare, _colume2, _compare2, _colume3, _compare3, _colume4, _compare4) {
        var infos = DUMP[_table].dumpList;
        var i;
        for(i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare && infos[i][_colume2] === _compare2 && infos[i][_colume3] === _compare3 && infos[i][_colume4] === _compare4) {
                DUMP[_table].resetTimeStemp(i);
                return infos[i];
            }
        }
        infos = DB[_table]();
        for(i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare && infos[i][_colume2] === _compare2 && infos[i][_colume3] === _compare3 && infos[i][_colume4] === _compare4) {
                DUMP[_table].addDump(infos[i]);
                return infos[i];
            }
        }
        return null;
    };
    _FindList = function(_table, _city, _facility, _kind) {
        var infos = DB[_table]();
        var list = [];

        for(var i = 0; i < infos.length; ++i) {
            if(infos[i]["city"] === _city && (_facility === "all"?true:infos[i]["facility"] === _facility) && (_kind === "all"?true:infos[i]["itemkind"] === _kind)) {
                list.push(infos[i]);
            }
        }
        return list;
    };
    _FindListForIndex = function(_table, _colume, _compare) {
      var infos = DB[_table]();
      var list = [];
      for(var i = 0; i < infos.length; ++i) {
          if(infos[i][_colume] === _compare) {
              list.push(infos[i]);
          }
      }
      return list;
    };
    _FindList2Condition = function(_table, _colume, _compare, _colume2, _compare2) {
        var infos = DB[_table]();
        var list = [];
        for(var i = 0; i < infos.length; ++i) {
            if(infos[i][_colume] === _compare && infos[i][_colume2] === _compare2) {
                list.push(infos[i]);
            }
        }
        return list;
    };
    _FindPersonList = function(_nation, _city, _facility, _type, _name) {
        var infos = DB.PERSON();
        var list = [];

        for(var i = 0; i < infos.length; ++i) {
            if(infos[i]["nation"] === _nation && infos[i]["city"] === _city && infos[i]["facility"] === _facility && (_type === "all"?true:infos[i]["type"] === _type) && (_name === "all"?true:infos[i]["character"] === _name)) {
                list.push(infos[i]);
            }
        }
        return list;
    };
    _FindMenufacture = function(_index, _kind) {
        var infos = DB.MENUFACTURE();
        var obj;

        for(var i = 0; i < infos.length; ++i) {
            if(infos[i]["index"] === _index && infos[i]["itemkind"] === _kind) {
                return infos[i];
            }
        }
        return null;
    };
    _FindHighMenufacture = function(_index, _kind) {
        var infos = DB.HIGHMENUFACTURE();
        var obj;

        for(var i = 0; i < infos.length; ++i) {
            if(infos[i]["index"] === _index && infos[i]["itemkind"] === _kind) {
                return infos[i];
            }
        }
        return null;
    };
    _FindSale = function(_index, _kind) {
        var rtnArray = [];
        var infos = DB.SALE();

        for(var i = 0; i < infos.length; ++i) {
            if(infos[i]["item"] === _index && infos[i]["itemkind"] === _kind) {
                rtnArray.push(infos[i]);
            }
        }
        return rtnArray;
    };
    _FindAnalyzeByFunItem = function(_index) {
        var infos = DB.ANALYZE();
        var obj;

        for(var i = 0; i < infos.length; ++i) {
            if(infos[i]["functionalyindex"] === _index) {
                return infos[i];
            }
        }
        return null;
    };
    _FindDropItemForMonster = function(_index) {
        var rtnArray = [];
        var infos = DB.MONSTER();
        var dropitems = null;

        for(var i = 0; i < infos.length; ++i) {
            dropitems = infos[i].dropItem;
            for(var j = 0; j < dropitems.length; ++j) {
                if(dropitems[j].itemIdx === _index) {
                    rtnArray.push(infos[i].name);
                }
            }
        }
        return rtnArray;
    };
    _FindFieldsByMonster = function(_index) {
        var rtnArray = [];
        var infos = DB.FIELD();

        for(var i = 0; i < infos.length; ++i) {
            if(infos[i].monster.indexOf(_index) !== -1){
                rtnArray.push(infos[i]);
            }
            else if(infos[i].boss === _index) {
                rtnArray.push(infos[i]);
            }
        }
        return rtnArray;
    };
    _FindQuestinCity = function(_city, _facility) {
        var personList = _FindList("PERSON", _city, _facility, "all");
        var conversation = DB["CONVERSATION"]();
        var list = [];

        for(var i = 0; i < conversation.length; ++i) {
            if(conversation[i].type === "quest") {
                for(var j = 0; j < personList.length; ++j) {
                    if(personList[j].index === conversation[i].characterindex){
                        list.push({person:personList[j], conversation:conversation[i]});
                        break;
                    }
                }
            }
        }
        return list;
    };

    _FindFishing = function(_fish, _kind) {
        var fishing = DB["FISHING"]();
        var list = [];

        for(var i = 0; i < fishing.length; ++i) {
            if(fishing[i].fish === _fish && fishing[i].kind === _kind) {
                list.push(fishing[i]);
            }
        }
        return list;
    };
    _FindUnderSpecies = function(_specname) {
        var species = DB["SPECIES"]();
        var list = [];

        for(var i = 0; i < species.length; ++i) {
            if(species[i].upspec.indexOf(_specname) !== -1) {
                list.push(species[i].spec_name);
            }
        }
        return list;
    }

    _Dic = function(_name) {
        var obj = null, i, tmpobj, tmp, tmplist, stat;
        var TransAbilityName = function(_target) {
            switch(_target) {
              case "attack": return "공격력";
              case "magic": return "마법력";
              case "defense": return "방어력";
              case "atkspeed": return "공격속도";
              case "accuracy": return "정확도";
              case "avoid": return "회피력";
              case "critical": return "치명률";
              case "friendly": return "친화력";
              case "godevil": return "신마력";
              case "hp": return "체력";
              case "mp": return "마력";
              case "sp": return "기력";
              case "dp": return "정신력";
              case "ap": return "행동력";
              case "technic": return "기술력";
              case "wisdom": return "지혜";
              case "insight": return "통찰력";
              case "str": return "힘";
              case "con": return "체질";
              case "dex": return "민첩";
              case "agi": return "재주";
              case "int": return "지능";
              case "luk": return "운";
              case "ept": return "효율";
              case "com": return "교감";
              case "spr": return "영혼";
              default: return "";
            }
        };
        var TransSummonType = function(_target) {
            switch(_target) {
                case "element": return "원소 계열";
                case "animal": return "자연 계열";
                case "divine": return "신성 계열";
                case "chaos": return "혼돈 계열";
                default: return "";
            }
        };
        var rtnStr = "[" + _name + " 의 검색 결과]\n\n";
        obj = _Find("SPECIES", "spec_name", _name);
        if(obj !== null) {
            tmpobj = _Find("SPECIES", "spec_name", obj.upspec);
            if(tmpobj === null) {
                tmplist = [];
            }
            else {
                tmplist = tmpobj.talent;
            }
            rtnStr += "[종족]\n";
            rtnStr += "  - 종족명 : " + obj.spec_name + "\n";
            rtnStr += "  - 힘 : " + obj.inc_stat.str + ", 체질 : " + obj.inc_stat.con + ", 민첩 : " + obj.inc_stat.dex +
                      ", 재주 : " + obj.inc_stat.agi + ", 지능 : " + obj.inc_stat.int + ", 운 : " + obj.inc_stat.luk +
                      ", 효율 : " + obj.inc_stat.ept + ", 교감 : " + obj.inc_stat.com + ", 영혼 : " + obj.inc_stat.spr + "\n";
            rtnStr += "  - 상위종족 : " + (obj.upspec===""?"없음":obj.upspec) + "\n";
            if(obj.sommontype.length > 0) {
                rtnStr += "  - 소환 가능 계통\n";
                for(i = 0; i < obj.sommontype.length; ++i) {
                    rtnStr += "    L " + TransSummonType(obj.sommontype[i]) + "\n";
                }
            }

            if(tmplist.length > 0) {
                rtnStr += "(진화조건)\n";
                for(i = 0; i < tmplist.length; ++i) {
                    rtnStr += "  L " + _Find("PROPERTY", "index", tmplist[i]).name + "\n";
                }
            }
            rtnStr += "  - 설명 : " + obj.description + "\n";
            rtnStr += "\n";
        }

        obj = _Find("WEARITEM", "name", _name);
        if(obj !== null) {
            rtnStr += "[장비 아이템]\n";
            rtnStr += "  - 장비명 : " + obj.prefix + " " + obj.name + "\n";
            rtnStr += "  - 등급 : " + obj.grade + "급\n";
            rtnStr += "  - 장착 위치 : " + obj.wearpos + "\n";
            rtnStr += "  - 가격(룬) : " + obj.needrune + "\n";
            rtnStr += "  - 강화/분해여부 : " + obj.strength_yn + "\n";
            rtnStr += "  - 설명 : " + obj.description + "\n\n";
            rtnStr += "(능력치)\n";
            if(obj.performance.attack !== "0")
                rtnStr += "  - 공격력 : " + obj.performance.attack + "\n";
            if(obj.performance.magic !== "0")
                rtnStr += "  - 마법력 : " + obj.performance.magic + "\n";
            if(obj.performance.defense !== "0")
                rtnStr += "  - 방어력 : " + obj.performance.defense + "\n";
            if(obj.performance.atkspeed !== "0")
                rtnStr += "  - 공격속도 : " + obj.performance.atkspeed + "\n";
            if(obj.performance.accuracy !== "0")
                rtnStr += "  - 정확도 : " + obj.performance.accuracy + "\n";
            if(obj.performance.avoid !== "0")
                rtnStr += "  - 회피력 : " + obj.performance.avoid + "\n";
            if(obj.performance.critical !== "0")
                rtnStr += "  - 치명률 : " + obj.performance.critical + "\n";
            if(obj.performance.friendly !== "0")
                rtnStr += "  - 친화력 : " + obj.performance.friendly + "\n";
            if(obj.performance.godevil !== "0")
                rtnStr += "  - 신마력 : " + obj.performance.godevil + "\n";
            if(obj.performance.hp !== "0")
                rtnStr += "  - 체력 : " + obj.performance.hp + "\n";
            if(obj.performance.mp !== "0")
                rtnStr += "  - 마력 : " + obj.performance.mp + "\n";
            if(obj.performance.sp !== "0")
                rtnStr += "  - 기력 : " + obj.performance.sp + "\n";
            if(obj.performance.dp !== "0")
                rtnStr += "  - 정신력 : " + obj.performance.dp + "\n";
            if(obj.performance.ap !== "0")
                rtnStr += "  - 행동력 : " + obj.performance.ap + "\n";
            if(obj.performance.technic !== "0")
                rtnStr += "  - 기술력 : " + obj.performance.technic + "\n";
            if(obj.performance.wisdom !== "0")
                rtnStr += "  - 지혜 : " + obj.performance.wisdom + "\n";
            if(obj.performance.insight !== "0")
                rtnStr += "  - 통찰력 : " + obj.performance.insight + "\n\n";

            for(i = 0; i < obj.limit.length; ++i) {
                if(i === 0)
                    rtnStr += "(장비 제한 스텟)\n";
                tmpobj = obj.limit[i];
                rtnStr += "  - " + TransAbilityName(tmpobj.statname) + " + " + tmpobj.count + "\n";
            }

            if(obj.strength_yn === "Y") {
                rtnStr += "(강화 성능)\n";
                for(i = 0; i < obj.strength.length; ++i) {
                    tmpobj = _Find("STRENGTHLIST", "index", obj.strength[i]);
                    rtnStr += "  - " + (i+1) + "강 : " + TransAbilityName(tmpobj.performance) + " + " + tmpobj.value + (tmpobj.unit === "PLUS"?"":"%") + "\n";
                }
            }

            tmpobj = _FindMenufacture(obj.index, libConst.ITEM_KIND.WEARITEM);
            if(tmpobj !== null) {
                rtnStr += "(제작 위치)\n";
                tmp = _Find("CITY", "index", tmpobj.city);
                rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmpobj.facility).name + "\n";
            }

            tmplist = _FindSale(obj.index, libConst.ITEM_KIND.WEARITEM);
            if(tmplist.length > 0) {
                rtnStr += "(판매 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmplist = _FindList2Condition("TREE", "item", obj.index, "itemkind", libConst.ITEM_KIND.WEARITEM);
            if(tmplist.length > 0) {
                rtnStr += "(벌목 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmplist = _FindList2Condition("STONE", "item", obj.index, "itemkind", libConst.ITEM_KIND.WEARITEM);
            if(tmplist.length > 0) {
                rtnStr += "(채광 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmplist = _FindList2Condition("GETTING", "item", obj.index, "itemkind", libConst.ITEM_KIND.WEARITEM);
            if(tmplist.length > 0) {
                rtnStr += "(채집 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmplist = _FindFishing(obj.index, libConst.ITEM_KIND.WEARITEM);
            if(tmplist.length > 0) {
                rtnStr += "(낚시 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            rtnStr += "\n";
        }

        obj = _Find("SUNDRYITEM", "name", _name);
        if(obj !== null) {
            rtnStr += "[잡화 아이템]\n";
            rtnStr += "  - 아이템명 : " + obj.name + "\n";
            rtnStr += "  - 가격(룬) : " + obj.needrune + "\n";
            rtnStr += "  - 설명 : " + obj.description + "\n";
            tmplist = _FindDropItemForMonster(obj.index);
            if(tmplist.length !== 0) {
                rtnStr += "(드랍 몬스터)\n";
                for(i = 0; i < tmplist.length; ++i) {
                    rtnStr += "      L " + tmplist[i] + "\n";
                }
            }

            tmplist = _FindList2Condition("TREE", "item", obj.index, "itemkind", libConst.ITEM_KIND.SUNDRYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(벌목 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmplist = _FindList2Condition("STONE", "item", obj.index, "itemkind", libConst.ITEM_KIND.SUNDRYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(채광 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmplist = _FindList2Condition("GETTING", "item", obj.index, "itemkind", libConst.ITEM_KIND.SUNDRYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(채집 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmpobj = _FindMenufacture(obj.index, libConst.ITEM_KIND.SUNDRYITEM);
            if(tmpobj !== null) {
                rtnStr += "(제조 위치)\n";
                tmp = _Find("CITY", "index", tmpobj.city);
                rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmpobj.facility).name + "\n";
            }

            tmplist = _FindFishing(obj.index, libConst.ITEM_KIND.SUNDRYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(낚시 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }
            rtnStr += "\n";
        }

        obj = _Find("FUNCTIONALITYITEM", "name", _name);
        if(obj !== null) {
            rtnStr += "[기능성 아이템]\n";
            rtnStr += "  - 아이템명 : " + obj.name + "\n";
            rtnStr += "  - 가격(룬) : " + obj.needrune + "\n";
            if(obj.kind === "recovery")
                rtnStr += "  - 기능 : " + obj.effect + "을(를) " + obj.amount + "%만큼 회복한다.\n";
            else if(obj.kind === "recovery2")
                rtnStr += "  - 기능 : " + obj.effect + "을(를) +" + obj.amount + "만큼 회복한다.\n";
            else if(obj.kind === "recall")
                rtnStr += "  - 기능 : " + _Find("CITY", "index", obj.amount).name + " 마을로 순간이동 한다.\n";
            else if(obj.kind === "skill")
                rtnStr += "  - 기능 : " + _Find("SKILL", "index", obj.amount).name + " 스킬을 배울수 있다.\n";
            else if(obj.kind === "summon")
                rtnStr += "  - 기능 : " + _Find("SUMMONSKILL", "index", obj.amount).name + " 소환 스킬을 배울수 있다.\n";
            else if(obj.kind === "stat") {
                stat = TransAbilityName(obj.effect);
                rtnStr += "  - 기능 : 스텟 " + stat + " +" + obj.amount + "을(를) 향상 시킬수 있다.\n";
            }
            else if(obj.kind === "camping") {
                tmp = _Find("CAMPING", "functionalyindex", obj.index);
                rtnStr += "(캠핑효율)\n  L hp회복량 : " + tmp.recoveryhp + "%\n  L ap회복량 : " + tmp.recoveryap + "%\n";
            }
            else if(obj.kind === "species")
                rtnStr += "  - 기능 : " + obj.amount + "(으)로 환생한다.\n";
            else if(obj.kind === "reset")
                rtnStr += "  - 기능 : 스테이터스" + TransAbilityName(obj.effect) + "을(를) " + obj.amount + "개 초기화 한다.\n";
            else if(obj.kind === "furniture") {
                if(obj.effect === "back")
                    rtnStr += "  - 기능 : 집으로 귀환한다.\n  - 소비 환경도 : -" + obj.amount + "\n";
                else if(obj.effect === "bed")
                    rtnStr += "  - 기능 : 체력,마력,기력을 회복한다.\n  - 소비 환경도 : -" + obj.amount + "\n";
                else if(obj.effect === "table")
                    rtnStr += "  - 기능 : 행동력을 회복한다.\n  - 소비 환경도 : -" + obj.amount + "\n";
                else if(obj.effect === "deco")
                    rtnStr += "  - 기능 : 집의 환경도를 올린다.\n  - 증가 환경도 : +" + obj.amount + "\n";
                else if(obj.effect === "experiment" || obj.effect === "desk" || obj.effect === "anvil" || obj.effect === "smithdesk")
                    rtnStr += "  - 기능 : 제작 떄 필요한 가구.\n  - 소비 환경도 : -" + obj.amount + "\n";
                else if(obj.effect === "go")
                    rtnStr += "  - 기능 : 지정된 워프포인트로 이동한다.\n  - 소비 환경도 : -" + obj.amount + "\n";
                else if(obj.effect === "savelocation")
                    rtnStr += "  - 기능 : 워프 포인트 갯수를 증가시켜준다.\n  - 소비 환경도 : -" + obj.amount + "\n";
            }
            else if(obj.kind === "buff") {
                splits = obj.amount.split(";");
                rtnStr += "  - 기능 : " + TransAbilityName(obj.effect) + "+" + splits[0] + "을(를) " + splits[1] + "회 전투동안 상승시켜줍니다.\n";
            }
            else if(obj.kind === "recipe") {
                rtnStr += "  - 기능 : 사용시 레시피 등록 됩니다.\n";
            }
            else if(obj.kind === "fishinglod" || obj.kind === "reel" || obj.kind === "lure" || obj.kind === "fishinggut") {
                if(obj.effect === "timeterm") {
                    rtnStr += "  - 기능 : " + obj.amount + "초 캐스팅 시간을 줄여 줍니다.\n";
                }
                else if(obj.effect === "sizerate") {
                    rtnStr += "  - 기능 : " + obj.amount + "mm 사이즈를 올려줍니다.\n";
                }
                else if(obj.effect === "uniquerate") {
                    rtnStr += "  - 기능 : 고급 어종 획득 가능성을 " + obj.amount + "% 올려줍니다.\n";
                }
            }
            else if(obj.kind === "coin") {
                rtnStr += "  - 획득 가능 코인 : " + obj.amount + " coin.\n";
            }
            else if(obj.kind === "rune") {
                rtnStr += "  - 획득 가능 룬 : " + obj.amount + " rune.\n";
            }
            else if(obj.kind === "obtain") {
                rtnStr += "  - 지속 시간 : " + obj.amount + " 초\n";
            }
            else if(obj.kind === "mercenary") {
                rtnStr += "  - 관련 용병 : " + _Find("MERCENARY", "index", obj.amount).name + "\n";
            }
            else if(obj.kind === "randombox") {
                tmplist = _FindListForIndex("RANDBOX", "functionalyindex", obj.index);
                rtnStr += "  - 획득 가능한 아이템 및 확률\n";
                for(i = 0; i < tmplist.length; ++i) {
                    rtnStr += "    L " + _Find(tmplist[i].itemkind.toUpperCase(), "index", tmplist[i].itemidx).name + " x" + tmplist[i].itemcount + " - " + tmplist[i].rate + "%\n";
                }
                
            }
            
            rtnStr += "  - 설명 : " + obj.description + "\n";
            tmplist = _FindSale(obj.index, libConst.ITEM_KIND.FUNCTIONALITYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(판매 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmpobj = _FindMenufacture(obj.index, libConst.ITEM_KIND.FUNCTIONALITYITEM);
            if(tmpobj !== null) {
                rtnStr += "(생산 위치)\n";
                tmp = _Find("CITY", "index", tmpobj.city);
                rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmpobj.facility).name + "\n";
            }

            tmplist = _FindList2Condition("TREE", "item", obj.index, "itemkind", libConst.ITEM_KIND.FUNCTIONALITYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(벌목 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmplist = _FindList2Condition("STONE", "item", obj.index, "itemkind", libConst.ITEM_KIND.FUNCTIONALITYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(채광 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmplist = _FindList2Condition("GETTING", "item", obj.index, "itemkind", libConst.ITEM_KIND.FUNCTIONALITYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(채집 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            tmpobj = _FindAnalyzeByFunItem(obj.index);
            if(tmpobj !== null) {
                rtnStr += "(감정하기)\n";
                tmp = _Find("SUNDRYITEM", "index", tmpobj.sundryindex);
                rtnStr += "   - 감정 전 아이템 : " + tmp.name + "\n";
            }

            tmplist = _FindFishing(obj.index, libConst.ITEM_KIND.FUNCTIONALITYITEM);
            if(tmplist.length > 0) {
                rtnStr += "(낚시 위치)\n";
                for(i = 0; i < tmplist.length; ++i ) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }

            rtnStr += "\n";
        }

        obj = _Find("MONSTER", "name", _name);
        if(obj !== null) {
            rtnStr += "[몬스터]\n";
            rtnStr += "  - 몬스터명 : " + obj.name + "\n";
            rtnStr += "  - 용병 경험치 : " + obj.exp + "\n";
            rtnStr += "  - 스킬 발동 확률 : " + obj.skillrate + "%\n";
            rtnStr += "  - 드랍(룬) : " + obj.droprune + "\n";
            rtnStr += "  - 드랍(아이템) : " + "\n";
            for(i = 0; i < obj.dropItem.length; ++i) {
                tmpobj = _Find("SUNDRYITEM", "index", obj.dropItem[i].itemIdx);
                rtnStr += "      L " + tmpobj.name + "\n";
            }
            rtnStr += "(능력치)\n";
            rtnStr += "  - 공격력 : " + obj.ability.attack + "\n";
            rtnStr += "  - 마법력 : " + obj.ability.magic + "\n";
            rtnStr += "  - 방어력 : " + obj.ability.defense + "\n";
            rtnStr += "  - 공격속도 : " + obj.ability.atkspeed + "\n";
            rtnStr += "  - 정확도 : " + obj.ability.accuracy + "\n";
            rtnStr += "  - 회피력 : " + obj.ability.avoid + "\n";
            rtnStr += "  - 치명률 : " + obj.ability.critical + "\n";
            rtnStr += "  - 체력 : " + obj.ability.hp + "\n";
            rtnStr += "  - 마력 : " + obj.ability.mp + "\n";
            rtnStr += "  - 기력 : " + obj.ability.sp + "\n";
            rtnStr += "  - 사용스킬 : " + "\n";
            for(i = 0; i < obj.skill.length; ++i) {
                tmpobj = _Find("SKILL", "index", obj.skill[i]);
                rtnStr += "      L " + tmpobj.name + "\n";
            }
            rtnStr += "  - 설명 : " + obj.description + "\n";

            tmplist = _FindFieldsByMonster(obj.index);
            if(tmplist.length !== 0) {
                rtnStr += "(출현위치)\n";
                for(i = 0; i < tmplist.length; ++i) {
                    rtnStr += "  - " + tmplist[i].name + "\n";
                }
            }
            rtnStr += "\n";
        }

        obj = _Find("NATION", "name", _name);
        if(obj !== null) {
            rtnStr += "[나라]\n";
            rtnStr += "  - 나라명 : " + obj.name + "\n";
            rtnStr += "  - 유형 : " + obj.kind + "\n";
            rtnStr += "  - 보유 마을 항목 : " + "\n";
            for(i = 0; i < obj.cities.length; ++i) {
                tmpobj = _Find("CITY", "index", obj.cities[i]);
                rtnStr += "      L " + tmpobj.name + "\n";
            }
            rtnStr += "  - 설명 : " + obj.description + "\n";
            rtnStr += "\n";
        }

        obj = _Find("CITY", "name", _name);
        if(obj !== null) {
            rtnStr += "[마을]\n";
            rtnStr += "  - 마을명 : " + obj.name + "\n";
            rtnStr += "  - 유형 : " + obj.kind + "\n";
            rtnStr += "  - 소속국가 : " + _Find("NATION", "index", obj.attach).name + "\n";
            rtnStr += "  - 보유 시설 항목 : " + "\n";
            for(i = 0; i < obj.facilities.length; ++i) {
                tmpobj = _Find("FACILITY", "index", obj.facilities[i]);
                rtnStr += "      L " + tmpobj.name + "\n";
            }
            rtnStr += "  - 보유 사냥터 항목 : " + "\n";
            for(i = 0; i < obj.fields.length; ++i) {
                tmpobj = _Find("FIELD", "index", obj.fields[i]);
                rtnStr += "      L " + tmpobj.name + "\n";
            }
            rtnStr += "  - 설명 : " + obj.description + "\n";
            rtnStr += "\n";
        }

        obj = _Find("FIELD", "name", _name);
        if(obj !== null) {
            rtnStr += "[몬스터 필드]\n";
            rtnStr += "  - 필드명 : " + obj.name + "\n";
            rtnStr += "  - 소속 마을 : " + _Find("CITY", "index", obj.attach).name + "\n";
            rtnStr += "  - 몬스터 출현 숫자 : " + obj.mobcount + "\n";
            rtnStr += "  - 출현 몬스터 : " + "\n";
            for(i = 0; i < obj.monster.length; ++i) {
                tmpobj = _Find("MONSTER", "index", obj.monster[i]);
                rtnStr += "      L " + tmpobj.name + "\n";
            }
            tmpobj = _Find("MONSTER", "index", obj.boss);
            if(tmpobj !== null)
                rtnStr += "  - 출현 보스 몬스터 : " + tmpobj.name + "\n";
            else
                rtnStr += "  - 출현 보스 몬스터 : 없음\n";
            tmpobj = _Find("SUNDRYITEM", "index", obj.summonitem);
            if(tmpobj !== null)
                rtnStr += "  - 보스 소환 아이템 : " + tmpobj.name + "\n";
            rtnStr += "  - 설명 : " + obj.description + "\n";
            rtnStr += "\n";
        }

        obj = _Find("DUNGEON", "name", _name);
        if(obj !== null) {
            rtnStr += "[몬스터 던전]\n";
            rtnStr += "  - 던전명 : " + obj.name + "\n";
            rtnStr += "  - 소속 마을 : " + _Find("CITY", "index", obj.attach).name + "\n";
            rtnStr += "  - 던전 타입 : " + obj.type + "\n";
            rtnStr += "  - 진입가능한 파티 최대인원 : " + obj.maxcount + "명\n";
            tmpobj = _Find("SUNDRYITEM", "index", obj.needitem);
            if(tmpobj !== null)
                rtnStr += "  - 던전 진입 아이템 : " + tmpobj.name + "\n";
            rtnStr += "  - 설명 : " + obj.description + "\n";
            rtnStr += "\n";
        }

        obj = _Find("SKILL", "name", _name);
        if(obj !== null) {
            if(obj.weapon === "mw") tmp = "지팡이류 무기";
            else if(obj.weapon === "nw") tmp = "근거리 무기";
            else if(obj.weapon === "fw") tmp = "원거리 무기";
            else if(obj.weapon === "as") tmp = "방패";

            rtnStr += "[스킬]\n";
            rtnStr += "  - 스킬명 : " + obj.name + "\n";
            rtnStr += "  - 종류\n";
            rtnStr += "     L 주 데미지 : " + TransAbilityName(obj.kind) + "\n";
            rtnStr += "     L 보조 데미지 : " + TransAbilityName(obj.subkind) + "\n";
            rtnStr += "  - 습득 가능 종족 : " + obj.spec + "\n";
            rtnStr += "  - 사용가능 무기 : " + tmp + "\n";
            rtnStr += "  - 구매 가격(룬) : " + obj.needrune + "\n";
            if(obj.preskill !== "")
                rtnStr += "  - 선행 스킬 : " + _Find("SKILL", "index", obj.preskill).name + "\n";
            rtnStr += (obj.needhp === "0"?"":("  - 소모 체력 : " + obj.needhp + "\n"));
            rtnStr += (obj.needsp === "0"?"":("  - 소모 기력 : " + obj.needsp + "\n"));
            rtnStr += (obj.needmp === "0"?"":("  - 소모 마력 : " + obj.needmp + "\n"));
            rtnStr += "  - 쿨타임 : " + obj.time + " 턴\n";
            rtnStr += "  - 적용 범위 : " + (obj.range==="single"?"단일":"다수") + " " + (obj.type==="damage"?"적":"아군") + "에게 적용\n";
            if(obj.range === "all")
                rtnStr += "  - 타겟 수 : " + obj.count + "" + (obj.type==="damage"?"마리의 적":"명의 아군") + "을 타겟팅\n";
            if(obj.type==="damage") {
                rtnStr += "  - 효과 : " + obj.effect + "배의 데미지\n";
                rtnStr += "  - 크리적용 : " + ((obj.iscritical==="T")?"적용":"비적용") + "\n";
                tmp = _Find("CC", "index", obj.cc);
                if(tmp !== null) {
                    rtnStr += "  - 적용 CC : " + tmp.name + "\n";
                }
            }
            else if(obj.type==="heal") {
                rtnStr += "  - 효과 : " + obj.effect + "배의 Hp회복\n";
            }
            else if(obj.type==="remove") {
                rtnStr += "  - 효과 : 해로운 효과를 제거함\n";
            }

            rtnStr += "  - 설명 : " + obj.description + "\n";
            tmplist = _FindListForIndex("SKILLSALE", "skill", obj.index);
            if(tmplist.length > 0) {
                rtnStr += "(배우는 장소)\n";
                for(i = 0; i < tmplist.length; ++i) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }
            tmplist = _FindListForIndex("FUNCTIONALITYITEM", "kind", "skill");
            if(tmplist.length > 0) {
                rtnStr += "(관련 스킬서)\n";
                for(i = 0; i < tmplist.length; ++i) {
                    if(tmplist[i].amount === obj.index) {
                        rtnStr += "   - " + tmplist[i].name + "\n";
                    }
                }
            }

            rtnStr += "\n";
        }

        obj = _Find("PROPERTY", "name", _name);
        if(obj !== null) {
            rtnStr += "[특성]\n";
            rtnStr += "  - 특성명 : " + obj.name + "\n";
            rtnStr += "  - 설명 : " + obj.description + "\n";
            rtnStr += "(적용 능력치)\n";
            if(obj.performance.attack !== "0")
                rtnStr += "  - 공격력 : " + obj.performance.attack + "\n";
            if(obj.performance.magic !== "0")
                rtnStr += "  - 마법력 : " + obj.performance.magic + "\n";
            if(obj.performance.defense !== "0")
                rtnStr += "  - 방어력 : " + obj.performance.defense + "\n";
            if(obj.performance.atkspeed !== "0")
                rtnStr += "  - 공격속도 : " + obj.performance.atkspeed + "\n";
            if(obj.performance.accuracy !== "0")
                rtnStr += "  - 정확도 : " + obj.performance.accuracy + "\n";
            if(obj.performance.avoid !== "0")
                rtnStr += "  - 회피력 : " + obj.performance.avoid + "\n";
            if(obj.performance.critical !== "0")
                rtnStr += "  - 치명률 : " + obj.performance.critical + "\n";
            if(obj.performance.friendly !== "0")
                rtnStr += "  - 친화력 : " + obj.performance.friendly + "\n";
            if(obj.performance.godevil !== "0")
                rtnStr += "  - 신마력 : " + obj.performance.godevil + "\n";
            if(obj.performance.hp !== "0")
                rtnStr += "  - 체력 : " + obj.performance.hp + "\n";
            if(obj.performance.mp !== "0")
                rtnStr += "  - 마력 : " + obj.performance.mp + "\n";
            if(obj.performance.sp !== "0")
                rtnStr += "  - 기력 : " + obj.performance.sp + "\n";
            if(obj.performance.dp !== "0")
                rtnStr += "  - 정신력 : " + obj.performance.dp + "\n";
            if(obj.performance.ap !== "0")
                rtnStr += "  - 행동력 : " + obj.performance.ap + "\n";
            if(obj.performance.technic !== "0")
                rtnStr += "  - 기술력 : " + obj.performance.technic + "\n";
            if(obj.performance.wisdom !== "0")
                rtnStr += "  - 지혜 : " + obj.performance.wisdom + "\n";
            if(obj.performance.insight !== "0")
                rtnStr += "  - 통찰력 : " + obj.performance.insight + "\n";
            rtnStr += "(적용 스테이터스)\n";
            if(obj.stat.str !== "0")
                rtnStr += "  - 힘 : " + obj.stat.str + "\n";
            if(obj.stat.con !== "0")
                rtnStr += "  - 체질 : " + obj.stat.con + "\n";
            if(obj.stat.dex !== "0")
                rtnStr += "  - 민첩 : " + obj.stat.dex + "\n";
            if(obj.stat.agi !== "0")
                rtnStr += "  - 재주 : " + obj.stat.agi + "\n";
            if(obj.stat.int !== "0")
                rtnStr += "  - 지능 : " + obj.stat.int + "\n";
            if(obj.stat.luk !== "0")
                rtnStr += "  - 운 : " + obj.stat.luk + "\n";
            if(obj.stat.ept !== "0")
                rtnStr += "  - 효율 : " + obj.stat.ept + "\n";
            if(obj.stat.com !== "0")
                rtnStr += "  - 교감 : " + obj.stat.com + "\n";
            if(obj.stat.spr !== "0")
                rtnStr += "  - 영혼 : " + obj.stat.spr + "\n";

            rtnStr += "\n";
        }

        obj = _Find("CLANBUFF", "name", _name);
        if(obj !== null) {
            rtnStr += "[클랜 축복]\n";
            rtnStr += "  - 축복명 : " + obj.name + "\n";
            if(obj.kind === "ability")
                rtnStr += "  - 버프효과 : 클랜원들의 " + TransAbilityName(obj.buffname) + "을(를) 향상\n";
            else if(obj.kind === "clan")
                rtnStr += "  - 버프효과 : 클랜의 한도 인원수를 향상\n";
            rtnStr += "(비율)\n";
            for(i = 0; i < obj.rate.length; ++i) {
                rtnStr += "  Lv" + (i+1) +". " + TransAbilityName(obj.buffname) + " +" + obj.rate[i] + "%\n";
            }
            rtnStr += "(필요 룬)\n";
            for(i = 0; i < obj.needrune.length; ++i) {
                  rtnStr += "  Lv" + (i+1) +". " + obj.needrune[i] + " rune\n";
            }
            rtnStr += "(필요 아이템)\n";
            for(i = 0; i < obj.needitem.length; ++i) {
                  tmpobj = obj.needitem[i];
                  if(tmpobj.kind === "SundryItem")
                      tmp = _Find("SUNDRYITEM", "index", tmpobj.index);
                  else if(tmpobj.kind === "WearItem")
                      tmp = _Find("WEARITEM", "index", tmpobj.index);
                  else if(tmpobj.kind === "FunctionalityItem")
                      tmp = _Find("FUNCTIONALITYITEM", "index", tmpobj.index);

                  rtnStr += "  Lv" + (i+1) +". " + tmp.name + " x " + tmpobj.count + " \n";
            }
            rtnStr += "\n";
        }

        obj = _Find("MERCENARY", "name", _name);
        if(obj !== null) {
            rtnStr += "[용병]\n";
            rtnStr += "  - 용병명 : " + obj.name + "\n";
            rtnStr += "  - 병과 : " + obj.kind + "\n";
            rtnStr += "  - 영입가격 : " + obj.needrune + "\n";
            rtnStr += "  - 봉급 : " + obj.pay + "\n";
            rtnStr += "  - 스킬 발동 확률 : " + obj.skillrate + "%\n";
            if(obj.aura.kind !== "") {
                if(obj.aura.type === "PLUS")
                    rtnStr += "  - 오러 : " + TransAbilityName(obj.aura.kind) +"+"+ obj.aura.value +"\n";
                else
                    rtnStr += "  - 오러 : " + TransAbilityName(obj.aura.kind) +"+"+ obj.aura.value +"%\n";
            }
            rtnStr += "(적용 능력치)\n";
            rtnStr += "  - 공격력 : " + obj.ability.attack +
                        ", 마법력 : " + obj.ability.magic +
                        ", 방어력 : " + obj.ability.defense +
                        ", 공격속도 : " + obj.ability.atkspeed +
                        ", 정확도 : " + obj.ability.accuracy +
                        ", 회피력 : " + obj.ability.avoid +
                        ", 치명률 : " + obj.ability.critical +
                        ", 체력 : " + obj.ability.hp +
                        ", 마력 : " + obj.ability.mp +
                        ", 기력 : " + obj.ability.sp +"\n";
            rtnStr += "(보유 스킬)\n";
            for(i = 0; i < obj.skill.length; ++i) {
                tmpobj = _Find("SKILL", "index", obj.skill[i]);
                rtnStr += "      L " + tmpobj.name + "\n";
            }
            tmplist = _FindListForIndex("MERCENARY", "lowkind", obj.index);
            rtnStr += "(전직 직업)\n";
            for(i = 0; i < tmplist.length; ++i) {
                rtnStr += "      L " + tmplist[i].name + "\n";
            }
            rtnStr += "  - 전직시 필요 경험치 : " + obj.upcounter + "\n";
            rtnStr += "  - 전직시 필요 룬 : " + obj.uprune + "\n";
            if(obj.upitem.kind !== "") {
                tmpobj = _Find(obj.upitem.kind.toUpperCase(), "index", obj.upitem.index);
                rtnStr += "  - 전직시 필요 아이템 : " + tmpobj.name + " x " + obj.upitem.count + "\n";
            }
            
            rtnStr += "\n";
        }

        obj = _Find("CC", "name", _name);
        if(obj !== null) {
            rtnStr += "[CC기]\n";
            rtnStr += "  - CC명 : " + obj.name + "\n";
            rtnStr += "  - 속성 : " + obj.attribute + "\n";
            rtnStr += "  - 적중률 : " + Math.floor(Number(obj.hit) * 100) + "%\n";
            rtnStr += "  - 지속 데미지율 : " + Math.floor(Number(obj.damage) * 100) + "%\n";
            rtnStr += "  - 지속턴 : " + obj.continue + "턴\n";
            rtnStr += "(CC 효과)\n";
            tmplist = obj.effect.split(";");
            for(i = 0; i < tmplist.length; ++i) {
                switch(tmplist[i]) {
                    case "attack":
                        rtnStr += "      L 공격금지\n";
                        break;
                    case "skill":
                        rtnStr += "      L 스킬금지\n";
                        break;
                    case "potion":
                        rtnStr += "      L 포션사용금지\n";
                        break;
                    case "avoid":
                        rtnStr += "      L 회피금지\n";
                        break;
                    case "provo":
                        rtnStr += "      L 도발됨\n";
                        break;
                    case "slow":
                        rtnStr += "      L 공격속도 감소\n";
                        break;
                    case "dth":
                        rtnStr += "      L 일정턴 후 즉사\n";
                        break;
                }
            }
            rtnStr += "\n";
        }

        obj = _Find("SUMMONSKILL", "name", _name);
        if(obj !== null) {
            rtnStr += "[소환 스킬]\n";
            rtnStr += "  - 스킬명 : " + obj.name + "\n";
            rtnStr += "  - 타입 : " + TransSummonType(obj.type) + "\n";
            rtnStr += "  - 습득 가능 종족 : " + obj.spec + "\n";
            rtnStr += "  - 소환수명 : " + _Find("SUMMONMONSTER", "index", obj.unit).name + "\n";
            rtnStr += "  - 소환 갯수 : " + obj.count + "\n";
            rtnStr += "  - 구매 가격(룬) : " + obj.needrune + "\n";
            rtnStr += (obj.needdp === "0"?"":("  - 소모 정신력 : " + obj.needdp + "\n"));
            rtnStr += "  - 설명 : " + obj.description + "\n\n";
            tmplist = _FindListForIndex("SUMMONSALE", "skill", obj.index);
            if(tmplist.length > 0) {
                rtnStr += "(배우는 장소)\n";
                for(i = 0; i < tmplist.length; ++i) {
                    tmp = _Find("CITY", "index", tmplist[i].city);
                    rtnStr += "   - " + _Find("NATION", "index", tmp.attach).name + " > " + tmp.name + " > " + _Find("FACILITY", "index", tmplist[i].facility).name + "\n";
                }
            }
            tmplist = _FindListForIndex("FUNCTIONALITYITEM", "kind", "summon");
            rtnStr += "(관련 스킬서)\n";
            for(i = 0; i < tmplist.length; ++i) {
                if(tmplist[i].amount === obj.index) {
                    rtnStr += "   - " + tmplist[i].name + "\n";
                }
            }
        }

        obj = _Find("SUMMONMONSTER", "name", _name);
        if(obj !== null) {
            rtnStr += "[소환수]\n";
            rtnStr += "  - 소환수명 : " + obj.name + "\n";
            rtnStr += "  - 소환 타입 : " + TransAbilityName(obj.type) + "\n";
            rtnStr += "  - 파워 배율 : " + obj.rate + " " + TransAbilityName(obj.type) + " / 1 lv\n";
            rtnStr += "  - 지속 턴 : " + obj.keepturn + "\n";
            rtnStr += "  - 스킬 발동 확률 : " + obj.skillrate + "%\n";
            rtnStr += "  - 설명 : " + obj.description + "\n\n";
            rtnStr += "(초기 능력치)\n";
            rtnStr += "  - 공격력 : " + obj.ability.attack + "\n";
            rtnStr += "  - 마법력 : " + obj.ability.magic + "\n";
            rtnStr += "  - 방어력 : " + obj.ability.defense + "\n";
            rtnStr += "  - 공격속도 : " + obj.ability.atkspeed + "\n";
            rtnStr += "  - 정확도 : " + obj.ability.accuracy + "\n";
            rtnStr += "  - 회피력 : " + obj.ability.avoid + "\n";
            rtnStr += "  - 치명률 : " + obj.ability.critical + "\n";
            rtnStr += "  - 체력 : " + obj.ability.hp + "\n";
            rtnStr += "  - 마력 : " + obj.ability.mp + "\n";
            rtnStr += "  - 기력 : " + obj.ability.sp + "\n\n";

            rtnStr += "(배율 능력치)\n";
            rtnStr += "  - 공격력 : " + obj.increase.attack + "\n";
            rtnStr += "  - 마법력 : " + obj.increase.magic + "\n";
            rtnStr += "  - 방어력 : " + obj.increase.defense + "\n";
            rtnStr += "  - 공격속도 : " + obj.increase.atkspeed + "\n";
            rtnStr += "  - 정확도 : " + obj.increase.accuracy + "\n";
            rtnStr += "  - 회피력 : " + obj.increase.avoid + "\n";
            rtnStr += "  - 치명률 : " + obj.increase.critical + "\n";
            rtnStr += "  - 체력 : " + obj.increase.hp + "\n";
            rtnStr += "  - 마력 : " + obj.increase.mp + "\n";
            rtnStr += "  - 기력 : " + obj.increase.sp + "\n\n";

            rtnStr += "  - 사용스킬 : " + "\n";
            for(i = 0; i < obj.skill.length; ++i) {
                tmpobj = _Find("SKILL", "index", obj.skill[i]);
                rtnStr += "      L " + tmpobj.name + "\n";
            }
        }

        return rtnStr;
    };
    _DicList = function(_category) {
        var list = [];
        var rtnStr = "[" + _category + " 의 검색 결과] " + libConst.dummy + "\n\n";
        if(_category === "잡템") {
            list = DB.SUNDRYITEM();
        }
        else if(_category === "장비템") {
            list = DB.WEARITEM();
        }
        else if(_category === "기능성템") {
            list = DB.FUNCTIONALITYITEM();
        }
        else if(_category === "종족") {
            list = DB.SPECIES();
        }
        else if(_category === "몬스터") {
            list = DB.MONSTER();
        }
        else if(_category === "용병") {
            list = DB.MERCENARY();
        }
        else if(_category === "스킬") {
            list = DB.SKILL();
        }
        else if(_category === "특성") {
            list = DB.PROPERTY();
        }
        else if(_category === "상태이상") {
            list = DB.CC();
        }
        else if(_category === "나라") {
            list = DB.NATION();
        }
        else if(_category === "마을") {
            list = DB.CITY();
        }
        else if(_category === "필드") {
            list = DB.FIELD();
        }
        else if(_category === "던전") {
            list = DB.DUNGEON();
        }
        else if(_category === "소환스킬") {
            list = DB.SUMMONSKILL();
        }
        else if(_category === "소환수") {
            list = DB.SUMMONMONSTER();
        }
        else if(_category === "CC") {
            list = DB.CC();
        }
        else if(_category === "클랜버프") {
            list = DB.CLANBUFF();
        }
        else if(_category === "대출") {
            list = DB.LOAN();
        }
        else if(_category === "예금") {
            list = DB.DEPOSIT();
        }
        else if(_category === "주식") {
            list = DB.STOCK();
        }

        for(var i = 0; i < list.length; ++i) {
            if(_category === "종족")
                rtnStr += " - " + list[i].spec_name + "\n";
            else
                rtnStr += " - " + list[i].name + "\n";
        }
        return rtnStr;
    };

    return {
        Search:function(_target, _table, _colume) {
            return _Find(_table, _colume, _target);
        },
        Dictionary:function(_name) {
            return _Dic(_name);
        },
        DictionaryList:function(_name) {
            return _DicList(_name);
        },
        isSpecies:function(_specname) {
          var obj = _Find("SPECIES", "spec_name", _specname);
          return (obj !== null?true:false);
        },
        getSpecies:function(_specname) {
            return _Find("SPECIES", "spec_name", _specname);
        },
        getUnderSpeciesList:function(_specname) {
            return _FindUnderSpecies(_specname);
        },
        getAllSpecies:function() {
            return DB.SPECIES();
        },
        copyOriginChar:function(_specname) {
           return _CopyDB(_Find("ORIGINCHAR", "spec_name", _specname));
        },
        isWearItem:function(_itemidx) {
          var obj = _Find("WEARITEM", "index", _itemidx);
          return (obj !== null?true:false);
        },
        getWearItem:function(_itemidx) {
            return _Find("WEARITEM", "index", _itemidx);
        },
        isSundryItem:function(_itemidx) {
          var obj = _Find("SUNDRYITEM", "index", _itemidx);
          return (obj !== null?true:false);
        },
        getSundryItem:function(_itemidx) {
            return _Find("SUNDRYITEM", "index", _itemidx);
        },
        isFunctionalityItem:function(_itemidx) {
          var obj = _Find("FUNCTIONALITYITEM", "index", _itemidx);
          return (obj !== null?true:false);
        },
        getFunctionalityItem:function(_itemidx) {
            return _Find("FUNCTIONALITYITEM", "index", _itemidx);
        },
        getItem:function(_kind, _itemidx){
            var rtnObj;

            if(_kind === "SundryItem")
                rtnObj = this.getSundryItem(_itemidx);
            else if(_kind === "WearItem")
                rtnObj = this.getWearItem(_itemidx);
            else if(_kind === "FunctionalityItem")
                rtnObj = this.getFunctionalityItem(_itemidx);

            return rtnObj;
        },
        getItemByName:function(_itemname) {
            var rtnObj = {kind:"WearItem", obj:null};
            rtnObj.obj = _Find("WEARITEM", "name", _itemname);
            if(rtnObj.obj === null) {
                rtnObj.obj = _Find("SUNDRYITEM", "name", _itemname);
                rtnObj.kind = "SundryItem";
            }
            if(rtnObj.obj === null) {
                rtnObj.obj = _Find("FUNCTIONALITYITEM", "name", _itemname);
                rtnObj.kind = "FunctionalityItem";
            }
            return rtnObj;
        },
        isSkill:function(_skillidx) {
          var obj = _Find("SKILL", "index", _skillidx);
          return (obj !== null?true:false);
        },
        getSkill:function(_skillidx) {
            return _Find("SKILL", "index", _skillidx);
        },
        isSummonSkill:function(_skillidx) {
          var obj = _Find("SUMMONSKILL", "index", _skillidx);
          return (obj !== null?true:false);
        },
        getSummonSkill:function(_skillidx) {
            return _Find("SUMMONSKILL", "index", _skillidx);
        },
        isNation:function(_idx) {
          var obj = _Find("NATION", "index", _idx);
          return (obj !== null?true:false);
        },
        getNation:function(_idx) {
            return _Find("NATION", "index", _idx);
        },
        isCity:function(_idx) {
          var obj = _Find("CITY", "index", _idx);
          return (obj !== null?true:false);
        },
        getCity:function(_idx) {
            return _Find("CITY", "index", _idx);
        },
        getCityByName:function(_name) {
            return _Find("CITY", "name", _name);
        },
        isFacility:function(_idx) {
          var obj = _Find("FACILITY", "index", _idx);
          return (obj !== null?true:false);
        },
        getFacility:function(_idx) {
            return _Find("FACILITY", "index", _idx);
        },
        isField:function(_idx) {
          var obj = _Find("FIELD", "index", _idx);
          return (obj !== null?true:false);
        },
        getField:function(_idx) {
            return _Find("FIELD", "index", _idx);
        },
        isDungeon:function(_idx) {
          var obj = _Find("DUNGEON", "index", _idx); 
          return (obj !== null?true:false);
        },
        getDungeon:function(_idx) {
            return _Find2Condition("DUNGEON", "index", _idx, "type", "normal");
        },
        getMonster:function(_monsteridx) {
            return _Find("MONSTER", "index", _monsteridx);
        },
        getSaleList:function(_city, _facility, _kind) {
            return _FindList("SALE", _city, _facility, _kind);
        },
        getSaleCapitalList:function(_city, _facility) {
            return _FindList("SALECAPITAL", _city, _facility, "all");
        },
        getMenufacture:function(_itemidx, _itemkind) {
            return _FindMenufacture(_itemidx, _itemkind);
        },
        getMenufactureList:function(_city, _facility, _kind) {
            if(_city === "all" && _facility === "all" && _kind === "all")
                return DB["MENUFACTURE"]();

            return _FindList("MENUFACTURE", _city, _facility, _kind);
        },
        getHighMenufacture:function(_itemidx, _itemkind) {
            return _FindHighMenufacture(_itemidx, _itemkind);
        },
        getHighMenufactureList:function(_city, _facility, _kind) {
            if(_city === "all" && _facility === "all" && _kind === "all")
                return DB["HIGHMENUFACTURE"]();

            return _FindList("HIGHMENUFACTURE", _city, _facility, _kind);
        },
        getCC:function(_idx) {
            return _Find("CC", "index", _idx);
        },
        getSkillSaleList:function(_city, _facility) {
            return _FindList("SKILLSALE", _city, _facility, "all");
        },
        getSummonSaleList:function(_city, _facility) {
            return _FindList("SUMMONSALE", _city, _facility, "all");
        },
        getProperty:function(_idx) {
            return _Find("PROPERTY", "index", _idx);
        },
        getMonsterPropertyList:function(_rcdname) {
            var list = _FindListForIndex("PROPERTY", "recordname", _rcdname);
            var rtnArray = [];
            for(var i = 0; i < list.length; ++i) {
                rtnArray.push({index:list[i].index, rcdidx:list[i].rcdidx});
            }
            return rtnArray;
        },
        getPropertyList:function(_rcdname) {
            return _FindListForIndex("PROPERTY", "recordname", _rcdname);

        },
        getWBReward:function(_monsteridx) {
            return _FindListForIndex("WORLDBOSS", "monsteridx", _monsteridx);
        },
        getWBLocalInfo:function(_city, _facility) {
            return _FindList("WORLDBOSSLOC", _city, _facility, "all")[0];
        },
        getWBLocalInfobyIdx:function(_monsteridx) {
            return _Find("WORLDBOSSLOC", "monsteridx", _monsteridx);
        },
        getMineList:function() {
            var ary = [], tmpObj;
            for(var i = 0; i < DB["MINE"]().length; ++i) {
                tmpObj = DB["MINE"]()[i];
                ary.push(tmpObj.sundryindex);
            }
            return ary;
        },
        getMineRate:function(_mineidx) {
            return Number(_Find("MINE", "sundryindex", _mineidx).rate);
        },
        getMine:function(_mineidx) {
            return _Find("MINE", "sundryindex", _mineidx);
        },
        getAnalyze:function(_itemidx) {
            return _Find("ANALYZE", "sundryindex", _itemidx);
        },
        getPerson:function(_nation, _city, _facility, _type, _name) {
            return _FindPersonList(_nation, _city, _facility, _type, _name);
        },
        getConversation:function(_charidx) {
            return _FindListForIndex("CONVERSATION", "characterindex", _charidx);
        },
        getQuest:function(_questidx) {
            return _Find("QUEST", "index", _questidx);
        },
        getQuestinCity:function(_city, _facility) {
            return _FindQuestinCity(_city, _facility);
        },
        getMercenary:function(_mercenaryidx) {
            return _Find("MERCENARY", "index", _mercenaryidx);
        },
        getMercenarybyName:function(_mercenaryname) {
            return _Find("MERCENARY", "name", _mercenaryname);
        },
        getPromotionMercenary:function(_mercenaryidx) {
            return _FindListForIndex("MERCENARY", "lowkind", _mercenaryidx);
        },
        getHireList:function(_city, _facility) {
            return _FindList("HIRE", _city, _facility, "all");
        },
        getNationMoveList:function(_city, _facility) {
            return _FindList("NATIONMOVE", _city, _facility, "all");
        },
        getClanBuffList:function() {
            return DB.CLANBUFF();
        },
        getClanBuffbyName:function(_buffname) {
            return _Find("CLANBUFF", "name", _buffname);
        },
        getClanBuff:function(_index) {
            return _Find("CLANBUFF", "index", _index);
        },
        getLoanList:function() {
            return DB.LOAN();
        },
        getDepositList:function() {
            return DB.DEPOSIT();
        },
        getLoanByName:function(_name) {
            return _Find("LOAN", "name", _name);
        },
        getDepositByName:function(_name) {
            return _Find("DEPOSIT", "name", _name);
        },
        getLoan:function(_index) {
            return _Find("LOAN", "index", _index);
        },
        getDeposit:function(_index) {
            return _Find("DEPOSIT", "index", _index);
        },
        getCamping:function(_index) {
            return _Find("CAMPING", "functionalyindex", _index);
        },
        getAlchemyList:function(_city, _facility) {
            return _FindList("ALCHEMY", _city, _facility, "all");
        },
        getExchangeObj:function(_index, _kind) {
            return _Find2Condition("EXCHANGE", "kind", _kind, "index", _index);
        },
        getBattleBuff:function(_rank) {
            return _Find("BATTLEBUFF", "rank", _rank);
        },
        getStrength:function(_level, _safety) {
            return _Find2Condition("STRENGTH", "level", _level, "safety", _safety);
        },
        getStrengthList:function(_index) {
            return _Find("STRENGTHLIST", "index", _index);
        },
        getDecompose:function(_grade) {
            return _Find("DECOMPOSE", "grade", _grade);
        },
        getPetFamily:function(_kind, _index) {
            return _Find2Condition("PETFAMILY", "itemkind", _kind, "itemidx", _index);
        },
        getPetFamilyList:function() {
            return  DB.PETFAMILY();
        },
        getPetBuff:function(_kind) {
            return _Find("PETBUFF", "kind", _kind);
        },
        getPetBuffByIdx:function(_index) {
            return _Find("PETBUFF", "index", _index);
        },
        getAllPetBuff:function() {
            return DB.PETBUFF();
        },
        getTower:function(_floor, _city, _facility) {
            return _Find3Condition("TOWER", "floor", _floor, "city", _city, "facility", _facility);
        },
        getTowerMob:function(_index) {
            return _Find("TOWERMOB", "index", _index);
        },
        getTreeList:function(_city, _facility) {
            return _FindList("TREE", _city, _facility, "all");
        },
        getTree:function(_index) {
            return _Find("TREE", "item", _index);
        },
        getStoneList:function(_city, _facility) {
            return _FindList("STONE", _city, _facility, "all");
        },
        getStone:function(_index) {
            return _Find("STONE", "item", _index);
        },
        getGettingList:function(_city, _facility) {
            return _FindList("GETTING", _city, _facility, "all");
        },
        getGetting:function(_index) {
            return _Find("GETTING", "item", _index);
        },
        getBuilding:function(_level) {
            return _Find("BUILDING", "level", _level);
        },
        getRequest:function(_city, _facility) {
            return _FindList("REQUEST", _city, _facility, "all");
        },
        getRequestByIndex:function(_index) {
            return _Find("REQUEST", "index", _index);
        },
        getRecipe:function(_index) {
            return _Find("RECIPE", "index", _index);
        },
        getFish:function(_index, _kind) {
            return _Find2Condition("FISH", "index", _index, "kind", _kind);
        },
        getFishing:function(_city, _facility) {
            return _FindList("FISHING", _city, _facility, "all");
        },
        getCoinSaleList:function(_city, _facility) {
            return _FindList("SALECOIN", _city, _facility, "all");
        },
        getCoinSale:function(_city, _facility, _index, _kind) {
            return _Find4Condition("SALECOIN", "city", _city, "facility", _facility, "item", _index, "itemkind", _kind);
        },
        getTodayAttendance:function(_index) {
            return DB.ATTENDANCE()[Number(_index)];
        },
        getAttendanceList:function(_index) {
            return DB.ATTENDANCE();
        },
        getSummonMonster:function(_index) {
            return _Find("SUMMONMONSTER", "index", _index);
        },
        getDungeonMapList:function(_dungeonidx) {
            return _FindListForIndex("DUNGEONMAP", "attach", _dungeonidx);
        },
        getDungeonMap:function(_index) {
            return _Find("DUNGEONMAP", "index", _index);
        },
        getStock:function(_index) {
            return _Find("STOCK", "index", _index);
        },
        getAllStock:function() {
            return DB.STOCK();
        },
        getNews:function(_index) {
            return _Find("NEWS", "index", _index);
        },
        getRandBoxList:function(_index) {
            return _FindListForIndex("RANDBOX", "functionalyindex", _index);
        },
        getTutorial:function(_kind, _command) {
            return _Find2Condition("TUTORIAL", "kind", _kind, "command", _command);
        },
        getPackage:function(_index) {
            return _Find("PACKAGE", "functionalyindex", _index);
        },
        getOccupyDungeonbyCity:function(_cityidx) {
            return _Find2Condition("DUNGEON", "attach", _cityidx, "type", "occupy");
        },
        getAllHomework:function() {
            return DB.HOMEWORK();
        },
        getHomework:function(_index) {
            return _Find("HOMEWORK", "index", _index);
        }
    };
}
