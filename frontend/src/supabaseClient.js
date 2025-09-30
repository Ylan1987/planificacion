// frontend/src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Pega aquí la URL y la clave que obtuviste de la configuración de tu proyecto en Supabase.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);