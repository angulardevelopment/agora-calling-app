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
  @ViewChild('streamVideo') video;

  hideBtns = true;
  urlId: string;
  subscriptions: Subscription[] = [];
  isVideoStreaming = true;
  toggleCamera = true;
  toggleAudio = true;

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
    } else {
      this.common.uid2 = this.common.generateUid();
    }
//getUserInfo
    this.subscriptions.push(
      this.common.newUserJoined.subscribe(async (data) => {
        if (data.peerId) {
          try {
          const result = await this.message.rtmclient.storage.getChannelMetadata(this.stream.options.channel, "MESSAGE");
          const getUserAttributes = await this.message.rtmclient.storage.getUserMetadata({userId: data.peerId});
            console.log(data, result, this,getUserAttributes.metadata,'userinfo newUserJoined data.peerId');
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
      // check gives uid based on urlId
      await this.rtmUserLogin(this.check());
    } catch (error) {
      console.log(error, 'error');
    }
  }

  async startCall() {
    try {
      if (this.stream.name) {
        const uid = this.check();
        const rtcDetails = await this.common.generatertcTokenAndUid(uid);
        this.stream.rtc.token = rtcDetails.token;
        this.stream.rtc.client = this.stream.createRTCClient('host');
        this.stream.agoraServerEvents(this.stream.rtc);
        this.deviceToggle();
        this.router.navigate([`/user/${this.urlId}`]);
        await this.stream.localUser(rtcDetails.token, uid,'host',this.stream.rtc);

        await this.message.setLocalAttributes(
          this.message.rtmclient,
          this.stream.name
        );
        
        this.message.publishMessage(this.message.rtmclient, 'ping', this.message.channel, );
        this.message.receiveChannelMessage(this.message.rtmclient);
        this.hideBtns = false;
      } else {
        alert('Enter name to start call');
      }
    } catch (error) {
      console.log(error);
    }
  }

  async deviceToggle(){
    const externaldevices = await this.stream.alldevices();
    AgoraRTC.onMicrophoneChanged = async (changedDevice) => {
     
      console.log( changedDevice,externaldevices, 'onMicrophoneChanged');

  }
    AgoraRTC.onCameraChanged = async (changedDevice) => {

      // const externaldevices = await this.stream.alldevices();
      console.log( changedDevice, 'onCameraChanged');

      if (changedDevice.state === "INACTIVE") {
          const oldCamera = await AgoraRTC.getCameras();
          oldCamera[0] && this.stream.rtc.localVideoTrack.setDevice(oldCamera[0].deviceId);
        }
    };

      AgoraRTC.onPlaybackDeviceChanged = (info) => {
        console.log("speaker changed!", info);
      };
    }

  async rtmUserLogin(uid: string) {
    try {
      const rtmDetails = await this.common.generateRtmTokenAndUid(this.check());

      this.message.rtmclient = this.message.createRTMClient(uid.toString());

      //test
      this.message.channel = this.message.createRtmChannel(
        this.message.rtmclient
      );

      await this.message.signalLogin(
        this.message.rtmclient,
        rtmDetails.token,
        uid
      );
      await this.message.joinchannel(this.message.channel);
      // await this.message.setLocalAttributes(
      //   this.message.rtmclient,
      //   this.stream.name
      // );
      this.message.rtmEvents(this.message.rtmclient);
      this.message.receiveChannelMessage(
        this.message.rtmclient
      );
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
