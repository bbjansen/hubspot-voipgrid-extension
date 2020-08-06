import CallingExtensions from "./assets/js/CallingExtensions";
import { errorType } from "./assets/js/Constants";

import { encode, decode } from 'js-base64';
import axios from 'axios'
import Cookies from 'js-cookie'

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

        if(Cookies.get('token')) {
          cti.initialized({
            isLoggedIn: true,
            sizeInfo: defaultSize
          });

          state.token = Cookies.get('token')
          document.querySelector('#login').style.display = 'none';
          document.querySelector('#screen').style.display = 'block';

        } else {
          cti.initialized({
            isLoggedIn: false,
            sizeInfo: defaultSize
          });         
        }

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

        // REPLACE CORS ANYWHERE WITH OUR OWN PROXY
        axios.post('https://cors-anywhere.herokuapp.com/https://api.voipgrid.nl/api/clicktodial/', payload,
        {
          timeout: 30000,
          headers: headers
        })
        .then(data => {

          document.querySelector('.status').innerHTML = 'Call Started';

          console.log("CALL STARTED")
          console.log(data)
  
          state.call_id = data.callid

          window.setTimeout(
            () =>
              cti.outgoingCall({
                createEngagement: true,
                phoneNumber: data.b_number
              }),
            500
          );
          
        })
        .catch(err => {
          console.log(err)

          cti.sendError({
            type: errorType.GENERIC,
            message: 'Error connecting to VoIPGRID'
          });
        })


      },
      onEngagementCreated: (data, rawEvent) => {

        console.log("ENGAGEMENT CREATED")
        // log
        console.log(data)
        const { engagementId } = data;
        state.engagementId = engagementId;
      },
      onEndCall: () => {
        console.log('call ended')
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

          Cookies.set('token', hash, { expires: 7 });

          state.token = hash
  
          cti.userLoggedIn();
          document.querySelector('#login').style.display = 'none';
          document.querySelector('#screen').style.display = 'block';
        }
        break;

      case 'Call Ended':
        cti.callEnded();

        document.querySelector('.status').innerHTML = 'Call Ended';


        document.querySelector('#screen').style.display = 'block';
        document.querySelector('#dialing').style.display = 'none';
        document.querySelector('#controls').style.display = 'none';

      case "Call Completed":
        cti.callCompleted({
          engagementId: state.engagementId
        });

        document.querySelector('.status').innerHTML = 'Call Completed';

        document.querySelector('#screen').style.display = 'block';
        document.querySelector('#dialing').style.display = 'none';
        document.querySelector('.phonenumber').innerHTML = '';

        document.querySelector('#controls').style.display = 'none';
        break;
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
