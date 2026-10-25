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

function CalendarManager() {
    var m_AttendanceList = [];
    var m_AttendanceDump = new libCommon.DumpModule();

    var _LoadData, _Find, _RemovePassRecord, _CreateAttendance, _MakeJson, _Save;

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["AttendanceList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_AttendanceList.push(libObject.clsAttendance(tmpList[idx]));
        }
    }();
    _Find = function(_day, _month, _year) {
        var i;
        for (i = 0; i < m_AttendanceDump.dumpList.length; ++i) {
           if (m_AttendanceDump.dumpList[i].year === _year && m_AttendanceDump.dumpList[i].month === _month && m_AttendanceDump.dumpList[i].day === _day) {
              m_AttendanceDump.resetTimeStemp(i);
              return m_AttendanceDump.dumpList[i];
           }
        }
        for (i = 0; i < m_AttendanceList.length; ++i) {
           if (m_AttendanceList[i].year === _year && m_AttendanceList[i].month === _month && m_AttendanceList[i].day === _day) {
              m_AttendanceDump.addDump(m_AttendanceList[i]);
              return m_AttendanceList[i];
           }
        }

        return _CreateAttendance(_day, _month, _year);
    };
    _RemovePassRecord = function() {
        var d = new Date();
        m_AttendanceDump.clear();

        if(m_AttendanceList.length > 0 && (m_AttendanceList[0].year !== d.getYear() || m_AttendanceList[0].month !== d.getMonth())) {
            for (var i = 0; i < m_AttendanceList.length; ++i) {
                if(m_AttendanceList[i].year === d.getYear() && m_AttendanceList[i].month === d.getMonth())
                    continue;

                m_AttendanceList.splice(i,1);
                --i;
            }
        }
    };
    _CreateAttendance = function(_day, _month, _year) {
        var obj = {day:_day, month:_month, year:_year, pushlist:[]};
        m_AttendanceList.push(libObject.clsAttendance(obj));

        _Save();

        return m_AttendanceList[m_AttendanceList.length - 1];
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_AttendanceList.length; ++i) {
            jsonArray.push(m_AttendanceList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Attendance", function() {
                libCommon.write(libConst.fileNameList["AttendanceList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["AttendanceList"], _MakeJson());
        }
    };

    return {
        isAttendance:function(_id) {
            var d = new Date();
            var att = _Find(d.getDate(), d.getMonth(), d.getYear());

            return att.isUser(_id);
        },
        isAttendanceForDate:function(_id, _day, _month, _year) {
            var att = _Find(_day, _month, _year);

            return att.isUser(_id);
        },
        Attendance:function(_id) {
            var d = new Date();
            var att = _Find(d.getDate(), d.getMonth(), d.getYear());
            _RemovePassRecord();
            att.Push(_id);
            _Save();
        },
        removeTodayUser:function(_id) {
            var d = new Date();
            var att = _Find(d.getDate(), d.getMonth(), d.getYear());
            att.removeUser(_id);
            _Save();
        }
    };
}

function Library(charactor_Manager, appoint_Manager) {
    const STATUS = {WRITE:0, LOAD:1, CHECK:2, CHECKING:3, COMPLITE:4, MODIFY:5};

    var m_BookList = [];
    var m_BookDump = new libCommon.DumpModule();

    var charManager = charactor_Manager;
    var appoManager = appoint_Manager;

    var _LoadData, _Find, _FindForWriter, _FindForLibrarian, _FindList, _FindListForStatus, _ChangeAllWriteMode, _CreateNewBook;
    var _LikeListWriter, _LikeListTitle;
    var _MakeJson, _Save, _WriteBook, _LoadBook, _DeleteBook, _RemoveBook, _mkBookInfo;

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["BookList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_BookList.push(libObject.clsBook(tmpList[idx]));
        }
    }();

    _Find = function(_title) {
        var i;
        for (i = 0; i < m_BookDump.dumpList.length; ++i) {
             if (m_BookDump.dumpList[i].title === _title) {
                m_BookDump.resetTimeStemp(i);
                return m_BookDump.dumpList[i];
             }
        }
        for (i = 0; i < m_BookList.length; ++i) {
             if (m_BookList[i].title === _title) {
                m_BookDump.addDump(m_BookList[i]);
                return m_BookList[i];
             }
        }

        return null;
    };
    _FindForWriter = function(_writer, _status) {
        var i;
        for (i = 0; i < m_BookDump.dumpList.length; ++i) {
             if (m_BookDump.dumpList[i].writer === _writer && m_BookDump.dumpList[i].getStatus() === _status) {
                m_BookDump.resetTimeStemp(i);
                return m_BookDump.dumpList[i];
             }
        }
        for (i = 0; i < m_BookList.length; ++i) {
             if (m_BookList[i].writer === _writer && m_BookList[i].getStatus() === _status) {
                m_BookDump.addDump(m_BookList[i]);
                return m_BookList[i];
             }
        }

        return null;
    };
    _FindForLibrarian = function(_lib, _status) {
        var i;
        for (i = 0; i < m_BookDump.dumpList.length; ++i) {
             if (m_BookDump.dumpList[i].getLibrarian() === _lib && m_BookDump.dumpList[i].getStatus() === _status) {
                m_BookDump.resetTimeStemp(i);
                return m_BookDump.dumpList[i];
             }
        }
        for (i = 0; i < m_BookList.length; ++i) {
             if (m_BookList[i].getLibrarian() === _lib && m_BookList[i].getStatus() === _status) {
                m_BookDump.addDump(m_BookList[i]);
                return m_BookList[i];
             }
        }

        return null;
    };

    _FindList = function(_writer) {
        var array = [];
        for (var i = 0; i < m_BookList.length; ++i) {
             if (m_BookList[i].writer === _writer) {
                  array.push(m_BookList[i]);
             }
        }
        return array;
    };
    _FindListForStatus = function(_status) {
        var array = [];
        for (var i = 0; i < m_BookList.length; ++i) {
             if (m_BookList[i].getStatus() === _status) {
                  array.push(m_BookList[i]);
             }
        }
        return array;
    };

    _LikeListWriter = function(_writer) {
        var array = [];
        for (var i = 0; i < m_BookList.length; ++i) {
             if (m_BookList[i].writer.indexOf(_writer) !== -1) {
                  array.push(m_BookList[i]);
             }
        }
        return array;
    };
    _LikeListTitle = function(_title) {
        var array = [];
        for (var i = 0; i < m_BookList.length; ++i) {
             if (m_BookList[i].title.indexOf(_title) !== -1) {
                  array.push(m_BookList[i]);
             }
        }
        return array;
    };

    _ChangeAllWriteMode = function(_name) {
        var list = _FindList(_name);
        var book;
        for(var i = 0; i < list.length; ++i) {
            book = list[i];
            if(book.getStatus() === STATUS.LOAD) {
                book.setStatus(STATUS.WRITE);
            }
        }
    };

    _CreateNewBook = function(_title, _name) {
        var obj = {
            title:_title,
            date:-1,
            writer:_name,
            filepath:libConst.LibraryPath + _title + ".txt",
            librarian:"",
            status:STATUS.LOAD,
            subscribe:[]
        };
        m_BookList.push(libObject.clsBook(obj));
        libCommon.append_text(obj.filepath, "");
    };

    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_BookList.length; ++i) {
            jsonArray.push(m_BookList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Book", function() {
                libCommon.write(libConst.fileNameList["BookList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["BookList"], _MakeJson());
        }
    };

    _WriteBook = function(_path, _content) {
        return libCommon.append_text(_path, "\n" + _content);
    };
    _LoadBook = function(_path) {
        return libCommon.read_text(_path);
    };
    _DeleteBook = function(_path) {
        libCommon.delete_text(_path);
    };
    _RemoveBook = function(_path, _title) {
        m_BookDump.clear();
        for (var i = 0; i < m_BookList.length; ++i) {
             if (m_BookList[i].title === _title) {
                  m_BookList.splice(i, 1);
                  libCommon.remove(_path);
                  break;
             }
        }
        _Save();
    };

    _mkBookInfo = function(_idx, _book, _isdate) {
        var sta, d, rtnstr = "";
        switch(_book.getStatus()) {
            case STATUS.WRITE:
                sta = "대기중";
                break;
            case STATUS.LOAD:
                sta = "작성중";
                break;
            case STATUS.CHECK:
                sta = "검수대기";
                break;
            case STATUS.CHECKING:
                sta = "검수중";
                break;
            case STATUS.COMPLITE:
                sta = "도서관 배치";
                break;
            case STATUS.MODIFY:
                sta = "수정중";
                break;
        }
        d = new Date(_book.getDate());
        rtnstr += (_idx+1) + ". " + _book.title + "\n";
        rtnstr += "  L 작가 : " + _book.writer + "\n";
        rtnstr += "  L 검수자 : " + _book.getLibrarian() + "\n";
        if(_isdate && _book.getDate() !== -1) {
            rtnstr += "  L 검수자 : " + (d.getYear() + 1900) + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "\n";
        }
        rtnstr += "  L 책 상태 : " + sta + "\n\n";

        return rtnstr;
    };

    return {
        NewBook:function(_title, _name) {
            var book = _Find(_title);
            if(book === null) {
                _ChangeAllWriteMode(_name);
                _CreateNewBook(_title, _name);
                _Save();
                return "[" + _title + "] 책을 추가하였습니다.";
            }
            return "[" + _title + "] 이란 이름의 책이 존재 합니다.";
        },
        getMyBookList:function(_name) {
            var list = _FindList(_name);
            var rtnstr = "[작업중인 책 목록]\n\n";
            for(var i = 0; i < list.length; ++i) {
                if(list[i].getStatus() === STATUS.COMPLITE)
                    continue;

                rtnstr += _mkBookInfo(i, list[i], false);
            }
            return rtnstr;
        },
        Loading:function(_name, _title) {
            var book = _Find(_title);
            var rtnstr = "";
            if(book === null) {
                rtnstr = "해당 제목의 책은 없습니다. 제목을 다시한번 확인하시기 바랍니다.";
            }
            else {
                if(book.writer === _name) {
                    switch(book.getStatus()) {
                        case STATUS.WRITE:
                        case STATUS.LOAD:
                        case STATUS.CHECK:
                            _ChangeAllWriteMode(_name);
                            book.setStatus(STATUS.LOAD);
                            _Save();
                            rtnstr = "[" + book.title + "] 불러오기 완료.";
                            break;
                        case STATUS.CHECKING:
                            rtnstr = "[" + book.title + "] 검수중임으로 불러올 수가 없습니다.";
                            break;
                        case STATUS.COMPLITE:
                            rtnstr = "[" + book.title + "] 도서관에 전시중인 책은 불러올수가 없습니다.";
                            break;
                        case STATUS.MODIFY:
                            break;
                    }
                }
                else {
                    rtnstr = "다른 사람의 책을 불러올 수 없습니다.";
                }
            }
            return rtnstr;
        },
        Writing:function(_name, _content) {
            var book = _FindForWriter(_name, STATUS.LOAD);
            var rtnstr = "";
            if(book === null) {
                rtnstr = "현재 작성중인 글이 없습니다. [!불러오기 또는 !새글] 로 작성중인 글을 가져오시기 바랍니다.";
            }
            else {
                rtnstr += "["+book.title+"]\n\n";
                rtnstr = _WriteBook(book.filepath, _content);
            }
            return rtnstr;
        },
        Deleting:function(_name) {
            var book = _FindForWriter(_name, STATUS.LOAD);
            var rtnstr = "";
            if(book === null) {
                rtnstr = "현재 작성중인 글이 없습니다. [!불러오기 또는 !새글] 로 작성중인 글을 가져오시기 바랍니다.";
            }
            else {
                rtnstr = "[" + book.title + "] 내용 삭제 완료";
              _DeleteBook(book.filepath);
            }
            return rtnstr;
        },
        Removing:function(_name, _title) {
            var book = _Find(_title);
            var rtnstr = "";
            if(book === null) {
                rtnstr = "해당 제목의 책은 없습니다. 제목을 다시한번 확인하시기 바랍니다.";
            }
            else {
                if(book.writer === _name) {
                    _RemoveBook(book.filepath, book.title);
                    rtnstr = "[" + book.title + "] 삭제 완료.";
                }
                else {
                    rtnstr = "다른 사람의 책을 삭제할 수 없습니다.";
                }
            }
            return rtnstr;
        },
        Uploading:function(_name, _title) {
            var book = _Find(_title);
            var rtnstr = "";
            if(book === null) {
                rtnstr = "해당 제목의 책은 없습니다. 제목을 다시한번 확인하시기 바랍니다.";
            }
            else {
                if(book.writer === _name) {
                    switch(book.getStatus()) {
                        case STATUS.WRITE:
                        case STATUS.LOAD:
                            book.setStatus(STATUS.CHECK);
                            _Save();
                            appoManager.replyLibrarian(_name + "님이 " + book.title + " 책을 검수등록 하였습니다.");
                            rtnstr = "[" + book.title + "] 검수등록 완료.";
                            break;
                        case STATUS.CHECK:
                        case STATUS.CHECKING:
                            rtnstr = "[" + book.title + "] 이미 검수등록이 완료되었거나, 검수중 입니다.";
                            break;
                        case STATUS.COMPLITE:
                            rtnstr = "[" + book.title + "] 이 책은 검수가 완료된 책입니다.";
                            break;
                        case STATUS.MODIFY:
                            break;
                    }
                }
                else {
                    rtnstr = "다른 사람의 책을 검수등록 할수 없습니다.";
                }
            }
            return rtnstr;
        },
        Looking:function(_name, _title) {
            var book = _Find(_title);
            var rtnstr = "";
            if(book === null) {
                rtnstr = "해당 제목의 책은 없습니다. 제목을 다시한번 확인하시기 바랍니다.";
            }
            else {
                if(book.writer === _name) {
                    switch(book.getStatus()) {
                        case STATUS.WRITE:
                        case STATUS.LOAD:
                        case STATUS.CHECK:
                            rtnstr += "[" + book.title + "]\n";
                            rtnstr += _LoadBook(book.filepath);
                            break;
                        case STATUS.CHECKING:
                            rtnstr = "[" + book.title + "] 현재 검수중인 책은 확인할 수 없습니다.";
                            break;
                        case STATUS.COMPLITE:
                            rtnstr = "[" + book.title + "] 해당 책은 도서관에서 열람 하셔야 됩니다.";
                            break;
                        case STATUS.MODIFY:
                            break;
                    }
                }
                else {
                    rtnstr = "다른 사람의 책을 볼수 없습니다.";
                }
            }
            return rtnstr;
        },
        Checking:function(_name) {
            var book = _FindForLibrarian(_name, STATUS.CHECKING);
            var bookList;
            var rtnstr = "";
            if(book !== null) {
                rtnstr = "현재 검수중인 책이 있습니다.\n\n";
                rtnstr += "[" + book.title + "]\n";
                rtnstr += _LoadBook(book.filepath);
                return rtnstr;
            }
            else {
                bookList = _FindListForStatus(STATUS.CHECK);

                if(bookList.length === 0) {
                    rtnstr = "현재 검수등록된 책이 없습니다.";
                    return rtnstr;
                }

                for(var i = 0; i < bookList.length; ++i) {
                    book = bookList[i];
                    if(book.writer === _name) {
                        continue;
                    }
                    book.setLibrarian(_name);
                    book.setStatus(STATUS.CHECKING);
                    rtnstr += "[" + book.title + "]\n";
                    rtnstr += _LoadBook(book.filepath);
                    _Save();
                    break;
                }
                return rtnstr;
            }
        },
        Resulting:function(_name, _kind, _comment) {
            var book = _FindForLibrarian(_name, STATUS.CHECKING);
            var rtnstr = "";
            if(book !== null) {
                if(_kind) {
                    book.setStatus(STATUS.COMPLITE);
                    book.setDate((new Date()).getTime());
                    rtnstr = "[" + book.title + "] 검수 통과 시켰습니다.";
                    libCommon.replyID(book.writer, "검수자 " + _name + "사서가 " + book.title + " 책을 검수통과 시켰습니다.\n\n" + " - 코멘트 : " + _comment);
                }
                else {
                    book.setStatus(STATUS.WRITE);
                    book.setLibrarian("");
                    rtnstr = "[" + book.title + "] 검수 리젝 시켰습니다.";
                    libCommon.replyID(book.writer, "검수자 " + _name + "사서가 " + book.title + " 책을 리젝 시켰습니다.\n\n" + " - 코멘트 : " + _comment);
                }
                _Save();
            }
            else {
                rtnstr = "현재 검수중인 책이 없습니다.";
            }
            return rtnstr;
        },
        Searching:function(_id, _search, _kind) {
            var obj = charManager.findUser(_id);
            var bookList, user_loc, facilityDB;
            var rtnstr = "[" + _search + " 검색]\n\n";

            if(obj === null) {
                rtnstr = "캐릭터 정보가 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !(facilityDB.action.includes("작가검색") || facilityDB.action.includes("제목검색"))) {
                    rtnstr = "도서관에서만 책을 검색 할수 있습니다.";
                    return rtnstr;
                }

                if(_kind === "title") {
                    bookList = _LikeListTitle(_search);
                }
                else {
                    bookList = _LikeListWriter(_search);
                }

                for(var i = 0; i < bookList.length; ++i) {
                    if(bookList[i].getStatus() === STATUS.COMPLITE)
                        rtnstr += _mkBookInfo(i, bookList[i], true);
                }
            }

            return rtnstr;
        },
        Opening:function(_id, _title) {
            var book = _Find(_title);
            var obj = charManager.findUser(_id);
            var rtnstr = "", user_loc, facilityDB, writer;

            if(obj === null) {
                rtnstr = "캐릭터 정보가 없습니다.";
            }
            else {
                user_loc = obj.getLocation();
                facilityDB = db_Manager.getFacility(user_loc.facility);
                if(facilityDB === null || !facilityDB.action.includes("열람")) {
                    rtnstr = "도서관에서만 책을 열람 할수 있습니다.";
                    return rtnstr;
                }

                if(book === null) {
                    rtnstr = "해당 제목의 책은 없습니다. 제목을 다시한번 확인하시기 바랍니다.";
                }
                else {
                    switch(book.getStatus()) {
                        case STATUS.WRITE:
                        case STATUS.LOAD:
                        case STATUS.CHECK:
                        case STATUS.CHECKING:
                        case STATUS.MODIFY:
                            rtnstr = "[" + book.title + "] 도서관에 존재 하지 않는 책 입니다.";
                            break;
                        case STATUS.COMPLITE:
                            rtnstr += "[" + book.title + "]\n";
                            rtnstr += _LoadBook(book.filepath);
                            if(!book.isSubscribe(_id)) {
                                book.Subscribed(_id);
                                writer = charManager.findUser(book.writer);
                                if(writer !== null) {
                                    writer.addRune(libConst.Library_Reading_Rune);
                                    charManager.SaveUser();
                                    _Save();
                                    libCommon.replyID(book.writer, book.title + " 책이 열람되어 " + libConst.Library_Reading_Rune + " rune을 지급합니다.");
                                }
                            }
                            break;
                    }
                }
            }
            return rtnstr;
        }
    };
}

