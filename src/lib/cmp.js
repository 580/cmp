import log from './log';
import pack from '../../package.json';
import {
	encodeVendorConsentData
} from './cookie/cookie';

const CMP_VERSION = pack.version;
export const CMP_GLOBAL_NAME = '__cmp';

export default class Cmp {
	constructor(store) {
		this.eventListeners = {};
		this.store = store;
		this.processCommand.receiveMessage = this.receiveMessage;
		this.processCommand.VERSION = CMP_VERSION;
	}

	commands = {
		/**
		 * Get all publisher consent data from the data store.
		 */
		getPublisherConsents: (purposeIds, callback=() => {}) => {
			callback(this.store.getPublisherConsentsObject());
		},

		/**
		 * Get all vendor consent data from the data store.
		 * @param {Array} vendorIds Array of vendor IDs to retrieve.  If empty return all vendors.
		 */
		getVendorConsents: (vendorIds, callback=() => {}) => {
			callback(this.store.getVendorConsentsObject(vendorIds));
		},

		/**
		 * Get the encoded vendor consent data value.
		 */
		getConsentData: (_, callback=() => {}) => {
			callback(encodeVendorConsentData({
				...this.store.vendorConsentData,
				vendorList: this.store.vendorList
			}));
		},

		/**
		 * Get the entire vendor list
		 */
		getVendorList: (vendorListVersion, callback=() => {}) => {
			callback(this.store.vendorList);
		},

		/**
		 * Add a callback to be fired on a specific event.
		 * @param {string} event Name of the event
		 */
		addEventListener: (event, callback) => {
			const eventSet = this.eventListeners[event] || new Set();
			eventSet.add(callback);
			this.eventListeners[event] = eventSet;
		},

		/**
		 * Remove a callback for an event.
		 * @param {string} event Name of the event to remove callback from
		 */
		removeEventListener: (event, callback) => {
			// If an event is supplied remove the specific listener
			if (event) {
				const eventSet = this.eventListeners[event] || new Set();
				// If a callback is supplied remove it
				if (callback) {
					eventSet.delete(callback);
				}
				// If no callback is supplied clear all listeners for this event
				else {
					eventSet.clear();
				}
				this.eventListeners[event] = eventSet;
			}
			// If no event is supplied clear ALL listeners
			else {
				this.eventListeners = {};
			}
		},

		/**
		 * Trigger the consent tool UI to be shown
		 */
		showConsentTool: (_, callback=() => {}) => {
			this.store.toggleConsentToolShowing(true);
			callback(true);
		}
	};

	/**
	 * Handle a message event sent via postMessage to
	 * call `processCommand`
	 */
	receiveMessage = ({ data, origin, source }) => {
		const { [CMP_GLOBAL_NAME]: cmp } = data;
		if (cmp) {
			const { callId, command, parameter } = cmp;
			this.processCommand(command, parameter, result =>
				source.postMessage({ [CMP_GLOBAL_NAME]: { callId, command, result } }, origin));
		}
	};

	/**
	 * Call one of the available commands.
	 * @param {string} command Name of the command
	 * @param {*} parameter Expected parameter for command
	 */
	processCommand = (command, parameter, callback) => {
		if (typeof this.commands[command] !== 'function') {
			log.error(`Invalid CMP command "${command}"`);
		}
		else {
			log.info(`Proccess command: ${command}, parameter: ${parameter}`);
			this.commands[command](parameter, callback);
		}
	};

	/**
	 * Trigger all event listener callbacks to be called.
	 * @param {string} event Name of the event being triggered
	 * @param {*} data Data that will be passed to each callback
	 */
	notify = (event, data) => {
		log.info(`Notify event: ${event}`);
		const eventSet = this.eventListeners[event] || new Set();
		eventSet.forEach(listener => {
			listener({event, data});
		});
	};
}
