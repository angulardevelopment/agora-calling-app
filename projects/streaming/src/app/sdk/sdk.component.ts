import { CommonService } from './../services/common.service';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { MessagingService } from '../services/messaging.service';
import { StreamService } from '../services/stream.service';

@Component({
  selector: 'app-sdk',
  templateUrl: './sdk.component.html',
  styleUrls: ['./sdk.component.scss'],
})
export class SdkComponent implements OnInit {
  userName: string;
  urlId: string;
  speaking = true;
  constructor(
    public stream: StreamService,
    public api: ApiService,
    private common: CommonService,
    public message: MessagingService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.urlId = this.route.snapshot.params['id'];
    if (this.urlId == '1') {
      this.userName = this.common.name1;
    } else {
      this.userName = this.common.name2;
    }

    this.stream.updateUserInfo.subscribe(async (id) => {
      if (id) {
        try {
          const user = await this.message.rtmclient.getUserAttributes(
            id.toString()
          ); // senderId means uid getUserInfo

          for (let index = 0; index < this.stream.remoteUsers.length; index++) {
            const element = this.stream.remoteUsers[index];
            if (element.uid == id) {
              element.name = user.name;
            }
          }
        } catch (error) {
          console.log(error, 'error');
        }
      }
    });
  }

  ngOnInit() {
    this.checkUserSpeakingAlert();
  }

  async rtclogin(uid: number) {
    try {
      const rtcDetails = await this.common.generateTokenAndUid(uid);
      this.stream.rtcscreenshare.client = this.stream.createRTCClient('host');
      // await this.stream.setRole( this.stream.rtcscreenshare.client, 'host')
      
      this.stream.agoraServerEvents(
        this.stream.rtc,
        this.common.uid1,
        this.common.uid2
      );
      return { token: rtcDetails.token, uid };
    } catch (error) {
      console.log(error);
    }
  }

  // rtm login for screen share
  async rtmUserLogin() {
    try {
      const uid = this.common.generateUid();
      this.message.rtmclient = this.message.createRTMClient();

      // this.message.channel = this.message.createRtmChannel(this.message.rtmclient);
      const rtmDetails = await this.common.generateRtmTokenAndUid(uid);
 
      await this.message.signalLogin(
        this.message.rtmclient,
        rtmDetails.token,
        uid.toString()
      );
      // await this.message.joinchannel(this.message.channel);
      await this.message.setLocalAttributes(
        this.message.rtmclient,
        this.userName,
        { isUserPresenting: '1' }
      );
      this.message.rtmEvents(this.message.rtmclient);
      // this.message.receiveChannelMessage(this.message.channel, this.message.rtmclient);
      return uid;
    } catch (error) {
      console.log(error);
    }
  }

  peertopeer() {
    this.message.sendOneToOneMessage(
      this.message.rtmclient,
      this.stream.remoteUsers[0].uid.toString()
    );
  }

  channelMsg() {
    this.message.sendMessageChannel(
      this.message.channel,
      'test channel message'
    );
  }

  async rtmclientChannelLogout() {
    try {
      await this.stream.leaveCall(this.stream.rtc);
      await this.message.leaveChannel(
        this.message.rtmclient,
        this.message.channel
      );
    } catch (error) {
      console.log(error);
    }
    this.router.navigate([`/staging/${this.urlId}`]);

  }

  async shareScreen() {
    try {
      this.stream.presentingId = await this.rtmUserLogin(); //Storing information of Share screen.
      const user = await this.rtclogin(this.stream.presentingId);
      this.stream.isScreenShared = true;
      await this.stream.shareScreen(user);
    } catch (error) {
      console.log(error);
    }
  }

  async ngOnDestroy() {
    await this.rtmclientChannelLogout();
  }

  async mute() {
    this.stream.rtc.localAudioTrack.setEnabled(false);
    this.stream.rtc.audio = false;
    this.speaking = false;
    this.checkUserSpeakingAlert();
  }

  unmute() {
    this.stream.rtc.localAudioTrack.setEnabled(true);
    this.stream.rtc.audio = true;

  }

  cohost(){
    const s= {
      channelName: 'test',
      uid: this.common.uid1,
      token: this.stream.rtc.token,
    }
    const d = {
      channelName: 'test',
      uid: 123,
      token: 'yourDestToken',
    }
    this.stream.initiateMediaStreamRelay(s, d);
  }

  audioVisualizer(){
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {

      let audioContext = new AudioContext();
 
      let analyser = audioContext.createAnalyser();
 
      let microphone = audioContext.createMediaStreamSource(stream);
 
      let javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
 
       analyser.smoothingTimeConstant = 0.8;
 
       analyser.fftSize = 1024;
 
       microphone.connect(analyser);
 
       analyser.connect(javascriptNode);
 
       javascriptNode.connect(audioContext.destination);
 
       javascriptNode.onaudioprocess = function() {
 
           var array = new Uint8Array(analyser.frequencyBinCount);
 
           analyser.getByteFrequencyData(array);
 
           var values = 0;
 
    
 
           var length = array.length;
 
           for (var i = 0; i < length; i++) {
 
             values += (array[i]);
 
           }
 
    
 
           var average = values / length;
 
    
 
           if(Math.round(average)>15)
 
           {
 
             console.log(Math.round(average));
 
             // document.getElementById("lvl").innerHTML = Math.round(average)-10;
 
           }
 
        
 
       }
 
       })
 
       .catch(function(err) {
 
         /* handle the error */
 
     }); 
  }

  // if user is speaking show alert you are on mute
  checkUserSpeakingAlert(){
    const startAudioCheck = async () => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      const audioContext = new AudioContext();
      const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(mediaStream);
      const analyserNode = audioContext.createAnalyser();
      mediaStreamAudioSourceNode.connect(analyserNode);
      const pcmData = new Float32Array(analyserNode.fftSize);

      const checkAudio = () => {
        analyserNode.getFloatTimeDomainData(pcmData);
        let sumSquares = 0.0;
        for (const amplitude of pcmData) { sumSquares += amplitude * amplitude; }
        let vol = Math.sqrt(sumSquares / pcmData.length)


        
        if (vol > 0.05 && !this.speaking) {
          // setSpeaking(true)
          console.log('user speaking');
          this.speaking = true;
          setTimeout(() => { 
            // setSpeaking(false) 
          console.log('user not speaking');
          this.speaking = false;

          }, 2000)
        }
      };
  
      if (this.stream.rtc.audio === false) {
        this.stream.rtc.checkSpeakingInterval = setInterval(checkAudio, 100)
      }
      else {
        clearInterval(this.stream.rtc.checkSpeakingInterval)
      }
    }
    if (this.stream.rtc.client) {
      startAudioCheck()
    }
  //   return () => {
  //     // eslint-disable-next-line
      clearInterval(this.stream.rtc.checkSpeakingInterval)
  //   }
  //   // eslint-disable-next-line
  // }, [user.audio])
  }

  setVol(e, user){
  let vol = parseInt(e.target.value); !isNaN(vol) && vol >= 0 && vol <= 1000 && (user.audioTrack.setVolume(parseInt(e.target.value))) 
  }
}
