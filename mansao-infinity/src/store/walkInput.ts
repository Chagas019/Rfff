/**
 * Entrada analógica do modo caminhada vinda da interface (joystick virtual e
 * arraste para olhar no celular). Fica fora do React para não re-renderizar.
 */
export const walkInput = {
  moveX: 0,
  moveY: 0,
  lookDX: 0,
  lookDY: 0,
  run: false,
  interact: 0,
};

export function consumeLook() {
  const dx = walkInput.lookDX;
  const dy = walkInput.lookDY;
  walkInput.lookDX = 0;
  walkInput.lookDY = 0;
  return { dx, dy };
}
