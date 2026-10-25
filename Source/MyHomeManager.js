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

function MyHomeManager() {
    var m_HomeList = [];
    var m_HomeDump = new libCommon.DumpModule();

    var _LoadData, _Find, _CreateHome, _Extend, _Delete, _MakeJson, _Save;

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["HomeList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_HomeList.push(libObject.clsHome(tmpList[idx]));
        }
    }();
    _Find = function(_id) {
        var i;
        for(i = 0; i < m_HomeDump.dumpList.length; ++i) {
            if (m_HomeDump.dumpList[i].name === _id) {
                m_HomeDump.resetTimeStemp(i);
                return m_HomeDump.dumpList[i];
            }
        }
        for (i = 0; i < m_HomeList.length; ++i) {
            if (m_HomeList[i].name === _id) {
                m_HomeDump.addDump(m_HomeList[i]);
                return m_HomeList[i];
            }
        }
        return null;
    };

    _CreateHome = function(_id, _cityname) {
        var buildingDB = db_Manager.getBuilding("1");
        var city = db_Manager.getCityByName(_cityname);
        var home = {
            name:_id,
            homename:_id + "의 집",
            location:{country:city.attach, city:city.index, facility:"", field:"", dungeon:""},
            level:"1",
            inspace:Number(buildingDB.inspace),
            outspace:Number(buildingDB.outspace),
            furniturelist: [],
            farmlist: [],
            box: []
        };
        m_HomeList.push(libObject.clsHome(home));
        _Save();
        return m_HomeList[m_HomeList.length - 1];
    };
    _Extend = function(_myhome) {
        var buildingDB = db_Manager.getBuilding(_myhome.getNextLevel());
        if(buildingDB !== null) {
            _myhome.addHomeLevel();
            _myhome.setHomeInspace(Number(buildingDB.inspace));
            _myhome.setHomeOutspace(Number(buildingDB.outspace));
            return true;
        }
        return false;
    };

    _Delete = function(_id) {
        m_HomeDump.clear();
        for (var i = 0; i < m_HomeList.length; ++i) {
           if (m_HomeList[i].name === _id) {
              m_HomeList.splice(i,1);
              break;
           }
        }
        _Save();
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_HomeList.length; ++i) {
            jsonArray.push(m_HomeList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Home", function() {
                libCommon.write(libConst.fileNameList["HomeList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["HomeList"], _MakeJson());
        }
    };

    return {
        Find:_Find,
        Delete:_Delete,
        isMyHome:function(_id) {
            var home = _Find(_id);
            if(home === null) {
                return false;
            }
            return true;
        },
        getHomeLevel:function(_id) {
            var home = _Find(_id);
            if(home !== null) {
                return home.getHomeLevel();
            }
            return "";
        },
        getHomeNextLevel:function(_id) {
            var home = _Find(_id);
            if(home !== null) {
                return home.getNextLevel();
            }
            return "";
        },
        getHomeLoc:function(_id) {
            var home = _Find(_id);
            if(home !== null) {
                return home.getHomeLoc();
            }
            return null;
        },
        CompareLoc:function(_id, _loc) {
            var home = _Find(_id);
            var homeloc;
            if(home !== null) {
                homeloc = home.getHomeLoc();
                if(homeloc.country === _loc.country &&
                  homeloc.city === _loc.city &&
                  _loc.facility === "" &&
                  _loc.field === "" &&
                  _loc.dungeon === "" &&
                  _loc.home === "") {
                    return true;
                }
            }
            return false;
        },
        Buliding:function(_id, _cityname) {
            var home = _Find(_id);
            var city = db_Manager.getCityByName(_cityname);
            if(home === null && city !== null) {
                _CreateHome(_id, _cityname);
                _Save();
                return true;
            }
            return false;
        },
        Extending:function(_id) {
            var home = _Find(_id);
            var rtnflag = false;
            if(home !== null) {
                rtnflag = _Extend(home);
                _Save();
                return rtnflag;
            }
            return rtnflag;
        },
        Move:function(_id, _cityname) {
            var home = _Find(_id);
            var city = db_Manager.getCityByName(_cityname);
            if(home !== null && city !== null) {
                home.setHomeLoc(city.attach, city.index, "","","");
                _Save();
                return true;
            }
            return false;
        },
        getBox:function(_id) {
            var home = _Find(_id);
            if(home === null) {
                return [];
            }
            else {
              return home.getBox();
            }
        },
        PushItem:function(_id, _kind, _itemidx, _count, _strength) {
            var home = _Find(_id);
            if(home === null) {
                return false;
            }
            else {
              home.addItem(_kind, _itemidx, _count, _strength);
              _Save();
              return true;
            }
        },
        PopItem:function(_id, _kind, _itemidx, _count, _strength) {
            var home = _Find(_id), rtn;
            if(home === null) {
                return false;
            }
            else {
              rtn = home.removeItem(_kind, _itemidx, _count, _strength);
              _Save();
              return rtn;
            }
        },
        isItemCount:function(_id, _kind, _itemidx, _count, _strength) {
            var home = _Find(_id);
            if(home === null) {
                return false;
            }
            else {
              return home.isItemCount(_kind, _itemidx, _count, _strength);
            }
        },
        getItemCount:function(_id, _kind, _itemidx, _strength) {
            var home = _Find(_id);
            if(home === null) {
                return -1;
            }
            else {
              return home.getItemCount(_kind, _itemidx, _strength);
            }
        },
        getInfo:function(_id) {
            var home = _Find(_id);
            var rtnstr = "", locList, loc;
            var nation, city, facility, field, dungeon;
            if(home !== null) {
                rtnstr += "[" + home.getHomeName() + "]\n";
                rtnstr += "  - 레벨 : " + home.getHomeLevel() + "\n";
                rtnstr += "  - 워프기록 총 갯수 : " + home.getSaveMaxCnt() + "\n\n";
                rtnstr += "(위치)\n";
                rtnstr += "  - 국가 : " + db_Manager.getNation(home.getHomeLoc().country).name + "\n";
                rtnstr += "  - 도시 : " + db_Manager.getCity(home.getHomeLoc().city).name + "\n";
                rtnstr += "(워프 기록)\n";
                locList = home.getSaveLocation();
                for(var i = 0; i < locList.length; ++i) {
                    loc = locList[i];
                    nation = db_Manager.getNation(loc.country);
                    city = db_Manager.getCity(loc.city);
                    facility = db_Manager.getFacility(loc.facility);
                    field = db_Manager.getField(loc.field);
                    dungeon = db_Manager.getDungeon(loc.dungeon);
                    rtnstr += "  - " + loc.locname + "\n";
                    rtnstr += "    L 국가 : " + (nation===null?"":nation.name) + "\n";
                    rtnstr += "    L 도시 : " + (city===null?"":city.name) + "\n";
                    rtnstr += "    L 시설 : " + (facility===null?"":facility.name) + "\n";
                    rtnstr += "    L 필드 : " + (field===null?"":field.name) + "\n";
                    rtnstr += "    L 던전 : " + (dungeon===null?"":dungeon.name) + "\n\n";
                }
            }
            else {
                rtnstr += "보유한 집이 없습니다.";
            }
            return rtnstr;
        },
        getDetailInfo:function(_id) {
            var home = _Find(_id);
            var rtnstr = "", i, tmp, meter, locList, loc;
            var nation, city, facility, field, dungeon;
            if(home !== null) {
                rtnstr += "[" + home.getHomeName() + "]\n";
                rtnstr += "  - 레벨 : " + home.getHomeLevel() + "\n";
                rtnstr += "  - 워프기록 총 갯수 : " + home.getSaveMaxCnt() + "\n\n";

                tmp = db_Manager.getBuilding(home.getNextLevel());
                if(tmp !== null) {
                    rtnstr += "(다음 증축 정보)\n";
                    rtnstr += "  - 레벨 : " + tmp.level + "\n";
                    rtnstr += "  - 내부공간 : " + tmp.inspace + "\n";
                    rtnstr += "  - 외부공간 : " + tmp.outspace + "\n";
                    rtnstr += "  - 재료\n";
                    for(i = 0; i < tmp.meterial.length; ++i) {
                        meter = tmp.meterial[i];
                        rtnstr += "    L " + db_Manager.getItem(meter.itemkind, meter.itemindex).name + " x " + meter.count + "\n";
                    }
                    rtnstr += "  - 필요 룬 : " + tmp.needrune + "\n";
                }

                rtnstr += "\n(공간)\n";
                rtnstr += "  - 내부 : " + home.getHomeInspace() + " 개\n";
                rtnstr += "  - 외부 : " + home.getHomeOutspace() + " 개\n";
                rtnstr += "  - 환경도 : " + home.getEnvironment() + "\n";

                rtnstr += "\n(워프 기록)\n";
                locList = home.getSaveLocation();
                for(i = 0; i < locList.length; ++i) {
                    loc = locList[i];
                    nation = db_Manager.getNation(loc.country);
                    city = db_Manager.getCity(loc.city);
                    facility = db_Manager.getFacility(loc.facility);
                    field = db_Manager.getField(loc.field);
                    dungeon = db_Manager.getDungeon(loc.dungeon);
                    rtnstr += "  - " + loc.locname + "\n";
                    rtnstr += "    L 국가 : " + (nation===null?"":nation.name) + "\n";
                    rtnstr += "    L 도시 : " + (city===null?"":city.name) + "\n";
                    rtnstr += "    L 시설 : " + (facility===null?"":facility.name) + "\n";
                    rtnstr += "    L 필드 : " + (field===null?"":field.name) + "\n";
                    rtnstr += "    L 던전 : " + (dungeon===null?"":dungeon.name) + "\n\n";
                }
            }
            else {
                rtnstr += "보유한 집이 없습니다.";
            }
            return rtnstr;
        },
        getFurnitureInfo:function(_id) {
            var home = _Find(_id);
            var furniturelist, furniture, farmlist, farm;
            var rtnstr = "", i;
            if(home !== null) {
                furniturelist = home.getFurnitureList();
                farmlist = home.getFarmList();

                rtnstr += "[" + home.getHomeName() + " 가구배치]\n\n";
                rtnstr += "  - 현재 환경도 : " +  home.getEnvironment() + "\n\n";
                rtnstr += "(실내)\n";
                for(i = 0; i < furniturelist.length; ++i) {
                    furniture = db_Manager.getFunctionalityItem(furniturelist[i]);
                    rtnstr += "  - " + furniture.name + " (" + (furniture.effect === "deco" ?"+":"-") + furniture.amount + ")\n";
                }
                rtnstr += "\n(실외)\n";
                for(i = 0; i < farmlist.length; ++i) {
                    farm = db_Manager.getFunctionalityItem(farmlist[i]);
                    rtnstr += "  - " + farm.name + "\n";
                }
                rtnstr += "\n";
            }
            else {
                rtnstr += "보유한 집이 없습니다.";
            }
            return rtnstr;
        },
        setFurniture:function(_id, _itemidx) {
            var home = _Find(_id);
            var environ, furniture;
            if(home !== null) {
                environ = home.getEnvironment();
                furniture = db_Manager.getFunctionalityItem(_itemidx);
                if(furniture.effect === "deco") {
                    if(home.isHomeInspace())
                        home.addFurniture(_itemidx);
                    else
                        return false;
                }
                else {
                    if(environ >=  Number(furniture.amount)) {
                      if(home.isHomeInspace())
                          home.addFurniture(_itemidx);
                      else
                          return false;
                    }
                    else {
                        return false;
                    }
                }
                _Save();
                return true;
            }
            return false;
        },
        removeFurniture:function(_id, _itemidx) {
            var home = _Find(_id);
            if(home !== null) {
                if(home.isFurniture(_itemidx)) {
                    home.removeFurniture(_itemidx);
                }
                else {
                    return false;
                }
                _Save();
                return true;
            }
            return false;
        },
        getCommand:function(_id, _inhome) {
            var home = _Find(_id);
            var command = "", furniturelist, furniture;
            var fix = libConst.CommandPrefix;
            var checkcommand = [];
            if(home !== null) {
                furniturelist = home.getFurnitureList();
                for(var i = 0; i < furniturelist.length; ++i) {
                    furniture = db_Manager.getFunctionalityItem(furniturelist[i]);
                    if(checkcommand.includes(furniture.effect))
                        continue;
                    if(_inhome) {
                        switch(furniture.effect) {
                            case "table":
                                command += "  " + fix + "식사하기\n";
                                break;
                            case "bed":
                                command += "  " + fix + "잠자기\n";
                                break;
                            case "experiment":
                                command += "  " + fix + "포션만들기\n";
                                break;
                            case "smithdesk":
                                command += "  " + fix + "악세만들기\n";
                                break;
                            case "desk":
                                command += "  " + fix + "책쓰기\n";
                                break;
                            case "anvil":
                                command += "  " + fix + "무구만들기\n";
                                break;
                            case "go":
                                command += "  " + fix + "워프하기\n";
                                command += "  " + fix + "워프삭제\n";
                                break;
                        }
                    }
                    else {
                        switch(furniture.effect) {
                            case "back":
                                command += "  " + fix + "귀환하기 (마이홈)\n";
                                break;
                            case "go":
                                command += "  " + fix + "워프기록 (마이홈)\n";
                                break;
                        }
                    }
                    checkcommand.push(furniture.effect);
                }
            }
            return command;
        },
        isFurnitureEffect:function(_id, _effect) {
            var home = _Find(_id);
            var command = "", furniturelist, furniture;
            if(home !== null) {
                furniturelist = home.getFurnitureList();
                for(var i = 0; i < furniturelist.length; ++i) {
                    furniture = db_Manager.getFunctionalityItem(furniturelist[i]);
                    if(furniture.effect === _effect) {
                        return true;
                    }
                }
            }
            return false;
        },
        getHomeLoc:function(_id) {
            var home = _Find(_id);
            if(home !== null) {
                return home.getHomeLoc();
            }
            return null;
        },
        SaveLocation:function(_id, _locname, _location) {
            var home = _Find(_id);
            var locList, MaxCnt;
            var rtnstr = "";
            if(home !== null) {
                locList = home.getSaveLocation();
                MaxCnt = home.getSaveMaxCnt();

                if(locList.length >= MaxCnt) {
                    rtnstr = "최대 워프 기록 갯수가 가득 찼습니다.";
                }
                else {
                    home.addSaveLocation(_locname, _location.country, _location.city, _location.facility, _location.field, _location.dungeon);
                    _Save();
                    rtnstr = "해당 위치를 저장하였습니다.";
                }
            }
            else {
                rtnstr += "보유한 집이 없습니다.";
            }
            return rtnstr;
        },
        RemoveLocation:function(_id, _locname) {
            var home = _Find(_id);
            var rtnstr = "", result;
            if(home !== null) {
                result = home.removeSaveLocation(_locname);
                if(result) {
                    _Save();
                    rtnstr = "해당 위치를 삭제하였습니다.";
                }
                else {
                    rtnstr = "해당 워프명이 존재하지 않습니다.";
                }
            }
            else {
                rtnstr += "보유한 집이 없습니다.";
            }
            return rtnstr;
        },
        FindWarpPoint:function(_id, _locname) {
            var home = _Find(_id);
            var idx;
            if(home !== null) {
                 idx = home.findSavePoint(_locname);
                 if(idx === -1)
                    return null;
                 else
                    return home.getSaveLocation()[idx];
            }
            return null;
        },
        activeMyHome:function(_home) {
            m_HomeList.push(libObject.clsHome(_home));
            _Save();
        }
    };
}
