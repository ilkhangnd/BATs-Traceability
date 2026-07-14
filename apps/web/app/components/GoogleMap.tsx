"use client";

import { useEffect, useRef, useState } from "react";

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface MapPlot {
  id: string;
  plantingAreaCode: string;
  polygon: MapPoint[];
  status?: string;
}

interface GoogleMapProps {
  plots?: MapPlot[];
  value?: MapPoint[];
  editable?: boolean;
  onChange?: (points: MapPoint[]) => void;
  onAreaChange?: (areaHa: number) => void;
}

declare global {
  interface Window {
    google?: any;
    __batsGoogleMaps?: Promise<any>;
    __batsGoogleMapsReady?: () => void;
  }
}

function loadGoogleMaps(apiKey: string): Promise<any> {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (window.__batsGoogleMaps) return window.__batsGoogleMaps;
  window.__batsGoogleMaps = new Promise((resolve, reject) => {
    window.__batsGoogleMapsReady = () => resolve(window.google);
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      "&loading=async&libraries=places,geometry&callback=__batsGoogleMapsReady";
    script.async = true;
    script.onerror = () => reject(new Error("Không tải được Google Maps."));
    document.head.appendChild(script);
  });
  return window.__batsGoogleMaps;
}

export default function GoogleMap({
  plots = [],
  value = [],
  editable = false,
  onChange,
  onAreaChange
}: GoogleMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const searchElement = useRef<HTMLInputElement>(null);
  const polygonRef = useRef<any>(null);
  const drawingRef = useRef(false);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const plotsSignature = plots
    .map((plot) => `${plot.id}:${plot.status}:${plot.polygon.length}`)
    .join("|");

  useEffect(() => {
    drawingRef.current = drawing;
  }, [drawing]);

  useEffect(() => {
    if (!apiKey || !mapElement.current) return;
    let disposed = false;
    const overlays: any[] = [];

    void loadGoogleMaps(apiKey)
      .then((google) => {
        if (disposed || !mapElement.current) return;
        const center = value[0]
          ? { lat: value[0].latitude, lng: value[0].longitude }
          : { lat: 12.6789, lng: 108.1234 };
        const map = new google.maps.Map(mapElement.current, {
          center,
          zoom: 15,
          mapTypeId: "hybrid",
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });

        if (searchElement.current && google.maps.places) {
          const autocomplete = new google.maps.places.Autocomplete(searchElement.current, {
            fields: ["geometry", "formatted_address", "name"],
            componentRestrictions: { country: "vn" }
          });
          autocomplete.bindTo("bounds", map);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.viewport) map.fitBounds(place.geometry.viewport);
            else if (place.geometry?.location) {
              map.setCenter(place.geometry.location);
              map.setZoom(17);
            }
          });
        }

        const emitPath = (polygon: any) => {
          const points = polygon
            .getPath()
            .getArray()
            .map((point: any) => ({ latitude: point.lat(), longitude: point.lng() }));
          onChange?.(points);
          if (points.length >= 3 && google.maps.geometry?.spherical) {
            const squareMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
            onAreaChange?.(Number((squareMeters / 10_000).toFixed(3)));
          }
        };

        const bindEditablePath = (polygon: any) => {
          const path = polygon.getPath();
          path.addListener("insert_at", () => emitPath(polygon));
          path.addListener("set_at", () => emitPath(polygon));
          path.addListener("remove_at", () => emitPath(polygon));
          polygon.addListener("dragend", () => emitPath(polygon));
        };

        if (editable) {
          const polygon = new google.maps.Polygon({
            map,
            paths: value.map((point) => ({ lat: point.latitude, lng: point.longitude })),
            editable: true,
            draggable: false,
            strokeColor: "#155d3b",
            strokeWeight: 3,
            fillColor: "#cbed71",
            fillOpacity: 0.35
          });
          polygonRef.current = polygon;
          overlays.push(polygon);
          bindEditablePath(polygon);
          if (value.length >= 3) {
            const bounds = new google.maps.LatLngBounds();
            value.forEach((point) => bounds.extend({ lat: point.latitude, lng: point.longitude }));
            map.fitBounds(bounds);
          }
          map.addListener("click", (event: any) => {
            if (!drawingRef.current || !event.latLng) return;
            polygon.getPath().push(event.latLng);
            emitPath(polygon);
          });
        } else {
          const bounds = new google.maps.LatLngBounds();
          plots
            .filter((plot) => plot.status !== "inactive")
            .forEach((plot) => {
              const polygon = new google.maps.Polygon({
                map,
                paths: plot.polygon.map((point) => ({
                  lat: point.latitude,
                  lng: point.longitude
                })),
                strokeColor: "#155d3b",
                strokeWeight: 3,
                fillColor: "#cbed71",
                fillOpacity: 0.32
              });
              const info = new google.maps.InfoWindow({
                content: `<strong>${plot.plantingAreaCode}</strong>`
              });
              polygon.addListener("click", (event: any) => {
                info.setPosition(event.latLng);
                info.open(map);
              });
              overlays.push(polygon);
              plot.polygon.forEach((point) =>
                bounds.extend({ lat: point.latitude, lng: point.longitude })
              );
            });
          if (plots.length) map.fitBounds(bounds);
        }
        setMessage("");
      })
      .catch((error: Error) => setMessage(error.message));

    return () => {
      disposed = true;
      overlays.forEach((overlay) => overlay.setMap(null));
      polygonRef.current = null;
    };
  }, [apiKey, editable, plotsSignature]);

  function clearPolygon() {
    polygonRef.current?.getPath().clear();
    onChange?.([]);
    onAreaChange?.(0);
  }

  if (!apiKey) {
    return (
      <div className="mapsMissing">
        <strong>Google Maps chưa được cấu hình</strong>
        <p>Thêm `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` vào `.env` rồi khởi động lại web.</p>
      </div>
    );
  }

  return (
    <div className="googleMapShell">
      <div className="mapToolbar">
        <input ref={searchElement} placeholder="Tìm xã, huyện hoặc địa chỉ…" />
        {editable && (
          <>
            <button
              className={`mapTool ${drawing ? "active" : ""}`}
              type="button"
              onClick={() => setDrawing((current) => !current)}
            >
              {drawing ? "Đang vẽ: bấm lên bản đồ" : "Vẽ polygon"}
            </button>
            <button className="mapTool danger" type="button" onClick={clearPolygon}>
              Xóa nét vẽ
            </button>
          </>
        )}
      </div>
      <div ref={mapElement} className="googleMap" />
      {message && <div className="mapMessage">{message}</div>}
    </div>
  );
}
