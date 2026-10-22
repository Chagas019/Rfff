import type { ComponentType } from 'react';
import type { FurnitureItem, FurnitureType } from '../../data/furniture';
import { LEVEL_Y } from '../../data/plan';
import { roomById } from '../../data/plan';
import { Armchair, Bench, CinemaSeat, DiningChair, LoungeChair, OfficeChair, OutdoorChair, OutdoorSofa, Sofa, Stool, Sunbed, type PieceProps } from './seating';
import { CoffeeTable, Console, Desk, DiningTable, OutdoorTable, Sideboard, SideTable } from './tables';
import { Bookshelf, ClosetIsland, Dresser, Nightstand, Shelving, ToolCabinet, Wardrobe } from './storage';
import { Bathtub, Counter, Island, Shower, TallUnits, Toilet, Vanity } from './kitchenBath';
import { Bed, CinemaRiser, FloorLamp, OutdoorShower, Piano, Plant, Planter, Rug, Spa, Umbrella } from './living';
import { Bbq, BikeRack, Boiler, Washer } from './service';
import { Car } from './Car';
import { Place } from './primitives';

/** Tipo de móvel → componente procedural. */
export const FURNITURE_COMPONENTS: Record<FurnitureType, ComponentType<PieceProps>> = {
  sofa: Sofa,
  armchair: Armchair,
  loungeChair: LoungeChair,
  coffeeTable: CoffeeTable,
  sideTable: SideTable,
  rug: Rug,
  floorLamp: FloorLamp,
  piano: Piano,
  plant: Plant,
  console: Console,
  diningTable: DiningTable,
  diningChair: DiningChair,
  sideboard: Sideboard,
  island: Island,
  counter: Counter,
  tallUnits: TallUnits,
  stool: Stool,
  cinemaSeat: CinemaSeat,
  cinemaRiser: CinemaRiser,
  desk: Desk,
  officeChair: OfficeChair,
  bookshelf: Bookshelf,
  bed: Bed,
  nightstand: Nightstand,
  wardrobe: Wardrobe,
  closetIsland: ClosetIsland,
  dresser: Dresser,
  bathtub: Bathtub,
  shower: Shower,
  vanity: Vanity,
  toilet: Toilet,
  washer: Washer,
  shelving: Shelving,
  boiler: Boiler,
  toolCabinet: ToolCabinet,
  bikeRack: BikeRack,
  car: Car,
  bbq: Bbq,
  outdoorTable: OutdoorTable,
  outdoorChair: OutdoorChair,
  outdoorSofa: OutdoorSofa,
  sunbed: Sunbed,
  umbrella: Umbrella,
  outdoorShower: OutdoorShower,
  spa: Spa,
  planter: Planter,
  bench: Bench,
};

/** Desenha uma peça no lugar certo (piso do pavimento do cômodo + elevação própria). */
export function FurniturePiece({ item }: { item: FurnitureItem }) {
  const Comp = FURNITURE_COMPONENTS[item.type];
  const rm = roomById(item.room);
  const baseY = rm ? LEVEL_Y[rm.level] : 0;
  return (
    <Place x={item.x} z={item.z} y={baseY + (item.y ?? 0)} rot={item.rot ?? 0}>
      <Comp item={item} />
    </Place>
  );
}
