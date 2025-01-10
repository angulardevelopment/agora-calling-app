import { CommonService } from './../services/common.service';
import { ActivatedRoute, ActivationStart, Router } from '@angular/router';
import { MessagingService } from './../services/messaging.service';
import { ApiService } from './../services/api.service';
import { StreamService } from './../services/stream.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import AgoraRTC from 'agora-rtc-sdk-ng';

@Component({
    selector: 'app-staging',
    templateUrl: './staging.component.html',
    styleUrls: ['./staging.component.scss'],
    standalone: false
})
export class StagingComponent implements OnInit {
  hideBtns = true;
  userName = '';
  urlId: string;
  subscriptions: Subscription[] = [];
  isVideoStreaming = true;
  toggleCamera = true;
  toggleAudio = true;
  @ViewChild('streamVideo') video;

  constructor(
    public stream: StreamService,
    public api: ApiService,
    private router: Router,
    public message: MessagingService,
    private route: ActivatedRoute,
    private common: CommonService
  ) {
    this.urlId = this.route.snapshot.params['id'];
    if (this.urlId == '1') {
      this.common.uid1 = this.common.generateUid();
      this.userName = this.common.name1;
    } else {
      this.common.uid2 = this.common.generateUid();
      this.userName = this.common.name2;
    }

    this.subscriptions.push(
      this.common.newUserJoined.subscribe(async (data) => {
        if (data.peerId) {
          try {
            const user = await this.message.rtmclient.getUserAttributes(
              data.peerId.toString()
            ); // senderId means uid getUserInfo
            console.log(data, user, 'userinfo newUserJoined');
          } catch (error) {
            console.log(error);
          }
        }
      })
    );
  }

  check() {
    return this.urlId == '1' ? this.common.uid1 : this.common.uid2;
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.rtmUserLogin(this.check());
    } catch (error) {
      console.log(error, 'error');
    }
  }

  async startCall() {
    try {
      if (this.userName) {
        // const uid = this.common.generateUid();
        const uid = this.check();
        const rtcDetails = await this.common.generateTokenAndUid(uid);
        this.stream.rtc.token = rtcDetails.token;
        // rtc
        this.stream.rtc.client = this.stream.createRTCClient('host');
        this.stream.agoraServerEvents(this.stream.rtc);
        this.deviceToggle();
        this.router.navigate([`/user/${this.urlId}`]);
        await this.stream.localUser(
          rtcDetails.token,
          uid,
          'host',
          this.stream.rtc
        );

        this.message.sendMessageChannel(this.message.channel, 'ping');

        this.hideBtns = false;
      } else {
        alert('Enter name to start call');
      }
    } catch (error) {
      console.log(error);
    }
  }

  deviceToggle(){
    AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
      // const externaldevices = await this.stream.alldevices();
      console.log( changedDevice);

  }
    AgoraRTC.onCameraChanged = async (changedDevice) => {

      // const externaldevices = await this.stream.alldevices();
      console.log( changedDevice);

      if (changedDevice.state === "INACTIVE") {
          const oldCamera = await AgoraRTC.getCameras();
          oldCamera[0] && this.stream.rtc.localVideoTrack.setDevice(oldCamera[0].deviceId);
        }
    };

      AgoraRTC.onPlaybackDeviceChanged = (info) => {
        console.log("speaker changed!", info);
      };
    }

  async rtmUserLogin(uid: number) {
    try {
      const rtmDetails = await this.common.generateRtmTokenAndUid(uid.toString());

      this.message.rtmclient = this.message.createRTMClient(this.stream.options.appId);

      this.message.channel = this.message.createRtmChannel(
        this.message.rtmclient
      );


      await this.message.signalLogin(
        this.message.rtmclient,
        rtmDetails.token,
        uid.toString()
      );
      // await this.message.joinchannel(this.message.channel);
      // await this.message.setLocalAttributes(
      //   this.message.rtmclient,
      //   this.userName
      // );
      // this.message.rtmEvents(this.message.rtmclient);
      // this.message.receiveChannelMessage(
      //   this.message.channel,
      //   this.message.rtmclient
      // );
    } catch (error) {
      console.log(error);
    }
  }

  setVideo(){

    if(!this.stream.videoStatus)
    {
      this.toggleCamera=true;
      this.stream.videoStatus=true;
      this.isVideoStreaming=true;

      this.openCamera();
    }
    else
    {
      this.stop();
      this.toggleCamera=false;
      this.stream.videoStatus=false;
      this.isVideoStreaming=false;

    }

}


async setAudio()
{
  if(!this.stream.audioStatus)
  {
    this.toggleAudio=true;
    this.stream.audioStatus=true;

  }
  else
  {
    this.toggleAudio=false;
    this.stream.audioStatus=false;


  }
}

openCamera()
{
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  .then((stream)=> {
    if(this.toggleCamera)
      this.isVideoStreaming=true;
    else
      this.isVideoStreaming=false;
      this.video.nativeElement.srcObject = stream;
      this.video.nativeElement.play();
  })
  .catch((err) =>{
      console.log("An error occurred: " + err);
      if(err=='NotAllowedError: Permission denied')
      {
        this.router.navigate(["error"]);
        this.stream.errorValue = 'miccamera';
      }
  });
}

stop() {
  if (this.video) {
    const stream = this.video.nativeElement.srcObject;
    if (stream) {
      const tracks = stream.getTracks();

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        track.stop();
        track['enabled'] = false;

      }
    }


    this.video.nativeElement.srcObject = null;
  }

}
}
