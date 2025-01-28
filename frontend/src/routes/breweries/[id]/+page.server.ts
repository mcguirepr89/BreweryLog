import type { PageServerLoad } from './$types';
const PUBLIC_SERVER_URL = process.env['PUBLIC_SERVER_URL'];
import type { Brewery, Collection } from '$lib/types';
const endpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const load = (async (event) => {
	const id = event.params as { id: string };
	let request = await fetch(`${endpoint}/api/breweries/${id.id}/`, {
		headers: {
			Cookie: `sessionid=${event.cookies.get('sessionid')}`
		},
		credentials: 'include'
	});
	if (!request.ok) {
		console.error('Failed to fetch brewery ' + id.id);
		return {
			props: {
				brewery: null
			}
		};
	} else {
		let brewery = (await request.json()) as Brewery;
		let collection: Collection | null = null;

		if (brewery.collection) {
			let res2 = await fetch(`${endpoint}/api/collections/${brewery.collection}/`, {
				headers: {
					Cookie: `sessionid=${event.cookies.get('sessionid')}`
				},
				credentials: 'include'
			});
			collection = await res2.json();
		}

		return {
			props: {
				brewery,
				collection
			}
		};
	}
}) satisfies PageServerLoad;

import { redirect, type Actions } from '@sveltejs/kit';
import { fetchCSRFToken } from '$lib/index.server';

const serverEndpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const actions: Actions = {
	delete: async (event) => {
		const id = event.params as { id: string };
		const breweryId = id.id;

		if (!event.locals.user) {
			return redirect(302, '/login');
		}
		if (!breweryId) {
			return {
				status: 400,
				error: new Error('Bad request')
			};
		}

		let csrfToken = await fetchCSRFToken();

		let res = await fetch(`${serverEndpoint}/api/breweries/${event.params.id}`, {
			method: 'DELETE',
			headers: {
				Referer: event.url.origin, // Include Referer header
				Cookie: `sessionid=${event.cookies.get('sessionid')};
				csrftoken=${csrfToken}`,
				'X-CSRFToken': csrfToken
			},
			credentials: 'include'
		});
		console.log(res);
		if (!res.ok) {
			return {
				status: res.status,
				error: new Error('Failed to delete brewery')
			};
		} else {
			return {
				status: 204
			};
		}
	}
};
