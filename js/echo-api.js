(function (global) {
  const AUDIO_BUCKET = 'audio-files';
  const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

  function getClient() {
    if (!global.echoSupabase) {
      throw new Error('Supabase client is not initialized.');
    }
    return global.echoSupabase;
  }

  function configLooksReady() {
    return Boolean(String(global.ECHO_SUPABASE_URL || '').trim() && String(global.ECHO_SUPABASE_ANON_KEY || '').trim());
  }

  function sanitizeTitle(fileName) {
    return String(fileName || '').replace(/\.[^/.]+$/, '');
  }

  function bytesToLabel(bytes) {
    if (!bytes && bytes !== 0) return 'unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(value >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  function buildTrackSignature(name, size) {
    const normalizedName = sanitizeTitle(String(name || '')).trim().toLowerCase();
    return `${normalizedName}::${size || 0}`;
  }

  function extensionFromName(fileName, mimeType) {
    const fromName = String(fileName || '').split('.').pop();
    if (fromName && fromName !== fileName && fromName.length <= 8) {
      return fromName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
    }
    const map = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'audio/flac': 'flac',
      'audio/ogg': 'ogg',
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/aac': 'aac'
    };
    return map[mimeType] || 'bin';
  }

  function typeLabelFromMime(mimeType) {
    if (!mimeType) return 'AUDIO';
    return mimeType.split('/')[1]?.toUpperCase() || 'AUDIO';
  }

  function readAudioDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      const done = (value) => {
        URL.revokeObjectURL(url);
        resolve(value);
      };
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        done(Number.isFinite(duration) ? duration : null);
      };
      audio.onerror = () => done(null);
      setTimeout(() => done(null), 8000);
      audio.src = url;
    });
  }

  function mapTrackRow(row, signedUrl) {
    const size = Number(row.file_size_bytes) || 0;
    return {
      id: String(row.id),
      title: row.title || 'Untitled',
      artist: row.artist || null,
      src: signedUrl || '',
      type: typeLabelFromMime(row.mime_type),
      sizeLabel: bytesToLabel(size),
      signature: buildTrackSignature(row.original_name || row.title, size),
      file_path: row.file_path,
      file_size_bytes: size,
      duration_seconds: row.duration_seconds,
      is_favorite: Boolean(row.is_favorite),
      createdAt: row.created_at ? Date.parse(row.created_at) : 0
    };
  }

  async function getSession() {
    const { data, error } = await getClient().auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  async function requireUser() {
    const user = await getUser();
    if (!user) {
      throw new Error('Not signed in.');
    }
    return user;
  }

  async function ensureProfile(user) {
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (data) return;

    const username = String(user.user_metadata?.username || user.email || 'user')
      .split('@')[0]
      .slice(0, 40);
    const { error: insertError } = await client.from('profiles').insert({
      id: user.id,
      username
    });
    if (insertError && insertError.code !== '23505') throw insertError;
  }

  async function usernameTaken(username) {
    const { data, error } = await getClient().rpc('username_taken', {
      check_name: username
    });
    if (error) throw error;
    return Boolean(data);
  }

  async function signUp({ username, email, password }) {
    const client = getClient();
    const cleanUsername = String(username || '').trim().slice(0, 40);
    if (!cleanUsername) throw new Error('Username is required.');
    if (await usernameTaken(cleanUsername)) {
      throw new Error('That username is already taken.');
    }

    const { data, error } = await client.auth.signUp({
      email: String(email || '').trim(),
      password,
      options: {
        data: { username: cleanUsername }
      }
    });
    if (error) throw error;
    if (data.user) {
      try {
        await ensureProfile(data.user);
      } catch {}
    }
    return data;
  }

  async function signIn({ email, password }) {
    const { data, error } = await getClient().auth.signInWithPassword({
      email: String(email || '').trim(),
      password
    });
    if (error) throw error;
    if (data.user) await ensureProfile(data.user);
    return data;
  }

  async function signOut() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
  }

  async function signedUrlFor(filePath) {
    const { data, error } = await getClient()
      .storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
    if (error) throw error;
    return data.signedUrl;
  }

  async function getAllTrackRecords() {
    const user = await requireUser();
    await ensureProfile(user);
    const { data, error } = await getClient()
      .from('tracks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const rows = data || [];
    const mapped = [];
    for (const row of rows) {
      let src = '';
      try {
        src = await signedUrlFor(row.file_path);
      } catch {
        src = '';
      }
      mapped.push(mapTrackRow(row, src));
    }
    return mapped;
  }

  async function saveTrackRecord(record) {
    const user = await requireUser();
    const file = record.blob || record.file;
    if (!file) throw new Error('No audio file to upload.');

    const id = global.crypto.randomUUID();
    const ext = extensionFromName(record.originalName || file.name, file.type);
    const filePath = `${user.id}/${id}.${ext}`;
    const title = record.title || sanitizeTitle(file.name) || 'Untitled';
    const size = file.size || 0;

    const { error: uploadError } = await getClient()
      .storage
      .from(AUDIO_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });
    if (uploadError) throw uploadError;

    const duration = await readAudioDuration(file);

    const { data: row, error: insertError } = await getClient()
      .from('tracks')
      .insert({
        id,
        user_id: user.id,
        title,
        artist: record.artist || null,
        file_path: filePath,
        duration_seconds: duration,
        file_size_bytes: size,
        original_name: record.originalName || file.name,
        mime_type: file.type || null,
        is_favorite: false
      })
      .select('*')
      .single();

    if (insertError) {
      await getClient().storage.from(AUDIO_BUCKET).remove([filePath]);
      throw insertError;
    }

    const { error: usageError } = await getClient().rpc('adjust_storage_bytes', { delta: size });
    if (usageError) {
      console.warn('Could not update storage_bytes_used', usageError);
    }

    const src = await signedUrlFor(filePath);
    return mapTrackRow(row, src);
  }

  async function deleteTrackRecord(trackId) {
    const user = await requireUser();
    const { data: row, error: fetchError } = await getClient()
      .from('tracks')
      .select('id, file_path, file_size_bytes')
      .eq('id', trackId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!row) return false;

    if (row.file_path) {
      const { error: storageError } = await getClient()
        .storage
        .from(AUDIO_BUCKET)
        .remove([row.file_path]);
      if (storageError) throw storageError;
    }

    const { error: deleteError } = await getClient()
      .from('tracks')
      .delete()
      .eq('id', trackId)
      .eq('user_id', user.id);
    if (deleteError) throw deleteError;

    const size = Number(row.file_size_bytes) || 0;
    if (size) {
      const { error: usageError } = await getClient().rpc('adjust_storage_bytes', { delta: -size });
      if (usageError) {
        console.warn('Could not update storage_bytes_used', usageError);
      }
    }
    return true;
  }

  async function renameTrackRecord(trackId, nextTitle) {
    const user = await requireUser();
    const { data, error } = await getClient()
      .from('tracks')
      .update({ title: nextTitle })
      .eq('id', trackId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async function setTrackFavorite(trackId, isFavorite) {
    const user = await requireUser();
    const { error } = await getClient()
      .from('tracks')
      .update({ is_favorite: Boolean(isFavorite) })
      .eq('id', trackId)
      .eq('user_id', user.id);
    if (error) throw error;
  }

  async function listPlaylists() {
    const user = await requireUser();
    const { data, error } = await getClient()
      .from('playlists')
      .select('id, name, created_at, playlist_tracks(track_id, position)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return (data || []).map((playlist) => {
      const membership = Array.isArray(playlist.playlist_tracks) ? playlist.playlist_tracks.slice() : [];
      membership.sort((a, b) => (a.position || 0) - (b.position || 0));
      return {
        id: String(playlist.id),
        name: playlist.name,
        trackIds: membership.map((item) => String(item.track_id))
      };
    });
  }

  async function createPlaylist(name) {
    const user = await requireUser();
    const { data, error } = await getClient()
      .from('playlists')
      .insert({ user_id: user.id, name })
      .select('id, name')
      .single();
    if (error) throw error;
    return { id: String(data.id), name: data.name, trackIds: [] };
  }

  async function addTrackToPlaylist(trackId, playlistId) {
    const user = await requireUser();
    const { data: existing, error: existingError } = await getClient()
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);
    if (existingError) throw existingError;

    const nextPosition = existing && existing.length ? Number(existing[0].position) + 1 : 0;
    const { error } = await getClient().from('playlist_tracks').insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: nextPosition
    });
    if (error && error.code !== '23505') throw error;
    return user;
  }

  async function deleteAccountData() {
    const user = await requireUser();
    const { data: tracks } = await getClient()
      .from('tracks')
      .select('file_path')
      .eq('user_id', user.id);
    const paths = (tracks || []).map((row) => row.file_path).filter(Boolean);
    if (paths.length) {
      await getClient().storage.from(AUDIO_BUCKET).remove(paths);
    }
    const { error } = await getClient().rpc('delete_own_account_data');
    if (error) throw error;
    await signOut();
  }

  global.EchoAPI = {
    AUDIO_BUCKET,
    getClient,
    configLooksReady,
    sanitizeTitle,
    bytesToLabel,
    buildTrackSignature,
    getSession,
    getUser,
    requireUser,
    ensureProfile,
    signUp,
    signIn,
    signOut,
    getAllTrackRecords,
    saveTrackRecord,
    deleteTrackRecord,
    renameTrackRecord,
    setTrackFavorite,
    listPlaylists,
    createPlaylist,
    addTrackToPlaylist,
    deleteAccountData
  };
})(window);
