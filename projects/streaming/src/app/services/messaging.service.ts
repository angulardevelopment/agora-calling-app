import { CommonService } from './common.service';
import { Injectable } from '@angular/core';

import AgoraRTM, { RtmChannel, RtmClient, RtmMessage } from 'agora-rtm-sdk';
import { rtmUser } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MessagingService {
  rtmclient: RtmClient;
  channel: RtmChannel;

  constructor(private common: CommonService) {}

  // pass your appid in createInstance
  createRTMClient() {
    const client = AgoraRTM.createInstance('48b158ccc64343cf9973a8f5df311f2a', {
      enableLogUpload: false,
    });
    return client;
  }

  async signalLogin(client: RtmClient, token: string, uid: string) {
    await client.login({ token, uid });
    // .then(() => {
    //   console.log('AgoraRTM client login success');
    // }).catch(err => {
    //   console.log('AgoraRTM client login failure', err);
    // });
  }

  async signalLogout(client: RtmClient) {
    await client.logout();
  }

  rtmEvents(client: RtmClient) {
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

  recievedMessage(text: RtmMessage, peerId: string) {
    console.log(text, peerId, 'MessageFromPeer');
    if (text.messageType === 'TEXT') {
      this.setCurrentMessage({ message: text.text, user: peerId });
    }
  }

  receiveChannelMessage(channel: RtmChannel, client: RtmClient) {
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
    text: RtmMessage,
    senderId: string,
    messagePros,
    client: RtmClient
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

  sendOneToOneMessage(client: RtmClient, uid: string) {
    client
      .sendMessageToPeer(
        { text: 'test peer message' }, // An RtmMessage object.
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

  createRtmChannel(client: RtmClient) {
    const channel = client.createChannel('test');
    return channel;
  }

  async joinchannel(channel: RtmChannel) {
    await channel.join();
    // .then(() => {
    //   /* Your code for handling the event of a join-channel success. */
    // })
    // .catch(error => {
    //   /* Your code for handling the event of a join-channel failure. */
    // });
  }

  async setLocalAttributes(client: RtmClient, name: string, isUserPresenting?) {
    const isMobile = /iPhone|iPad|iPod|Android/i
      .test(navigator.userAgent)
      .toString();
    console.log(isMobile, 'isMobile');
    await client.setLocalUserAttributes({
      name,
      isMobile,
    });
  }

  sendMessageChannel(channel: RtmChannel, message: string) {
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

  async leaveChannel(client: RtmClient, channel: RtmChannel) {
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
  async addUpdateUserAttribute(client: RtmClient, attribute) {
    await client.addOrUpdateLocalUserAttributes(attribute);
  }

  setChannelInfo(client: RtmClient, attribute, option, channel) {
    const result = client.setChannelAttributes(channel, attribute, option);
  }

  addOrUpdateChannelAttributes(client: RtmClient, attribute, option, channel) {
    const res = client.addOrUpdateChannelAttributes(channel, attribute, option);
  }

  getChannelAttributes(client: RtmClient, channel) {
    const res = client.getChannelAttributes(channel);
  }

  getRTMUserStatus(client: RtmClient, uidArray) {
    client
      .subscribePeersOnlineStatus(uidArray)
      .then(() => {
        console.log('subscribeStatus');
      })
      .catch((err) => {
        console.log('subscribeStatus failure', err);
      });
  }

  async getRTMUserOnlineStatus(client: RtmClient, uids) {
    const status = await client.queryPeersOnlineStatus(uids);
  }
}
