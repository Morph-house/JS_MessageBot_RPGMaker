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

function LoginManager() {

    var m_userList = []; //Object.clsUserInfo 객체를 가지는 배열

    var _LoadData, _Contain, _FindByAuthCode, _FindByAuthSubRoom, _FindByAuthSubRoomWithoutRoomName, _MakeKey, _MakeJson, _ConfirmKey, _Save;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["UserList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            m_userList.push(libObject.clsUserInfo(tmpList[idx]));
        }
    }();

    _Contain = function(_id) {
       for (var i = 0; i < m_userList.length; ++i) {
          if (m_userList[i].id === _id) {
             return i;
          }
       }
       return -1;
    };
    _FindByAuthCode = function(_code) {
        for (var i = 0; i < m_userList.length; ++i) {
            if (m_userList[i].equalAuthCode(_code)) {
               return m_userList[i];
            }
         }
         return null;
    };
    _FindByAuthSubRoom = function(_id, _roomname, _image) {
        for (var i = 0; i < m_userList.length; ++i) {
            if (m_userList[i].equalSubRoom(_id, _roomname, _image)) {
               return m_userList[i];
            }
         }
         return null;
    };
    _FindByAuthSubRoomWithoutRoomName = function(_id, _image) {
        for (var i = 0; i < m_userList.length; ++i) {
            if (m_userList[i].equalSubRoomWithoutRoom(_id, _image)) {
               return m_userList[i];
            }
         }
         return null;
    };
    _MakeKey = function(_sender, _img) {
        var tempstr = _sender + _img;
        return tempstr.substring(0, 1024);
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_userList.length; ++i) {
            jsonArray.push(m_userList[i].getJson());
        }
        return jsonArray;
    };
    _ConfirmKey = function(_idx, _sender, _img) {
       var user = m_userList[_idx];
       return user.equalKey(_MakeKey(_sender, _img));
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("User", function() {
                libCommon.write(libConst.fileNameList["UserList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["UserList"], _MakeJson());
        }
    };

    return {
        contain: function(_id) {
            return _Contain(_id);
        },
        insert: function(_id, _pw, _sender, _image) {
           if (_Contain(_id) === -1) {
                var obj = {};
                obj.id = _id;
                obj.pwd = _pw;
                obj.mainroom = {authcode:null, roomname:null, key:null, id:null};
                obj.key = _MakeKey(_sender, _image);
                obj.shortcut = {};
                obj.logintime = -1;
                obj.sleepaccount = "N";

                m_userList.push(libObject.clsUserInfo(obj));
                _Save();

                return true;
           } else
                return false;
        },
        ispassword: function(_id, _pw) {
            var index = _Contain(_id);
            if (index !== -1) {
                if (m_userList[index].equal({id:_id,pwd:_pw})) {
                    return true;
                }
            }
           return false;
        },
        changepw: function(_id, _pw, _newpw, _sender, _image) {
           var index = _Contain(_id);
           if (index === -1) {
              return 1;
           }
           else {
              if (!m_userList[index].equal({id:_id,pwd:_pw})) {
                 return 2;
              }
              else if(!_ConfirmKey(index, _sender, _image)) {
                 return 3;
              }
              else {
                 m_userList[index].changePwd(_newpw);
                 _Save();
                 return 0;
              }
           }
        },
        login:function(_id, _pw, _sender, _image) {
            var index = _Contain(_id);
            if (index === -1) {
                return false;
            }
            else {
                if (!m_userList[index].equal({id:_id,pwd:_pw})) {
                   return false;
                }
                else if(!_ConfirmKey(index, _sender, _image)) {
                   return false;
                }
                else {
                   m_userList[index].setState(true);
                   m_userList[index].setLoginTime();
                   _Save();
                   return true;
                }
            }
        },
        logout:function(_id, _sender, _image) {
            var index = _Contain(_id);
            if (index === -1) {
                return false;
            }
            else {
                if(!_ConfirmKey(index, _sender, _image)) {
                   return false;
                }
                else {
                   m_userList[index].setState(false);
                   return true;
                }
            }
        },
        loginfo:function(_id) {
            var index = _Contain(_id);
            var rtnstr = "", currTime, preTime, remainTime, day, hour, min, sec;
            if (index === -1) {
                rtnstr = "생성된 계정이 없습니다.";
            }
            else {
                var user = m_userList[index];
                currTime = user.getLoginTime();
                preTime = user.getBeforeLoginTime();
                remainTime = Number(currTime) - Number(preTime);
                day = Math.floor(remainTime / (1000 * 60 * 60 * 24));
                remainTime -= (day * 1000 * 60 * 60 * 24);
                hour = Math.floor(remainTime / (1000 * 60 * 60));
                remainTime -= (hour * 1000 * 60 * 60);
                min = Math.floor(remainTime / (1000 * 60 ));
                remainTime -= (min * 1000 * 60 );
                sec = Math.floor(remainTime / (1000));

                rtnstr += "id : " + user.id + "\n";
                rtnstr += "login 상태 : " + (user.loginstate()?"접속 중":"미접속") + "\n";
                if(preTime === -1) {
                    rtnstr += "이전 로그인 시간이 없습니다.";
                }
                else {
                    rtnstr += day + "일 " + hour + "시간 " + min + "분 " + sec + "초 만에 로그인 하였습니다.";
                }

            }
            return rtnstr;
        },
        islogin:function(_id) {
            var index = _Contain(_id);
            if (index === -1) {
                return false;
            }
            return m_userList[index].loginstate();
        },
        comparekey:function(_id, _sender, _image) {
            var index = _Contain(_id);
            if (index === -1) {
                return false;
            }
            if(_ConfirmKey(index, _sender, _image)) {

                return true;
            }
            return false;
        },
        setKey:function(_id, _pw, _sender, _image) {
            var index = _Contain(_id);
            var rtnstr = "";
            if (index === -1) {
                rtnstr = "해당 계정이 존재 하지 않습니다.";
            }
            else {
                if (!m_userList[index].equal({id:_id,pwd:_pw})) {
                   rtnstr = "패스워드가 틀립니다.";
                }
                else {
                    m_userList[index].setKey(_MakeKey(_sender, _image));
                    _Save();
                    rtnstr = "현재 키를 등록하였습니다.";
                }
            }

            return rtnstr;
        },
        getShortCutList:function(_id) {
            var index = _Contain(_id);
            var rtnvalue = {};
            if (index !== -1) {
                rtnvalue = m_userList[index].getAllShortCut();
            }
            return rtnvalue;
        },
        getShortCut:function(_id, _index) {
            var index = _Contain(_id);
            var rtnvalue = [];
            if (index !== -1) {
                rtnvalue = m_userList[index].getShortCut(_index);
                if(rtnvalue === undefined)
                    rtnvalue = [];
            }
            return rtnvalue;
        },
        addShortCut:function(_id, _command, _text) {
            var index = _Contain(_id);
            var rtnstr = "";
            if (index === -1) {
                rtnstr = "해당 계정이 존재 하지 않습니다.";
            }
            else {
                if(m_userList[index].addShortCut(_command, _text)) {
                    _Save();
                    rtnstr = "해당 명령어를 설정하였습니다.";
                }
                else {
                    rtnstr = "해당 단축키에 명령어 갯수가 포화되어 더이상 담을수 없습니다.\n\n 최대 갯수 : " + libConst.ShortCutCount;
                }
            }
            return rtnstr;
        },
        removeShortCut:function(_id, _command) {
            var index = _Contain(_id);
            var rtnstr = "";
            if (index === -1) {
                rtnstr = "해당 계정이 존재 하지 않습니다.";
            }
            else {
                m_userList[index].clearShortCut(_command);
                _Save();
                rtnstr = "해당 명령어를 삭제하였습니다.";
            }
            return rtnstr;
        },
        getLoginTime:function(_id) {
            var index = _Contain(_id);
            var currTime, preTime, remainTime, day;
            if(index === -1) {
                return "해당 유저는 없는 유저입니다.";
            }
            else {
                var user = m_userList[index];
                currTime = (new Date()).getTime();
                preTime = user.getLoginTime();
                remainTime = Number(currTime) - Number(preTime);
                day = Math.floor(remainTime / (1000 * 60 * 60 * 24));

                if(preTime === -1) {
                    return "로그인한적이 없음";
                }
                else {
                    return day + "일 전에 로그인 함";
                }
            }
        },
        getUserByLoginDate:function(_day) {
          var rtnvalue = [], preTime, remainTime, u_date;
          var currTime = (new Date()).getTime();
          for(var i = 0; i < m_userList.length; ++i) {

              preTime = m_userList[i].getLoginTime();
              remainTime = Number(currTime) - Number(preTime);
              u_date = Math.floor(remainTime / (1000 * 60 * 60 * 24));
              if(preTime === -1){
                  rtnvalue.push(m_userList[i].id);
              }
              else if(u_date >= _day) {
                  rtnvalue.push(m_userList[i].id);
              }
          }
          return rtnvalue;
        },
        setSleepAccount:function(_id, _issleep) {
            var index = _Contain(_id);
            if(index !== -1) {
                m_userList[index].setSleepAccount(_issleep);
                _Save();
            }
        },
        getSleepAccount:function(_id) {
            var index = _Contain(_id);
            if(index !== -1) {
                return m_userList[index].getSleepAccount();
            }
            return null;
        },
        makeAuthCode:function(_id, _image) {
            var index = _Contain(_id), authcode;
            if(index === -1) {
                return "";
            }
            else {
                authcode = java.lang.String(_id + (new Date()).getTime() + _image).hashCode();
                m_userList[index].setAuthCode(authcode);
                _Save();
                return authcode;
            }
        },
        ConfirmAutoCode:function(_code, _id, _roomname, _image) {
            var obj = _FindByAuthCode(_code);
            if(obj === null) {
                return "매칭되는 인증 코드 계정이 없습니다.";
            }
            else {
                obj.setAuthMainInfo(_id, _roomname, _MakeKey(_id, _image));
                _Save();
                return "매칭에 완료하였습니다.";
            }
        },
        checkSubRoom:function(_id, _roomname, _image) {
            var obj = _FindByAuthSubRoom(_id, _roomname, _MakeKey(_id, _image));
            if(obj === null) {
                return false;
            }
            else {
                return true;
            }
        },
        checkSubRoomWithoutRoomname:function(_id, _image) {
            var obj = _FindByAuthSubRoomWithoutRoomName(_id, _MakeKey(_id, _image));
            if(obj === null) {
                return false;
            }
            else {
                return true;
            }
        },
        getMyIDBySubRoom:function(_id, _roomname, _image) {
            var obj = _FindByAuthSubRoom(_id, _roomname, _MakeKey(_id, _image));
            if(obj === null) {
                return null;
            }
            else {
                return obj.id;
            }
        }
    };
}
