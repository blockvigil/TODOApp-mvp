import { writable } from 'svelte/store';

export const wsTxStore = writable('');
export const WS_ACTIVE = writable(false);
