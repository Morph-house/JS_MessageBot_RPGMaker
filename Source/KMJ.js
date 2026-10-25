var scriptName = '명단봇';
var allowedRooms = ['테스트', 'DEBUG ROOM', 'Test'];
var adminNicknames = ['재롱', 'test'];
var nicknames = {};
var teams = {};
var teamCounter = 0;
var fixedMembers = {};

function onStartCompile() {


FileStream.write("sdcard/Nick/Nick.txt", "JSON.stringify(nicknames, null, 2");
 FileStream.write("sdcard/Team/Team.txt", JSON.stringify(teams, null, 2));
 FileStream.write("sdcard/Fixed/Fixed.txt", JSON.stringify(fixedMembers, null, 2));
 
 }
 
 const User = {
   nicknames : JSON.parse(FileStream.read("sdcard/Nick/Nick.txt")) || [],  
 teams : JSON.parse(FileStream.read("sdcard/Team/Team.txt")) || [],  
 fixedMembers : JSON.parse(FileStream.read("sdcard/Fixed/Fixed.txt")) || [],  
  get : function(data, object) {
    return data.find((user) => user.id == object);
  }
};

function response(room, msg, sender, isGroupChat, replier) {
    if (!allowedRooms.includes(room)) return;

    var command = msg.split(' ')[0];
    var params = msg.split(' ').slice(1);

    switch(command) {
        case '/닉네임등록':
            registerNickname(sender, params.join(' '), replier, room);
            break;
        case '/팀':
            if (params[0] === '추가' && isAdmin(sender)) {
                createTeam(replier, room);
            } else {
                replier.reply('팀 추가는 관리자만 가능합니다.');
            }
            break;
        case '/명단':
            replier.reply(showAllTeamList(room));
            break;
        case '/관리자':
            handleAdminCommands(sender, params, replier);
            break;
        default:
            handleTeamCommands(msg, sender, replier, room);
    }
}

function isAdmin(sender) {
    return adminNicknames.includes(nicknames[sender] || sender);
}

function registerNickname(sender, nickname, replier, room) {
    if (nickname) {
        for (var existingSender in nicknames) {
            if (nicknames[existingSender].toLowerCase() === nickname.toLowerCase()) {
                replier.reply('이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.');
                return;
            }
        }
        nicknames[sender] = nickname;
        replier.reply(sender + '님의 닉네임이 "' + nickname + '"으로 등록되었습니다.');
    } else {
        replier.reply('사용법: /닉네임등록 [닉네임]');
    }
}

function createTeam(replier, room) {
    teamCounter++;
    var teamName = teamCounter + '팀';
    if (!teams[room]) teams[room] = {};
    teams[room][teamName.toLowerCase()] = {
        name: teamName,
        members: Array(10).fill(null),
        memo: '',
        date: '',
        time: '',
        numberMemos: {}
    };
    var reply = teamName + '이 추가되었습니다.\n';
    reply += getTeamList(teamName, room);
    replier.reply(reply);
}

