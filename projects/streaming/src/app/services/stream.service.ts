import { Injectable } from '@angular/core';
import AgoraRTC, {
  IAgoraRTCClient,
  LiveStreamingTranscodingConfig,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ScreenVideoTrackInitConfig,
  VideoEncoderConfiguration,
  AREAS,
  IRemoteAudioTrack,
  ClientRole,
} from 'agora-rtc-sdk-ng';
import { BehaviorSubject } from 'rxjs';
import { IRtc, IUser } from '../models';
import { CommonService } from './common.service';
@Injectable({
  providedIn: 'root',
})
export class StreamService {
  rtc: IRtc = {
    // For the local client.
    client: null,
    // For the local audio and video tracks.
    localAudioTrack: null,
    localVideoTrack: null,
    token: '',
    checkSpeakingInterval: null,
    audio: true,
    video: true
  };
  rtcLiveUser: IRtc = {
    // For the local client.
    client: null,
    // For the local audio and video tracks.
    localAudioTrack: null,
    localVideoTrack: null,
  };
  rtcscreenshare = {
    // For the local client.
    client: null,
    // For the local audio and video tracks.
    localAudioTrack: null,
    localVideoTrack: null,
    localScreenTrack: null,
    uid: null,
  };
  name;
  videoStatus = true;
  audioStatus = false;
  errorValue;
  type;

  // liveUsersList = [];
  options = {
    appId: '', // set your appid here
    channel: 'test', // Set the channel name.
    // token: '', // Pass a token if your project enables the App Certificate.
    // uid: null
  };
  remoteUsers: IUser[] = []; // To add remote users in list
  updateUserInfo = new BehaviorSubject<any>(null); // to update remote users name
  isScreenShared = false;
  presentingId = 0;

  constructor() { }
    // create client instances for camera (client) and screen share (screenClient)
  createRTCClient(type: string) {
    // h264- better detail at a higher motion
    // use the vp8 for better detail in low motion
    if (type == 'live') {
      return AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    } else {
      return AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
    }
  }
  // To add virtual camera
  async switchCamera(label: string, localTracks: ICameraVideoTrack) {
    const cams = await this.getVideodevices();
    let currentCam = cams.find((cam) => cam.label === label);
    await localTracks.setDevice(currentCam.deviceId);
  }
  async getVideodevices(){
  let cams = await AgoraRTC.getCameras(); //  all cameras devices you can use
  return cams;
  }
  // To join a call with tracks (video or audio)
  async localUser(token: string, uuid: number, type: string, rtc: IRtc) {
    if (type == 'live') {
      await this.setRole(rtc, 'audience');
    }
    await rtc.client.join(
      this.options.appId,
      this.options.channel,
      token,
      uuid
    );
    if (type == 'host') {
      // Create an audio track from the audio sampled by a microphone.
      this.rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack(
        // Custom Audio Manipulation
        {
          encoderConfig: {
            sampleRate: 48000,
            stereo: true,
            bitrate: 128,
          }
        });
      // Create a video track from the video captured by a camera.
      this.rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: '120p',
      });

      // if you want to use your camera
      // this.switchCamera('OBS Virtual Camera', this.rtc.localVideoTrack)

      // Publish the local audio and video tracks to the channel.
      // this.rtc.localAudioTrack.play();
      this.rtc.localVideoTrack.play('local-player');

