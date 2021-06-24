import config from "./configuration";
import GameObject from "./gameObject";

export class Mouse extends GameObject {}

export const defaultMouse = {
  x: config.MOUSE_CONFIG.MOUSE_STARTING_X,
  y: config.MOUSE_CONFIG.MOUSE_STARTING_Y,
  width: config.MOUSE_CONFIG.MOUSE_WIDTH,
  height: config.MOUSE_CONFIG.MOUSE_HEIGHT,
};
