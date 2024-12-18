import { CommonService } from './common.service';
import { Injectable } from '@angular/core';

import AgoraRTM  from 'agora-rtm-sdk';
import { rtmUser } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  rtmclient;
  channel;

  constructor(private common: CommonService) { }

  // pass your appid in createInstance
  createRTMClient(id) {
    // const client = AgoraRTM.createInstance(id, {
    //   enableLogUpload: false,
    // });
    // return client;

    const signalingEngine = new AgoraRTM.RTM('app-id', 'user-id');
    return signalingEngine;
  }

  async signalLogin(client, token: string, uid: string) {
    try {
      await client.login({ token, uid });
    } catch (error) {
      console.log(error);
    }

    // .then(() => {
    //   console.log('AgoraRTM client login success');
    // }).catch(err => {
    //   console.log('AgoraRTM client login failure', err);
    // });
  }

  async signalLogout(client) {
    await client.logout();
  }

  rtmEvents(client) {
    client.on('ConnectionStateChanged', (newState, reason) => {
      console.log(
        'on connection state changed to ' + newState + ' reason: ' + reason
      );
    });

    client.on('MessageFromPeer', (text, peerId) => {
      // text: text of the received message; peerId: User ID of the sender.
      /* Your code for handling the event of receiving a peer-to-peer message. */

      this.recievedMessage(text, peerId);
    });
    client.on('PeersOnlineStatusChanged', (status) => {
      console.log('PeersOnlineStatusChanged ', status);
    });
  }

  recievedMessage(text, peerId: string) {
    console.log(text, peerId, 'MessageFromPeer');
    if (text.messageType === 'TEXT') {
      this.setCurrentMessage({ message: text.text, user: peerId });
    }
  }

  receiveChannelMessage(channel, client) {
    channel.on('ChannelMessage', (text, senderId, messagePros) => {
      // text: text of the received channel message; senderId: user ID of the sender.
      /* Your code for handling events, such as receiving a channel message. */
      this.handleMessageReceived(text, senderId, messagePros, client);
    });
    channel.on('MemberJoined', (memberId) => {
      console.log(memberId, 'MemberJoined');
    });

    channel.on('MemberLeft', (memberId) => {
      console.log('MemberLeft', memberId);
    });
  }
  // used to handle channel message
  async handleMessageReceived(
    text,
    senderId: string,
    messagePros,
    client
  ) {
    const user = await client.getUserAttributes(senderId); // senderId means uid getUserInfo
    console.log(text, senderId, messagePros, user, 'channelmsg');
    if (text.messageType === 'TEXT') {
      if (text.text == 'ping') {
        this.common.getNewUserInfo(senderId);
      } else {
        const newMessageData = { user, message: text.text };
        this.setCurrentMessage(newMessageData);
      }
    }
  }

  setCurrentMessage(newMessageData: rtmUser) {
    console.log(newMessageData, 'Message');
  }

  sendOneToOneMessage(client, uid: string, text) {
    client
      .sendMessageToPeer(
        { text }, // An RtmMessage object.
        uid // The user ID of the remote user.
      )
      .then((sendResult) => {
        if (sendResult.hasPeerReceived) {
          console.log(sendResult, 'sendMessageToPeer');

          /* Your code for handling the event that the remote user receives the message. */
        } else {
          /* Your code for handling the event that the message is received by the server but the remote user cannot be reached. */
        }
      })
      .catch((error) => {
        /* Your code for handling the event of a message send failure. */
      });
  }

  createRtmChannel(client) {
    const channel = client.createChannel('test');
    return channel;
  }

  async joinchannel(channel) {
    try {
      await channel.join();
    } catch (error) {
      console.log(error);
    }

    // .then(() => {
    //   /* Your code for handling the event of a join-channel success. */
    // })
    // .catch(error => {
    //   /* Your code for handling the event of a join-channel failure. */
    // });
  }

  async setLocalAttributes(client, name: string, isUserPresenting?) {
    const isMobile = /iPhone|iPad|iPod|Android/i
      .test(navigator.userAgent)
      .toString();
    console.log(isMobile, 'isMobile');
    await client.setLocalUserAttributes({
      name,
      isMobile,
    });
  }

  sendMessageChannel(channel, message: string) {
    channel
      .sendMessage({ text: message })
      .then(() => {
        /* Your code for handling events, such as a channel message-send success. */
        console.log('sendMessageChannel');
      })
      .catch((error) => {
        /* Your code for handling events, such as a channel message-send failure. */
      });
  }

  async leaveChannel(client, channel) {
    if (channel) {
      await channel.leave();
    }
    if (client) {
      await client.logout();
    }
  }

  rtmChannelSendMessage(action) {
    let msg;
    switch (action) {
      case 'ping':
        msg = JSON.stringify({ action: 'ping' });

        break;
    }

    return msg;
  }
  async addUpdateUserAttribute(client, attribute) {
    await client.addOrUpdateLocalUserAttributes(attribute);
  }

  setChannelInfo(client, attribute, option, channel) {
    const result = client.setChannelAttributes(channel, attribute, option);
  }

  addOrUpdateChannelAttributes(client, attribute, option, channel) {
    const res = client.addOrUpdateChannelAttributes(channel, attribute, option);
  }

  getChannelAttributes(client, channel) {
    const res = client.getChannelAttributes(channel);
  }

  getRTMUserStatus(client, uidArray) {
    client
      .subscribePeersOnlineStatus(uidArray)
      .then(() => {
        console.log('subscribeStatus');
      })
      .catch((err) => {
        console.log('subscribeStatus failure', err);
      });
  }

  async getRTMUserOnlineStatus(client, uids) {
    const status = await client.queryPeersOnlineStatus(uids);
  }
}
