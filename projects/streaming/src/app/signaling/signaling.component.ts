import { Component } from '@angular/core';
import AgoraRTM   from 'agora-rtm-sdk';
const { RTM } = AgoraRTM;
@Component({
  selector: 'app-signaling',
  imports: [],
  templateUrl: './signaling.component.html',
  styleUrl: './signaling.component.scss'
})
export class SignalingComponent {

  ngOnInit() {
    let rtm;
    let textInput = document.getElementById("textInput") as HTMLInputElement;
    let textDisplay = document.getElementById("textDisplay") as HTMLInputElement;
    // Fill in the App ID of your project.
    const appId = "48b158ccc64343cf9973a8f5df311f2a";
    // Fill in your user ID.
    const userId = "12345";
    // Fill in your channel name.
    const msChannelName = "Chat_room";
    const buttonClick = () => {
      publishMessage(textInput.value);
      textInput.value = '';
    }
    const setupRTM = async () => {
      // Initialize the RTM client.
      try {
        rtm = new RTM(appId, userId);
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
        const result = await rtm.login({  token: '00648b158ccc64343cf9973a8f5df311f2aIADo1TkmWd9A6Irh1YSLryYyDIkyq/nwiIoT7nq6OsXwahw69csAAAAAEACPRTI8xuSMZwEA6ANWoYtn' });
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
