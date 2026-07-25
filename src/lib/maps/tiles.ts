const TILE_SIZE = 256;

export interface TileCoord {
  x: number;
  y: number;
}

export interface MapViewport {
  zoom: number;
  tiles: TileCoord[];
  offsetX: number;
  offsetY: number;
  gridWidth: number;
  gridHeight: number;
}

/** Web mercator: lat/lng → tile indices at zoom level */
export function latLngToTile(lat: number, lng: number, zoom: number): TileCoord {
  const n = 2 ** zoom;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

/** World pixel coordinates at zoom level */
export function latLngToWorldPixel(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n * TILE_SIZE;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE_SIZE;
  return { x, y };
}

export function osmTileUrl(z: number, x: number, y: number) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

/**
 * Build a 3×3 tile grid centered on a point, with CSS offsets so the
 * coordinate sits in the middle of the viewport.
 */
export function buildMapViewport(
  lat: number,
  lng: number,
  viewportWidth: number,
  viewportHeight: number,
  zoom = 13
): MapViewport {
  const centerTile = latLngToTile(lat, lng, zoom);
  const world = latLngToWorldPixel(lat, lng, zoom);

  const gridCols = 3;
  const gridRows = 3;
  const gridWidth = gridCols * TILE_SIZE;
  const gridHeight = gridRows * TILE_SIZE;

  const gridOriginX = (centerTile.x - 1) * TILE_SIZE;
  const gridOriginY = (centerTile.y - 1) * TILE_SIZE;

  const pointX = world.x - gridOriginX;
  const pointY = world.y - gridOriginY;

  const offsetX = viewportWidth / 2 - pointX;
  const offsetY = viewportHeight / 2 - pointY;

  const tiles: TileCoord[] = [];
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      tiles.push({
        x: centerTile.x - 1 + col,
        y: centerTile.y - 1 + row,
      });
    }
  }

  return { zoom, tiles, offsetX, offsetY, gridWidth, gridHeight };
}
