
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pmaazcephcnywzpkrevr.supabase.co';

const supabaseKey = 'sb_publishable_gRfnsW8rMT-8gjMzBFoJpA_CWaHHBvh';

export const supabase = createClient(supabaseUrl, supabaseKey);
