import { HttpParams } from '@angular/common/http';
import { MessagingService } from './messaging.service';
import { ApiService } from './api.service';
import { StreamService } from './stream.service';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ChannelType } from 'agora-rtm-sdk';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  channelName = 'chat_room';
  chatType: ChannelType = "MESSAGE"
  newUserJoined: Subject<any> = new Subject<any>();

  constructor(public stream: StreamService, public api: ApiService) {}

  async generatertcTokenAndUid(uid, channelName) {
    const url = 'https://agora-tokens-80k1.onrender.com/rtcToken';
    const opts = {
      params: new HttpParams({ fromString: `channelName=${channelName}&uid=` + uid }),
    };
    const data = await this.api.getRequest(url, opts.params).toPromise();
    console.log(data, 'rtcTokenAndUid');
    return { uid: uid, token: data['key'] };
  }

  async generateRtmTokenAndUid(uid: string) {
    const url = 'https://agora-tokens-80k1.onrender.com/rtmToken';
    const opts = { params: new HttpParams({ fromString: 'account=' + uid }) };
    const data = await this.api.getRequest(url, opts.params).toPromise();
    console.log(data, 'generateRtmTokenAndUid');
    return { uid: uid, token: data['key'] };
  }

  generateUid() {
    const length = 5;
    const randomNo = Math.floor(
      Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
    );
    return randomNo.toString();
  }

  getNewUserInfo(peerId: string) {
    console.log(peerId, 'getNewUserInfo');
    this.newUserJoined.next({ peerId });
  }

  async getAppDetails() {
    const url = 'https://agora-tokens-80k1.onrender.com/appDetails';
    const opts = {
      params: new HttpParams({ fromString: 'channelName=' + this.channelName }),
    };
    const data = await this.api.getRequest(url, opts.params).toPromise();
    console.log(data, 'getAppDetails');
    this.stream.options.appId = data['appid'];
    this.stream.options.channel = data['channelName'];
  }
}
