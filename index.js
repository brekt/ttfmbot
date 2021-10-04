require('dotenv').config();
const fetch = require('node-fetch');
const PubNub = require('pubnub');
const io = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');

const headers = {
  authorization: `Bearer ${process.env.TTFM_AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

const registerBot = async () => {
  const options = {
    method: 'POST',
    headers,
    body: {
      botNickName: 'vapeking',
      avatarId: '1',
      color: 'red',
    },
  };
  options.body = JSON.stringify(options.body);
  const response = await fetch(
    'https://api.prod.tt.fm/users/sign-up-bot',
    options
  );
  const result = await response.json();

  console.log(result);
};

const getPubNubCreds = async () => {
  const options = {
    method: 'GET',
    headers,
  };

  const response = await fetch('https://api.prod.tt.fm/pubnub/token', options);
  const result = await response.json();

  return result;
};

const connectToPubNub = async () => {
  const creds = await getPubNubCreds();

  const pubnub = new PubNub({
    publishKey: creds.pubnubPublishKey,
    subscribeKey: creds.pubnubSubscribeKey,
    uuid: creds.userUuid,
    authKey: creds.pubnubAuthToken,
  });

  pubnub.addListener({
    message: function (m) {
      console.log(m);
    },
    presence: function (p) {
      console.log(p);
    },
    signal: function (s) {
      console.log(s);
    },
    objects: (objectEvent) => {
      console.log(objectEvent);
    },
    messageAction: function (ma) {
      console.log(ma);
    },
    file: function (event) {
      console.log(event);
    },
    status: function (s) {
      console.log(s);
    },
  });

  /*
{
	"content":str(chatMessage),
	"id":str(uuid.uuid4()),
	"avatarId":str(self.bot.pubnub_chat_avatarId),
	"userName":str(self.bot.pubnub_chat_userName),
	"userId":int(self.bot.pubnub_chat_userId),
	"color":"#2DF997",
	"userUuid":str(self.bot.uuid)}
*/

  const publishPayload = {
    channel: 'thegarage',
    message: {
      avatarId: 1,
      content: 'from app',
      id: String(uuidv4()),
      userId: 'brekt',
      userName: 'brektBot',
      userUuid: creds.userUuid,
      color: '#2DF997',
    },
  };

  pubnub.publish(publishPayload, function (status, response) {
    console.log(status, response);
  });
};

const getRooms = async () => {
  const options = {
    method: 'GET',
    headers,
  };

  const response = await fetch('https://rooms.prod.tt.fm/rooms', options);
  const result = await response.json();

  return result.rooms;
};

const getSocketRooms = (rooms) => {
  return rooms.filter((room) => room?.socketDomain);
};

const connectToTheGarage = async () => {
  const rooms = await getRooms();
  const room = getSocketRooms(rooms).find((room) => room.name === 'The Garage');

  console.log(room);
  const url = `wss://${room.socketDomain}`;
  const socket = io(url, {
    path: room.socketPath,
    rejectUnauthorized: false,
    extraHeaders: {
      authorization: `Bearer ${process.env.TTFM_AUTH_TOKEN}`,
    },
  });

  socket.on('connect', () => {
    console.log('Connected');
    connectToPubNub();
  });

  socket.on('connect_error', (e) => {
    console.error(e);
  });
};

(async () => {
  connectToTheGarage();
})();
