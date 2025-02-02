import AgoraRTC, { IAgoraRTCClient, LiveStreamingTranscodingConfig, ICameraVideoTrack, IMicrophoneAudioTrack, ScreenVideoTrackInitConfig, VideoEncoderConfiguration, AREAS, IRemoteAudioTrack, ClientRole } from 'agora-rtc-sdk-ng';


export interface IUser {
  uid?: string;
  name?: string;
  token?: string;
}
export interface IRtc {
  client: IAgoraRTCClient;
  localAudioTrack: IMicrophoneAudioTrack;
  localVideoTrack: ICameraVideoTrack;
  token?: string;
  checkSpeakingInterval?: any;
  audio?: boolean,
  video?: boolean
}

// export interface rtmUser {
//   message: string;
//   user: any;
// }
