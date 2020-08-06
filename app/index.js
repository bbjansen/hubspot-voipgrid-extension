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

        // log
        console.log("DAILING")
        console.log(data )
        //
        
        state.req_data = data;

        document.querySelector('.status').innerHTML = 'Dailing...';
        document.querySelector('.phonenumber').innerHTML = data.phoneNumber;
        document.querySelector('#screen').style.display = 'none';
        document.querySelector('#dialing').style.display = 'block';

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
          timeout: 10000,
          headers: headers
        })
        .then(res => {

          // log
          console.log("CALL STARTED")
          console.log(res.data)
          //

          state.res_data = res.data  
          state.call_id = res.data.callid

          window.setTimeout(
            () =>
              cti.outgoingCall({
                createEngagement: true,
                phoneNumber: res.data.b_number
              }),
            500
          );

          var event = new CustomEvent('status', { 'detail ': res.data });
          document.dispatchEvent(event);

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

        const { engagementId } = data;

        // log
        console.log("ENGAGEMENT CREATED")
        console.log(engagementId)
        //

        state.engagement_id = engagementId;
      },
      onEndCall: () => {

        console.log('CALL ENDED')
        
        window.setTimeout(() => {
          cti.callEnded();
        }, 500);
      },
      onVisibilityChanged: (data, rawEvent) => {
      }
    }
  });

  document.addEventListener('status', function(e) {
    console.log('LISTENER')
    console.log(state.call_id)

    callStatus()
  });


  function callStatus() {
    state.timerId =  setTimeout(function () {

      const headers =  {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        // 'Content-Length': new TextEncoder().encode(payload).length,
        'Accept': 'application/json',
        'Authorization': 'Basic ' + state.token
      }

      // REPLACE CORS ANYWHERE WITH OUR OWN PROXY
      axios.get('https://cors-anywhere.herokuapp.com/https://api.voipgrid.nl/api/clicktodial/' + state.call_id,
      {
        timeout: 10000,
        headers: headers
      })
      .then(res => {

        // log

        console.log(res.data)
        state.call_res = res.data.status

        console.log("CALL STATUS")
        console.log(res.data.status)

        if(res.data === null) {
          console.log("NULL")
      
          document.querySelector('.status').innerHTML = 'Initiating Call...';
          document.querySelector('.phonenumber').innerHTML = state.req_data.phoneNumber;
      
          document.querySelector('#screen').style.display = 'none';
          document.querySelector('#dialing').style.display = 'block';
        }
        else if(res.data.status === 'dialing_a') {
          console.log("DAILING_A")
      
          document.querySelector('.status').innerHTML = 'Directing Call...';
          document.querySelector('.phonenumber').innerHTML = state.req_data.phoneNumber;
      
          document.querySelector('#screen').style.display = 'none';
          document.querySelector('#dialing').style.display = 'block';
      
        }
        else if(res.data.status === 'dialing_b') {
          console.log("DAILING_B")
      
          document.querySelector('.status').innerHTML = 'Dailing Contact...';
          document.querySelector('.phonenumber').innerHTML = state.req_data.phoneNumber;
      
          document.querySelector('#screen').style.display = 'none';
          document.querySelector('#dialing').style.display = 'block';
      
        }
        else if(res.data.status === 'connected') {
          console.log("CONNECTED")
      
          document.querySelector('.status').innerHTML = 'Call Connected';
          document.querySelector('.phonenumber').innerHTML = state.req_data.phoneNumber;
      
          document.querySelector('#screen').style.display = 'none';
          document.querySelector('#dialing').style.display = 'block';
          
          window.setTimeout(
            () =>
              cti.callAnswered(),
            500
          );
        }
        else if(res.data.status === 'disconnected') {
          console.log("DISCONNECTED")
          clearTimeout(state.timerId);
      
          document.querySelector('.status').innerHTML = 'Call Disconnected';
          document.querySelector('.phonenumber').innerHTML = state.req_data.phoneNumber;
      
          document.querySelector('#screen').style.display = 'none';
          document.querySelector('#dialing').style.display = 'block';
      
          window.setTimeout(function() {

            cti.callCompleted({
              engagementId: state.engagement_id,
              hideWidget: false
            })

            //TO DO: UPDATE ENGAGEMENT VIA HS API

            cti.callEnded()
          },
          5000);
        }
        else if(res.data.status === 'failed_a' || res.data.status === 'failed_b') {
          console.log("FAILED")
          clearTimeout(state.timerId);
      
      
          document.querySelector('.status').innerHTML = 'Call Failed';
          document.querySelector('.phonenumber').innerHTML = state.req_data.phoneNumber;
      
          document.querySelector('#screen').style.display = 'none';
          document.querySelector('#dialing').style.display = 'block';
      
      
          window.setTimeout(function() {
            // document.querySelector('#screen').style.display = 'block';
            // document.querySelector('#dialing').style.display = 'none';
          },
          2000);
        }
      })
      .catch(err => {
        console.log(err)

        cti.sendError({
          type: errorType.GENERIC,
          message: 'Error fetching call status'
        });
      })
      callStatus();
    }, 10000);
}

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