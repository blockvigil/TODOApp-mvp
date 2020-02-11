import {wsTxStore} from './stores.js';
export let apiPrefix;
export let evAPIPrefix;
export let wsURL;
export let API_KEY;
export let API_READ_KEY;
export let contractAddress;

import {WS_ACTIVE} from './stores.js';

let wsConnection;
let wsTries = 5;
let timeout = 1000;
let wsSessionID;


apiPrefix = process.env.API_PREFIX;
wsURL = process.env.WS_URL;
evAPIPrefix = process.env.EVAPI_PREFIX;
API_KEY = process.env.API_KEY;
API_READ_KEY = process.env.API_READ_KEY;
contractAddress = process.env.TODO_CONTRACT_ADDRESS;

let wsKey = API_READ_KEY;

export function initWS(){
	if (wsTries <= 0){
		console.error('unable to estabilish WS after 5 tries!');
		wsConnection = null;
		wsTries = 5;
		WS_ACTIVE.set(false);
		//wsSessionID = null;
		return;
	}
	//Don't open a new websocket if it already exists. Figure out a better way for event filtering #FIXME
	if (wsConnection){
		return;
	}
	wsConnection = new WebSocket(wsURL);
	wsConnection.onopen = function () {
		let data = {
			command: 'register',
			key: wsKey
		}
		console.log('wsSessionID', wsSessionID);
		if (wsSessionID){
			data.sessionID = wsSessionID;
		}
		wsConnection.send(JSON.stringify(data));
		WS_ACTIVE.set(true);
		setTimeout(heartbeat, 30000);
	};

	// Log errors
	wsConnection.onerror = function (error) {
		wsTries--;
		console.error('WebSocket Error ', error);
	};

	// Log messages from the server
	wsConnection.onmessage = function (d) {
		try {
			var data = JSON.parse(d.data);
			if (data.command){
				if (data.command == 'register:nack'){
					console.error('bad auth from WS');
					wsSessionID = null;
					closeWS();
				}
				if (data.command == 'register:ack'){
					wsSessionID = data.sessionID;
					console.log('got session id', wsSessionID);
				}
				return;
			}
			wsTxStore.set(data);
		}
		catch (e){
			//console.error('got non json data', d.data, e);
		}
	};
	wsConnection.onclose = function(e){
		if (e.code != 1000){
			closeWS();
		} else {
			setTimeout(function(){
				initWS();
			}, timeout);
		}
	};
}

export function closeWS(){
	if (wsConnection){
		//wsSessionID = null;
		wsConnection.onclose = function(){
			wsConnection = null;
		};
		wsConnection.close();
		WS_ACTIVE.set(false);
	}
}

export const showAlert = async (message, type) => {
	const p = new Promise(function(presolve, preject) {
		let dialog;
		if (type == 'alert'){
			dialog = new MDCDialog(document.querySelector('.alert'));
		} else {
			dialog = new MDCDialog(document.querySelector('.confirmation'));
		}
		dialog.content_.textContent = message;
		dialog.listen('MDCDialog:closing', function(e) {
			console.log(e.detail.action);
			dialog = null;
			if (e.detail.action == 'yes'){
				presolve(true);
			} else {
				presolve(false);
			}
		});
		dialog.open();
	})
	return p;
}

function heartbeat() {
	if (!wsSessionID || !wsConnection || wsConnection.readyState !== 1){
		return;
	}
	wsConnection.send(JSON.stringify({
		command: "heartbeat",
		sessionID: wsSessionID
	}));
	setTimeout(heartbeat, 30000);
}
