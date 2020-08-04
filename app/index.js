import CallingExtensions, { Constants } from '@hubspot/calling-extensions-sdk';
import { encode, decode } from 'js-base64';
import axios from 'axios'

const callback = () => {

  const defaultSize = {
    width: 400,
    height: 340
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
        
        state.data = data;

        // log
        console.log(data )
        document.querySelector('#screen').style.display = 'none';
        document.querySelector('#dialing').style.display = 'block';
        document.querySelector('.phonenumber').innerHTML = data.phoneNumber;
        document.querySelector('#controls').style.display = 'block';

        const payload = {
          b_number: data.phoneNumber,
          b_cli: '+31203080675',
          auto_answer: false
        }

        const headers =  {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          // 'Content-Length': new TextEncoder().encode(payload).length,
          'Accept': 'application/json',
          'Authorization': 'Basic ' + state.token
        }

        const initiateCall = axios.post('https://api.voipgrid.nl/api/clicktodial/', payload,
        {
          timeout: 3000,
          headers: headers
        })
        .catch(err => {
          console.log(err)

          cti.sendError({
            type: errorType.GENERIC,
            message: 'Error connecting to VoIPGRID'
          });
        })

        console.log(initiateCall)

        window.setTimeout(
          () =>
            cti.outgoingCall({
              createEngagement: true,
              phoneNumber: data.phoneNumber
            }),
          500
        );


      },
      onEngagementCreated: (data, rawEvent) => {

        // log
        console.log(data)
        const { engagementId } = data;
        state.engagementId = engagementId;
      },
      onEndCall: () => {
        window.setTimeout(() => {
          cti.callEnded();
        }, 500);
      },
      onVisibilityChanged: (data, rawEvent) => {
      }
    }
  });

  const element = document.querySelector('.container');

  element.addEventListener('click', event => {
    
    const method = event.target.value;

    switch (method) {
      case 'initialized':
        cti.initialized({
          isLoggedIn: false
        });
        break;
      case 'Login':
        
        const username = document.querySelector('#username').value
        const password = document.querySelector('#password').value

        if(!username || !password) {
          cti.sendError({
            type: 'error',
            message: 'Please enter your VoIPGRID login details.'
          });
        } else {
          const string =  username + ':' + password
          const hash = encode(string)
  
          state.token = hash
  
          cti.userLoggedIn();
          document.querySelector('#login').style.display = 'none';
          document.querySelector('#screen').style.display = 'block';
        }

        break;
      case 'End Call':
        document.querySelector('#screen').style.display = 'block';
        document.querySelector('#dialing').style.display = 'none';
        document.querySelector('#controls').style.display = 'none';


      default:
        break;
    }
  });
};

if (document.readyState === 'interactive' || document.readyState === 'complete') {
  window.setTimeout(() => callback(), 1000);
} else {
  document.addEventListener('DOMContentLoaded', callback);
}