function handleTeamCommands(msg, sender, replier, room) {
    var match = msg.match(/^\/(.+?)\s+(.+)$/);
    if (!match) return;

    var teamName = match[1];
    var command = match[2];
    var teamNameLower = teamName.toLowerCase();
    if (!teams[room] || !teams[room][teamNameLower]) {
        replier.reply('존재하지 않는 팀입니다.');
        return;
    }

    var params = command.split(' ');
    switch(params[0]) {
        case '이름':
            changeTeamName(teamNameLower, params.slice(1).join(' '), replier, room);
            break;
        case '시간':
            setTeamDateTime(teamNameLower, params.slice(1).join(' '), replier, room);
            break;
        case '메모':
            setTeamMemo(teamNameLower, params.slice(1).join(' '), replier, room);
            break;
        case '초기화':
            if (isAdmin(sender)) {
                resetTeam(teamNameLower, replier, room);
            } else {
                replier.reply('팀 초기화는 관리자만 가능합니다.');
            }
            break;
        case '인원':
            resizeTeam(teamNameLower, parseInt(params[1]), replier, room);
            break;
        case '삭제':
            if (isAdmin(sender)) {
                deleteTeam(teamNameLower, replier, room);
            } else {
                replier.reply('팀 삭제는 관리자만 가능합니다.');
            }
            break;
        default:
            if (params[0].match(/^\d+번$/)) {
                var position = parseInt(params[0]) - 1;
                if (params[1] === '취소') {
                    leaveTeam(sender, teamNameLower, position, replier, room);
                } else if (params[1] === '고정') {
                    setFixedMember(teamNameLower, position, replier, room);
                } else if (params[1] === '고정취소') {
                    unsetFixedMember(teamNameLower, position, replier, room);
                } else if (params[1] === '메모') {
                    setNumberMemo(teamNameLower, position, params.slice(2).join(' '), replier, room);
                } else if (params[1] === '메모취소') {
                    unsetNumberMemo(teamNameLower, position, replier, room);
                } else {
                    joinTeam(sender, teamNameLower, position, params.slice(1).join(' '), replier, room);
                }
            }
    }
    replier.reply(getTeamList(teams[room][teamNameLower].name, room));
}

function changeTeamName(oldNameLower, newName, replier, room) {
    if (!newName) {
        replier.reply('새 팀 이름을 입력해주세요.');
        return;
    }
    var newNameLower = newName.toLowerCase();
    if (teams[room][newNameLower]) {
        replier.reply('이미 존재하는 팀 이름입니다.');
        return;
    }
    teams[room][newNameLower] = teams[room][oldNameLower];
    teams[room][newNameLower].name = newName;
    delete teams[room][oldNameLower];
    replier.reply(newName + '의 이름이 ' + newName + '으로 변경되었습니다.');
}

function setTeamDateTime(teamNameLower, dateTime, replier, room) {
    teams[room][teamNameLower].date = dateTime;
    replier.reply(teams[room][teamNameLower].name + '의 시간이 ' + dateTime + '으로 설정되었습니다.');
}

function setTeamMemo(teamNameLower, memo, replier, room) {
    teams[room][teamNameLower].memo = memo;
    replier.reply(teams[room][teamNameLower].name + '의 메모가 설정되었습니다.');
}

function joinTeam(sender, teamNameLower, position, name, replier, room) {
    if (position < 0) {
        replier.reply('올바른 번호를 입력해주세요.');
        return;
    }
    
    var team = teams[room][teamNameLower];
    while (team.members.length <= position) {
        team.members.push(null);
    }
    
    if (team.members[position] === null) {
        team.members[position] = name || (nicknames[sender] || sender);
        var reply = (name || (nicknames[sender] || sender)) + '님이 ' + team.name + '의 ' + (position + 1) + '번에 등록되었습니다.\n';
        replier.reply(reply);
    } else {
        replier.reply('이미 누군가 등록된 자리입니다.');
    }
}

function leaveTeam(sender, teamNameLower, position, replier, room) {
    var nickname = nicknames[sender] || sender;
    if (teams[room][teamNameLower].members[position] === nickname) {
        teams[room][teamNameLower].members[position] = null;
        var reply = nickname + '님이 ' + teams[room][teamNameLower].name + '의 ' + (position + 1) + '번에서 탈퇴하였습니다.\n';
        replier.reply(reply);
    } else {
        replier.reply('해당 자리에 등록되어 있지 않습니다.');
    }
}

function setFixedMember(teamNameLower, position, replier, room) {
    if (!fixedMembers[room]) fixedMembers[room] = {};
    if (!fixedMembers[room][teamNameLower]) fixedMembers[room][teamNameLower] = new Set();
    fixedMembers[room][teamNameLower].add(position);
    replier.reply(teams[room][teamNameLower].name + '의 ' + (position + 1) + '번이 고정되었습니다.');
}

function unsetFixedMember(teamNameLower, position, replier, room) {
    if (fixedMembers[room] && fixedMembers[room][teamNameLower]) {
        fixedMembers[room][teamNameLower].delete(position);
        replier.reply(teams[room][teamNameLower].name + '의 ' + (position + 1) + '번의 고정이 취소되었습니다.');
    } else {
        replier.reply('고정되지 않은 자리입니다.');
    }
}

