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

function PetManager() {
    var m_PetList = [];
    var m_PetDump = new libCommon.DumpModule();

    var _LoadData, _Find, _CreatePet, _RandBuff, _MakeJson, _Save, _Delete;

    _LoadData = function() {
        var tmpList = libCommon.read(libConst.fileNameList["PetList"]);
        for(var idx = 0; idx < tmpList.length; ++idx) {
            m_PetList.push(libObject.clsPet(tmpList[idx]));
        }
    }();
    _Find = function(_id) {
        var i;
        for (i = 0; i < m_PetDump.dumpList.length; ++i) {
           if (m_PetDump.dumpList[i].name === _id) {
              m_PetDump.resetTimeStemp(i);
              return m_PetDump.dumpList[i];
           }
        }
        for (i = 0; i < m_PetList.length; ++i) {
           if (m_PetList[i].name === _id) {
              m_PetDump.addDump(m_PetList[i]);
              return m_PetList[i];
           }
        }

        return null;
    };
    _CreatePet = function(_id, _petname) {
        var obj = {name:_id, petname:_petname, inventory:[], buff:[], familiarity:0, conversationtime:-1};

        m_PetList.push(libObject.clsPet(obj));

        _Save();
    };

    _RandBuff = function(_familiarity) {
        var p_buffs = db_Manager.getAllPetBuff();
        var buffDBCnt = p_buffs.length;

        var ConstFamiliarity = libConst.Pet_Buff_Familiarity;
        var buffCnt = 0, r_amount, db, split_amount;
        var tmpRand, preRate, currRate;
        var result = [];

        for(var c = 0; c < ConstFamiliarity.length; ++c ) {
            if(ConstFamiliarity[c] <= _familiarity)
                buffCnt++;
        }

        for(var i = 0; i < buffCnt; ++i) {
            tmpRand = libCommon.Randfloat(0,100);
            preRate = 0;
            currRate = 0;
            for(var m = 0; m < buffDBCnt; ++m) {
                preRate += (m===0?0:Number(p_buffs[m - 1].rate));
                currRate += Number(p_buffs[m].rate);
                if(tmpRand >= preRate && tmpRand < currRate) {
                    db = db_Manager.getPetBuffByIdx(p_buffs[m].index);
                    break;
                }
            }

            split_amount = db.amount.split("~");
            r_amount = libCommon.Rand(Number(split_amount[0]), Number(split_amount[1]));

            result.push({index:db.index, kind:db.kind, amount:r_amount});
        }
        return result;
    };

    _Delete = function(_id) {
        m_PetDump.clear();
        for (var i = 0; i < m_PetList.length; ++i) {
           if (m_PetList[i].name === _id) {
              m_PetList.splice(i,1);
              break;
           }
        }
        _Save();
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_PetList.length; ++i) {
            jsonArray.push(m_PetList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Pet", function() {
                libCommon.write(libConst.fileNameList["PetList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["PetList"], _MakeJson());
        }
    };

    return {
        Find:_Find,
        CreatePet:_CreatePet,
        Delete:_Delete,
        isPet:function(_id) {
            var pet = _Find(_id);
            return ((pet === null)?false:true);
        },
        getMyPetName:function(_id) {
            var pet = _Find(_id);
            if(pet === null) {
                return null;
            }

            return pet.getPetName();
        },
        Upfamiliarity:function(_id, _cnt) {
            var pet = _Find(_id);
            if(pet === null) {
                return false;
            }
            else {
                pet.addFamiliarity(_cnt);
                pet.confirmStroe();
                pet.resetConversationTime();
                _Save();
                return true;
            }
        },
        getConversationCoolTime:function(_id) {
            var pet = _Find(_id);
            if(pet === null) {
                return -1;
            }
            else {
              return pet.getConversationTime() + libConst.Pet_ConversationTime;

            }
        },
        isStore:function(_id) {
            var pet = _Find(_id);
            if(pet === null) {
                return false;
            }
            else {
              return pet.isStore();
            }
        },
        getInventory:function(_id) {
            var pet = _Find(_id);
            if(pet === null) {
                return [];
            }
            else {
              return pet.getInventory();
            }
        },
        PushItem:function(_id, _kind, _itemidx, _count, _strength) {
            var pet = _Find(_id);
            if(pet === null) {
                return false;
            }
            else {
              pet.addItem(_kind, _itemidx, _count, _strength);
              _Save();
              return true;
            }
        },
        PopItem:function(_id, _kind, _itemidx, _count, _strength) {
            var pet = _Find(_id), rtn;
            if(pet === null) {
                return false;
            }
            else {
              rtn = pet.removeItem(_kind, _itemidx, _count, _strength);
              _Save();
              return rtn;
            }
        },
        isItemCount:function(_id, _kind, _itemidx, _count, _strength) {
            var pet = _Find(_id);
            if(pet === null) {
                return false;
            }
            else {
              return pet.isItemCount(_kind, _itemidx, _count, _strength);
            }
        },
        getItemCount:function(_id, _kind, _itemidx, _strength) {
            var pet = _Find(_id);
            if(pet === null) {
                return -1;
            }
            else {
              return pet.getItemCount(_kind, _itemidx, _strength);
            }
        },
        AwakenPet:function(_id) {
            var pet = _Find(_id), list;
            if(pet === null) {
                return [];
            }
            else {
                list = _RandBuff(pet.getFamiliarity());
                pet.setBuff(list);
                _Save();
                return list;
            }
        },
        isAwakenPet:function(_id) {
            var pet = _Find(_id);
            if(pet === null) {
                return false;
            }
            else {
              if(libConst.Pet_Buff_Familiarity.length > 0) {
                  if(libConst.Pet_Buff_Familiarity[0] <= pet.getFamiliarity()) {
                      return true;
                  }
              }
              return false;
            }
        },
        getBuffAmountByKind:function(_id, _kind) {
            var pet = _Find(_id), list, result = 0;
            if(pet !== null) {
                list = pet.getBuff();
                for(var i = 0; i < list.length; ++i) {
                    if(list[i].kind === _kind) {
                        result += list[i].amount;
                    }
                }
            }
            return result;
        },
        activePet:function(_pet) {
            m_PetList.push(libObject.clsPet(_pet));
            _Save();
        }
    };
}
