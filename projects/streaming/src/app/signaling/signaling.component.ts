import { Component } from '@angular/core';
import AgoraRTM   from 'agora-rtm-sdk';
import { StreamService } from '../services/stream.service';
import { CommonService } from '../services/common.service';
const { RTM } = AgoraRTM;
@Component({
  selector: 'app-signaling',
  templateUrl: './signaling.component.html',
  styleUrl: './signaling.component.scss',
  standalone: false
})
export class SignalingComponent {

  constructor(  public stream: StreamService,
    private common: CommonService
  ) { }

  async ngAfterViewInit() {
    await this.common.getAppDetails();
    let rtm;
    let textInput = document.getElementById("textInput") as HTMLInputElement;
    let textDisplay = document.getElementById("textDisplay") as HTMLInputElement;
    // Fill in the App ID of your project.
    const appId = this.stream.options.appId;
    const userId = this.stream.options.channel;

        const rtmDetails = await this.common.generateRtmTokenAndUid(userId);
    // Fill in your user ID.
    // const userId = "12345";
    // Fill in your channel name.
    const msChannelName = "Chat_room";
    const buttonClick = () => {
      publishMessage(textInput.value);
      textInput.value = '';
    }
    const submitButton = document.getElementById('submitButton');

// Add an event listener to the button
submitButton.addEventListener('click', buttonClick);
    const setupRTM = async () => {
      // Initialize the RTM client.
      try {
        rtm = new RTM(appId, userId);
        console.log(this, rtm, 'rtm');
      } catch (status) {
        console.log("Error");
        console.log(status);
      }
      // Add the event listener.
      // Message event handler.
      rtm.addEventListener("message", event => {
        showMessage(event.publisher, event.message);
      });
      // Presence event handler.
      rtm.addEventListener("presence", event => {
        if (event.eventType === "SNAPSHOT") {
          showMessage("INFO", "I Join");
        }
        else {
          showMessage("INFO", event.publisher + " is " + event.eventType);
        }
      });
      // Connection state changed event handler.
      rtm.addEventListener("status", event => {
        // The current connection state.
        const currentState = event.state;
        // The reason why the connection state changes.
        const changeReason = event.reason;
        showMessage("INFO", JSON.stringify(event));
      });
      // Log in the RTM server.
      try {
        const result = await rtm.login({  token: rtmDetails.token });
        console.log(result);
      } catch (status) {
        console.log(status);
      }
      // Subscribe to a channel.
      try {
        const result = await rtm.subscribe(msChannelName);
        console.log(result);
      } catch (status) {
        console.log(status);
      }
    }
    const publishMessage = async (message) => {
      const payload = { type: "text", message: message };
      const publishMessage = JSON.stringify(payload);
      const publishOptions = { channelType: 'MESSAGE'}
      try {
        const result = await rtm.publish(msChannelName, publishMessage, publishOptions);
        showMessage(userId, publishMessage);
        console.log(result);
      } catch (status) {
        console.log(status);
      }
    }
    const showMessage = (user, msg) => {
      // Get text from the text box.
      const inputText = textInput.value;
      const newText = document.createTextNode(user + ": " + msg);
      const newLine = document.createElement("br");
      textDisplay.appendChild(newText);
      textDisplay.appendChild(newLine);
    }
    window.onload = setupRTM;

  }

  buttonClick(){
    console.log("Button Clicked");
  }
}
