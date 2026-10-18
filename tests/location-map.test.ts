// @vitest-environment jsdom
import { Activity, StrictMode, createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import L from "leaflet";
import LocationMap from "../src/features/salon/components/location-map";
vi.mock("leaflet/dist/leaflet.css", () => ({}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("survives strict replay, coordinate updates and Activity restoration with real Leaflet", () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const onChange = vi.fn();
  const maps: L.Map[] = [];
  const createMap = L.map;
  vi.spyOn(L, "map").mockImplementation((...args: Parameters<typeof L.map>) => {
    const map = createMap(...args);
    maps.push(map);
    return map;
  });
  const tree = (mode: "visible" | "hidden", latitude = 19) => createElement(StrictMode, null,
    // Activity types require children in props for createElement overload resolution.
    // eslint-disable-next-line react/no-children-prop
    createElement(Activity, { mode, children: createElement(LocationMap, { latitude, longitude: 72, onChange }) }));
  const view = render(tree("visible"));
  expect(view.container.querySelectorAll(".leaflet-container")).toHaveLength(1);
  view.rerender(tree("visible", 20));
  expect(maps.at(-1)!.getCenter().lat).toBeCloseTo(20);
  maps.at(-1)!.fire("click", { latlng: L.latLng(21, 73) });
  expect(onChange).toHaveBeenLastCalledWith({ latitude: 21, longitude: 73 });
  const marker = Object.values((maps.at(-1)! as L.Map & { _layers: Record<string, L.Layer> })._layers).find((layer) => layer instanceof L.Marker) as L.Marker;
  marker.setLatLng([22, 74]);
  marker.fire("dragend");
  expect(onChange).toHaveBeenLastCalledWith({ latitude: 22, longitude: 74 });
  view.rerender(tree("hidden"));
  view.rerender(tree("visible"));
  expect(view.container.querySelectorAll(".leaflet-container")).toHaveLength(1);
  fireEvent.click(view.container);
  view.unmount();
  expect(view.container.querySelectorAll(".leaflet-container")).toHaveLength(0);
});
