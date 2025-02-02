import { CommonService } from './common.service';
import { Injectable } from '@angular/core';
// { RTMClient }
import AgoraRTM, { RTMClient, RTMStreamChannel }   from 'agora-rtm-sdk';
// import { rtmUser } from '../models';
import { StreamService } from './stream.service';

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  rtmclient: RTMClient;
  channel: RTMStreamChannel;

  constructor(private common: CommonService, private stream: StreamService) { }

  // pass your appid in createInstance
  createRTMClient(uid: string) {
    // const client = AgoraRTM.createInstance(id, {
    //   enableLogUpload: false,
    // });
    // return client;
// Event handler
const rtmConfig = {};
    const signalingEngine = new AgoraRTM.RTM(this.stream.options.appId, uid, rtmConfig);
    return signalingEngine;
  }

  async signalLogin(client: RTMClient, token: string, uid: string) {
    console.log(client, token, uid, this, 'signalLogin');
    try {
      // uid
      await client.login({ token });
      console.log('AgoraRTM client login success');
    } catch (error) {
      console.log(error, 'AgoraRTM client login failure');
    }
  }

  async signalLogout(client) {
    await client.logout();
  }

  async rtmEvents(rtm: RTMClient) {
    // client.on('ConnectionStateChanged', (newState, reason) => {
    //   console.log(
    //     'on connection state changed to ' + newState + ' reason: ' + reason
    //   );
    // });

    // client.on('MessageFromPeer', (text, peerId) => {
    //   // text: text of the received message; peerId: User ID of the sender.
    //   /* Your code for handling the event of receiving a peer-to-peer message. */

    //   this.recievedMessage(text, peerId);
    // });
    // client.on('PeersOnlineStatusChanged', (status) => {
    //   console.log('PeersOnlineStatusChanged ', status);
    // });

     // Message event handler.
 
 // Add message event listeners
 // Message
 rtm.addEventListener("message", event => {
  const channelType = event.channelType; // Which channel type it is, Should be "STREAM", "MESSAGE" or "USER".
  const channelName = event.channelName; // Which channel does this message come from
  const topic = event.topicName; // Which Topic does this message come from, it is valid when the channelType is "STREAM".
  const messageType = event.messageType; // Which message type it is, Should be "STRING" or "BINARY" .
  const customType = event.customType; // User defined type
  const publisher = event.publisher; // Message publisher
  const message = event.message; // Message payload
  const timestamp = event.timestamp; // Event timestamp
  console.log(event, 'event message senderId');
  // this.showMessage(publisher, message);
  this.handleMessageReceived(event, publisher, rtm);
});
// Presence
rtm.addEventListener("presence", event => {
  const action = event.eventType; // Which action it is ,should be one of 'SNAPSHOT'、'INTERVAL'、'JOIN'、'LEAVE'、'TIMEOUT、'STATE_CHANGED'、'OUT_OF_SERVICE'.
  const channelType = event.channelType; // Which channel type it is, Should be "STREAM", "MESSAGE" or "USER".
  const channelName = event.channelName; // Which channel does this event come from
  const publisher = event.publisher; // Who trigger this event
  const states = event.stateChanged; // User state payload, only for stateChanged event
  const interval = event.interval; // Interval payload, only for interval event
  const snapshot = event.snapshot; // Snapshot payload, only for snapshot event
  const timestamp = event.timestamp; // Event timestamp
  console.log(event, 'event presence');
  if (event.eventType === "SNAPSHOT") {
    console.log("INFO", "I Join");
  }
  else {
    console.log("INFO", event.publisher + " is " + event.eventType, "others joining");
  }
});
// Topic
rtm.addEventListener("topic", event => {
  const action = event.eventType; // Which action it is ,should be one of 'SNAPSHOT'、'JOIN'、'LEAVE'.
  const channelName = event.channelName; // Which channel does this event come from
  const publisher = event.publisher; // Who trigger this event
  const topicInfos = event.topicInfos; // Topic information payload
  const totalTopics = event.totalTopics; // How many topics
  const timestamp = event.timestamp; // Event timestamp
  console.log(event, 'event topic publisher');
});
// Global variable
const channelTopics = new Map();

rtm.addEventListener("topic", (topicEvent) => {
  console.log(topicEvent, "topic");

  const topicsCache = channelTopics.get(topicEvent.channelName) ?? new Map();
  const remoteLeaved = new Map();
  const remoteJoined = new Map();
  const { publisher: user, channelName } = topicEvent;

  if (topicEvent.eventType === "SNAPSHOT") {
    topicEvent.topicInfos.forEach(({ publishers, topicName }) => {
      remoteJoined.set(topicName, []);
      remoteLeaved.set(topicName, []);
      const topicDetailsByCache = topicsCache.get(topicName) ?? [];

      // Removed
      topicDetailsByCache.forEach(({ publisherMeta, publisherUserId: targetUid }) => {
        if (!publishers.some(({ publisherUserId: eventUid }) => targetUid === eventUid)) {
          remoteLeaved.get(topicName)?.push({ publisherUserId: targetUid, publisherMeta });
          topicDetailsByCache.filter(({ publisherUserId: cacheUid }) => cacheUid !== targetUid);
        }
      });

      // Added
      publishers.forEach(({ publisherMeta, publisherUserId: eventUid }) => {
        if (!topicDetailsByCache.some(({ publisherUserId: cacheUid }) => eventUid === cacheUid)) {
          remoteJoined.get(topicName)?.push({ publisherUserId: eventUid, publisherMeta });
          topicDetailsByCache.push({ publisherUserId: eventUid, publisherMeta });
        }
      });

      topicsCache.set(topicName, topicDetailsByCache);
    });
  } else {
    // Your code for handling the updated event
    topicEvent.topicInfos.forEach(({ topicName, publishers }) => {
      const topicDetailsByCache = topicsCache.get(topicName) ?? [];
      publishers.forEach(({ publisherMeta, publisherUserId }) => {
        if (user === publisherUserId) {
          switch (topicEvent.eventType) {
            case "REMOTE_JOIN": {
              topicDetailsByCache.push({ publisherMeta, publisherUserId });
              break;
            }
            case "REMOTE_LEAVE": {
              topicDetailsByCache.filter(({ publisherUserId: uid }) => uid !== publisherUserId);
              break;
            }
          }
          topicsCache.set(topicName, topicDetailsByCache);
        }
      });
    });
  }

  channelTopics.set(channelName, topicsCache);
  console.log({ remoteJoined, remoteLeaved, channelTopics, channelName }, "topic diff for debug");
});

// Storage
rtm.addEventListener("storage", event => {
  const channelType = event.channelType; // Which channel type it is, Should be "STREAM", "MESSAGE" or "USER".
  const channelName = event.channelName; // Which channel does this event come from
  const publisher = event.publisher; // Who trigger this event
  const storageType = event.storageType; // Which category the event is, should be 'USER'、'CHANNEL'
  const action = event.eventType; // Which action it is ,should be one of "SNAPSHOT"、"SET"、"REMOVE"、"UPDATE" or "NONE"
  const data = event.data; // 'USER_METADATA' or 'CHANNEL_METADATA' payload
  const timestamp = event.timestamp; // Event timestamp
  console.log(event, 'event storage');
});
// Lock
rtm.addEventListener("lock", event => {
  const channelType = event.channelType; // Which channel type it is, Should be "STREAM", "MESSAGE" or "USER".
  const channelName = event.channelName; // Which channel does this event come from
  const publisher = event.publisher; // Who trigger this event
  const action = event.eventType; // Which action it is ,should be one of 'SET'、'REMOVED'、'ACQUIRED'、'RELEASED'、'EXPIRED'、'SNAPSHOT'
  const lockName = event.lockName; // Which lock it effect
  const ttl = event.ttl; // The ttl of this lock
  const snapshot = event.snapshot; // Snapshot payload
  const owner = event.owner; // The owner of this lock
  const timestamp = event.timestamp; // Event timestamp
  console.log(event, 'event lock');
});
// Connection State Change
rtm.addEventListener("status", event => {
  const currentState = event.state; // Which connection state right now
  const changeReason = event.reason; // Why trigger this event
  const timestamp = event.timestamp; // Event timestamp
  console.log(event, 'event status');
});
// Link State Change
rtm.addEventListener('linkState', event => {
  const currentState = event.currentState;
  const previousState = event.previousState;
  const serviceType = event.serviceType;
  const operation = event.operation;
  const reason = event.reason;
  const affectedChannels = event.affectedChannels;
  const unrestoredChannels = event.unrestoredChannels;
  const timestamp = event.timestamp;
  const isResumed = event.isResumed;
// Token Privilege Will Expire
console.log(event, 'event linkState');
});

rtm.addEventListener("tokenPrivilegeWillExpire", (channelName) => {
  // const channelName = channelName; // Which Channel Token Will Expire
  console.log(channelName, 'tokenPrivilegeWillExpire');
});
  }

  // private  showMessage(publisher: string, message: string): void {
  //   console.log(`${publisher}: ${message}`, 'showMessage');
  // }

  // recievedMessage(text, peerId: string) {
  //   console.log(text, peerId, 'MessageFromPeer');
  //   if (text.messageType === 'TEXT') {
  //     this.setCurrentMessage({ message: text.text, user: peerId });
  //   }
  // }

  async receiveChannelMessage(rtm: RTMClient) {
   
    // channel.on('ChannelMessage', (text, senderId, messagePros) => {
    //   // text: text of the received channel message; senderId: user ID of the sender.
    //   /* Your code for handling events, such as receiving a channel message. */
    //   this.handleMessageReceived(text, senderId, messagePros, client);
    // });
    // channel.on('MemberJoined', (memberId) => {
    //   console.log(memberId, 'MemberJoined');
    // });

    // channel.on('MemberLeft', (memberId) => {
    //   console.log('MemberLeft', memberId);
    // });

     // When joining a channel, enable the withMetadata switch
const options ={ withMetadata : true, withPresence : true };
try {
  const result = await rtm.subscribe("chat_room", options);
  console.log(result, 'chat_room');
} catch (status) {
  console.log(status);
}
  }
  // used to handle channel message
  // async handleMessageReceived(
  //   text,
  //   senderId: string,
  //   messagePros,
  //   client: RTMClient
  // ) {
  //   const user = await client.getUserAttributes(senderId); // senderId means uid getUserInfo
  //   console.log(text, senderId, messagePros, user, 'channelmsg');
  //   if (text.messageType === 'TEXT') {
  //     if (text.text == 'ping') {
  //       this.common.getNewUserInfo(senderId);
  //     } else {
  //       const newMessageData = { user, message: text.text };
  //       this.setCurrentMessage(newMessageData);
  //     }
  //   }
  // }

  async handleMessageReceived(
    text,
    senderId: string,
    client: RTMClient
  ) {
    // const user = await client.getUserAttributes(senderId); // senderId means uid getUserInfo
    console.log(text, senderId, 'handleMessageReceived');
    if (text.messageType === 'TEXT') {
      if (text.text == 'ping') {
        this.common.getNewUserInfo(senderId);
      } else {
    console.log(text, 'Message');

        // const newMessageData = { user, message: text.text };
        // this.setCurrentMessage(newMessageData);
      }
    }
  }

  // setCurrentMessage(newMessageData: rtmUser) {
  //   console.log(newMessageData, 'Message');
  // }

  sendOneToOneMessage(client: RTMClient, uid: string, text) {
    // client
    //   .sendMessageToPeer(
    //     { text }, // An RtmMessage object.
    //     uid // The user ID of the remote user.
    //   )
    //   .then((sendResult) => {
    //     if (sendResult.hasPeerReceived) {
    //       console.log(sendResult, 'sendMessageToPeer');

    //       /* Your code for handling the event that the remote user receives the message. */
    //     } else {
    //       /* Your code for handling the event that the message is received by the server but the remote user cannot be reached. */
    //     }
    //   })
    //   .catch((error) => {
    //     /* Your code for handling the event of a message send failure. */
    //   });

    client
  .publish(
    text,
    uid, // Remote user's ID
    { channelType: "USER" },
  )
  .then((sendResult) => {
    // implement the logic for when the remote user receives the message
  })
  .catch((error) => {
    // implement the logic for handling failures in sending point-to-point messages
  });
  }

  createRtmChannel(client: RTMClient) {
    // createChannel is depracated now we are using createStreamChannel now
    const channel = client.createStreamChannel(this.common.channelName); // demoChannel
    return channel;
  }

  async joinchannel(channel: RTMStreamChannel) {
    try {
      await channel.join();
    } catch (error) {
      console.log(error);
    }
  }

  async setLocalAttributes(client: RTMClient, name: string, isUserPresenting?) {
    // const isMobile = /iPhone|iPad|iPod|Android/i
    //   .test(navigator.userAgent)
    //   .toString();
    // console.log(isMobile, 'isMobile');
    // await client.setLocalUserAttributes({
    //   username,
    //   isMobile,
    // });
    const properties = {
      key : "Quantity",
      value : "20"
    };
    
    const announcement = {
      key : "Announcement",
      value : "Welcome to our shop!"
    };
    
    const price = {
      key : "T-shirt",
      value : "100"
    };

    const obj = {
      key : "name",
      value :name
    }
    
    const data = [properties, announcement, price, obj];
    const options = { addTimeStamp : true, addUserId : true };
    
    try {
      const result = await client.storage.setChannelMetadata(this.stream.options.channel, "MESSAGE", data, options);
      const resul1t = await client.storage.setUserMetadata([obj]);
     
      console.log(JSON.stringify(result),resul1t, 'setChannelMetadata');
    } catch (status) {
      console.log(JSON.stringify(status));
    }
  }

  // sendMessageChannel(channel: RTMStreamChannel, message: string) {
    // channel
    //   .sendMessage({ text: message })
    //   .then(() => {
    //     /* Your code for handling events, such as a channel message-send success. */
    //     console.log('sendMessageChanne');
    //   })
    //   .catch((error) => {
    //     /* Your code for handling events, such as a channel message-send failure. */
    //   });
  // }

  // Send a message to a channel
 publishMessage = async (rtm, message, msChannelName) => {
  const payload = { type: "text", message: message };
  const publishMessage = JSON.stringify(payload);
  const publishOptions = { channelType: 'MESSAGE'}
  try {
    const result = await rtm.publish(msChannelName, publishMessage, publishOptions);
    console.log(result, publishMessage);
  } catch (status) {
    console.log(status);
  }
}

