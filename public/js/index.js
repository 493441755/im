document.querySelector('.chat[data-chat=person2]').classList.add('active-chat');
document.querySelector('.person[data-chat=person2]').classList.add('active');
var localVideo = null;
var remoteVideo = null;
var hangup;

var btnCall = document.querySelector('.call');
var callWrapper = document.querySelector("#call_template");
var layer;
var room = "person2";
var localStream = null;
var remoteStream = null;
var pc;
var state = 'init';
var pcConfig = {
  'iceServers': [{
    'urls': 'turn:stun.ukerd.com:3478',
    'credential': "123456",
    'username': "longge"
  }]
};
var offerdesc = null;

var socket = io.connect();


layui.use('layer', function () {
  layer = layui.layer;
});

socket.emit('join', room);

var friends = {
  list: document.querySelector('ul.people'),
  all: document.querySelectorAll('.left .person'),
  name: ''
},

  chat = {
    container: document.querySelector('.container .right'),
    current: null,
    person: null,
    name: document.querySelector('.container .right .top .name')
  };


friends.all.forEach(function (f) {
  f.addEventListener('mousedown', function () {
    f.classList.contains('active') || setAciveChat(f);
  });
});

function setAciveChat(f) {
  friends.list.querySelector('.active').classList.remove('active');
  f.classList.add('active');
  chat.current = chat.container.querySelector('.active-chat');
  chat.person = f.getAttribute('data-chat');
  chat.current.classList.remove('active-chat');
  chat.container.querySelector('[data-chat="' + chat.person + '"]').classList.add('active-chat');
  friends.name = f.querySelector('.name').innerText;
  chat.name.innerHTML = friends.name;
  //console.log(chat.person);
  socket.emit('leave', room);
  room = chat.person;
  socket.emit("join", room);

}

function btnCallClick() {
  layer.open({
    type: 1,
    title: false,
    closeBtn: false,
    area: ['80%', '90%'],
    scrollbar: false,
    content: callWrapper.innerHTML
  });
  localVideo = document.querySelector(".localvideo");
  remoteVideo = document.querySelector(".remotevideo");
  hangup = document.querySelector(".hangup")
  if (state == "calling") {
    hangup.querySelector("img").src = "img/jieting.svg";
  }
  hangup.onclick = () => {
    if (state == 'calling') {
      call();
      hangup.querySelector("img").src = "img/hang_up.svg";
      localVideo.classList.remove("blur");
      state = 'called';
    } else {
      layer.closeAll();
      leave();
      if(socket){
        sendMessage(7,'init');

      }
    }

  }
  setTimeout(() => {
    start();
  }, 500);
}

function sendMessage(type, data) {
  socket.emit("message", room, { type: type, data: data });
}

var send = document.querySelector("a.send");
send.onclick = () => {
  var sendMessage = document.querySelector("#sendMessage").value;
  if(sendMessage.length == 0){
    layer.msg('尼玛，输入内容啊', {icon: 2});
    return
  }
  socket.emit('message', room, { type: 1, data: sendMessage });
  var item = document.createElement("div");
  document.querySelector('.active-chat').append(item);
  item.className = "bubble me";
  item.innerHTML = sendMessage;
  document.querySelector("#sendMessage").value = "";
}

btnCall.onclick = () => {
  state = 'call';
  btnCallClick();

};

socket.on('message', (room, id, data) => {
  console.log(data);
  var item = document.createElement("div");
  item.className = "bubble you";
  if (data.type == 1) {
    item.innerHTML = data.data;
  } else if (data.type == 2) {
    item.innerHTML = "<img src='" + data.data + "' style='width:100px;height:100px'>";
  } else if (data.type == 3 || data.type == 4 || data.type == 5 || data.type == 6 || data.type == 7) {//视频消息

    

    if (data.type == 3) {
      state = data.data;
      item.innerHTML = "视频通话";
      btnCallClick();
      localVideo.classList.add("blur");
    }else if(data.type == 7){
      leave();
      layer.closeAll();
    }
    else if(data.type == 4 || data.type == 5 || data.type == 6){
      var callData = data.data;
      if (callData.hasOwnProperty('type') && callData.type === 'offer') {
        
        pc.setRemoteDescription(new RTCSessionDescription(callData));
        pc.createAnswer()
          .then(getAnswer)
          .catch((err) => {
            console.error("Failed createAnswer error :", err);
          });
  
      } else if (callData.hasOwnProperty('type') && callData.type == 'answer') {
        pc.setRemoteDescription(new RTCSessionDescription(callData));
  
      } else if (callData.hasOwnProperty('type') && callData.type === 'candidate') {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: callData.label,
          candidate: callData.candidate
        });
        pc.addIceCandidate(candidate);
  
      } else {
        console.log('the message is invalid!', callData);
      }
    }


    return;
    /*
    if (data.type == 4) {
      state = 'init';
      createPeerConnection();
      btnCallClick();
    }
    if (callData.hasOwnProperty('type') && callData.type === 'offer') {
      if (pc == null) {
        createPeerConnection();
      }
      pc.setRemoteDescription(new RTCSessionDescription(callData));
      pc.createAnswer()
        .then(getAnswer)
        .catch((err) => {
          console.error("Failed createAnswer error :", err);
        });

    } else if (callData.hasOwnProperty('type') && callData.type == 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(callData));

    } else if (callData.hasOwnProperty('type') && callData.type === 'candidate') {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: callData.label,
        candidate: callData.candidate
      });
      pc.addIceCandidate(candidate);

    } else {
      console.log('the message is invalid!', callData);
    }
    return;
    */
  }

  document.querySelector('.active-chat').append(item);
});

