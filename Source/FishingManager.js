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

function FishingManager(_charactor_manager) {
    var C_Manager = _charactor_manager;
    var m_FisherManList = [];
    var m_FisherManDump = new libCommon.DumpModule();
    var m_FishRankingList = [];
    var m_FishRankingDump = new libCommon.DumpModule();

    var _LoadData, _FindMan,_FindRanking,  _FindRankingForFish, _FindRankingForName, _CreateFisherMan, _AddFishRanking, _DeleteMan, _DeleteRanking, _MakeJsonMan, _MakeJsonRanking, _SaveMan, _SaveRanking;
    var _DelaySystem, _RandFish, _Comma;

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["FisherManList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_FisherManList.push(libObject.clsFisherMan(tmpList[idx]));
            m_FisherManList[m_FisherManList.length - 1].calcAbility();
        }

        tmpList = libCommon.read(libConst.fileNameList["FishRankingList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_FishRankingList.push(libObject.clsFishRanking(tmpList[idx]));
        }
    }();
    _FindMan = function(_id) {
        var i;
        for (i = 0; i < m_FisherManDump.dumpList.length; ++i) {
           if (m_FisherManDump.dumpList[i].name === _id) {
              m_FisherManDump.resetTimeStemp(i);
              return m_FisherManDump.dumpList[i];
           }
        }
        for (i = 0; i < m_FisherManList.length; ++i) {
           if (m_FisherManList[i].name === _id) {
              m_FisherManDump.addDump(m_FisherManList[i]);
              return m_FisherManList[i];
           }
        }
        return null;
    };
    _FindRanking = function(_id, _fishidx, _fishkind) {
        var i;
        for (i = 0; i < m_FishRankingDump.dumpList.length; ++i) {
           if (m_FishRankingDump.dumpList[i].name === _id && m_FishRankingDump.dumpList[i].fishindex === _fishidx && m_FishRankingDump.dumpList[i].fishkind === _fishkind) {
              m_FishRankingDump.resetTimeStemp(i);
              return m_FishRankingDump.dumpList[i];
           }
        }
        for (i = 0; i < m_FishRankingList.length; ++i) {
           if (m_FishRankingList[i].name === _id && m_FishRankingList[i].fishindex === _fishidx && m_FishRankingList[i].fishkind === _fishkind) {
              m_FishRankingDump.addDump(m_FishRankingList[i]);
              return m_FishRankingList[i];
           }
        }
        return null;
    };
    _FindRankingForFish = function(_fishidx, _fishkind) {
        var i, rtnArray = [];
        for (i = 0; i < m_FishRankingList.length; ++i) {
           if (m_FishRankingList[i].fishindex === _fishidx && m_FishRankingList[i].fishkind === _fishkind) {
              rtnArray.push(m_FishRankingList[i]);
           }
        }
        return rtnArray;
    };
    _FindRankingForName = function(_id) {
        var i, rtnArray = [];
        for (i = 0; i < m_FishRankingList.length; ++i) {
           if (m_FishRankingList[i].name === _id) {
              rtnArray.push(m_FishRankingList[i]);
           }
        }
        return rtnArray;
    };
    _CreateFisherMan = function(_id) {
        var obj = {name:_id, setting:{fishinglod:"", reel:"", lure:"", fishinggut:""},
                  ability:{timeterm:libConst.Fishing_Defualt_TimeTerm, sizerate:libConst.Fishing_Defualt_SizeRate, uniquerate:libConst.Fishing_Defualt_UniqueRate}};

        m_FisherManList.push(libObject.clsFisherMan(obj));
        _SaveMan();
    };
    _AddFishRanking = function(_id, _fishidx, _fishkind, _size, _grade) {
        var rank = _FindRanking(_id, _fishidx, _fishkind);
        if(rank === null) {
            var obj = {name:_id, fishindex:_fishidx, fishkind:_fishkind, size:_size, grade:_grade};

            m_FishRankingList.push(libObject.clsFishRanking(obj));
        }
        else {
            if(rank.getSize() < _size) {
                rank.setSize(_size);
            }
        }
        _SaveRanking();
    };
    _DeleteMan = function(_id) {
        m_FisherManDump.clear();
        for (var i = 0; i < m_FisherManList.length; ++i) {
            if (m_FisherManList[i].name === _id) {
              m_FisherManList.splice(i,1);
              break;
            }
        }
        _SaveMan();
    };
    _DeleteRanking = function(_id) {
        m_FishRankingDump.clear();
        for (var i = 0; i < m_FishRankingList.length; ++i) {
            if (m_FishRankingList[i].name === _id) {
              m_FishRankingList.splice(i,1);
              --i;
            }
        }
        _SaveRanking();
    };

    _MakeJsonMan = function() {
        var jsonArray = [];
        for(var i = 0; i < m_FisherManList.length; ++i) {
            jsonArray.push(m_FisherManList[i].getJson());
        }
        return jsonArray;
    };
    _MakeJsonRanking = function() {
        var jsonArray = [];
        for(var i = 0; i < m_FishRankingList.length; ++i) {
            jsonArray.push(m_FishRankingList[i].getJson());
        }
        return jsonArray;
    };

    _SaveMan = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("FisherMan", function() {
                libCommon.write(libConst.fileNameList["FisherManList"], _MakeJsonMan());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["FisherManList"], _MakeJsonMan());
        }
    };
    _SaveRanking = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("FishRanking", function() {
                libCommon.write(libConst.fileNameList["FishRankingList"], _MakeJsonRanking());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["FishRankingList"], _MakeJsonRanking());
        }
    };

    _DelaySystem = function(_time) {
        var tmptime = Number(_time);
        while(true) {
            if(tmptime > 0)
                tmptime--;
            else
                break;

            java.lang.Thread.sleep(1000);
        }
    };
    _RandFish = function(_dblist, _uniquerate) {
        var list = _dblist, fish;
        var totalRate = 0, tmpRand, tmpFish, tmpFish2;
        var preRate = 0, currRate = 0;
        var resultIndex, resultKind;


        for(var i = 0; i < list.length; ++i) {
            fish = db_Manager.getFish(list[i].fish, list[i].kind);
            if(fish !== null && libConst.Fish_RARE_GRADE.indexOf(fish.grade) !== -1) {
                totalRate += Number(list[i].rate) + (Number(list[i].rate) * _uniquerate / 100);
            }
            else {
                totalRate += Number(list[i].rate);
            }
        }

        tmpRand = libCommon.Randfloat(0, totalRate);
        for(var m = 0; m < list.length; ++m) {
            tmpFish = list[m];
            fish = db_Manager.getFish(tmpFish.fish, tmpFish.kind);
            if(fish !== null && libConst.Fish_RARE_GRADE.indexOf(fish.grade) !== -1) {
                currRate += Number(tmpFish.rate) + (Number(tmpFish.rate) * _uniquerate / 100);
            }
            else {
                currRate += Number(tmpFish.rate);
            }

            if(m === 0) {
                preRate += 0;
            }
            else {
                tmpFish2 = list[m-1];
                fish = db_Manager.getFish(tmpFish2.fish, tmpFish2.kind);
                if(fish !== null && libConst.Fish_RARE_GRADE.indexOf(fish.grade) !== -1) {
                    preRate += Number(tmpFish2.rate) + (Number(tmpFish2.rate) * _uniquerate / 100);
                }
                else {
                    preRate += Number(tmpFish2.rate);
                }
            }

            if(tmpRand >= preRate && tmpRand < currRate) {
                resultIndex = tmpFish.fish;
                resultKind = tmpFish.kind;
                break;
            }
        }
        return {index:resultIndex, kind:resultKind};
    };

    _Comma = function(_num) {
        var str = "" + _num;
        var spl = str.split(".");
        return spl[0].replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,') + (spl[1]===undefined?"":("." + spl[1]));
    };

    return {
        Delete:function(_id) {
            _DeleteMan(_id);
            _DeleteRanking(_id);
        },
        getStat:function(_id) {
            var fisher = _FindMan(_id);
            var rtnstr = "", ability;

            if(fisher !== null) {
                ability = fisher.getAbility();
                rtnstr += "\n[낚시 관련 정보]\n";
                rtnstr += "  - 낚시 시간 : " + ability.timeterm + "초\n";
                rtnstr += "  - 사이즈 판정 : +" + _Comma(ability.sizerate) + "mm\n";
                rtnstr += "  - 레어도 판정 : +" + ability.uniquerate + "%\n";
            }
            return rtnstr;
        },
        getSetting:function(_id) {
            var fisher = _FindMan(_id);
            var rtnstr = "", setting;

            if(fisher !== null) {
                setting = fisher.getSetting();
                rtnstr += "\n[낚시 장착 정보]\n";
                rtnstr += "  - 낚시대 : " + (setting.fishinglod!==""?db_Manager.getFunctionalityItem(setting.fishinglod).name:"") + "\n";
                rtnstr += "  - 릴 : " + (setting.reel!==""?db_Manager.getFunctionalityItem(setting.reel).name:"") + "\n";
                rtnstr += "  - 루어 : " + (setting.lure!==""?db_Manager.getFunctionalityItem(setting.lure).name:"") + "\n";
                rtnstr += "  - 낚시줄 : " + (setting.fishinggut!==""?db_Manager.getFunctionalityItem(setting.fishinggut).name:"") + "\n";
            }
            return rtnstr;
        },
        isFisher:function(_id) {
            return (_FindMan(_id)===null?false:true);
        },
        Enroll:function(_id) {
            var fisher = _FindMan(_id);
            var user = C_Manager.findUser(_id);
            var rtnstr = "", user_loc, facilityDB;

            if(user === null)
                return "유저정보가 없습니다.";

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("낚시등록")) {
                rtnstr = "현재 위치에서 낚시꾼 등록이 불가능합니다.";
                return rtnstr;
            }

            if(fisher === null) {
                if(user.addRune(-libConst.Fishing_Enroll_Price)) {
                    _CreateFisherMan(_id);
                    C_Manager.SaveUser();
                    rtnstr = "낚시꾼으로 등록하였습니다.\n\n  - " + libConst.Fishing_Enroll_Price + " rune을 소비합니다.";
                }
                else {
                    rtnstr = "낚시꾼 등록 비용이 부족합니다.\n\n  - 등록 비용 : " + libConst.Fishing_Enroll_Price + " rune";
                }
            }
            else {
                rtnstr = "이미 낚시꾼으로 등록 되어 있습니다.";
            }
            return rtnstr;
        },
        Ranking:function(_name) {
            var itemInfo = db_Manager.getItemByName(_name);
            var rankList = _FindRankingForFish(itemInfo.obj.index, itemInfo.kind);
            var rtnstr = "", tmpRank;

            if(rankList.length === 0) {
                rtnstr = "현재까지 기록이 존재하지 않습니다.";
            }
            else {
                rtnstr = "["+_name+"] 랭킹\n\n";
                rankList.sort(function(a,b) {
                    return a.getSize() < b.getSize() ? 1 : (a.getSize() > b.getSize() ? -1 : 0);
                });
                for(var i = 0; i < rankList.length; ++i) {
                    if(i > libConst.Fishing_Ranking_Count - 1)
                        break;
                    tmpRank = rankList[i];
                    rtnstr += (i+1) + "위 : " + tmpRank.name +" (" + _Comma(tmpRank.getSize()) + "mm)\n";
                }
            }
            return rtnstr;
        },
        MyRanking:function(_id) {
            var rankList = _FindRankingForName(_id);
            var rtnstr = "", tmpRank;
            var fish;

            if(rankList.length === 0) {
                rtnstr = "현재까지 기록이 존재하지 않습니다.";
            }
            else {
                rtnstr = "["+_id+"] 낚시 기록\n\n";

                rankList.sort(function(a, b){
                    if (b.gradeNum !== a.gradeNum) {
                        return b.gradeNum - a.gradeNum;
                    }
                    return b.getSize() - a.getSize();
                });

                for(var i = 0; i < rankList.length; ++i) {
                    tmpRank = rankList[i];
                    fish = db_Manager.getItem(tmpRank.fishkind, tmpRank.fishindex);
                    rtnstr += "  L " + tmpRank.grade + "급 " + fish.prefix + " " + fish.name +" (" + _Comma(tmpRank.getSize()) + "mm)\n";
                }
            }
            return rtnstr;
        },
        AllRanking:function() {
            var rankList = m_FishRankingList;
            var rtnstr = "", tmpRank;
            var fish;

            if(rankList.length === 0) {
                rtnstr = "현재까지 기록이 존재하지 않습니다.";
            }
            else {
                rtnstr = "전체 낚시 기록\n\n";
                rankList.sort(function(a, b){
                    if (b.gradeNum !== a.gradeNum) {
                        return b.gradeNum - a.gradeNum;
                    }
                    return b.getSize() - a.getSize();
                });
                for(var i = 0; i < rankList.length; ++i) {
                    if(i > libConst.Fishing_AllRanking_Count - 1)
                        break;
                    tmpRank = rankList[i];
                    fish = db_Manager.getItem(tmpRank.fishkind, tmpRank.fishindex);
                    rtnstr += (i+1) + "위. [" + tmpRank.name + "] " + tmpRank.grade + "급 " + fish.prefix + " " + fish.name +" (" + _Comma(tmpRank.getSize()) + "mm)\n";
                }
            }
            return rtnstr;
        },
        Equipment:function(_id, _itemname) {
            var fisher = _FindMan(_id);
            var user = C_Manager.findUser(_id);
            var rtnstr = "", itemDB, tmpitem = null;

            if(user === null)
                return "유저정보가 없습니다.";

            if(fisher === null) {
                rtnstr = "당신은 낚시꾼 등록이 되지 않았습니다.\n\n 낚시꾼 허가를 받고 다시 시도하시기 바랍니다.";
            }
            else {
                itemDB = db_Manager.getItemByName(_itemname);
                if(itemDB.obj === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
                else if(itemDB.kind === "WearItem" || itemDB.kind === "SundryItem") {
                    rtnstr = "낚시와 관련된 아이템이 아닙니다.";
                }
                else {
                    if(user.isItem(itemDB.kind, itemDB.obj.index)){
                        if(itemDB.obj.kind === "fishinglod") {
                            tmpitem = fisher.getFishingLod();
                            if(tmpitem !== "") {
                                user.addItem("FunctionalityItem", tmpitem, 1);
                            }
                            fisher.setFishingLod(itemDB.obj.index);
                            user.removeItem(itemDB.kind, itemDB.obj.index, 1);
                            rtnstr = itemDB.obj.name + "을(를) 장비하였습니다.";
                        }
                        else if(itemDB.obj.kind === "reel") {
                            tmpitem = fisher.getReel();
                            if(tmpitem !== "") {
                                user.addItem("FunctionalityItem", tmpitem, 1);
                            }
                            fisher.setReel(itemDB.obj.index);
                            user.removeItem(itemDB.kind, itemDB.obj.index, 1);
                            rtnstr = itemDB.obj.name + "을(를) 장비하였습니다.";
                        }
                        else if(itemDB.obj.kind === "lure") {
                            tmpitem = fisher.getLure();
                            if(tmpitem !== "") {
                                user.addItem("FunctionalityItem", tmpitem, 1);
                            }
                            fisher.setLure(itemDB.obj.index);
                            user.removeItem(itemDB.kind, itemDB.obj.index, 1);
                            rtnstr = itemDB.obj.name + "을(를) 장비하였습니다.";
                        }
                        else if(itemDB.obj.kind === "fishinggut") {
                            tmpitem = fisher.getFishingGut();
                            if(tmpitem !== "") {
                                user.addItem("FunctionalityItem", tmpitem, 1);
                            }
                            fisher.setFishingGut(itemDB.obj.index);
                            user.removeItem(itemDB.kind, itemDB.obj.index, 1);
                            rtnstr = itemDB.obj.name + "을(를) 장비하였습니다.";
                        }
                        else {
                            rtnstr = "낚시에 관련된 아이템이 아닙니다.";
                        }
                    }
                    else {
                        rtnstr = "해당 아이템을 보유하고 있지 않습니다.";
                    }
                }
            }
            C_Manager.SaveUser();
            _SaveMan();

            return rtnstr;
        },
        Remove:function(_id, _itemname) {
            var fisher = _FindMan(_id);
            var user = C_Manager.findUser(_id);
            var rtnstr = "", itemDB, tmpitem = null;

            if(user === null)
                return "유저정보가 없습니다.";

            if(fisher === null) {
                rtnstr = "당신은 낚시꾼 등록이 되지 않았습니다.\n\n 낚시꾼 허가를 받고 다시 시도하시기 바랍니다.";
            }
            else {
                itemDB = db_Manager.getItemByName(_itemname);
                if(itemDB.obj === null) {
                    rtnstr = "존재하지 않는 아이템 입니다.";
                }
                else if(itemDB.kind === "WearItem" || itemDB.kind === "SundryItem") {
                    rtnstr = "낚시와 관련된 아이템이 아닙니다.";
                }
                else {
                        if(itemDB.obj.kind === "fishinglod") {
                            tmpitem = fisher.getFishingLod();
                            if(tmpitem !== "") {
                                user.addItem("FunctionalityItem", tmpitem, 1);
                                fisher.setFishingLod("");
                                rtnstr = itemDB.obj.name + "을(를) 해제하였습니다.";
                            }
                            else {
                                rtnstr = "해당 장비를 이미 착용하고 있지 않습니다.";
                            }
                        }
                        else if(itemDB.obj.kind === "reel") {
                            tmpitem = fisher.getReel();
                            if(tmpitem !== "") {
                                user.addItem("FunctionalityItem", tmpitem, 1);
                                fisher.setReel("");
                                rtnstr = itemDB.obj.name + "을(를) 해제하였습니다.";
                            }
                            else {
                                rtnstr = "해당 장비를 이미 착용하고 있지 않습니다.";
                            }
                        }
                        else if(itemDB.obj.kind === "lure") {
                            tmpitem = fisher.getLure();
                            if(tmpitem !== "") {
                                user.addItem("FunctionalityItem", tmpitem, 1);
                                fisher.setLure("");
                                rtnstr = itemDB.obj.name + "을(를) 해제하였습니다.";
                            }
                            else {
                                rtnstr = "해당 장비를 이미 착용하고 있지 않습니다.";
                            }
                        }
                        else if(itemDB.obj.kind === "fishinggut") {
                            tmpitem = fisher.getFishingGut();
                            if(tmpitem !== "") {
                                user.addItem("FunctionalityItem", tmpitem, 1);
                                fisher.setFishingGut("");
                                rtnstr = itemDB.obj.name + "을(를) 해제하였습니다.";
                            }
                            else {
                                rtnstr = "해당 장비를 이미 착용하고 있지 않습니다.";
                            }
                        }
                        else {
                            rtnstr = "낚시에 관련된 아이템이 아닙니다.";
                        }
                }
            }
            C_Manager.SaveUser();
            _SaveMan();

            return rtnstr;
        },
        FishingStart:function(_id) {
            var fisher = _FindMan(_id);
            var user = C_Manager.findUser(_id);
            var rtnstr = "", ability, fishingDB, getFish, fishDB, rand, splitSize, itemDB;
            var user_loc, facilityDB;

            if(user === null)
                return "유저정보가 없습니다.";

            user_loc = user.getLocation();
            facilityDB = db_Manager.getFacility(user_loc.facility);
            if(facilityDB === null || !facilityDB.action.includes("낚시하기")) {
                rtnstr = "현재 위치에서 낚시가 불가능합니다.";
                return rtnstr;
            }

            if(fisher === null) {
                rtnstr = "당신은 낚시꾼 등록이 되지 않았습니다.\n\n 낚시꾼 허가를 받고 다시 시도하시기 바랍니다.";
            }
            else {
                ability = fisher.getAbility();
                fishingDB = db_Manager.getFishing(user_loc.city, user_loc.facility);
                if(fishingDB === null || fishingDB.length === 0) {
                    rtnstr = "해당 위치에는 물고기가 존재하지 않습니다.";
                }
                else {
                    _DelaySystem(ability.timeterm);

                    getFish = _RandFish(fishingDB, ability.uniquerate);
                    fishDB = db_Manager.getFish(getFish.index, getFish.kind);

                    if(fishDB === null) {
                        rtnstr = "없는 물고기 입니다.";
                    }
                    else {
                        splitSize = fishDB.size.split("~");
                        randSize = Number(libCommon.Randfloat(Number(splitSize[0]), Number(splitSize[1])).toFixed(3));

                        _AddFishRanking(_id, fishDB.index, fishDB.kind, randSize + Number(ability.sizerate), fishDB.grade);
                        user.addItem(fishDB.kind, fishDB.index, 1);
                        itemDB = db_Manager.getItem(fishDB.kind, fishDB.index);
                        rtnstr = "낚시에 성공하였습니다.\n\n" +
                                 " - 이름 : " + itemDB.prefix + " " + itemDB.name + "\n" +
                                 " - 등급 : " + fishDB.grade + "\n" +
                                 " - 크기 : " + _Comma(randSize) + "(+" + _Comma(ability.sizerate) + ")mm";

                        C_Manager.getRecordManager.rcdFishingCount(_id);

                        if(libConst.Fish_Streaming_GRADE.indexOf(fishDB.grade) !== -1){
                            libCommon.AlarmMainRoom(_id + "님이 " + itemDB.prefix + " " + fishDB.grade + "급 " + itemDB.name  + "을(를) 낚으셨습니다.");
                        }
                    }
                }
            }

            C_Manager.SaveUser();
            return rtnstr;
        }
    };
}