//   async subscribetoachannel(rtm: RTMClient){
//     const options ={ withPresence : true };
// try {
//   const result = await rtm.subscribe("chat_room", options);
//   console.log(result);
// } catch (status) {
//   console.log(status); 
// } 
// }


  async leaveChannel(client: RTMClient, channel: RTMStreamChannel) {
    if (channel) {
      await channel.leave();
    }
    if (client) {
      await client.logout();
    }
  }

  rtmChannelSendMessage(action: string) {
    let msg;
    switch (action) {
      case 'ping':
        msg = JSON.stringify({ action: 'ping' });

        break;
    }

    return msg;
  }
  // async addUpdateUserAttribute(client: RTMClient, attribute) {
  //   await client.addOrUpdateLocalUserAttributes(attribute);
  // }

  // setChannelInfo(client: RTMClient, attribute, option, channel) {
  //   const result = client.setChannelAttributes(channel, attribute, option);
  // }

  // addOrUpdateChannelAttributes(client: RTMClient, attribute, option, channel) {
  //   const res = client.addOrUpdateChannelAttributes(channel, attribute, option);
  // }

  // getChannelAttributes(client: RTMClient, channel) {
  //   const res = client.getChannelAttributes(channel);
  // }

  // getRTMUserStatus(client: RTMClient, uidArray) {
  //   client
  //     .subscribePeersOnlineStatus(uidArray)
  //     .then(() => {
  //       console.log('subscribeStatus');
  //     })
  //     .catch((err) => {
  //       console.log('subscribeStatus failure', err);
  //     });
  // }

  // async getRTMUserOnlineStatus(client: RTMClient, uids) {
  //   const status = await client.queryPeersOnlineStatus(uids);
  // }
}