function AutoObtainManager() {
    var m_ObtainList = [];
    var m_ObtainDump = new libCommon.DumpModule();

    var _LoadData, _Find, _CreateObtain, _Delete, _Delete_CompareKind, _MakeJson, _Save;

    _LoadData = function() {
        var idx;
        var tmpList = libCommon.read(libConst.fileNameList["AutoObtainList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_ObtainList.push(libObject.clsAutoObtain(tmpList[idx]));
        }
    }();

    _Find = function(_name, _kind) {
        var i;
        for (i = 0; i < m_ObtainDump.dumpList.length; ++i) {
            if (m_ObtainDump.dumpList[i].name === _name && m_ObtainDump.dumpList[i].kind === _kind) {
                m_ObtainDump.resetTimeStemp(i);
                return m_ObtainDump.dumpList[i];
            }
        }
        for (i = 0; i < m_ObtainList.length; ++i) {
            if (m_ObtainList[i].name === _name && m_ObtainList[i].kind === _kind) {
                m_ObtainDump.addDump(m_ObtainList[i]);
                return m_ObtainList[i];
            }
        }

        return null;
    };

    _CreateObtain = function(_name, _kind, _term, _location) {
        var CurrTime = (new Date()).getTime();
        var obj = {name:_name, kind:_kind, starttime:CurrTime, endtime:CurrTime+ _term, location:_location};

        m_ObtainList.push(libObject.clsAutoObtain(obj));

        _Save();
    };

    _Delete = function(_id) {
        m_ObtainDump.clear();
        for (var i = 0; i < m_ObtainList.length; ++i) {
            if (m_ObtainList[i].name === _id) {
                m_ObtainList.splice(i,1);
            }
        }
        _Save();
    };
    _Delete_CompareKind = function(_id, _kind) {
        m_ObtainDump.clear();
        for (var i = 0; i < m_ObtainList.length; ++i) {
            if (m_ObtainList[i].name === _id && m_ObtainList[i].kind === _kind) {
                m_ObtainList.splice(i,1);
            }
        }
        _Save();
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_ObtainList.length; ++i) {
            jsonArray.push(m_ObtainList[i].getJson());
        }
        return jsonArray;
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("AutoObtain", function() {
                libCommon.write(libConst.fileNameList["AutoObtainList"], _MakeJson());
            });
        }
        else {
            libCommon.write(libConst.fileNameList["AutoObtainList"], _MakeJson());
        }
    };

    return {
        Delete:_Delete,
        isWorking:function(_id, _kind) {
            var obj = _Find(_id, _kind);

            if(obj === null) {
                return false;
            }
            else {
                return true;
            }
        },
        AutoWorkingStart:function(_name, _kind, _term, _location) {
            var loc = {country:_location.country, city:_location.city, facility:_location.facility, field:_location.field, dungeon:_location.dungeon, home:_location.home};
            _CreateObtain(_name, _kind, _term * 1000, loc);
        },
        CompliteAutoWorking:function(_id) {
            var obj_mining = _Find(_id, libObject.ObtainKind.MINING);
            var obj_felling = _Find(_id, libObject.ObtainKind.FELLING);
            var obj_stoning = _Find(_id, libObject.ObtainKind.STONING);
            var obj_getting = _Find(_id, libObject.ObtainKind.GETTING);

            var resultList = null, obj_location, itemCount = {};
            var remainTime = null, hour, min, sec;
            var c, i, item;

            var rtnObj = {text:"", list:[]}; // {text, list:[ {name, count, kind} ]}

            if(obj_mining !== null) {
                rtnObj.text += "  - 채굴 결과 : \n";
                resultList = obj_mining.getResultItem();
                obj_location = obj_mining.getLocation();
                itemCount = {};
                
                if(resultList !== null) {
                    for(c = 0; c < resultList.length; ++c) {
                        itemCount[resultList[c].index] = {count:0, kind:resultList[c].kind};
                    }
                    for(i = 0; i < resultList.length; ++i) {
                        itemCount[resultList[i].index].count += Number(resultList[i].count);
                    }
                    for(item in itemCount){
                        tmpitem = db_Manager.getItem(itemCount[item].kind, item);
                        
                        rtnObj.list.push({index:item, count:itemCount[item].count, kind:itemCount[item].kind});
                        rtnObj.text += "    L " + tmpitem.name + "을(를) " + itemCount[item].count + "개 획득\n";
                    }

                    _Delete_CompareKind(_id, libObject.ObtainKind.MINING);

                }
                else {
                    remainTime = Math.floor((obj_mining.getEndTime() - (new Date()).getTime()) / 1000);
                    hour = Math.floor(remainTime / 3600);
                    remainTime -= hour*3600;
                    min = Math.floor(remainTime / 60);
                    sec = remainTime - (min*60);
                    rtnObj.text += "   L 현재 채굴 진행중입니다.\n";
                    rtnObj.text += "   L 채굴지역 : " + db_Manager.getCity(obj_location.city).name + " > " + db_Manager.getFacility(obj_location.facility).name + "\n";
                    rtnObj.text += "   L 채굴 남은 시간 : " + (hour === 0?"":(hour + "시 ")) + (min === 0?"":(min + "분 ")) + (sec === 0?"":(sec + "초 ")) + "후에 완료 가능";
                }
                rtnObj.text += "\n\n";
                
            }

            if(obj_felling !== null) {
                rtnObj.text += "  - 벌목 결과 : \n";
                resultList = obj_felling.getResultItem();
                obj_location = obj_felling.getLocation();
                itemCount = {};
                
                if(resultList !== null) {
                    for(c = 0; c < resultList.length; ++c) {
                        itemCount[resultList[c].index] = {count:0, kind:resultList[c].kind};
                    }
                    for(i = 0; i < resultList.length; ++i) {
                        itemCount[resultList[i].index].count += Number(resultList[i].count);
                    }
                    for(item in itemCount){
                        tmpitem = db_Manager.getItem(itemCount[item].kind, item);

                        rtnObj.list.push({index:item, count:itemCount[item].count, kind:itemCount[item].kind});
                        rtnObj.text += "    L " + tmpitem.name + "을(를) " + itemCount[item].count + "개 획득\n";
                    }

                    _Delete_CompareKind(_id, libObject.ObtainKind.FELLING);

                }
                else {
                    remainTime = Math.floor((obj_felling.getEndTime() - (new Date()).getTime()) / 1000);
                    hour = Math.floor(remainTime / 3600);
                    remainTime -= hour*3600;
                    min = Math.floor(remainTime / 60);
                    sec = remainTime - (min*60);
                    rtnObj.text += "   L 현재 벌목 진행중입니다.\n";
                    rtnObj.text += "   L 벌목지역 : " + db_Manager.getCity(obj_location.city).name + " > " + db_Manager.getFacility(obj_location.facility).name + "\n";
                    rtnObj.text += "   L 벌목 남은 시간 : " + (hour === 0?"":(hour + "시 ")) + (min === 0?"":(min + "분 ")) + (sec === 0?"":(sec + "초 ")) + "후에 완료 가능";
                }
                rtnObj.text += "\n\n";

            }

            if(obj_stoning !== null) {
                rtnObj.text += "  - 채광 결과 : \n";
                resultList = obj_stoning.getResultItem();
                obj_location = obj_stoning.getLocation();
                itemCount = {};

                if(resultList !== null) {
                    for(c = 0; c < resultList.length; ++c) {
                        itemCount[resultList[c].index] = {count:0, kind:resultList[c].kind};
                    }
                    for(i = 0; i < resultList.length; ++i) {
                        itemCount[resultList[i].index].count += Number(resultList[i].count);
                    }
                    for(item in itemCount){
                        tmpitem = db_Manager.getItem(itemCount[item].kind, item);

                        rtnObj.list.push({index:item, count:itemCount[item].count, kind:itemCount[item].kind});
                        rtnObj.text += "    L " + tmpitem.name + "을(를) " + itemCount[item].count + "개 획득\n";
                    }

                    _Delete_CompareKind(_id, libObject.ObtainKind.STONING);

                }
                else {
                    remainTime = Math.floor((obj_stoning.getEndTime() - (new Date()).getTime()) / 1000);
                    hour = Math.floor(remainTime / 3600);
                    remainTime -= hour*3600;
                    min = Math.floor(remainTime / 60);
                    sec = remainTime - (min*60);
                    rtnObj.text += "   L 현재 채광 진행중입니다.\n";
                    rtnObj.text += "   L 채광지역 : " + db_Manager.getCity(obj_location.city).name + " > " + db_Manager.getFacility(obj_location.facility).name + "\n";
                    rtnObj.text += "   L 채광 남은 시간 : " + (hour === 0?"":(hour + "시 ")) + (min === 0?"":(min + "분 ")) + (sec === 0?"":(sec + "초 ")) + "후에 완료 가능";
                }
                rtnStr = "\n\n";
            }

            if(obj_getting !== null) {
                rtnObj.text += "  - 채집 결과 : \n";
                resultList = obj_getting.getResultItem();
                obj_location = obj_getting.getLocation();
                itemCount = {};

                if(resultList !== null) {
                    for(c = 0; c < resultList.length; ++c) {
                        itemCount[resultList[c].index] = {count:0, kind:resultList[c].kind};
                    }
                    for(i = 0; i < resultList.length; ++i) {
                        itemCount[resultList[i].index].count += Number(resultList[i].count);
                    }
                    for(item in itemCount){
                        tmpitem = db_Manager.getItem(itemCount[item].kind, item);

                        rtnObj.list.push({index:item, count:itemCount[item].count, kind:itemCount[item].kind});
                        rtnObj.text += "    L " + tmpitem.name + "을(를) " + itemCount[item].count + "개 획득\n";
                    }

                    _Delete_CompareKind(_id, libObject.ObtainKind.GETTING);

                }
                else {
                    remainTime = Math.floor((obj_getting.getEndTime() - (new Date()).getTime()) / 1000);
                    hour = Math.floor(remainTime / 3600);
                    remainTime -= hour*3600;
                    min = Math.floor(remainTime / 60);
                    sec = remainTime - (min*60);
                    rtnObj.text += "   L 현재 채집 진행중입니다.\n";
                    rtnObj.text += "   L 채집지역 : " + db_Manager.getCity(obj_location.city).name + " > " + db_Manager.getFacility(obj_location.facility).name + "\n";
                    rtnObj.text += "   L 채집 남은 시간 : " + (hour === 0?"":(hour + "시 ")) + (min === 0?"":(min + "분 ")) + (sec === 0?"":(sec + "초 ")) + "후에 완료 가능";
                }
                rtnStr = "\n\n";
            }

            return rtnObj;
        }
    };
}

