import { useMaterials, roomLedMaterial } from '../../materials/library';
import { B } from '../furniture/primitives';
import { Artwork, Curtain, Pendant, RoomFurniture, RoomGroup } from './common';

/** Suíte master: quarto, closet e banho, com cortinas na porta da varanda. */
export function MasterSuite() {
  return (
    <>
      <RoomGroup id="master">
        <RoomFurniture id="master" />
        <Artwork x={3.82} y={5.9} z={-3.0} w={1.2} h={1.5} rot={-Math.PI / 2} art={1} />
        <Curtain x={-3.2} z={-9.55} y={4.02} width={1.3} height={2.95} />
        <Curtain x={3.3} z={-9.55} y={4.02} width={1.3} height={2.95} />
      </RoomGroup>
      <RoomGroup id="masterCloset">
        <RoomFurniture id="masterCloset" />
        <Pendant room="masterCloset" x={-6.6} z={-2.3} ceilingY={7.0} drop={0.9} shape="disc" size={0.35} />
      </RoomGroup>
      <RoomGroup id="masterBath">
        <RoomFurniture id="masterBath" />
        <Pendant room="masterBath" x={-6.6} z={-9.0} ceilingY={7.0} drop={1.1} shape="globe" size={0.14} />
      </RoomGroup>
    </>
  );
}

/** Suítes 2 e 3 e quartos 4 e 5, cada um com sua paleta. */
export function Bedrooms() {
  return (
    <>
      <RoomGroup id="bed2">
        <RoomFurniture id="bed2" />
        <Artwork x={-23.82} y={5.7} z={-8.6} w={0.9} h={1.2} rot={Math.PI / 2} art={2} />
        <Curtain x={-22.9} z={-9.55} y={4.02} width={0.8} height={2.95} />
      </RoomGroup>
      <RoomGroup id="closet2">
        <RoomFurniture id="closet2" />
      </RoomGroup>
      <RoomGroup id="bed3">
        <RoomFurniture id="bed3" />
        <Artwork x={-10.1} y={5.8} z={-7.6} w={1.0} h={1.3} rot={-Math.PI / 2} art={0} />
        <Curtain x={-11.1} z={-9.55} y={4.02} width={0.8} height={2.95} />
      </RoomGroup>
      <RoomGroup id="closet3">
        <RoomFurniture id="closet3" />
      </RoomGroup>
      <RoomGroup id="bed4">
        <RoomFurniture id="bed4" />
        <Artwork x={-17.58} y={5.75} z={6.8} w={1.4} h={0.9} rot={-Math.PI / 2} art={1} />
      </RoomGroup>
      <RoomGroup id="bed5">
        <RoomFurniture id="bed5" />
        <Artwork x={-10.17} y={5.75} z={7.0} w={1.1} h={0.8} rot={-Math.PI / 2} art={2} />
      </RoomGroup>
      <RoomGroup id="corridor">
        <RoomFurniture id="corridor" />
        <Artwork x={-21} y={5.5} z={0.09} w={1.8} h={1.0} rot={0} art={0} />
      </RoomGroup>
    </>
  );
}

/** Banheiros (suítes, compartilhado e lavabo). O banho master fica em MasterSuite. */
export function Bathrooms() {
  return (
    <>
      {['bath2', 'bath3', 'bathShared', 'powder'].map((id) => (
        <RoomGroup key={id} id={id}>
          <RoomFurniture id={id} />
        </RoomGroup>
      ))}
    </>
  );
}

/** Garagem: quatro carros, armários, bicicletas, perfis de LED no teto e demarcação das vagas. */
export function Garage() {
  const m = useMaterials();
  const led = roomLedMaterial('garage');
  return (
    <RoomGroup id="garage">
      <RoomFurniture id="garage" />
      {[-20.3, -17.0, -13.8].map((x) => (
        <B key={x} s={[0.08, 0.004, 5.6]} p={[x, 0.003, 6.6]} m={m.lacquerWhite} shadow={false} />
      ))}
      {[-22.0, -18.6, -15.4, -12.1].map((x) => (
        <group key={x}>
          <B s={[0.06, 0.04, 5.0]} p={[x, 3.57, 6.0]} m={led} shadow={false} />
          <B s={[0.3, 0.12, 0.1]} p={[x, 0.6, 2.13]} m={m.lacquerWhite} />
          <B s={[0.12, 0.12, 0.25]} p={[x, 0.02, 3.0]} m={m.rubber} />
        </group>
      ))}
    </RoomGroup>
  );
}

/** Lavanderia, despensa, depósito/área técnica e hall de serviço. */
export function ServiceAreas() {
  const m = useMaterials();
  return (
    <>
      <RoomGroup id="laundry">
        <RoomFurniture id="laundry" />
        {/* varal de teto */}
        {[-21.5, -21.0, -20.5, -20.0].map((x) => (
          <B key={x} s={[0.02, 0.02, 3.5]} p={[x, 3.1, -0.5]} m={m.steel} shadow={false} />
        ))}
      </RoomGroup>
      <RoomGroup id="pantry">
        <RoomFurniture id="pantry" />
      </RoomGroup>
      <RoomGroup id="storage">
        <RoomFurniture id="storage" />
        {/* casa de máquinas da piscina: bomba e filtro */}
        <B s={[0.8, 0.5, 0.5]} p={[-19.4, 0.25, -9.4]} m={m.lacquerGraphite} />
        <B s={[0.45, 1.1, 0.45]} p={[-20.4, 0.55, -9.4]} m={m.aluminum} />
      </RoomGroup>
      <RoomGroup id="serviceHall">
        <RoomFurniture id="serviceHall" />
      </RoomGroup>
    </>
  );
}
