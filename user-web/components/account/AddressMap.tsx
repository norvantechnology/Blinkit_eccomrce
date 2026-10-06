'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Circle, CircleMarker, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type UserFix = { lat: number; lng: number; accuracy: number };

type Props = {
  lat: number;
  lng: number;
  /** Bump to move the map to lat/lng (GPS, search pick, modal open). Pin drags don't bump it. */
  recenterKey: number;
  zoom: number;
  userFix: UserFix | null;
  /** Fired when the user pans/zooms - the centre is where the fixed pin points. */
  onPinMove: (lat: number, lng: number) => void;
};

/** Draggable OSM map; the red pin is a fixed overlay at the centre (Blinkit "move the map" style). */
export function AddressMap({ lat, lng, recenterKey, zoom, userFix, onPinMove }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const fixLayersRef = useRef<{ dot: CircleMarker; ring: Circle } | null>(null);
  const programmaticRef = useRef(false);
  const latest = useRef({ lat, lng, zoom, onPinMove });
  useLayoutEffect(() => {
    latest.current = { lat, lng, zoom, onPinMove };
  });

  useEffect(() => {
    let cancelled = false;
    let resizeObs: ResizeObserver | null = null;
    void import('leaflet').then((L) => {
      if (cancelled || !elRef.current || mapRef.current) return;
      const { lat: la, lng: ln, zoom: z } = latest.current;
      const map = L.map(elRef.current, {
        center: [la, ln],
        zoom: z,
        zoomControl: false,
        attributionControl: true,
      });
      map.attributionControl.setPrefix(false);
      map.attributionControl.setPosition('topright');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      map.on('moveend', () => {
        if (programmaticRef.current) {
          programmaticRef.current = false;
          return;
        }
        const c = map.getCenter();
        latest.current.onPinMove(c.lat, c.lng);
      });

      mapRef.current = map;
      resizeObs = new ResizeObserver(() => map.invalidateSize());
      resizeObs.observe(elRef.current);
    });
    return () => {
      cancelled = true;
      resizeObs?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      fixLayersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const { lat: la, lng: ln, zoom: z } = latest.current;
    programmaticRef.current = true;
    map.setView([la, ln], z, { animate: false });
  }, [recenterKey]);

  useEffect(() => {
    let cancelled = false;
    void import('leaflet').then((L) => {
      const map = mapRef.current;
      if (cancelled || !map) return;
      if (!userFix) {
        fixLayersRef.current?.dot.remove();
        fixLayersRef.current?.ring.remove();
        fixLayersRef.current = null;
        return;
      }
      const at: [number, number] = [userFix.lat, userFix.lng];
      if (!fixLayersRef.current) {
        const ring = L.circle(at, {
          radius: userFix.accuracy,
          stroke: false,
          fillColor: '#4285f4',
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(map);
        const dot = L.circleMarker(at, {
          radius: 7,
          color: '#fff',
          weight: 2,
          fillColor: '#4285f4',
          fillOpacity: 1,
          interactive: false,
        }).addTo(map);
        fixLayersRef.current = { dot, ring };
      } else {
        fixLayersRef.current.ring.setLatLng(at).setRadius(userFix.accuracy);
        fixLayersRef.current.dot.setLatLng(at);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userFix]);

  return <div ref={elRef} className="bk-addr-leaflet" />;
}