function HomeworkManager() {
    var m_HomeworkList = [];
    var m_HomeworkDump = new libCommon.DumpModule();
    var m_ResetTimer = null;

    var _LoadData, _Find, _CreateHomework, _Delete, _MakeJson, _Save;
    var _resetHomework;

    _LoadData = function() {
        var idx, currTime, date, day, month, year;
        var tmpList = libCommon.read(libConst.fileNameList["HomeworkList"]);
        for(idx = 0; idx < tmpList.length; ++idx) {
            m_HomeworkList.push(libObject.clsHomework(tmpList[idx]));
        }
        m_ResetTimer = libCommon.read(libConst.fileNameList["HWResetTimer"]);
        if(m_ResetTimer === null || m_ResetTimer === undefined || m_ResetTimer === "" || m_ResetTimer.Day === undefined) {
            currTime = new Date();
            date = currTime.getDate();
            day = currTime.getDay();
            month = currTime.getMonth();
            year = currTime.getYear();
            m_ResetTimer = {Day:currTime.getTime(), Week:currTime.getTime(), Month:currTime.getTime(), Year:currTime.getTime()};
            _Save();
        }
    };
    _Find = function(_name) {
        var i;
        for (i = 0; i < m_HomeworkDump.dumpList.length; ++i) {
           if (m_HomeworkDump.dumpList[i].name === _name) {
            m_HomeworkDump.resetTimeStemp(i);
              return m_HomeworkDump.dumpList[i];
           }
        }
        for (i = 0; i < m_HomeworkList.length; ++i) {
           if (m_HomeworkList[i].name === _name) {
            m_HomeworkDump.addDump(m_HomeworkList[i]);
              return m_HomeworkList[i];
           }
        }

        return _CreateHomework(_name);
    };
    _CreateHomework = function(_name) {
        var obj = libObject.clsHomework({name:_name, homeworks:[]});
        m_HomeworkList.push(obj);
        _Save();

        return obj;
    };
    _resetHomework = function(_kind) {
        var userHW = null;

        for(var i = 0; i < m_HomeworkList.length; ++i) {
            userHW = m_HomeworkList[i];
            userHW.resetAllByKind(_kind);
        }
    };
    _MakeJson = function() {
        var jsonArray = [];
        for(var i = 0; i < m_HomeworkList.length; ++i) {
            jsonArray.push(m_HomeworkList[i].getJson());
        }
        return jsonArray;
    };
    _Delete = function(_id) {
        m_HomeworkDump.clear();
        for (var i = 0; i < m_HomeworkList.length; ++i) {
            if (m_HomeworkList[i].name === _id) {
                m_HomeworkList.splice(i,1);
            }
        }
        _Save();
    };
    _Save = function() {
        if(libConst.SaveDelay) {
            libCommon.StartSaveThread("Homework", function() {
                libCommon.write(libConst.fileNameList["HomeworkList"], _MakeJson());
                libCommon.write(libConst.fileNameList["HWResetTimer"], m_ResetTimer);
            });
        }
        else {
            libCommon.write(libConst.fileNameList["HomeworkList"], _MakeJson());
            libCommon.write(libConst.fileNameList["HWResetTimer"], m_ResetTimer);
        }
    };

    _LoadData();

    return {
        Delete:_Delete,
        getHomeworkStr: function(_id) {
            var hwObj = _Find(_id);
            var homeworkList = hwObj.getHomeWorkList();
            var hw = null, hwDB = null, itemDB = null, j;
            var dayStr = "[일일 퀘스트]" + libConst.dummy + "\n\n", weekStr = "\n[주간 퀘스트]\n\n", monthStr = "\n[월간 퀘스트]\n\n", yearStr = "\n[년간 퀘스트]\n\n";
            var dayCnt = 1, weekCnt = 1, monthCnt = 1, yearCnt = 1;
            var dayflag = false, weekflag = false, monthflag = false, yearflag = false; 

            for(var i = 0; i < homeworkList.length; ++i) {
                hw = homeworkList[i];
                hwDB = db_Manager.getHomework(hw.index);

                if(hwDB !== null) {
                    switch(hwDB.kind) {
                        case "everyday":
                            dayflag = true;
                            dayStr += dayCnt + ". [" + hwDB.title + "] " + hwDB.contents + "\n";
                            dayStr += "   L 도달치 : " + hw.attain + "/" + hwDB.count + "\n";
                            dayStr += "   L 지급 룬 : " + hwDB.rune + "\n";
                            if(hwDB.item.length > 0)
                                dayStr += "   L 보상 : ";
                            for(j = 0; j < hwDB.item.length; ++j) {
                                itemDB = db_Manager.getItem(hwDB.item[j].itemkind, hwDB.item[j].itemIdx);
                                dayStr += itemDB.name +  " +" + hwDB.item[j].count + (j === hwDB.item.length - 1?"\n": ", ");
                            }
                            dayStr += "\n";
                            dayCnt++;
                            break;
                        case "week":
                            weekflag = true;
                            weekStr += weekCnt + ". [" + hwDB.title + "] " + hwDB.contents + "\n";
                            weekStr += "   L 도달치 : " + hw.attain + "/" + hwDB.count + "\n";
                            weekStr += "   L 지급 룬 : " + hwDB.rune + "\n";
                            if(hwDB.item.length > 0)
                                weekStr += "   L 보상 : ";
                            for(j = 0; j < hwDB.item.length; ++j) {
                                itemDB = db_Manager.getItem(hwDB.item[j].itemkind, hwDB.item[j].itemIdx);
                                weekStr += itemDB.name +  " +" + hwDB.item[j].count + (j === hwDB.item.length - 1?"\n": ", ");
                            }
                            weekStr += "\n";
                            weekCnt++;
                            break;
                        case "month":
                            monthflag = true;
                            monthStr += monthCnt + ". [" + hwDB.title + "] " + hwDB.contents + "\n";
                            monthStr += "   L 도달치 : " + hw.attain + "/" + hwDB.count + "\n";
                            monthStr += "   L 지급 룬 : " + hwDB.rune + "\n";
                            if(hwDB.item.length > 0)
                                monthStr += "   L 보상 : ";
                            for(j = 0; j < hwDB.item.length; ++j) {
                                itemDB = db_Manager.getItem(hwDB.item[j].itemkind, hwDB.item[j].itemIdx);
                                monthStr += itemDB.name +  " +" + hwDB.item[j].count + (j === hwDB.item.length - 1?"\n": ", ");
                            }
                            monthStr += "\n";
                            monthCnt++;
                            break;
                        case "year":
                            yearflag = true;
                            yearStr += yearCnt + ". [" + hwDB.title + "] " + hwDB.contents + "\n";
                            yearStr += "   L 도달치 : " + hw.attain + "/" + hwDB.count + "\n";
                            yearStr += "   L 지급 룬 : " + hwDB.rune + "\n";
                            if(hwDB.item.length > 0)
                                yearStr += "   L 보상 : ";
                            for(j = 0; j < hwDB.item.length; ++j) {
                                itemDB = db_Manager.getItem(hwDB.item[j].itemkind, hwDB.item[j].itemIdx);
                                yearStr += itemDB.name +  " +" + hwDB.item[j].count + (j === hwDB.item.length - 1?"\n": ", ");
                            }
                            yearStr += "\n";
                            yearCnt++;
                            break;
                    }
                }
            }

            return (dayflag?dayStr:"\n\n") + (weekflag?weekStr:"\n\n") + (monthflag?monthStr:"\n\n") + (yearflag?yearStr:"");
        },
        completeHomework:function(_id, _type, _count) {
            var hwObj = _Find(_id);
            var rewardList = hwObj.setHomeWorkByType(_type, _count);
            
            _Save();
            return rewardList;
        },
        checkResetTime:function() {
            var now = new Date();
            var nowMs = Date.now();
            var currentDay = now.getDay();
            var isReset = false;

            var todayZero, todayZeroMs, targetDayMs ;
            
            var sundayZeroMs, targetDayTimeMs;
            

            // --- 오늘 0시 기준 ---
            todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            todayZeroMs = todayZero.getTime();

            // 오늘 target 시각의 timestamp
            targetDayMs  = todayZeroMs + (libConst.ResetHomeWorkTime * 60 * 60 * 1000);
            if (nowMs >= targetDayMs  && m_ResetTimer.Day < targetDayMs) {
                m_ResetTimer.Day = targetDayMs; // 실행한 시각 기록
                isReset = true;
                _resetHomework(libConst.HomeworkKind.EveryDay);
            }

            sundayZeroMs = todayZeroMs - (currentDay * 24 * 60 * 60 * 1000);

            targetDayTimeMs = sundayZeroMs + (libConst.ResetHomeWorkWeek * 24 * 60 * 60 * 1000) + (libConst.ResetHomeWorkTime * 60 * 60 * 1000);
            if (nowMs >= targetDayTimeMs && m_ResetTimer.Week < targetDayTimeMs) {
                m_ResetTimer.Week = targetDayTimeMs; // 실행한 시각 기록
                isReset = true;
                _resetHomework(libConst.HomeworkKind.Week);
            }

            if(isReset) {
                _Save();
            }
        }
    }
}