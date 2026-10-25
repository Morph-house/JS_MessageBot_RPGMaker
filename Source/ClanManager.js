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

function ClanManager(_charactorManager, _homeworkMgr) {
    const C_OWNER = 1;
    const C_SUB_OWNER = 2;
    const C_ELITE = 3;
    const C_COMMON = 4;

    var m_ClanList = [], m_CManager = _charactorManager, mHWManager = _homeworkMgr;

    var _LoadData, _Find, _CreateClan, _MakeJson, _FindByUserID, _FindClanNameByConquestLoc, _FindByInviteUser, _FindByRequestUser, _RemoveClan, _Save, _DutyStr, _removeAllWaitLine, _Delete;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["ClanList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            m_ClanList.push(libObject.clsClan(tmpList[idx]));
        }
    }();

    _CreateClan = function(_id, _clanname) {
        var clan = {
            name:_clanname,
            clanuser:[{id:_id, duty:C_OWNER, donation:0}],
            inviteuser:[],
            requestuser:[],
            rune:0,
            storage:[],
            conquest:[],
            clancount:1,
            bless: [],
            buff:[],
            godweapon:[],
            isopen:"F"
        };
        m_ClanList.push(libObject.clsClan(clan));
        _Save();
        return m_ClanList[m_ClanList.length - 1];
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_ClanList.length; ++i) {
            jsonArray.push(m_ClanList[i].getJson());
        }
        return jsonArray;
    };
    _Find = function(_clanname) {
        for(var i = 0; i < m_ClanList.length; ++i) {
            if(m_ClanList[i].name === _clanname) {
                return m_ClanList[i];
            }
        }
        return null;
    };
    _FindByUserID = function(_id) {
        for(var i = 0; i < m_ClanList.length; ++i) {
            if(m_ClanList[i].isUser(_id)) {
                return m_ClanList[i];
            }
        }
        return null;
    };
    _FindClanNameByConquestLoc = function(_nation, _city) {
        var rtnValue = "";
        var c_list = null, c_loc;
        for(var i = 0; i < m_ClanList.length; ++i) {
            c_list = m_ClanList[i].getConquestList();

            for(var j = 0; j < c_list.length; ++j) {
                c_loc = c_list[j];
                if(c_loc.nation === _nation && c_loc.city === _city) {
                    rtnValue = m_ClanList[i].name;
                }
            }
            
        }
        return rtnValue;
    };
    _FindByInviteUser = function(_id) {
        var rtnary = [];
        for(var i = 0; i < m_ClanList.length; ++i) {
            if(m_ClanList[i].isInviteUser(_id)) {
                rtnary.push(m_ClanList[i]);
            }
        }
        return rtnary;
    };
    _FindByRequestUser = function(_id) {
        var rtnary = [];
        for(var i = 0; i < m_ClanList.length; ++i) {
            if(m_ClanList[i].isRequestUser(_id)) {
                rtnary.push(m_ClanList[i]);
            }
        }
        return rtnary;
    };
    _RemoveClan = function(_name) {
        for(var i = 0; i < m_ClanList.length; ++i) {
            if(m_ClanList[i].name === _name) {
                m_ClanList.splice(i,1);
            }
        }
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Clan", function() {
                libCommon.write(libConst.fileNameList["ClanList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["ClanList"], _MakeJson());
        }
    };
    _DutyStr = function(_idx) {
        var dutyName;
        switch(_idx) {
            case C_OWNER:
              dutyName = "클랜 마스터";
              break;
            case C_SUB_OWNER:
              dutyName = "클랜 부마스터";
              break;
            case C_ELITE:
              dutyName = "정예 클랜원";
              break;
            default:
              dutyName = "클랜원";
              break;
        }
        return dutyName;
    };
    _removeAllWaitLine = function(_name) {
        var clan = null;
        for(var i = 0; i < m_ClanList.length; ++i) {
            clan = m_ClanList[i];
            clan.removeRequestUser(_name);
            clan.removeInviteUser(_name);
        }
    };

    _Delete = function(_id) {
        var clan = _FindByUserID(_id);
        if(clan !== null) {
            var duty = clan.getDuty(_id);

            if(duty === C_OWNER) {
                if(clan.getClanCount() === 1) {
                    _RemoveClan(clan.name);
                }
                else {
                    clan.removeUser(_id);
                    clan.decClanCount();
                    clan.nextOwner();
                }
            }
            else {
                clan.removeUser(_id);
                clan.decClanCount();
            }
            _Save();
        }
    };

    return {
        Delete:_Delete,
        isMyClan:function(_id) {
            var clan = _FindByUserID(_id);
            if(clan === null)
                return false;
            else
                return true;
        },
        getMyClanName:function(_id) {
            var clan = _FindByUserID(_id);
            if(clan === null)
                return "";
            else
                return clan.name;
        },
        getConquest:function(_id) {
            var clan = _FindByUserID(_id);
            if(clan === null)
                return [];
            else
                return clan.getConquestList();
        },
        getOpenClan:function(_id) {
            var clan = _FindByUserID(_id);
            if(clan === null)
                return false;
            else
                return clan.isOpen();
        },
        getClanConquestByLoc:function(_nation, _city) {
            return _FindClanNameByConquestLoc(_nation, _city);
        },
        MakeClan:function(_id, _clanname) {
            var clan = _Find(_clanname);
            var user = m_CManager.findUser(_id);
            if(clan !== null) {
                return _clanname + " << 클랜명이 존재 합니다. 다른 클랜명을 입력해주시기 바랍니다.";
            }
            clan = _FindByUserID(_id);
            if(clan !== null) {
                return _id + "님은 이미 클랜에 가입되어 있어 클랜 창설을 할수 없습니다.";
            }
            if(user === null) {
                return "생성된 캐릭이 없습니다.";
            }

            clan = _CreateClan(_id, _clanname);
            user.setClanName(_clanname);
            user.setClanBuff(clan.getBuff());
            _removeAllWaitLine(_id);
            m_CManager.SaveUser();
            _Save();
            return _clanname + " 클랜 생성을 완료하였습니다.";
        },
        InviteOriginUser:function(_id, _user) {
            var clan = _FindByUserID(_id);
            var duty = clan.getDuty(_id);
            var rtnStr = "";
            if(clan === null) {
                rtnStr += _id + "님이 창설한 클랜이 없습니다.";
            }
            else {
                if(duty === C_OWNER) {
                    if(m_CManager.isMyCharactor(_user)) {
                        if(_FindByUserID(_user) === null) {
                            if(!clan.isOpen()) {
                                if(clan.InviteUser(_user)) {
                                    _Save();
                                    libCommon.replyID(_user, clan.name + " 클랜에서 창단원으로 초대되었습니다.\n\n  - 수락시 : !수락\n  - 거절시 : !거절");
                                    rtnStr += _user + "님을 클랜 창단원으로 초대하였습니다.";
                                }
                                else {
                                    rtnStr += "이미 초대된 유저입니다.";
                                }
                            }
                            else {
                                rtnStr += "공식 클랜에서는 창립맴버를 요청할 수 없습니다.";
                            }
                        }
                        else {
                            rtnStr += _user + "님은 이미 클랜에 가입되어 있습니다.";
                        }
                    }
                    else {
                        rtnStr += "유저중에 " + _user + "은(는) 존재하지 않습니다.";
                    }
                }
                else {
                    rtnStr += _id + "님은 클랜장이 아닙니다.";
                }
            }
            return rtnStr;
        },
        getMyInvitedList:function(_id) {
            var list = _FindByInviteUser(_id);
            var rtnStr = "[" + _id + "님을 창단원으로 초대한 클랜]\n\n";
            for(var i = 0; i < list.length; ++i) {
                rtnStr += (i+1) + ". " + list[i].name + "\n";
            }
            return rtnStr;
        },
        ResponsOriginUser:function(_id, _response, _clanname) {
            var clan = _Find(_clanname);
            var user = m_CManager.findUser(_id);
            var rtnStr = "";
            if(clan === null) {
                rtnStr += _id + "님이 소속된 클랜이 없습니다.";
                return rtnStr;
            }
            if(_response) {
                if(clan.getClanCount() >= clan.getClanMaxCount())
                {
                    rtnStr += _clanname + " 클랜의 인원이 가득찼습니다.";
                    clan.removeInviteUser(_id);
                }
                else {
                    if(user === null) {
                        return "생성된 캐릭이 없습니다.";
                    }
                    else {
                        if(clan.changeInviteUser(_id, C_SUB_OWNER)) {
                            user.setClanName(_clanname);
                            user.setClanBuff(clan.getBuff());
                            clan.addClanCount();
                            _removeAllWaitLine(_id);
                            rtnStr += _id + "님은 " + _clanname + " 클랜의 창단원이 되셨습니다. 축하드립니다.";

                        }
                        else {
                            rtnStr += _id + "님은 이미 클랜원이거나 해당 클랜에 초대된 적이 없습니다.";
                        }
                    }
                }
            }
            else {
                if(clan.removeInviteUser(_id)) {
                    rtnStr += _id + "님은 " + _clanname + " 클랜요청을 거절하였습니다.";
                }
                else {
                    rtnStr += _id + "님은 해당 클랜에 초대된 적이 없습니다.";
                }
            }
            m_CManager.SaveUser();
            _Save();
            return rtnStr;
        },
        myClanInfo:function(_id) {
            var clan = _FindByUserID(_id);
            var rtnStr = "", i;
            if(clan === null) {
                rtnStr += _id + "님이 소속된 클랜이 없습니다.";
            }
            else {
                var buff = clan.getBuff();
                var users = clan.getUsers();
                var request = clan.getRequestUsers();
                var storage = clan.getStorage();
                var duty = clan.getDuty(_id);
                var conquest = clan.getConquestList();
                var nationInfo = null;
                var cityInfo = null;

                rtnStr += "[" + _id + "님이 가입한 클랜정보]\n\n";
                rtnStr += "- 클랜명 : " + clan.name + "\n";
                rtnStr += "- 클랜장 : " + clan.getUserforDuty(C_OWNER) + "\n";
                rtnStr += "- 인원수 : " + clan.getClanCount() + "/" + clan.getClanMaxCount() + "\n";
                rtnStr += "- 공식 여부 : " + (clan.isOpen()?"공식클랜":"비공식클랜") + "\n";
                rtnStr += "- 보유룬 : " + clan.getRune() + " rune\n\n";
                rtnStr += "  (내 정보)\n";
                rtnStr += "   L 직위 : " + _DutyStr(duty) + "\n";
                rtnStr += "   L 기부점수 : " + clan.getDonation(_id) + " 점\n\n";

                rtnStr += "  (점령 구역)\n";
                for(i = 0; i < conquest.length; ++i) {
                    nationInfo = db_Manager.getNation(conquest[i].nation);
                    cityInfo = db_Manager.getCity(conquest[i].city);
                    rtnStr += "   L " + nationInfo.name + " > " + cityInfo.name + "\n";
                }
                rtnStr += "\n";


                rtnStr += "  (클랜 버프)\n";
                for(i = 0; i < buff.length; ++i) {
                    rtnStr += "   L " + buff[i].target + " : +" + buff[i].percent + "%\n";
                }
                rtnStr += "\n";

                rtnStr += "  (클랜 창고)\n";
                for(i = 0; i < storage.length; ++i) {
                    rtnStr += "   L " + db_Manager.getItem(storage[i].kind, storage[i].index).name + " x " + storage[i].count + "\n";
                }
                rtnStr += "\n";

                rtnStr += "  (클랜원)\n";
                for(i = 0; i < users.length; ++i) {
                    rtnStr += "   L " + users[i].id + " - " + _DutyStr(clan.getDuty(users[i].id)) + "\n";
                }
                rtnStr += "\n";

                rtnStr += "  (클랜 대기 인원)\n";
                for(i = 0; i < request.length; ++i) {
                    rtnStr += "   L " + request[i] + "\n";
                }
            }
            return rtnStr;
        },
        GiveClanRune:function(_id, _rune) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_id);
            var rtnStr = "", i;
            if(clan === null) {
                rtnStr += _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(user === null) {
                rtnStr = "생성된 캐릭이 없습니다.";
            }
            else {
                if(user.addRune(-_rune)){
                    clan.addRune(_rune);
                    clan.setDonation(_id, _rune);
                    m_CManager.SaveUser();
                    m_CManager.getRecordManager.rcdClanGiveRune(_id, _rune);
                    _Save();
                    rtnStr += "클랜에 " + _rune + " rune을 기부하였습니다.";
                }
                else {
                    rtnStr += "기부할 룬이 부족합니다.\n" + "현재 보유 룬 : " + user.getRune() + " rune";
                }
            }
            return rtnStr;
        },
        GiveClanItem:function(_id, _count, _itemname) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_id);
            var rtnStr = "", i;
            var findItem = db_Manager.Search(_itemname, "SUNDRYITEM", "name");
            if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(user === null) {
                rtnStr = "생성된 캐릭이 없습니다.";
            }
            else if(findItem === null) {
                rtnStr = "[" + _itemname + "] 아이템은 존재하지 않거나, 기부할수 없는 아이템 종류 입니다. (잡템류만 기부할 수 있습니다.)";
            }
            else {
                if(user.removeItem("SundryItem", findItem.index, _count)){
                    clan.addItem("SundryItem", findItem.index, _count);
                    clan.setDonation(_id, (Number(findItem.needrune) * _count));
                    m_CManager.SaveUser();
                    m_CManager.getRecordManager.rcdClanGiveItem(_id, _count);
                    _Save();
                    rtnStr += "클랜에 " + findItem.name + " x " + _count + " 개 기부하였습니다.";
                }
                else {
                    rtnStr += "기부할 아이템이 부족합니다.\n가방을 확인해 주시기 바랍니다.";
                }
            }
            return rtnStr;
        },
        ConfirmClan:function(_id) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_id);
            var user_loc, facilityDB;
            var rtnStr = "";
            if(clan === null) {
                rtnStr += _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(user === null) {
                rtnStr = "생성된 캐릭이 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("클랜인증")) {
                    rtnStr = "현재위치에서는 클랜을 인증할수 없습니다.";
                    return rtnStr;
                }
                if(!clan.isOpen()) {
                    if(clan.getDuty(_id) === C_OWNER){
                        if(clan.addRune(-libConst.ClanConfirmRune)) {
                            clan.openClan();
                            rtnStr += clan.name + " 클랜은 공식 클랜이 되었습니다.\n앞으로 클랜 시설들을 업그레이드가 가능합니다.";
                            _Save();
                        }
                        else {
                            rtnStr += "클랜 보유 룬이 부족합니다.\n  - 현재 클랜보유 룬 : " + clan.getRune() + " rune\n  - 필요 인증 룬 : " + libConst.ClanConfirmRune + " rune";
                        }
                    }
                    else {
                        rtnStr += _id + " 님은 클랜장이 아닙니다.";
                    }
                }
                else {
                    rtnStr += clan.name + " 클랜은 이미 공식 클랜 입니다.";
                }
            }
            return rtnStr;
        },
        getClanList:function() {
            var rtnStr = "[공식 클랜 리스트]\n\n";
            var clan = null;
            for(var i = 0; i < m_ClanList.length; ++i) {
                clan = m_ClanList[i];
                if(clan.isOpen())
                    rtnStr += "  - " + clan.name + " (" + clan.getClanCount() + "/" + clan.getClanMaxCount() + ")\n";
            }
            return rtnStr;
        },
        requestClan:function(_id, _clanname) {
            var clan = _Find(_clanname);
            var my_clan = _FindByUserID(_id);
            var rtnStr = "";
            if(clan === null) {
                rtnStr = _clanname + " 클랜은 존재 하지 않습니다.";
            }
            else if(my_clan !== null) {
                rtnStr = _id + " 님은 이미 클랜에 가입되어 있습니다.";
            }
            else {
                if(clan.isOpen()) {
                    if(clan.requestUser(_id)) {
                        rtnStr = "해당 클랜에 가입 신청 완료 하였습니다. 운영자가 수락 시 가입이 완료 됩니다.";
                        _Save();
                    }
                    else {
                        rtnStr = "이미 신청 완료한 클랜 입니다.";
                    }
                }
                else {
                    rtnStr = _clanname + " 클랜은 공식 클랜이 아니라서 신청이 불가능합니다.";
                }

            }
            return rtnStr;
        },
        requestClanList:function(_id) {
            var clanlist = _FindByRequestUser(_id);
            var rtnStr = "[내가 신청한 클랜 리스트]\n\n";
            for(var i = 0; i < clanlist.length; ++i) {
                rtnStr += "  - " + clanlist[i].name + "\n";
            }
            return rtnStr;
        },
        recruitUser:function(_id, _user) {
            var clan = _FindByUserID(_id);
            var duty = clan.getDuty(_id);
            var recr_user = m_CManager.findUser(_user);
            var rtnStr = "[영입 결과]\n\n";
            if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(recr_user === null) {
                rtnStr = _user + "은(는) 없는 유저입니다.";
            }
            else {
                if(clan.isOpen()) {
                    if(duty === C_OWNER || duty === C_SUB_OWNER) {
                        if(clan.isRequestUser(_user)) {
                            if(clan.changeRequestUser(_user, C_COMMON)) {
                                if(clan.remainCount()) {
                                    recr_user.setClanName(clan.name);
                                    recr_user.setClanBuff(clan.getBuff());
                                    clan.addClanCount();
                                    _removeAllWaitLine(_user);
                                    rtnStr = _user + "님은 " + clan.name + " 클랜원이 되었습니다.";
                                    libCommon.replyID(_user, clan.name + " 클랜원이 되었습니다. 축하드립니다.");
                                    m_CManager.SaveUser();
                                    _Save();
                                }
                                else {
                                    rtnStr = "클랜 인원이 가득차서 더이상 클랜원을 받을수 없습니다.";
                                }
                            }
                            else {
                                rtnStr = _user + "님은 이미 " + clan.name + " 클랜의 클랜원입니다.";
                            }
                        }
                        else {
                            rtnStr = _user + "은(는) 가입 신청자가 아닙니다.";
                        }
                    }
                    else {
                        rtnStr = _id + " 님은 클랜장 또는 부 클랜장이 아닙니다.";
                    }
                }
                else {
                    rtnStr = "현재 공식 클랜이 아니라서 영입이 불가능합니다.";
                }
            }
            return rtnStr;
        },
        leaveClan:function(_id) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_id);
            var duty = clan.getDuty(_id);
            var rtnStr = "";
            if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else {
                if(duty === C_OWNER) {
                    if(clan.getClanCount() === 1) {
                        user.setClanName("");
                        user.removeClanBuff();
                        _RemoveClan(clan.name);
                        rtnStr = "남은 클랜원이 없어서" + clan.name + "클랜을 삭제합니다.";
                        m_CManager.SaveUser();
                        _Save();
                    }
                    else {
                        rtnStr = "클랜장은 클랜장 양도 후 탈퇴가 가능합니다.";
                    }

                }
                else {
                    clan.removeUser(_id);
                    clan.decClanCount();
                    user.setClanName("");
                    user.removeClanBuff();
                    rtnStr = clan.name + " 클랜에서 탈퇴하였습니다.";
                    m_CManager.SaveUser();
                    _Save();
                }
            }
            return rtnStr;
        },
        banishClan:function(_id, _user) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_user);
            var duty = clan.getDuty(_id);
            var rtnStr = "";
            if(_id === _user) {
                rtnStr = "본인이 본인을 탈퇴시킬 수 없습니다.";
            }
            else if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(user === null) {
                rtnStr = _user + "은(는) 없는 유저입니다.";
            }
            else {
                if(duty === C_OWNER || duty === C_SUB_OWNER) {
                    if(clan.removeUser(_user)) {
                        clan.decClanCount();
                        user.setClanName("");
                        user.removeClanBuff();
                        rtnStr = _user + "을(를) " + clan.name + " 클랜에서 추방하였습니다.";
                        m_CManager.SaveUser();
                        _Save();
                    }
                    else {
                        rtnStr = _user + "은(는) 클랜원이 아닙니다.";
                    }
                }
                else {
                    rtnStr = "클랜원 추방에 대한 권한이 없습니다.";
                }
            }
            return rtnStr;
        },
        promoteUser:function(_id, _user) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_user);
            if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(user === null) {
                rtnStr = _user + "은(는) 없는 유저입니다.";
            }
            else {
                var plus_duty = clan.getDuty(_user) - 1;
                if(clan.getDuty(_id) === C_OWNER || clan.getDuty(_id) === C_SUB_OWNER) {
                    if(plus_duty === 0) {
                        rtnStr = "클랜 마스터는 더이상 진급시킬 수 없습니다.";
                    }
                    else if(plus_duty === C_OWNER) {
                        rtnStr = "클랜 마스터로 진급시킬 수 없습니다.";
                    }
                    else {
                        if(clan.setDuty(_user, plus_duty)) {
                            rtnStr = _user + "을(를) " + _DutyStr(plus_duty) + "로 진급시켰습니다.";
                            _Save();
                        }
                        else {
                            rtnStr = _user + "은(는) 클랜원이 아닙니다.";
                        }
                    }
                }
                else {
                    rtnStr = "클랜원 진급에 대한 권한이 없습니다.";
                }
            }
            return rtnStr;
        },
        demoteUser:function(_id, _user) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_user);
            if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(user === null) {
                rtnStr = _user + "은(는) 없는 유저입니다.";
            }
            else {
                var plus_duty = clan.getDuty(_user) + 1;
                if(clan.getDuty(_id) === C_OWNER || clan.getDuty(_id) === C_SUB_OWNER) {
                    if(plus_duty === C_SUB_OWNER) {
                        rtnStr = "클랜 마스터는 강등시킬 수 없습니다.";
                    }
                    else if(plus_duty === 5) {
                        rtnStr = "일반 클랜원은 더이상 강등 시킬수 없습니다.";
                    }
                    else {
                        if(clan.setDuty(_user, plus_duty)) {
                            rtnStr = _user + "을(를) " + _DutyStr(plus_duty) + "로 강등시켰습니다.";
                            _Save();
                        }
                        else {
                            rtnStr = _user + "은(는) 클랜원이 아닙니다.";
                        }
                    }
                }
                else {
                    rtnStr = "클랜원 강등에 대한 권한이 없습니다.";
                }
            }
            return rtnStr;
        },
        transferClan:function(_id, _user) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_user);
            if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(user === null) {
                rtnStr = _user + "은(는) 없는 유저입니다.";
            }
            else {
                if(clan.getDuty(_id) === C_OWNER) {

                    if(clan.setDuty(_user, C_OWNER)) {
                        rtnStr = _user + "에게 클랜을 양도하였습니다.";
                        libCommon.replyID(_user, clan.name + " 클랜을 양도 받았습니다.");
                        clan.setDuty(_id, C_COMMON);
                        _Save();
                    }
                    else {
                        rtnStr = _user + "은(는) 클랜원이 아닙니다.";
                    }

                }
                else {
                    rtnStr = "클랜 양도에 대한 권한이 없습니다.";
                }
            }
            return rtnStr;
        },
        Menufacture:function(_id, _count, _itemname) {
            var clan = _FindByUserID(_id);
            var user = m_CManager.findUser(_id);
            var findItem = db_Manager.Search(_itemname, "SUNDRYITEM", "name");
            var user_loc, facilityDB, itemList, isFlag = false, possible = true, menufactureObj, materialList;
            var rtnStr = "";
            if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(findItem === null) {
                rtnStr = "존재하지 않는 아이템 입니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("클랜합성")) {
                    rtnStr = "현재위치에서는 클랜 합성을 할수 없습니다.";
                    return rtnStr;
                }

                var duty = clan.getDuty(_id);

                if(clan.isOpen()) {
                    itemList = db_Manager.getMenufactureList(user_loc.city, user_loc.facility, libConst.ITEM_KIND.SUNDRYITEM);
                    for(i = 0; i < itemList.length; ++i) {
                        if(itemList[i].index === findItem.index) {
                            isFlag = true;
                            break;
                        }
                    }
                    if(isFlag) {
                        if(duty === C_OWNER || duty === C_SUB_OWNER) {
                            menufactureObj = db_Manager.getMenufacture(findItem.index, libConst.ITEM_KIND.SUNDRYITEM);
                            materialList = menufactureObj.material;
                            for(i = 0; i < materialList.length; ++i) {
                                if(clan.getItemCount(materialList[i].itemkind, materialList[i].itemIdx) < (Number(materialList[i].count) * _count) || clan.getRune() < (Number(menufactureObj.needrune) * _count)) {
                                    possible = false;
                                    break;
                                }
                            }

                            if(possible) {
                                clan.addItem(menufactureObj.itemkind, menufactureObj.index, _count);
                                for(var j = 0; j < materialList.length; ++j) {
                                    clan.removeItem(materialList[j].itemkind, materialList[j].itemIdx, Number(materialList[j].count) * _count);
                                }
                                clan.addRune(-(Number(menufactureObj.needrune) * _count));
                                rtnStr = "제조를 완료하였습니다.";
                                _Save();
                            }
                            else {
                                rtnStr = "제조를 실패하였습니다. - 룬과 재료갯수를 확인 바랍니다.";
                            }
                        }
                        else {
                            rtnStr = "아이템 합성에 대한 권한이 없습니다.";
                        }
                    }
                    else {
                        rtnStr = "해당 아이템은 제조 리스트에 없습니다.";
                    }
                }
                else {
                    rtnStr = "비공식 클랜에서는 합성을 할수 없습니다.";
                }
            }
            return rtnStr;
        },
        getBlessList:function(_id) {
            var rtnStr = "[축복 리스트]\n\n";
            var bless, blessList = db_Manager.getClanBuffList();
            var user = m_CManager.findUser(_id);
            var user_loc, facilityDB;
            if(user === null) {
                rtnStr = "유저정보가 없습니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("클랜축복")) {
                    rtnStr = "현재위치에서는 클랜 축복을 할수 없습니다.";
                    return rtnStr;
                }

                for(var i = 0; i < blessList.length; ++i) {
                    bless = blessList[i];
                    if(bless.kind === "ability")
                        rtnStr += "  - " + bless.name + "\n    L " + bless.buffname + " 능력치를 향상\n";
                    else if(bless.kind === "clan")
                        rtnStr += "  - " + bless.name + "\n    L 클랜원 한도를 늘려줌\n";
                    else if(bless.kind === "vitality")
                        rtnStr += "  - " + bless.name + "\n    L " + bless.buffname + " 능력치를 향상\n";
                }
            }
            return rtnStr;
        },
        setBless:function(_id, _blessname) {
            var clan = _FindByUserID(_id);
            var duty = clan.getDuty(_id);
            var user = m_CManager.findUser(_id);
            var bless = db_Manager.getClanBuffbyName(_blessname);
            var user_loc, facilityDB, currblesslevel, rate, rune, item;
            var rtnStr = "", clanUsers, cu;
            if(clan === null) {
                rtnStr = _id + "님이 소속된 클랜이 없습니다.";
            }
            else if(bless === null) {
                rtnStr = _blessname + " 라는 버프는 없습니다. 다시 확인하시기 바랍니다.";
            }
            else {
                user_loc = user.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("클랜축복")) {
                    rtnStr = "현재위치에서는 클랜 축복을 할수 없습니다.";
                    return rtnStr;
                }

                if(clan.isOpen()) {
                    if(duty === C_OWNER || duty === C_SUB_OWNER) {
                        currblesslevel = clan.getBlesslevel(bless.index);
                        rate = bless.rate[currblesslevel];
                        rune = bless.needrune[currblesslevel];
                        item = bless.needitem[currblesslevel];

                        if(clan.getItemCount(item.kind, item.index) < Number(item.count) || clan.getRune() < Number(rune)) {
                            rtnStr = "클랜 축복을 실패하였습니다. - 룬과 재료갯수를 확인 바랍니다.";
                        }
                        else {
                            clan.removeItem(item.kind, item.index, Number(item.count));
                            clan.addRune(-Number(rune));
                            clan.setBless(bless.index);
                            clanUsers = clan.getUsers();
                            for(var i = 0; i < clanUsers.length; ++i) {
                                cu = m_CManager.findUser(clanUsers[i].id);
                                if(cu !== null) {
                                    cu.setClanBuff(clan.getBuff());
                                }
                            }

                            rtnStr = "클랜 축복을 완료하였습니다.";
                            m_CManager.SaveUser();
                            _Save();
                        }
                    }
                    else {
                        rtnStr = "클랜 축복에 대한 권한이 없습니다.";
                    }
                }
                else {
                    rtnStr = "비공식 클랜에서는 축복을 받을 수 없습니다.";
                }
            }
            return rtnStr;
        },
        removeAllConquestLock:function() {
            for(var i = 0; i < m_ClanList.length; ++i) {
                m_ClanList[i].setConquestLock(false);
            }
            _Save();
        },
        setConquest:function(_nation, _city) {
            var t_clan, t_conquest, isconquest = false;
            var rtnStr = "";
            for(var i = 0; i < m_ClanList.length; ++i) {
                t_clan = m_ClanList[i];
                t_conquest = t_clan.getLockedConquest(_nation, _city);
                if(t_conquest !== null) {
                    isconquest = true;
                    break;
                }
            }

            if(isconquest) {
                rtnStr += "이미 다른 클랜이 해당 점령지를 점령하였습니다.\n";
            }
            else {
                t_clan.addConquest(_nation, _city);
                rtnStr += "해당 점령지를 점령하였습니다. 축하합니다.\n";
            }
            _Save();
            
            return rtnStr;
        }
        
    };
}
