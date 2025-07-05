import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  throw error(404, 'We couldn\'t find the page you were looking for.');
};