import type { Brewery } from '$lib/types';
import type { PageServerLoad } from './$types';
const PUBLIC_SERVER_URL = process.env['PUBLIC_SERVER_URL'];
const endpoint = PUBLIC_SERVER_URL || 'http://localhost:8000';

export const load = (async (event) => {
	let sessionId = event.cookies.get('sessionid');
	let visitedFetch = await fetch(`${endpoint}/api/breweries/all/?include_collections=true`, {
		headers: {
			Cookie: `sessionid=${sessionId}`
		}
	});
	let breweries = (await visitedFetch.json()) as Brewery[];

	let dates: Array<{
		id: string;
		start: string;
		end: string;
		title: string;
		backgroundColor?: string;
	}> = [];
	breweries.forEach((brewery) => {
		brewery.visits.forEach((visit) => {
			if (visit.start_date) {
				dates.push({
					id: brewery.id,
					start: visit.start_date,
					end: visit.end_date || visit.start_date,
					title: brewery.name + (brewery.category?.icon ? ' ' + brewery.category.icon : '')
				});
			}
		});
	});

	let icsFetch = await fetch(`${endpoint}/api/ics-calendar/generate`, {
		headers: {
			Cookie: `sessionid=${sessionId}`
		}
	});
	let ics_calendar = await icsFetch.text();

	return {
		props: {
			breweries,
			dates,
			ics_calendar
		}
	};
}) satisfies PageServerLoad;
