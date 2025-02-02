import { Component, OnInit } from '@angular/core';
import { CommonService } from '../services/common.service';
declare var AgoraEduSDK;
@Component({
    selector: 'app-flexible-classroom',
    templateUrl: './flexible-classroom.component.html',
    styleUrls: ['./flexible-classroom.component.scss'],
    standalone: false
})
export class FlexibleClassroomComponent implements OnInit {

  constructor(private common: CommonService) {

  }

  ngOnInit(): void {
    // this.dggsd();
    // this.dfvadf();
  }

  // dggsd() {
  //   AgoraEduSDK.config({
  //     // Here pass in the Agora App ID you have got
  //     appId: "",
  //   })
  //   AgoraEduSDK.launch(
  //     document.querySelector("#root1"), {
  //     // Here pass in the RTM token you have generated
  //     rtmToken: "0064de74d230b2349458cd138aa2677bc0aIACVLmsCj58TZDvxQuyDcru2Zm/pEZiheejMHqhTUl0YFKPg45sAAAAAEAAl61SE/CvwYQEA6AOM6O5h",
  //     // The user ID must be the same as the one you used for generating the RTM token
  //     userUuid: "1234",
  //     userName: "teacher",
  //     roomUuid: "321",
  //     roomName: "demo-class",
  //     roleType: 1,
  //     roomType: 0,
  //     pretest: true,
  //     language: "en",
  //     startTime: new Date().getTime(),
  //     duration: 60 * 30,
  //     courseWareList: [],
  //     listener: (evt) => {
  //       console.log("evt", evt)
  //     }
  //   }
  //   )
  // }
}
