import { CommonService } from './../services/common.service';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { StreamService } from '../services/stream.service';

@Component({
    selector: 'app-live',
    templateUrl: './live.component.html',
    styleUrls: ['./live.component.scss'],
    standalone: false
})
export class LiveComponent implements OnInit {
  constructor(
    public stream: StreamService,
    public api: ApiService,
    public common: CommonService
  ) { }

  ngOnInit(): void { }

  async joinLiveCall() {
    try {
      const uid = this.common.generateUid();
      const rtcDetails = await this.common.generateTokenAndUid(uid);
      this.stream.rtcLiveUser.client = this.stream.createRTCClient('live');
      this.stream.agoraServerEvents(this.stream.rtcLiveUser);
      await this.stream.localUser(
        rtcDetails.token,
        uid,
        'live',
        this.stream.rtcLiveUser
      );
    } catch (error) {
      console.log(error);
    }
  }
}
