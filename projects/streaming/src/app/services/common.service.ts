import { HttpParams } from '@angular/common/http';
import { MessagingService } from './messaging.service';
import { ApiService } from './api.service';
import { StreamService } from './stream.service';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  uid1: number;
  uid2: number;
  name1 = 't1';
  name2 = 't2';
  newUserJoined: Subject<any> = new Subject<any>();
  // public message: MessagingService,
  constructor(public stream: StreamService, public api: ApiService) { }
  // rtc token
  async generateTokenAndUid(uid: number) {
    // https://test-agora.herokuapp.com/access_token?channel=test&uid=1234
    let url = 'https://test-agora.herokuapp.com/access_token?';
    const opts = {
      params: new HttpParams({ fromString: 'channel=test&uid=' + uid }),
    };
    const data = await this.api.getRequest(url, opts.params).toPromise();
    console.log(data, 'generateTokenAndUid')
    return { uid: uid, token: data['token'] };
  }

  async generateRtmTokenAndUid(uid: number) {
    // https://sharp-pouncing-grass.glitch.me/rtmToken?account=1234
    let url = 'https://sharp-pouncing-grass.glitch.me/rtmToken?';
    const opts = { params: new HttpParams({ fromString: 'account=' + uid }) };
    const data = await this.api.getRequest(url, opts.params).toPromise();
    console.log(data, 'generateRtmTokenAndUid')

    return { uid: uid, token: data['key'] };
  }

  // async generateRtmTokenAndUid2(uid: string) {
  //   // https://sharp-pouncing-grass.glitch.me/rtmToken?account=1234
  //   let url = 'https://darkened-coffee-chicory.glitch.me/rtmToken?';
  //   const opts = { params: new HttpParams({ fromString: 'account=' + uid }) };
  //   const data = await this.api.getRequest(url, opts.params).toPromise();
  //   return { uid: uid, token: data['key'] };
  // }

  generateUid() {
    const length = 5;
    const randomNo = Math.floor(
      Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
    );
    return randomNo;
  }

  getNewUserInfo(peerId: string) {
    this.newUserJoined.next({ peerId });
  }
}
