import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
const PUBLIC_SERVER_URL = process.env['PUBLIC_SERVER_URL'];
import type { Brewery } from '$lib/types';

const serverEndpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const load = (async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	} else {
		let breweries: Brewery[] = [];

		let initialFetch = await event.fetch(`${serverEndpoint}/api/breweries/`, {
			headers: {
				Cookie: `sessionid=${event.cookies.get('sessionid')}`
			},
			credentials: 'include'
		});

		let stats = null;

		let res = await event.fetch(`${serverEndpoint}/api/stats/counts/`, {
			headers: {
				Cookie: `sessionid=${event.cookies.get('sessionid')}`
			}
		});
		if (!res.ok) {
			console.error('Failed to fetch user stats');
		} else {
			stats = await res.json();
		}

		if (!initialFetch.ok) {
			let error_message = await initialFetch.json();
			console.error(error_message);
			console.error('Failed to fetch visited breweries');
			return redirect(302, '/login');
		} else {
			let res = await initialFetch.json();
			let visited = res.results as Brewery[];
			// only get the first 3 breweries or less if there are less than 3
			breweries = visited.slice(0, 3);
		}

		return {
			props: {
				breweries,
				stats
			}
		};
	}
}) satisfies PageServerLoad;
