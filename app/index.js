import CallingExtensions, { Constants } from "@hubspot/calling-extensions-sdk";
import { encode, decode } from 'js-base64';


const voysAPI = 'https://api.voipgrid.nl/api/clicktodial/'

const callback = () => {
  let rowId = 0;
  const incomingMsgContainer = document.querySelector("#incomingMsgs");

  function appendMsg(data, event) {
    const div = document.createElement("div");
    rowId += 1;
    div.innerHTML = `<span>${rowId}: </span><span>${
      event.type
    }, ${JSON.stringify(data)}</span>`;
    incomingMsgContainer.append(div);
  }

  const defaultSize = {
    width: 400,
    height: 600
  };

  const state = {};

  const cti = new CallingExtensions({
    debugMode: true,
    eventHandlers: {
      onReady: () => {
        cti.initialized({
          isLoggedIn: false,
          sizeInfo: defaultSize
        });
      },
      onDialNumber: (data, rawEvent) => {
        appendMsg(data, rawEvent);
        const { phoneNumber } = data;
        state.phoneNumber = phoneNumber;
        window.setTimeout(
          () =>
            cti.outgoingCall({
              createEngagement: true,
              phoneNumber
            }),
          500
        );
      },
      onEngagementCreated: (data, rawEvent) => {
        const { engagementId } = data;
        state.engagementId = engagementId;
        appendMsg(data, rawEvent);
      },
      onEndCall: () => {
        window.setTimeout(() => {
          cti.callEnded();
        }, 500);
      },
      onVisibilityChanged: (data, rawEvent) => {
        appendMsg(data, rawEvent);
      }
    }
  });

  const element = document.querySelector(".container");
  element.addEventListener("click", event => {
    const method = event.target.value;
    switch (method) {
      case "initialized":
        cti.initialized({
          isLoggedIn: false
        });
        break;
      case "Login":
        
        const username = document.querySelector("#username").value
        const password = document.querySelector("#password").value

        if(!username || !password) {
          cti.sendError({
            type: "error",
            message: "Please enter your Voys login details."
          });
        } else {
          const string =  username + ':' + password
          const hash = encode(string)
  
          state.token = hash
  
          cti.userLoggedIn();
          document.querySelector("#login").style.visibility = 'hidden';
        }



        break;
      case "log out":
        cti.userLoggedOut();
        break;
      // Calls
      case "incoming call":
        window.setTimeout(() => {
          cti.incomingCall();
        }, 500);
        break;
      case "outgoing call started":
        window.setTimeout(() => {
          cti.outgoingCall({
            createEngagement: "true",
            phoneNumber: state.phoneNumber
          });
        }, 500);
        break;
      case "call answered":
        cti.callAnswered();
        break;
      case "call ended":
        cti.callEnded();
        break;
      case "call completed":
        cti.callCompleted({
          engagementId: state.engagementId
        });
        break;
      case "send error":
        cti.sendError({
          type: errorType.GENERIC,
          message: "This is a message shown in Hubspot UI"
        });
        break;
      case "change size":
        defaultSize.width += 20;
        defaultSize.height += 20;
        cti.resizeWidget({
          width: defaultSize.width,
          height: defaultSize.height
        });
        break;
      default:
        break;
    }
  });
};

if (document.readyState === "interactive" || document.readyState === "complete") {
  window.setTimeout(() => callback(), 1000);
} else {
  document.addEventListener("DOMContentLoaded", callback);
}
