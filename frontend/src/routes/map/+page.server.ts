import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
const PUBLIC_SERVER_URL = process.env['PUBLIC_SERVER_URL'];
import type { Brewery, VisitedRegion } from '$lib/types';
const endpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const load = (async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	} else {
		let sessionId = event.cookies.get('sessionid');
		let visitedFetch = await fetch(`${endpoint}/api/breweries/all/?include_collections=true`, {
			headers: {
				Cookie: `sessionid=${sessionId}`
			}
		});

		let visitedRegionsFetch = await fetch(`${endpoint}/api/visitedregion/`, {
			headers: {
				Cookie: `sessionid=${sessionId}`
			}
		});

		let visitedRegions = (await visitedRegionsFetch.json()) as VisitedRegion[];
		let breweries = (await visitedFetch.json()) as Brewery[];

		if (!visitedRegionsFetch.ok) {
			console.error('Failed to fetch visited regions');
			return redirect(302, '/login');
		} else if (!visitedFetch.ok) {
			console.error('Failed to fetch visited breweries');
			return redirect(302, '/login');
		} else {
			return {
				props: {
					visitedRegions,
					breweries
				}
			};
		}
	}
}) satisfies PageServerLoad;