function setNumberMemo(teamNameLower, position, memo, replier, room) {
    teams[room][teamNameLower].numberMemos[position] = memo;
    replier.reply(teams[room][teamNameLower].name + '의 ' + (position + 1) + '번 메모가 설정되었습니다.');
}

function unsetNumberMemo(teamNameLower, position, replier, room) {
    delete teams[room][teamNameLower].numberMemos[position];
    replier.reply(teams[room][teamNameLower].name + '의 ' + (position + 1) + '번 메모가 삭제되었습니다.');
}

function resetTeam(teamNameLower, replier, room) {
    var fixedSet = fixedMembers[room] && fixedMembers[room][teamNameLower] ? fixedMembers[room][teamNameLower] : new Set();
    teams[room][teamNameLower].members = teams[room][teamNameLower].members.map((member, index) => 
        fixedSet.has(index) ? member : null
    );
    replier.reply(teams[room][teamNameLower].name + '이 초기화되었습니다.');
}

function resizeTeam(teamNameLower, newSize, replier, room) {
    if (newSize > 0) {
        const oldMembers = teams[room][teamNameLower].members;
        teams[room][teamNameLower].members = Array(newSize).fill(null);
        for (var i = 0; i < Math.min(oldMembers.length, newSize); i++) {
            teams[room][teamNameLower].members[i] = oldMembers[i];
        }
        replier.reply(teams[room][teamNameLower].name + '의 크기가 ' + newSize + '명으로 조정되었습니다.');
    } else {
        replier.reply('팀 크기는 1 이상이어야 합니다.');
    }
}

function deleteTeam(teamNameLower, replier, room) {
    var teamName = teams[room][teamNameLower].name;
    delete teams[room][teamNameLower];
    if (fixedMembers[room] && fixedMembers[room][teamNameLower]) {
        delete fixedMembers[room][teamNameLower];
    }
    replier.reply(teamName + '이 삭제되었습니다.');
}

function showAllTeamList(room) {
    var reply = '🎖️전체 명단🎖️​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​\n';
    for (var teamNameLower in teams[room]) {
        reply += getTeamList(teams[room][teamNameLower].name, room) + '\n\n';
    }
    return reply.trim();
}

function getTeamList(teamName, room) {
    var teamNameLower = teamName.toLowerCase();
    var reply = '𖤐 ' + teams[room][teamNameLower].name + ' 𖤐\n';
    reply += '🕐 ' + teams[room][teamNameLower].date + '\n';
    teams[room][teamNameLower].members.forEach((member, index) => {
        var memberInfo = (index + 1) + '. ' + (member || '-');
        if (teams[room][teamNameLower].numberMemos[index]) {
            memberInfo += ' (' + teams[room][teamNameLower].numberMemos[index] + ')';
        }
        reply += memberInfo + '\n';
    });
    reply += '✎ ' + teams[room][teamNameLower].memo;
    return reply.trim();
}

function handleAdminCommands(sender, params, replier) {
    if (!isAdmin(sender)) {
        replier.reply('관리자만 사용할 수 있는 명령어입니다.');
        return;
    }

    switch(params[0]) {
        case '추가':
            if (params[1]) {
                adminNicknames.push(params[1]);
                replier.reply(params[1] + '님이 관리자로 추가되었습니다.');
            } else {
                replier.reply('사용법: /관리자 추가 [닉네임]');
            }
            break;
        case '삭제':
            if (params[1]) {
                const index = adminNicknames.indexOf(params[1]);
                if (index > -1) {
                    adminNicknames.splice(index, 1);
                    replier.reply(params[1] + '님이 관리자에서 삭제되었습니다.');
                } else {
                    replier.reply(params[1] + '님은 관리자가 아닙니다.');
                }
            } else {
                replier.reply('사용법: /관리자 삭제 [닉네임]');
            }
            break;
        default:
            replier.reply('올바른 관리자 명령어를 입력해주세요.');
    }
}