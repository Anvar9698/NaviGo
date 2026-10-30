import maplibregl from 'maplibre-gl';

type MapListener = (map: maplibregl.Map | null) => void;

class MapRegistry {
  private instance: maplibregl.Map | null = null;
  private listeners: Set<MapListener> = new Set();

  public register(map: maplibregl.Map | null): void {
    this.instance = map;
    this.listeners.forEach(fn => fn(map));
  }

  public get(): maplibregl.Map | null {
    return this.instance;
  }

  public subscribe(listener: MapListener): () => void {
    this.listeners.add(listener);
    if (this.instance) {
      listener(this.instance);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const mapRegistry = new MapRegistry();
