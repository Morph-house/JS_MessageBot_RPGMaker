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

function RelationManager() {
    var m_FriendList = [];

    var _LoadData, _FindFollowing, _FindFollower, _Find, _Delete, _Save;

    _LoadData = function() {
        m_FriendList = libCommon.read(libConst.fileNameList["RelationList"]);
    }();

    _FindFollowing = function(_id) {
        var rtnArray = [];
        for(var i = 0; i < m_FriendList.length; ++i) {
            if(m_FriendList[i].name === _id) {
                rtnArray.push(m_FriendList[i].follow);
            }
        }

        return rtnArray;
    };

    _FindFollower = function(_id) {
        var rtnArray = [];
        for(var i = 0; i < m_FriendList.length; ++i) {
            if(m_FriendList[i].follow === _id) {
                rtnArray.push(m_FriendList[i].name);
            }
        }
        return rtnArray;
    };
    _Find = function(_id, _follow) {
        for(var i = 0; i < m_FriendList.length; ++i) {
            if(m_FriendList[i].name === _id && m_FriendList[i].follow === _follow) {
                return i;
            }
        }
        return -1;
    };
    _Delete = function(_id) {
        for(var i = m_FriendList.length - 1; i >= 0; --i) {
            if(m_FriendList[i].name === _id || m_FriendList[i].follow === _id) {
                m_FriendList.splice(i,1);
            }
        }
        _Save();
    };

    _Save = function() {
        
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Relation", function() {
                libCommon.write(libConst.fileNameList["RelationList"], m_FriendList);
            });
        }
        else {
            libCommon.write(libConst.fileNameList["RelationList"], m_FriendList);
        }
    };

    return {
        Delete:function(_id) {
            _Delete(_id);
        },
        addRelation:function(_id, _follow){
            var idx = _Find(_id, _follow);
            if(idx !== -1){
                return false;
            }

            m_FriendList.push({name:_id, follow:_follow});
            _Save();
            return true;
        },
        removeRelation:function(_id, _follow){
          var idx = _Find(_id, _follow);
          if(idx === -1){
                return false;
            }

            m_FriendList.splice(idx,1);
            _Save();
            return true;
        },
        getFollower:function(_id) {
            return _FindFollower(_id);
        },
        getFollowing:function(_id) {
            return _FindFollowing(_id);
        }
    };
}
