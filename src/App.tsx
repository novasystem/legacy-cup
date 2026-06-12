// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function Leaderboard() {
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    // 1. Obtener puntajes iniciales de la base de datos
    const fetchInitialScores = async () => {
      const { data } = await supabase.from('predictions').select('user_id, points_awarded');
      if (data) setScores(data);
    };
    fetchInitialScores();

    // 2. Escuchar actualizaciones en TIEMPO REAL por WebSockets
    const channel = supabase
      .channel('live-predictions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'predictions' }, (payload) => {
        // Al detectar un cambio de goles en la BD, actualiza el estado visual inmediatamente
        setScores(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* Aquí renderizas tu UI Premium con Tailwind CSS usando los datos del estado `scores` */}
    </div>
  );
}