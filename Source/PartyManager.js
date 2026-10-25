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

function PartyManager(_charactor_manager) {
    var C_Manager = _charactor_manager;
    var m_PartyList = [];
    var m_PartyDump = new libCommon.DumpModule();

    var _LoadData, _Find, _FindById, _CreateParty, _MakeJson, _Save, _Delete;
    var _DungeonStart;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["PartyList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            m_PartyList.push(libObject.clsParty(tmpList[idx]));
        }
    }();
    _Find = function(_partyname) {
        var i;
        for (i = 0; i < m_PartyDump.dumpList.length; ++i) {
           if (m_PartyDump.dumpList[i].name === _partyname) {
              m_PartyDump.resetTimeStemp(i);
              return m_PartyDump.dumpList[i];
           }
        }
        for (i = 0; i < m_PartyList.length; ++i) {
           if (m_PartyList[i].name === _partyname) {
              m_PartyDump.addDump(m_PartyList[i]);
              return m_PartyList[i];
           }
        }

        return null;
    };
    _FindById = function(_id) {
        var i;
        for (i = 0; i < m_PartyDump.dumpList.length; ++i) {
           if (m_PartyDump.dumpList[i].isUser(_id)) {
              m_PartyDump.resetTimeStemp(i);
              return m_PartyDump.dumpList[i];
           }
        }
        for (i = 0; i < m_PartyList.length; ++i) {
           if (m_PartyList[i].isUser(_id)) {
              m_PartyDump.addDump(m_PartyList[i]);
              return m_PartyList[i];
           }
        }

        return null;
    };
    _CreateParty = function(_id, _partyname) {
        var obj = {name:_partyname, list:[_id], waiting:[], captain:_id, notice:"", inven:[], rune:0};

        m_PartyList.push(libObject.clsParty(obj));

        _Save();
    };
    _Delete = function(_name) {
        m_PartyDump.clear();
        for (var i = 0; i < m_PartyList.length; ++i) {
           if (m_PartyList[i].name === _name) {
              m_PartyList.splice(i,1);
              break;
           }
        }
        _Save();
    };
    _DeleteUser = function(_id) {
        m_PartyDump.clear();
        var party;
        for (var i = 0; i < m_PartyList.length; ++i) {
            party = m_PartyList[i];

            party.popUser(_id);
            party.removeWaiting(_id);
            if(party.getUserList().length === 0) {
                _Delete(party.name);
            }
            else {
                if(party.getCaptain() === _id) {
                    party.setCaptain(party.getUserList()[0]);
                }
            }
        }
        _Save();
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_PartyList.length; ++i) {
            jsonArray.push(m_PartyList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Party", function() {
                libCommon.write(libConst.fileNameList["PartyList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["PartyList"], _MakeJson());
        }
    };
    

    _DungeonStart = function() {

    };

    return {
        DeleteUser:_DeleteUser,
        MyPartyInfo:function(_id) {
            var party = _FindById(_id);
            var rtnStr = "", users, i;

            if(party === null) {
                rtnStr = "가입된 파티가 없습니다.";
            }
            else {
                rtnStr += "[" + party.name + " 파티]\n\n";
                rtnStr += "  - 파티장 : " + party.getCaptain() + "\n";
                rtnStr += "  - 가입 인원 : " + party.getUserList().length + "/" + libConst.PartyMemberCount + "\n";
                rtnStr += "  (파티원)\n";

                users = party.getUserList();
                for(i = 0; i < users.length; ++i) {
                    rtnStr += "  - " + users[i] + "\n";
                }
                rtnStr += "  (신청 대기 인원)\n";
                users = party.getWaiting();
                for(i = 0; i < users.length; ++i) {
                    rtnStr += "  - " + users[i] + "\n";
                }
                rtnStr += "\n";
            }

            return rtnStr;
        },
        getPartyList:function() {
            var party;
            var rtnStr = "[가입 가능한 파티 목록]\n\n";

            for(var i = 0; i < m_PartyList.length;++i) {
                party = m_PartyList[i];
                if(party.getUserList().length < libConst.PartyMemberCount) {
                    rtnStr += "  - " + party.name + " (" + party.getUserList().length + "명)" + "\n";
                }
            }
            return rtnStr;
        },
        MakeParty:function(_id, _partyname) {
            var party = _FindById(_id);
            var rtnStr = "";

            if(party === null) {
                if(_Find(_partyname) === null) {
                    _CreateParty(_id, _partyname);
                    rtnStr = _partyname + "파티를 신설하였습니다.";
                }
                else {
                    rtnStr = _partyname + "란 이름의 파티가 이미 존재 합니다.";
                }
            }
            else {
                rtnStr = "이미 가입한 파티가 있습니다.";
            }

            return rtnStr;
        },
        RemoveParty:function(_id) {
            var party = _FindById(_id);
            var rtnStr = "";

            if(party === null) {
                rtnStr = "가입된 파티가 없습니다.";
            }
            else {
                if(party.getCaptain() === _id){
                    _Delete(party.name);
                    rtnStr = "파티를 해산하였습니다.";
                }
                else {
                    rtnStr = "당신은 파티장이 아니므로 파티를 해산할 수 없습니다.";
                }
            }
            return rtnStr;
        },
        requestParty:function(_id, _partyname) {
            var userparty = _FindById(_id);
            var party = _Find(_partyname);
            var rtnStr = "";

            if(userparty === null) {
                if(party === null) {
                    rtnStr = "해당 파티명을 가진 파티가 존재 하지 않습니다.";
                }
                else {
                    party.addWaiting(_id);
                    _Save();
                    libCommon.replyID(party.getCaptain(), "[" + _id + "]님이 파티 신청을 하였습니다.\n\n  - !파티수락 [유저아이디]\n  - !파티거절 [유저아이디]");
                    rtnStr = "파티 가입을 신청하였습니다.";
                }
            }
            else {
                rtnStr = "이미 가입한 파티가 있습니다.";
            }
            return rtnStr;
        },
        Response:function(_id, _action, _username) {
            var party = _FindById(_id);
            var userparty = _FindById(_username);
            var rtnStr = "";

            if(party === null) {
                rtnStr = "당신은 가입된 파티가 없습니다.";
            }
            else if(userparty !== null) {
                if(party.name === userparty.name) {
                    rtnStr = _username + "은(는) 이미 파티에 가입되었습니다.";
                }
                else {
                    rtnStr = _username + "은(는) 이미 다른 파티에 가입되었습니다.";
                }
                party.removeWaiting(_username);
            }
            else {
                if(party.getCaptain() === _id){
                    if(party.isWaiting(_username)) {
                        if(party.getUserList().length >= libConst.PartyMemberCount) {
                            rtnStr = "현재 파티의 최대 허용수에 도달하여 파티를 수용할 수 없습니다.";
                        }
                        else {
                            if(_action) {
                                party.pushUser(_username);
                                libCommon.replyID(_username, "[" + party.name + "] 파티에 가입 되었습니다.");
                                rtnStr = _username + "을(를) 가입 수락하였습니다.";
                            }
                            else {
                                libCommon.replyID(_username, "[" + party.name + "] 파티가입이 거절 되었습니다.");
                                rtnStr = _username + "을(를) 가입 거절하였습니다.";
                            }
                        }
                        party.removeWaiting(_username);
                        _Save();
                    }
                    else {
                        rtnStr = _username + "은(는) 가입 대기자가 아닙니다.";
                    }
                }
                else {
                    rtnStr = "당신은 파티장이 아니므로 유저 가입을 수락/거절할 수 없습니다.";
                }
            }
            return rtnStr;
        },
        Ban:function(_id, _username) {
            var party = _FindById(_id);
            var rtnStr = "";

            if(party === null) {
                rtnStr = "당신은 가입된 파티가 없습니다.";
            }
            else if(_id === _username) {
                rtnStr = "본인이 본인을 강퇴시킬 수 없습니다.";
            }
            else {
                if(party.getCaptain() === _id){
                    if(party.isUser(_username)) {
                        party.popUser(_username);
                        _Save();
                        rtnStr = _username + "을(를) 강퇴하였습니다.";
                        libCommon.replyID(_username, "[" + party.name + "] 파티에서 강제퇴장 되었습니다.");
                    }
                    else {
                        rtnStr = _username + "은(는) 파티원이 아니라서 강퇴를 할수가 없습니다.";
                    }
                }
                else {
                    rtnStr = "당신은 파티장이 아니므로 유저 가입을 수락/거절할 수 없습니다.";
                }
            }
            return rtnStr;
        },
        Leave:function(_id) {
            var party = _FindById(_id);
            var rtnStr = "";

            var list;

            if(party === null) {
                rtnStr = "당신은 가입된 파티가 없습니다.";
            }
            else {
                if(party.getCaptain() === _id) {
                    list = party.getUserList();
                    if(list.length === 1) {
                        _Delete(party.name);
                        rtnStr = "파티에 남은 인원이 없어서 해산합니다.";
                    }
                    else {
                        party.popUser(_id);
                        party.setCaptain(list[0]);
                        rtnStr = "파티장을 다른 파티원에게 양도합니다.";
                    }
                    _Save();
                }
                else {
                    party.popUser(_id);
                    _Save();
                    rtnStr = party.name + " 파티를 탈퇴하였습니다.";
                }
            }
            return rtnStr;
        },
        ChangeCaptain:function(_id, _username) {
            var party = _FindById(_id);
            var rtnStr = "";

            if(party === null) {
                rtnStr = "당신은 가입된 파티가 없습니다.";
            }
            else if(_id === _username) {
                rtnStr = "본인이 본인에게 파티장 양도가 불가능합니다.";
            }
            else {
                if(party.getCaptain() === _id){
                    if(party.isUser(_username)) {
                        party.setCaptain(_username);
                        _Save();
                        rtnStr = _username + "에게 파티장을 양도 하였습니다.";
                        libCommon.replyID(_username, "[" + party.name + "] 파티에서 파티장이 되었습니다.");
                    }
                    else {
                        rtnStr = _username + "은(는) 파티원이 아니라서 파티장 양도를 할 수 없습니다.";
                    }
                }
                else {
                    rtnStr = "당신은 파티장이 아니므로 파티장 양도를 할 수 없습니다.";
                }
            }
            return rtnStr;
        },
        isCaptain:function(_id) {
            var party = _FindById(_id);
            var rtnValue = false;

            if(party !== null) {
                if(_id === party.getCaptain()){
                    rtnValue = true;
                }
            }
            return rtnValue;
        },
        getPartyMembers:function(_id) {
            var party = _FindById(_id);
            var rtnValue = [];

            if(party !== null) {
                rtnValue = party.getUserList();
            }
            return rtnValue;
        },
        getCaptain:function(_id) {
            var party = _FindById(_id);
            if(party !== null) {
                return party.getCaptain();
            }
            return "";
        },
        sendMessageByParty:function(_id, _msg) {
            var party = _FindById(_id);
            var list, index;

            if(party !== null) {
                list = JSON.parse(JSON.stringify(party.getUserList()));
                index = list.indexOf(_id);
                list.splice(index, 1);
                libCommon.replyIDbyArray(list, "[파티원 " + _id + "] " + _msg);
            }
        }
    };
}