socket.on("joined", (r, id) => {
  console.log("joined,房间号：" + r + ", ID:" + id);
});
socket.on("leaved", (r, id) => {
  console.log("leaved,房间号：" + r + ',ID:' + id);
});

socket.on('otherjoin', (roomid) => {
  console.log('receive joined message:', roomid, state);
});

socket.on('full', (roomid, id) => {
  console.log('receive full message', roomid, id);
  leave();
  state = 'leaved';
  layer.msg('卧槽，房间满啦', {icon: 2});

});

layui.use('upload', function () {
  var upload = layui.upload;
  var uploadInst = upload.render({
    elem: '.attach',
    url: '/upload',
    before: function (obj) {
      obj.preview(function (index, file, result) {
        var item = document.createElement("div");
        document.querySelector('.active-chat').append(item);
        item.className = "bubble me";
        item.innerHTML = "<img src='" + result + "' style='width:100px;height:100px'>";
      });
    },
    done: function (res) {
      if (res.code == 0) {
        socket.emit('message', room, { type: 2, data: res.data });
      } else {
        //失败重发
      }

    },
    error: function () {

    }
  });
});

function handleError(err) {
  console.error(err);
}

function start() {
  if (!navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia) {
    console.error('the getUserMedia is not supported!');
    return;
  } else {
    var constraints = {
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }
    navigator.mediaDevices.getUserMedia(constraints)
      .then(getMediaStream)
      .catch(handleError);
  }
}
function getMediaStream(stream) {
  if (localStream) {
    stream.getAudioTracks().forEach((track) => {
      localStream.addTrack(track);
      stream.removeTrack(track);
    });
  } else {
    localStream = stream;
  }
  localVideo.srcObject = localStream;
  bindTracks();
  if (state == 'call') {
    sendMessage(3, "calling")
  }
}


function createPeerConnection() {

  console.log('create RTCPeerConnection!');
  if (!pc) {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = (e) => {

      if (e.candidate) {
        var data = { type: 'candidate', label: event.candidate.sdpMLineIndex, id: event.candidate.sdpMid, candidate: event.candidate.candidate };
        //socket.emit("message", room, { type: 6, data: data })
        sendMessage(6, data);
      } else {
        console.log('this is the end candidate');
      }
    }
    pc.ontrack = getRemoteStream;
  } else {
    console.log('the pc have be created!');
  }
  return;
}
function bindTracks() {
  console.log('bind tracks into RTCPeerConnection!');

  if (pc === null || pc === undefined) {
    //console.error('pc is null or undefined!');
    //return;
    createPeerConnection();
  }

  if (localStream === null || localStream === undefined) {
    console.error('localstream is null or undefined!');
    closePc();
    return;
  }

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

}

function getAnswer(desc) {
  pc.setLocalDescription(desc);
  sendMessage(5, desc);
  //socket.emit("message", room, { type: 5, data: desc });
}

function getOffer(desc) {
  pc.setLocalDescription(desc);
  offerdesc = desc;
  sendMessage(4, desc);
  //socket.emit("message", room, { type: 3, data: desc });

}

function call() {
  var offerOptions = {
    offerToRecieveAudio: 1,
    offerToRecieveVideo: 1
  }
  pc.createOffer(offerOptions)
    .then(getOffer)
    .catch((err) => {
      console.error("Failed created offer error:", err);
    });

}

function getRemoteStream(e) {
  remoteStream = e.streams[0];
  remoteVideo.srcObject = e.streams[0];
}


function leave() {
  closeLocalMedia();
  closePc();

}


function closePc() {
  if (pc) {
    offerdesc = null;
    pc.close();
    pc = null;
  }

}
function closeLocalMedia() {
  if (localStream && localStream.getTracks()) {
    localStream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  localStream = null;
}


document.onkeydown = (event) => {
  if (event.keyCode == 13) {
    send.click();
  }
};