      // channel for other users to subscribe to it.
      await rtc.client.publish([
        this.rtc.localAudioTrack,
        this.rtc.localVideoTrack,
      ]);
    }
  }

  async ownAudioSource(rtc) {
    const media = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    let audioTrack = media.getAudioTracks()[0]
    rtc.current.localAudioTrack = AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: audioTrack });
  }

  async shareScreen(user: IUser) {
    try {
      this.rtcscreenshare.localScreenTrack = await this.playStream();

      const uid = await this.rtcscreenshare.client.join(
        this.options.appId,
        this.options.channel,
        user.token,
        user.uid
      );
      this.rtcscreenshare.uid = uid;

      await this.rtcscreenshare.client.publish(
        this.rtcscreenshare.localScreenTrack
      );
      setTimeout(() => {
        this.rtcscreenshare.localScreenTrack.play('screens', { fit: 'cover' });
      }, 1000);
    } catch (e) {
      console.log('throwerror', e);
      return;
    }
  }

  async playStream() {
    // Set the encoder configurations. encoderConfig- defines image quality and resolution. It is optional field.
    const localScreenTrack = await AgoraRTC.createScreenVideoTrack({
      encoderConfig: '1080p_1',
    });
    return localScreenTrack;
  }

  agoraServerEvents(rtc: IRtc, uid1?: number, uid2?: number) {
    // 2 used
    rtc.client.on('user-published', async (user, mediaType) => {
      console.log(user, mediaType, 'user-published');

      await rtc.client.subscribe(user, mediaType);
      let id = user.uid;

      if (uid1 != id && this.rtcscreenshare.uid != id && uid2 != id) {
        console.log(this.isScreenShared, 'isScreenShared');

        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          setTimeout(() => {
            remoteVideoTrack.play('remote-playerlist' + user.uid);
          }, 1000);
        }
        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack.play();
        }
      }
    });

    rtc.client.on('user-unpublished', (user) => {
      console.log(user, 'user-unpublished');
    });
    rtc.client.on('connection-state-change', (curState, prevState) => {
      console.log('current', curState, 'prev', prevState, 'event');
    });

    // 1 used
    rtc.client.on('user-joined', (user) => {
      let id = user.uid;
      if (uid1 != id && this.rtcscreenshare.uid != id && uid2 != id) {
        this.remoteUsers.push({ uid: +id });
        this.updateUserInfo.next(id);
      }
      console.log('user-joined', user, this.remoteUsers, 'event1');
    });
    rtc.client.on('channel-media-relay-event', (user) => {
      console.log('channel-media-relay-event', user, 'event2');
    });
    rtc.client.on('channel-media-relay-state', (user) => {
      console.log('channel-media-relay-state', user, 'event4');
    });
    rtc.client.on('user-left', (user) => {
      console.log('user-left', user, 'event3');
    });

    rtc.client.on('crypt-error', (user) => {
      console.log('crypt-error', user, 'event5');
    });
    rtc.client.on('exception', (user) => {
      console.log('exception', user, 'event6');
    });
    rtc.client.on('live-streaming-error', (user) => {
      console.log('live-streaming-error', user, 'event7');
    });
    rtc.client.on('live-streaming-warning', (user) => {
      console.log('live-streaming-warning', user, 'event8');
    });
    rtc.client.on('media-reconnect-end', (user) => {
      console.log('media-reconnect-end', user, 'event9');
    });
    rtc.client.on('media-reconnect-start', (user) => {
      console.log('media-reconnect-start', user, 'event10');
    });
    rtc.client.on('network-quality', (user) => {
      // console.log("network-quality", user, 'event11');
    });
    rtc.client.on('stream-fallback', (user) => {
      console.log('stream-fallback', user, 'event12');
    });
    rtc.client.on('stream-type-changed', (user) => {
      console.log('stream-type-changed', user, 'event13');
    });
    rtc.client.on('token-privilege-did-expire', (user) => {
      console.log('token-privilege-did-expire', user, 'event14');
    });
    rtc.client.on('token-privilege-will-expire', (user) => {
      console.log('token-privilege-will-expire', user, 'event15');
    });
    // rtc.client.enableAudioVolumeIndicator();
    rtc.client.on('volume-indicator', (user) => {
      console.log('volume-indicator', user, 'volume');
    });
    rtc.client.on('track-ended', () => {
      console.log('track-ended', 'event17');
    });

  }
  // To leave channel-
  async leaveCall(rtc: IRtc) {
    // Destroy the local audio and video tracks.
    if (rtc.localAudioTrack != undefined) {
      rtc.localAudioTrack.close();
    }
    if (rtc.localVideoTrack != undefined) {
      rtc.localVideoTrack.close();
    }

    // Traverse all remote users.
    if (rtc.client != undefined) {
      rtc.client.remoteUsers.forEach((user) => {
        // Destroy the dynamically created DIV container.
        const playerContainer = document.getElementById(
          'remote-playerlist' + user.uid.toString()
        );
        playerContainer && playerContainer.remove();
      });
      // Leave the channel.
      await rtc.client.leave();
    }

    // for (trackName in localTracks) {
    //   var track = localTracks[trackName];
    //   if(track) {
    //   track.stop();
    //   track.close();
    //   localTracks[trackName] = undefined;
    //   }
    //   }
    //   remoteUsers = {}; // clear remote users and player views
    //   localTracks = {};
  }

  clientProp() {
    console.log(this.rtc.client.channelName, 'channelName');
    console.log(this.rtc.client.localTracks, 'localTracks');
    console.log(this.rtc.client.remoteUsers, 'remoteUsers');

    console.log(this.rtc.client.uid, 'uid');
    console.log(this.rtc.client.getListeners('ee'));

    const clientStats = this.rtc.client.getRTCStats(); // checkCount
    const clientStatsList = [
      {
        description: 'Number of users in channel',
        value: clientStats.UserCount,
        unit: '',
      },
      {
        description: 'Duration in channel',
        value: clientStats.Duration,
        unit: 's',
      },
      {
        description: 'Bit rate receiving',
        value: clientStats.RecvBitrate,
        unit: 'bps',
      },
      {
        description: 'Bit rate being sent',
        value: clientStats.SendBitrate,
        unit: 'bps',
      },
      {
        description: 'Total bytes received',
        value: clientStats.RecvBytes,
        unit: 'bytes',
      },
      {
        description: 'Total bytes sent',
        value: clientStats.SendBytes,
        unit: 'bytes',
      },
      {
        description: 'Outgoing available bandwidth',
        value: clientStats.OutgoingAvailableBandwidth.toFixed(3),
        unit: 'kbps',
      },
      {
        description: 'RTT from SDK to SD-RTN access node',
        value: clientStats.RTT,
        unit: 'ms',
      },
    ];
    console.log(clientStatsList, 'clientStatsList');
  }

  trackProp() {
    console.log(this.rtc.localAudioTrack.isPlaying, 'isPlaying');
    console.log(this.rtc.localAudioTrack.trackMediaType, 'trackMediaType');
    console.log(
      this.rtc.localAudioTrack.getMediaStreamTrack(),
      'getMediaStreamTrack()'
    );

    const localStats = { audio: this.rtc.localAudioTrack.getStats() };
    const localAudioStats = [
      {
        description: 'Send audio bit rate',
        value: localStats.audio.sendBitrate,
        unit: 'bps',
      },
      {
        description: 'Total audio bytes sent',
        value: localStats.audio.sendBytes,
        unit: 'bytes',
      },
      {
        description: 'Total audio packets sent',
        value: localStats.audio.sendPackets,
        unit: '',
      },
      {
        description: 'Total audio packets loss',
        value: localStats.audio.sendPacketsLost,
        unit: '',
      },
    ];

    console.log(localAudioStats, 'localAudioStats');

    const localVideoStats = { video: this.rtc.localVideoTrack.getStats() };
    const localVideoData = [
      {
        description: 'Video capture resolution height',
        value: localVideoStats.video.captureResolutionHeight,
        unit: '',
      },
      {
        description: 'Video capture resolution width',
        value: localVideoStats.video.captureResolutionWidth,
        unit: '',
      },
      {
        description: 'Video send resolution height',
        value: localVideoStats.video.sendResolutionHeight,
        unit: '',
      },
      {
        description: 'Video send resolution width',
        value: localVideoStats.video.sendResolutionWidth,
        unit: '',
      },
      {
        description: 'video encode delay',
        value: Number(localVideoStats.video.encodeDelay).toFixed(2),
        unit: 'ms',
      },
      {
        description: 'Send video bit rate',
        value: localVideoStats.video.sendBitrate,
        unit: 'bps',
      },
      {
        description: 'Total video bytes sent',
        value: localVideoStats.video.sendBytes,
        unit: 'bytes',
      },
      {
        description: 'Total video packets sent',
        value: localVideoStats.video.sendPackets,
        unit: '',
      },
      {
        description: 'Total video packets loss',
        value: localVideoStats.video.sendPacketsLost,
        unit: '',
      },
      {
        description: 'Video duration',
        value: localVideoStats.video.totalDuration,
        unit: 's',
      },

      {
        description: 'Total video freeze time',
        value: localVideoStats.video.totalFreezeTime,
        unit: 's',
      },
    ];
    console.log(localVideoData, 'localVideoData');
  }

  // To temporary off the video
  async videoOff() {
    this.rtc.localVideoTrack.setEnabled(false);
  }

  // To on the video
  videoOn() {
    this.rtc.localVideoTrack.setEnabled(true);
  }

  // async audioVideo() {
  //   // To Capture and audio and video at one time

  //   const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
  // }
  // async closeTrackTemp() {
  //   await this.rtc.client.unpublish(this.rtc.localVideoTrack);
  // }
  // Other way to set video quality
  // setVideoQuality() {
  //   this.rtc.localVideoTrack.setEncoderConfiguration("480p_1")
  // }

  // To play any default audio
  // async playAudio() {
  // pass a socket stream of audioBuffer packets to AgoraRTC.createBufferSourceAudioTrack
  //   const audioFileTrack = await AgoraRTC.createBufferSourceAudioTrack({
  //     source: "https://web-demos-static.agora.io/agora/smlt.flac",
  //   });
  //   audioFileTrack.startProcessAudioBuffer();     // Read the audio file before playback
  //   audioFileTrack.play();
  // }
  // events to handle remote users

  // To switch audio-
  async switchMicrophone(label: string, localTracks: IMicrophoneAudioTrack) {
    const mics = await this.allaudiodevices();
    let currentMic = mics.find((mic) => mic.label === label);
    await localTracks.setDevice(currentMic.deviceId);
  }
  async allaudiodevices(){

  let mics = await AgoraRTC.getMicrophones(); // all microphones devices you can use
  return mics
  }
  async switchMicrophone2(val, localTracks) {
    let mics = await AgoraRTC.getDevices();
  if(val.kind == 'audiooutput') {
        let currentMic = mics.find(mic => mic.label === val.label);
    await localTracks.setPlaybackDevice (currentMic.deviceId);
  } else {
        let currentMic2 = mics.find(mic => mic.label === val.label);
    await localTracks.setDevice(currentMic2.deviceId);
  }
      }



        async alldevices(){
          return await AgoraRTC.getDevices()
        }

  //Set Role
  async setRole(rtc: IRtc, role: ClientRole) {
    try {
      await rtc.client.setClientRole(role);
    } catch (error) {
      console.log(error, 'setRole error');
    }
  }

  // ChannelMediaRelay (Co-hosting across channels) in Web Streaming
  // use "media stream relay" for live streaming to allow users to co-host.
  // To enable media stream relay, contact support@agora.io
  // from the host - any host in a live-broadcast channel
  initiateMediaStreamRelay(source, dest) {
    const channelMediaConfig = AgoraRTC.createChannelMediaRelayConfiguration();
    // Set the source channel information.
    channelMediaConfig.setSrcChannelInfo(source);
    // Set the destination channel information. You can set a maximum of four destination channels.
    channelMediaConfig.addDestChannelInfo(dest);

    this.rtc.client
      .startChannelMediaRelay(channelMediaConfig)
      .then(() => {
        console.log(`startChannelMediaRelay success`);
      })
      .catch((e) => {
        console.log(`startChannelMediaRelay failed`, e);
      });
  }

  // from the host
  removeStreamRelay(channelMediaConfig) {
    // Remove a destination channel.
    channelMediaConfig.removeDestChannelInfo('destChannel1');
    // Update the configurations of the media stream relay.
    this.rtc.client
      .updateChannelMediaRelay(channelMediaConfig)
      .then(() => {
        console.log('updateChannelMediaRelay success');
      })
      .catch((e) => {
        console.log('updateChannelMediaRelay failed', e);
      });
  }

  stopMediaStreamRelay() {
    this.rtc.client
      .stopChannelMediaRelay()
      .then(() => {
        console.log('stop media relay success');
      })
      .catch((e) => {
        console.log('stop media relay failed', e);
      });
  }

  switchStream = (client: IAgoraRTCClient, highOrLow: number, streamUid: number) => {
    if (highOrLow === 0) {
      highOrLow = 1
      console.log("Set to low");
    }
    else {
      highOrLow = 0
      console.log("Set to high");
    }

    client.setRemoteVideoStreamType(streamUid, highOrLow);
  }

  async videoUpdate() {
    // this.videoStatus = flag;

    if (this.videoStatus) {
      this.videoStatus = false;
    } else {
      this.videoStatus = true;

    }
    await this.rtc.localVideoTrack.setEnabled(this.videoStatus);

  }

  async audioUpdate() {
    // this.audioStatus = flag;

    if (this.audioStatus) {
      this.audioStatus = false;
    } else {
      this.audioStatus = true;

    }
    await this.rtc.localAudioTrack.setEnabled( this.audioStatus);

  }
}
