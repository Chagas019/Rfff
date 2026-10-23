// jsdom não tem canvas 2D: o app trata contexto nulo, então silenciamos o aviso do jsdom.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
