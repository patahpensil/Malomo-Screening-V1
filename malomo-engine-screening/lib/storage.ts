import {env} from 'cloudflare:workers';
export function rawDb():D1Database{if(!env.DB)throw new Error('Penyimpanan belum tersedia. Coba lagi.');return env.DB as D1Database;}
