// api/sync-matches.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Llave maestra para ignorar RLS en la actualización
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validar token de seguridad del Cron Job
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    // Ejemplo conectando a la API gratuita de Football-Data.org o API-Football
    const response = await fetch('https://api.football-data.org/v4/matches?competitions=WC', {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! }
    });
    const data = await response.json();

    // Iterar y actualizar en Supabase
    for (const match of data.matches) {
      const statusMap: { [key: string]: string } = { 'TIMED': 'SCHEDULED', 'IN_PLAY': 'LIVE', 'FINISHED': 'FINISHED' };
      
      await supabase
        .from('matches')
        .update({
          home_score: match.score.fullTime.home,
          away_score: match.score.fullTime.away,
          status: statusMap[match.status] || 'SCHEDULED'
        })
        .eq('external_api_id', match.id);
    }

    return res.status(200).json({ success: true, message: 'Partidos y puntos actualizados en tiempo real.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}