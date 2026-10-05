import React, { createContext, useCallback, useContext, useState } from 'react';

export type SelectedPhoto = {
  id: string;
  uri: string;
  source: 'camera' | 'gallery';
};

type SelectedPhotosContext = {
  photos: SelectedPhoto[];
  addPhoto: (uri: string, source: SelectedPhoto['source']) => void;
  addPhotos: (uris: string[], source: SelectedPhoto['source']) => void;
  removePhoto: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<SelectedPhotosContext | null>(null);

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function SelectedPhotosProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);

  const addPhoto = useCallback<SelectedPhotosContext['addPhoto']>((uri, source) => {
    setPhotos((prev) => [...prev, { id: makeId(), uri, source }]);
  }, []);

  const addPhotos = useCallback<SelectedPhotosContext['addPhotos']>((uris, source) => {
    setPhotos((prev) => {
      const existing = new Set(prev.map((p) => p.uri));
      const newOnes = uris
        .filter((uri) => !existing.has(uri))
        .map((uri) => ({ id: makeId(), uri, source }));
      return [...prev, ...newOnes];
    });
  }, []);

  const removePhoto = useCallback<SelectedPhotosContext['removePhoto']>((id) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setPhotos([]), []);

  return (
    <Ctx.Provider value={{ photos, addPhoto, addPhotos, removePhoto, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelectedPhotos(): SelectedPhotosContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useSelectedPhotos must be used inside <SelectedPhotosProvider>');
  }
  return ctx;
}
