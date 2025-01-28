import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
const PUBLIC_SERVER_URL = process.env['PUBLIC_SERVER_URL'];
import type { Brewery, Collection } from '$lib/types';
const endpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const load = (async (event) => {
	const id = event.params as { id: string };
	let sessionid = event.cookies.get('sessionid');
	let request = await fetch(`${endpoint}/api/collections/${id.id}/`, {
		headers: {
			Cookie: `sessionid=${sessionid}`
		}
	});
	if (!request.ok) {
		console.error('Failed to fetch brewery ' + id.id);
		return {
			props: {
				brewery: null
			}
		};
	} else {
		let collection = (await request.json()) as Collection;

		return {
			props: {
				brewery: collection
			}
		};
	}
}) satisfies PageServerLoad;

import type { Actions } from '@sveltejs/kit';
import { fetchCSRFToken } from '$lib/index.server';

const serverEndpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const actions: Actions = {
	delete: async (event) => {
		const id = event.params as { id: string };
		const breweryId = id.id;

		if (!breweryId) {
			return {
				status: 400,
				error: new Error('Bad request')
			};
		}

		let sessionId = event.cookies.get('sessionid');

		if (!sessionId) {
			return {
				status: 401,
				error: new Error('Unauthorized')
			};
		}

		let csrfToken = await fetchCSRFToken();

		let res = await fetch(`${serverEndpoint}/api/collections/${event.params.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `sessionid=${sessionId}; csrftoken=${csrfToken}`,
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
				Referer: event.url.origin // Include Referer header
			},
			credentials: 'include'
		});

		if (!res.ok) {
			return {
				status: res.status,
				error: new Error('Failed to delete collection')
			};
		} else {
			return {
				status: 204
			};
		}
	}
};
