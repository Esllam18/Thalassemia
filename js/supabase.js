/* ============================================================
   supabase.js — Supabase client (singleton)
   ============================================================ */

let _client = null;

function getSupabase() {
  if (_client) return _client;
  if (typeof supabase === 'undefined') {
    throw new Error('Supabase SDK not loaded.');
  }
  _client = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      // Store session in localStorage but use a shared key so all pages see it
      storageKey: 'thalassemia_auth',
      // Automatically refresh the token before it expires
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  });
  return _client;
}

const db = {
  get client() { return getSupabase(); },

  auth: {
    async signIn(email, password) {
      return getSupabase().auth.signInWithPassword({ email, password });
    },
    async signUp(email, password, fullName) {
      return getSupabase().auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
    },
    async signOut() {
      return getSupabase().auth.signOut();
    },
    /**
     * getUser() — validates token with Supabase server.
     * Unlike getSession() which reads localStorage (broken on file://),
     * getUser() always works because it hits the network.
     */
    async getUser() {
      const { data, error } = await getSupabase().auth.getUser();
      if (error || !data?.user) return null;
      return data.user;
    },
    // Returns the SESSION object (has .user inside), or null
    async getSession() {
      const { data } = await getSupabase().auth.getSession();
      return data?.session || null;
    },
    onAuthStateChange(cb) {
      return getSupabase().auth.onAuthStateChange(cb);
    },
    async updatePassword(newPassword) {
      return getSupabase().auth.updateUser({ password: newPassword });
    },
    async updateEmail(newEmail) {
      return getSupabase().auth.updateUser({ email: newEmail });
    },
  },

  profiles: {
    async get(userId) {
      return getSupabase()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    },
    async update(userId, data) {
      return getSupabase()
        .from('profiles')
        .update(data)
        .eq('id', userId);
    },
  },

  predictions: {
    async insert(row) {
      return getSupabase().from('predictions').insert(row).select().single();
    },
    async list(userId, { limit = 20, offset = 0, diagnosis = null } = {}) {
      let q = getSupabase()
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (diagnosis) q = q.eq('diagnosis', diagnosis);
      return q;
    },
    async count(userId) {
      return getSupabase()
        .from('predictions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    },
    async getStats(userId) {
      return getSupabase()
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single();
    },
  },

  notifications: {
    async list(userId) {
      return getSupabase()
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
    },
    async markRead(id) {
      return getSupabase()
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    },
  },
};
